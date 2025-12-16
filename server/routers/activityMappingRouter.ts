import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, desc, sql, between, gte, lte } from "drizzle-orm";
import {
  activityRoutines,
  desktopActivityLogs,
  activityJobDescriptionMatch,
  jobDescriptions,
  jobResponsibilities,
  employees,
} from "../../drizzle/schema";

/**
 * Router para mapeamento de atividades e rotinas do usuário
 */
export const activityMappingRouter = router({
  // ============================================================================
  // ROTINAS DO USUÁRIO
  // ============================================================================

  /**
   * Criar nova rotina
   */
  createRoutine: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        jobDescriptionId: z.number().optional(),
        responsibilityId: z.number().optional(),
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        description: z.string().optional(),
        frequency: z.enum(["diaria", "semanal", "quinzenal", "mensal", "trimestral", "eventual"]),
        estimatedMinutes: z.number().min(1).optional(),
        category: z.enum([
          "processo",
          "analise",
          "planejamento",
          "comunicacao",
          "reuniao",
          "relatorio",
          "suporte",
          "administrativo",
          "outros",
        ]),
        weekDays: z.array(z.number().min(0).max(6)).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(activityRoutines).values({
        employeeId: input.employeeId,
        jobDescriptionId: input.jobDescriptionId,
        responsibilityId: input.responsibilityId,
        name: input.name,
        description: input.description,
        frequency: input.frequency,
        estimatedMinutes: input.estimatedMinutes,
        category: input.category,
        weekDays: input.weekDays ? JSON.stringify(input.weekDays) : null,
        isLinkedToJobDescription: !!input.responsibilityId,
      });

      return {
        success: true,
        routineId: result.insertId,
        message: "Rotina criada com sucesso",
      };
    }),

  /**
   * Atualizar rotina
   */
  updateRoutine: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        frequency: z.enum(["diaria", "semanal", "quinzenal", "mensal", "trimestral", "eventual"]).optional(),
        estimatedMinutes: z.number().min(1).optional(),
        category: z
          .enum([
            "processo",
            "analise",
            "planejamento",
            "comunicacao",
            "reuniao",
            "relatorio",
            "suporte",
            "administrativo",
            "outros",
          ])
          .optional(),
        responsibilityId: z.number().optional(),
        weekDays: z.array(z.number().min(0).max(6)).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, weekDays, ...updateData } = input;

      const finalUpdateData: any = { ...updateData };
      if (weekDays !== undefined) {
        finalUpdateData.weekDays = JSON.stringify(weekDays);
      }
      if (input.responsibilityId !== undefined) {
        finalUpdateData.isLinkedToJobDescription = !!input.responsibilityId;
      }

      await db.update(activityRoutines).set(finalUpdateData).where(eq(activityRoutines.id, id));

      return {
        success: true,
        message: "Rotina atualizada com sucesso",
      };
    }),

  /**
   * Excluir rotina (soft delete)
   */
  deleteRoutine: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(activityRoutines).set({ active: false }).where(eq(activityRoutines.id, input.id));

      return {
        success: true,
        message: "Rotina excluída com sucesso",
      };
    }),

  /**
   * Listar rotinas do funcionário
   */
  listRoutines: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        includeInactive: z.boolean().default(false),
        category: z
          .enum([
            "processo",
            "analise",
            "planejamento",
            "comunicacao",
            "reuniao",
            "relatorio",
            "suporte",
            "administrativo",
            "outros",
          ])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let conditions = [eq(activityRoutines.employeeId, input.employeeId)];

      if (!input.includeInactive) {
        conditions.push(eq(activityRoutines.active, true));
      }

      if (input.category) {
        conditions.push(eq(activityRoutines.category, input.category));
      }

      const routines = await db
        .select()
        .from(activityRoutines)
        .where(and(...conditions))
        .orderBy(desc(activityRoutines.createdAt));

      return routines;
    }),

  /**
   * Vincular rotina à descrição de cargo
   */
  linkToJobDescription: protectedProcedure
    .input(
      z.object({
        routineId: z.number(),
        responsibilityId: z.number(),
        matchPercentage: z.number().min(0).max(100).optional(),
        matchNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar a responsabilidade para obter o jobDescriptionId
      const [responsibility] = await db
        .select()
        .from(jobResponsibilities)
        .where(eq(jobResponsibilities.id, input.responsibilityId));

      if (!responsibility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Responsabilidade não encontrada" });
      }

      await db
        .update(activityRoutines)
        .set({
          responsibilityId: input.responsibilityId,
          jobDescriptionId: responsibility.jobDescriptionId,
          isLinkedToJobDescription: true,
          matchPercentage: input.matchPercentage || 100,
          matchNotes: input.matchNotes,
        })
        .where(eq(activityRoutines.id, input.routineId));

      return {
        success: true,
        message: "Rotina vinculada à descrição de cargo",
      };
    }),

  // ============================================================================
  // LOGS DE ATIVIDADES DE DESKTOP
  // ============================================================================

  /**
   * Registrar atividade de desktop (para uso pelo agente)
   */
  logDesktopActivity: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        activityType: z.enum(["application", "website", "document", "meeting", "email", "idle", "other"]),
        applicationName: z.string().optional(),
        windowTitle: z.string().optional(),
        url: z.string().optional(),
        documentPath: z.string().optional(),
        startTime: z.string(), // ISO datetime
        endTime: z.string().optional(),
        durationSeconds: z.number().optional(),
        deviceId: z.string().optional(),
        deviceType: z.enum(["desktop", "laptop", "mobile"]).default("desktop"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular duração se não fornecida
      let duration = input.durationSeconds;
      if (!duration && input.endTime) {
        const start = new Date(input.startTime).getTime();
        const end = new Date(input.endTime).getTime();
        duration = Math.floor((end - start) / 1000);
      }

      // Categorização automática básica
      let autoCategory = "outros";
      if (input.activityType === "meeting") autoCategory = "reuniao";
      else if (input.activityType === "email") autoCategory = "comunicacao";
      else if (input.activityType === "document") autoCategory = "analise";
      else if (input.applicationName?.toLowerCase().includes("excel")) autoCategory = "analise";
      else if (input.applicationName?.toLowerCase().includes("word")) autoCategory = "relatorio";
      else if (input.applicationName?.toLowerCase().includes("powerpoint")) autoCategory = "planejamento";

      const [result] = await db.insert(desktopActivityLogs).values({
        employeeId: input.employeeId,
        activityType: input.activityType,
        applicationName: input.applicationName,
        windowTitle: input.windowTitle,
        url: input.url,
        documentPath: input.documentPath,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        durationSeconds: duration,
        deviceId: input.deviceId,
        deviceType: input.deviceType,
        autoCategory,
      });

      return {
        success: true,
        logId: result.insertId,
      };
    }),

  /**
   * Buscar resumo de atividades de desktop
   */
  getDesktopActivitySummary: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar atividades no período
      const activities = await db
        .select()
        .from(desktopActivityLogs)
        .where(
          and(
            eq(desktopActivityLogs.employeeId, input.employeeId),
            gte(desktopActivityLogs.startTime, new Date(input.startDate)),
            lte(desktopActivityLogs.startTime, new Date(input.endDate))
          )
        );

      // Calcular resumo por tipo
      const byType: Record<string, { count: number; totalSeconds: number }> = {};
      const byCategory: Record<string, { count: number; totalSeconds: number }> = {};
      const byApplication: Record<string, { count: number; totalSeconds: number }> = {};

      activities.forEach((act) => {
        const duration = act.durationSeconds || 0;

        // Por tipo
        if (!byType[act.activityType]) {
          byType[act.activityType] = { count: 0, totalSeconds: 0 };
        }
        byType[act.activityType].count++;
        byType[act.activityType].totalSeconds += duration;

        // Por categoria
        const cat = act.autoCategory || "outros";
        if (!byCategory[cat]) {
          byCategory[cat] = { count: 0, totalSeconds: 0 };
        }
        byCategory[cat].count++;
        byCategory[cat].totalSeconds += duration;

        // Por aplicativo
        if (act.applicationName) {
          if (!byApplication[act.applicationName]) {
            byApplication[act.applicationName] = { count: 0, totalSeconds: 0 };
          }
          byApplication[act.applicationName].count++;
          byApplication[act.applicationName].totalSeconds += duration;
        }
      });

      return {
        totalActivities: activities.length,
        totalSeconds: activities.reduce((sum, a) => sum + (a.durationSeconds || 0), 0),
        byType,
        byCategory,
        byApplication,
      };
    }),

  /**
   * Listar atividades de desktop
   */
  listDesktopActivities: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        activityType: z.enum(["application", "website", "document", "meeting", "email", "idle", "other"]).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let conditions = [eq(desktopActivityLogs.employeeId, input.employeeId)];

      if (input.startDate) {
        conditions.push(gte(desktopActivityLogs.startTime, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(desktopActivityLogs.startTime, new Date(input.endDate)));
      }
      if (input.activityType) {
        conditions.push(eq(desktopActivityLogs.activityType, input.activityType));
      }

      const activities = await db
        .select()
        .from(desktopActivityLogs)
        .where(and(...conditions))
        .orderBy(desc(desktopActivityLogs.startTime))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  // ============================================================================
  // CONFRONTO COM DESCRIÇÃO DE CARGO
  // ============================================================================

  /**
   * Gerar relatório de confronto
   */
  generateMatchReport: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        jobDescriptionId: z.number(),
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar rotinas do funcionário
      const routines = await db
        .select()
        .from(activityRoutines)
        .where(and(eq(activityRoutines.employeeId, input.employeeId), eq(activityRoutines.active, true)));

      // Buscar responsabilidades da descrição de cargo
      const responsibilities = await db
        .select()
        .from(jobResponsibilities)
        .where(eq(jobResponsibilities.jobDescriptionId, input.jobDescriptionId));

      // Buscar atividades de desktop no período
      const desktopActivities = await db
        .select()
        .from(desktopActivityLogs)
        .where(
          and(
            eq(desktopActivityLogs.employeeId, input.employeeId),
            gte(desktopActivityLogs.startTime, new Date(input.periodStart)),
            lte(desktopActivityLogs.startTime, new Date(input.periodEnd))
          )
        );

      // Calcular métricas
      const totalActivities = routines.length + desktopActivities.length;
      const linkedRoutines = routines.filter((r) => r.isLinkedToJobDescription);
      const activitiesMatchedToJob = linkedRoutines.length;
      const activitiesNotInJob = routines.filter((r) => !r.isLinkedToJobDescription).length;

      // Identificar responsabilidades não executadas
      const executedResponsibilityIds = new Set(linkedRoutines.map((r) => r.responsibilityId).filter(Boolean));
      const notExecutedResponsibilities = responsibilities.filter((r) => !executedResponsibilityIds.has(r.id));

      // Calcular percentuais
      const adherencePercentage =
        totalActivities > 0 ? Math.round((activitiesMatchedToJob / totalActivities) * 100) : 0;
      const coveragePercentage =
        responsibilities.length > 0
          ? Math.round((executedResponsibilityIds.size / responsibilities.length) * 100)
          : 0;

      // Identificar gaps
      const gapsIdentified = [
        ...notExecutedResponsibilities.map((r) => ({
          type: "responsibility_not_executed",
          description: r.description,
          severity: "medium",
        })),
        ...routines
          .filter((r) => !r.isLinkedToJobDescription)
          .map((r) => ({
            type: "activity_not_in_job",
            description: r.name,
            severity: "low",
          })),
      ];

      // Sugestões de ajustes
      const suggestedAdjustments = [];
      if (activitiesNotInJob > 0) {
        suggestedAdjustments.push({
          type: "add_responsibilities",
          description: `Considerar adicionar ${activitiesNotInJob} atividades realizadas à descrição de cargo`,
          priority: "medium",
        });
      }
      if (notExecutedResponsibilities.length > 0) {
        suggestedAdjustments.push({
          type: "review_responsibilities",
          description: `Revisar ${notExecutedResponsibilities.length} responsabilidades não executadas`,
          priority: "high",
        });
      }

      // Gerar resumo executivo
      const executiveSummary = `
Análise de aderência do período ${input.periodStart} a ${input.periodEnd}:
- Total de atividades mapeadas: ${totalActivities}
- Atividades alinhadas ao cargo: ${activitiesMatchedToJob} (${adherencePercentage}%)
- Cobertura das responsabilidades: ${coveragePercentage}%
- Gaps identificados: ${gapsIdentified.length}
- Sugestões de ajuste: ${suggestedAdjustments.length}
      `.trim();

      // Salvar relatório
      const [result] = await db.insert(activityJobDescriptionMatch).values({
        employeeId: input.employeeId,
        jobDescriptionId: input.jobDescriptionId,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        totalActivitiesLogged: totalActivities,
        activitiesMatchedToJob,
        activitiesNotInJob,
        responsibilitiesNotExecuted: notExecutedResponsibilities.length,
        adherencePercentage,
        coveragePercentage,
        matchDetails: JSON.stringify(
          linkedRoutines.map((r) => ({
            routineId: r.id,
            responsibilityId: r.responsibilityId,
            name: r.name,
          }))
        ),
        gapsIdentified: JSON.stringify(gapsIdentified),
        suggestedAdjustments: JSON.stringify(suggestedAdjustments),
        executiveSummary,
        status: "completed",
      });

      return {
        success: true,
        reportId: result.insertId,
        summary: {
          totalActivities,
          activitiesMatchedToJob,
          activitiesNotInJob,
          responsibilitiesNotExecuted: notExecutedResponsibilities.length,
          adherencePercentage,
          coveragePercentage,
          gapsCount: gapsIdentified.length,
          suggestionsCount: suggestedAdjustments.length,
        },
      };
    }),

  /**
   * Buscar relatório de confronto
   */
  getMatchReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [report] = await db
        .select()
        .from(activityJobDescriptionMatch)
        .where(eq(activityJobDescriptionMatch.id, input.reportId));

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      }

      return {
        ...report,
        matchDetails: report.matchDetails ? JSON.parse(report.matchDetails as string) : [],
        gapsIdentified: report.gapsIdentified ? JSON.parse(report.gapsIdentified as string) : [],
        suggestedAdjustments: report.suggestedAdjustments ? JSON.parse(report.suggestedAdjustments as string) : [],
      };
    }),

  /**
   * Listar relatórios de confronto
   */
  listMatchReports: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        jobDescriptionId: z.number().optional(),
        status: z.enum(["processing", "completed", "reviewed"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let conditions = [];

      if (input.employeeId) {
        conditions.push(eq(activityJobDescriptionMatch.employeeId, input.employeeId));
      }
      if (input.jobDescriptionId) {
        conditions.push(eq(activityJobDescriptionMatch.jobDescriptionId, input.jobDescriptionId));
      }
      if (input.status) {
        conditions.push(eq(activityJobDescriptionMatch.status, input.status));
      }

      const reports = await db
        .select()
        .from(activityJobDescriptionMatch)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(activityJobDescriptionMatch.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return reports;
    }),

  /**
   * Revisar relatório de confronto
   */
  reviewMatchReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(activityJobDescriptionMatch)
        .set({
          status: "reviewed",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewComments: input.comments,
        })
        .where(eq(activityJobDescriptionMatch.id, input.reportId));

      return {
        success: true,
        message: "Relatório revisado com sucesso",
      };
    }),

  /**
   * Obter responsabilidades da descrição de cargo para vinculação
   */
  getJobResponsibilities: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const responsibilities = await db
        .select()
        .from(jobResponsibilities)
        .where(eq(jobResponsibilities.jobDescriptionId, input.jobDescriptionId))
        .orderBy(jobResponsibilities.category, jobResponsibilities.order);

      return responsibilities;
    }),
});
