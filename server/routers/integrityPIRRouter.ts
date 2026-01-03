import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pirInvitations, pirAssessments, integrityTestResults, employees } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { queueEmail } from "../_core/emailQueue";
import { emailConviteIntegridade } from "../_core/emailTemplates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ENV } from "../_core/env";

/**
 * Router para PIR de Integridade
 * Gerencia convites, aplicação e resultados do PIR focado em integridade
 */
export const integrityPIRRouter = router({
  /**
   * Criar convite para PIR de Integridade
   */
  createInvitation: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        candidateEmail: z.string().email().optional(),
        candidateName: z.string().optional(),
        candidatePhone: z.string().optional(),
        purpose: z.string().optional(),
        notes: z.string().optional(),
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gerar token único
      const token = `pir_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const [result] = await db.insert(pirInvitations).values({
        employeeId: input.employeeId || null,
        candidateEmail: input.candidateEmail || null,
        candidateName: input.candidateName || null,
        candidatePhone: input.candidatePhone || null,
        token,
        status: "pending",
        expiresAt,
        purpose: input.purpose || null,
        notes: input.notes || null,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || null,
      });

      const invitationUrl = `/integridade/pir/responder/${token}`;
      const fullUrl = `${ENV.frontendUrl || 'https://avduisa-sys-vd5bj8to.manus.space'}${invitationUrl}`;

      // Determinar destinatário e nome
      let recipientEmail = input.candidateEmail;
      let recipientName = input.candidateName || "Candidato";

      if (input.employeeId) {
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);
        
        if (employee) {
          recipientEmail = employee.email;
          recipientName = employee.name;
        }
      }

      // Enviar email se houver destinatário
      if (recipientEmail) {
        try {
          const emailTemplate = emailConviteIntegridade({
            recipientName,
            inviterName: ctx.user.name || "Sistema AVD UISA",
            purpose: input.purpose,
            testUrl: fullUrl,
            expiresAt: format(expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
          });

          await queueEmail({
            destinatario: recipientEmail,
            assunto: emailTemplate.subject,
            corpo: emailTemplate.html,
            tipoEmail: "convite_integridade",
            prioridade: "alta",
            metadados: {
              invitationId: result.insertId,
              token,
              employeeId: input.employeeId,
            },
          });

          // Atualizar status para "sent"
          await db
            .update(pirInvitations)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(pirInvitations.id, result.insertId));
        } catch (emailError) {
          console.error("[IntegrityPIR] Erro ao enviar email:", emailError);
          // Não falhar a criação do convite se o email falhar
        }
      }

      return {
        id: result.insertId,
        token,
        expiresAt,
        invitationUrl,
      };
    }),

  /**
   * Listar convites enviados
   */
  listInvitations: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "sent", "in_progress", "completed", "expired"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(pirInvitations).orderBy(desc(pirInvitations.createdAt));

      if (input.status) {
        query = query.where(eq(pirInvitations.status, input.status)) as any;
      }

      const results = await query.limit(input.limit);
      return results;
    }),

  /**
   * Buscar convite por token (público - sem autenticação)
   */
  getInvitationByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        console.log('[getInvitationByToken] Token recebido:', input.token);
        const db = await getDb();
        if (!db) {
          console.log('[getInvitationByToken] Database não disponível');
          return null;
        }

        const [invitation] = await db
          .select()
          .from(pirInvitations)
          .where(eq(pirInvitations.token, input.token))
          .limit(1);

        if (!invitation) {
          console.log('[getInvitationByToken] Convite não encontrado');
          return null;
        }

        console.log('[getInvitationByToken] Convite encontrado:', invitation.id, 'status:', invitation.status);

        // Verificar se expirou
        if (new Date() > new Date(invitation.expiresAt)) {
          console.log('[getInvitationByToken] Convite expirado');
          await db
            .update(pirInvitations)
            .set({ status: "expired" })
            .where(eq(pirInvitations.id, invitation.id));
          
          return { ...invitation, status: "expired" as const };
        }

        return invitation;
      } catch (error) {
        console.error('[getInvitationByToken] Erro:', error);
        throw error;
      }
    }),

  /**
   * Submeter respostas do PIR via token
   */
  submitPIRPublic: publicProcedure
    .input(
      z.object({
        token: z.string(),
        answers: z.record(z.number()), // { questionId: answer }
        dimensionScores: z.record(z.number()), // { dimension: score }
        overallScore: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar convite
      const [invitation] = await db
        .select()
        .from(pirInvitations)
        .where(eq(pirInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      if (invitation.status === "completed") {
        throw new Error("Este convite já foi utilizado");
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        throw new Error("Este convite expirou");
      }

      // Criar resultado do teste
      const [testResult] = await db.insert(integrityTestResults).values({
        employeeId: invitation.employeeId || ctx.user.id,
        testId: 1, // ID do teste padrão de integridade
        pirAssessmentId: null,
        answers: JSON.stringify(input.answers),
        score: input.overallScore,
        dimensionScores: JSON.stringify(input.dimensionScores),
        behavioralAnalysis: JSON.stringify({
          overallScore: input.overallScore,
          dimensions: input.dimensionScores,
          notes: input.notes,
        }),
        alerts: null,
        redFlags: null,
        classification: input.overallScore >= 80 ? "muito_alto" :
                        input.overallScore >= 60 ? "alto" :
                        input.overallScore >= 40 ? "medio" :
                        input.overallScore >= 20 ? "baixo" : "muito_baixo",
        recommendation: null,
        startedAt: invitation.startedAt || new Date(),
        completedAt: new Date(),
        totalTime: null,
      });

      // Salvar scores no convite para exibição na página de resultados
      const scoresData = JSON.stringify({
        dimensionScores: input.dimensionScores,
        overallScore: input.overallScore,
        answers: input.answers,
      });

      // Atualizar convite
      await db
        .update(pirInvitations)
        .set({
          status: "completed",
          completedAt: new Date(),
          pirAssessmentId: testResult.insertId,
          savedAnswers: scoresData, // Salvar scores para exibição
        })
        .where(eq(pirInvitations.id, invitation.id));

      // Enviar email de notificação ao RH sobre conclusão do teste
      try {
        const candidateName = invitation.candidateName || invitation.candidateEmail || "Candidato";
        const emailBody = `
          <h2>Teste PIR de Integridade Concluído</h2>
          <p><strong>Candidato:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${invitation.candidateEmail || "N/A"}</p>
          <p><strong>Pontuação Geral:</strong> ${input.overallScore.toFixed(1)}</p>
          <p><strong>Classificação:</strong> ${input.overallScore >= 80 ? "Muito Alto" : input.overallScore >= 60 ? "Alto" : input.overallScore >= 40 ? "Médio" : input.overallScore >= 20 ? "Baixo" : "Muito Baixo"}</p>
          <p><strong>Data de Conclusão:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <br>
          <p>Acesse o sistema para visualizar os resultados completos.</p>
        `;

        await queueEmail({
          destinatario: invitation.createdByEmail || ENV.ownerEmail || "rh@uisa.com.br",
          assunto: `Teste PIR de Integridade Concluído - ${candidateName}`,
          corpo: emailBody,
          tipoEmail: "notificacao_conclusao_pir",
          prioridade: "alta",
          metadados: {
            invitationId: invitation.id,
            resultId: testResult.insertId,
            overallScore: input.overallScore,
          },
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de notificação:", emailError);
        // Não falhar a submissão se o email falhar
      }

      return {
        success: true,
        resultId: testResult.insertId,
      };
    }),

  /**
   * Salvar resposta individual (auto-save)
   */
  saveAnswer: publicProcedure
    .input(
      z.object({
        token: z.string(),
        questionId: z.number(),
        answer: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar convite
      const [invitation] = await db
        .select()
        .from(pirInvitations)
        .where(eq(pirInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      if (invitation.status === "completed") {
        throw new Error("Este convite já foi utilizado");
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        throw new Error("Este convite expirou");
      }

      // Recuperar respostas salvas ou criar novo objeto
      let savedAnswers: Record<number, number> = {};
      if (invitation.savedAnswers) {
        try {
          savedAnswers = JSON.parse(invitation.savedAnswers as string);
        } catch (e) {
          console.error("Erro ao parsear savedAnswers:", e);
        }
      }

      // Atualizar resposta
      savedAnswers[input.questionId] = input.answer;

      // Salvar no banco
      await db
        .update(pirInvitations)
        .set({
          savedAnswers: JSON.stringify(savedAnswers),
          lastActivityAt: new Date(),
        })
        .where(eq(pirInvitations.id, invitation.id));

      return {
        success: true,
        totalAnswered: Object.keys(savedAnswers).length,
      };
    }),

  /**
   * Recuperar respostas salvas
   */
  getSavedAnswers: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { answers: {} };

      const [invitation] = await db
        .select()
        .from(pirInvitations)
        .where(eq(pirInvitations.token, input.token))
        .limit(1);

      if (!invitation || !invitation.savedAnswers) {
        return { answers: {} };
      }

      try {
        const answers = JSON.parse(invitation.savedAnswers as string);
        return { answers };
      } catch (e) {
        console.error("Erro ao parsear savedAnswers:", e);
        return { answers: {} };
      }
    }),

  /**
   * Marcar convite como iniciado
   */
  startInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invitation] = await db
        .select()
        .from(pirInvitations)
        .where(eq(pirInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      if (invitation.status === "pending" || invitation.status === "sent") {
        await db
          .update(pirInvitations)
          .set({
            status: "in_progress",
            startedAt: new Date(),
          })
          .where(eq(pirInvitations.id, invitation.id));
      }

      return { success: true };
    }),

  /**
   * Reenviar convite
   */
  resendInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pirInvitations)
        .set({
          status: "sent",
          sentAt: new Date(),
        })
        .where(eq(pirInvitations.id, input.invitationId));

      return { success: true };
    }),

  /**
   * Auto-login via token PIR (público)
   * Valida token e retorna dados para criar sessão temporária
   */
  autoLoginPIR: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar convite pelo token
      const [invitation] = await db
        .select()
        .from(pirInvitations)
        .where(eq(pirInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new Error("Token inválido");
      }

      // Verificar expiração
      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        throw new Error("Token expirado");
      }

      // Verificar se já foi completado
      if (invitation.status === "completed") {
        throw new Error("Este teste já foi completado");
      }

      // Buscar dados do funcionário se houver
      let employeeData = null;
      if (invitation.employeeId) {
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, invitation.employeeId))
          .limit(1);
        employeeData = employee;
      }

      // Marcar como iniciado se ainda está pending ou sent
      if (invitation.status === "pending" || invitation.status === "sent") {
        await db
          .update(pirInvitations)
          .set({
            status: "in_progress",
            startedAt: new Date(),
          })
          .where(eq(pirInvitations.id, invitation.id));
      }

      // Retornar dados para o frontend
      return {
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          candidateName: invitation.candidateName,
          candidateEmail: invitation.candidateEmail,
        },
        employee: employeeData ? {
          id: employeeData.id,
          name: employeeData.name,
          email: employeeData.email,
          position: employeeData.position,
        } : null,
      };
    }),
});
