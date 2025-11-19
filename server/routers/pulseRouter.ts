import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Schema de validação
const createSurveySchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  question: z.string().min(10, "Pergunta deve ter no mínimo 10 caracteres"),
  description: z.string().optional(),
});

const submitResponseSchema = z.object({
  surveyId: z.number(),
  rating: z.number().min(0).max(10),
  comment: z.string().optional(),
  employeeId: z.number().optional(),
});

export const pulseRouter = router({
  // Listar todas as pesquisas
  list: protectedProcedure.query(async () => {
    // Mock data - em produção viria do banco
    return [
      {
        id: 1,
        title: "Satisfação com Ambiente de Trabalho",
        question: "Como você avalia o ambiente de trabalho da empresa?",
        status: "active" as const,
        responses: 45,
        totalEmployees: 50,
        avgScore: 8.5,
        createdAt: "2025-11-15",
      },
      {
        id: 2,
        title: "Comunicação Interna",
        question: "A comunicação entre as áreas é eficiente?",
        status: "active" as const,
        responses: 38,
        totalEmployees: 50,
        avgScore: 7.2,
        createdAt: "2025-11-10",
      },
      {
        id: 3,
        title: "Reconhecimento e Valorização",
        question: "Você se sente reconhecido pelo seu trabalho?",
        status: "closed" as const,
        responses: 50,
        totalEmployees: 50,
        avgScore: 6.8,
        createdAt: "2025-11-01",
      },
    ];
  }),

  // Buscar pesquisa por ID (pública - para responder)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Mock data - em produção viria do banco
      const surveys = [
        {
          id: 1,
          title: "Satisfação com Ambiente de Trabalho",
          question: "Como você avalia o ambiente de trabalho da empresa?",
          description: "Sua opinião é muito importante para melhorarmos continuamente nosso ambiente de trabalho.",
          status: "active" as const,
        },
        {
          id: 2,
          title: "Comunicação Interna",
          question: "A comunicação entre as áreas é eficiente?",
          description: "Queremos entender como podemos melhorar a comunicação interna.",
          status: "active" as const,
        },
      ];

      const survey = surveys.find((s) => s.id === input.id);
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
      // Verificar se usuário tem permissão (RH ou Admin)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem criar pesquisas",
        });
      }

      // Em produção, salvar no banco de dados
      console.log("[Pulse] Criando pesquisa:", input);

      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        status: "active" as const,
        responses: 0,
        totalEmployees: 50,
        avgScore: 0,
        createdAt: new Date().toISOString(),
      };
    }),

  // Enviar resposta (pública - sem autenticação)
  submitResponse: publicProcedure
    .input(submitResponseSchema)
    .mutation(async ({ input }) => {
      // Em produção, salvar no banco de dados
      console.log("[Pulse] Resposta recebida:", input);

      return {
        success: true,
        message: "Resposta enviada com sucesso!",
      };
    }),

  // Obter resultados de uma pesquisa
  getResults: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      // Mock data - em produção viria do banco
      return {
        surveyId: input.surveyId,
        totalResponses: 45,
        avgScore: 8.5,
        distribution: {
          0: 0,
          1: 0,
          2: 0,
          3: 1,
          4: 2,
          5: 3,
          6: 5,
          7: 8,
          8: 12,
          9: 10,
          10: 4,
        },
        comments: [
          {
            id: 1,
            rating: 9,
            comment: "Ambiente muito colaborativo e acolhedor!",
            createdAt: "2025-11-18",
          },
          {
            id: 2,
            rating: 7,
            comment: "Bom, mas poderia melhorar a comunicação entre equipes.",
            createdAt: "2025-11-17",
          },
          {
            id: 3,
            rating: 8,
            comment: "Gosto do ambiente, mas falta mais reconhecimento.",
            createdAt: "2025-11-16",
          },
        ],
      };
    }),

  // Fechar pesquisa
  close: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem fechar pesquisas",
        });
      }

      // Em produção, atualizar status no banco
      console.log("[Pulse] Fechando pesquisa:", input.surveyId);

      return {
        success: true,
        message: "Pesquisa encerrada com sucesso!",
      };
    }),
});
