import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  performanceEvaluations,
  evaluationResponses,
  employees,
  notifications,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { sendEmail } from "./emailService";

/**
 * Router de Avaliação 360° com Fluxo Sequencial
 * Etapas: Autoavaliação → Avaliação Gestor → Consenso Líder
 */

export const evaluation360Router = router({
  /**
   * Submeter autoavaliação (Etapa 1)
   */
  submitSelfAssessment: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            score: z.number().min(1).max(5),
            comment: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar avaliação
      const evaluation = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (evaluation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      const eval360 = evaluation[0];

      // Verificar se está na etapa correta
      if (eval360.workflowStatus !== "pending_self") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta avaliação não está aguardando autoavaliação",
        });
      }

      // Verificar se o usuário é o colaborador sendo avaliado
      if (eval360.employeeId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para fazer esta autoavaliação",
        });
      }

      // Salvar respostas
      for (const response of input.responses) {
        await db.insert(evaluationResponses).values({
          evaluationId: input.evaluationId,
          questionId: response.questionId,
          evaluatorId: ctx.user.id,
          evaluatorType: "self",
          score: response.score,
          textResponse: response.comment,
        });
      }

      // Atualizar status da avaliação
      await db
        .update(performanceEvaluations)
        .set({
          selfEvaluationCompleted: true,
          selfCompletedAt: new Date(),
          workflowStatus: "pending_manager",
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      // Buscar gestor para enviar email
      const employeeData = await db
        .select()
        .from(employees)
        .where(eq(employees.id, eval360.employeeId))
        .limit(1);

      if (employeeData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
      }

      const employee = employeeData[0];
      let managerData = null;
      if (employee.managerId) {
        const managers = await db
          .select()
          .from(employees)
          .where(eq(employees.id, employee.managerId))
          .limit(1);
        if (managers.length > 0) {
          managerData = managers[0];
        }
      }

      if (managerData && managerData.email) {
        // Enviar email para o gestor
        await sendEmail({
          to: managerData.email,
          subject: `Avaliação 360° - Aguardando sua avaliação de ${employee.name}`,
          html: `
            <h2>Avaliação 360° - Próxima Etapa</h2>
            <p>Olá ${managerData.name},</p>
            <p>A autoavaliação de <strong>${employee.name}</strong> foi concluída.</p>
            <p>Agora é sua vez de avaliar o colaborador.</p>
            <p><a href="${process.env.VITE_OAUTH_PORTAL_URL}/avaliacoes/gestor/${input.evaluationId}">Clique aqui para fazer a avaliação</a></p>
          `,
        });
      }

      return { success: true, nextStep: "pending_manager" };
    }),

  /**
   * Submeter avaliação do gestor (Etapa 2)
   */
  submitManagerAssessment: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            score: z.number().min(1).max(5),
            comment: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar avaliação
      const evaluation = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (evaluation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      const eval360 = evaluation[0];

      // Verificar se está na etapa correta
      if (eval360.workflowStatus !== "pending_manager") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta avaliação não está aguardando avaliação do gestor",
        });
      }

      // Buscar colaborador para verificar se o usuário é o gestor
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, eval360.employeeId))
        .limit(1);

      if (employee.length === 0 || employee[0].managerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o gestor deste colaborador",
        });
      }

      // Salvar respostas
      for (const response of input.responses) {
        await db.insert(evaluationResponses).values({
          evaluationId: input.evaluationId,
          questionId: response.questionId,
          evaluatorId: ctx.user.id,
          evaluatorType: "manager",
          score: response.score,
          textResponse: response.comment,
        });
      }

      // Atualizar status da avaliação
      await db
        .update(performanceEvaluations)
        .set({
          managerEvaluationCompleted: true,
          managerCompletedAt: new Date(),
          workflowStatus: "pending_consensus",
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      // Buscar líder (gestor do gestor) para enviar email
      const managerData = await db
        .select()
        .from(employees)
        .where(eq(employees.id, ctx.user.id))
        .limit(1);

      if (managerData.length > 0 && managerData[0].managerId) {
        const leaders = await db
          .select()
          .from(employees)
          .where(eq(employees.id, managerData[0].managerId))
          .limit(1);

        if (leaders.length > 0 && leaders[0].email) {
          // Calcular prazo (7 dias a partir de agora)
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);
          const deadlineStr = deadline.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          // Enviar email para o líder com template profissional
          await sendEmail({
            to: leaders[0].email,
            subject: `⚠️ Consenso Pendente - Avaliação 360° de ${employee[0].name}`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Sistema AVD UISA</h1>
      <p style="margin: 0; font-size: 18px;">Avaliação 360°</p>
    </div>
    <div class="content">
      <h2>⚠️ Consenso Pendente</h2>
      <p>Olá <strong>${leaders[0].name}</strong>,</p>
      <div class="alert">
        <p style="margin: 0;"><strong>⏰ Ação Necessária:</strong> Uma avaliação 360° está aguardando seu consenso final.</p>
      </div>
      <div class="info-box">
        <p><strong>👤 Colaborador:</strong> ${employee[0].name}</p>
        <p><strong>📅 Prazo:</strong> ${deadlineStr}</p>
        <p><strong>📝 Status:</strong> Autoavaliação e Avaliação do Gestor concluídas</p>
      </div>
      <p>A etapa de consenso é fundamental para finalizar o processo de avaliação. Você precisará usar sua senha de aprovação para confirmar a nota final.</p>
      <p style="text-align: center;">
        <a href="${process.env.VITE_OAUTH_PORTAL_URL}/avaliacoes/consenso/${input.evaluationId}" class="button">
          🔒 Acessar Consenso Agora
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Importante:</strong> Se você não possui senha de aprovação cadastrada, entre em contato com o RH.
      </p>
      <p style="font-size: 12px; color: #9ca3af;">
        Este é um e-mail automático. Por favor, não responda.
      </p>
    </div>
  </div>
</body>
</html>
            `,
          });

          // Criar notificação in-app também
          if (leaders[0].userId) {
            try {
              await db.insert(notifications).values({
                userId: leaders[0].userId,
                type: "consensus_pending",
                title: "Consenso Pendente - Avaliação 360°",
                message: `A avaliação 360° de ${employee[0].name} está aguardando seu consenso final. Prazo: ${deadlineStr}`,
                link: `/avaliacoes/consenso/${input.evaluationId}`,
                read: false,
              });
            } catch (notifError) {
              console.error("[submitManagerEvaluation] Erro ao criar notificação:", notifError);
            }
          }
        }
      }

      return { success: true, nextStep: "pending_consensus" };
    }),

  /**
   * Submeter consenso do líder (Etapa 3)
   */
  submitConsensus: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        finalScore: z.number().min(0).max(100),
        consensusNotes: z.string().optional(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar avaliação
      const evaluation = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (evaluation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      const eval360 = evaluation[0];

      // Verificar se está na etapa correta
      if (eval360.workflowStatus !== "pending_consensus") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta avaliação não está aguardando consenso",
        });
      }

      // Verificar se o usuário é líder (pode fazer consenso)
      // TODO: Implementar lógica de verificação de permissão de líder

      // Buscar employee do líder logado
      const [leader] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!leader) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
      }

      // Atualizar avaliação com nota final
      await db
        .update(performanceEvaluations)
        .set({
          finalScore: input.finalScore,
          consensusCompletedAt: new Date(),
          workflowStatus: "completed",
          status: "concluida",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      // Buscar colaborador para enviar email de conclusão
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, eval360.employeeId))
        .limit(1);

      if (employee.length > 0 && employee[0].email) {
        // Enviar email para o colaborador
        await sendEmail({
          to: employee[0].email,
          subject: "Avaliação 360° Concluída",
          html: `
            <h2>Avaliação 360° Concluída</h2>
            <p>Olá ${employee[0].name},</p>
            <p>Sua avaliação 360° foi concluída com sucesso.</p>
            <p>Nota final: <strong>${input.finalScore}</strong></p>
            <p><a href="${process.env.VITE_OAUTH_PORTAL_URL}/avaliacoes">Ver detalhes da avaliação</a></p>
          `,
        });
      }

      return { success: true, nextStep: "completed" };
    }),

  /**
   * Rejeitar consenso do líder (Etapa 3)
   */
  rejectConsensus: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        reason: z.string().min(1, "Motivo obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar avaliação
      const evaluation = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (evaluation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      const eval360 = evaluation[0];

      // Verificar se está na etapa correta
      if (eval360.workflowStatus !== "pending_consensus") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta avaliação não está aguardando consenso",
        });
      }

      // Atualizar avaliação para voltar ao status anterior
      await db
        .update(performanceEvaluations)
        .set({
          workflowStatus: "pending_manager",
          status: "em_andamento",
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      // Buscar colaborador para enviar email de rejeição
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, eval360.employeeId))
        .limit(1);

      if (employee.length > 0 && employee[0].email) {
        // Enviar email para o colaborador
        await sendEmail({
          to: employee[0].email,
          subject: "Avaliação 360° Rejeitada",
          html: `
            <h2>Avaliação 360° Rejeitada</h2>
            <p>Olá ${employee[0].name},</p>
            <p>Sua avaliação 360° foi rejeitada pelo líder.</p>
            <p><strong>Motivo:</strong> ${input.reason}</p>
            <p>A avaliação retornou para a etapa anterior. Por favor, revise e reenvie.</p>
            <p><a href="${process.env.VITE_OAUTH_PORTAL_URL}/avaliacoes">Ver detalhes da avaliação</a></p>
          `,
        });
      }

      return { success: true, nextStep: "pending_manager" };
    }),

  /**
   * Buscar avaliação com status do workflow
   */
  getEvaluationWithWorkflow: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const evaluation = await db
        .select({
          id: performanceEvaluations.id,
          cycleId: performanceEvaluations.cycleId,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          type: performanceEvaluations.type,
          status: performanceEvaluations.status,
          workflowStatus: performanceEvaluations.workflowStatus,
          selfEvaluationCompleted: performanceEvaluations.selfEvaluationCompleted,
          managerEvaluationCompleted: performanceEvaluations.managerEvaluationCompleted,
          selfCompletedAt: performanceEvaluations.selfCompletedAt,
          managerCompletedAt: performanceEvaluations.managerCompletedAt,
          consensusCompletedAt: performanceEvaluations.consensusCompletedAt,
          finalScore: performanceEvaluations.finalScore,
          createdAt: performanceEvaluations.createdAt,
          completedAt: performanceEvaluations.completedAt,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      return evaluation.length > 0 ? evaluation[0] : null;
    }),

  /**
   * Listar todas as avaliações 360°
   */
  list: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        status: z.enum(["pendente", "em_andamento", "concluida"]).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: performanceEvaluations.id,
          cycleId: performanceEvaluations.cycleId,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          type: performanceEvaluations.type,
          status: performanceEvaluations.status,
          workflowStatus: performanceEvaluations.workflowStatus,
          selfEvaluationCompleted: performanceEvaluations.selfEvaluationCompleted,
          managerEvaluationCompleted: performanceEvaluations.managerEvaluationCompleted,
          selfCompletedAt: performanceEvaluations.selfCompletedAt,
          managerCompletedAt: performanceEvaluations.managerCompletedAt,
          consensusCompletedAt: performanceEvaluations.consensusCompletedAt,
          finalScore: performanceEvaluations.finalScore,
          createdAt: performanceEvaluations.createdAt,
          completedAt: performanceEvaluations.completedAt,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id));

      // Aplicar filtros se fornecidos
      if (input?.cycleId) {
        query = query.where(eq(performanceEvaluations.cycleId, input.cycleId)) as any;
      }
      if (input?.status) {
        query = query.where(eq(performanceEvaluations.status, input.status)) as any;
      }

      const evaluations = await query;
      return evaluations;
    }),

  /**
   * Buscar perguntas da avaliação
   */
  getQuestions: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      // Retornar perguntas padrão (podem ser movidas para o banco depois)
      return [
        { id: 1, text: "Comunicação e clareza", category: "Comunicação" },
        { id: 2, text: "Trabalho em equipe", category: "Colaboração" },
        { id: 3, text: "Iniciativa e proatividade", category: "Atitude" },
        { id: 4, text: "Qualidade técnica", category: "Competência Técnica" },
        { id: 5, text: "Cumprimento de prazos", category: "Entrega" },
        { id: 6, text: "Capacidade de resolução de problemas", category: "Resolução de Problemas" },
        { id: 7, text: "Liderança e influência", category: "Liderança" },
        { id: 8, text: "Adaptação a mudanças", category: "Flexibilidade" },
      ];
    }),

  /**
   * Submeter feedback adicional
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        feedback: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Atualizar avaliação com feedback
      await db
        .update(performanceEvaluations)
        .set({
          managerComments: input.feedback,
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      return { success: true };
    }),

  /**
   * Buscar detalhes completos da avaliação
   */
  getDetails: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const evaluation = await db
        .select({
          id: performanceEvaluations.id,
          cycleId: performanceEvaluations.cycleId,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          type: performanceEvaluations.type,
          status: performanceEvaluations.status,
          workflowStatus: performanceEvaluations.workflowStatus,
          selfEvaluationCompleted: performanceEvaluations.selfEvaluationCompleted,
          managerEvaluationCompleted: performanceEvaluations.managerEvaluationCompleted,
          selfCompletedAt: performanceEvaluations.selfCompletedAt,
          managerCompletedAt: performanceEvaluations.managerCompletedAt,
          consensusCompletedAt: performanceEvaluations.consensusCompletedAt,
          finalScore: performanceEvaluations.finalScore,
          managerComments: performanceEvaluations.managerComments,
          createdAt: performanceEvaluations.createdAt,
          completedAt: performanceEvaluations.completedAt,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (evaluation.length === 0) return null;

      // Buscar respostas
      const responses = await db
        .select()
        .from(evaluationResponses)
        .where(eq(evaluationResponses.evaluationId, input.evaluationId));

      // Agrupar respostas por tipo de avaliador
      const groupedResponses = {
        self: responses.filter(r => r.evaluatorType === 'self'),
        manager: responses.filter(r => r.evaluatorType === 'manager'),
        peers: responses.filter(r => r.evaluatorType === 'peer'),
        subordinates: responses.filter(r => r.evaluatorType === 'subordinate'),
      };

      // Calcular médias por tipo de avaliador
      const calculateAverage = (resps: typeof responses) => {
        const scores = resps.filter(r => r.score !== null).map(r => r.score!);
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      };

      const averages = {
        self: calculateAverage(groupedResponses.self),
        manager: calculateAverage(groupedResponses.manager),
        peers: calculateAverage(groupedResponses.peers),
        subordinates: calculateAverage(groupedResponses.subordinates),
      };

      return {
        ...evaluation[0],
        responses: groupedResponses,
        averages,
      };
    }),
});
