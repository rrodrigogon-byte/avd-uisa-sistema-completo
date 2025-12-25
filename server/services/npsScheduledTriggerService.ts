import { getDb } from "../db";
import { 
  npsSurveys, 
  npsResponses, 
  npsScheduledTriggers,
  npsSettings,
  npsDetractorAlerts,
  avdAssessmentProcesses, 
  employees 
} from "../../drizzle/schema";
import { eq, and, desc, lte, isNull } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Serviço de Trigger Automático de NPS com Agendamento
 * Dispara pesquisas NPS automaticamente após PDI com delay configurável
 */

export interface ScheduledTriggerResult {
  success: boolean;
  triggerId?: number;
  surveyId?: number;
  employeeId?: number;
  processId?: number;
  scheduledFor?: Date;
  message: string;
}

/**
 * Obter configurações globais de NPS
 */
export async function getNpsSettings(): Promise<typeof npsSettings.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const [settings] = await db.select().from(npsSettings).limit(1);
  
  if (!settings) {
    // Criar configurações padrão se não existir
    await db.insert(npsSettings).values({
      autoTriggerEnabled: true,
      defaultDelayMinutes: 1440, // 24 horas
      reminderEnabled: true,
      reminderDelayMinutes: 4320, // 72 horas
      maxReminders: 2,
      detractorAlertEnabled: true,
      detractorThreshold: 6,
      surveyExpirationDays: 7,
    });
    
    const [newSettings] = await db.select().from(npsSettings).limit(1);
    return newSettings || null;
  }

  return settings;
}

/**
 * Agendar trigger de NPS após conclusão do PDI
 */
export async function scheduleNpsTriggerAfterPDI(
  processId: number,
  employeeId: number,
  delayMinutesOverride?: number
): Promise<ScheduledTriggerResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database não disponível" };
  }

  try {
    // Buscar configurações
    const settings = await getNpsSettings();
    if (!settings?.autoTriggerEnabled) {
      return { success: false, message: "Trigger automático de NPS está desabilitado" };
    }

    // Buscar pesquisa NPS ativa para conclusão de processo
    const [survey] = await db.select()
      .from(npsSurveys)
      .where(and(
        eq(npsSurveys.status, "active"),
        eq(npsSurveys.triggerEvent, "process_completed")
      ))
      .limit(1);

    if (!survey) {
      return { success: false, message: "Nenhuma pesquisa NPS ativa para conclusão de processo" };
    }

    // Verificar se já existe trigger pendente
    const [existingTrigger] = await db.select()
      .from(npsScheduledTriggers)
      .where(and(
        eq(npsScheduledTriggers.surveyId, survey.id),
        eq(npsScheduledTriggers.employeeId, employeeId),
        eq(npsScheduledTriggers.processId, processId),
        eq(npsScheduledTriggers.status, "pending")
      ))
      .limit(1);

    if (existingTrigger) {
      return { 
        success: false, 
        message: "Já existe um trigger pendente para este processo",
        triggerId: existingTrigger.id
      };
    }

    // Calcular data de envio
    const delayMinutes = delayMinutesOverride ?? survey.delayMinutes ?? settings.defaultDelayMinutes ?? 1440;
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Criar trigger agendado
    const result = await db.insert(npsScheduledTriggers).values({
      surveyId: survey.id,
      employeeId,
      processId,
      scheduledFor,
      delayMinutes,
      status: "pending",
      triggerReason: "pdi_completed",
    });

    const triggerId = Number(result[0].insertId);

    return {
      success: true,
      triggerId,
      surveyId: survey.id,
      employeeId,
      processId,
      scheduledFor,
      message: `Pesquisa NPS agendada para ${scheduledFor.toLocaleString("pt-BR")}`,
    };
  } catch (error) {
    console.error("[NPS Scheduled Trigger] Erro ao agendar:", error);
    return { 
      success: false, 
      message: `Erro ao agendar: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}

/**
 * Processar triggers pendentes (chamado por job automático)
 */
export async function processPendingTriggers(): Promise<{
  processed: number;
  sent: number;
  errors: number;
  details: Array<{ triggerId: number; status: string; message: string }>;
}> {
  const db = await getDb();
  if (!db) {
    return { processed: 0, sent: 0, errors: 0, details: [] };
  }

  const now = new Date();
  const details: Array<{ triggerId: number; status: string; message: string }> = [];

  try {
    // Buscar triggers pendentes que já passaram do horário agendado
    const pendingTriggers = await db.select({
      trigger: npsScheduledTriggers,
      survey: npsSurveys,
      employee: employees,
    })
    .from(npsScheduledTriggers)
    .leftJoin(npsSurveys, eq(npsScheduledTriggers.surveyId, npsSurveys.id))
    .leftJoin(employees, eq(npsScheduledTriggers.employeeId, employees.id))
    .where(and(
      eq(npsScheduledTriggers.status, "pending"),
      lte(npsScheduledTriggers.scheduledFor, now)
    ));

    let sent = 0;
    let errors = 0;

    for (const { trigger, survey, employee } of pendingTriggers) {
      try {
        // Verificar se a pesquisa ainda está ativa
        if (survey?.status !== "active") {
          await db.update(npsScheduledTriggers)
            .set({ status: "cancelled" })
            .where(eq(npsScheduledTriggers.id, trigger.id));
          
          details.push({
            triggerId: trigger.id,
            status: "cancelled",
            message: "Pesquisa não está mais ativa",
          });
          continue;
        }

        // Verificar se já respondeu
        const [existingResponse] = await db.select()
          .from(npsResponses)
          .where(and(
            eq(npsResponses.surveyId, trigger.surveyId),
            eq(npsResponses.employeeId, trigger.employeeId),
            eq(npsResponses.processId, trigger.processId)
          ))
          .limit(1);

        if (existingResponse) {
          await db.update(npsScheduledTriggers)
            .set({ 
              status: "responded",
              responseId: existingResponse.id,
              respondedAt: existingResponse.createdAt,
            })
            .where(eq(npsScheduledTriggers.id, trigger.id));
          
          details.push({
            triggerId: trigger.id,
            status: "responded",
            message: "Funcionário já respondeu a pesquisa",
          });
          continue;
        }

        // Marcar como enviado
        await db.update(npsScheduledTriggers)
          .set({ 
            status: "sent",
            sentAt: now,
          })
          .where(eq(npsScheduledTriggers.id, trigger.id));

        sent++;
        details.push({
          triggerId: trigger.id,
          status: "sent",
          message: `Pesquisa enviada para ${employee?.name || 'Funcionário'}`,
        });

      } catch (triggerError) {
        errors++;
        details.push({
          triggerId: trigger.id,
          status: "error",
          message: triggerError instanceof Error ? triggerError.message : 'Erro desconhecido',
        });
      }
    }

    return {
      processed: pendingTriggers.length,
      sent,
      errors,
      details,
    };
  } catch (error) {
    console.error("[NPS Scheduled Trigger] Erro ao processar triggers:", error);
    return { processed: 0, sent: 0, errors: 1, details: [] };
  }
}

/**
 * Criar alerta de detrator e notificar admin
 */
export async function createDetractorAlert(
  responseId: number,
  employeeId: number,
  surveyId: number,
  score: number,
  comment?: string
): Promise<{ alertId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verificar configurações
    const settings = await getNpsSettings();
    if (!settings?.detractorAlertEnabled) {
      return null;
    }

    // Verificar se o score está abaixo do threshold
    if (score > (settings.detractorThreshold || 6)) {
      return null;
    }

    // Criar alerta
    const result = await db.insert(npsDetractorAlerts).values({
      responseId,
      employeeId,
      surveyId,
      score,
      comment,
      status: "new",
      notificationSentAt: new Date(),
    });

    const alertId = Number(result[0].insertId);

    // Buscar dados para notificação
    const [survey] = await db.select()
      .from(npsSurveys)
      .where(eq(npsSurveys.id, surveyId))
      .limit(1);

    const [employee] = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    // Notificar admin
    await notifyOwner({
      title: `🔴 Alerta de Detrator NPS - Score ${score}/10`,
      content: `
**Pesquisa:** ${survey?.name || 'Pesquisa NPS'}
**Funcionário:** ${employee?.name || 'Funcionário'}
**Score:** ${score}/10
**Categoria:** Detrator (0-6)
${comment ? `**Comentário:** ${comment}` : ''}

Este alerta foi gerado automaticamente pelo sistema de NPS.
Recomenda-se entrar em contato com o funcionário para entender os motivos da insatisfação.
      `.trim()
    });

    return { alertId };
  } catch (error) {
    console.error("[NPS Detractor Alert] Erro ao criar alerta:", error);
    return null;
  }
}

/**
 * Listar alertas de detratores pendentes
 */
export async function getPendingDetractorAlerts(): Promise<Array<{
  id: number;
  employeeId: number;
  employeeName: string;
  surveyName: string;
  score: number;
  comment: string | null;
  status: string;
  createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const alerts = await db.select({
      id: npsDetractorAlerts.id,
      employeeId: npsDetractorAlerts.employeeId,
      employeeName: employees.name,
      surveyName: npsSurveys.name,
      score: npsDetractorAlerts.score,
      comment: npsDetractorAlerts.comment,
      status: npsDetractorAlerts.status,
      createdAt: npsDetractorAlerts.createdAt,
    })
    .from(npsDetractorAlerts)
    .leftJoin(employees, eq(npsDetractorAlerts.employeeId, employees.id))
    .leftJoin(npsSurveys, eq(npsDetractorAlerts.surveyId, npsSurveys.id))
    .where(eq(npsDetractorAlerts.status, "new"))
    .orderBy(desc(npsDetractorAlerts.createdAt));

    return alerts.map(a => ({
      ...a,
      employeeName: a.employeeName || "Funcionário",
      surveyName: a.surveyName || "Pesquisa NPS",
    }));
  } catch (error) {
    console.error("[NPS Detractor Alert] Erro ao listar alertas:", error);
    return [];
  }
}

/**
 * Atualizar status de alerta de detrator
 */
export async function updateDetractorAlertStatus(
  alertId: number,
  status: "acknowledged" | "in_progress" | "resolved" | "dismissed",
  userId: number,
  notes?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, unknown> = { status };

    if (status === "acknowledged") {
      updateData.acknowledgedBy = userId;
      updateData.acknowledgedAt = new Date();
    } else if (status === "resolved" || status === "dismissed") {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date();
      if (notes) {
        updateData.resolutionNotes = notes;
      }
    }

    await db.update(npsDetractorAlerts)
      .set(updateData)
      .where(eq(npsDetractorAlerts.id, alertId));

    return true;
  } catch (error) {
    console.error("[NPS Detractor Alert] Erro ao atualizar status:", error);
    return false;
  }
}

/**
 * Verificar processos pendentes de NPS (para job automático)
 */
export async function checkPendingNpsProcesses(): Promise<{
  pendingCount: number;
  processes: Array<{
    processId: number;
    employeeId: number;
    employeeName: string;
    completedAt: Date;
    daysSinceCompletion: number;
  }>;
}> {
  const db = await getDb();
  if (!db) return { pendingCount: 0, processes: [] };

  try {
    // Buscar pesquisa NPS ativa
    const [survey] = await db.select()
      .from(npsSurveys)
      .where(and(
        eq(npsSurveys.status, "active"),
        eq(npsSurveys.triggerEvent, "process_completed")
      ))
      .limit(1);

    if (!survey) return { pendingCount: 0, processes: [] };

    // Buscar processos concluídos sem trigger e sem resposta
    const completedProcesses = await db.select({
      processId: avdAssessmentProcesses.id,
      employeeId: avdAssessmentProcesses.employeeId,
      employeeName: employees.name,
      completedAt: avdAssessmentProcesses.updatedAt,
    })
    .from(avdAssessmentProcesses)
    .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
    .leftJoin(
      npsScheduledTriggers,
      and(
        eq(npsScheduledTriggers.processId, avdAssessmentProcesses.id),
        eq(npsScheduledTriggers.surveyId, survey.id)
      )
    )
    .leftJoin(
      npsResponses,
      and(
        eq(npsResponses.processId, avdAssessmentProcesses.id),
        eq(npsResponses.surveyId, survey.id)
      )
    )
    .where(and(
      eq(avdAssessmentProcesses.currentStep, 5),
      eq(avdAssessmentProcesses.status, "concluido"),
      isNull(npsScheduledTriggers.id),
      isNull(npsResponses.id)
    ));

    const now = new Date();
    const processes = completedProcesses.map(p => ({
      processId: p.processId,
      employeeId: p.employeeId,
      employeeName: p.employeeName || "Funcionário",
      completedAt: p.completedAt,
      daysSinceCompletion: Math.floor((now.getTime() - new Date(p.completedAt).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return {
      pendingCount: processes.length,
      processes,
    };
  } catch (error) {
    console.error("[NPS Check] Erro ao verificar processos pendentes:", error);
    return { pendingCount: 0, processes: [] };
  }
}
