import { getDb } from "../db";
import { 
  performanceEvaluations, 
  employees, 
  evaluationCycles,
  smartGoals,
  pdiPlans,
  users
} from "../../drizzle/schema";
import { and, eq, lte, gte, or, sql } from "drizzle-orm";
import {
  sendEvaluationReminderEmail,
  sendCycleStartedEmail,
  sendAdminReportEmail
} from "./email";

/**
 * Sistema de agendamento de emails automáticos
 * Executa verificações periódicas e envia lembretes
 */

/**
 * Enviar lembretes de avaliações pendentes
 * Verifica avaliações com prazo próximo e envia lembretes
 */
export async function sendPendingEvaluationReminders() {
  const db = await getDb();
  if (!db) {
    console.warn('[EmailScheduler] Database not available');
    return;
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Buscar avaliações pendentes com prazo próximo
    const pendingEvaluations = await db
      .select({
        evaluation: performanceEvaluations,
        employee: employees,
        cycle: evaluationCycles,
      })
      .from(performanceEvaluations)
      .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
      .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
      .where(
        and(
          eq(performanceEvaluations.status, 'em_andamento'),
          lte(evaluationCycles.endDate, sevenDaysFromNow)
        )
      );

    for (const item of pendingEvaluations) {
      if (!item.employee?.email || !item.cycle) continue;

      const daysRemaining = Math.ceil(
        (new Date(item.cycle.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Enviar lembrete apenas em marcos específicos (7, 3, 1 dia antes)
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1 || daysRemaining === 0) {
        await sendEvaluationReminderEmail(
          item.employee.email,
          item.employee.name,
          item.evaluation.type || 'Avaliação',
          item.cycle.name,
          daysRemaining
        );
        
        console.log(`[EmailScheduler] Lembrete enviado para ${item.employee.name} - ${daysRemaining} dias restantes`);
      }
    }

    console.log(`[EmailScheduler] Verificação de lembretes concluída - ${pendingEvaluations.length} avaliações verificadas`);
  } catch (error) {
    console.error('[EmailScheduler] Erro ao enviar lembretes de avaliações:', error);
  }
}

/**
 * Notificar início de novos ciclos de avaliação
 */
export async function notifyNewCycles() {
  const db = await getDb();
  if (!db) {
    console.warn('[EmailScheduler] Database not available');
    return;
  }

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Buscar ciclos que iniciaram nas últimas 24 horas
    const newCycles = await db
      .select()
      .from(evaluationCycles)
      .where(
        and(
          gte(evaluationCycles.startDate, yesterday),
          lte(evaluationCycles.startDate, now)
        )
      );

    if (newCycles.length === 0) return;

    // Buscar todos os colaboradores ativos
    const allEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.active, true));

    for (const cycle of newCycles) {
      for (const employee of allEmployees) {
        if (!employee.email) continue;

        await sendCycleStartedEmail(
          employee.email,
          employee.name,
          cycle.name,
          new Date(cycle.startDate),
          new Date(cycle.endDate)
        );
      }

      console.log(`[EmailScheduler] Notificações enviadas para novo ciclo: ${cycle.name}`);
    }
  } catch (error) {
    console.error('[EmailScheduler] Erro ao notificar novos ciclos:', error);
  }
}

/**
 * Enviar relatório periódico para administradores
 */
export async function sendAdminPeriodicReport() {
  const db = await getDb();
  if (!db) {
    console.warn('[EmailScheduler] Database not available');
    return;
  }

  try {
    // Buscar estatísticas gerais
    const totalEmployeesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.active, true));
    const totalEmployees = totalEmployeesResult[0]?.count || 0;

    const pendingEvaluationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.status, 'em_andamento'));
    const pendingEvaluations = pendingEvaluationsResult[0]?.count || 0;

    const completedEvaluationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.status, 'concluida'));
    const completedEvaluations = completedEvaluationsResult[0]?.count || 0;

    const activeGoalsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartGoals)
      .where(eq(smartGoals.status, 'in_progress'));
    const activeGoals = activeGoalsResult[0]?.count || 0;

    const completedGoalsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartGoals)
      .where(eq(smartGoals.status, 'completed'));
    const completedGoals = completedGoalsResult[0]?.count || 0;

    // Buscar administradores e RH
    const admins = await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'rh')));

    const reportData = {
      totalEmployees,
      pendingEvaluations,
      completedEvaluations,
      activeGoals,
      completedGoals,
    };

    for (const admin of admins) {
      if (!admin.email) continue;

      await sendAdminReportEmail(
        admin.email,
        admin.name || 'Administrador',
        reportData
      );
    }

    console.log(`[EmailScheduler] Relatório periódico enviado para ${admins.length} administradores`);
  } catch (error) {
    console.error('[EmailScheduler] Erro ao enviar relatório periódico:', error);
  }
}

/**
 * Executar todas as tarefas agendadas
 * Deve ser chamado periodicamente (ex: a cada hora via cron)
 */
export async function runScheduledTasks() {
  console.log('[EmailScheduler] Iniciando tarefas agendadas...');
  
  await sendPendingEvaluationReminders();
  await notifyNewCycles();
  
  // Enviar relatório semanal (apenas às segundas-feiras)
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() === 9) {
    await sendAdminPeriodicReport();
  }
  
  console.log('[EmailScheduler] Tarefas agendadas concluídas');
}

/**
 * Iniciar scheduler com intervalo configurável
 * @param intervalMinutes Intervalo em minutos entre execuções (padrão: 60 minutos)
 */
export function startEmailScheduler(intervalMinutes: number = 60) {
  console.log(`[EmailScheduler] Iniciando scheduler com intervalo de ${intervalMinutes} minutos`);
  
  // Executar imediatamente na inicialização
  runScheduledTasks();
  
  // Agendar execuções periódicas
  setInterval(() => {
    runScheduledTasks();
  }, intervalMinutes * 60 * 1000);
}
