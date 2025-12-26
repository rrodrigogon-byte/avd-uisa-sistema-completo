/**
 * Router para Dashboard de Emails Admin/RH
 * Permite visualizar, filtrar e analisar emails enviados para administradores e RH
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { emailMetrics, users } from "../../drizzle/schema";
import { and, desc, eq, gte, lte, like, or, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRhEmailDashboardRouter = router({
  /**
   * Listar emails enviados para Admin/RH com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        success: z.enum(["all", "true", "false"]).optional(),
        priority: z.enum(["all", "low", "normal", "high"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Apenas admin e RH podem acessar
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado. Apenas administradores e RH podem acessar este recurso.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { page, limit, success, priority, dateFrom, dateTo, search } = input;
      const offset = (page - 1) * limit;

      // Construir condições de filtro
      const conditions = [];

      // Filtrar apenas emails para Admin/RH (baseado no assunto)
      conditions.push(
        or(
          like(emailMetrics.subject, "%Admin%"),
          like(emailMetrics.subject, "%RH%"),
          like(emailMetrics.subject, "%Sistema AVD UISA%"),
          like(emailMetrics.subject, "%Novo usuário%"),
          like(emailMetrics.subject, "%Novo funcionário%"),
          like(emailMetrics.subject, "%Ciclo de avaliação%"),
          like(emailMetrics.subject, "%Avaliação 360%"),
          like(emailMetrics.subject, "%Meta%"),
          like(emailMetrics.subject, "%PDI%"),
          like(emailMetrics.subject, "%Nine Box%"),
          like(emailMetrics.subject, "%Alerta de Segurança%"),
          like(emailMetrics.subject, "%Resumo Diário%")
        )
      );

      if (input.success && input.success !== "all") {
        conditions.push(eq(emailMetrics.success, input.success === "true"));
      }

      if (dateFrom) {
        conditions.push(gte(emailMetrics.sentAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(emailMetrics.sentAt, new Date(dateTo)));
      }

      if (search) {
        conditions.push(
          or(
            like(emailMetrics.subject, `%${search}%`),
            like(emailMetrics.toEmail, `%${search}%`)
          )
        );
      }

      // Buscar emails com paginação
      const [emails, totalResult] = await Promise.all([
        db
          .select({
            id: emailMetrics.id,
            recipient: emailMetrics.toEmail,
            subject: emailMetrics.subject,
            success: emailMetrics.success,
            error: emailMetrics.error,
            createdAt: emailMetrics.sentAt,
            sentAt: emailMetrics.sentAt,
          })
          .from(emailMetrics)
          .where(and(...conditions))
          .orderBy(desc(emailMetrics.sentAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(emailMetrics)
          .where(and(...conditions)),
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        emails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }),

  /**
   * Obter estatísticas de emails Admin/RH
   */
  stats: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    // Apenas admin e RH podem acessar
    if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado.",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Condição para filtrar emails Admin/RH
    const adminRhCondition = or(
      like(emailMetrics.subject, "%Admin%"),
      like(emailMetrics.subject, "%RH%"),
      like(emailMetrics.subject, "%Sistema AVD UISA%"),
      like(emailMetrics.subject, "%Novo usuário%"),
      like(emailMetrics.subject, "%Novo funcionário%"),
      like(emailMetrics.subject, "%Ciclo de avaliação%"),
      like(emailMetrics.subject, "%Avaliação 360%"),
      like(emailMetrics.subject, "%Meta%"),
      like(emailMetrics.subject, "%PDI%"),
      like(emailMetrics.subject, "%Nine Box%"),
      like(emailMetrics.subject, "%Alerta de Segurança%"),
      like(emailMetrics.subject, "%Resumo Diário%")
    );

    // Estatísticas gerais
    const [totalEmails, sentEmails, failedEmails] = await Promise.all([
      db.select({ count: count() }).from(emailMetrics).where(adminRhCondition),
      db
        .select({ count: count() })
        .from(emailMetrics)
        .where(and(adminRhCondition, eq(emailMetrics.success, true))),
      db
        .select({ count: count() })
        .from(emailMetrics)
        .where(and(adminRhCondition, eq(emailMetrics.success, false))),
    ]);

    // Emails dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEmails = await db
      .select({ count: count() })
      .from(emailMetrics)
      .where(and(adminRhCondition, gte(emailMetrics.sentAt, sevenDaysAgo)));

    // Emails por tipo (baseado no assunto)
    const emailsByType = await db
      .select({
        subject: emailMetrics.subject,
        count: count(),
      })
      .from(emailMetrics)
      .where(adminRhCondition)
      .groupBy(emailMetrics.subject)
      .orderBy(desc(count()))
      .limit(10);

    // Taxa de sucesso
    const total = totalEmails[0]?.count || 0;
    const sent = sentEmails[0]?.count || 0;
    const failed = failedEmails[0]?.count || 0;
    const successRate = total > 0 ? ((sent / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      sent,
      failed,
      successRate: parseFloat(successRate),
      recentEmails: recentEmails[0]?.count || 0,
      emailsByType: emailsByType.map((item) => ({
        type: item.subject,
        count: item.count,
      })),
    };
  }),

  /**
   * Obter detalhes de um email específico
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      // Apenas admin e RH podem acessar
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const email = await db
        .select()
        .from(emailMetrics)
        .where(eq(emailMetrics.id, input.id))
        .limit(1);

      if (email.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email não encontrado",
        });
      }

      return email[0];
    }),

  /**
   * Reenviar email falhado
   */
  resend: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode reenviar
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem reenviar emails.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const email = await db
        .select()
        .from(emailMetrics)
        .where(eq(emailMetrics.id, input.id))
        .limit(1);

      if (email.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email não encontrado",
        });
      }

      const emailData = email[0];

      // Atualizar para reenvio (marcar como não enviado)
      await db
        .update(emailMetrics)
        .set({
          success: false,
          error: null,
        })
        .where(eq(emailMetrics.id, input.id));

      // Aqui você pode adicionar lógica para reenviar o email
      // Por exemplo, chamar sendEmail() novamente

      return {
        success: true,
        message: "Email marcado para reenvio",
      };
    }),

  /**
   * Obter gráfico de emails por dia (últimos 30 dias)
   */
  chartData: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    // Apenas admin e RH podem acessar
    if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado.",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const adminRhCondition = or(
      like(emailMetrics.subject, "%Admin%"),
      like(emailMetrics.subject, "%RH%"),
      like(emailMetrics.subject, "%Sistema AVD UISA%"),
      like(emailMetrics.subject, "%Novo usuário%"),
      like(emailMetrics.subject, "%Novo funcionário%"),
      like(emailMetrics.subject, "%Ciclo de avaliação%"),
      like(emailMetrics.subject, "%Avaliação 360%"),
      like(emailMetrics.subject, "%Meta%"),
      like(emailMetrics.subject, "%PDI%"),
      like(emailMetrics.subject, "%Nine Box%"),
      like(emailMetrics.subject, "%Alerta de Segurança%"),
      like(emailMetrics.subject, "%Resumo Diário%")
    );

    const emailsByDay = await db
      .select({
        date: sql<string>`DATE(${emailMetrics.sentAt})`,
        sent: sql<number>`SUM(CASE WHEN ${emailMetrics.success} = 1 THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${emailMetrics.success} = 0 THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(emailMetrics)
      .where(and(adminRhCondition, gte(emailMetrics.sentAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${emailMetrics.sentAt})`)
      .orderBy(sql`DATE(${emailMetrics.sentAt})`);

    return emailsByDay.map((item) => ({
      date: item.date,
      sent: Number(item.sent),
      failed: Number(item.failed),
      total: item.total,
    }));
  }),
});
