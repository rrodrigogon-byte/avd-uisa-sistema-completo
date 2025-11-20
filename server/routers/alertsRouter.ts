import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { alerts, employees } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emailService } from "../utils/emailService";

/**
 * Router para gestão de alertas de produtividade
 */
export const alertsRouter = router({
  /**
   * Listar alertas com filtros
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "resolved", "dismissed"]).optional(),
      severity: z.enum(["critical", "high", "medium", "low"]).optional(),
      type: z.enum([
        "low_productivity",
        "inconsistent_hours",
        "low_diversity",
        "missing_activities",
        "time_discrepancy",
        "goal_overdue",
        "evaluation_pending"
      ]).optional(),
      employeeId: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input.status) conditions.push(eq(alerts.status, input.status));
      if (input.severity) conditions.push(eq(alerts.severity, input.severity));
      if (input.type) conditions.push(eq(alerts.type, input.type));
      if (input.employeeId) conditions.push(eq(alerts.employeeId, input.employeeId));
      
      const results = await db
        .select({
          id: alerts.id,
          employeeId: alerts.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          departmentId: employees.departmentId,
          type: alerts.type,
          severity: alerts.severity,
          title: alerts.title,
          description: alerts.description,
          metrics: alerts.metrics,
          status: alerts.status,
          actionTaken: alerts.actionTaken,
          createdAt: alerts.createdAt,
          resolvedAt: alerts.resolvedAt,
        })
        .from(alerts)
        .leftJoin(employees, eq(alerts.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alerts.createdAt))
        .limit(input.limit);
      
      return results;
    }),
  
  /**
   * Obter estatísticas de alertas
   */
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, critical: 0, resolved: 0 };
      
      const [stats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
          critical: sql<number>`SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END)`,
          resolved: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)`,
        })
        .from(alerts);
      
      return stats || { total: 0, active: 0, critical: 0, resolved: 0 };
    }),
  
  /**
   * Resolver alerta
   */
  resolve: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      resolutionNotes: z.string(),
      actionTaken: z.enum(["email_sent", "meeting_scheduled", "warning_issued", "training_assigned", "none"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(alerts)
        .set({
          status: "resolved",
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.resolutionNotes,
          actionTaken: input.actionTaken,
        })
        .where(eq(alerts.id, input.alertId));
      
      return { success: true };
    }),
  
  /**
   * Dispensar alerta
   */
  dismiss: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(alerts)
        .set({
          status: "dismissed",
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.reason,
        })
        .where(eq(alerts.id, input.alertId));
      
      return { success: true };
    }),
  
  /**
   * Enviar email sobre alerta
   */
  sendAlertEmail: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      recipientEmail: z.string().email(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar dados do alerta
      const [alert] = await db
        .select({
          title: alerts.title,
          description: alerts.description,
          severity: alerts.severity,
          employeeName: employees.name,
        })
        .from(alerts)
        .leftJoin(employees, eq(alerts.employeeId, employees.id))
        .where(eq(alerts.id, input.alertId))
        .limit(1);
      
      if (!alert) throw new Error("Alert not found");
      
      // Enviar email
      await emailService.sendCustomEmail(
        input.recipientEmail,
        `[${alert.severity.toUpperCase()}] ${alert.title}`,
        `
          <h2>Alerta de Produtividade</h2>
          <p><strong>Colaborador:</strong> ${alert.employeeName}</p>
          <p><strong>Severidade:</strong> ${alert.severity}</p>
          <p><strong>Descrição:</strong> ${alert.description}</p>
          <hr>
          <p><strong>Mensagem:</strong></p>
          <p>${input.message}</p>
        `
      );
      
      // Atualizar alerta com ação tomada
      await db
        .update(alerts)
        .set({ actionTaken: "email_sent" })
        .where(eq(alerts.id, input.alertId));
      
      return { success: true };
    }),
  
  /**
   * Ações em lote
   */
  bulkAction: protectedProcedure
    .input(z.object({
      alertIds: z.array(z.number()),
      action: z.enum(["resolve", "dismiss", "send_email"]),
      notes: z.string().optional(),
      emailRecipients: z.array(z.string().email()).optional(),
      emailMessage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let successCount = 0;
      
      for (const alertId of input.alertIds) {
        try {
          if (input.action === "resolve") {
            await db
              .update(alerts)
              .set({
                status: "resolved",
                resolvedBy: ctx.user.id,
                resolvedAt: new Date(),
                resolutionNotes: input.notes || "Resolvido em lote",
              })
              .where(eq(alerts.id, alertId));
            successCount++;
          } else if (input.action === "dismiss") {
            await db
              .update(alerts)
              .set({
                status: "dismissed",
                resolvedBy: ctx.user.id,
                resolvedAt: new Date(),
                resolutionNotes: input.notes || "Dispensado em lote",
              })
              .where(eq(alerts.id, alertId));
            successCount++;
          } else if (input.action === "send_email" && input.emailRecipients && input.emailMessage) {
            // Buscar dados do alerta
            const [alert] = await db
              .select({
                title: alerts.title,
                description: alerts.description,
                severity: alerts.severity,
                employeeName: employees.name,
              })
              .from(alerts)
              .leftJoin(employees, eq(alerts.employeeId, employees.id))
              .where(eq(alerts.id, alertId))
              .limit(1);
            
            if (alert) {
              for (const email of input.emailRecipients) {
                await emailService.sendCustomEmail(
                  email,
                  `[${alert.severity.toUpperCase()}] ${alert.title}`,
                  `
                    <h2>Alerta de Produtividade</h2>
                    <p><strong>Colaborador:</strong> ${alert.employeeName}</p>
                    <p><strong>Severidade:</strong> ${alert.severity}</p>
                    <p><strong>Descrição:</strong> ${alert.description}</p>
                    <hr>
                    <p><strong>Mensagem:</strong></p>
                    <p>${input.emailMessage}</p>
                  `
                );
              }
              
              await db
                .update(alerts)
                .set({ actionTaken: "email_sent" })
                .where(eq(alerts.id, alertId));
              
              successCount++;
            }
          }
        } catch (error) {
          console.error(`Erro ao processar alerta ${alertId}:`, error);
        }
      }
      
      return {
        success: true,
        processed: successCount,
        total: input.alertIds.length,
      };
    }),
});
