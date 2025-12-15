import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}

/**
 * Cria uma notificação no banco de dados
 * Para enviar via WebSocket, use sendNotificationToUser do websocket.ts
 */
export async function createNotification(data: NotificationData) {
  const db = await getDb();
  if (!db) {
    console.error("[Notifications] Database not available");
    return null;
  }

  try {
    // Inserir notificação no banco
    const result = await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      read: false,
    });

    const notificationId = result[0].insertId;

    // Buscar notificação criada
    const createdNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    const notification = createdNotifications[0];

    if (!notification) {
      console.error("[Notifications] Failed to retrieve created notification");
      return null;
    }

    console.log(`[Notifications] Created for user ${data.userId}: ${data.title}`);
    return notification;
  } catch (error) {
    console.error("[Notifications] Error creating notification:", error);
    return null;
  }
}

/**
 * Exemplos de uso:
 * 
 * import { createNotification } from "./notificationHelper";
 * import { sendNotificationToUser } from "./websocket";
 * 
 * // Criar notificação no banco
 * const notification = await createNotification({
 *   userId: employeeId,
 *   type: "evaluation_360",
 *   title: "Nova Avaliação 360° Recebida",
 *   message: "Você recebeu uma nova avaliação 360° para preencher",
 *   link: "/performance/avaliacao-360",
 * });
 * 
 * // Enviar via WebSocket (se io estiver disponível)
 * if (notification && io) {
 *   sendNotificationToUser(io, employeeId, {
 *     type: "avaliacao",
 *     title: notification.title,
 *     message: notification.message,
 *     link: notification.link,
 *   });
 * }
 */
