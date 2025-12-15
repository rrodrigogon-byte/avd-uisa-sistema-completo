/**
 * Notification Worker
 * Processa fila de notificações automaticamente em background
 */

import * as db from "./db";
import { sendEmail } from "./emailService";

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Iniciar worker de notificações
 */
export function startNotificationWorker(intervalMs = 60000) {
  if (workerInterval) {
    console.log("[Notification Worker] Already running");
    return;
  }
  
  console.log(`[Notification Worker] Starting with interval of ${intervalMs}ms`);
  
  // Processar imediatamente
  processNotificationQueue();
  
  // Processar periodicamente
  workerInterval = setInterval(() => {
    processNotificationQueue();
  }, intervalMs);
}

/**
 * Parar worker de notificações
 */
export function stopNotificationWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log("[Notification Worker] Stopped");
  }
}

/**
 * Processar fila de notificações
 */
export async function processNotificationQueue() {
  if (isProcessing) {
    console.log("[Notification Worker] Already processing, skipping...");
    return;
  }
  
  isProcessing = true;
  
  try {
    const pending = await db.getPendingNotifications(50);
    
    if (pending.length === 0) {
      return;
    }
    
    console.log(`[Notification Worker] Processing ${pending.length} notifications`);
    
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
            console.log(`[Notification Worker] Notification ${notification.id} canceled (user preferences)`);
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
            
            console.log(`[Notification Worker] Email sent to ${notification.recipientEmail}`);
          } else {
            throw new Error(emailResult.error || "Falha ao enviar email");
          }
        } else if (notification.channel === "in_app") {
          // Criar notificação in-app
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
          
          console.log(`[Notification Worker] In-app notification created for user ${notification.recipientUserId}`);
        } else if (notification.channel === "push") {
          // Push notifications (implementar futuramente)
          await db.updateNotificationQueueStatus(notification.id, "enviado");
          sent++;
          
          console.log(`[Notification Worker] Push notification sent to user ${notification.recipientUserId}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        
        await db.updateNotificationQueueStatus(
          notification.id,
          "falha",
          errorMessage
        );
        
        console.error(`[Notification Worker] Error processing notification ${notification.id}:`, error);
      }
    }
    
    console.log(`[Notification Worker] Batch complete: ${processed} processed, ${sent} sent, ${failed} failed`);
  } catch (error) {
    console.error("[Notification Worker] Error processing queue:", error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Monitorar mudanças em PIR e disparar notificações
 */
export async function monitorPIRChanges() {
  try {
    // Buscar avaliações PIR recentes (últimas 24 horas)
    const database = await db.getDb();
    if (!database) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentAssessments = await database
      .select()
      .from(db.pirAssessments)
      .where(db.gte(db.pirAssessments.completedAt, yesterday))
      .orderBy(db.desc(db.pirAssessments.completedAt));
    
    for (const assessment of recentAssessments) {
      if (!assessment.employeeId || !assessment.overallScore) continue;
      
      // Buscar avaliação anterior
      const previousAssessments = await database
        .select()
        .from(db.pirAssessments)
        .where(
          db.and(
            db.eq(db.pirAssessments.employeeId, assessment.employeeId),
            db.lt(db.pirAssessments.id, assessment.id)
          )
        )
        .orderBy(db.desc(db.pirAssessments.completedAt))
        .limit(1);
      
      if (previousAssessments.length === 0) continue;
      
      const previousScore = previousAssessments[0].overallScore;
      if (!previousScore) continue;
      
      // Calcular mudança percentual
      const changePercent = Math.round(
        ((assessment.overallScore - previousScore) / previousScore) * 100
      );
      
      // Verificar se mudança é significativa
      if (Math.abs(changePercent) >= 15) {
        // Buscar regras aplicáveis
        const isCritical = Math.abs(changePercent) >= 30;
        const eventType = isCritical ? "mudanca_pir_critica" : "mudanca_pir_significativa";
        
        const rules = await db.getNotificationRulesByEvent(eventType);
        
        for (const rule of rules) {
          // Verificar threshold da regra
          if (rule.pirChangeThreshold && Math.abs(changePercent) < rule.pirChangeThreshold) {
            continue;
          }
          
          // Verificar direção da mudança
          if (rule.pirChangeDirection) {
            if (rule.pirChangeDirection === "melhoria" && changePercent < 0) continue;
            if (rule.pirChangeDirection === "declinio" && changePercent > 0) continue;
          }
          
          // Buscar funcionário
          const employee = await db.getEmployeeById(assessment.employeeId);
          if (!employee) continue;
          
          const changeDirection = changePercent > 0 ? "melhoria" : "declínio";
          const subject = `${isCritical ? "⚠️ Mudança Crítica" : "📊 Mudança Significativa"} no PIR - ${employee.name}`;
          const body = `
            <h2>Mudança ${isCritical ? "Crítica" : "Significativa"} Detectada no PIR</h2>
            <p><strong>Funcionário:</strong> ${employee.name}</p>
            <p><strong>Score Anterior:</strong> ${previousScore}</p>
            <p><strong>Score Atual:</strong> ${assessment.overallScore}</p>
            <p><strong>Mudança:</strong> ${changePercent > 0 ? "+" : ""}${changePercent}% (${changeDirection})</p>
            <p>Esta mudança requer atenção ${isCritical ? "imediata" : ""}.</p>
          `;
          
          // Notificar gestor
          if (rule.notifyDirectManager && employee.managerId) {
            const manager = await db.getEmployeeById(employee.managerId);
            if (manager && manager.email) {
              await db.enqueueNotification({
                ruleId: rule.id,
                triggerEvent: eventType,
                eventData: JSON.stringify({
                  employeeId: assessment.employeeId,
                  pirAssessmentId: assessment.id,
                  previousScore,
                  currentScore: assessment.overallScore,
                  changePercent,
                }),
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
                  eventData: JSON.stringify({
                    employeeId: assessment.employeeId,
                    pirAssessmentId: assessment.id,
                    previousScore,
                    currentScore: assessment.overallScore,
                    changePercent,
                  }),
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
      }
    }
  } catch (error) {
    console.error("[Notification Worker] Error monitoring PIR changes:", error);
  }
}

/**
 * Monitorar novos anexos e disparar notificações
 */
export async function monitorNewAttachments() {
  try {
    const database = await db.getDb();
    if (!database) return;
    
    // Buscar anexos recentes (última hora)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentAttachments = await database
      .select()
      .from(db.employeeAttachments)
      .where(db.gte(db.employeeAttachments.uploadedAt, oneHourAgo))
      .orderBy(db.desc(db.employeeAttachments.uploadedAt));
    
    for (const attachment of recentAttachments) {
      // Verificar se já foi notificado
      const existingNotification = await database
        .select()
        .from(db.notificationQueue)
        .where(
          db.and(
            db.eq(db.notificationQueue.triggerEvent, "novo_anexo"),
            db.like(db.notificationQueue.eventData, `%"attachmentId":${attachment.id}%`)
          )
        )
        .limit(1);
      
      if (existingNotification.length > 0) continue;
      
      // Buscar regras para novo anexo
      const rules = await db.getNotificationRulesByEvent("novo_anexo");
      
      for (const rule of rules) {
        const employee = await db.getEmployeeById(attachment.employeeId);
        if (!employee) continue;
        
        // Notificar gestor direto
        if (rule.notifyDirectManager && employee.managerId) {
          const manager = await db.getEmployeeById(employee.managerId);
          if (manager && manager.email) {
            await db.enqueueNotification({
              ruleId: rule.id,
              triggerEvent: "novo_anexo",
              eventData: JSON.stringify({
                employeeId: attachment.employeeId,
                attachmentId: attachment.id,
                attachmentName: attachment.fileName,
              }),
              recipientEmail: manager.email,
              recipientName: manager.name,
              subject: rule.emailSubjectTemplate || `Novo anexo adicionado - ${employee.name}`,
              body: rule.emailBodyTemplate || `O funcionário ${employee.name} adicionou um novo anexo: ${attachment.fileName}`,
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
                eventData: JSON.stringify({
                  employeeId: attachment.employeeId,
                  attachmentId: attachment.id,
                  attachmentName: attachment.fileName,
                }),
                recipientUserId: hrUser.id,
                recipientEmail: hrUser.email,
                recipientName: hrUser.name,
                subject: rule.emailSubjectTemplate || `Novo anexo adicionado - ${employee.name}`,
                body: rule.emailBodyTemplate || `O funcionário ${employee.name} adicionou um novo anexo: ${attachment.fileName}`,
                channel: "email",
                priority: "normal",
                status: "pendente",
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[Notification Worker] Error monitoring attachments:", error);
  }
}

// Iniciar monitoramento periódico
export function startMonitoring() {
  console.log("[Notification Worker] Starting monitoring services");
  
  // Monitorar PIR a cada 5 minutos
  setInterval(() => {
    monitorPIRChanges();
  }, 5 * 60 * 1000);
  
  // Monitorar anexos a cada 10 minutos
  setInterval(() => {
    monitorNewAttachments();
  }, 10 * 60 * 1000);
  
  // Executar imediatamente
  monitorPIRChanges();
  monitorNewAttachments();
}
