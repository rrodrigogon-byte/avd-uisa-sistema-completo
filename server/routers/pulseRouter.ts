import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { pulseSurveys, pulseSurveyResponses, employees } from "../../drizzle/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

// Schema de validação
const createSurveySchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  question: z.string().min(10, "Pergunta deve ter no mínimo 10 caracteres"),
  description: z.string().optional(),
  targetDepartmentId: z.number().optional(),
});

const submitResponseSchema = z.object({
  surveyId: z.number(),
  rating: z.number().min(0).max(10),
  comment: z.string().optional(),
  employeeId: z.number().optional(),
});

export const pulseRouter = router({
  // Listar todas as pesquisas
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const surveys = await db
      .select({
        id: pulseSurveys.id,
        title: pulseSurveys.title,
        question: pulseSurveys.question,
        status: pulseSurveys.status,
        createdAt: pulseSurveys.createdAt,
        totalEmployees: sql<number>`50`, // TODO: calcular do banco
      })
      .from(pulseSurveys)
      .orderBy(desc(pulseSurveys.createdAt));

    // Para cada pesquisa, buscar contagem de respostas e média
    const surveysWithStats = await Promise.all(
      surveys.map(async (survey) => {
        const stats = await db
          .select({
            responses: count(),
            avgScore: sql<number>`COALESCE(AVG(${pulseSurveyResponses.rating}), 0)`,
          })
          .from(pulseSurveyResponses)
          .where(eq(pulseSurveyResponses.surveyId, survey.id))
          .then((r) => r[0]);

        return {
          ...survey,
          responses: stats?.responses || 0,
          avgScore: stats?.avgScore ? Number(stats.avgScore.toFixed(1)) : 0,
        };
      })
    );

    return surveysWithStats;
  }),

  // Buscar pesquisa por ID (pública - para responder)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const survey = await db
        .select()
        .from(pulseSurveys)
        .where(eq(pulseSurveys.id, input.id))
        .limit(1)
        .then((r) => r[0]);

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesquisa não encontrada",
        });
      }

      return survey;
    }),

  // Criar nova pesquisa
  create: protectedProcedure
    .input(createSurveySchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se usuário tem permissão (RH ou Admin)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem criar pesquisas",
        });
      }

      const [newSurvey] = await db.insert(pulseSurveys).values({
        title: input.title,
        question: input.question,
        description: input.description,
        targetDepartmentId: input.targetDepartmentId,
        createdById: ctx.user.id,
        status: "draft",
      });

      return {
        id: newSurvey.insertId,
        ...input,
        status: "draft" as const,
        responses: 0,
        totalEmployees: 50,
        avgScore: 0,
        createdAt: new Date().toISOString(),
      };
    }),

  // Ativar pesquisa (enviar para colaboradores)
  activate: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem ativar pesquisas",
        });
      }

      await db
        .update(pulseSurveys)
        .set({
          status: "active",
          activatedAt: new Date(),
        })
        .where(eq(pulseSurveys.id, input.surveyId));

      return {
        success: true,
        message: "Pesquisa ativada com sucesso!",
      };
    }),

  // Enviar resposta (pública - sem autenticação)
  submitResponse: publicProcedure
    .input(submitResponseSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se pesquisa está ativa
      const survey = await db
        .select()
        .from(pulseSurveys)
        .where(eq(pulseSurveys.id, input.surveyId))
        .limit(1)
        .then((r) => r[0]);

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesquisa não encontrada",
        });
      }

      if (survey.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta pesquisa não está mais ativa",
        });
      }

      // Salvar resposta
      await db.insert(pulseSurveyResponses).values({
        surveyId: input.surveyId,
        employeeId: input.employeeId || null,
        rating: input.rating,
        comment: input.comment || null,
      });

      return {
        success: true,
        message: "Resposta enviada com sucesso!",
      };
    }),

  // Obter resultados de uma pesquisa
  getResults: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar estatísticas gerais
      const stats = await db
        .select({
          totalResponses: count(),
          avgScore: sql<number>`COALESCE(AVG(${pulseSurveyResponses.rating}), 0)`,
        })
        .from(pulseSurveyResponses)
        .where(eq(pulseSurveyResponses.surveyId, input.surveyId))
        .then((r) => r[0]);

      // Buscar distribuição de notas
      const distribution = await db
        .select({
          rating: pulseSurveyResponses.rating,
          count: count(),
        })
        .from(pulseSurveyResponses)
        .where(eq(pulseSurveyResponses.surveyId, input.surveyId))
        .groupBy(pulseSurveyResponses.rating);

      // Converter para objeto { 0: 0, 1: 0, ..., 10: 0 }
      const distributionObj: Record<number, number> = {};
      for (let i = 0; i <= 10; i++) {
        distributionObj[i] = 0;
      }
      distribution.forEach((d) => {
        distributionObj[d.rating] = d.count;
      });

      // Buscar comentários
      const comments = await db
        .select({
          id: pulseSurveyResponses.id,
          rating: pulseSurveyResponses.rating,
          comment: pulseSurveyResponses.comment,
          createdAt: pulseSurveyResponses.createdAt,
        })
        .from(pulseSurveyResponses)
        .where(
          and(
            eq(pulseSurveyResponses.surveyId, input.surveyId),
            sql`${pulseSurveyResponses.comment} IS NOT NULL`
          )
        )
        .orderBy(desc(pulseSurveyResponses.createdAt))
        .limit(50);

      return {
        surveyId: input.surveyId,
        totalResponses: stats?.totalResponses || 0,
        avgScore: stats?.avgScore ? Number(stats.avgScore.toFixed(1)) : 0,
        distribution: distributionObj,
        comments: comments.map((c) => ({
          id: c.id,
          rating: c.rating,
          comment: c.comment || "",
          createdAt: c.createdAt.toISOString().split("T")[0],
        })),
      };
    }),

  // Enviar convites por e-mail
  sendInvitations: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem enviar convites",
        });
      }

      // Buscar pesquisa
      const survey = await db
        .select()
        .from(pulseSurveys)
        .where(eq(pulseSurveys.id, input.surveyId))
        .limit(1)
        .then((r) => r[0]);

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesquisa não encontrada",
        });
      }

      // Buscar todos os colaboradores
      const allEmployees = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
        })
        .from(employees);

      // TODO: Implementar envio de e-mail real usando emailService
      // Por enquanto, apenas simular o envio
      console.log(`[Pulse] Enviando convites da pesquisa ${survey.title} para ${allEmployees.length} colaboradores`);

      // Ativar pesquisa automaticamente após envio
      await db
        .update(pulseSurveys)
        .set({
          status: "active",
          activatedAt: new Date(),
        })
        .where(eq(pulseSurveys.id, input.surveyId));

      return {
        success: true,
        message: `Convites enviados para ${allEmployees.length} colaboradores!`,
        sentCount: allEmployees.length,
      };
    }),

  // Fechar pesquisa
  close: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem fechar pesquisas",
        });
      }

      await db
        .update(pulseSurveys)
        .set({
          status: "closed",
          closedAt: new Date(),
        })
        .where(eq(pulseSurveys.id, input.surveyId));

      return {
        success: true,
        message: "Pesquisa encerrada com sucesso!",
      };
    }),
});
