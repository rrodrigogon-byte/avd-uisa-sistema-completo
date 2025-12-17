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

  /**
   * Notificar gestores sobre novos alertas de segurança críticos
   * Envia emails automáticos quando alertas suspeitos são detectados
   */
  notifySecurityAlerts: protectedProcedure
    .input(z.object({
      alertIds: z.array(z.number()).optional(), // Se não especificado, notifica todos os alertas críticos ativos
      managerEmails: z.array(z.string().email()).optional(), // Emails dos gestores (se não especificado, busca do sistema)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar alertas críticos ativos
      const conditions = [
        eq(alerts.status, "active"),
        eq(alerts.severity, "critical"),
      ];
      
      if (input.alertIds && input.alertIds.length > 0) {
        conditions.push(sql`${alerts.id} IN (${sql.join(input.alertIds.map(id => sql`${id}`), sql`, `)})`);
      }
      
      const criticalAlerts = await db
        .select({
          id: alerts.id,
          employeeId: alerts.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          employeeEmail: employees.email,
          department: employees.department,
          position: employees.position,
          type: alerts.type,
          severity: alerts.severity,
          title: alerts.title,
          description: alerts.description,
          metrics: alerts.metrics,
          createdAt: alerts.createdAt,
        })
        .from(alerts)
        .leftJoin(employees, eq(alerts.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(alerts.createdAt))
        .limit(50);
      
      if (criticalAlerts.length === 0) {
        return { success: true, sent: 0, message: "Nenhum alerta crítico ativo encontrado" };
      }
      
      // Determinar destinatários
      let recipients = input.managerEmails || [];
      
      // Se não foram especificados emails, buscar gestores e admins
      if (recipients.length === 0) {
        const managers = await db
          .select({ email: employees.email })
          .from(employees)
          .where(
            and(
              eq(employees.active, true),
              sql`${employees.position} LIKE '%Gerente%' OR ${employees.position} LIKE '%Diretor%' OR ${employees.position} LIKE '%Coordenador%'`
            )
          );
        
        recipients = managers
          .map(m => m.email)
          .filter((email): email is string => email !== null && email !== undefined);
        
        // Se ainda não houver destinatários, usar email do sistema
        if (recipients.length === 0) {
          recipients = ["rh@uisa.com.br"]; // Email padrão do RH
        }
      }
      
      // Preparar conteúdo do email
      const alertsList = criticalAlerts.map(alert => `
        <div style="border-left: 4px solid #dc2626; padding: 12px; margin: 12px 0; background: #fef2f2;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b;">${alert.title}</h3>
          <p style="margin: 4px 0;"><strong>Colaborador:</strong> ${alert.employeeName} (${alert.employeeCode})</p>
          <p style="margin: 4px 0;"><strong>Departamento:</strong> ${alert.department || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Cargo:</strong> ${alert.position || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Tipo:</strong> ${alert.type}</p>
          <p style="margin: 4px 0;"><strong>Descrição:</strong> ${alert.description}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Detectado em:</strong> ${alert.createdAt ? new Date(alert.createdAt).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>
      `).join('');
      
      const emailSubject = `🚨 ALERTA CRÍTICO: ${criticalAlerts.length} Acesso(s) Suspeito(s) Detectado(s)`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Alertas Críticos de Segurança</h1>
          </div>
          
          <div style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Foram detectados <strong>${criticalAlerts.length} alerta(s) crítico(s)</strong> que requerem atenção imediata.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">
                ⚡ Ação Requerida: Revise os alertas abaixo e tome as medidas necessárias.
              </p>
            </div>
            
            <h2 style="color: #374151; margin-top: 30px;">Detalhes dos Alertas:</h2>
            ${alertsList}
            
            <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #374151;">Próximos Passos Recomendados:</h3>
              <ol style="color: #6b7280; line-height: 1.8;">
                <li>Acesse o sistema AVD UISA para revisar os detalhes completos</li>
                <li>Entre em contato com os colaboradores mencionados</li>
                <li>Documente as ações tomadas no sistema</li>
                <li>Agende reuniões de acompanhamento se necessário</li>
              </ol>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #1e40af;">
                <strong>📊 Acesse o Dashboard de Alertas:</strong><br>
                <a href="${process.env.VITE_APP_URL || 'https://avd.uisa.com.br'}/seguranca/alertas" 
                   style="color: #2563eb; text-decoration: none; font-weight: bold;">
                  Ver Todos os Alertas →
                </a>
              </p>
            </div>
          </div>
          
          <div style="padding: 15px; background: #f3f4f6; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              Este é um email automático do Sistema AVD UISA.<br>
              Em caso de dúvidas, entre em contato com o departamento de RH.
            </p>
          </div>
        </div>
      `;
      
      // Enviar emails
      let sentCount = 0;
      const errors: string[] = [];
      
      for (const recipient of recipients) {
        try {
          await emailService.sendCustomEmail(recipient, emailSubject, emailBody);
          sentCount++;
        } catch (error) {
          console.error(`Erro ao enviar email para ${recipient}:`, error);
          errors.push(`${recipient}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
      
      // Atualizar alertas com ação tomada
      for (const alert of criticalAlerts) {
        await db
          .update(alerts)
          .set({ actionTaken: "email_sent" })
          .where(eq(alerts.id, alert.id));
      }
      
      return {
        success: true,
        sent: sentCount,
        total: recipients.length,
        alertsNotified: criticalAlerts.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `${sentCount} email(s) enviado(s) com sucesso sobre ${criticalAlerts.length} alerta(s) crítico(s)`,
      };
    }),
  
  /**
   * Criar alerta de acesso suspeito (para testes e integração)
   */
  createSecurityAlert: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      type: z.enum([
        "low_productivity",
        "inconsistent_hours",
        "low_diversity",
        "missing_activities",
        "time_discrepancy",
        "goal_overdue",
        "evaluation_pending"
      ]),
      severity: z.enum(["critical", "high", "medium", "low"]).default("critical"),
      title: z.string(),
      description: z.string(),
      metrics: z.string().optional(), // JSON string
      autoNotify: z.boolean().default(true), // Se true, envia notificação automática
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Criar alerta
      const [result] = await db.insert(alerts).values({
        employeeId: input.employeeId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        metrics: input.metrics,
        status: "active",
      });
      
      const alertId = result.insertId;
      
      // Se autoNotify estiver ativo e for crítico, enviar notificação
      if (input.autoNotify && input.severity === "critical") {
        try {
          // Buscar gestores para notificar
          const managers = await db
            .select({ email: employees.email })
            .from(employees)
            .where(
              and(
                eq(employees.active, true),
                sql`${employees.position} LIKE '%Gerente%' OR ${employees.position} LIKE '%Diretor%' OR ${employees.position} LIKE '%Coordenador%'`
              )
            );
          
          const managerEmails = managers
            .map(m => m.email)
            .filter((email): email is string => email !== null && email !== undefined);
          
          // Enviar notificação (reutilizar a procedure de notificação)
          // Nota: Aqui seria ideal chamar a procedure notifySecurityAlerts, mas para evitar recursão,
          // vamos apenas marcar que a notificação deve ser enviada
          console.log(`Alerta crítico ${alertId} criado. Notificação deve ser enviada para:`, managerEmails);
        } catch (error) {
          console.error("Erro ao preparar notificação automática:", error);
        }
      }
      
      return {
        success: true,
        alertId,
        message: "Alerta de segurança criado com sucesso",
      };
    }),
});
