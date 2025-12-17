import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userNotificationSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router para gerenciar preferências de notificações por usuário
 */
export const notificationPreferencesRouter = router({
  /**
   * Obter preferências do usuário atual
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, ctx.user.id))
      .limit(1);

    // Se não existir, retornar valores padrão
    if (!settings) {
      return {
        userId: ctx.user.id,
        enableProcessStart: true,
        enableStepCompleted: true,
        enableStepReminder: true,
        enableGoalUpdate: true,
        enableEvaluationRequest: true,
        enablePdiUpdate: true,
        enableBonusNotification: true,
        enableApprovalRequest: true,
        enableSystemAlert: true,
        emailEnabled: true,
        pushEnabled: false,
        dailyDigest: false,
        weeklyDigest: false,
        preferredTimeStart: "08:00",
        preferredTimeEnd: "18:00",
      };
    }

    return settings;
  }),

  /**
   * Atualizar preferências do usuário
   */
  update: protectedProcedure
    .input(
      z.object({
        enableProcessStart: z.boolean().optional(),
        enableStepCompleted: z.boolean().optional(),
        enableStepReminder: z.boolean().optional(),
        enableGoalUpdate: z.boolean().optional(),
        enableEvaluationRequest: z.boolean().optional(),
        enablePdiUpdate: z.boolean().optional(),
        enableBonusNotification: z.boolean().optional(),
        enableApprovalRequest: z.boolean().optional(),
        enableSystemAlert: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        preferredTimeStart: z.string().optional(),
        preferredTimeEnd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe configuração
      const [existing] = await db
        .select()
        .from(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        // Atualizar
        await db
          .update(userNotificationSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(userNotificationSettings.userId, ctx.user.id));
      } else {
        // Criar
        await db.insert(userNotificationSettings).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      return { success: true };
    }),

  /**
   * Resetar preferências para valores padrão
   */
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(userNotificationSettings)
      .set({
        enableProcessStart: true,
        enableStepCompleted: true,
        enableStepReminder: true,
        enableGoalUpdate: true,
        enableEvaluationRequest: true,
        enablePdiUpdate: true,
        enableBonusNotification: true,
        enableApprovalRequest: true,
        enableSystemAlert: true,
        emailEnabled: true,
        pushEnabled: false,
        dailyDigest: false,
        weeklyDigest: false,
        preferredTimeStart: "08:00",
        preferredTimeEnd: "18:00",
        updatedAt: new Date(),
      })
      .where(eq(userNotificationSettings.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Verificar se usuário deve receber notificação de um tipo específico
   */
  shouldNotify: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        notificationType: z.enum([
          "processStart",
          "stepCompleted",
          "stepReminder",
          "goalUpdate",
          "evaluationRequest",
          "pdiUpdate",
          "bonusNotification",
          "approvalRequest",
          "systemAlert",
        ]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [settings] = await db
        .select()
        .from(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, input.userId))
        .limit(1);

      // Se não existir configuração, assumir que está habilitado
      if (!settings) {
        return { shouldNotify: true, emailEnabled: true, pushEnabled: false };
      }

      // Mapear tipo de notificação para campo correspondente
      const fieldMap: Record<string, keyof typeof settings> = {
        processStart: "enableProcessStart",
        stepCompleted: "enableStepCompleted",
        stepReminder: "enableStepReminder",
        goalUpdate: "enableGoalUpdate",
        evaluationRequest: "enableEvaluationRequest",
        pdiUpdate: "enablePdiUpdate",
        bonusNotification: "enableBonusNotification",
        approvalRequest: "enableApprovalRequest",
        systemAlert: "enableSystemAlert",
      };

      const field = fieldMap[input.notificationType];
      const shouldNotify = settings[field] as boolean;

      return {
        shouldNotify,
        emailEnabled: settings.emailEnabled && shouldNotify,
        pushEnabled: settings.pushEnabled && shouldNotify,
      };
    }),
});
