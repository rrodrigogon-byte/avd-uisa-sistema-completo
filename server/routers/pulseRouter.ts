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
  targetGroups: z.array(z.enum(["all", "diretoria", "department", "costCenter", "emails"])).optional(),
  targetDepartmentIds: z.array(z.number()).optional(),
  targetCostCenterIds: z.array(z.number()).optional(),
  targetEmails: z.array(z.string().email()).optional(),
});

const submitResponseSchema = z.object({
  surveyId: z.number(),
  rating: z.number().min(0).max(10),
  comment: z.string().optional(),
  employeeId: z.number().optional(),
});

export const pulseRouter = router({
  // Buscar pesquisa pública (sem autenticação)
  getPublicSurvey: publicProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const survey = await db
        .select({
          id: pulseSurveys.id,
          title: pulseSurveys.title,
          question: pulseSurveys.question,
          description: pulseSurveys.description,
          status: pulseSurveys.status,
        })
        .from(pulseSurveys)
        .where(
          and(
            eq(pulseSurveys.id, input.surveyId),
            eq(pulseSurveys.status, "active")
          )
        )
        .limit(1)
        .then((r) => r[0]);

      return survey || null;
    }),

  // Listar todas as pesquisas
  list: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
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
          avgScore: stats?.avgScore ? Number(Number(stats.avgScore).toFixed(1)) : 0,
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
        targetGroups: input.targetGroups ? JSON.stringify(input.targetGroups) : null,
        targetDepartmentIds: input.targetDepartmentIds ? JSON.stringify(input.targetDepartmentIds) : null,
        targetCostCenterIds: input.targetCostCenterIds ? JSON.stringify(input.targetCostCenterIds) : null,
        targetEmails: input.targetEmails ? JSON.stringify(input.targetEmails) : null,
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

      // Buscar dados da pesquisa antes de ativar
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

      await db
        .update(pulseSurveys)
        .set({
          status: "active",
          activatedAt: new Date(),
        })
        .where(eq(pulseSurveys.id, input.surveyId));

      // Enviar emails para participantes
      try {
        const { emailService } = await import("../utils/emailService");
        
        // Buscar participantes baseado nos filtros da pesquisa
        let targetEmployees: any[] = [];
        
        if (survey.targetEmails) {
          // Se tem emails específicos, usar esses
          const emails = typeof survey.targetEmails === 'string' ? JSON.parse(survey.targetEmails) : survey.targetEmails;
          // Buscar funcionários por email
          for (const email of emails) {
            const emp = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
            if (emp.length > 0) targetEmployees.push(emp[0]);
          }
        } else {
          // Caso contrário, buscar todos os funcionários ativos
          targetEmployees = await db
            .select()
            .from(employees)
            .where(eq(employees.status, "ativo"));
        }

        // Enviar email para cada participante
        let emailsSent = 0;
        let emailsFailed = 0;
        const failedEmails: string[] = [];

        for (const employee of targetEmployees) {
          if (!employee.email) {
            console.warn(`[Pulse] Funcionário ${employee.name} sem email cadastrado`);
            continue;
          }

          const surveyUrl = `${process.env.VITE_APP_URL || "http://localhost:3000"}/pesquisas/pulse/responder/${survey.id}`;

          try {
            const sent = await emailService.sendCustomEmail(
              employee.email,
              `📊 Nova Pesquisa Pulse: ${survey.title}`,
              `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📊 Nova Pesquisa Pulse</h1>
                  </div>
                  <div class="content">
                    <p>Olá <strong>${employee.name}</strong>,</p>
                    
                    <p>Uma nova pesquisa Pulse foi criada e sua opinião é muito importante para nós!</p>
                    
                    <h3>${survey.title}</h3>
                    <p>${survey.question}</p>
                    
                    ${survey.description ? `<p><em>${survey.description}</em></p>` : ""}
                    
                    <p>Por favor, reserve alguns minutos para responder. Sua participação é anônima e confidencial.</p>
                    
                    <div style="text-align: center;">
                      <a href="${surveyUrl}" class="button">
                        Responder Pesquisa
                      </a>
                    </div>
                    
                    <p>Obrigado pela sua colaboração!</p>
                    <p><em>Equipe de RH</em></p>
                  </div>
                  <div class="footer">
                    <p>Este é um e-mail automático. Por favor, não responda.</p>
                  </div>
                </div>
              </body>
              </html>
            `
            );
            
            if (sent) {
              emailsSent++;
              console.log(`[Pulse] Email enviado com sucesso para ${employee.email}`);
            } else {
              emailsFailed++;
              failedEmails.push(employee.email);
              console.warn(`[Pulse] Falha ao enviar email para ${employee.email}`);
            }
          } catch (emailError) {
            emailsFailed++;
            failedEmails.push(employee.email);
            console.error(`[Pulse] Erro ao enviar email para ${employee.email}:`, emailError);
          }
        }

        console.log(`[Pulse] Resumo de envio: ${emailsSent} enviados, ${emailsFailed} falharam`);
        if (failedEmails.length > 0) {
          console.warn(`[Pulse] Emails que falharam:`, failedEmails);
        }
      } catch (error) {
        console.error("[Pulse] Erro ao enviar emails:", error);
        // Não falhar a ativação se emails falharem
      }

      // Enviar notificação push para todos os usuários
      try {
        const { sendPushNotificationToAll } = await import("../utils/pushNotificationHelper");
        await sendPushNotificationToAll(
          {
            title: "📊 Nova Pesquisa Pulse Disponível",
            body: `${survey.title} - Sua opinião é importante!`,
            icon: "/icon-192x192.png",
            data: {
              type: "pulse_survey",
              surveyId: survey.id,
              url: `/pesquisas-pulse/${survey.id}/responder`,
            },
            actions: [
              {
                action: "respond",
                title: "Responder Agora",
              },
            ],
          },
          "pulse"
        );
        console.log(`[Pulse] Notificações push enviadas para pesquisa ${survey.id}`);
      } catch (error) {
        console.error("[Pulse] Erro ao enviar notificações push:", error);
        // Não falhar a ativação se notificações falharem
      }

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
        avgScore: stats?.avgScore ? Number(Number(stats.avgScore).toFixed(1)) : 0,
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

      // Buscar colaboradores baseado nos filtros da pesquisa
      let targetEmployees: any[] = [];

      // Parse campos JSON para arrays
      const targetGroups = Array.isArray(survey.targetGroups) ? survey.targetGroups : [];
      const targetDepartmentIds = Array.isArray(survey.targetDepartmentIds) ? survey.targetDepartmentIds : [];
      const targetCostCenterIds = Array.isArray(survey.targetCostCenterIds) ? survey.targetCostCenterIds : [];
      const targetEmails = Array.isArray(survey.targetEmails) ? survey.targetEmails : [];

      // Se targetGroups incluir "all", buscar todos
      if (targetGroups && targetGroups.includes("all")) {
        targetEmployees = await db
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.status, "ativo"));
      } else {
        // Filtrar por departamentos
        if (targetDepartmentIds && targetDepartmentIds.length > 0) {
          const deptEmployees = await db
            .select({
              id: employees.id,
              name: employees.name,
              email: employees.email,
            })
            .from(employees)
            .where(
              and(
                eq(employees.status, "ativo"),
                sql`${employees.departmentId} IN (${targetDepartmentIds.join(",")})`
              )
            );
          targetEmployees.push(...deptEmployees);
        }

        // Filtrar por centros de custo
        if (targetCostCenterIds && targetCostCenterIds.length > 0) {
          const ccEmployees = await db
            .select({
              id: employees.id,
              name: employees.name,
              email: employees.email,
            })
            .from(employees)
            .where(
              and(
                eq(employees.status, "ativo"),
                sql`${employees.costCenter} IN (${targetCostCenterIds.map((id: number) => `'CC-${id}'`).join(",")})`
              )
            );
          targetEmployees.push(...ccEmployees);
        }

        // Adicionar emails específicos
        if (targetEmails && targetEmails.length > 0) {
          const emailEmployees = await db
            .select({
              id: employees.id,
              name: employees.name,
              email: employees.email,
            })
            .from(employees)
            .where(
              and(
                eq(employees.status, "ativo"),
                sql`${employees.email} IN (${targetEmails.map((e: string) => `'${e}'`).join(",")})`
              )
            );
          targetEmployees.push(...emailEmployees);
        }

        // Remover duplicatas
        const uniqueEmployees = new Map();
        targetEmployees.forEach((emp) => {
          if (emp.email && !uniqueEmployees.has(emp.id)) {
            uniqueEmployees.set(emp.id, emp);
          }
        });
        targetEmployees = Array.from(uniqueEmployees.values());
      }

      console.log(`[Pulse] Enviando para ${targetEmployees.length} colaboradores`);

      // Validar configuração SMTP antes de enviar
      const { systemSettings } = await import("../../drizzle/schema");
      const smtpSettings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, "smtp_config"))
        .limit(1);

      if (smtpSettings.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SMTP não encontrada. Configure o SMTP em Configurações > SMTP antes de enviar pesquisas.",
        });
      }

      const smtpConfig = JSON.parse(smtpSettings[0].settingValue || "{}");
      if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SMTP incompleta. Verifique as configurações em Configurações > SMTP.",
        });
      }

      // Implementar envio de e-mail real usando emailService
      const { sendEmail } = await import("../utils/emailService");
      let successCount = 0;
      let failCount = 0;
      const failedEmails: string[] = [];

      console.log(`[Pulse] Iniciando envio para ${targetEmployees.length} colaboradores`);

      for (const employee of targetEmployees) {
        if (!employee.email) {
          console.warn(`[Pulse] Funcionário ${employee.name} sem email`);
          continue;
        }
        
        const surveyLink = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/pesquisas-pulse/responder/${survey.id}`;
        
        try {
          const emailSent = await sendEmail({
            to: employee.email,
            subject: `📊 Pesquisa Pulse: ${survey.title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #F39200; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; background-color: #F39200; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
                  .question-box { background: #fff; padding: 20px; border-left: 4px solid #F39200; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📊 Nova Pesquisa Pulse</h1>
                  </div>
                  <div class="content">
                    <p>Olá <strong>${employee.name}</strong>,</p>
                    
                    <p>Uma nova pesquisa Pulse foi criada e sua opinião é muito importante para nós!</p>
                    
                    <div class="question-box">
                      <h3 style="margin-top: 0; color: #F39200;">${survey.title}</h3>
                      <p style="font-size: 16px;"><strong>${survey.question}</strong></p>
                      ${survey.description ? `<p style="color: #666;"><em>${survey.description}</em></p>` : ""}
                    </div>
                    
                    <p>Por favor, reserve alguns minutos para responder. Sua participação é anônima e confidencial.</p>
                    
                    <div style="text-align: center;">
                      <a href="${surveyLink}" class="button">
                        Responder Pesquisa Agora
                      </a>
                    </div>
                    
                    <p>Obrigado pela sua colaboração!</p>
                    <p><em>Equipe de RH - Sistema AVD UISA</em></p>
                  </div>
                  <div class="footer">
                    <p>Este é um e-mail automático. Por favor, não responda.</p>
                    <p>Link direto: <a href="${surveyLink}">${surveyLink}</a></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          if (emailSent) {
            successCount++;
            console.log(`[Pulse] ✓ Email enviado para ${employee.email}`);
          } else {
            failCount++;
            failedEmails.push(employee.email);
            console.warn(`[Pulse] ✗ Falha ao enviar para ${employee.email}`);
          }
        } catch (error) {
          failCount++;
          failedEmails.push(employee.email);
          console.error(`[Pulse] ✗ Erro ao enviar para ${employee.email}:`, error);
        }
      }

      console.log(`[Pulse] Resumo de envio: ${successCount} enviados, ${failCount} falharam`);
      if (failedEmails.length > 0) {
        console.warn(`[Pulse] Emails que falharam:`, failedEmails);
      }

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
        message: `Convites enviados: ${successCount} sucesso, ${failCount} falhas${failedEmails.length > 0 ? '. Verifique os logs para detalhes.' : ''}`,
        sentCount: successCount,
        failedCount: failCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
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
