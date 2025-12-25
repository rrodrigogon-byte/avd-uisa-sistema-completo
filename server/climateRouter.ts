import { z } from "zod";
import { router, protectedProcedure, adminProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { climateSurveys, climateQuestions, climateResponses, climateResults, climateDimensions } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

/**
 * Router simplificado para Pesquisa de Clima Organizacional
 */
export const climateRouter = router({
  
  // Criar pesquisa
  createSurvey: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      isAnonymous: z.boolean().default(true),
      targetDepartments: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [survey] = await db.insert(climateSurveys).values({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        createdBy: ctx.user.id,
      });

      return { success: true, surveyId: survey.insertId };
    }),

  // Listar pesquisas
  listSurveys: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "closed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(climateSurveys);
      
      if (input?.status) {
        query = query.where(eq(climateSurveys.status, input.status)) as any;
      }

      return await query.orderBy(desc(climateSurveys.createdAt));
    }),

  // Adicionar pergunta
  addQuestion: adminProcedure
    .input(z.object({
      surveyId: z.number(),
      dimensionId: z.number(),
      questionText: z.string().min(1),
      questionType: z.enum(["scale", "multiple_choice", "text", "yes_no"]),
      options: z.array(z.string()).optional(),
      scaleMin: z.number().optional(),
      scaleMax: z.number().optional(),
      isRequired: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(climateQuestions).values(input);
      return { success: true };
    }),

  // Listar perguntas
  listQuestions: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(climateQuestions)
        .where(eq(climateQuestions.surveyId, input.surveyId))
        .orderBy(climateQuestions.displayOrder);
    }),

  // Submeter respostas (anônimo)
  submitResponses: publicProcedure
    .input(z.object({
      surveyId: z.number(),
      employeeId: z.number(),
      departmentId: z.number().optional(),
      hierarchyLevel: z.string().optional(),
      responses: z.array(z.object({
        questionId: z.number(),
        responseValue: z.number().optional(),
        responseText: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Gerar token anônimo
      const responseToken = crypto
        .createHash("sha256")
        .update(`${input.employeeId}-${input.surveyId}-${Date.now()}`)
        .digest("hex");

      // Inserir respostas
      const values = input.responses.map(r => ({
        surveyId: input.surveyId,
        questionId: r.questionId,
        responseToken,
        departmentId: input.departmentId,
        hierarchyLevel: input.hierarchyLevel,
        responseValue: r.responseValue,
        responseText: r.responseText,
      }));

      await db.insert(climateResponses).values(values);

      return { success: true };
    }),

  // Calcular resultados
  calculateResults: adminProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar todas as respostas
      const responses = await db
        .select()
        .from(climateResponses)
        .where(eq(climateResponses.surveyId, input.surveyId));

      // Buscar perguntas com dimensões
      const questions = await db
        .select()
        .from(climateQuestions)
        .where(eq(climateQuestions.surveyId, input.surveyId));

      // Agrupar por dimensão
      const dimensionMap = new Map<number, number[]>();

      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question || !response.responseValue) continue;

        if (!dimensionMap.has(question.dimensionId)) {
          dimensionMap.set(question.dimensionId, []);
        }
        dimensionMap.get(question.dimensionId)!.push(response.responseValue);
      }

      // Calcular médias e inserir resultados
      const results = [];
      for (const [dimensionId, values] of dimensionMap.entries()) {
        const averageScore = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 20); // Converter para 0-100
        
        results.push({
          surveyId: input.surveyId,
          dimensionId,
          averageScore,
          responseCount: values.length,
        });
      }

      // Deletar resultados antigos
      await db.delete(climateResults).where(eq(climateResults.surveyId, input.surveyId));

      // Inserir novos resultados
      if (results.length > 0) {
        await db.insert(climateResults).values(results);
      }

      return { success: true, resultsCount: results.length };
    }),

  // Obter resultados
  getResults: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select({
          id: climateResults.id,
          dimensionId: climateResults.dimensionId,
          dimensionName: climateDimensions.name,
          averageScore: climateResults.averageScore,
          responseCount: climateResults.responseCount,
        })
        .from(climateResults)
        .leftJoin(climateDimensions, eq(climateResults.dimensionId, climateDimensions.id))
        .where(eq(climateResults.surveyId, input.surveyId));
    }),

  // Listar dimensões
  listDimensions: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(climateDimensions)
        .where(eq(climateDimensions.active, true))
        .orderBy(climateDimensions.displayOrder);
    }),
});
