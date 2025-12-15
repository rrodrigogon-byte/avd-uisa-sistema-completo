import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notifications, users, evaluationCycles } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

export type NotificationType = 
  | "cycle_started"
  | "cycle_ending"
  | "evaluation_pending"
  | "evaluation_received"
  | "evaluation_completed"
  | "report_ready";

export interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedCycleId?: number;
  relatedEvaluationId?: number;
}

/**
 * Cria uma notificação para um usuário
 */
export async function createNotification(params: CreateNotificationParams) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [notification] = await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedCycleId: params.relatedCycleId,
    relatedEvaluationId: params.relatedEvaluationId,
    isRead: false,
  }).$returningId();

  return notification;
}

/**
 * Busca notificações de um usuário
 */
export async function getUserNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(50);
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

/**
 * Conta notificações não lidas
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Notifica usuário sobre novo ciclo de avaliação
 */
export async function notifyNewCycle(cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [cycle] = await db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, cycleId))
    .limit(1);

  if (!cycle) return;

  // Busca todos os usuários ativos
  const activeUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "user"));

  // Cria notificação para cada usuário
  for (const user of activeUsers) {
    await createNotification({
      userId: user.id,
      type: "cycle_started",
      title: "Novo Ciclo de Avaliação",
      message: `O ciclo "${cycle.name}" foi iniciado. Período: ${cycle.startDate.toLocaleDateString('pt-BR')} a ${cycle.endDate.toLocaleDateString('pt-BR')}`,
      relatedCycleId: cycleId,
    });
  }

  // Notifica o proprietário
  await notifyOwner({
    title: "Novo Ciclo Iniciado",
    content: `O ciclo "${cycle.name}" foi iniciado com ${activeUsers.length} participantes.`,
  });
}

/**
 * Notifica sobre ciclo próximo do fim
 */
export async function notifyCycleEnding(cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [cycle] = await db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, cycleId))
    .limit(1);

  if (!cycle) return;

  const activeUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "user"));

  for (const user of activeUsers) {
    await createNotification({
      userId: user.id,
      type: "cycle_ending",
      title: "Ciclo Encerrando em Breve",
      message: `O ciclo "${cycle.name}" encerra em ${cycle.endDate.toLocaleDateString('pt-BR')}. Complete suas avaliações pendentes!`,
      relatedCycleId: cycleId,
    });
  }
}

/**
 * Notifica sobre avaliação recebida
 */
export async function notifyEvaluationReceived(evaluatedUserId: number, evaluationId: number) {
  await createNotification({
    userId: evaluatedUserId,
    type: "evaluation_received",
    title: "Nova Avaliação Recebida",
    message: "Você recebeu uma nova avaliação. Confira seu desempenho no dashboard.",
    relatedEvaluationId: evaluationId,
  });
}

/**
 * Notifica sobre relatório pronto
 */
export async function notifyReportReady(userId: number, cycleId: number) {
  await createNotification({
    userId: userId,
    type: "report_ready",
    title: "Relatório Disponível",
    message: "Seu relatório de desempenho está pronto para visualização.",
    relatedCycleId: cycleId,
  });
}
