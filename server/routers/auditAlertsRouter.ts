import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { auditAlerts, alertRules, auditLogs } from "../../drizzle/schema";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

/**
 * Router de Alertas Automáticos de Auditoria
 * Gerencia alertas gerados automaticamente e regras de detecção
 */
export const auditAlertsRouter = router({
  /**
   * Listar alertas com filtros
   */
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["new", "investigating", "resolved", "false_positive"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.status) conditions.push(eq(auditAlerts.status, input.status));
      if (input.severity) conditions.push(eq(auditAlerts.severity, input.severity));

      const alerts = await db
        .select()
        .from(auditAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditAlerts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const totalResult = await db
        .select({ count: count() })
        .from(auditAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        alerts,
        total: totalResult[0]?.count || 0,
        hasMore: (input.offset + input.limit) < (totalResult[0]?.count || 0),
      };
    }),

  /**
   * Obter estatísticas de alertas
   */
  getStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Total de alertas por status
      const statusCounts = await db
        .select({
          status: auditAlerts.status,
          count: count(),
        })
        .from(auditAlerts)
        .where(gte(auditAlerts.createdAt, startDate))
        .groupBy(auditAlerts.status);

      // Total de alertas por severidade
      const severityCounts = await db
        .select({
          severity: auditAlerts.severity,
          count: count(),
        })
        .from(auditAlerts)
        .where(gte(auditAlerts.createdAt, startDate))
        .groupBy(auditAlerts.severity);

      // Total de alertas por tipo
      const typeCounts = await db
        .select({
          alertType: auditAlerts.alertType,
          count: count(),
        })
        .from(auditAlerts)
        .where(gte(auditAlerts.createdAt, startDate))
        .groupBy(auditAlerts.alertType);

      return {
        byStatus: statusCounts,
        bySeverity: severityCounts,
        byType: typeCounts,
      };
    }),

  /**
   * Atualizar status de um alerta
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        alertId: z.number(),
        status: z.enum(["new", "investigating", "resolved", "false_positive"]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "resolved" || input.status === "false_positive") {
        updateData.resolvedBy = ctx.user.id;
        updateData.resolvedAt = new Date();
        if (input.resolution) {
          updateData.resolution = input.resolution;
        }
      }

      await db
        .update(auditAlerts)
        .set(updateData)
        .where(eq(auditAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Criar alerta manualmente
   */
  create: adminProcedure
    .input(
      z.object({
        alertType: z.enum([
          "multiple_failed_logins",
          "unusual_activity_volume",
          "suspicious_time_access",
          "data_export_anomaly",
          "privilege_escalation",
          "unusual_entity_access",
        ]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        userId: z.number().optional(),
        description: z.string(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(auditAlerts).values({
        alertType: input.alertType,
        severity: input.severity,
        userId: input.userId,
        description: input.description,
        details: input.details,
        status: "new",
      });

      // Notificar owner se severidade for alta ou crítica
      if (input.severity === "high" || input.severity === "critical") {
        await notifyOwner({
          title: `🚨 Alerta de Segurança: ${input.severity.toUpperCase()}`,
          content: input.description,
        });
      }

      return { success: true, alertId: result[0].insertId };
    }),

  /**
   * Listar regras de alerta
   */
  listRules: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const rules = await db.select().from(alertRules).orderBy(desc(alertRules.createdAt));

    return rules;
  }),

  /**
   * Criar regra de alerta
   */
  createRule: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        alertType: z.enum([
          "multiple_failed_logins",
          "unusual_activity_volume",
          "suspicious_time_access",
          "data_export_anomaly",
          "privilege_escalation",
          "unusual_entity_access",
        ]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        threshold: z.number(),
        timeWindow: z.number(),
        enabled: z.boolean().default(true),
        notifyAdmins: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(alertRules).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Atualizar regra de alerta
   */
  updateRule: adminProcedure
    .input(
      z.object({
        ruleId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        threshold: z.number().optional(),
        timeWindow: z.number().optional(),
        enabled: z.boolean().optional(),
        notifyAdmins: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { ruleId, ...updateData } = input;

      await db
        .update(alertRules)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(alertRules.id, ruleId));

      return { success: true };
    }),

  /**
   * Verificar e gerar alertas automáticos baseados em regras
   * Esta procedure deve ser chamada periodicamente (ex: a cada 5 minutos)
   */
  checkAndGenerateAlerts: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const rules = await db.select().from(alertRules).where(eq(alertRules.enabled, true));

    const generatedAlerts = [];

    for (const rule of rules) {
      const timeWindowStart = new Date();
      timeWindowStart.setMinutes(timeWindowStart.getMinutes() - rule.timeWindow);

      let shouldTrigger = false;
      let alertDetails = "";

      // Verificar cada tipo de regra
      switch (rule.alertType) {
        case "unusual_activity_volume": {
          const activityCount = await db
            .select({ count: count() })
            .from(auditLogs)
            .where(gte(auditLogs.createdAt, timeWindowStart));

          if (activityCount[0].count > rule.threshold) {
            shouldTrigger = true;
            alertDetails = JSON.stringify({
              count: activityCount[0].count,
              threshold: rule.threshold,
              timeWindow: rule.timeWindow,
            });
          }
          break;
        }

        case "suspicious_time_access": {
          // Verificar acessos entre 22h e 6h
          const suspiciousLogs = await db
            .select({ count: count() })
            .from(auditLogs)
            .where(
              and(
                gte(auditLogs.createdAt, timeWindowStart),
                sql`HOUR(${auditLogs.createdAt}) >= 22 OR HOUR(${auditLogs.createdAt}) < 6`
              )
            );

          if (suspiciousLogs[0].count > rule.threshold) {
            shouldTrigger = true;
            alertDetails = JSON.stringify({
              count: suspiciousLogs[0].count,
              threshold: rule.threshold,
              timeWindow: rule.timeWindow,
            });
          }
          break;
        }

        // Adicionar mais verificações conforme necessário
      }

      if (shouldTrigger) {
        const result = await db.insert(auditAlerts).values({
          alertType: rule.alertType,
          severity: rule.severity,
          description: `Regra "${rule.name}" disparada`,
          details: alertDetails,
          status: "new",
        });

        generatedAlerts.push(result[0].insertId);

        // Notificar admins se configurado
        if (rule.notifyAdmins && (rule.severity === "high" || rule.severity === "critical")) {
          await notifyOwner({
            title: `🚨 Alerta Automático: ${rule.name}`,
            content: `Regra "${rule.name}" foi disparada. Severidade: ${rule.severity}`,
          });
        }
      }
    }

    return {
      success: true,
      generatedCount: generatedAlerts.length,
      alertIds: generatedAlerts,
    };
  }),
});
