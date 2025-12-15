/**
 * Serviço de Agendamento de Emails Automáticos
 * Sistema AVD UISA - Avaliação de Desempenho
 */

import { getDb } from './db';
import { sendEmail } from './emailService';
import * as emailTemplates from './emailTemplates';
import { 
  evaluationCycles, 
  evaluationInstances, 
  employees, 
  users 
} from '../drizzle/schema';
import { and, eq, lte, gte, sql, or } from 'drizzle-orm';

/**
 * Verifica e envia notificações para períodos que acabaram de iniciar
 */
export async function checkAndNotifyPeriodStarted() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[EmailScheduler] Database not available');
      return;
    }

    // Buscar períodos que iniciaram nas últimas 24 horas e ainda não foram notificados
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentPeriods = await db
      .select()
      .from(evaluationCycles)
      .where(
        and(
          gte(evaluationCycles.startDate, yesterday),
          lte(evaluationCycles.startDate, now),
          eq(evaluationCycles.status, 'ativo')
        )
      );

    for (const period of recentPeriods) {
      // Buscar todos os colaboradores incluídos neste período
      const instances = await db
        .select({
          employee: employees,
          user: users,
        })
        .from(evaluationInstances)
        .innerJoin(employees, eq(evaluationInstances.employeeId, employees.id))
        .innerJoin(users, eq(employees.userId, users.id))
        .where(eq(evaluationInstances.cycleId, period.id));

      // Enviar email para cada colaborador
      for (const { employee, user } of instances) {
        if (!user.email) continue;

        const emailData = emailTemplates.periodStartedTemplate({
          recipientName: employee.nome,
          periodName: period.name,
          startDate: period.startDate.toLocaleDateString('pt-BR'),
          endDate: period.endDate.toLocaleDateString('pt-BR'),
          description: period.description || undefined,
          dashboardUrl: process.env.VITE_APP_URL || 'https://avd-uisa.manus.space',
        });

        await sendEmail({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
        });

        console.log(`[EmailScheduler] Period started notification sent to ${user.email}`);
      }
    }
  } catch (error) {
    console.error('[EmailScheduler] Error checking period started:', error);
  }
}

/**
 * Verifica e envia lembretes de autoavaliação pendente
 */
export async function checkAndSendSelfEvaluationReminders() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[EmailScheduler] Database not available');
      return;
    }

    const now = new Date();

    // Buscar instâncias de avaliação pendentes
    const pendingInstances = await db
      .select({
        instance: evaluationInstances,
        employee: employees,
        user: users,
        cycle: evaluationCycles,
      })
      .from(evaluationInstances)
      .innerJoin(employees, eq(evaluationInstances.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(evaluationCycles, eq(evaluationInstances.cycleId, evaluationCycles.id))
      .where(
        and(
          eq(evaluationInstances.status, 'pendente'),
          gte(evaluationCycles.endDate, now), // Período ainda ativo
          eq(evaluationCycles.status, 'ativo')
        )
      );

    for (const { instance, employee, user, cycle } of pendingInstances) {
      if (!user.email) continue;

      // Calcular dias restantes
      const daysRemaining = Math.ceil(
        (cycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Enviar lembrete se estiver próximo do prazo (7, 3 ou 1 dia antes)
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        const emailData = emailTemplates.selfEvaluationReminderTemplate({
          recipientName: employee.nome,
          periodName: cycle.name,
          deadline: cycle.endDate.toLocaleDateString('pt-BR'),
          daysRemaining,
          dashboardUrl: process.env.VITE_APP_URL || 'https://avd-uisa.manus.space',
        });

        await sendEmail({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
        });

        console.log(`[EmailScheduler] Self-evaluation reminder sent to ${user.email} (${daysRemaining} days remaining)`);
      }
    }
  } catch (error) {
    console.error('[EmailScheduler] Error sending self-evaluation reminders:', error);
  }
}

/**
 * Verifica e notifica supervisores sobre avaliações pendentes
 */
export async function checkAndNotifySupervisors() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[EmailScheduler] Database not available');
      return;
    }

    const now = new Date();

    // Buscar instâncias onde autoavaliação foi concluída mas supervisor ainda não avaliou
    const pendingInstances = await db
      .select({
        instance: evaluationInstances,
        employee: employees,
        cycle: evaluationCycles,
      })
      .from(evaluationInstances)
      .innerJoin(employees, eq(evaluationInstances.employeeId, employees.id))
      .innerJoin(evaluationCycles, eq(evaluationInstances.cycleId, evaluationCycles.id))
      .where(
        and(
          eq(evaluationInstances.status, 'em_andamento'),
          gte(evaluationCycles.endDate, now),
          eq(evaluationCycles.status, 'ativo')
        )
      );

    for (const { instance, employee, cycle } of pendingInstances) {
      if (!instance.supervisorId) continue;

      // Buscar dados do supervisor
      const supervisorData = await db
        .select({
          supervisor: employees,
          user: users,
        })
        .from(employees)
        .innerJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.id, instance.supervisorId))
        .limit(1);

      if (supervisorData.length === 0 || !supervisorData[0].user.email) continue;

      const { supervisor, user: supervisorUser } = supervisorData[0];

      const emailData = emailTemplates.supervisorEvaluationTemplate({
        recipientName: supervisor.nome,
        employeeName: employee.nome,
        periodName: cycle.name,
        deadline: cycle.endDate.toLocaleDateString('pt-BR'),
        dashboardUrl: process.env.VITE_APP_URL || 'https://avd-uisa.manus.space',
      });

      await sendEmail({
        to: supervisorUser.email,
        subject: emailData.subject,
        html: emailData.html,
      });

      console.log(`[EmailScheduler] Supervisor notification sent to ${supervisorUser.email}`);
    }
  } catch (error) {
    console.error('[EmailScheduler] Error notifying supervisors:', error);
  }
}

/**
 * Inicializa o agendador de emails (executar a cada hora)
 */
export function startEmailScheduler() {
  console.log('[EmailScheduler] Starting email scheduler...');

  // Executar imediatamente ao iniciar
  checkAndNotifyPeriodStarted();
  checkAndSendSelfEvaluationReminders();
  checkAndNotifySupervisors();

  // Agendar para executar a cada hora
  setInterval(() => {
    console.log('[EmailScheduler] Running scheduled email checks...');
    checkAndNotifyPeriodStarted();
    checkAndSendSelfEvaluationReminders();
    checkAndNotifySupervisors();
  }, 60 * 60 * 1000); // 1 hora

  console.log('[EmailScheduler] Email scheduler started successfully');
}

/**
 * Envia notificação de avaliação concluída
 */
export async function notifyEvaluationCompleted(
  employeeId: number,
  cycleId: number,
  evaluationType: 'autoavaliacao' | 'supervisor'
) {
  try {
    const db = await getDb();
    if (!db) return;

    const result = await db
      .select({
        employee: employees,
        user: users,
        cycle: evaluationCycles,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(evaluationCycles, eq(evaluationCycles.id, cycleId))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (result.length === 0 || !result[0].user.email) return;

    const { employee, user, cycle } = result[0];

    const emailData = emailTemplates.evaluationCompletedTemplate({
      recipientName: employee.nome,
      periodName: cycle.name,
      evaluationType,
      submissionDate: new Date().toLocaleDateString('pt-BR'),
      dashboardUrl: process.env.VITE_APP_URL || 'https://avd-uisa.manus.space',
    });

    await sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log(`[EmailScheduler] Evaluation completed notification sent to ${user.email}`);
  } catch (error) {
    console.error('[EmailScheduler] Error notifying evaluation completed:', error);
  }
}

/**
 * Envia resultado final da avaliação
 */
export async function notifyFinalResult(
  employeeId: number,
  cycleId: number,
  selfScore: number,
  supervisorScore: number,
  finalScore: number,
  supervisorComments?: string
) {
  try {
    const db = await getDb();
    if (!db) return;

    const result = await db
      .select({
        employee: employees,
        user: users,
        cycle: evaluationCycles,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(evaluationCycles, eq(evaluationCycles.id, cycleId))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (result.length === 0 || !result[0].user.email) return;

    const { employee, user, cycle } = result[0];

    const emailData = emailTemplates.finalResultTemplate({
      recipientName: employee.nome,
      periodName: cycle.name,
      selfScore,
      supervisorScore,
      finalScore,
      supervisorComments,
      dashboardUrl: process.env.VITE_APP_URL || 'https://avd-uisa.manus.space',
    });

    await sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log(`[EmailScheduler] Final result notification sent to ${user.email}`);
  } catch (error) {
    console.error('[EmailScheduler] Error notifying final result:', error);
  }
}
