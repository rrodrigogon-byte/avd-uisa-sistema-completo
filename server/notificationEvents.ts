import { getDb } from "./db";
import { sql } from "drizzle-orm";
import webpush from "web-push";

/**
 * Sistema de notificações automáticas baseado em eventos
 */

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BOASONZtE0HKg_8biNGda_CVbU61VhN_MN9a6UdAw5IiNjLKnG6xpg8Mtk6xvUTUzgGvum8YrbxAmiJOj5qWQXc";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "lzE4t_FjZi1SwH2YbxIrVAPmTY6EOUtyFZtpV_7wHYQ";

webpush.setVapidDetails(
  "mailto:avd@uisa.com.br",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Função auxiliar para enviar push notification
 */
async function sendPushNotification(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Notificar quando há consenso pendente em avaliação 360
 */
export async function notifyPendingConsensus(employeeId: number, evaluationId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar gestor do funcionário
    const result = await db.execute(
      sql`SELECT managerId FROM employees WHERE id = ${employeeId}`
    );
    const employee = ((result[0] as unknown) as any[])[0];

    if (!employee?.managerId) return;

    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employee.managerId}, 'consensus_pending', 'Consenso Pendente', 
                 'Há uma avaliação 360° aguardando consenso', ${evaluationId}, 'evaluation')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employee.managerId,
      "Consenso Pendente",
      "Há uma avaliação 360° aguardando consenso"
    );
  } catch (error) {
    console.error("Error notifying pending consensus:", error);
  }
}

/**
 * Notificar quando meta está atrasada
 */
export async function notifyOverdueGoal(goalId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar informações da meta
    const result = await db.execute(
      sql`SELECT title, deadline FROM goals WHERE id = ${goalId}`
    );
    const goal = ((result[0] as unknown) as any[])[0];

    if (!goal) return;

    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'goal_overdue', 'Meta Atrasada', 
                 'A meta "${goal.title}" está atrasada', ${goalId}, 'goal')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Meta Atrasada",
      `A meta "${goal.title}" está atrasada`
    );
  } catch (error) {
    console.error("Error notifying overdue goal:", error);
  }
}

/**
 * Notificar quando nova avaliação é recebida
 */
export async function notifyNewEvaluation(employeeId: number, evaluatorName: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'new_evaluation', 'Nova Avaliação', 
                 'Você recebeu uma nova avaliação de ${evaluatorName}', ${employeeId}, 'employee')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Nova Avaliação",
      `Você recebeu uma nova avaliação de ${evaluatorName}`
    );
  } catch (error) {
    console.error("Error notifying new evaluation:", error);
  }
}

/**
 * Notificar quando novo feedback é recebido
 */
export async function notifyNewFeedback(employeeId: number, feedbackFrom: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'new_feedback', 'Novo Feedback', 
                 'Você recebeu um novo feedback de ${feedbackFrom}', ${employeeId}, 'employee')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Novo Feedback",
      `Você recebeu um novo feedback de ${feedbackFrom}`
    );
  } catch (error) {
    console.error("Error notifying new feedback:", error);
  }
}

/**
 * Notificar quando PDI está próximo do prazo
 */
export async function notifyPDIDueSoon(pdiId: number, employeeId: number, daysRemaining: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar informações do PDI
    const result = await db.execute(
      sql`SELECT title FROM pdiPlans WHERE id = ${pdiId}`
    );
    const pdi = ((result[0] as unknown) as any[])[0];

    if (!pdi) return;

    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'pdi_due_soon', 'PDI Próximo do Prazo', 
                 'O PDI "${pdi.title}" vence em ${daysRemaining} dias', ${pdiId}, 'pdi')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "PDI Próximo do Prazo",
      `O PDI "${pdi.title}" vence em ${daysRemaining} dias`
    );
  } catch (error) {
    console.error("Error notifying PDI due soon:", error);
  }
}

/**
 * Notificar quando meta é aprovada
 */
export async function notifyGoalApproved(goalId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar informações da meta
    const result = await db.execute(
      sql`SELECT title FROM goals WHERE id = ${goalId}`
    );
    const goal = ((result[0] as unknown) as any[])[0];

    if (!goal) return;

    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'goal_approved', 'Meta Aprovada', 
                 'Sua meta "${goal.title}" foi aprovada', ${goalId}, 'goal')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Meta Aprovada",
      `Sua meta "${goal.title}" foi aprovada`
    );
  } catch (error) {
    console.error("Error notifying goal approved:", error);
  }
}

/**
 * Notificar quando meta é rejeitada
 */
export async function notifyGoalRejected(goalId: number, employeeId: number, reason: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar informações da meta
    const result = await db.execute(
      sql`SELECT title FROM goals WHERE id = ${goalId}`
    );
    const goal = ((result[0] as unknown) as any[])[0];

    if (!goal) return;

    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'goal_rejected', 'Meta Rejeitada', 
                 'Sua meta "${goal.title}" foi rejeitada. Motivo: ${reason}', ${goalId}, 'goal')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Meta Rejeitada",
      `Sua meta "${goal.title}" foi rejeitada`
    );
  } catch (error) {
    console.error("Error notifying goal rejected:", error);
  }
}

/**
 * Notificar quando ciclo de avaliação está próximo do fim
 */
export async function notifyCycleEndingSoon(cycleId: number, daysRemaining: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar todos os funcionários ativos
    const result = await db.execute(
      sql`SELECT id FROM employees WHERE status = 'active'`
    );
    const employees = (result[0] as unknown) as any[];

    // Notificar cada funcionário
    for (const employee of employees) {
      await db.execute(
        sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
           VALUES (${employee.id}, 'cycle_ending_soon', 'Ciclo de Avaliação Encerrando', 
                   'O ciclo de avaliação atual encerra em ${daysRemaining} dias', ${cycleId}, 'cycle')`
      );

      await sendPushNotificationToUser(
        employee.id,
        "Ciclo de Avaliação Encerrando",
        `O ciclo de avaliação atual encerra em ${daysRemaining} dias`
      );
    }
  } catch (error) {
    console.error("Error notifying cycle ending soon:", error);
  }
}

/**
 * Notificar quando badge é conquistado
 */
export async function notifyBadgeEarned(employeeId: number, badgeName: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Criar notificação
    await db.execute(
      sql`INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
         VALUES (${employeeId}, 'badge_earned', 'Novo Badge Conquistado!', 
                 'Parabéns! Você conquistou o badge "${badgeName}"', ${employeeId}, 'employee')`
    );

    // Enviar push notification
    await sendPushNotificationToUser(
      employeeId,
      "Novo Badge Conquistado!",
      `Parabéns! Você conquistou o badge "${badgeName}"`
    );
  } catch (error) {
    console.error("Error notifying badge earned:", error);
  }
}

/**
 * Função auxiliar para enviar push notification para usuário
 */
async function sendPushNotificationToUser(employeeId: number, title: string, body: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar todas as subscriptions do usuário
    const result = await db.execute(
      sql`SELECT subscription FROM pushSubscriptions WHERE userId = ${employeeId} AND isActive = 1`
    );
    const subscriptions = (result[0] as unknown) as any[];

    // Enviar para cada subscription
    for (const sub of subscriptions) {
      try {
        await sendPushNotification(JSON.parse(sub.subscription), {
          title,
          body,
          icon: "/icon-192.png",
          badge: "/badge-72.png",
        });
      } catch (error) {
        console.error("Error sending push to subscription:", error);
      }
    }
  } catch (error) {
    console.error("Error sending push notification to user:", error);
  }
}

/**
 * Job agendado para verificar metas atrasadas (executar diariamente)
 */
export async function checkOverdueGoals() {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.execute(
      sql`SELECT id, employeeId FROM goals 
         WHERE deadline < NOW() 
         AND status NOT IN ('completed', 'cancelled')
         AND lastNotifiedAt IS NULL OR lastNotifiedAt < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const overdueGoals = (result[0] as unknown) as any[];

    for (const goal of overdueGoals) {
      await notifyOverdueGoal(goal.id, goal.employeeId);

      // Atualizar lastNotifiedAt
      await db.execute(
        sql`UPDATE goals SET lastNotifiedAt = NOW() WHERE id = ${goal.id}`
      );
    }
  } catch (error) {
    console.error("Error checking overdue goals:", error);
  }
}

/**
 * Job agendado para verificar PDIs próximos do prazo (executar diariamente)
 */
export async function checkPDIDueSoon() {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.execute(
      sql`SELECT id, employeeId, DATEDIFF(deadline, NOW()) as daysRemaining 
         FROM pdiPlans 
         WHERE deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
         AND status = 'active'`
    );
    const dueSoonPDIs = (result[0] as unknown) as any[];

    for (const pdi of dueSoonPDIs) {
      await notifyPDIDueSoon(pdi.id, pdi.employeeId, pdi.daysRemaining);
    }
  } catch (error) {
    console.error("Error checking PDI due soon:", error);
  }
}
