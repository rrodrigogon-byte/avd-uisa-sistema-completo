import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, departments, positions, employeeHistory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Schema de validação para dados de funcionário importado
 */
const employeeImportSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().nullable(),
  cpf: z.string().optional().nullable(),
  employeeCode: z.string().min(1, "Código do funcionário é obrigatório"),
  departmentName: z.string().optional().nullable(),
  positionName: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

type EmployeeImportData = z.infer<typeof employeeImportSchema>;

interface ImportResult {
  success: boolean;
  employeeCode: string;
  name: string;
  error?: string;
}

/**
 * Router para importação em lote de funcionários via CSV/Excel
 */
export const employeeBulkImportRouter = router({
  /**
   * Validar dados de importação antes de processar
   */
  validateImport: protectedProcedure
    .input(z.object({ employees: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const results: Array<{
        index: number;
        valid: boolean;
        errors: string[];
        data: any;
      }> = [];

      for (let i = 0; i < input.employees.length; i++) {
        const emp = input.employees[i];
        const errors: string[] = [];

        try {
          // Validar schema
          employeeImportSchema.parse(emp);

          // Validações adicionais
          if (emp.cpf) {
            const cpfClean = emp.cpf.replace(/[^\d]/g, "");
            if (cpfClean.length !== 11) {
              errors.push("CPF deve ter 11 dígitos");
            }
          }

          if (emp.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emp.email)) {
              errors.push("Email inválido");
            }
          }

          results.push({
            index: i,
            valid: errors.length === 0,
            errors,
            data: emp,
          });
        } catch (error: any) {
          const zodErrors = error.errors?.map((e: any) => e.message) || [
            "Erro de validação",
          ];
          results.push({
            index: i,
            valid: false,
            errors: zodErrors,
            data: emp,
          });
        }
      }

      return {
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
        results,
      };
    }),

  /**
   * Importar funcionários em lote
   */
  bulkImport: protectedProcedure
    .input(z.object({ employees: z.array(employeeImportSchema) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results: ImportResult[] = [];
      const errors: string[] = [];

      // Cache de departamentos e cargos
      const departmentCache = new Map<string, number>();
      const positionCache = new Map<string, number>();

      // Buscar todos os departamentos e cargos
      const allDepartments = await db.select().from(departments);
      const allPositions = await db.select().from(positions);

      allDepartments.forEach((dept) => {
        if (dept.name) departmentCache.set(dept.name.toLowerCase(), dept.id);
      });

      allPositions.forEach((pos) => {
        if (pos.name) positionCache.set(pos.name.toLowerCase(), pos.id);
      });

      for (const empData of input.employees) {
        try {
          // Verificar se funcionário já existe pelo código
          const existing = await db
            .select()
            .from(employees)
            .where(eq(employees.employeeCode, empData.employeeCode))
            .limit(1);

          if (existing.length > 0) {
            results.push({
              success: false,
              employeeCode: empData.employeeCode,
              name: empData.name,
              error: "Funcionário já existe com este código",
            });
            continue;
          }

          // Verificar CPF duplicado
          if (empData.cpf) {
            const cpfClean = empData.cpf.replace(/[^\d]/g, "");
            const existingCpf = await db
              .select()
              .from(employees)
              .where(eq(employees.cpf, cpfClean))
              .limit(1);

            if (existingCpf.length > 0) {
              results.push({
                success: false,
                employeeCode: empData.employeeCode,
                name: empData.name,
                error: "CPF já cadastrado",
              });
              continue;
            }
          }

          // Buscar IDs de departamento e cargo
          let departmentId: number | null = null;
          let positionId: number | null = null;

          if (empData.departmentName) {
            departmentId =
              departmentCache.get(empData.departmentName.toLowerCase()) || null;
          }

          if (empData.positionName) {
            positionId =
              positionCache.get(empData.positionName.toLowerCase()) || null;
          }

          // Inserir funcionário
          const [result] = await db.insert(employees).values({
            name: empData.name,
            email: empData.email || null,
            cpf: empData.cpf ? empData.cpf.replace(/[^\d]/g, "") : null,
            employeeCode: empData.employeeCode,
            departmentId,
            positionId,
            hireDate: empData.hireDate ? new Date(empData.hireDate) : null,
            birthDate: empData.birthDate ? new Date(empData.birthDate) : null,
            telefone: empData.phone || null,
            active: empData.active,
          });

          // Registrar no histórico
          await db.insert(employeeHistory).values({
            employeeId: result.insertId,
            changeType: "contratacao",
            fieldName: "importacao",
            newValue: JSON.stringify({
              source: "bulk_import",
              importedAt: new Date().toISOString(),
            }),
            reason: "Importação em lote",
            changedBy: ctx.user.id,
          });

          results.push({
            success: true,
            employeeCode: empData.employeeCode,
            name: empData.name,
          });
        } catch (error: any) {
          results.push({
            success: false,
            employeeCode: empData.employeeCode,
            name: empData.name,
            error: error.message || "Erro ao importar",
          });
        }
      }

      return {
        total: input.employees.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  /**
   * Obter template CSV para importação
   */
  getImportTemplate: protectedProcedure.input(z.object({}).optional()).query(() => {
    return {
      headers: [
        "name",
        "email",
        "cpf",
        "employeeCode",
        "departmentName",
        "positionName",
        "hireDate",
        "birthDate",
        "phone",
        "active",
      ],
      example: {
        name: "João Silva",
        email: "joao.silva@empresa.com",
        cpf: "123.456.789-00",
        employeeCode: "EMP001",
        departmentName: "TI",
        positionName: "Desenvolvedor",
        hireDate: "2024-01-15",
        birthDate: "1990-05-20",
        phone: "(11) 98765-4321",
        active: "true",
      },
    };
  }),

  /**
   * Obter lista de departamentos e cargos disponíveis
   */
  getAvailableOptions: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return { departments: [], positions: [] };

    const depts = await db.select({ id: departments.id, name: departments.name }).from(departments);
    const pos = await db.select({ id: positions.id, name: positions.name }).from(positions);

    return {
      departments: depts.filter((d) => d.name).map((d) => d.name!),
      positions: pos.filter((p) => p.name).map((p) => p.name!),
    };
  }),
});
