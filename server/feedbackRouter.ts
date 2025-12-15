import { desc, eq, and, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { feedbacks, employees, pdiPlans } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { notifyNewFeedback } from "./notificationEvents";
import { sendFeedbackReceivedEmail } from "./_core/email";

export const feedbackRouter = router({
  // Criar novo feedback
  create: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      type: z.enum(["positivo", "construtivo", "desenvolvimento"]),
      category: z.string().optional(),
      content: z.string(),
      context: z.string().optional(),
      actionItems: z.string().optional(), // JSON string
      linkedPDIId: z.number().optional(),
      isPrivate: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(feedbacks).values({
        managerId: ctx.user.id,
        ...input,
      });

      // Verificar badges de feedback ao criar
      if (input.employeeId) {
        const { checkFeedbackBadges } = await import("./services/badgeService");
        await checkFeedbackBadges(input.employeeId);
      }

      // Enviar notificação de novo feedback
      const managerResult = await database.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);
      const managerName = managerResult[0]?.name || "Seu gestor";
      await notifyNewFeedback(input.employeeId, managerName);
      
      // Enviar email para o colaborador sobre o novo feedback
      const employeeResult = await database.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
      if (employeeResult[0]?.email) {
        await sendFeedbackReceivedEmail(
          employeeResult[0].email,
          employeeResult[0].name,
          managerName,
          input.type
        );
      }

      return { success: true };
    }),

  // Listar feedbacks (gestor vê todos que deu, colaborador vê apenas os seus)
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      type: z.enum(["positivo", "construtivo", "desenvolvimento"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) return [];

      let query = database.select({
        feedback: feedbacks,
        employee: employees,
      })
        .from(feedbacks)
        .leftJoin(employees, eq(feedbacks.employeeId, employees.id));

      // Se for colaborador, só vê os próprios feedbacks
      if (ctx.user.role === "colaborador") {
        const employee = await database.select()
          .from(employees)
          .where(eq(employees.userId, ctx.user.id))
          .limit(1);
        
        if (employee.length === 0) return [];
        
        const results = await query.where(eq(feedbacks.employeeId, employee[0].id));
        return results;
      }

      // Se for gestor/admin, aplica filtros
      const conditions = [];
      
      if (input.employeeId) {
        conditions.push(eq(feedbacks.employeeId, input.employeeId));
      } else if (ctx.user.role === "gestor") {
        // Gestor vê apenas feedbacks que ele deu
        conditions.push(eq(feedbacks.managerId, ctx.user.id));
      }

      if (input.type) {
        conditions.push(eq(feedbacks.type, input.type));
      }

      if (conditions.length > 0) {
        return await query.where(and(...conditions));
      }

      return await query;
    }),

  // Buscar histórico de um colaborador específico
  getHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) return [];

      const history = await database.select()
        .from(feedbacks)
        .where(eq(feedbacks.employeeId, input.employeeId))
        .orderBy(desc(feedbacks.createdAt));

      return history;
    }),

  // Marcar feedback como visualizado
  acknowledge: protectedProcedure
    .input(z.object({
      feedbackId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.update(feedbacks)
        .set({ acknowledgedAt: new Date() })
        .where(eq(feedbacks.id, input.feedbackId));

      return { success: true };
    }),

  // Buscar estatísticas de feedback
  getStats: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) return { total: 0, positivo: 0, construtivo: 0, desenvolvimento: 0 };

      const conditions = [];

      if (input.employeeId) {
        conditions.push(eq(feedbacks.employeeId, input.employeeId));
      } else if (ctx.user.role === "gestor") {
        conditions.push(eq(feedbacks.managerId, ctx.user.id));
      }

      const allFeedbacks = conditions.length > 0
        ? await database.select().from(feedbacks).where(and(...conditions))
        : await database.select().from(feedbacks);

      return {
        total: allFeedbacks.length,
        positivo: allFeedbacks.filter((f: any) => f.type === "positivo").length,
        construtivo: allFeedbacks.filter((f: any) => f.type === "construtivo").length,
        desenvolvimento: allFeedbacks.filter((f: any) => f.type === "desenvolvimento").length,
      };
    }),
});
