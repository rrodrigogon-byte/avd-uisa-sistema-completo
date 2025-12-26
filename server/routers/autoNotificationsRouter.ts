/**
 * Auto Notifications Router
 * Procedures tRPC para sistema de notificações automáticas
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { sendEmail } from "../emailService";

export const autoNotificationsRouter = router({
  /**
   * Criar regra de notificação
   */
  createRule: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        triggerEvent: z.enum([
          "novo_anexo",
          "mudanca_pir_significativa",
          "mudanca_pir_critica",
          "meta_concluida",
          "meta_atrasada",
          "avaliacao_360_concluida",
          "novo_feedback",
          "competencia_atualizada",
          "pdi_atualizado",
        ]),
        conditions: z.record(z.any()),
        pirChangeThreshold: z.number().optional(),
        pirChangeDirection: z.enum(["qualquer", "melhoria", "declinio"]).optional(),
        notifyEmployee: z.boolean().default(false),
        notifyDirectManager: z.boolean().default(true),
        notifyHR: z.boolean().default(false),
        notifyCustomEmails: z.array(z.string().email()).optional(),
        sendEmail: z.boolean().default(true),
        sendInApp: z.boolean().default(true),
        sendPush: z.boolean().default(false),
        emailSubjectTemplate: z.string().optional(),
        emailBodyTemplate: z.string().optional(),
        inAppMessageTemplate: z.string().optional(),
        maxNotificationsPerDay: z.number().default(10),
        cooldownMinutes: z.number().default(60),
        activeFrom: z.date().optional(),
        activeUntil: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ruleId = await db.createNotificationRule({
        ...input,
        conditions: JSON.stringify(input.conditions),
        notifyCustomEmails: input.notifyCustomEmails ? JSON.stringify(input.notifyCustomEmails) : null,
        createdBy: ctx.user.id,
        active: true,
      });
      
      return { ruleId };
    }),

  /**
   * Listar regras de notificação
   */
  listRules: protectedProcedure.input(z.object({})).query(async () => {
    const rules = await db.getActiveNotificationRules();
    
    return rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      triggerEvent: rule.triggerEvent,
      notifyEmployee: rule.notifyEmployee,
      notifyDirectManager: rule.notifyDirectManager,
      notifyHR: rule.notifyHR,
      sendEmail: rule.sendEmail,
      sendInApp: rule.sendInApp,
      active: rule.active,
      createdAt: rule.createdAt,
    }));
  }),

  /**
   * Disparar notificação manualmente
   */
  triggerNotification: protectedProcedure
    .input(
      z.object({
        triggerEvent: z.string(),
        eventData: z.record(z.any()),
        recipientUserId: z.number().optional(),
        recipientEmail: z.string().email().optional(),
        subject: z.string(),
        body: z.string(),
        channel: z.enum(["email", "in_app", "push"]),
        priority: z.enum(["baixa", "normal", "alta", "urgente"]).default("normal"),
      })
    )
    .mutation(async ({ input }) => {
      const queueId = await db.enqueueNotification({
        triggerEvent: input.triggerEvent,
        eventData: JSON.stringify(input.eventData),
        recipientUserId: input.recipientUserId,
        recipientEmail: input.recipientEmail,
        recipientName: null,
        subject: input.subject,
        body: input.body,
        channel: input.channel,
        priority: input.priority,
        status: "pendente",
      });
      
      return { queueId };
    }),

  /**
   * Processar fila de notificações
   */
  processQueue: protectedProcedure.input(z.object({})).mutation(async () => {
    const pending = await db.getPendingNotifications(50);
    
    let processed = 0;
    let sent = 0;
    let failed = 0;
    
    for (const notification of pending) {
      processed++;
      
      try {
        // Marcar como processando
        await db.updateNotificationQueueStatus(notification.id, "processando");
        
        // Verificar se usuário deve receber notificação
        if (notification.recipientUserId) {
          const shouldNotify = await db.shouldNotifyUser(
            notification.recipientUserId,
            notification.triggerEvent,
            notification.channel
          );
          
          if (!shouldNotify) {
            await db.updateNotificationQueueStatus(notification.id, "cancelado");
            continue;
          }
        }
        
        // Enviar notificação
        if (notification.channel === "email" && notification.recipientEmail) {
          const emailResult = await sendEmail({
            to: notification.recipientEmail,
            subject: notification.subject,
            html: notification.body,
          });
          
          if (emailResult.success) {
            await db.updateNotificationQueueStatus(notification.id, "enviado");
            sent++;
            
            // Registrar no histórico
            await db.createNotificationHistory({
              queueId: notification.id,
              ruleId: notification.ruleId,
              recipientUserId: notification.recipientUserId,
              recipientEmail: notification.recipientEmail,
              subject: notification.subject,
              body: notification.body,
              channel: notification.channel,
              status: "enviado",
            });
          } else {
            throw new Error(emailResult.error || "Falha ao enviar email");
          }
        } else if (notification.channel === "in_app") {
          // Criar notificação in-app (usar sistema de notificações existente)
          await db.updateNotificationQueueStatus(notification.id, "enviado");
          sent++;
          
          await db.createNotificationHistory({
            queueId: notification.id,
            ruleId: notification.ruleId,
            recipientUserId: notification.recipientUserId,
            recipientEmail: notification.recipientEmail,
            subject: notification.subject,
            body: notification.body,
            channel: notification.channel,
            status: "enviado",
          });
        }
      } catch (error) {
        failed++;
        await db.updateNotificationQueueStatus(
          notification.id,
          "falha",
          error instanceof Error ? error.message : "Erro desconhecido"
        );
      }
    }
    
    return {
      processed,
      sent,
      failed,
    };
  }),

  /**
   * Buscar histórico de notificações do usuário
   */
  getMyNotificationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    .optional())
    .query(async ({ input, ctx }) => {
      const history = await db.getUserNotificationHistory(ctx.user.id, input.limit);
      
      return history.map(h => ({
        id: h.id,
        subject: h.subject,
        body: h.body,
        channel: h.channel,
        status: h.status,
        opened: h.opened,
        openedAt: h.openedAt,
        sentAt: h.sentAt,
      }));
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsOpened(input.notificationId);
      return { success: true };
    }),

  /**
   * Buscar preferências de notificação
   */
  getMyPreferences: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const prefs = await db.getUserNotificationPreferences(ctx.user.id);
    return prefs;
  }),

  /**
   * Atualizar preferências de notificação
   */
  updateMyPreferences: protectedProcedure
    .input(
      z.object({
        notifyNewAttachment: z.boolean().optional(),
        notifyPirChanges: z.boolean().optional(),
        notifyGoalUpdates: z.boolean().optional(),
        notify360Completion: z.boolean().optional(),
        notifyFeedback: z.boolean().optional(),
        notifyPdiUpdates: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        digestMode: z.boolean().optional(),
        digestFrequency: z.enum(["diario", "semanal"]).optional(),
      })
    .optional())
    .mutation(async ({ input, ctx }) => {
      await db.updateUserNotificationPreferences(ctx.user.id, input);
      return { success: true };
    }),

  /**
   * Notificar sobre novo anexo
   */
  notifyNewAttachment: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        attachmentId: z.number(),
        attachmentName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Buscar regras para novo anexo
      const rules = await db.getNotificationRulesByEvent("novo_anexo");
      
      for (const rule of rules) {
        // Buscar funcionário e gestor
        const employee = await db.getEmployeeById(input.employeeId);
        if (!employee) continue;
        
        // Notificar gestor direto
        if (rule.notifyDirectManager && employee.managerId) {
          const manager = await db.getEmployeeById(employee.managerId);
          if (manager && manager.email) {
            await db.enqueueNotification({
              ruleId: rule.id,
              triggerEvent: "novo_anexo",
              eventData: JSON.stringify(input),
              recipientEmail: manager.email,
              recipientName: manager.name,
              subject: rule.emailSubjectTemplate || `Novo anexo adicionado - ${employee.name}`,
              body: rule.emailBodyTemplate || `O funcionário ${employee.name} adicionou um novo anexo: ${input.attachmentName}`,
              channel: "email",
              priority: "normal",
              status: "pendente",
            });
          }
        }
        
        // Notificar RH
        if (rule.notifyHR) {
          const hrUsers = await db.getUsersByRole("rh");
          for (const hrUser of hrUsers) {
            if (hrUser.email) {
              await db.enqueueNotification({
                ruleId: rule.id,
                triggerEvent: "novo_anexo",
                eventData: JSON.stringify(input),
                recipientUserId: hrUser.id,
                recipientEmail: hrUser.email,
                recipientName: hrUser.name,
                subject: rule.emailSubjectTemplate || `Novo anexo adicionado - ${employee.name}`,
                body: rule.emailBodyTemplate || `O funcionário ${employee.name} adicionou um novo anexo: ${input.attachmentName}`,
                channel: "email",
                priority: "normal",
                status: "pendente",
              });
            }
          }
        }
      }
      
      return { success: true };
    }),

  /**
   * Notificar sobre mudança significativa no PIR
   */
  notifyPirChange: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        pirAssessmentId: z.number(),
        previousScore: z.number(),
        currentScore: z.number(),
        changePercent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Determinar tipo de mudança
      const isCritical = Math.abs(input.changePercent) >= 30;
      const isSignificant = Math.abs(input.changePercent) >= 15;
      
      if (!isSignificant) {
        return { success: true, notified: false };
      }
      
      const eventType = isCritical ? "mudanca_pir_critica" : "mudanca_pir_significativa";
      const rules = await db.getNotificationRulesByEvent(eventType);
      
      for (const rule of rules) {
        // Verificar threshold da regra
        if (rule.pirChangeThreshold && Math.abs(input.changePercent) < rule.pirChangeThreshold) {
          continue;
        }
        
        // Verificar direção da mudança
        if (rule.pirChangeDirection) {
          if (rule.pirChangeDirection === "melhoria" && input.changePercent < 0) continue;
          if (rule.pirChangeDirection === "declinio" && input.changePercent > 0) continue;
        }
        
        // Buscar funcionário
        const employee = await db.getEmployeeById(input.employeeId);
        if (!employee) continue;
        
        const changeDirection = input.changePercent > 0 ? "melhoria" : "declínio";
        const subject = `${isCritical ? "⚠️ Mudança Crítica" : "📊 Mudança Significativa"} no PIR - ${employee.name}`;
        const body = `
          <h2>Mudança ${isCritical ? "Crítica" : "Significativa"} Detectada no PIR</h2>
          <p><strong>Funcionário:</strong> ${employee.name}</p>
          <p><strong>Score Anterior:</strong> ${input.previousScore}</p>
          <p><strong>Score Atual:</strong> ${input.currentScore}</p>
          <p><strong>Mudança:</strong> ${input.changePercent > 0 ? "+" : ""}${input.changePercent}% (${changeDirection})</p>
          <p>Esta mudança requer atenção ${isCritical ? "imediata" : ""}.</p>
        `;
        
        // Notificar gestor
        if (rule.notifyDirectManager && employee.managerId) {
          const manager = await db.getEmployeeById(employee.managerId);
          if (manager && manager.email) {
            await db.enqueueNotification({
              ruleId: rule.id,
              triggerEvent: eventType,
              eventData: JSON.stringify(input),
              recipientEmail: manager.email,
              recipientName: manager.name,
              subject,
              body,
              channel: "email",
              priority: isCritical ? "alta" : "normal",
              status: "pendente",
            });
          }
        }
        
        // Notificar RH
        if (rule.notifyHR) {
          const hrUsers = await db.getUsersByRole("rh");
          for (const hrUser of hrUsers) {
            if (hrUser.email) {
              await db.enqueueNotification({
                ruleId: rule.id,
                triggerEvent: eventType,
                eventData: JSON.stringify(input),
                recipientUserId: hrUser.id,
                recipientEmail: hrUser.email,
                recipientName: hrUser.name,
                subject,
                body,
                channel: "email",
                priority: isCritical ? "alta" : "normal",
                status: "pendente",
              });
            }
          }
        }
      }
      
      return { success: true, notified: true };
    }),
});
