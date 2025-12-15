import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import {
  sendTeamsNotification,
  sendSlackNotification,
  createGoogleMeetMeeting,
} from "./utils/externalIntegrations";

/**
 * Router de Integrações Externas
 * Microsoft Teams, Slack e Google Meet
 */

export const integrationsRouter = router({
  /**
   * Testar integração com Microsoft Teams
   */
  testTeams: adminProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await sendTeamsNotification(input.webhookUrl, {
        title: "🎉 Teste de Integração",
        message: "Integração com Microsoft Teams configurada com sucesso!",
      });

      return { success };
    }),

  /**
   * Testar integração com Slack
   */
  testSlack: adminProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
        channel: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await sendSlackNotification(input.webhookUrl, {
        channel: input.channel,
        message: "🎉 *Teste de Integração*\n\nIntegração com Slack configurada com sucesso!",
      });

      return { success };
    }),

  /**
   * Criar reunião no Google Meet
   */
  createMeeting: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        summary: z.string(),
        description: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        attendees: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await createGoogleMeetMeeting(input.accessToken, {
        summary: input.summary,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        attendees: input.attendees,
      });

      if (!result) {
        throw new Error("Falha ao criar reunião no Google Meet");
      }

      return result;
    }),

  /**
   * Salvar configurações de integração
   */
  saveConfig: adminProcedure
    .input(
      z.object({
        teamsWebhookUrl: z.string().url().optional(),
        slackWebhookUrl: z.string().url().optional(),
        slackChannel: z.string().optional(),
        googleMeetEnabled: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { systemSettings } = await import("../drizzle/schema");

      // Salvar configurações no systemSettings
      const configs = [
        { settingKey: "teams_webhook_url", settingValue: input.teamsWebhookUrl || "" },
        { settingKey: "slack_webhook_url", settingValue: input.slackWebhookUrl || "" },
        { settingKey: "slack_channel", settingValue: input.slackChannel || "" },
        { settingKey: "google_meet_enabled", settingValue: input.googleMeetEnabled ? "true" : "false" },
      ];

      for (const config of configs) {
        const existing = await db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, config.settingKey))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(systemSettings)
            .set({ settingValue: config.settingValue, updatedAt: new Date() })
            .where(eq(systemSettings.settingKey, config.settingKey));
        } else {
          await db.insert(systemSettings).values({
            settingKey: config.settingKey,
            settingValue: config.settingValue,
            description: `Configuração de ${config.settingKey}`,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Obter configurações de integração
   */
  getConfig: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { systemSettings } = await import("../drizzle/schema");

    const settingKeys = ["teams_webhook_url", "slack_webhook_url", "slack_channel", "google_meet_enabled"];
    const config: any = {};

    for (const key of settingKeys) {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, key))
        .limit(1);

      if (setting) {
        config[key] = setting.settingValue;
      }
    }

    return {
      teamsWebhookUrl: config.teams_webhook_url || "",
      slackWebhookUrl: config.slack_webhook_url || "",
      slackChannel: config.slack_channel || "",
      googleMeetEnabled: config.google_meet_enabled === "true",
    };
  }),

  /**
   * Enviar notificação de teste
   */
  sendTestNotification: adminProcedure
    .input(
      z.object({
        platform: z.enum(["teams", "slack"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { systemSettings } = await import("../drizzle/schema");

      if (input.platform === "teams") {
        const [setting] = await db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, "teams_webhook_url"))
          .limit(1);

        if (!setting || !setting.settingValue) {
          throw new Error("Webhook do Teams não configurado");
        }

        const success = await sendTeamsNotification(setting.settingValue, {
          title: "🔔 Notificação de Teste",
          message: "Esta é uma notificação de teste do Sistema AVD UISA.",
        });

        return { success };
      } else {
        const [webhookSetting] = await db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, "slack_webhook_url"))
          .limit(1);

        const [channelSetting] = await db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, "slack_channel"))
          .limit(1);

        if (!webhookSetting || !webhookSetting.settingValue) {
          throw new Error("Webhook do Slack não configurado");
        }

        const success = await sendSlackNotification(webhookSetting.settingValue, {
          channel: channelSetting?.settingValue || "#geral",
          message: "🔔 *Notificação de Teste*\n\nEsta é uma notificação de teste do Sistema AVD UISA.",
        });

        return { success };
      }
    }),
});
