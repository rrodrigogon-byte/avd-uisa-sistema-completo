import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { advancedReportExports, employeeMovements, employees, departments, positions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { storagePut } from "../storage";

/**
 * Router para exportação avançada de relatórios com gráficos
 */
export const reportExportRouter = router({
  /**
   * Criar nova exportação de relatório
   */
  create: protectedProcedure
    .input(
      z.object({
        reportType: z.enum([
          "movimentacoes",
          "desempenho",
          "hierarquia",
          "competencias",
          "pdi",
          "avaliacoes",
          "metas",
          "bonus",
          "customizado",
        ]),
        format: z.enum(["excel", "pdf"]),
        filters: z.any().optional(),
        chartConfig: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar registro de exportação
      const [exportRecord] = await db.insert(advancedReportExports).values({
        reportType: input.reportType,
        format: input.format,
        filters: input.filters,
        chartConfig: input.chartConfig,
        status: "processando",
        userId: ctx.user.id,
      });

      const exportId = exportRecord.insertId;

      try {
        let fileUrl: string | undefined;

        if (input.format === "excel") {
          fileUrl = await generateExcelReport(input.reportType, input.filters, input.chartConfig);
        } else {
          fileUrl = await generatePDFReport(input.reportType, input.filters, input.chartConfig);
        }

        // Atualizar registro com sucesso
        await db
          .update(advancedReportExports)
          .set({
            status: "concluido",
            fileUrl,
            completedAt: new Date(),
          })
          .where(eq(advancedReportExports.id, exportId));

        return {
          success: true,
          exportId,
          fileUrl,
        };
      } catch (error: any) {
        // Atualizar registro com erro
        await db
          .update(advancedReportExports)
          .set({
            status: "erro",
            errorMessage: error.message,
            completedAt: new Date(),
          })
          .where(eq(advancedReportExports.id, exportId));

        throw error;
      }
    }),

  /**
   * Listar histórico de exportações do usuário
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const exports = await db
        .select()
        .from(advancedReportExports)
        .where(eq(advancedReportExports.userId, ctx.user.id))
        .orderBy(desc(advancedReportExports.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return exports;
    }),

  /**
   * Obter detalhes de uma exportação
   */
  getById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [exportRecord] = await db
      .select()
      .from(advancedReportExports)
      .where(and(eq(advancedReportExports.id, input), eq(advancedReportExports.userId, ctx.user.id)))
      .limit(1);

    return exportRecord;
  }),

  /**
   * Obter dados de movimentações para exportação
   */
  getMovementData: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        departmentId: z.number().optional(),
        movementType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          id: employeeMovements.id,
          employeeName: employees.name,
          employeeCode: employees.chapa,
          movementType: employeeMovements.movementType,
          previousDepartment: sql`prev_dept.name`,
          newDepartment: sql`new_dept.name`,
          previousPosition: sql`prev_pos.name`,
          newPosition: sql`new_pos.name`,
          effectiveDate: employeeMovements.effectiveDate,
          reason: employeeMovements.reason,
          status: employeeMovements.status,
        })
        .from(employeeMovements)
        .leftJoin(employees, eq(employeeMovements.employeeId, employees.id))
        .leftJoin(
          sql`departments AS prev_dept`,
          sql`${employeeMovements.previousDepartmentId} = prev_dept.id`
        )
        .leftJoin(sql`departments AS new_dept`, sql`${employeeMovements.newDepartmentId} = new_dept.id`)
        .leftJoin(
          sql`positions AS prev_pos`,
          sql`${employeeMovements.previousPositionId} = prev_pos.id`
        )
        .leftJoin(sql`positions AS new_pos`, sql`${employeeMovements.newPositionId} = new_pos.id`);

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(employeeMovements.effectiveDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeMovements.effectiveDate, new Date(input.endDate)));
      }

      if (input.departmentId) {
        conditions.push(
          sql`(${employeeMovements.previousDepartmentId} = ${input.departmentId} OR ${employeeMovements.newDepartmentId} = ${input.departmentId})`
        );
      }

      if (input.movementType) {
        conditions.push(eq(employeeMovements.movementType, input.movementType as any));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const movements = await query.orderBy(desc(employeeMovements.effectiveDate));

      // Calcular estatísticas para gráficos
      const stats = {
        totalMovements: movements.length,
        byType: {} as Record<string, number>,
        byMonth: {} as Record<string, number>,
        byDepartment: {} as Record<string, number>,
      };

      movements.forEach((mov: any) => {
        // Por tipo
        stats.byType[mov.movementType] = (stats.byType[mov.movementType] || 0) + 1;

        // Por mês
        const month = new Date(mov.effectiveDate).toISOString().slice(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

        // Por departamento
        if (mov.newDepartment) {
          stats.byDepartment[mov.newDepartment] = (stats.byDepartment[mov.newDepartment] || 0) + 1;
        }
      });

      return {
        movements,
        stats,
      };
    }),
});

/**
 * Gerar relatório em Excel com gráficos
 */
async function generateExcelReport(
  reportType: string,
  filters: any,
  chartConfig: any
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Relatório");

  // Configurar colunas baseado no tipo de relatório
  if (reportType === "movimentacoes") {
    worksheet.columns = [
      { header: "Funcionário", key: "employeeName", width: 30 },
      { header: "Chapa", key: "employeeCode", width: 15 },
      { header: "Tipo", key: "movementType", width: 20 },
      { header: "Depto Anterior", key: "previousDepartment", width: 25 },
      { header: "Novo Depto", key: "newDepartment", width: 25 },
      { header: "Cargo Anterior", key: "previousPosition", width: 25 },
      { header: "Novo Cargo", key: "newPosition", width: 25 },
      { header: "Data Efetiva", key: "effectiveDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Buscar dados
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const movements = await db
      .select({
        employeeName: employees.name,
        employeeCode: employees.chapa,
        movementType: employeeMovements.movementType,
        effectiveDate: employeeMovements.effectiveDate,
        status: employeeMovements.status,
      })
      .from(employeeMovements)
      .leftJoin(employees, eq(employeeMovements.employeeId, employees.id))
      .orderBy(desc(employeeMovements.effectiveDate))
      .limit(1000);

    // Adicionar dados
    movements.forEach((mov) => {
      worksheet.addRow(mov);
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
  }

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Upload para S3
  const fileName = `relatorio-${reportType}-${Date.now()}.xlsx`;
  const { url } = await storagePut(`reports/${fileName}`, buffer as any, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return url;
}

/**
 * Gerar relatório em PDF com gráficos
 */
async function generatePDFReport(
  reportType: string,
  filters: any,
  chartConfig: any
): Promise<string> {
  // TODO: Implementar geração de PDF
  throw new Error("PDF generation not implemented yet");
}
