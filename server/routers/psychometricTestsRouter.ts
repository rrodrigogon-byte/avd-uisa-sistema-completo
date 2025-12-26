import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  createTestInvitation,
  getTestInvitationByToken,
  getTestInvitationById,
  getTestInvitationsByEmployee,
  updateTestInvitationStatus,
  markInvitationEmailSent,
  getAllPendingInvitations,
  saveTestResponse,
  getTestResponsesByInvitation,
  countTestResponses,
  saveTestResult,
  getTestResultByInvitation,
  getTestResultById,
  getTestResultsByEmployee,
  getLatestTestResultByType,
  getAllTestResults,
  getTestQuestionsByType,
  countTestQuestions,
  getTestCompletionStats,
  getTestResultsByType,
} from "../psychometricTestsHelpers";
import { sendEmail } from "../_core/email";
import { ENV } from "../_core/env";
import crypto from "crypto";

const testTypeEnum = z.enum([
  "disc",
  "bigfive",
  "mbti",
  "ie",
  "vark",
  "leadership",
  "careeranchors",
  "pir",
]);

export const psychometricTestsRouter = router({
  /**
   * Criar e enviar convite individual para teste
   */
  sendIndividualInvitation: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        testType: testTypeEnum,
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Gerar token único
      const uniqueToken = crypto.randomBytes(32).toString("hex");

      // Calcular data de expiração
      const sentAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      // Criar convite
      const invitationId = await createTestInvitation({
        employeeId: input.employeeId,
        testType: input.testType,
        uniqueToken,
        status: "pendente",
        sentAt,
        expiresAt,
        emailSent: false,
        createdBy: ctx.user.id,
      });

      // Buscar dados do funcionário
      const { getEmployeeById } = await import("../db");
      const employee = await getEmployeeById(input.employeeId);

      if (!employee || !employee.employee.email) {
        throw new Error("Funcionário não encontrado ou sem e-mail cadastrado");
      }

      // Gerar link de acesso
      const testLink = `http://localhost:3000/teste/${uniqueToken}`;

      // Mapear nomes dos testes
      const testNames: Record<string, string> = {
        disc: "DISC",
        bigfive: "Big Five",
        mbti: "MBTI",
        ie: "Inteligência Emocional",
        vark: "VARK",
        leadership: "Liderança",
        careeranchors: "Âncoras de Carreira",
        pir: "PIR - Perfil de Interesses e Reações",
      };

      // Enviar e-mail
      try {
        await sendEmail({
          to: employee.employee.email!,
          subject: `Convite para Teste Psicométrico - ${testNames[input.testType]}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Convite para Teste Psicométrico</h2>
              <p>Olá <strong>${employee.employee.name}</strong>,</p>
              <p>Você foi convidado(a) a realizar o teste psicométrico <strong>${testNames[input.testType]}</strong>.</p>
              <p>Este teste é uma ferramenta importante para o seu desenvolvimento profissional e ajudará a identificar seus pontos fortes, estilo de trabalho e áreas de crescimento.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Informações do Teste:</h3>
                <ul>
                  <li><strong>Tipo:</strong> ${testNames[input.testType]}</li>
                  <li><strong>Validade:</strong> ${input.expiresInDays} dias</li>
                  <li><strong>Expira em:</strong> ${expiresAt.toLocaleDateString("pt-BR")}</li>
                </ul>
              </div>

              <p>Para realizar o teste, clique no botão abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${testLink}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Iniciar Teste
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Ou copie e cole este link no seu navegador:<br>
                <a href="${testLink}" style="color: #2563eb;">${testLink}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 12px;">
                Este é um e-mail automático do Sistema AVD UISA. Por favor, não responda este e-mail.
              </p>
            </div>
          `,
        });

        // Marcar e-mail como enviado
        await markInvitationEmailSent(invitationId);

        return {
          success: true,
          invitationId,
          testLink,
          message: "Convite enviado com sucesso!",
        };
      } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        return {
          success: false,
          invitationId,
          testLink,
          message: "Convite criado, mas houve erro ao enviar o e-mail.",
        };
      }
    }),

  /**
   * Enviar convites em massa
   */
  sendBulkInvitations: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        testType: testTypeEnum,
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const results = [];

      for (const employeeId of input.employeeIds) {
        try {
          const result: any = await psychometricTestsRouter.createCaller(ctx).sendIndividualInvitation({
            employeeId,
            testType: input.testType,
            expiresInDays: input.expiresInDays,
          });
          results.push({ employeeId, ...result });
        } catch (error) {
          results.push({
            employeeId,
            success: false,
            message: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        total: results.length,
        successCount,
        failureCount,
        results,
      };
    }),

  /**
   * Buscar convite por token (público - para responder teste)
   */
  getInvitationByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invitation = await getTestInvitationByToken(input.token);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      // Verificar se expirou
      if (new Date() > new Date(invitation.expiresAt)) {
        await updateTestInvitationStatus(invitation.id, "expirado");
        throw new Error("Este convite expirou");
      }

      // Buscar dados do funcionário
      const { getEmployeeById } = await import("../db");
      const employee = await getEmployeeById(invitation.employeeId);

      // Buscar questões do teste
      const questions = await getTestQuestionsByType(invitation.testType);

      return {
        invitation,
        employee,
        questions,
      };
    }),

  /**
   * Iniciar teste (marcar como em andamento)
   */
  startTest: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const invitation = await getTestInvitationByToken(input.token);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      if (invitation.status === "concluido") {
        throw new Error("Este teste já foi concluído");
      }

      await updateTestInvitationStatus(invitation.id, "em_andamento", {
        startedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Salvar resposta individual
   */
  saveResponse: publicProcedure
    .input(
      z.object({
        token: z.string(),
        questionId: z.number(),
        answer: z.number(),
        responseTime: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const invitation = await getTestInvitationByToken(input.token);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      await saveTestResponse({
        invitationId: invitation.id,
        questionId: input.questionId,
        answer: input.answer,
        responseTime: input.responseTime,
      });

      return { success: true };
    }),

  /**
   * Submeter teste completo e gerar resultados
   */
  submitTest: publicProcedure
    .input(
      z.object({
        token: z.string(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            answer: z.number(),
            responseTime: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const invitation = await getTestInvitationByToken(input.token);

      if (!invitation) {
        throw new Error("Convite não encontrado");
      }

      if (invitation.status === "concluido") {
        throw new Error("Este teste já foi concluído");
      }

      // Salvar todas as respostas
      for (const response of input.responses) {
        await saveTestResponse({
          invitationId: invitation.id,
          questionId: response.questionId,
          answer: response.answer,
          responseTime: response.responseTime,
        });
      }

      // Buscar questões para calcular resultados
      const questions = await getTestQuestionsByType(invitation.testType);
      const responses = await getTestResponsesByInvitation(invitation.id);

      // Calcular pontuações e gerar descritivos
      const result = await generateTestResults(
        invitation.testType,
        questions,
        responses
      );

      // Salvar resultado
      const resultId = await saveTestResult({
        invitationId: invitation.id,
        employeeId: invitation.employeeId,
        testType: invitation.testType,
        scores: JSON.stringify(result.scores),
        profileType: result.profileType,
        profileDescription: result.profileDescription,
        strengths: result.strengths,
        developmentAreas: result.developmentAreas,
        workStyle: result.workStyle,
        communicationStyle: result.communicationStyle,
        leadershipStyle: result.leadershipStyle,
        motivators: result.motivators,
        stressors: result.stressors,
        teamContribution: result.teamContribution,
        careerRecommendations: result.careerRecommendations,
        rawData: JSON.stringify({ questions, responses }),
        completedAt: new Date(),
      });

      // Marcar convite como concluído
      await updateTestInvitationStatus(invitation.id, "concluido", {
        completedAt: new Date(),
      });

      // Enviar notificações por e-mail
      try {
        const { getEmployeeById } = await import("../db");
        const { getDb } = await import("../db");
        const db = await getDb();
        
        const employee = await getEmployeeById(invitation.employeeId);
        
        if (employee && db) {
          const testNames: Record<string, string> = {
            disc: "DISC",
            bigfive: "Big Five",
            mbti: "MBTI",
            ie: "Inteligência Emocional",
            vark: "VARK",
            leadership: "Liderança",
            careeranchors: "Âncoras de Carreira",
          };

          const testName = testNames[invitation.testType] || invitation.testType;

          // 1. Notificar gestor do funcionário
          if (employee.employee.managerId) {
            const manager = await getEmployeeById(employee.employee.managerId);
            if (manager?.employee.email) {
              await sendEmail({
                to: manager.employee.email,
                subject: `Teste Psicométrico Concluído - ${employee.employee.name}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Teste Psicométrico Concluído</h2>
                    <p>Olá <strong>${manager.employee.name}</strong>,</p>
                    <p>O funcionário <strong>${employee.employee.name}</strong> completou o teste psicométrico <strong>${testName}</strong>.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Funcionário:</strong> ${employee.employee.name}</p>
                      <p style="margin: 5px 0;"><strong>Teste:</strong> ${testName}</p>
                      <p style="margin: 5px 0;"><strong>Data de Conclusão:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p>Você pode visualizar os resultados detalhados no sistema AVD UISA.</p>
                    <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                      Esta é uma notificação automática do Sistema AVD UISA.
                    </p>
                  </div>
                `,
              }).catch((err) => console.error("Erro ao enviar email para gestor:", err));
            }
          }

          // 2. Notificar equipe de RH (administradores)
          const { users } = await import("../../drizzle/schema");
          const { eq, or } = await import("drizzle-orm");
          
          const hrUsers = await db
            .select()
            .from(users)
            .where(or(eq(users.role, "admin"), eq(users.role, "rh")));

          for (const hrUser of hrUsers) {
            if (hrUser.email) {
              await sendEmail({
                to: hrUser.email,
                subject: `Teste Psicométrico Concluído - ${employee.employee.name}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Teste Psicométrico Concluído</h2>
                    <p>Olá <strong>${hrUser.name || "Equipe RH"}</strong>,</p>
                    <p>O funcionário <strong>${employee.employee.name}</strong> completou o teste psicométrico <strong>${testName}</strong>.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Funcionário:</strong> ${employee.employee.name}</p>
                      <p style="margin: 5px 0;"><strong>Teste:</strong> ${testName}</p>
                      <p style="margin: 5px 0;"><strong>Perfil:</strong> ${result.profileType || "N/A"}</p>
                      <p style="margin: 5px 0;"><strong>Data de Conclusão:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p>Você pode visualizar os resultados detalhados no sistema AVD UISA.</p>
                    <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                      Esta é uma notificação automática do Sistema AVD UISA.
                    </p>
                  </div>
                `,
              }).catch((err) => console.error("Erro ao enviar email para RH:", err));
            }
          }
        }
      } catch (error) {
        console.error("Erro ao enviar notificações:", error);
      }

      return {
        success: true,
        resultId,
        result,
      };
    }),

  /**
   * Listar convites de um funcionário
   */
  listEmployeeInvitations: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getTestInvitationsByEmployee(input.employeeId);
    }),

  /**
   * Listar resultados de um funcionário
   */
  listEmployeeResults: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getTestResultsByEmployee(input.employeeId);
    }),

  /**
   * Buscar resultado específico
   */
  getResult: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .query(async ({ input }) => {
      return await getTestResultByInvitation(input.invitationId);
    }),

  /**
   * Buscar resultado por ID
   */
  getResultById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await getTestResultById(input.id);
      if (!result) {
        throw new Error("Resultado não encontrado");
      }
      
      // Mapear campos do banco para o formato esperado pelo frontend
      return {
        id: result.id,
        testType: result.testType,
        status: "completed", // Todos os resultados salvos estão concluídos
        employeeName: result.employeeName,
        employeeId: result.employeeId,
        completedAt: result.completedAt,
        score: result.scores, // JSON com todas as pontuações
        profile: result.profileType, // Ex: "ENTJ", "Alto D", "Estilo de Vida"
        profileDescription: result.profileDescription,
        answers: result.rawData, // JSON com dados completos do teste
        recommendations: result.careerRecommendations || result.developmentAreas,
        notes: result.strengths ? `**Pontos Fortes:** ${result.strengths}` : null,
        // Campos adicionais que podem ser úteis
        strengths: result.strengths,
        developmentAreas: result.developmentAreas,
        workStyle: result.workStyle,
        communicationStyle: result.communicationStyle,
        leadershipStyle: result.leadershipStyle,
        motivators: result.motivators,
        stressors: result.stressors,
        teamContribution: result.teamContribution,
      };
    }),

  /**
   * Buscar último resultado de um tipo específico
   */
  getLatestResultByType: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        testType: testTypeEnum,
      })
    )
    .query(async ({ input }) => {
      return await getLatestTestResultByType(input.employeeId, input.testType);
    }),

  /**
   * Listar todos os resultados (admin)
   */
  listAllResults: protectedProcedure.input(z.object({})).query(async () => {
    return await getAllTestResults();
  }),

  /**
   * Estatísticas de conclusão
   */
  getCompletionStats: protectedProcedure.input(z.object({})).query(async () => {
    return await getTestCompletionStats();
  }),

  /**
   * Resultados por tipo de teste
   */
  getResultsByType: protectedProcedure.input(z.object({})).query(async () => {
    return await getTestResultsByType();
  }),

  /**
   * Buscar testes completados do usuário logado
   */
  getTests: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const { testResults, employees } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");

    // Buscar employee_id do usuário logado
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.openId, ctx.user.openId))
      .limit(1);

    if (!employee) {
      return [];
    }

    // Buscar todos os resultados de testes do funcionário
    const results = await db
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, employee.id))
      .orderBy(desc(testResults.completedAt));

    // Formatar resultados com perfil consolidado
    return results.map((result) => {
      // Parsear scores JSON se existir
      let parsedScores: any = {};
      if (result.scores) {
        try {
          parsedScores = typeof result.scores === 'string' ? JSON.parse(result.scores) : result.scores;
        } catch (e) {
          console.error('Erro ao parsear scores:', e);
        }
      }

      return {
        id: result.id,
        testType: result.testType,
        completedAt: result.completedAt,
        profile: {
          disc: parsedScores.disc || null,
          bigFive: parsedScores.bigFive || null,
          mbti: result.profileType || null,
        },
        interpretation: result.interpretation,
        profileType: result.profileType,
        profileDescription: result.profileDescription,
        strengths: result.strengths,
        developmentAreas: result.developmentAreas,
        workStyle: result.workStyle,
        communicationStyle: result.communicationStyle,
        leadershipStyle: result.leadershipStyle,
        motivators: result.motivators,
        stressors: result.stressors,
        teamContribution: result.teamContribution,
        careerRecommendations: result.careerRecommendations,
      };
    });
  }),

  /**
   * Buscar perfil consolidado de um funcionário (para integração com outros módulos)
   */
  getEmployeeProfile: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const results = await getTestResultsByEmployee(input.employeeId);
      
      // Consolidar resultados em um perfil único
      const profile: Record<string, any> = {
        employeeId: input.employeeId,
        summary: "",
      };

      for (const result of results) {
        const testType = result.testType;
        profile[testType as keyof typeof profile] = {
          profileType: result.profileType,
          profileDescription: result.profileDescription,
          strengths: result.strengths,
          developmentAreas: result.developmentAreas,
          workStyle: result.workStyle,
          communicationStyle: result.communicationStyle,
          leadershipStyle: result.leadershipStyle,
          motivators: result.motivators,
          stressors: result.stressors,
          teamContribution: result.teamContribution,
          careerRecommendations: result.careerRecommendations,
          completedAt: result.completedAt,
        };
      }

      // Gerar sumário consolidado
      const summaryParts: string[] = [];
      if (profile.disc) {
        summaryParts.push(`Perfil DISC: ${profile.disc.profileType}`);
      }
      if (profile.leadership) {
        summaryParts.push(`Estilo de Liderança: ${profile.leadership.profileType}`);
      }
      if (profile.bigFive) {
        summaryParts.push(`Big Five: ${profile.bigFive.profileDescription}`);
      }
      profile.summary = summaryParts.join(" | ");

      return profile;
    }),

  /**
   * Listar convites pendentes
   */
  listPendingInvitations: protectedProcedure.input(z.object({})).query(async () => {
    return await getAllPendingInvitations();
  }),

  /**
   * Obter resultados de testes de um funcionário específico
   */
  getEmployeeResults: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getTestResultsByEmployee(input.employeeId);
    }),

  /**
   * Obter resultados de testes de um funcionário (alias para getEmployeeResults)
   */
  getResultsByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getTestResultsByEmployee(input.employeeId);
    }),

  /**
   * Listar testes pendentes de validação
   */
  listPendingValidation: protectedProcedure.input(z.object({})).query(async () => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { testResults, employees } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const pendingTests = await db
      .select({
        id: testResults.id,
        testType: testResults.testType,
        profileType: testResults.profileType,
        completedAt: testResults.completedAt,
        employeeId: testResults.employeeId,
        employeeName: employees.name,
        employeeEmail: employees.email,
      })
      .from(testResults)
      .leftJoin(employees, eq(testResults.employeeId, employees.id))
      .where(eq(testResults.validationStatus, "pendente"))
      .orderBy(testResults.completedAt);

    return pendingTests;
  }),

  /**
   * Listar testes validados
   */
  listValidatedTests: protectedProcedure
    .input(
      z.object({
        status: z.enum(["aprovado", "reprovado"]).optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { testResults, employees, users } = await import("../../drizzle/schema");
      const { eq, and, or } = await import("drizzle-orm");

      let whereCondition;
      if (input.status) {
        whereCondition = eq(testResults.validationStatus, input.status);
      } else {
        whereCondition = or(
          eq(testResults.validationStatus, "aprovado"),
          eq(testResults.validationStatus, "reprovado")
        );
      }

      const validatedTests = await db
        .select({
          id: testResults.id,
          testType: testResults.testType,
          profileType: testResults.profileType,
          completedAt: testResults.completedAt,
          validationStatus: testResults.validationStatus,
          validatedAt: testResults.validatedAt,
          validationComments: testResults.validationComments,
          employeeId: testResults.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          validatedBy: testResults.validatedBy,
          validatorName: users.name,
        })
        .from(testResults)
        .leftJoin(employees, eq(testResults.employeeId, employees.id))
        .leftJoin(users, eq(testResults.validatedBy, users.id))
        .where(whereCondition)
        .orderBy(testResults.validatedAt);

      return validatedTests;
    }),

  /**
   * Validar teste (aprovar ou reprovar)
   */
  validateTest: protectedProcedure
    .input(
      z.object({
        testResultId: z.number(),
        status: z.enum(["aprovado", "reprovado"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { testResults, employees } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Buscar teste e funcionário
      const [test] = await db
        .select({
          id: testResults.id,
          testType: testResults.testType,
          employeeId: testResults.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
        })
        .from(testResults)
        .leftJoin(employees, eq(testResults.employeeId, employees.id))
        .where(eq(testResults.id, input.testResultId))
        .limit(1);

      if (!test) {
        throw new Error("Teste não encontrado");
      }

      // Atualizar status de validação
      await db
        .update(testResults)
        .set({
          validationStatus: input.status,
          validatedAt: new Date(),
          validatedBy: ctx.user.id,
          validationComments: input.comments || null,
        })
        .where(eq(testResults.id, input.testResultId));

      // Enviar email ao funcionário
      if (test.employeeEmail) {
        const statusText = input.status === "aprovado" ? "aprovado" : "reprovado";
        const subject = `Teste ${test.testType.toUpperCase()} ${statusText}`;
        const html = `
          <h2>Olá ${test.employeeName || "Colaborador"},</h2>
          <p>Seu teste <strong>${test.testType.toUpperCase()}</strong> foi ${statusText}.</p>
          ${input.comments ? `<p><strong>Comentários:</strong> ${input.comments}</p>` : ""}
          <p>Acesse o sistema para mais detalhes.</p>
        `;

        try {
          await sendEmail({
            to: test.employeeEmail,
            subject,
            html,
          });
        } catch (error) {
          console.error("Erro ao enviar email de validação:", error);
          // Não falha a operação se o email falhar
        }
      }

      return { success: true };
    }),

  /**
   * Validar múltiplos testes em lote
   */
  validateTestsBatch: protectedProcedure
    .input(
      z.object({
        testResultIds: z.array(z.number()).min(1),
        status: z.enum(["aprovado", "reprovado"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { testResults, employees } = await import("../../drizzle/schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Buscar todos os testes e funcionários
      const tests = await db
        .select({
          id: testResults.id,
          testType: testResults.testType,
          employeeId: testResults.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
        })
        .from(testResults)
        .leftJoin(employees, eq(testResults.employeeId, employees.id))
        .where(inArray(testResults.id, input.testResultIds));

      if (tests.length === 0) {
        throw new Error("Nenhum teste encontrado");
      }

      // Atualizar status de validação em lote
      await db
        .update(testResults)
        .set({
          validationStatus: input.status,
          validatedAt: new Date(),
          validatedBy: ctx.user.id,
          validationComments: input.comments || null,
        })
        .where(inArray(testResults.id, input.testResultIds));

      // Enviar emails aos funcionários de forma assíncrona
      const emailPromises = tests
        .filter((test) => test.employeeEmail)
        .map(async (test) => {
          const statusText = input.status === "aprovado" ? "aprovado" : "reprovado";
          const subject = `Teste ${test.testType.toUpperCase()} ${statusText}`;
          const html = `
            <h2>Olá ${test.employeeName || "Colaborador"},</h2>
            <p>Seu teste <strong>${test.testType.toUpperCase()}</strong> foi ${statusText}.</p>
            ${input.comments ? `<p><strong>Comentários:</strong> ${input.comments}</p>` : ""}
            <p>Acesse o sistema para mais detalhes.</p>
          `;

          try {
            await sendEmail({
              to: test.employeeEmail,
              subject,
              html,
            });
          } catch (error) {
            console.error(`Erro ao enviar email para ${test.employeeEmail}:`, error);
          }
        });

      // Aguardar todos os emails serem enviados (sem bloquear a resposta)
      Promise.all(emailPromises).catch((err) =>
        console.error("Erro ao enviar emails em lote:", err)
      );

      return {
        success: true,
        processedCount: tests.length,
      };
    }),

  /**
   * Obter estatísticas de validação
   */
  getValidationStats: protectedProcedure.input(z.object({})).query(async () => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { testResults } = await import("../../drizzle/schema");
    const { eq, count } = await import("drizzle-orm");

    const [pendingCount] = await db
      .select({ count: count() })
      .from(testResults)
      .where(eq(testResults.validationStatus, "pendente"));

    const [approvedCount] = await db
      .select({ count: count() })
      .from(testResults)
      .where(eq(testResults.validationStatus, "aprovado"));

    const [rejectedCount] = await db
      .select({ count: count() })
      .from(testResults)
      .where(eq(testResults.validationStatus, "reprovado"));

    const [totalCount] = await db
      .select({ count: count() })
      .from(testResults);

    return {
      pending: pendingCount?.count || 0,
      approved: approvedCount?.count || 0,
      rejected: rejectedCount?.count || 0,
      total: totalCount?.count || 0,
    };
  }),
});

/**
 * Função auxiliar para gerar resultados descritivos baseados nas respostas
 */
async function generateTestResults(
  testType: string,
  questions: any[],
  responses: any[]
): Promise<{
  scores: Record<string, number>;
  profileType?: string;
  profileDescription?: string;
  strengths?: string;
  developmentAreas?: string;
  workStyle?: string;
  communicationStyle?: string;
  leadershipStyle?: string;
  motivators?: string;
  stressors?: string;
  teamContribution?: string;
  careerRecommendations?: string;
}> {
  // Calcular pontuações por dimensão
  const scores: Record<string, number> = {};
  const dimensionCounts: Record<string, number> = {};

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    if (!question) continue;

    const dimension = question.dimension;
    const score = question.reverse ? 6 - response.answer : response.answer;

    if (!scores[dimension]) {
      scores[dimension] = 0;
      dimensionCounts[dimension] = 0;
    }

    scores[dimension] += score;
    dimensionCounts[dimension]++;
  }

  // Normalizar pontuações (0-100)
  for (const dimension in scores) {
    const count = dimensionCounts[dimension];
    if (count > 0) {
      scores[dimension] = Math.round((scores[dimension] / (count * 5)) * 100);
    }
  }

  // Gerar descritivos baseados no tipo de teste
  let result: {
    scores: Record<string, number>;
    profileType?: string;
    profileDescription?: string;
    strengths?: string;
    developmentAreas?: string;
    workStyle?: string;
    communicationStyle?: string;
    leadershipStyle?: string;
    motivators?: string;
    stressors?: string;
    teamContribution?: string;
    careerRecommendations?: string;
  } = { scores };

  switch (testType) {
    case "disc":
      result = generateDISCDescriptives(scores);
      break;
    case "bigfive":
      result = generateBigFiveDescriptives(scores);
      break;
    case "mbti":
      result = generateMBTIDescriptives(scores);
      break;
    case "ie":
      result = generateIEDescriptives(scores);
      break;
    case "vark":
      result = generateVARKDescriptives(scores);
      break;
    case "leadership":
      result = generateLeadershipDescriptives(scores);
      break;
    case "careeranchors":
      result = generateCareerAnchorsDescriptives(scores);
      break;
    default:
      result = {
        scores,
        profileType: "Indefinido",
        profileDescription: "Perfil não identificado",
      };
  }

  return result;
}

// Funções auxiliares para gerar descritivos por tipo de teste
// (Implementações simplificadas - podem ser expandidas com IA)

function generateDISCDescriptives(scores: Record<string, number>) {
  const dimensions = ["dominance", "influence", "steadiness", "compliance"];
  const highest = dimensions.reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  const profiles: Record<string, any> = {
    dominance: {
      profileType: "Alto D (Dominância)",
      profileDescription:
        "Pessoa orientada para resultados, direta e assertiva. Gosta de desafios e toma decisões rapidamente.",
      strengths:
        "Liderança natural, foco em resultados, coragem para tomar decisões difíceis, orientação para metas.",
      developmentAreas:
        "Pode ser percebido como impaciente ou insensível. Precisa desenvolver escuta ativa e empatia.",
      workStyle:
        "Prefere ambiente competitivo, autonomia e autoridade. Trabalha bem sob pressão.",
      communicationStyle:
        "Direto, objetivo e focado em resultados. Pode ser percebido como agressivo.",
    },
    influence: {
      profileType: "Alto I (Influência)",
      profileDescription:
        "Pessoa entusiasta, comunicativa e persuasiva. Gosta de trabalhar com pessoas e criar relacionamentos.",
      strengths:
        "Excelente comunicador, otimista, persuasivo, criativo, bom em networking.",
      developmentAreas:
        "Pode ser desorganizado e perder foco. Precisa desenvolver disciplina e follow-through.",
      workStyle:
        "Prefere ambiente social, colaborativo e dinâmico. Trabalha melhor em equipe.",
      communicationStyle:
        "Expressivo, entusiasta e inspirador. Gosta de compartilhar ideias.",
    },
    steadiness: {
      profileType: "Alto S (Estabilidade)",
      profileDescription:
        "Pessoa paciente, leal e consistente. Valoriza harmonia e estabilidade.",
      strengths:
        "Confiável, paciente, bom ouvinte, leal, trabalha bem em equipe.",
      developmentAreas:
        "Pode resistir a mudanças e evitar conflitos. Precisa desenvolver assertividade.",
      workStyle:
        "Prefere ambiente previsível, estruturado e harmonioso. Valoriza segurança.",
      communicationStyle:
        "Calmo, paciente e empático. Evita confrontos.",
    },
    compliance: {
      profileType: "Alto C (Conformidade)",
      profileDescription:
        "Pessoa analítica, precisa e orientada para qualidade. Valoriza exatidão e procedimentos.",
      strengths:
        "Atencioso aos detalhes, analítico, organizado, focado em qualidade.",
      developmentAreas:
        "Pode ser perfeccionista e crítico. Precisa desenvolver flexibilidade.",
      workStyle:
        "Prefere ambiente estruturado, com regras claras e padrões de qualidade.",
      communicationStyle:
        "Formal, preciso e baseado em fatos. Valoriza documentação.",
    },
  };

  return {
    scores,
    ...profiles[highest],
    motivators:
      "Desafios, autonomia, reconhecimento, oportunidades de crescimento.",
    stressors: "Ambiguidade, falta de controle, microgerenciamento, rotina.",
    teamContribution:
      "Traz energia, foco em resultados e capacidade de tomar decisões rápidas.",
    careerRecommendations:
      "Cargos de liderança, gestão de projetos, vendas, empreendedorismo.",
  };
}

function generateBigFiveDescriptives(scores: Record<string, number>) {
  return {
    scores,
    profileType: "Big Five",
    profileDescription: `Perfil de personalidade baseado nas cinco grandes dimensões: Abertura (${scores.openness}), Conscienciosidade (${scores.conscientiousness}), Extroversão (${scores.extraversion}), Amabilidade (${scores.agreeableness}), Neuroticismo (${scores.neuroticism}).`,
    strengths:
      "Perfil equilibrado com capacidade de adaptação a diferentes contextos.",
    developmentAreas:
      "Identificar dimensões com pontuações extremas para desenvolvimento.",
    workStyle: "Adaptável a diferentes ambientes e situações.",
    communicationStyle: "Varia conforme o contexto e as pessoas envolvidas.",
    motivators: "Variam conforme as dimensões predominantes.",
    stressors: "Dependem das dimensões com pontuações mais baixas.",
    teamContribution: "Contribuição balanceada em diferentes aspectos.",
    careerRecommendations:
      "Ampla gama de possibilidades, dependendo das dimensões predominantes.",
  };
}

function generateMBTIDescriptives(scores: Record<string, number>) {
  // Simplificado - na prática, seria mais complexo
  return {
    scores,
    profileType: "MBTI",
    profileDescription:
      "Perfil de personalidade baseado em preferências de percepção e julgamento.",
    strengths: "Autoconhecimento e compreensão de preferências naturais.",
    developmentAreas: "Desenvolver funções menos preferidas.",
    workStyle: "Baseado em preferências de percepção e julgamento.",
    communicationStyle: "Varia conforme tipo de personalidade.",
    motivators: "Alinhados com preferências naturais.",
    stressors: "Situações que vão contra preferências naturais.",
    teamContribution: "Contribuição única baseada no tipo.",
    careerRecommendations: "Carreiras alinhadas com tipo de personalidade.",
  };
}

function generateIEDescriptives(scores: Record<string, number>) {
  return {
    scores,
    profileType: "Inteligência Emocional",
    profileDescription:
      "Perfil de competências emocionais e sociais.",
    strengths: "Capacidade de reconhecer e gerenciar emoções.",
    developmentAreas: "Dimensões com pontuações mais baixas.",
    workStyle: "Orientado para relacionamentos e colaboração.",
    communicationStyle: "Empático e consciente das emoções dos outros.",
    motivators: "Conexões humanas, propósito, impacto positivo.",
    stressors: "Conflitos, falta de empatia, ambientes tóxicos.",
    teamContribution: "Facilita relacionamentos e resolve conflitos.",
    careerRecommendations:
      "Áreas que envolvem relacionamento interpessoal.",
  };
}

function generateVARKDescriptives(scores: Record<string, number>) {
  return {
    scores,
    profileType: "VARK",
    profileDescription: "Perfil de estilos de aprendizagem preferidos.",
    strengths: "Conhecimento de como aprende melhor.",
    developmentAreas: "Desenvolver outros estilos de aprendizagem.",
    workStyle: "Adaptado ao estilo de aprendizagem preferido.",
    communicationStyle: "Alinhado com preferências de aprendizagem.",
    motivators: "Oportunidades de aprendizado no estilo preferido.",
    stressors: "Métodos de ensino incompatíveis.",
    teamContribution: "Diversidade de estilos de aprendizagem.",
    careerRecommendations: "Ambientes que favorecem seu estilo.",
  };
}

function generateLeadershipDescriptives(scores: Record<string, number>) {
  return {
    scores,
    profileType: "Liderança",
    profileDescription: "Perfil de competências e estilo de liderança.",
    strengths: "Competências de liderança identificadas.",
    developmentAreas: "Competências a desenvolver.",
    workStyle: "Orientado para liderança e gestão de pessoas.",
    communicationStyle: "Inspirador e direcionador.",
    leadershipStyle: "Baseado nas competências predominantes.",
    motivators: "Impacto, influência, desenvolvimento de pessoas.",
    stressors: "Falta de autonomia, resistência da equipe.",
    teamContribution: "Direcionamento, inspiração e desenvolvimento.",
    careerRecommendations: "Posições de liderança e gestão.",
  };
}

function generateCareerAnchorsDescriptives(scores: Record<string, number>) {
  return {
    scores,
    profileType: "Âncoras de Carreira",
    profileDescription: "Valores e motivações de carreira predominantes.",
    strengths: "Clareza sobre valores e prioridades de carreira.",
    developmentAreas: "Alinhar carreira com âncoras identificadas.",
    workStyle: "Orientado pelos valores de carreira.",
    communicationStyle: "Reflete valores e prioridades.",
    motivators: "Alinhados com âncoras de carreira.",
    stressors: "Situações que conflitam com valores.",
    teamContribution: "Contribuição baseada em valores.",
    careerRecommendations: "Carreiras alinhadas com âncoras.",
  };
}
