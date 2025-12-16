import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or } from "drizzle-orm";
import {
  pirIntegritySuspiciousAccessLogs,
  pirIntegrityAssessments,
  employees,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Router para Alertas de Acessos Suspeitos PIR Integridade
 * Detecta e registra padrões anômalos durante avaliações
 */
export const pirSuspiciousAccessRouter = router({
  /**
   * Registrar uma anomalia detectada
   */
  logAnomaly: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
      anomalyType: z.enum([
        "fast_responses",
        "pattern_detected",
        "multiple_sessions",
        "unusual_time",
        "browser_switch",
        "copy_paste",
        "tab_switch",
        "other"
      ]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(pirIntegritySuspiciousAccessLogs).values({
        assessmentId: input.assessmentId,
        employeeId: input.employeeId,
        anomalyType: input.anomalyType,
        description: input.description,
        severity: input.severity,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        metadata: input.metadata || null,
        status: "pending",
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Detectar respostas muito rápidas
   */
  detectFastResponses: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
      questionId: z.number(),
      responseTimeSeconds: z.number(),
      minExpectedSeconds: z.number().default(5),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { detected: false };

      if (input.responseTimeSeconds < input.minExpectedSeconds) {
        await db.insert(pirIntegritySuspiciousAccessLogs).values({
          assessmentId: input.assessmentId,
          employeeId: input.employeeId,
          anomalyType: "fast_responses",
          description: `Resposta muito rápida na questão ${input.questionId}: ${input.responseTimeSeconds}s (mínimo esperado: ${input.minExpectedSeconds}s)`,
          severity: input.responseTimeSeconds < 2 ? "high" : "medium",
          metadata: {
            questionId: input.questionId,
            responseTimeSeconds: input.responseTimeSeconds,
            minExpectedSeconds: input.minExpectedSeconds,
          },
          status: "pending",
        });
        return { detected: true, severity: input.responseTimeSeconds < 2 ? "high" : "medium" };
      }

      return { detected: false };
    }),

  /**
   * Detectar troca de aba/foco
   */
  detectTabSwitch: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
      switchCount: z.number(),
      questionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { detected: false };

      // Alertar se trocar de aba mais de 3 vezes
      if (input.switchCount > 3) {
        await db.insert(pirIntegritySuspiciousAccessLogs).values({
          assessmentId: input.assessmentId,
          employeeId: input.employeeId,
          anomalyType: "tab_switch",
          description: `Troca de aba/foco detectada ${input.switchCount} vezes durante a avaliação`,
          severity: input.switchCount > 10 ? "high" : "medium",
          metadata: {
            switchCount: input.switchCount,
            questionId: input.questionId,
          },
          status: "pending",
        });
        return { detected: true };
      }

      return { detected: false };
    }),

  /**
   * Listar alertas de acessos suspeitos
   */
  listAlerts: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "reviewed", "dismissed", "confirmed", "all"]).default("pending"),
      severity: z.enum(["low", "medium", "high", "critical", "all"]).default("all"),
      anomalyType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { alerts: [], total: 0 };

      const conditions: any[] = [];

      if (input.status !== "all") {
        conditions.push(eq(pirIntegritySuspiciousAccessLogs.status, input.status));
      }

      if (input.severity !== "all") {
        conditions.push(eq(pirIntegritySuspiciousAccessLogs.severity, input.severity));
      }

      if (input.anomalyType) {
        conditions.push(eq(pirIntegritySuspiciousAccessLogs.anomalyType, input.anomalyType as any));
      }

      if (input.startDate) {
        conditions.push(gte(pirIntegritySuspiciousAccessLogs.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(pirIntegritySuspiciousAccessLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const alerts = await db
        .select({
          alert: pirIntegritySuspiciousAccessLogs,
          employee: employees,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .leftJoin(employees, eq(pirIntegritySuspiciousAccessLogs.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(pirIntegritySuspiciousAccessLogs.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(whereClause);

      return {
        alerts,
        total: countResult?.count || 0,
      };
    }),

  /**
   * Revisar um alerta
   */
  reviewAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      status: z.enum(["reviewed", "dismissed", "confirmed"]),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pirIntegritySuspiciousAccessLogs)
        .set({
          status: input.status,
          reviewedBy: ctx.user?.id || null,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes || null,
        })
        .where(eq(pirIntegritySuspiciousAccessLogs.id, input.alertId));

      return { success: true };
    }),

  /**
   * Obter estatísticas de anomalias
   */
  getStats: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions: any[] = [];

      if (input.startDate) {
        conditions.push(gte(pirIntegritySuspiciousAccessLogs.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(pirIntegritySuspiciousAccessLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Total por status
      const byStatus = await db
        .select({
          status: pirIntegritySuspiciousAccessLogs.status,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(whereClause)
        .groupBy(pirIntegritySuspiciousAccessLogs.status);

      // Total por tipo de anomalia
      const byType = await db
        .select({
          anomalyType: pirIntegritySuspiciousAccessLogs.anomalyType,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(whereClause)
        .groupBy(pirIntegritySuspiciousAccessLogs.anomalyType);

      // Total por severidade
      const bySeverity = await db
        .select({
          severity: pirIntegritySuspiciousAccessLogs.severity,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(whereClause)
        .groupBy(pirIntegritySuspiciousAccessLogs.severity);

      return {
        byStatus,
        byType,
        bySeverity,
        total: byStatus.reduce((acc, s) => acc + Number(s.count), 0),
      };
    }),

  /**
   * Obter alertas por avaliação
   */
  getByAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const alerts = await db
        .select()
        .from(pirIntegritySuspiciousAccessLogs)
        .where(eq(pirIntegritySuspiciousAccessLogs.assessmentId, input.assessmentId))
        .orderBy(desc(pirIntegritySuspiciousAccessLogs.createdAt));

      return alerts;
    }),
});
