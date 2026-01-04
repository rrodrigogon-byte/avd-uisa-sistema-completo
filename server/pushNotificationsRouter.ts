import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import webpush from "web-push";
import { ENV } from "./_core/env";

/**
 * Router de Notificações Push
 * Gerencia assinaturas de Web Push API e envio de notificações
 */

// Configurar VAPID keys (geradas uma única vez)
// Para gerar novas keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BOASONZtE0HKg_8biNGda_CVbU61VhN_MN9a6UdAw5IiNjLKnG6xpg8Mtk6xvUTUzgGvum8YrbxAmiJOj5qWQXc";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "lzE4t_FjZi1SwH2YbxIrVAPmTY6EOUtyFZtpV_7wHYQ";

webpush.setVapidDetails(
  "mailto:avd@uisa.com.br",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const pushNotificationsRouter = router({
  /**
   * Obter chave pública VAPID para o frontend
   */
  getPublicKey: publicProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY };
  }),

  /**
   * Registrar nova subscription de push
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
        deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe subscription para este endpoint
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Atualizar subscription existente
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: input.userAgent,
            deviceType: input.deviceType || "desktop",
            active: true,
            lastUsedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing[0].id));

        return { success: true, subscriptionId: existing[0].id };
      }

      // Criar nova subscription
      const result = await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
        deviceType: input.deviceType || "desktop",
        active: true,
      });

      return { success: true, subscriptionId: result[0].insertId };
    }),

  /**
   * Cancelar subscription de push
   */
  unsubscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pushSubscriptions)
        .set({ active: false })
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  /**
   * Verificar se usuário tem subscription ativa
   */
  hasSubscription: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.active, true)
        )
      )
      .limit(1);

    return { hasSubscription: subs.length > 0 };
  }),

  /**
   * Enviar notificação push de teste
   */
  sendTestNotification: protectedProcedure.input(z.object({}).optional()).mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar todas as subscriptions ativas do usuário
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.active, true)
        )
      );

    if (subs.length === 0) {
      return { success: false, message: "Nenhuma subscription ativa encontrada" };
    }

    const payload = JSON.stringify({
      title: "🔔 Notificação de Teste",
      body: "Sistema de notificações push funcionando corretamente!",
      icon: "/logo.png",
      badge: "/badge.png",
      data: {
        url: "/",
        timestamp: Date.now(),
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        successCount++;

        // Atualizar lastUsedAt
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } catch (error: any) {
        console.error("Erro ao enviar push notification:", error);
        errorCount++;

        // Se erro 410 (Gone), desativar subscription
        if (error.statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ active: false })
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return {
      success: successCount > 0,
      message: `${successCount} notificações enviadas, ${errorCount} erros`,
      successCount,
      errorCount,
    };
  }),

  /**
   * Listar subscriptions do usuário
   */
  listSubscriptions: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.user.id));

    return subs.map((sub) => ({
      id: sub.id,
      deviceType: sub.deviceType,
      active: sub.active,
      createdAt: sub.createdAt,
      lastUsedAt: sub.lastUsedAt,
      // Não retornar endpoint completo por segurança
      endpointPreview: sub.endpoint.substring(0, 50) + "...",
    }));
  }),
});

/**
 * Função helper para enviar notificação push para um usuário específico
 */
export async function sendPushNotificationToUser(
  userId: number,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: any;
  }
) {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for push notification");
    return { success: false, error: "Database not available" };
  }

  // Buscar subscriptions ativas do usuário
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.active, true))
    );

  if (subs.length === 0) {
    return { success: false, error: "No active subscriptions" };
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || "/logo.png",
    badge: notification.badge || "/badge.png",
    data: {
      url: notification.url || "/",
      timestamp: Date.now(),
      ...notification.data,
    },
  });

  let successCount = 0;
  let errorCount = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
      successCount++;

      // Atualizar lastUsedAt
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    } catch (error: any) {
      console.error(`Erro ao enviar push para subscription ${sub.id}:`, error);
      errorCount++;

      // Se erro 410 (Gone), desativar subscription
      if (error.statusCode === 410) {
        await db
          .update(pushSubscriptions)
          .set({ active: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  return {
    success: successCount > 0,
    successCount,
    errorCount,
  };
}
