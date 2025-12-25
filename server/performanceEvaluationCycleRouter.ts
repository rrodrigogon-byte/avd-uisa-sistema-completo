import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  performanceEvaluationCycles, 
  performanceEvaluationParticipants,
  performanceEvaluationEvidences,
  performanceEvaluationApprovals,
  smartGoals,
  employees,
  departments
} from "../drizzle/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Ciclo de Avaliação de Desempenho
 * 
 * Fluxo completo:
 * 1. RH/Admin cria ciclo com metas corporativas
 * 2. Funcionário adere e adiciona metas individuais
 * 3. Gestor aprova ou rejeita metas
 * 4. Funcionário acompanha e adiciona evidências
 * 5. Avaliação final (autoavaliação + gestor)
 * 6. Aprovação geral (RH/Diretoria)
 */

export const performanceEvaluationCycleRouter = router({
  /**
   * 1. CRIAR CICLO (RH/Admin)
   */
  createCycle: protectedProcedure
    .input(z.object({
      name: z.string().min(3),
      description: z.string().optional(),
      year: z.number(),
      period: z.enum(["anual", "semestral", "trimestral"]),
      startDate: z.string(), // ISO date
      endDate: z.string(),
      adhesionDeadline: z.string(),
      managerApprovalDeadline: z.string(),
      trackingStartDate: z.string().optional(),
      trackingEndDate: z.string().optional(),
      evaluationDeadline: z.string().optional(),
      corporateGoalIds: z.array(z.number()), // IDs das metas corporativas
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se usuário é admin ou RH
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Admin ou RH podem criar ciclos" });
      }

      const [result] = await db.insert(performanceEvaluationCycles).values({
        name: input.name,
        description: input.description,
        year: input.year,
        period: input.period,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        adhesionDeadline: new Date(input.adhesionDeadline),
        managerApprovalDeadline: new Date(input.managerApprovalDeadline),
        trackingStartDate: input.trackingStartDate ? new Date(input.trackingStartDate) : undefined,
        trackingEndDate: input.trackingEndDate ? new Date(input.trackingEndDate) : undefined,
        evaluationDeadline: input.evaluationDeadline ? new Date(input.evaluationDeadline) : undefined,
        corporateGoalIds: JSON.stringify(input.corporateGoalIds),
        status: "planejado",
        createdBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  /**
   * 2. LISTAR CICLOS
   */
  listCycles: protectedProcedure
    .input(z.object({
      status: z.enum(["planejado", "aberto", "em_andamento", "em_avaliacao", "concluido", "cancelado"]).optional(),
      year: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(performanceEvaluationCycles);

      if (input.status) {
        query = query.where(eq(performanceEvaluationCycles.status, input.status)) as any;
      }

      if (input.year) {
        query = query.where(eq(performanceEvaluationCycles.year, input.year)) as any;
      }

      const cycles = await query.orderBy(desc(performanceEvaluationCycles.createdAt));
      
      return cycles.map(cycle => ({
        ...cycle,
        corporateGoalIds: cycle.corporateGoalIds ? JSON.parse(cycle.corporateGoalIds) : [],
      }));
    }),

  /**
   * 3. BUSCAR CICLO POR ID (com metas corporativas)
   */
  getCycleById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [cycle] = await db
        .select()
        .from(performanceEvaluationCycles)
        .where(eq(performanceEvaluationCycles.id, input.id))
        .limit(1);

      if (!cycle) return null;

      const corporateGoalIds = cycle.corporateGoalIds ? JSON.parse(cycle.corporateGoalIds) : [];
      
      // Buscar metas corporativas
      let corporateGoals: any[] = [];
      if (corporateGoalIds.length > 0) {
        corporateGoals = await db
          .select()
          .from(smartGoals)
          .where(inArray(smartGoals.id, corporateGoalIds));
      }

      return {
        ...cycle,
        corporateGoalIds,
        corporateGoals,
      };
    }),

  /**
   * 4. ADERIR AO CICLO (Funcionário)
   */
  adhereToCycle: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      individualGoals: z.array(z.object({
        title: z.string(),
        description: z.string(),
        deadline: z.string(),
        weight: z.number().min(0).max(100), // Peso da meta (%)
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar gestor do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Verificar se já aderiu
      const existing = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(
          and(
            eq(performanceEvaluationParticipants.cycleId, input.cycleId),
            eq(performanceEvaluationParticipants.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você já aderiu a este ciclo" });
      }

      const [result] = await db.insert(performanceEvaluationParticipants).values({
        cycleId: input.cycleId,
        employeeId: ctx.user.id,
        managerId: employee.managerId,
        individualGoals: JSON.stringify(input.individualGoals),
        status: "aguardando_aprovacao_gestor",
        adhesionDate: new Date(),
      });

      return { id: result.insertId, success: true };
    }),

  /**
   * 5. LISTAR PARTICIPANTES DO CICLO (para gestor/RH)
   */
  listParticipants: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      status: z.enum([
        "pendente_adesao",
        "aguardando_aprovacao_gestor",
        "metas_aprovadas",
        "em_acompanhamento",
        "aguardando_avaliacao",
        "avaliacao_concluida",
        "aprovado_rh"
      ]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      let participants; 
      // Se for gestor, filtrar apenas seus subordinados
      if (ctx.user.role === "gestor") {
        participants = await db
          .select({
            participant: performanceEvaluationParticipants,
            employee: employees,
            department: departments,
          })
          .from(performanceEvaluationParticipants)
          .leftJoin(employees, eq(performanceEvaluationParticipants.employeeId, employees.id))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .where(
            and(
              eq(performanceEvaluationParticipants.cycleId, input.cycleId),
              eq(performanceEvaluationParticipants.managerId, ctx.user.id),
              input.status ? eq(performanceEvaluationParticipants.status, input.status) : undefined
            )
          );
      } else {
        participants = await db
          .select({
            participant: performanceEvaluationParticipants,
            employee: employees,
            department: departments,
          })
          .from(performanceEvaluationParticipants)
          .leftJoin(employees, eq(performanceEvaluationParticipants.employeeId, employees.id))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .where(
            and(
              eq(performanceEvaluationParticipants.cycleId, input.cycleId),
              input.status ? eq(performanceEvaluationParticipants.status, input.status) : undefined
            )
          );
      }

      return participants.map((p: any) => ({
        ...p.participant,
        individualGoals: p.participant.individualGoals ? JSON.parse(p.participant.individualGoals) : [],
        employee: p.employee,
        department: p.department,
      }));
    }),

  /**
   * 6. APROVAR/REJEITAR METAS (Gestor)
   */
  approveGoals: protectedProcedure
    .input(z.object({
      participantId: z.number(),
      action: z.enum(["aprovado", "rejeitado", "solicitado_ajuste"]),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar participante
      const [participant] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(eq(performanceEvaluationParticipants.id, input.participantId))
        .limit(1);

      if (!participant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Participante não encontrado" });
      }

      // Verificar se é o gestor responsável
      if (participant.managerId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o gestor responsável" });
      }

      // Atualizar status
      const newStatus = input.action === "aprovado" ? "metas_aprovadas" : "aguardando_aprovacao_gestor";
      
      await db
        .update(performanceEvaluationParticipants)
        .set({
          status: newStatus,
          managerApprovalDate: input.action === "aprovado" ? new Date() : undefined,
          managerComments: input.comments,
          managerRejectionReason: input.action === "rejeitado" ? input.comments : undefined,
        })
        .where(eq(performanceEvaluationParticipants.id, input.participantId));

      // Registrar aprovação
      await db.insert(performanceEvaluationApprovals).values({
        participantId: input.participantId,
        approverType: "gestor",
        approverId: ctx.user.id,
        action: input.action,
        comments: input.comments,
      });

      return { success: true };
    }),

  /**
   * 7. ADICIONAR EVIDÊNCIA (Funcionário)
   */
  addEvidence: protectedProcedure
    .input(z.object({
      participantId: z.number(),
      goalType: z.enum(["corporativa", "individual"]),
      goalIndex: z.number(),
      title: z.string(),
      description: z.string().optional(),
      evidenceType: z.enum(["documento", "link", "imagem", "video", "texto"]),
      fileUrl: z.string().optional(),
      linkUrl: z.string().optional(),
      progressPercentage: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(performanceEvaluationEvidences).values({
        participantId: input.participantId,
        goalType: input.goalType,
        goalIndex: input.goalIndex,
        title: input.title,
        description: input.description,
        evidenceType: input.evidenceType,
        fileUrl: input.fileUrl,
        linkUrl: input.linkUrl,
        progressPercentage: input.progressPercentage || 0,
        uploadedBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  /**
   * 8. LISTAR EVIDÊNCIAS
   */
  listEvidences: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const evidences = await db
        .select()
        .from(performanceEvaluationEvidences)
        .where(eq(performanceEvaluationEvidences.participantId, input.participantId))
        .orderBy(desc(performanceEvaluationEvidences.uploadedAt));

      return evidences;
    }),

  /**
   * 9. SUBMETER AVALIAÇÃO FINAL (Funcionário + Gestor)
   */
  submitEvaluation: protectedProcedure
    .input(z.object({
      participantId: z.number(),
      evaluationType: z.enum(["self", "manager"]),
      score: z.number().min(1).max(5),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {
        evaluationDate: new Date(),
      };

      if (input.evaluationType === "self") {
        updateData.selfEvaluationScore = input.score;
      } else {
        updateData.managerEvaluationScore = input.score;
      }

      // Verificar se ambas as avaliações foram feitas para calcular score final
      const [participant] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(eq(performanceEvaluationParticipants.id, input.participantId))
        .limit(1);

      if (participant) {
        const selfScore = input.evaluationType === "self" ? input.score : participant.selfEvaluationScore;
        const managerScore = input.evaluationType === "manager" ? input.score : participant.managerEvaluationScore;

        if (selfScore && managerScore) {
          updateData.finalScore = Math.round((selfScore + managerScore) / 2);
          updateData.status = "avaliacao_concluida";
        }
      }

      await db
        .update(performanceEvaluationParticipants)
        .set(updateData)
        .where(eq(performanceEvaluationParticipants.id, input.participantId));

      return { success: true };
    }),

  /**
   * 10. APROVAÇÃO GERAL (RH/Diretoria)
   */
  finalApproval: protectedProcedure
    .input(z.object({
      participantId: z.number(),
      action: z.enum(["aprovado", "rejeitado"]),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se é RH ou Admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Admin ou RH podem fazer aprovação geral" });
      }

      await db
        .update(performanceEvaluationParticipants)
        .set({
          status: input.action === "aprovado" ? "aprovado_rh" : "avaliacao_concluida",
          finalApprovalDate: input.action === "aprovado" ? new Date() : undefined,
        })
        .where(eq(performanceEvaluationParticipants.id, input.participantId));

      // Registrar aprovação
      await db.insert(performanceEvaluationApprovals).values({
        participantId: input.participantId,
        approverType: "rh",
        approverId: ctx.user.id,
        action: input.action,
        comments: input.comments,
      });

      return { success: true };
    }),

  /**
   * 11. ATUALIZAR STATUS DO CICLO
   */
  updateCycleStatus: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      status: z.enum(["planejado", "aberto", "em_andamento", "em_avaliacao", "concluido", "cancelado"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se é admin ou RH
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Admin ou RH podem atualizar status do ciclo" });
      }

      await db
        .update(performanceEvaluationCycles)
        .set({ status: input.status })
        .where(eq(performanceEvaluationCycles.id, input.cycleId));

      return { success: true };
    }),

  listByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const evaluations = await db
        .select()
        .from(performanceEvaluationCycles)
        .orderBy(desc(performanceEvaluationCycles.createdAt));

      return evaluations.map(evaluation => ({
        id: evaluation.id,
        cycle: evaluation,
        status: evaluation.status,
        selfScore: null,
      }));
    }),

  /**
   * Obter participação do usuário logado em um ciclo
   */
  getParticipation: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [participation] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(
          and(
            eq(performanceEvaluationParticipants.cycleId, input.cycleId),
            eq(performanceEvaluationParticipants.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (!participation) return null;

      return {
        ...participation,
        individualGoals: participation.individualGoals ? JSON.parse(participation.individualGoals) : [],
      };
    }),

  /**
   * Obter evidências do usuário logado em um ciclo
   */
  getEvidences: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar participação do usuário no ciclo
      const [participation] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(
          and(
            eq(performanceEvaluationParticipants.cycleId, input.cycleId),
            eq(performanceEvaluationParticipants.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (!participation) return [];

      const evidences = await db
        .select()
        .from(performanceEvaluationEvidences)
        .where(eq(performanceEvaluationEvidences.participantId, participation.id))
        .orderBy(desc(performanceEvaluationEvidences.createdAt));

      return evidences;
    }),

  /**
   * Submeter evidência
   */
  submitEvidence: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      goalId: z.number(),
      description: z.string(),
      attachmentUrl: z.string().optional(),
      currentValueCents: z.number().optional(), // Valor em centavos
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar participação do usuário no ciclo
      const [participation] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(
          and(
            eq(performanceEvaluationParticipants.cycleId, input.cycleId),
            eq(performanceEvaluationParticipants.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (!participation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Participação não encontrada" });
      }

      await db.insert(performanceEvaluationEvidences).values({
        participantId: participation.id,
        goalType: "individual",
        goalIndex: input.goalId,
        title: input.description.substring(0, 255),
        description: input.description,
        evidenceType: input.attachmentUrl ? "link" : "texto",
        linkUrl: input.attachmentUrl,
        currentValueCents: input.currentValueCents,
        uploadedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Aderir ao ciclo (alias para adhereToCycle)
   */
  joinCycle: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      individualGoals: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        targetValueCents: z.number(), // Valor em centavos
        weight: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Verificar se já aderiu
      const [existing] = await db
        .select()
        .from(performanceEvaluationParticipants)
        .where(
          and(
            eq(performanceEvaluationParticipants.cycleId, input.cycleId),
            eq(performanceEvaluationParticipants.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você já aderiu a este ciclo" });
      }

      await db.insert(performanceEvaluationParticipants).values({
        cycleId: input.cycleId,
        employeeId: ctx.user.id,
        managerId: employee.managerId || null,
        individualGoals: JSON.stringify(input.individualGoals),
        status: "aguardando_aprovacao_gestor",
      });

      return { success: true };
    }),
});
