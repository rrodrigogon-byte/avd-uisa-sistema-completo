import { getDb } from "../db";
import { pushSubscriptions, pushNotificationLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import webpush from "web-push";

/**
 * Helper para enviar notificações push em tempo real
 * Centraliza a lógica de envio de push notifications para reutilização
 */

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Envia notificação push para um usuário específico
 */
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushNotificationPayload,
  type: "pulse" | "cycle" | "goal" | "test" | "feedback" | "general" = "general"
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[PushNotification] Database not available");
      return { success: false, count: 0, error: "Database not available" };
    }

    // Buscar inscrições ativas do usuário
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`[PushNotification] Usuário ${userId} não tem inscrições ativas`);
      return { success: false, count: 0, error: "No active subscriptions" };
    }

    // Configurar web-push com as chaves do ambiente
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@uisa.com.br";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("[PushNotification] VAPID keys not configured");
      return { success: false, count: 0, error: "VAPID keys not configured" };
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Preparar payload da notificação
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/badge-72x72.png",
      data: payload.data || {},
      actions: payload.actions || [],
    });

    let successCount = 0;
    let failCount = 0;

    // Enviar para todas as inscrições do usuário
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);

        // Registrar sucesso no log
        await db.insert(pushNotificationLogs).values({
          userId,
          type,
          title: payload.title,
          message: payload.body,
          sentAt: new Date(),
          status: "sent",
          deviceType: subscription.deviceType,
        });

        successCount++;
        console.log(`[PushNotification] Enviada para usuário ${userId} (${subscription.deviceType})`);
      } catch (error: any) {
        failCount++;
        console.error(`[PushNotification] Erro ao enviar para ${subscription.deviceType}:`, error.message);

        // Registrar falha no log
        await db.insert(pushNotificationLogs).values({
          userId,
          type,
          title: payload.title,
          message: payload.body,
          sentAt: new Date(),
          status: "failed",
          deviceType: subscription.deviceType,
          errorMessage: error.message,
        });

        // Se erro 410 (Gone), remover inscrição inválida
        if (error.statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, subscription.id));
          console.log(`[PushNotification] Inscrição inválida removida: ${subscription.id}`);
        }
      }
    }

    return {
      success: successCount > 0,
      count: successCount,
      error: failCount > 0 ? `${failCount} falhas de ${subscriptions.length} tentativas` : undefined,
    };
  } catch (error: any) {
    console.error("[PushNotification] Erro geral:", error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Envia notificação push para múltiplos usuários
 */
export async function sendPushNotificationToMultipleUsers(
  userIds: number[],
  payload: PushNotificationPayload,
  type: "pulse" | "cycle" | "goal" | "test" | "feedback" | "general" = "general"
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotificationToUser(userId, payload, type);
    if (result.success) {
      totalSent += result.count;
    } else {
      totalFailed++;
    }
  }

  return {
    success: totalSent > 0,
    totalSent,
    totalFailed,
  };
}

/**
 * Envia notificação push para todos os usuários com inscrições ativas
 */
export async function sendPushNotificationToAll(
  payload: PushNotificationPayload,
  type: "pulse" | "cycle" | "goal" | "test" | "feedback" | "general" = "general"
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, totalSent: 0, totalFailed: 0 };
    }

    // Buscar todos os usuários com inscrições ativas
    const subscriptions = await db.select().from(pushSubscriptions);

    const uniqueUserIds = Array.from(new Set(subscriptions.map((s) => s.userId)));

    return await sendPushNotificationToMultipleUsers(uniqueUserIds, payload, type);
  } catch (error) {
    console.error("[PushNotification] Erro ao enviar para todos:", error);
    return { success: false, totalSent: 0, totalFailed: 0 };
  }
}
