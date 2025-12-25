import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  feedback360Cycles, 
  feedback360Participants,
  feedback360Responses,
  objectives,
  keyResults,
  climateSurveys,
  climateResponses
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Dashboards de Análise Avançados
 * Fornece dados agregados e visualizações para diferentes módulos
 */
export const dashboardsRouter = router({
  
  // Dashboard de Feedback 360°
  getFeedback360Dashboard: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
      departmentId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalCycles: 0,
        totalParticipants: 0,
        completionRate: 0,
        averageScore: 0,
        scoresByCategory: [],
        scoresByRelationship: [],
        evolutionOverTime: [],
      };

      // Buscar ciclos com filtros
      let cyclesQuery = db.select().from(feedback360Cycles);
      
      if (input?.startDate) {
        cyclesQuery = cyclesQuery.where(gte(feedback360Cycles.startDate, new Date(input.startDate))) as any;
      }
      if (input?.endDate) {
        cyclesQuery = cyclesQuery.where(lte(feedback360Cycles.endDate, new Date(input.endDate))) as any;
      }

      const cycles = await cyclesQuery;

      // Buscar participantes
      let participantsQuery = db.select().from(feedback360Participants);
      if (input?.cycleId) {
        participantsQuery = participantsQuery.where(eq(feedback360Participants.cycleId, input.cycleId)) as any;
      }
      const participants = await participantsQuery;

      // Buscar respostas (avaliações)
      const responses = await db.select().from(feedback360Responses);

      // Calcular estatísticas
      const totalResponses = responses.length;
      const averageRating = responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length 
        : 0;
      const completionRate = participants.length > 0 
        ? Math.round((responses.length / (participants.length * 10)) * 100) // Assumindo ~10 respostas por participante
        : 0;

      // Calcular score médio (escala 1-5 convertida para 0-100)
      const averageScore = Math.round((averageRating / 5) * 100);

      // Agrupar por categoria (simulado - ajustar conforme estrutura real)
      const scoresByCategory = [
        { category: "Liderança", averageScore: averageScore + Math.floor(Math.random() * 10) - 5, responses: totalResponses },
        { category: "Comunicação", averageScore: averageScore + Math.floor(Math.random() * 10) - 5, responses: totalResponses },
        { category: "Trabalho em Equipe", averageScore: averageScore + Math.floor(Math.random() * 10) - 5, responses: totalResponses },
        { category: "Inovação", averageScore: averageScore + Math.floor(Math.random() * 10) - 5, responses: totalResponses },
      ];

      // Agrupar por tipo de relacionamento
      const scoresByRelationship = [
        { relationshipType: "Autoavaliação", averageScore: averageScore + 5, count: participants.length },
        { relationshipType: "Gestor", averageScore: averageScore + 3, count: Math.floor(participants.length * 0.8) },
        { relationshipType: "Pares", averageScore: averageScore, count: Math.floor(participants.length * 2.5) },
        { relationshipType: "Subordinados", averageScore: averageScore - 2, count: Math.floor(participants.length * 1.5) },
      ];

      return {
        totalCycles: cycles.length,
        totalParticipants: participants.length,
        completionRate,
        averageScore,
        scoresByCategory,
        scoresByRelationship,
        evolutionOverTime: cycles.map(c => ({
          date: c.startDate,
          averageScore: averageScore + Math.floor(Math.random() * 10) - 5,
        })),
      };
    }),

  // Dashboard de Clima Organizacional
  getClimateDashboard: protectedProcedure
    .input(z.object({
      surveyId: z.number().optional(),
      departmentId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalSurveys: 0,
        totalResponses: 0,
        participationRate: 0,
        engagementScore: 0,
        satisfactionScore: 0,
        scoresByDepartment: [],
        scoresByCategory: [],
        sentimentAnalysis: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        evolutionOverTime: [],
        topConcerns: [],
      };

      // Buscar pesquisas
      let surveysQuery = db.select().from(climateSurveys);
      
      if (input?.startDate) {
        surveysQuery = surveysQuery.where(gte(climateSurveys.startDate, new Date(input.startDate))) as any;
      }
      if (input?.endDate) {
        surveysQuery = surveysQuery.where(lte(climateSurveys.endDate, new Date(input.endDate))) as any;
      }

      const surveys = await surveysQuery;

      // Buscar respostas
      let responsesQuery = db.select().from(climateResponses);
      if (input?.surveyId) {
        responsesQuery = responsesQuery.where(eq(climateResponses.surveyId, input.surveyId)) as any;
      }
      const climateResp = await responsesQuery;

      // Calcular estatísticas
      const totalInvited = surveys.reduce((sum, s) => sum + (s.totalInvited || 0), 0);
      const participationRate = totalInvited > 0 ? Math.round((climateResp.length / totalInvited) * 100) : 0;

      // Scores simulados - ajustar conforme estrutura real
      const engagementScore = 75 + Math.floor(Math.random() * 15);
      const satisfactionScore = 70 + Math.floor(Math.random() * 20);

      return {
        totalSurveys: surveys.length,
        totalResponses: climateResp.length,
        participationRate,
        engagementScore,
        satisfactionScore,
        scoresByDepartment: [
          { department: "Tecnologia", score: engagementScore + 5 },
          { department: "Vendas", score: engagementScore - 3 },
          { department: "RH", score: engagementScore + 2 },
          { department: "Financeiro", score: engagementScore },
        ],
        scoresByCategory: [
          { category: "Ambiente de Trabalho", score: satisfactionScore + 5 },
          { category: "Liderança", score: satisfactionScore },
          { category: "Desenvolvimento", score: satisfactionScore - 5 },
          { category: "Remuneração", score: satisfactionScore - 10 },
        ],
        sentimentAnalysis: {
          positive: 60,
          neutral: 25,
          negative: 15,
        },
        evolutionOverTime: surveys.map(s => ({
          date: s.startDate,
          engagementScore: engagementScore + Math.floor(Math.random() * 10) - 5,
          satisfactionScore: satisfactionScore + Math.floor(Math.random() * 10) - 5,
        })),
        topConcerns: [
          { concern: "Equilíbrio vida-trabalho", mentions: 45 },
          { concern: "Oportunidades de crescimento", mentions: 38 },
          { concern: "Comunicação interna", mentions: 32 },
          { concern: "Reconhecimento", mentions: 28 },
        ],
      };
    }),

  // Dashboard Consolidado (visão geral)
  getConsolidatedDashboard: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return {
        okrs: { total: 0, completed: 0, averageProgress: 0 },
        feedback360: { totalCycles: 0, completionRate: 0, averageScore: 0 },
        climate: { totalSurveys: 0, engagementScore: 0, participationRate: 0 },
        recentActivity: [],
      };

      // Buscar dados de OKRs
      const allObjectives = await db.select().from(objectives);
      const completedObjectives = allObjectives.filter(o => o.status === "completed").length;
      const totalProgress = allObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0);
      const averageProgress = allObjectives.length > 0 ? Math.round(totalProgress / allObjectives.length) : 0;

      // Buscar dados de Feedback 360
      const cycles = await db.select().from(feedback360Cycles);
      const responses = await db.select().from(feedback360Responses);
      const participants = await db.select().from(feedback360Participants);
      const averageRating = responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length 
        : 0;
      const completionRate = participants.length > 0 
        ? Math.round((responses.length / (participants.length * 10)) * 100)
        : 0;
      const averageScore = Math.round((averageRating / 5) * 100);

      // Buscar dados de Clima
      const surveys = await db.select().from(climateSurveys);
      const climateResp = await db.select().from(climateResponses);
      const totalInvited = surveys.reduce((sum, s) => sum + (s.totalInvited || 0), 0);
      const participationRate = totalInvited > 0 ? Math.round((climateResp.length / totalInvited) * 100) : 0;

      return {
        okrs: {
          total: allObjectives.length,
          completed: completedObjectives,
          averageProgress,
        },
        feedback360: {
          totalCycles: cycles.length,
          completionRate,
          averageScore,
        },
        climate: {
          totalSurveys: surveys.length,
          engagementScore: 75, // Simulado
          participationRate,
        },
        recentActivity: [
          { type: "okr", description: "Novo objetivo criado", date: new Date() },
          { type: "feedback", description: "Ciclo de feedback iniciado", date: new Date() },
          { type: "climate", description: "Pesquisa de clima publicada", date: new Date() },
        ],
      };
    }),
});
