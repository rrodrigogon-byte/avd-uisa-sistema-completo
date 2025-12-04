import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { emailMetrics } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { TRPCError } from "@trpc/server";

/**
 * Router para gerenciar emails falhados e reenvios
 */
export const emailFailuresRouter = router({
  /**
   * Listar emails falhados
   */
  listFailedEmails: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        type: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Apenas admin e RH podem ver emails falhados
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem acessar esta funcionalidade",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(emailMetrics.success, false)];
      if (input.type) {
        conditions.push(eq(emailMetrics.type, input.type));
      }

      const failedEmails = await db
        .select()
        .from(emailMetrics)
        .where(and(...conditions))
        .orderBy(desc(emailMetrics.sentAt))
        .limit(input.limit);

      return failedEmails;
    }),

  /**
   * Obter estatísticas de emails falhados
   */
  getFailureStats: protectedProcedure.query(async ({ ctx }) => {
    // Apenas admin e RH podem ver estatísticas
    if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores e RH podem acessar esta funcionalidade",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allMetrics = await db.select().from(emailMetrics);

    const total = allMetrics.length;
    const failed = allMetrics.filter((m) => !m.success).length;
    const successRate = total > 0 ? ((total - failed) / total) * 100 : 100;

    // Agrupar por tipo
    const byType: Record<string, { total: number; failed: number }> = {};
    allMetrics.forEach((metric) => {
      if (!byType[metric.type]) {
        byType[metric.type] = { total: 0, failed: 0 };
      }
      byType[metric.type].total++;
      if (!metric.success) {
        byType[metric.type].failed++;
      }
    });

    return {
      total,
      failed,
      success: total - failed,
      successRate: Math.round(successRate * 100) / 100,
      byType,
    };
  }),

  /**
   * Reenviar email falhado
   */
  resendEmail: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin e RH podem reenviar emails
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem reenviar emails",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar email falhado
      const [failedEmail] = await db
        .select()
        .from(emailMetrics)
        .where(eq(emailMetrics.id, input.id))
        .limit(1);

      if (!failedEmail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email não encontrado",
        });
      }

      if (failedEmail.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este email já foi enviado com sucesso",
        });
      }

      // Tentar reenviar
      const startTime = Date.now();
      let success = false;
      let error: string | null = null;

      try {
        // Recriar o HTML do email baseado no tipo
        const html = await recreateEmailHTML(failedEmail.type, failedEmail.subject || "", failedEmail.toEmail);
        
        success = await sendEmail({
          to: failedEmail.toEmail,
          subject: failedEmail.subject || "Notificação do Sistema AVD UISA",
          html,
        });

        if (!success) {
          error = "Falha no envio - verifique configurações SMTP";
        }
      } catch (e: any) {
        success = false;
        error = e.message || "Erro desconhecido ao enviar email";
      }

      const deliveryTime = Date.now() - startTime;

      // Registrar nova tentativa
      await db.insert(emailMetrics).values({
        type: failedEmail.type,
        toEmail: failedEmail.toEmail,
        subject: failedEmail.subject,
        success,
        deliveryTime,
        error,
        attempts: (failedEmail.attempts || 1) + 1,
      });

      return {
        success,
        message: success
          ? "Email reenviado com sucesso!"
          : `Falha ao reenviar: ${error}`,
      };
    }),

  /**
   * Reenviar múltiplos emails em lote
   */
  resendBatch: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()).min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin e RH podem reenviar emails
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem reenviar emails",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let successCount = 0;
      let failCount = 0;
      const results: Array<{ id: number; success: boolean; error?: string }> = [];

      for (const id of input.ids) {
        try {
          const [failedEmail] = await db
            .select()
            .from(emailMetrics)
            .where(eq(emailMetrics.id, id))
            .limit(1);

          if (!failedEmail || failedEmail.success) {
            failCount++;
            results.push({ id, success: false, error: "Email não encontrado ou já enviado" });
            continue;
          }

          const startTime = Date.now();
          const html = await recreateEmailHTML(failedEmail.type, failedEmail.subject || "", failedEmail.toEmail);
          
          const success = await sendEmail({
            to: failedEmail.toEmail,
            subject: failedEmail.subject || "Notificação do Sistema AVD UISA",
            html,
          });

          const deliveryTime = Date.now() - startTime;

          await db.insert(emailMetrics).values({
            type: failedEmail.type,
            toEmail: failedEmail.toEmail,
            subject: failedEmail.subject,
            success,
            deliveryTime,
            error: success ? null : "Falha no reenvio",
            attempts: (failedEmail.attempts || 1) + 1,
          });

          if (success) {
            successCount++;
          } else {
            failCount++;
          }

          results.push({ id, success });
        } catch (e: any) {
          failCount++;
          results.push({ id, success: false, error: e.message });
        }
      }

      return {
        successCount,
        failCount,
        total: input.ids.length,
        results,
      };
    }),
});

/**
 * Função auxiliar para recriar HTML do email baseado no tipo
 */
async function recreateEmailHTML(type: string, subject: string, toEmail: string): Promise<string> {
  // Template genérico para reenvio
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 ${subject}</h1>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Esta é uma notificação do Sistema AVD UISA.</p>
          <p>Tipo de notificação: <strong>${type}</strong></p>
          <p>Por favor, acesse o sistema para mais detalhes.</p>
          <p><em>Equipe AVD UISA</em></p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
