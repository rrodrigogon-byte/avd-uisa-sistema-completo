import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const notificationsRouter = router({
  // Alias para compatibilidade com NotificationBell
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50).optional(),
        onlyUnread: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(notifications.userId, ctx.user.id)];
      
      if (input?.onlyUnread) {
        conditions.push(eq(notifications.read, false));
      }

      const result = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit || 50);

      return result;
    }),

  // Listar notificações do usuário com paginação e filtros
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
        onlyUnread: z.boolean().optional(),
        type: z.string().optional(),
        sortBy: z.enum(['createdAt', 'type']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(notifications.userId, ctx.user.id)];
      
      if (input.onlyUnread) {
        conditions.push(eq(notifications.read, false));
      }
      
      if (input.type) {
        conditions.push(eq(notifications.type, input.type));
      }

      // Calcular offset
      const offset = (input.page - 1) * input.limit;

      // Ordenação
      const orderColumn = input.sortBy === 'createdAt' ? notifications.createdAt : notifications.type;
      const orderFn = input.sortOrder === 'asc' ? orderColumn : desc(orderColumn);

      const result = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(orderFn)
        .limit(input.limit)
        .offset(offset);

      // Contar total
      const totalResult = await db
        .select()
        .from(notifications)
        .where(and(...conditions));
      
      const total = totalResult.length;
      const totalPages = Math.ceil(total / input.limit);

      return {
        data: result,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
        },
      };
    }),

  // Contar notificações não lidas
  countUnread: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));

    return { count: result.length };
  }),

  // Marcar notificação como lida
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: protectedProcedure.input(z.object({}).optional()).mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));

    return { success: true };
  }),

  // Buscar notificações in-app (alias para compatibilidade com InAppNotifications)
  getInApp: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return result.map(n => ({
      id: n.id.toString(),
      type: n.type === 'draft_reminder' ? 'draft_reminder' as const : 'info' as const,
      title: n.title,
      message: n.message,
      link: n.link || undefined,
      createdAt: n.createdAt,
      read: n.read
    }));
  }),

  // Deletar notificação
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),
});
