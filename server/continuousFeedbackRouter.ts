/**
 * Continuous Feedback Router
 * Sistema de Feedback 360° Contínuo com solicitações ad-hoc
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  feedbacks,
  employees,
  departments,
  positions,
  notifications,
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Analisar sentimento de texto (simplificado)
 * Retorna score de -100 (muito negativo) a +100 (muito positivo)
 */
function analyzeSentiment(text1: string, text2: string = ""): { score: number; label: string } {
  const combinedText = `${text1} ${text2}`.toLowerCase();
  
  // Palavras positivas e negativas (simplificado)
  const positiveWords = ['excelente', 'ótimo', 'bom', 'parabéns', 'sucesso', 'eficiente', 'proativo', 'dedicado', 'comprometido', 'talentoso'];
  const negativeWords = ['ruim', 'péssimo', 'problema', 'dificuldade', 'falha', 'erro', 'atrasado', 'desorganizado', 'ineficiente'];
  
  let score = 0;
  
  positiveWords.forEach(word => {
    const count = (combinedText.match(new RegExp(word, 'g')) || []).length;
    score += count * 10;
  });
  
  negativeWords.forEach(word => {
    const count = (combinedText.match(new RegExp(word, 'g')) || []).length;
    score -= count * 10;
  });
  
  // Normalizar entre -100 e 100
  score = Math.max(-100, Math.min(100, score));
  
  let label = 'neutro';
  if (score > 30) label = 'positivo';
  else if (score < -30) label = 'negativo';
  
  return { score, label };
}

/**
 * Extrair temas comuns de uma lista de textos
 * Retorna os temas mais frequentes com exemplos
 */
function extractCommonThemes(texts: string[]): Array<{ theme: string; count: number; examples: string[] }> {
  if (texts.length === 0) return [];
  
  // Análise simplificada - contar palavras-chave
  const themes: Record<string, string[]> = {};
  const keywords = ["comunicação", "liderança", "técnico", "equipe", "prazo", "qualidade", "proatividade", "organização", "conhecimento", "relacionamento"];
  
  texts.forEach((text) => {
    const lowerText = text.toLowerCase();
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        if (!themes[keyword]) themes[keyword] = [];
        themes[keyword].push(text.slice(0, 100)); // Primeiros 100 chars como exemplo
      }
    });
  });
  
  return Object.entries(themes)
    .map(([theme, examples]) => ({
      theme,
      count: examples.length,
      examples: examples.slice(0, 3), // Top 3 exemplos
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 temas
}

export const continuousFeedbackRouter = router({
  /**
   * Solicitar feedback ad-hoc
   */
  requestFeedback: protectedProcedure
    .input(
      z.object({
        respondentId: z.number(),
        context: z.enum(["project_completion", "skill_assessment", "behavior_feedback", "general_feedback", "competency_specific"]),
        projectName: z.string().optional(),
        competencyId: z.number().optional(),
        isAnonymous: z.boolean().default(false),
        customQuestions: z
          .array(
            z.object({
              question: z.string(),
              type: z.enum(["text", "rating", "scale", "multipleChoice"]),
              options: z.array(z.string()).optional(),
            })
          )
          .optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar solicitação de feedback
      const [feedbackRequest] = await db.insert(feedbacks).values({
        giverId: input.respondentId,
        receiverId: ctx.user.id,
        type: input.context === "competency_specific" ? "competencia" : "geral",
        rating: null, // Será preenchido quando responder
        comment: JSON.stringify({
          status: "pending",
          context: input.context,
          projectName: input.projectName,
          competencyId: input.competencyId,
          isAnonymous: input.isAnonymous,
          customQuestions: input.customQuestions || [],
          dueDate: input.dueDate,
        }),
      });

      // Criar notificação para o respondente
      await db.insert(notifications).values({
        userId: input.respondentId,
        type: "feedback_request",
        title: "Nova solicitação de feedback",
        message: `${ctx.user.name} solicitou seu feedback${input.projectName ? ` sobre o projeto "${input.projectName}"` : ""}`,
        data: JSON.stringify({
          feedbackId: feedbackRequest.insertId,
          requesterId: ctx.user.id,
          requesterName: ctx.user.name,
        }),
      });

      return {
        id: feedbackRequest.insertId,
        message: "Solicitação de feedback enviada com sucesso!",
      };
    }),

  /**
   * Listar solicitações de feedback pendentes
   */
  pendingRequests: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const requests = await db
      .select({
        id: feedbacks.id,
        requester: employees.name,
        context: feedbacks.comment,
        createdAt: feedbacks.createdAt,
      })
      .from(feedbacks)
      .leftJoin(employees, eq(feedbacks.receiverId, employees.id))
      .where(and(eq(feedbacks.giverId, ctx.user.id), eq(feedbacks.rating, null)))
      .orderBy(desc(feedbacks.createdAt));

    return requests.map((r) => {
      let data: any = {};
      try {
        data = r.context ? JSON.parse(r.comment as string) : {};
      } catch (e) {
        console.error('[Feedback] Erro ao fazer parse de JSON:', e);
      }
      return {
        id: r.id,
        requesterName: r.requester,
        context: data.context || "general_feedback",
        projectName: data.projectName,
        isAnonymous: data.isAnonymous || false,
        customQuestions: data.customQuestions || [],
        dueDate: data.dueDate,
        createdAt: r.createdAt,
      };
    });
  }),

  /**
   * Responder solicitação de feedback
   */
  respondFeedback: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        overallRating: z.number().min(1).max(5),
        responses: z.array(
          z.object({
            question: z.string(),
            answer: z.union([z.string(), z.number(), z.array(z.string())]),
          })
        ),
        strengths: z.string().optional(),
        areasForImprovement: z.string().optional(),
        specificExamples: z.string().optional(),
        additionalComments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar solicitação
      const [request] = await db.select().from(feedbacks).where(eq(feedbacks.id, input.feedbackId)).limit(1);

      if (!request || request.giverId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para responder este feedback" });
      }

      // Calcular sentimento (simplificado)
      const sentiment = analyzeSentiment(input.areasForImprovement || "", input.additionalComments || "");

      // Atualizar feedback com resposta
      await db
        .update(feedbacks)
        .set({
          rating: input.overallRating,
          comment: JSON.stringify({
            ...JSON.parse(request.comment as string),
            status: "completed",
            responses: input.responses,
            strengths: input.strengths,
            areasForImprovement: input.areasForImprovement,
            specificExamples: input.specificExamples,
            additionalComments: input.additionalComments,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            respondedAt: new Date().toISOString(),
          }),
        })
        .where(eq(feedbacks.id, input.feedbackId));

      // Notificar solicitante
      const requestData = JSON.parse(request.comment as string);
      if (!requestData.isAnonymous) {
        await db.insert(notifications).values({
          userId: request.receiverId,
          type: "feedback_received",
          title: "Feedback recebido",
          message: `${ctx.user.name} respondeu sua solicitação de feedback`,
          data: JSON.stringify({
            feedbackId: input.feedbackId,
            rating: input.overallRating,
          }),
        });
      }

      return { message: "Feedback enviado com sucesso!" };
    }),

  /**
   * Dashboard de feedback do usuário
   */
  myFeedbackDashboard: protectedProcedure
    .input(
      z.object({
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const periodStart = input.periodStart ? new Date(input.periodStart) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias atrás
      const periodEnd = input.periodEnd ? new Date(input.periodEnd) : new Date();

      // Feedbacks recebidos
      const feedbacksReceived = await db
        .select()
        .from(feedbacks)
        .where(
          and(
            eq(feedbacks.receiverId, ctx.user.id),
            gte(feedbacks.createdAt, periodStart),
            lte(feedbacks.createdAt, periodEnd)
          )
        );

      // Feedbacks dados
      const feedbacksGiven = await db
        .select()
        .from(feedbacks)
        .where(
          and(
            eq(feedbacks.giverId, ctx.user.id),
            gte(feedbacks.createdAt, periodStart),
            lte(feedbacks.createdAt, periodEnd)
          )
        );

      // Calcular estatísticas
      const completedReceived = feedbacksReceived.filter((f) => f.rating !== null);
      const avgRating = completedReceived.length > 0 ? completedReceived.reduce((sum, f) => sum + (f.rating || 0), 0) / completedReceived.length : 0;

      // Análise de sentimento agregada
      let totalSentiment = 0;
      let sentimentCount = 0;
      const strengths: string[] = [];
      const improvements: string[] = [];

      completedReceived.forEach((f) => {
        try {
          const data = JSON.parse(f.comment as string);
          if (data.sentimentScore) {
            totalSentiment += data.sentimentScore;
            sentimentCount++;
          }
          if (data.strengths) strengths.push(data.strengths);
          if (data.areasForImprovement) improvements.push(data.areasForImprovement);
        } catch (e) {
          // Ignorar erros de parse
        }
      });

      const overallSentiment = sentimentCount > 0 ? Math.round(totalSentiment / sentimentCount) : 0;

      // Extrair temas comuns (simplificado)
      const commonStrengths = extractCommonThemes(strengths);
      const commonImprovements = extractCommonThemes(improvements);

      return {
        periodStart,
        periodEnd,
        totalFeedbackReceived: feedbacksReceived.length,
        totalFeedbackGiven: feedbacksGiven.length,
        completedFeedbackReceived: completedReceived.length,
        pendingFeedbackReceived: feedbacksReceived.length - completedReceived.length,
        averageRatingReceived: Math.round(avgRating * 10) / 10,
        overallSentimentScore: overallSentiment,
        commonStrengths,
        commonImprovements,
        recentFeedbacks: completedReceived.slice(0, 5).map((f) => {
          const data = JSON.parse(f.comment as string);
          return {
            id: f.id,
            rating: f.rating,
            strengths: data.strengths,
            improvements: data.areasForImprovement,
            date: f.createdAt,
          };
        }),
      };
    }),

  /**
   * Listar templates de feedback
   */
  listTemplates: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Templates pré-definidos (hardcoded por enquanto)
    const templates = [
      {
        id: 1,
        name: "Feedback de Liderança",
        category: "leadership",
        questions: [
          { id: "1", question: "Como você avalia a capacidade de comunicação?", type: "rating", required: true },
          { id: "2", question: "Como você avalia a capacidade de tomar decisões?", type: "rating", required: true },
          { id: "3", question: "Dê exemplos específicos de situações de liderança", type: "text", required: false },
        ],
      },
      {
        id: 2,
        name: "Feedback de Habilidades Técnicas",
        category: "technical_skills",
        questions: [
          { id: "1", question: "Como você avalia o conhecimento técnico?", type: "rating", required: true },
          { id: "2", question: "Como você avalia a capacidade de resolver problemas?", type: "rating", required: true },
          { id: "3", question: "Quais habilidades técnicas se destacam?", type: "text", required: false },
        ],
      },
      {
        id: 3,
        name: "Feedback de Soft Skills",
        category: "soft_skills",
        questions: [
          { id: "1", question: "Como você avalia a capacidade de trabalho em equipe?", type: "rating", required: true },
          { id: "2", question: "Como você avalia a comunicação interpessoal?", type: "rating", required: true },
          { id: "3", question: "Como você avalia a adaptabilidade?", type: "rating", required: true },
        ],
      },
      {
        id: 4,
        name: "Feedback de Projeto",
        category: "project_work",
        questions: [
          { id: "1", question: "Como você avalia a qualidade das entregas?", type: "rating", required: true },
          { id: "2", question: "Como você avalia o cumprimento de prazos?", type: "rating", required: true },
          { id: "3", question: "Como você avalia a colaboração no projeto?", type: "rating", required: true },
          { id: "4", question: "O que funcionou bem neste projeto?", type: "text", required: false },
          { id: "5", question: "O que poderia ser melhorado?", type: "text", required: false },
        ],
      },
    ];

    return templates;
  }),

  /**
   * Evolução de feedback ao longo do tempo
   */
  feedbackEvolution: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const employeeId = input.employeeId || ctx.user.id;

      // Buscar feedbacks dos últimos 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const feedbacks = await db
        .select()
        .from(feedbacks)
        .where(and(eq(feedbacks.receiverId, employeeId), gte(feedbacks.createdAt, twelveMonthsAgo)))
        .orderBy(feedbacks.createdAt);

      // Agrupar por mês
      const monthlyData: Record<string, { ratings: number[]; count: number }> = {};

      feedbacks.forEach((f) => {
        if (f.rating) {
          const month = new Date(f.createdAt).toISOString().slice(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { ratings: [], count: 0 };
          }
          monthlyData[month].ratings.push(f.rating);
          monthlyData[month].count++;
        }
      });

      // Calcular médias mensais
      const evolution = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        averageRating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
        feedbackCount: data.count,
      }));

      // Calcular tendência
      const ratings = evolution.map((e) => e.averageRating);
      const trend = ratings.length >= 2 ? calculateTrend(ratings) : "stable";

      return {
        evolution,
        trend,
        totalFeedbacks: feedbacks.length,
        currentAverage: ratings.length > 0 ? ratings[ratings.length - 1] : 0,
      };
    }),
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function calculateTrend(values: number[]): "improving" | "stable" | "declining" {
  if (values.length < 2) return "stable";

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 0.3) return "improving";
  if (diff < -0.3) return "declining";
  return "stable";
}
