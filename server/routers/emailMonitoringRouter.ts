/**
 * Router de Monitoramento de E-mails
 * Sistema AVD UISA - Avaliação de Desempenho
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailLogs } from "../../drizzle/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const emailMonitoringRouter = router({
  /**
   * Buscar estatísticas gerais de e-mails
   */
  getEmailStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas administradores podem acessar estas estatísticas',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    // Calcular data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar estatísticas
    const stats = await db
      .select({
        totalSent: sql<number>`COUNT(*)`,
        successCount: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
        failedCount: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
        pendingCount: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(emailLogs)
      .where(gte(emailLogs.createdAt, thirtyDaysAgo));

    const result = stats[0];
    const totalSent = Number(result.totalSent) || 0;
    const successCount = Number(result.successCount) || 0;
    const failedCount = Number(result.failedCount) || 0;
    const pendingCount = Number(result.pendingCount) || 0;

    const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;
    const failureRate = totalSent > 0 ? Math.round((failedCount / totalSent) * 100) : 0;

    return {
      totalSent,
      successCount,
      failedCount,
      pendingCount,
      successRate,
      failureRate,
    };
  }),

  /**
   * Buscar histórico recente de e-mails
   */
  getRecentEmails: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem acessar o histórico de e-mails',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const emails = await db
        .select()
        .from(emailLogs)
        .orderBy(desc(emailLogs.createdAt))
        .limit(input.limit);

      return emails;
    }),

  /**
   * Buscar e-mails por tipo
   */
  getEmailsByType: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas administradores podem acessar estas estatísticas',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    // Calcular data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emailsByType = await db
      .select({
        type: emailLogs.type,
        count: sql<number>`COUNT(*)`,
        successCount: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
      })
      .from(emailLogs)
      .where(gte(emailLogs.createdAt, thirtyDaysAgo))
      .groupBy(emailLogs.type);

    return emailsByType.map((item) => {
      const count = Number(item.count) || 0;
      const successCount = Number(item.successCount) || 0;
      const successRate = count > 0 ? Math.round((successCount / count) * 100) : 0;

      return {
        type: item.type || 'Geral',
        count,
        successCount,
        successRate,
      };
    });
  }),

  /**
   * Reenviar e-mail falhado
   */
  retryFailedEmail: protectedProcedure
    .input(
      z.object({
        emailId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem reenviar e-mails',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      // Buscar e-mail
      const email = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.id, input.emailId))
        .limit(1);

      if (email.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'E-mail não encontrado',
        });
      }

      // Atualizar status para pending para tentar reenviar
      await db
        .update(emailLogs)
        .set({
          status: 'pending',
          errorMessage: null,
        })
        .where(eq(emailLogs.id, input.emailId));

      return { success: true };
    }),
});
