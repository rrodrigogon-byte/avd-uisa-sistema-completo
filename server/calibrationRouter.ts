import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { generateCalibrationPDF, generateConsolidatedCalibrationPDF } from "./utils/calibrationPDF";
import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { canDoConsensus, canViewEmployee, isAdmin } from "./utils/permissions";

/**
 * Router de Calibração de Diretoria
 * Movimentação de colaboradores no Nine Box com workflow de aprovação
 */
export const calibrationRouter = router({
  /**
   * Criar movimentação de colaborador no Nine Box
   */
  createMovement: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        fromPerformance: z.enum(["baixo", "médio", "alto"]).optional(),
        fromPotential: z.enum(["baixo", "médio", "alto"]).optional(),
        toPerformance: z.enum(["baixo", "médio", "alto"]),
        toPotential: z.enum(["baixo", "médio", "alto"]),
        justification: z.string().min(10, "Justificativa deve ter no mínimo 10 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar permissão: apenas admin ou líder direto pode criar movimentação
      const hasPermission = await canDoConsensus(ctx.user.id, input.employeeId);
      if (!hasPermission) {
        throw new Error("Você não tem permissão para movimentar este colaborador");
      }

      const { calibrationMovements, calibrationApprovals } = await import("../drizzle/schema");

      // Criar movimentação
      const [movement] = await db.insert(calibrationMovements).values({
        employeeId: input.employeeId,
        movedBy: ctx.user.id,
        fromPerformance: input.fromPerformance,
        fromPotential: input.fromPotential,
        toPerformance: input.toPerformance,
        toPotential: input.toPotential,
        justification: input.justification,
        status: "pending",
      });

      const movementId = movement.insertId;

      // Criar aprovações do workflow (RH → Diretor de Gente → Diretor de Área)
      await db.insert(calibrationApprovals).values([
        {
          movementId: movementId,
          approverId: ctx.user.id, // Auto-aprovação do RH
          approverRole: "hr",
          status: "approved",
          approvedAt: new Date(),
        },
        {
          movementId: movementId,
          approverId: 0, // Será definido dinamicamente
          approverRole: "people_director",
          status: "pending",
        },
        {
          movementId: movementId,
          approverId: 0, // Será definido dinamicamente
          approverRole: "area_director",
          status: "pending",
        },
      ]);

      return { success: true, movementId };
    }),

  /**
   * Listar movimentações pendentes de aprovação
   */
  listPendingMovements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { calibrationMovements, calibrationApprovals, employees } = await import(
      "../drizzle/schema"
    );

    // Buscar movimentações com aprovações pendentes
    const movements = await db
      .select()
      .from(calibrationMovements)
      .leftJoin(employees, eq(calibrationMovements.employeeId, employees.id))
      .leftJoin(calibrationApprovals, eq(calibrationMovements.id, calibrationApprovals.movementId))
      .where(eq(calibrationApprovals.status, "pending"))
      .orderBy(desc(calibrationMovements.createdAt));

    return movements;
  }),

  /**
   * Aprovar movimentação
   */
  approveMovement: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        evidence: z.string().optional(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { calibrationApprovals, calibrationMovements } = await import("../drizzle/schema");

      // Buscar aprovação
      const [approval] = await db
        .select()
        .from(calibrationApprovals)
        .where(eq(calibrationApprovals.id, input.approvalId))
        .limit(1);

      if (!approval) throw new Error("Aprovação não encontrada");

      // Verificar se é Diretor de Área e exigir evidências
      if (approval.approverRole === "area_director" && !input.evidence) {
        throw new Error("Evidências são obrigatórias para Diretor de Área");
      }

      // Atualizar aprovação
      await db
        .update(calibrationApprovals)
        .set({
          status: "approved",
          evidence: input.evidence,
          comments: input.comments,
          approvedAt: new Date(),
          approverId: ctx.user.id,
        })
        .where(eq(calibrationApprovals.id, input.approvalId));

      // Verificar se todas as aprovações foram concluídas
      const allApprovals = await db
        .select()
        .from(calibrationApprovals)
        .where(eq(calibrationApprovals.movementId, approval.movementId));

      const allApproved = allApprovals.every((a) => a.status === "approved");

      if (allApproved) {
        // Atualizar status da movimentação para aprovado
        await db
          .update(calibrationMovements)
          .set({ status: "approved_area_director" })
          .where(eq(calibrationMovements.id, approval.movementId));

        // Atualizar posição do colaborador no Nine Box
        const [movement] = await db
          .select()
          .from(calibrationMovements)
          .where(eq(calibrationMovements.id, approval.movementId))
          .limit(1);

        if (movement) {
          const { nineBoxPositions, evaluationCycles } = await import("../drizzle/schema");
          
          // Buscar ciclo ativo
          const [activeCycle] = await db
            .select()
            .from(evaluationCycles)
            .where(eq(evaluationCycles.status, "em_andamento"))
            .limit(1);

          if (!activeCycle) {
            console.warn("Nenhum ciclo ativo encontrado para atualizar Nine Box");
            return { success: true, allApproved };
          }

          // Converter enum para número (baixo=1, médio=2, alto=3)
          const performanceMap: Record<string, number> = { baixo: 1, médio: 2, alto: 3 };
          const performanceNum = performanceMap[movement.toPerformance];
          const potentialNum = performanceMap[movement.toPotential];

          // Calcular box
          const box = `${movement.toPerformance}_desempenho_${movement.toPotential}_potencial`;
          
          // Atualizar ou criar posição no Nine Box
          const [existingPosition] = await db
            .select()
            .from(nineBoxPositions)
            .where(
              and(
                eq(nineBoxPositions.employeeId, movement.employeeId),
                eq(nineBoxPositions.cycleId, activeCycle.id)
              )
            )
            .limit(1);

          if (existingPosition) {
            await db
              .update(nineBoxPositions)
              .set({
                performance: performanceNum,
                potential: potentialNum,
                box,
                calibrated: true,
                calibratedBy: ctx.user.id,
                calibratedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(nineBoxPositions.id, existingPosition.id));
          } else {
            await db.insert(nineBoxPositions).values({
              cycleId: activeCycle.id,
              employeeId: movement.employeeId,
              performance: performanceNum,
              potential: potentialNum,
              box,
              calibrated: true,
              calibratedBy: ctx.user.id,
              calibratedAt: new Date(),
            });
          }
        }
      }

      return { success: true, allApproved };
    }),

  /**
   * Rejeitar movimentação
   */
  rejectMovement: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        comments: z.string().min(10, "Comentário obrigatório ao rejeitar"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { calibrationApprovals, calibrationMovements } = await import("../drizzle/schema");

      // Buscar aprovação
      const [approval] = await db
        .select()
        .from(calibrationApprovals)
        .where(eq(calibrationApprovals.id, input.approvalId))
        .limit(1);

      if (!approval) throw new Error("Aprovação não encontrada");

      // Atualizar aprovação
      await db
        .update(calibrationApprovals)
        .set({
          status: "rejected",
          comments: input.comments,
          approvedAt: new Date(),
          approverId: ctx.user.id,
        })
        .where(eq(calibrationApprovals.id, input.approvalId));

      // Atualizar status da movimentação para rejeitado
      await db
        .update(calibrationMovements)
        .set({ status: "rejected" })
        .where(eq(calibrationMovements.id, approval.movementId));

      return { success: true };
    }),

  /**
   * Listar histórico de movimentações de um colaborador
   */
  getEmployeeMovementHistory: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { calibrationMovements, calibrationApprovals, users } = await import(
        "../drizzle/schema"
      );

      const movements = await db
        .select()
        .from(calibrationMovements)
        .leftJoin(users, eq(calibrationMovements.movedBy, users.id))
        .where(eq(calibrationMovements.employeeId, input.employeeId))
        .orderBy(desc(calibrationMovements.createdAt));

      // Buscar aprovações de cada movimentação
      const movementsWithApprovals = await Promise.all(
        movements.map(async (movement) => {
          const approvals = await db
            .select()
            .from(calibrationApprovals)
            .where(eq(calibrationApprovals.movementId, movement.calibrationMovements.id));

          return {
            ...movement,
            approvals,
          };
        })
      );

      return movementsWithApprovals;
    }),

  /**
   * Obter estatísticas de calibração
   */
  getCalibrationStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { calibrationMovements } = await import("../drizzle/schema");

    const allMovements = await db.select().from(calibrationMovements);

    const stats = {
      total: allMovements.length,
      pending: allMovements.filter((m) => m.status === "pending").length,
      approved: allMovements.filter((m) => m.status === "approved_area_director").length,
      rejected: allMovements.filter((m) => m.status === "rejected").length,
    };

    return stats;
  }),

  /**
   * Exportar PDF de calibração individual
   */
  exportPDF: protectedProcedure
    .input(z.object({ movementId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { calibrationMovements, calibrationApprovals, employees, departments, positions } =
        await import("../drizzle/schema");

      // Buscar movimentação
      const [movement] = await db
        .select()
        .from(calibrationMovements)
        .where(eq(calibrationMovements.id, input.movementId))
        .limit(1);

      if (!movement) throw new Error("Movimentação não encontrada");

      // Buscar colaborador
      const [employee] = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.id, movement.employeeId))
        .limit(1);

      if (!employee) throw new Error("Colaborador não encontrado");

      // Buscar aprovações
      const approvals = await db
        .select({
          approval: calibrationApprovals,
          approver: employees,
        })
        .from(calibrationApprovals)
        .leftJoin(employees, eq(calibrationApprovals.approverId, employees.id))
        .where(eq(calibrationApprovals.movementId, input.movementId));

      // Preparar dados
      const data = {
        employee: {
          name: employee.employee.name,
          employeeCode: employee.employee.employeeCode,
          department: employee.department?.name || "N/A",
          position: employee.position?.title || "N/A",
        },
        movement: {
          fromPerformance: movement.fromPerformance || "baixo",
          fromPotential: movement.fromPotential || "baixo",
          toPerformance: movement.toPerformance,
          toPotential: movement.toPotential,
          justification: movement.justification,
          createdAt: movement.createdAt,
        },
        approvals: approvals.map((a) => ({
          approverName: a.approver?.name || "N/A",
          approverRole: a.approval.approverRole,
          status: a.approval.status,
          evidence: a.approval.evidence || undefined,
          comments: a.approval.comments || undefined,
          approvedAt: a.approval.approvedAt || undefined,
        })),
      };

      // Gerar PDF
      const pdfBuffer = await generateCalibrationPDF(data);

      return {
        success: true,
        pdf: pdfBuffer.toString("base64"),
        filename: `calibracao_${employee.employee.employeeCode}_${Date.now()}.pdf`,
      };
    }),
});
