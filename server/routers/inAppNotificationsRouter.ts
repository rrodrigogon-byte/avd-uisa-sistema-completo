import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, pirIntegrityAssessments, employees } from "../../drizzle/schema";
import { eq, and, desc, isNull, lt, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Notificações In-App
 * Gerencia notificações do sistema, incluindo alertas de testes pendentes
 */

export const inAppNotificationsRouter = router({
  /**
   * Listar notificações do usuário logado
   */
  list: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().optional(),
      limit: z.number().optional().default(50),
    }).default({}))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar employee_id do usuário logado
      const employeeResult = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, ctx.user.email || ""))
        .limit(1);

      if (employeeResult.length === 0) {
        return [];
      }

      const employeeId = employeeResult[0].id;

      // Construir query
      const conditions = [eq(notifications.userId, employeeId)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.read, false));
      }

      const result = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return result;
    }),

  /**
   * Contar notificações não lidas
   */
  countUnread: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar employee_id do usuário logado
      const employeeResult = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, ctx.user.email || ""))
        .limit(1);

      if (employeeResult.length === 0) {
        return 0;
      }

      const employeeId = employeeResult[0].id;

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, employeeId),
          eq(notifications.read, false)
        ));

      return result[0]?.count || 0;
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar employee_id do usuário logado
      const employeeResult = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, ctx.user.email || ""))
        .limit(1);

      if (employeeResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      const employeeId = employeeResult[0].id;

      // Verificar se a notificação pertence ao usuário
      const notification = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, employeeId)
        ))
        .limit(1);

      if (notification.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      // Marcar como lida
      await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date()
        })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Marcar todas as notificações como lidas
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar employee_id do usuário logado
      const employeeResult = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, ctx.user.email || ""))
        .limit(1);

      if (employeeResult.length === 0) {
        return { success: true, count: 0 };
      }

      const employeeId = employeeResult[0].id;

      // Marcar todas como lidas
      const result = await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date()
        })
        .where(and(
          eq(notifications.userId, employeeId),
          eq(notifications.read, false)
        ));

      return { success: true };
    }),

  /**
   * Detectar e criar notificações para testes de integridade pendentes
   */
  detectPendingTests: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar employee_id do usuário logado
      const employeeResult = await db
        .select({ id: employees.id, name: employees.name })
        .from(employees)
        .where(eq(employees.email, ctx.user.email || ""))
        .limit(1);

      if (employeeResult.length === 0) {
        return { created: 0 };
      }

      const employee = employeeResult[0];

      // Buscar testes pendentes (não completados)
      const pendingTests = await db
        .select({
          id: pirIntegrityAssessments.id,
          expiresAt: pirIntegrityAssessments.expiresAt,
        })
        .from(pirIntegrityAssessments)
        .where(and(
          eq(pirIntegrityAssessments.employeeId, employee.id),
          isNull(pirIntegrityAssessments.completedAt)
        ));

      let createdCount = 0;
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      for (const test of pendingTests) {
        const expiresAt = test.expiresAt ? new Date(test.expiresAt) : null;

        // Verificar se já existe notificação para este teste
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(and(
            eq(notifications.userId, employee.id),
            eq(notifications.type, "pending_integrity_test"),
            eq(notifications.link, `/integridade/pir/teste/${test.id}`)
          ))
          .limit(1);

        if (existingNotification.length > 0) {
          continue; // Já existe notificação
        }

        // Determinar tipo de alerta
        let title = "";
        let message = "";
        let isUrgent = false;

        if (expiresAt && expiresAt <= now) {
          // Teste expirado
          title = "⚠️ Teste de Integridade Expirado";
          message = `Olá ${employee.name}, seu teste de integridade expirou. Entre em contato com o RH.`;
          isUrgent = true;
        } else if (expiresAt && expiresAt <= threeDaysFromNow) {
          // Teste próximo de expirar (3 dias ou menos)
          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          title = `⏰ Teste de Integridade Expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`;
          message = `Olá ${employee.name}, você tem um teste de integridade pendente que expira em breve. Complete-o o quanto antes!`;
          isUrgent = true;
        } else {
          // Teste pendente normal
          title = "📋 Teste de Integridade Pendente";
          message = `Olá ${employee.name}, você tem um teste de integridade aguardando sua resposta.`;
        }

        // Criar notificação
        await db.insert(notifications).values({
          userId: employee.id,
          type: "pending_integrity_test",
          title,
          message,
          link: `/integridade/pir/teste/${test.id}`,
          read: false,
        });

        createdCount++;
      }

      return { created: createdCount };
    }),

  /**
   * Criar notificação manual (para uso interno do sistema)
   */
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.string(),
      title: z.string(),
      message: z.string().optional(),
      link: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message || null,
        link: input.link || null,
        read: false,
      });

      return { success: true, id: result[0].insertId };
    }),
});
