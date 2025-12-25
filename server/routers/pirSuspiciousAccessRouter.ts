import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or } from "drizzle-orm";
import {
  pirIntegritySuspiciousAccessLogs,
  pirIntegrityAssessments,
  employees,
  users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../emailService";

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
    }).optional())
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

  /**
   * Enviar notificação por email para gestores sobre alertas de segurança
   */
  notifyManagersAboutAlerts: protectedProcedure
    .input(z.object({
      alertIds: z.array(z.number()).optional(),
      severity: z.enum(["medium", "high", "critical"]).optional(),
      includeAllPending: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let conditions: any[] = [eq(pirIntegritySuspiciousAccessLogs.status, "pending")];
      
      if (input.alertIds && input.alertIds.length > 0) {
        conditions.push(inArray(pirIntegritySuspiciousAccessLogs.id, input.alertIds));
      }
      
      if (input.severity) {
        const severityLevels = input.severity === "critical" ? ["critical"] : input.severity === "high" ? ["high", "critical"] : ["medium", "high", "critical"];
        conditions.push(inArray(pirIntegritySuspiciousAccessLogs.severity, severityLevels));
      }

      const alerts = await db.select({ alert: pirIntegritySuspiciousAccessLogs, employee: employees })
        .from(pirIntegritySuspiciousAccessLogs)
        .leftJoin(employees, eq(pirIntegritySuspiciousAccessLogs.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(pirIntegritySuspiciousAccessLogs.createdAt))
        .limit(50);

      if (alerts.length === 0) {
        return { success: true, message: "Nenhum alerta pendente para notificar", emailsSent: 0 };
      }

      const managers = await db.select().from(users).where(eq(users.role, "admin"));

      if (managers.length === 0) {
        return { success: false, message: "Nenhum gestor encontrado para notificar", emailsSent: 0 };
      }

      const severityLabels: Record<string, string> = { critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo" };
      const anomalyTypeLabels: Record<string, string> = { fast_responses: "Respostas Rápidas", pattern_detected: "Padrão Detectado", multiple_sessions: "Múltiplas Sessões", unusual_time: "Horário Incomum", browser_switch: "Troca de Navegador", copy_paste: "Copiar/Colar", tab_switch: "Troca de Aba", other: "Outro" };

      const alertsBySeverity = {
        critical: alerts.filter(a => a.alert.severity === "critical").length,
        high: alerts.filter(a => a.alert.severity === "high").length,
        medium: alerts.filter(a => a.alert.severity === "medium").length,
        low: alerts.filter(a => a.alert.severity === "low").length,
      };

      const alertsTableRows = alerts.slice(0, 20).map(a => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
              background: ${a.alert.severity === 'critical' ? '#fee2e2' : a.alert.severity === 'high' ? '#fef3c7' : '#e0e7ff'};
              color: ${a.alert.severity === 'critical' ? '#dc2626' : a.alert.severity === 'high' ? '#d97706' : '#4f46e5'};">
              ${severityLabels[a.alert.severity] || a.alert.severity}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${a.employee?.name || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${anomalyTypeLabels[a.alert.anomalyType] || a.alert.anomalyType}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${a.alert.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${new Date(a.alert.createdAt).toLocaleString('pt-BR')}</td>
        </tr>
      `).join('');

      const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1>🚨 Alerta de Segurança - Sistema AVD UISA</h1>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Atenção:</strong> Foram detectados <strong>${alerts.length}</strong> acessos suspeitos que requerem sua análise.
      </div>
      <div style="display: flex; gap: 20px; margin: 20px 0;">
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${alertsBySeverity.critical}</div>
          <div style="font-size: 12px; color: #6b7280;">Críticos</div>
        </div>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: #d97706;">${alertsBySeverity.high}</div>
          <div style="font-size: 12px; color: #6b7280;">Altos</div>
        </div>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">${alertsBySeverity.medium}</div>
          <div style="font-size: 12px; color: #6b7280;">Médios</div>
        </div>
      </div>
      <h3>Alertas Recentes</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead><tr>
          <th style="background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Severidade</th>
          <th style="background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Funcionário</th>
          <th style="background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Tipo</th>
          <th style="background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Descrição</th>
          <th style="background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Data/Hora</th>
        </tr></thead>
        <tbody>${alertsTableRows}</tbody>
      </table>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 14px; color: #6b7280;">Este é um e-mail automático do Sistema AVD UISA. Data: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body></html>`.trim();

      let emailsSent = 0;
      for (const manager of managers) {
        if (manager.email) {
          const success = await sendEmail({ to: manager.email, subject: `🚨 [URGENTE] ${alerts.length} Alertas de Segurança Detectados - Sistema AVD UISA`, html: emailHtml });
          if (success) emailsSent++;
        }
      }

      return { success: emailsSent > 0, message: emailsSent > 0 ? `Notificações enviadas para ${emailsSent} gestor(es)` : "Nenhum email enviado", emailsSent, totalAlerts: alerts.length };
    }),

  /**
   * Enviar alerta automático por email para um alerta específico
   */
  sendAutomaticAlertEmail: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [alert] = await db.select({ alert: pirIntegritySuspiciousAccessLogs, employee: employees })
        .from(pirIntegritySuspiciousAccessLogs)
        .leftJoin(employees, eq(pirIntegritySuspiciousAccessLogs.employeeId, employees.id))
        .where(eq(pirIntegritySuspiciousAccessLogs.id, input.alertId))
        .limit(1);

      if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "Alerta não encontrado" });

      if (!['critical', 'high'].includes(alert.alert.severity)) {
        return { success: true, message: "Alerta não requer notificação automática", emailSent: false };
      }

      const managers = await db.select().from(users).where(eq(users.role, "admin"));
      if (managers.length === 0) return { success: false, message: "Nenhum gestor encontrado", emailSent: false };

      const severityLabels: Record<string, string> = { critical: "CRÍTICO", high: "ALTO", medium: "MÉDIO", low: "BAIXO" };
      const anomalyTypeLabels: Record<string, string> = { fast_responses: "Respostas Rápidas", pattern_detected: "Padrão Detectado", multiple_sessions: "Múltiplas Sessões", unusual_time: "Horário Incomum", browser_switch: "Troca de Navegador", copy_paste: "Copiar/Colar", tab_switch: "Troca de Aba", other: "Outro" };

      const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${alert.alert.severity === 'critical' ? '#dc2626' : '#d97706'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1>🚨 Alerta de Segurança ${severityLabels[alert.alert.severity]}</h1>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <p>Um novo acesso suspeito foi detectado no Sistema AVD UISA que requer sua atenção imediata.</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Funcionário</div>
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${alert.employee?.name || 'Não identificado'}</div>
      </div>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Tipo de Anomalia</div>
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${anomalyTypeLabels[alert.alert.anomalyType] || alert.alert.anomalyType}</div>
      </div>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Descrição</div>
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${alert.alert.description}</div>
      </div>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Data/Hora</div>
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${new Date(alert.alert.createdAt).toLocaleString('pt-BR')}</div>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #6b7280;">Este é um e-mail automático. Não responda.</p>
    </div>
  </div>
</body></html>`.trim();

      let emailSent = false;
      for (const manager of managers) {
        if (manager.email) {
          const success = await sendEmail({ to: manager.email, subject: `🚨 [${severityLabels[alert.alert.severity]}] Acesso Suspeito Detectado - ${alert.employee?.name || 'Funcionário'}`, html: emailHtml });
          if (success) emailSent = true;
        }
      }

      return { success: emailSent, message: emailSent ? "Email enviado com sucesso" : "Falha ao enviar email", emailSent };
    }),
});
