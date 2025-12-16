import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  pdiPlans, 
  pdiKpis, 
  pdiRemunerationStrategy, 
  pdiRemunerationMovements,
  pdiActionPlan702010,
  pdiResponsibilities,
  pdiSignatures,
  pdiTimeline,
  pdiIntelligentDetails,
  pdiCompetencyGaps,
  employees
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router de PDI (Plano de Desenvolvimento Individual)
 * Gerencia PDIs completos com todos os campos dos modelos Wilson/Fernando
 */
export const pdiRouter = router({
  /**
   * Listar todos os PDIs
   */
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db.select({
        id: pdiPlans.id,
        employeeId: pdiPlans.employeeId,
        employeeName: employees.name,
        employeePosition: employees.cargo,
        status: pdiPlans.status,
        startDate: pdiPlans.startDate,
        endDate: pdiPlans.endDate,
        overallProgress: pdiPlans.overallProgress,
        createdAt: pdiPlans.createdAt,
      })
      .from(pdiPlans)
      .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
      .orderBy(desc(pdiPlans.createdAt))
      .$dynamic();

      if (input.employeeId) {
        query = query.where(eq(pdiPlans.employeeId, input.employeeId));
      }
      if (input.status) {
        query = query.where(eq(pdiPlans.status, input.status));
      }

      const plans = await query;
      return plans;
    }),

  /**
   * Buscar PDI por ID com todos os dados relacionados
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar plano principal
      const [plan] = await db.select()
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(eq(pdiPlans.id, input.id));

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
      }

      // Buscar KPIs
      const [kpis] = await db.select().from(pdiKpis).where(eq(pdiKpis.planId, input.id));

      // Buscar estratégia de remuneração e movimentos
      const [remunerationStrategy] = await db.select()
        .from(pdiRemunerationStrategy)
        .where(eq(pdiRemunerationStrategy.planId, input.id));

      let remunerationMovements: any[] = [];
      if (remunerationStrategy) {
        remunerationMovements = await db.select()
          .from(pdiRemunerationMovements)
          .where(eq(pdiRemunerationMovements.strategyId, remunerationStrategy.id))
          .orderBy(pdiRemunerationMovements.orderIndex);
      }

      // Buscar plano de ação 70-20-10
      const [actionPlan] = await db.select()
        .from(pdiActionPlan702010)
        .where(eq(pdiActionPlan702010.planId, input.id));

      // Buscar responsabilidades
      const [responsibilities] = await db.select()
        .from(pdiResponsibilities)
        .where(eq(pdiResponsibilities.planId, input.id));

      // Buscar assinaturas
      const [signatures] = await db.select()
        .from(pdiSignatures)
        .where(eq(pdiSignatures.planId, input.id));

      // Buscar timeline
      const timeline = await db.select()
        .from(pdiTimeline)
        .where(eq(pdiTimeline.planId, input.id))
        .orderBy(pdiTimeline.orderIndex);

      // Buscar detalhes inteligentes (se existir)
      const [intelligentDetails] = await db.select()
        .from(pdiIntelligentDetails)
        .where(eq(pdiIntelligentDetails.planId, input.id));

      // Buscar gaps de competências
      const competencyGaps = await db.select()
        .from(pdiCompetencyGaps)
        .where(eq(pdiCompetencyGaps.planId, input.id));

      return {
        plan: plan.pdiPlans,
        employee: plan.employees,
        kpis,
        remunerationStrategy,
        remunerationMovements,
        actionPlan,
        responsibilities,
        signatures,
        timeline,
        intelligentDetails,
        competencyGaps,
      };
    }),

  /**
   * Criar novo PDI completo
   */
  create: protectedProcedure
    .input(z.object({
      // Dados do plano principal
      employeeId: z.number(),
      cycleId: z.number(),
      targetPositionId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      
      // KPIs
      kpis: z.object({
        currentPosition: z.string().optional(),
        reframing: z.string().optional(),
        newPosition: z.string().optional(),
        performancePlanMonths: z.number().optional(),
        technicalExcellence: z.string().optional(),
        leadership: z.string().optional(),
        immediateIncentive: z.string().optional(),
      }).optional(),

      // Estratégia de Remuneração
      remunerationStrategy: z.object({
        title: z.string(),
        description: z.string().optional(),
        midpoint: z.string().optional(),
        movements: z.array(z.object({
          level: z.string(),
          deadline: z.string().optional(),
          trigger: z.string().optional(),
          mechanism: z.string().optional(),
          projectedSalary: z.string().optional(),
          positionInRange: z.string().optional(),
          justification: z.string().optional(),
          orderIndex: z.number(),
        })),
      }).optional(),

      // Plano de Ação 70-20-10
      actionPlan: z.object({
        practice70Items: z.array(z.string()),
        social20Items: z.array(z.string()),
        formal10Items: z.array(z.string()),
      }).optional(),

      // Responsabilidades
      responsibilities: z.object({
        employeeResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
        leadershipResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
        dhoResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
      }).optional(),

      // Timeline
      timeline: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        targetDate: z.string(),
        orderIndex: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar plano principal
      const [plan] = await db.insert(pdiPlans).values({
        cycleId: input.cycleId,
        employeeId: input.employeeId,
        targetPositionId: input.targetPositionId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "rascunho",
        overallProgress: 0,
      }).$returningId();

      const planId = plan.id;

      // Criar KPIs se fornecidos
      if (input.kpis) {
        await db.insert(pdiKpis).values({
          planId,
          ...input.kpis,
        });
      }

      // Criar estratégia de remuneração se fornecida
      if (input.remunerationStrategy) {
        const [strategy] = await db.insert(pdiRemunerationStrategy).values({
          planId,
          title: input.remunerationStrategy.title,
          description: input.remunerationStrategy.description,
          midpoint: input.remunerationStrategy.midpoint,
        }).$returningId();

        // Criar movimentos salariais
        if (input.remunerationStrategy.movements.length > 0) {
          await db.insert(pdiRemunerationMovements).values(
            input.remunerationStrategy.movements.map(m => ({
              strategyId: strategy.id,
              ...m,
            }))
          );
        }
      }

      // Criar plano de ação 70-20-10 se fornecido
      if (input.actionPlan) {
        await db.insert(pdiActionPlan702010).values({
          planId,
          practice70Items: input.actionPlan.practice70Items,
          social20Items: input.actionPlan.social20Items,
          formal10Items: input.actionPlan.formal10Items,
        });
      }

      // Criar responsabilidades se fornecidas
      if (input.responsibilities) {
        await db.insert(pdiResponsibilities).values({
          planId,
          employeeResponsibilities: input.responsibilities.employeeResponsibilities,
          leadershipResponsibilities: input.responsibilities.leadershipResponsibilities,
          dhoResponsibilities: input.responsibilities.dhoResponsibilities,
        });
      }

      // Criar timeline se fornecida
      if (input.timeline && input.timeline.length > 0) {
        await db.insert(pdiTimeline).values(
          input.timeline.map(t => ({
            planId,
            title: t.title,
            description: t.description,
            targetDate: new Date(t.targetDate),
            orderIndex: t.orderIndex,
            status: "pendente" as const,
            progress: 0,
          }))
        );
      }

      // Criar assinaturas vazias
      await db.insert(pdiSignatures).values({
        planId,
        allSigned: false,
      });

      return { id: planId, success: true };
    }),

  /**
   * Atualizar PDI existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
      kpis: z.object({
        currentPosition: z.string().optional(),
        reframing: z.string().optional(),
        newPosition: z.string().optional(),
        performancePlanMonths: z.number().optional(),
        technicalExcellence: z.string().optional(),
        leadership: z.string().optional(),
        immediateIncentive: z.string().optional(),
      }).optional(),
      actionPlan: z.object({
        practice70Items: z.array(z.string()),
        social20Items: z.array(z.string()),
        formal10Items: z.array(z.string()),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Atualizar status do plano se fornecido
      if (input.status) {
        await db.update(pdiPlans)
          .set({ status: input.status })
          .where(eq(pdiPlans.id, input.id));
      }

      // Atualizar KPIs se fornecidos
      if (input.kpis) {
        const [existing] = await db.select().from(pdiKpis).where(eq(pdiKpis.planId, input.id));
        if (existing) {
          await db.update(pdiKpis)
            .set(input.kpis)
            .where(eq(pdiKpis.planId, input.id));
        } else {
          await db.insert(pdiKpis).values({
            planId: input.id,
            ...input.kpis,
          });
        }
      }

      // Atualizar plano de ação se fornecido
      if (input.actionPlan) {
        const [existing] = await db.select().from(pdiActionPlan702010).where(eq(pdiActionPlan702010.planId, input.id));
        if (existing) {
          await db.update(pdiActionPlan702010)
            .set(input.actionPlan)
            .where(eq(pdiActionPlan702010.planId, input.id));
        } else {
          await db.insert(pdiActionPlan702010).values({
            planId: input.id,
            ...input.actionPlan,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Excluir PDI
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Excluir todos os dados relacionados
      await db.delete(pdiKpis).where(eq(pdiKpis.planId, input.id));
      await db.delete(pdiActionPlan702010).where(eq(pdiActionPlan702010.planId, input.id));
      await db.delete(pdiResponsibilities).where(eq(pdiResponsibilities.planId, input.id));
      await db.delete(pdiSignatures).where(eq(pdiSignatures.planId, input.id));
      await db.delete(pdiTimeline).where(eq(pdiTimeline.planId, input.id));
      await db.delete(pdiCompetencyGaps).where(eq(pdiCompetencyGaps.planId, input.id));
      await db.delete(pdiIntelligentDetails).where(eq(pdiIntelligentDetails.planId, input.id));

      // Excluir estratégia de remuneração e movimentos
      const [strategy] = await db.select().from(pdiRemunerationStrategy).where(eq(pdiRemunerationStrategy.planId, input.id));
      if (strategy) {
        await db.delete(pdiRemunerationMovements).where(eq(pdiRemunerationMovements.strategyId, strategy.id));
        await db.delete(pdiRemunerationStrategy).where(eq(pdiRemunerationStrategy.id, strategy.id));
      }

      // Excluir plano principal
      await db.delete(pdiPlans).where(eq(pdiPlans.id, input.id));

      return { success: true };
    }),

  /**
   * Atualizar timeline de um PDI
   */
  updateTimeline: protectedProcedure
    .input(z.object({
      planId: z.number(),
      timelineId: z.number(),
      status: z.enum(["pendente", "em_andamento", "concluido", "atrasado"]).optional(),
      progress: z.number().optional(),
      notes: z.string().optional(),
      completedDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.status) updateData.status = input.status;
      if (input.progress !== undefined) updateData.progress = input.progress;
      if (input.notes) updateData.notes = input.notes;
      if (input.completedDate) updateData.completedDate = new Date(input.completedDate);

      await db.update(pdiTimeline)
        .set(updateData)
        .where(and(
          eq(pdiTimeline.id, input.timelineId),
          eq(pdiTimeline.planId, input.planId)
        ));

      return { success: true };
    }),

  /**
   * Registrar assinatura no PDI
   */
  sign: protectedProcedure
    .input(z.object({
      planId: z.number(),
      role: z.enum(["employee", "sponsor", "mentor", "dho"]),
      name: z.string(),
      signature: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      const now = new Date();

      switch (input.role) {
        case "employee":
          updateData.employeeName = input.name;
          updateData.employeeSignedAt = now;
          if (input.signature) updateData.employeeSignature = input.signature;
          break;
        case "sponsor":
          updateData.sponsorName = input.name;
          updateData.sponsorSignedAt = now;
          if (input.signature) updateData.sponsorSignature = input.signature;
          break;
        case "mentor":
          updateData.mentorName = input.name;
          updateData.mentorSignedAt = now;
          if (input.signature) updateData.mentorSignature = input.signature;
          break;
        case "dho":
          updateData.dhoName = input.name;
          updateData.dhoSignedAt = now;
          if (input.signature) updateData.dhoSignature = input.signature;
          break;
      }

      await db.update(pdiSignatures)
        .set(updateData)
        .where(eq(pdiSignatures.planId, input.planId));

      // Verificar se todas as assinaturas foram coletadas
      const [signatures] = await db.select().from(pdiSignatures).where(eq(pdiSignatures.planId, input.planId));
      if (signatures && signatures.employeeSignedAt && signatures.sponsorSignedAt && signatures.dhoSignedAt) {
        await db.update(pdiSignatures)
          .set({ allSigned: true })
          .where(eq(pdiSignatures.planId, input.planId));
      }

      return { success: true };
    }),
});
