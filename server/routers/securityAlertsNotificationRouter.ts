import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or } from "drizzle-orm";
import {
  pirIntegritySuspiciousAccessLogs,
  employees,
  users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../emailService";
import { ENV } from "../_core/env";

/**
 * Router para Notificações Automáticas de Alertas de Segurança
 * Envia emails automáticos para alertas críticos não resolvidos
 */
export const securityAlertsNotificationRouter = router({
  /**
   * Verificar alertas críticos e enviar notificações
   * Esta procedure é chamada pelo job agendado
   */
  checkAndNotifyCriticalAlerts: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Buscar alertas críticos não resolvidos das últimas 24 horas
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const criticalAlerts = await db
          .select({
            alert: pirIntegritySuspiciousAccessLogs,
            employee: employees,
          })
          .from(pirIntegritySuspiciousAccessLogs)
          .leftJoin(employees, eq(pirIntegritySuspiciousAccessLogs.employeeId, employees.id))
          .where(
            and(
              eq(pirIntegritySuspiciousAccessLogs.severity, "critical"),
              eq(pirIntegritySuspiciousAccessLogs.status, "pending"),
              gte(pirIntegritySuspiciousAccessLogs.detectedAt, oneDayAgo)
            )
          )
          .orderBy(desc(pirIntegritySuspiciousAccessLogs.detectedAt))
          .limit(50);

        if (criticalAlerts.length === 0) {
          return {
            success: true,
            message: "Nenhum alerta crítico pendente encontrado",
            alertsProcessed: 0,
          };
        }

        // Agrupar alertas por tipo para o relatório
        const alertsByType: Record<string, number> = {};
        criticalAlerts.forEach(({ alert }) => {
          alertsByType[alert.anomalyType] = (alertsByType[alert.anomalyType] || 0) + 1;
        });

        // Preparar conteúdo do email
        const emailSubject = `🚨 ALERTA: ${criticalAlerts.length} Alertas Críticos de Segurança Detectados`;
        
        let emailBody = `
          <h2 style="color: #dc2626;">Alertas Críticos de Segurança</h2>
          <p>Foram detectados <strong>${criticalAlerts.length} alertas críticos</strong> de segurança nas últimas 24 horas que requerem atenção imediata.</p>
          
          <h3>Resumo por Tipo de Anomalia:</h3>
          <ul>
        `;

        const anomalyTypeLabels: Record<string, string> = {
          fast_responses: "Respostas Muito Rápidas",
          pattern_detected: "Padrão Suspeito Detectado",
          multiple_sessions: "Múltiplas Sessões Simultâneas",
          unusual_time: "Horário Incomum de Acesso",
          browser_switch: "Troca de Navegador",
          copy_paste: "Cópia e Cola Detectada",
          tab_switch: "Troca de Abas Frequente",
          other: "Outros",
        };

        Object.entries(alertsByType).forEach(([type, count]) => {
          const label = anomalyTypeLabels[type] || type;
          emailBody += `<li><strong>${label}:</strong> ${count} ocorrência(s)</li>`;
        });

        emailBody += `
          </ul>
          
          <h3>Detalhes dos Alertas:</h3>
          <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Colaborador</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tipo</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
        `;

        criticalAlerts.forEach(({ alert, employee }) => {
          const employeeName = employee?.name || `ID ${alert.employeeId}`;
          const typeLabel = anomalyTypeLabels[alert.anomalyType] || alert.anomalyType;
          const detectedAt = new Date(alert.detectedAt).toLocaleString('pt-BR');
          
          emailBody += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${alert.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${employeeName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${typeLabel}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${alert.description}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${detectedAt}</td>
            </tr>
          `;
        });

        emailBody += `
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Ação Requerida:</strong> Por favor, acesse o Dashboard de Alertas de Segurança para revisar e tomar as ações apropriadas sobre estes alertas.
            </p>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Este é um email automático gerado pelo Sistema AVD UISA. Para mais informações, acesse o sistema.
          </p>
        `;

        // Enviar email para o proprietário do sistema
        const ownerEmail = ENV.smtpUser; // Usar email do SMTP como fallback
        
        await sendEmail({
          to: ownerEmail,
          subject: emailSubject,
          html: emailBody,
        });

        // Marcar alertas como notificados (adicionar campo se necessário)
        // Por enquanto, apenas retornar sucesso
        
        return {
          success: true,
          message: `Email enviado com sucesso para ${ownerEmail}`,
          alertsProcessed: criticalAlerts.length,
          alertsByType,
        };
      } catch (error) {
        console.error("Erro ao processar alertas críticos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao processar alertas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Obter estatísticas de alertas para o dashboard
   */
  getAlertStatistics: protectedProcedure
    .input(z.object({
      days: z.number().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Total de alertas no período
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(gte(pirIntegritySuspiciousAccessLogs.detectedAt, startDate));

      // Alertas críticos pendentes
      const [criticalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(
          and(
            eq(pirIntegritySuspiciousAccessLogs.severity, "critical"),
            eq(pirIntegritySuspiciousAccessLogs.status, "pending"),
            gte(pirIntegritySuspiciousAccessLogs.detectedAt, startDate)
          )
        );

      // Alertas por severidade
      const alertsBySeverity = await db
        .select({
          severity: pirIntegritySuspiciousAccessLogs.severity,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(gte(pirIntegritySuspiciousAccessLogs.detectedAt, startDate))
        .groupBy(pirIntegritySuspiciousAccessLogs.severity);

      // Alertas por tipo
      const alertsByType = await db
        .select({
          anomalyType: pirIntegritySuspiciousAccessLogs.anomalyType,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegritySuspiciousAccessLogs)
        .where(gte(pirIntegritySuspiciousAccessLogs.detectedAt, startDate))
        .groupBy(pirIntegritySuspiciousAccessLogs.anomalyType);

      return {
        total: totalResult?.count || 0,
        criticalPending: criticalResult?.count || 0,
        bySeverity: alertsBySeverity,
        byType: alertsByType,
        period: input.days,
      };
    }),

  /**
   * Testar envio de email de notificação
   * Útil para validar configuração de SMTP
   */
  testNotificationEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const testEmailSubject = "🧪 Teste de Notificação de Alertas de Segurança";
        const testEmailBody = `
          <h2>Teste de Notificação</h2>
          <p>Este é um email de teste para validar o sistema de notificações automáticas de alertas de segurança.</p>
          <p>Se você recebeu este email, o sistema está configurado corretamente.</p>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Email enviado por: ${ctx.user?.name || "Sistema AVD UISA"}
          </p>
        `;

        const ownerEmail = ENV.smtpUser;
        
        await sendEmail({
          to: ownerEmail,
          subject: testEmailSubject,
          html: testEmailBody,
        });

        return {
          success: true,
          message: `Email de teste enviado com sucesso para ${ownerEmail}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao enviar email de teste: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),
});
