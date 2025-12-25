import { getDb } from "../db";
import { npsSurveys, npsResponses, avdAssessmentProcesses, employees } from "../../drizzle/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Serviço de Trigger Automático de NPS
 * Dispara pesquisas NPS automaticamente após eventos específicos
 */

export interface NPSTriggerResult {
  success: boolean;
  surveyId?: number;
  employeeId?: number;
  processId?: number;
  message: string;
  scheduledAt?: Date;
}

/**
 * Verifica se há pesquisa NPS ativa para um evento específico
 */
export async function getActiveSurveyForEvent(
  triggerEvent: "process_completed" | "step_completed" | "manual",
  stepNumber?: number
): Promise<typeof npsSurveys.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const conditions = [
    eq(npsSurveys.status, "active"),
    eq(npsSurveys.triggerEvent, triggerEvent),
  ];

  if (stepNumber !== undefined) {
    conditions.push(eq(npsSurveys.triggerStepNumber, stepNumber));
  }

  const [survey] = await db.select()
    .from(npsSurveys)
    .where(and(...conditions))
    .limit(1);

  return survey || null;
}

/**
 * Verifica se o funcionário já respondeu a pesquisa NPS para um processo específico
 */
export async function hasEmployeeRespondedNPS(
  surveyId: number,
  employeeId: number,
  processId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const conditions = [
    eq(npsResponses.surveyId, surveyId),
    eq(npsResponses.employeeId, employeeId),
  ];

  if (processId) {
    conditions.push(eq(npsResponses.processId, processId));
  }

  const [existing] = await db.select()
    .from(npsResponses)
    .where(and(...conditions))
    .limit(1);

  return !!existing;
}

/**
 * Trigger automático de NPS após conclusão do PDI (Passo 5)
 * Chamado automaticamente quando um processo AVD é finalizado
 */
export async function triggerNPSAfterPDICompletion(
  processId: number,
  employeeId: number
): Promise<NPSTriggerResult> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database não disponível" };
    }

    // Buscar pesquisa NPS ativa para conclusão de processo
    const survey = await getActiveSurveyForEvent("process_completed");
    
    if (!survey) {
      return { 
        success: false, 
        message: "Nenhuma pesquisa NPS ativa para conclusão de processo" 
      };
    }

    // Verificar se já respondeu
    const alreadyResponded = await hasEmployeeRespondedNPS(survey.id, employeeId, processId);
    
    if (alreadyResponded) {
      return { 
        success: false, 
        message: "Funcionário já respondeu esta pesquisa NPS",
        surveyId: survey.id,
        employeeId,
        processId
      };
    }

    // Calcular quando a pesquisa deve ser exibida (com delay configurado)
    const delayMs = (survey.delayMinutes || 0) * 60 * 1000;
    const scheduledAt = new Date(Date.now() + delayMs);

    return {
      success: true,
      surveyId: survey.id,
      employeeId,
      processId,
      message: delayMs > 0 
        ? `Pesquisa NPS agendada para ${scheduledAt.toLocaleString()}`
        : "Pesquisa NPS pronta para exibição",
      scheduledAt
    };
  } catch (error) {
    console.error("[NPS Trigger] Erro ao disparar NPS:", error);
    return { 
      success: false, 
      message: `Erro ao disparar NPS: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}

/**
 * Trigger de NPS após conclusão de um passo específico
 */
export async function triggerNPSAfterStepCompletion(
  processId: number,
  employeeId: number,
  stepNumber: number
): Promise<NPSTriggerResult> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database não disponível" };
    }

    // Buscar pesquisa NPS ativa para o passo específico
    const survey = await getActiveSurveyForEvent("step_completed", stepNumber);
    
    if (!survey) {
      return { 
        success: false, 
        message: `Nenhuma pesquisa NPS ativa para conclusão do passo ${stepNumber}` 
      };
    }

    // Verificar se já respondeu
    const alreadyResponded = await hasEmployeeRespondedNPS(survey.id, employeeId, processId);
    
    if (alreadyResponded) {
      return { 
        success: false, 
        message: "Funcionário já respondeu esta pesquisa NPS",
        surveyId: survey.id,
        employeeId,
        processId
      };
    }

    const delayMs = (survey.delayMinutes || 0) * 60 * 1000;
    const scheduledAt = new Date(Date.now() + delayMs);

    return {
      success: true,
      surveyId: survey.id,
      employeeId,
      processId,
      message: `Pesquisa NPS do passo ${stepNumber} pronta`,
      scheduledAt
    };
  } catch (error) {
    console.error("[NPS Trigger] Erro ao disparar NPS de passo:", error);
    return { 
      success: false, 
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}

/**
 * Buscar processos que completaram o PDI e ainda não receberam NPS
 * Usado pelo job automático de verificação
 */
export async function getProcessesPendingNPS(): Promise<Array<{
  processId: number;
  employeeId: number;
  completedAt: Date;
  employeeName: string;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar pesquisa NPS ativa
    const survey = await getActiveSurveyForEvent("process_completed");
    if (!survey) return [];

    // Buscar processos concluídos (passo 5 completo) que não têm resposta NPS
    const completedProcesses = await db.select({
      processId: avdAssessmentProcesses.id,
      employeeId: avdAssessmentProcesses.employeeId,
      completedAt: avdAssessmentProcesses.updatedAt,
      employeeName: employees.name,
    })
    .from(avdAssessmentProcesses)
    .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
    .leftJoin(
      npsResponses, 
      and(
        eq(npsResponses.processId, avdAssessmentProcesses.id),
        eq(npsResponses.surveyId, survey.id)
      )
    )
    .where(
      and(
        eq(avdAssessmentProcesses.currentStep, 5),
        eq(avdAssessmentProcesses.status, "concluido"),
        isNull(npsResponses.id)
      )
    );

    return completedProcesses.map(p => ({
      processId: p.processId,
      employeeId: p.employeeId,
      completedAt: p.completedAt,
      employeeName: p.employeeName || "Funcionário",
    }));
  } catch (error) {
    console.error("[NPS Trigger] Erro ao buscar processos pendentes:", error);
    return [];
  }
}

/**
 * Notificar administrador sobre novas respostas NPS
 */
export async function notifyAdminAboutNPSResponse(
  surveyName: string,
  employeeName: string,
  score: number,
  category: "promoter" | "passive" | "detractor"
): Promise<void> {
  const categoryLabels = {
    promoter: "Promotor (9-10)",
    passive: "Neutro (7-8)",
    detractor: "Detrator (0-6)"
  };

  const emoji = category === "promoter" ? "🟢" : category === "passive" ? "🟡" : "🔴";

  await notifyOwner({
    title: `${emoji} Nova Resposta NPS - ${surveyName}`,
    content: `
**Funcionário:** ${employeeName}
**Nota:** ${score}/10
**Categoria:** ${categoryLabels[category]}

Esta resposta foi registrada automaticamente após a conclusão do processo AVD.
    `.trim()
  });
}

/**
 * Calcular estatísticas de NPS em tempo real
 */
export async function calculateRealTimeNPSStats(surveyId: number): Promise<{
  totalResponses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  trend: "up" | "down" | "stable";
  lastResponseAt: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalResponses: 0,
      npsScore: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      trend: "stable",
      lastResponseAt: null
    };
  }

  const responses = await db.select()
    .from(npsResponses)
    .where(eq(npsResponses.surveyId, surveyId))
    .orderBy(desc(npsResponses.createdAt));

  const totalResponses = responses.length;
  const promoters = responses.filter(r => r.category === "promoter").length;
  const passives = responses.filter(r => r.category === "passive").length;
  const detractors = responses.filter(r => r.category === "detractor").length;

  const promoterPercent = totalResponses > 0 ? (promoters / totalResponses) * 100 : 0;
  const detractorPercent = totalResponses > 0 ? (detractors / totalResponses) * 100 : 0;
  const npsScore = Math.round(promoterPercent - detractorPercent);

  // Calcular tendência comparando últimos 7 dias com 7 dias anteriores
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentResponses = responses.filter(r => new Date(r.createdAt) >= sevenDaysAgo);
  const olderResponses = responses.filter(r => 
    new Date(r.createdAt) >= fourteenDaysAgo && new Date(r.createdAt) < sevenDaysAgo
  );

  const calculateNps = (resps: typeof responses) => {
    if (resps.length === 0) return 0;
    const p = resps.filter(r => r.category === "promoter").length;
    const d = resps.filter(r => r.category === "detractor").length;
    return Math.round(((p - d) / resps.length) * 100);
  };

  const recentNps = calculateNps(recentResponses);
  const olderNps = calculateNps(olderResponses);
  const trend = recentNps > olderNps ? "up" : recentNps < olderNps ? "down" : "stable";

  return {
    totalResponses,
    npsScore,
    promoters,
    passives,
    detractors,
    trend,
    lastResponseAt: responses[0]?.createdAt || null
  };
}
