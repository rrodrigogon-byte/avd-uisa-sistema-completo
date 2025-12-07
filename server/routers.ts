import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getUserByOpenId } from "./db";
import { employees, goals, pdiPlans, pdiItems, performanceEvaluations, nineBoxPositions, passwordResetTokens, users, successionPlans, testQuestions, psychometricTests, systemSettings, emailMetrics, calibrationSessions, calibrationReviews, evaluationResponses, evaluationQuestions, departments, positions, evaluationCycles, notifications, auditLogs, scheduledReports, reportExecutionLogs, workflows, workflowInstances, workflowStepApprovals, smtpConfig, costCenters, approvalRules, approvalRuleHistory, evaluationInstances, evaluationCriteriaResponses, evaluationCriteria } from "../drizzle/schema";
import { getDb } from "./db";
import { analyticsRouter } from "./analyticsRouter";
import { feedbackRouter } from "./feedbackRouter";
import { badgesRouter } from "./badgesRouter";
import { scheduledReportsRouter } from "./scheduledReportsRouter";
import { executiveRouter } from "./executiveRouter";
import { successionRouter } from "./successionRouter";
import { nineBoxRouter } from "./nineBoxRouter";
import { pdiIntelligentRouter } from "./pdiIntelligentRouter";
import { evaluation360Router } from "./evaluation360Router";
import { reportBuilderRouter } from "./reportBuilderRouter";
import { reportAnalyticsRouter } from "./reportAnalyticsRouter";
import { goalsRouter } from "./goalsRouter";
import { goalsCascadeRouter } from "./goalsCascadeRouter";
import { cyclesRouter } from "./cyclesRouter";
import { jobDescriptionRouter } from "./jobDescriptionRouter";
import { bonusRouter } from "./routers/bonusRouter";
import { bonusWorkflowRouter } from "./routers/bonusWorkflowRouter";
import { calibrationRouter } from "./calibrationRouter";
import { gamificationRouter } from "./gamificationRouter";
import { integrationsRouter } from "./integrationsRouter";
import { notificationsRouter } from "./notificationsRouter";
import { sendEmail } from "./emailService";
import { pulseRouter } from "./routers/pulseRouter";
import { positionsRouter } from "./routers/positionsRouter";
import { jobDescriptionsRouter } from "./routers/jobDescriptionsRouter";
import { jobDescriptionsPDFRouter } from "./routers/jobDescriptionsPDF";
import { productivityRouter } from "./routers/productivityRouter";
import { importRouter } from "./routers/importRouter";
import { alertsRouter } from "./routers/alertsRouter";
import { timeClockRouter } from "./routers/timeClockRouter";
import { activitiesRouter } from "./routers/activitiesRouter";
import { productivityGoalsRouter } from "./routers/productivityGoalsRouter";
import { approvalsStatsRouter } from "./routers/approvalsStatsRouter";
import { organizationRouter } from "./routers/organizationRouter";
import { goalApprovalsRouter } from "./goalApprovalsRouter";
import { uisaImportRouter } from "./routers/uisaImportRouter";
import { payrollRouter } from "./routers/payrollRouter";
import { adminRouter } from "./routers/adminRouter";
import { pushNotificationsRouter } from "./routers/pushNotificationsRouter";
import { employeesRouter } from "./routers/employeesRouter";
import { employeeProfileRouter } from "./routers/employeeProfileRouter";
import { evaluationsRouter } from "./routers/evaluationsRouter";
import { performanceReportsRouter } from "./routers/performanceReportsRouter";
import { auditRouter } from "./routers/auditRouter";
import { searchRouter } from "./routers/searchRouter";
import { advancedAnalyticsRouter } from "./advancedAnalyticsRouter";
import { evaluationTemplatesRouter } from "./routers/evaluationTemplatesRouter";
import { calibrationDirectorRouter } from "./routers/calibrationDirectorRouter";
import { reportsRouter } from "./routers/reportsRouter";
import { calibrationMeetingRouter } from "./calibrationMeetingRouter";
import { performanceEvaluationCycleRouter } from "./performanceEvaluationCycleRouter";
import { notificationTemplatesRouter } from "./notificationTemplatesRouter";
import { cycles360TemplatesRouter } from "./cycles360TemplatesRouter";
import { timeTrackingRouter } from "./routers/timeTrackingRouter";
import { evaluationCyclesRouter } from "./routers/evaluationCyclesRouter";
import { emailFailuresRouter } from "./routers/emailFailuresRouter";
import { evaluation360EnhancedRouter } from "./evaluation360EnhancedRouter";
import { cycles360OverviewRouter } from "./cycles360OverviewRouter";
import { usersRouter } from "./routers/usersRouter";
import { avdUisaRouter } from "./avdUisaRouter";
import { and, desc, eq, sql, gte, lte, or } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
  audit: auditRouter,
  search: searchRouter,
  users: usersRouter,
  avdUisa: avdUisaRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Solicitar reset de senha
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Buscar usuário por e-mail
        const user = await db.select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (user.length === 0) {
          // Não revelar se o e-mail existe ou não (segurança)
          return { success: true };
        }

        // Gerar token único
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

        // Salvar token no banco
        await db.insert(passwordResetTokens).values({
          userId: user[0].id,
          token,
          expiresAt,
        });

        // TODO: Enviar e-mail com link de reset
        // await emailService.sendResetPassword(input.email, { token, name: user[0].name });

        return { success: true };
      }),

    // Validar token de reset
    validateResetToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const tokenRecord = await db.select()
          .from(passwordResetTokens)
          .where(
            and(
              eq(passwordResetTokens.token, input.token),
              eq(passwordResetTokens.used, false)
            )
          )
          .limit(1);

        if (tokenRecord.length === 0) {
          return { valid: false, message: "Token inválido" };
        }

        const token = tokenRecord[0];
        if (new Date() > new Date(token.expiresAt)) {
          return { valid: false, message: "Token expirado" };
        }

        return { valid: true };
      }),

    // Redefinir senha
    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), newPassword: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Validar token
        const tokenRecord = await db.select()
          .from(passwordResetTokens)
          .where(
            and(
              eq(passwordResetTokens.token, input.token),
              eq(passwordResetTokens.used, false)
            )
          )
          .limit(1);

        if (tokenRecord.length === 0) {
          throw new Error("Token inválido");
        }

        const token = tokenRecord[0];
        if (new Date() > new Date(token.expiresAt)) {
          throw new Error("Token expirado");
        }

        // TODO: Atualizar senha do usuário (requer implementação de hash de senha)
        // await db.update(users)
        //   .set({ password: await hashPassword(input.newPassword) })
        //   .where(eq(users.id, token.userId));

        // Marcar token como usado
        await db.update(passwordResetTokens)
          .set({ used: true })
          .where(eq(passwordResetTokens.id, token.id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // COLABORADORES - Usando router moderno com suporte a search
  // ============================================================================
  employees: employeesRouter,
  employeeProfile: employeeProfileRouter,

  // ============================================================================
  // METAS (movido para goalsRouter.ts)
  // ============================================================================

  // ============================================================================
  // AVALIAÇÕES 360°
  // ============================================================================
  evaluations: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        cycleId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const employeeId = input.employeeId || (await db.getEmployeeByUserId(ctx.user!.id))?.id;
        if (!employeeId) {
          return [];
        }
        return await db.getEvaluationsByEmployee(employeeId, input.cycleId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const evaluation = await db.getEvaluationById(input.id);
        if (!evaluation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Avaliação não encontrada",
          });
        }
        return evaluation;
      }),

    create: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        employeeId: z.number(),
        type: z.enum(["360", "180", "90"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const [result] = await database.insert(performanceEvaluations).values({
          ...input,
          status: "pendente",
        });

        const evaluationId = Number(result.insertId);

        await db.logAudit(
          ctx.user!.id,
          "CREATE",
          "performanceEvaluations",
          evaluationId,
          input,
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        return { id: evaluationId, success: true };
      }),

    // Buscar avaliações pendentes do usuário logado (como avaliador)
    listPending: protectedProcedure
      .input(z.object({ 
        evaluatorId: z.number().optional(),
        status: z.string().optional(),
        cycleId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar employee do usuário logado
        const employee = await db.getEmployeeByUserId(ctx.user!.id);
        if (!employee) return [];

        const evaluatorId = input.evaluatorId || employee.id;

        // Buscar avaliações 360° onde o usuário é avaliador (usando performanceEvaluations)
        const evaluations360 = await database
          .select({
            id: performanceEvaluations.id,
            employeeId: performanceEvaluations.employeeId,
            cycleId: performanceEvaluations.cycleId,
            type: sql<string>`'360'`.as('type'),
            status: performanceEvaluations.workflowStatus,
            deadline: sql<Date | null>`NULL`.as('deadline'),
          })
          .from(performanceEvaluations)
          .where(
            sql`${performanceEvaluations.type} = '360' AND ${performanceEvaluations.workflowStatus} IN ('pending_manager', 'pending_consensus')`
          );

        // Buscar autoavaliações pendentes
        const autoAvaliacoes = await database
          .select({
            id: performanceEvaluations.id,
            employeeId: performanceEvaluations.employeeId,
            cycleId: performanceEvaluations.cycleId,
            type: sql<string>`'autoavaliacao'`.as('type'),
            status: performanceEvaluations.workflowStatus,
            deadline: sql<Date | null>`NULL`.as('deadline'),
          })
          .from(performanceEvaluations)
          .where(
            sql`${performanceEvaluations.type} = '360' AND ${performanceEvaluations.workflowStatus} = 'pending_self' AND ${performanceEvaluations.employeeId} = ${evaluatorId}`
          );

        // Buscar avaliações de performance pendentes
        const performanceEvals = await database
          .select({
            id: performanceEvaluations.id,
            employeeId: performanceEvaluations.employeeId,
            cycleId: performanceEvaluations.cycleId,
            type: sql<string>`'performance'`.as('type'),
            status: performanceEvaluations.status,
            deadline: sql<Date | null>`NULL`.as('deadline'),
          })
          .from(performanceEvaluations)
          .where(
            sql`${performanceEvaluations.status} IN ('pendente', 'em_andamento')`
          );

        // Combinar todas as avaliações
        const allEvaluations = [...evaluations360, ...autoAvaliacoes, ...performanceEvals];

        // Buscar dados dos colaboradores
        const employeeIds = Array.from(new Set(allEvaluations.map(e => e.employeeId)));
        const employeesData = employeeIds.length > 0
          ? await database
              .select({
                id: employees.id,
                name: employees.name,
                positionId: employees.positionId,
              })
              .from(employees)
              .where(sql`${employees.id} IN (${sql.join(employeeIds, sql`, `)})`)
          : [];

        // Buscar dados dos cargos
        const positionIds = employeesData.map(e => e.positionId).filter(Boolean);
        const positionsData = positionIds.length > 0
          ? await database
              .select()
              .from(positions)
              .where(sql`${positions.id} IN (${sql.join(positionIds, sql`, `)})`)
          : [];

        // Buscar dados dos ciclos
        const cycleIds = Array.from(new Set(allEvaluations.map(e => e.cycleId)));
        const cyclesData = cycleIds.length > 0
          ? await database
              .select()
              .from(evaluationCycles)
              .where(sql`${evaluationCycles.id} IN (${sql.join(cycleIds, sql`, `)})`)
          : [];

        // Montar resposta com dados completos
        let results = allEvaluations.map(evaluation => {
          const emp = employeesData.find(e => e.id === evaluation.employeeId);
          const position = positionsData.find((p: any) => p.id === emp?.positionId);
          const cycle = cyclesData.find((c: any) => c.id === evaluation.cycleId);

          return {
            id: evaluation.id,
            employeeId: evaluation.employeeId,
            employeeName: emp?.name || null,
            positionTitle: (position as any)?.title || null,
            cycleId: evaluation.cycleId,
            cycleName: (cycle as any)?.name || null,
            type: evaluation.type,
            status: evaluation.status,
            deadline: evaluation.deadline,
            evaluatorType: 'manager',
            finalScore: null,
            comments: null,
            createdAt: null,
            completedAt: null,
          };
        });

        // Filtrar por status se fornecido
        if (input.status) {
          results = results.filter(r => r.status === input.status);
        }

        // Filtrar por ciclo se fornecido
        if (input.cycleId) {
          results = results.filter(r => r.cycleId === input.cycleId);
        }

        return results;
      }),

    // Buscar avaliações pendentes da equipe do gestor
    getPendingByManager: protectedProcedure
      .input(z.object({ managerId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar subordinados diretos
        const teamMembers = await database
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.managerId, input.managerId));

        const teamMemberIds = teamMembers.map(e => e.id);
        if (teamMemberIds.length === 0) return [];

        // Buscar avaliações pendentes dos subordinados
        const pendingEvaluations = await database
          .select()
          .from(performanceEvaluations)
          .where(
            sql`${performanceEvaluations.employeeId} IN (${sql.join(teamMemberIds, sql`, `)}) AND ${performanceEvaluations.status} IN ('pendente', 'em_andamento')`
          );

        // Buscar dados dos colaboradores e ciclos
        const employeesData = await database
          .select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(sql`${employees.id} IN (${sql.join(teamMemberIds, sql`, `)})`);

        const cyclesData = await database.select().from(evaluationCycles);

        return pendingEvaluations.map(evaluation => ({
          ...evaluation,
          employee: employeesData.find(e => e.id === evaluation.employeeId),
          cycle: cyclesData.find((c: any) => c.id === evaluation.cycleId),
        }));
      }),

    // Relatório 360° Consolidado
    get360Consolidated: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        employeeId: z.number().optional(),
        departmentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Construir filtros
        const filters = [eq(evaluationInstances.cycleId, input.cycleId)];
        
        if (input.employeeId) {
          filters.push(eq(evaluationInstances.employeeId, input.employeeId));
        }
        
        if (input.departmentId) {
          // Buscar funcionários do departamento
          const deptEmployees = await database
            .select({ id: employees.id })
            .from(employees)
            .where(eq(employees.departmentId, input.departmentId));
          
          const employeeIds = deptEmployees.map(e => e.id);
          if (employeeIds.length > 0) {
            filters.push(inArray(evaluationInstances.employeeId, employeeIds));
          }
        }

        // Buscar avaliações do ciclo
        const instances = await database
          .select()
          .from(evaluationInstances)
          .where(and(...filters));

        if (instances.length === 0) {
          return {
            competencies: [],
            averages: { self: 0, manager: 0, peers: 0 },
          };
        }

        // Buscar todas as respostas
        const instanceIds = instances.map(i => i.id);
        const responses = await database
          .select({
            instanceId: evaluationCriteriaResponses.instanceId,
            criteriaId: evaluationCriteriaResponses.criteriaId,
            score: evaluationCriteriaResponses.score,
          })
          .from(evaluationCriteriaResponses)
          .where(inArray(evaluationCriteriaResponses.instanceId, instanceIds))
          .then(rows => rows.filter(r => r.score !== null && r.criteriaId !== null));

        // Buscar critérios
        const criteria = await database.select().from(evaluationCriteria);

        // Agrupar por tipo de avaliador
        const competenciesMap = new Map<number, {
          name: string;
          selfScores: number[];
          managerScores: number[];
          peersScores: number[];
        }>();

        // Inicializar mapa de competências
        criteria.forEach(c => {
          competenciesMap.set(c.id, {
            name: c.name,
            selfScores: [],
            managerScores: [],
            peersScores: [],
          });
        });

        // Classificar respostas por tipo de avaliador
        instances.forEach(instance => {
          const instanceResponses = responses.filter(r => r.instanceId === instance.id);
          
          instanceResponses.forEach(response => {
            const comp = competenciesMap.get(response.criteriaId);
            if (!comp) return;

            // Determinar tipo de avaliador baseado no tipo de avaliação
            const evaluationType = (instance as any).evaluationType || 'self';
            
            // Garantir que score não é null antes de adicionar
            if (response.score === null) return;
            
            if (evaluationType === 'self') {
              comp.selfScores.push(response.score);
            } else if (evaluationType === 'manager') {
              comp.managerScores.push(response.score);
            } else if (evaluationType === 'peer') {
              comp.peersScores.push(response.score);
            }
          });
        });

        // Calcular médias
        const competencies = Array.from(competenciesMap.values()).map(comp => ({
          name: comp.name,
          selfScore: comp.selfScores.length > 0
            ? comp.selfScores.reduce((a, b) => a + b, 0) / comp.selfScores.length
            : 0,
          managerScore: comp.managerScores.length > 0
            ? comp.managerScores.reduce((a, b) => a + b, 0) / comp.managerScores.length
            : 0,
          peersScore: comp.peersScores.length > 0
            ? comp.peersScores.reduce((a, b) => a + b, 0) / comp.peersScores.length
            : 0,
        }));

        // Calcular médias gerais
        const averages = {
          self: competencies.reduce((sum, c) => sum + c.selfScore, 0) / competencies.length || 0,
          manager: competencies.reduce((sum, c) => sum + c.managerScore, 0) / competencies.length || 0,
          peers: competencies.reduce((sum, c) => sum + c.peersScore, 0) / competencies.length || 0,
        };

        return {
          competencies,
          averages,
        };
      }),
  }),

  // ============================================================================
  // PDI (Plano de Desenvolvimento Individual)
  // ============================================================================
  pdi: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        cycleId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const employeeId = input.employeeId || (await db.getEmployeeByUserId(ctx.user!.id))?.id;
        if (!employeeId) {
          return [];
        }
        return await db.getPDIsByEmployee(employeeId, input.cycleId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const pdi = await db.getPDIById(input.id);
        if (!pdi) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "PDI não encontrado",
          });
        }
        return pdi;
      }),

    getItems: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPDIItemsByPlan(input.planId);
      }),

    // Listar PDIs de um colaborador especifico
    listByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const pdis = await database.select()
          .from(pdiPlans)
          .where(eq(pdiPlans.employeeId, input.employeeId))
          .orderBy(desc(pdiPlans.createdAt));

        return pdis.map(pdi => ({
          id: pdi.id,
          employeeId: pdi.employeeId,
          cycleId: pdi.cycleId,
          targetPositionId: pdi.targetPositionId,
          status: pdi.status,
          startDate: pdi.startDate,
          endDate: pdi.endDate,
          overallProgress: pdi.overallProgress,
          createdAt: pdi.createdAt,
          updatedAt: pdi.updatedAt,
        }));
      }),

    // Buscar PDIs da equipe do gestor
    getTeamPDIs: protectedProcedure
      .input(z.object({ managerId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar subordinados diretos
        const teamMembers = await database
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.managerId, input.managerId));

        const teamMemberIds = teamMembers.map(e => e.id);
        if (teamMemberIds.length === 0) return [];

        // Buscar PDIs dos subordinados
        const teamPDIs = await database
          .select()
          .from(pdiPlans)
          .where(sql`${pdiPlans.employeeId} IN (${sql.join(teamMemberIds, sql`, `)})`);

        // Buscar dados dos colaboradores e cargos
        const employeesData = await database
          .select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(sql`${employees.id} IN (${sql.join(teamMemberIds, sql`, `)})`);

        const positionsData = await database.select().from(positions);

        return teamPDIs.map(pdi => ({
          ...pdi,
          employee: employeesData.find(e => e.id === pdi.employeeId),
          targetPosition: positionsData.find((p: any) => p.id === pdi.targetPositionId),
        }));
      }),

    create: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        employeeId: z.number(),
        targetPositionId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        objectives: z.string().optional(),
        actions: z.array(z.object({
          title: z.string(),
          description: z.string(),
          category: z.enum(["70_pratica", "20_mentoria", "10_curso"]),
          duration: z.string().optional(),
          deadline: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Criar PDI
        const [result] = await database.insert(pdiPlans).values({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          targetPositionId: input.targetPositionId || null,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          status: "rascunho",
          overallProgress: 0,
        });

        const pdiId = Number(result.insertId);

        // Adicionar itens (ações) se fornecidos
        if (input.actions && input.actions.length > 0) {
          const { pdiItems } = await import("../drizzle/schema");
          for (const action of input.actions) {
            await database.insert(pdiItems).values({
              planId: pdiId,
              competencyId: 1, // Competência genérica (ajustar conforme necessário)
              title: action.title,
              description: action.description,
              category: action.category,
              duration: action.duration ? parseInt(action.duration) : null,
              deadline: action.deadline ? new Date(action.deadline) : null,
              status: "pendente",
              progress: 0,
            });
          }
        }

        await db.logAudit(
          ctx.user!.id,
          "CREATE",
          "pdiPlans",
          pdiId,
          input,
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        // Verificar badges de PDI ao criar
        if (input.employeeId) {
          const { checkPDIBadges } = await import("./services/badgeService");
          await checkPDIBadges(input.employeeId);
        }

        return { id: pdiId, success: true };
      }),

    addItem: protectedProcedure
      .input(z.object({
        planId: z.number(),
        actionId: z.number().optional(),
        competencyId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["70_pratica", "20_mentoria", "10_curso"]),
        type: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const [result] = await database.insert(pdiItems).values({
          ...input,
          status: "pendente",
          progress: 0,
        });

        const itemId = Number(result.insertId);

        await db.logAudit(
          ctx.user!.id,
          "ADD_ITEM",
          "pdiItems",
          itemId,
          input,
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        return { id: itemId, success: true };
      }),

    getDevelopmentActions: protectedProcedure.query(async () => {
      return await db.getDevelopmentActions();
    }),
  }),

  // ============================================================================
  // MATRIZ 9-BOX
  // ============================================================================
  nineBox: router({
    getByCycle: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getNineBoxByCycle(input.cycleId);
      }),

    // Listar posições da matriz 9-box
    list: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const positions = await database.select()
          .from(nineBoxPositions)
          .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
          .where(eq(nineBoxPositions.cycleId, input.cycleId));

        return positions.map(p => ({
          employeeId: p.nineBoxPositions.employeeId,
          employeeName: p.employees.name,
          positionName: 'Cargo', // TODO: Join com positions table
          departmentName: 'Departamento', // TODO: Join com departments table
          performance: p.nineBoxPositions.performance,
          potential: p.nineBoxPositions.potential,
          calibratedAt: p.nineBoxPositions.calibratedAt,
        }));
      }),

    // Ajustar posição (calibração/RH)
    adjust: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        employeeId: z.number(),
        performance: z.number().min(1).max(3),
        potential: z.number().min(1).max(3),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const employee = await getUserByOpenId(ctx.user.openId);
        if (!employee) throw new Error("Employee not found");

        const box = `${input.performance}_${input.potential}`;

        await database.update(nineBoxPositions)
          .set({
            performance: input.performance,
            potential: input.potential,
            box,
            calibratedBy: employee.id,
            calibratedAt: new Date(),
            notes: input.reason,
          })
          .where(
            and(
              eq(nineBoxPositions.cycleId, input.cycleId),
              eq(nineBoxPositions.employeeId, input.employeeId)
            )
          );

        return { success: true };
      }),

    // Buscar posição Nine Box de um colaborador específico
    getEmployeePosition: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return null;

        const position = await database.select()
          .from(nineBoxPositions)
          .where(eq(nineBoxPositions.employeeId, input.employeeId))
          .orderBy(desc(nineBoxPositions.calibratedAt))
          .limit(1);

        if (position.length === 0) return null;

        const p = position[0];
        return {
          id: p.id,
          employeeId: p.employeeId,
          performance: p.performance,
          potential: p.potential,
          category: p.box,
          calibratedAt: p.calibratedAt,
          notes: p.notes,
        };
      }),

    updatePosition: protectedProcedure
      .input(z.object({
        id: z.number(),
        performance: z.number().min(1).max(3),
        potential: z.number().min(1).max(3),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Buscar posição anterior para comparação
        const [oldPosition] = await database.select()
          .from(nineBoxPositions)
          .where(eq(nineBoxPositions.id, input.id))
          .limit(1);

        const box = `${input.performance}_${input.potential}`;
        
        await database.update(nineBoxPositions)
          .set({
            performance: input.performance,
            potential: input.potential,
            box,
            notes: input.notes,
          })
          .where(eq(nineBoxPositions.id, input.id));

        await db.logAudit(
          ctx.user!.id,
          "UPDATE_POSITION",
          "nineBoxPositions",
          input.id,
          input,
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        // Notificar Admin e RH sobre mudança na Nine Box
        if (oldPosition && (oldPosition.performance !== input.performance || oldPosition.potential !== input.potential)) {
          try {
            const { notifyNineBoxChange } = await import('./adminRhEmailService');
            const [employee] = await database.select()
              .from(employees)
              .where(eq(employees.id, oldPosition.employeeId))
              .limit(1);
            
            if (employee) {
              const performanceLabels = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
              const potentialLabels = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
              
              const oldPos = `${performanceLabels[oldPosition.performance as 1 | 2 | 3]} Desempenho / ${potentialLabels[oldPosition.potential as 1 | 2 | 3]} Potencial`;
              const newPos = `${performanceLabels[input.performance as 1 | 2 | 3]} Desempenho / ${potentialLabels[input.potential as 1 | 2 | 3]} Potencial`;
              
              await notifyNineBoxChange(
                employee.name,
                oldPos,
                newPos
              );
            }
          } catch (error) {
            console.error('[RoutersNineBox] Failed to send email notification:', error);
          }
        }

        return { success: true };
      }),
  }),

  // ============================================================================
  // DASHBOARD E ESTATÍSTICAS
  // ============================================================================
  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        cycleId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const employeeId = input.employeeId || (await db.getEmployeeByUserId(ctx.user!.id))?.id;
        if (!employeeId) {
          // Retornar dados vazios se colaborador não existir
          return {
            activeGoals: 0,
            completedGoals: 0,
            pendingEvaluations: 0,
            activePDIs: 0,
            recentActivities: [],
            cycle: null,
            goalsCount: 0,
            pdisCount: 0,
            evaluationsCount: 0,
          };
        }
        return await db.getDashboardStats(employeeId, input.cycleId);
      }),
  }),

  // ============================================================================
  // CICLOS, DEPARTAMENTOS E CARGOS (Legacy)
  // ============================================================================
  cyclesLegacy: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCycles();
    }),

    getActive: protectedProcedure.query(async () => {
      return await db.getActiveCycle();
    }),
  }),

  departments: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllDepartments();
    }),
  }),

  positions: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPositions();
    }),
  }),

  // ============================================================================
  // COMPETÊNCIAS
  // ============================================================================
  competencies: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCompetencies();
    }),
    
    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeCompetencies(input.employeeId);
      }),
  }),

  // ============================================================================
  // PDI INTELIGENTE COM IA
  // ============================================================================
  pdiAI: router({
    // Gerar recomendações de PDI com IA Gemini
    generateRecommendations: protectedProcedure
      .input(z.object({ 
        employeeId: z.number(),
        competencyGaps: z.array(z.object({
          competencyName: z.string(),
          currentLevel: z.number(),
          requiredLevel: z.number(),
          category: z.string()
        }))
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        const gapsText = input.competencyGaps
          .map(g => `- ${g.competencyName} (${g.category}): Nível atual ${g.currentLevel}, Nível esperado ${g.requiredLevel}, Gap: ${g.requiredLevel - g.currentLevel}`)
          .join("\n");

        const prompt = `Você é um especialista em Recursos Humanos e Desenvolvimento de Pessoas. Analise os gaps de competências abaixo e gere recomendações de ações de desenvolvimento seguindo o modelo 70-20-10:

**Gaps de Competências:**
${gapsText}

**Modelo 70-20-10:**
- 70% Aprendizado na Prática (projetos, desafios, rotacionação de funções)
- 20% Aprendizado Social (mentoria, coaching, feedback de pares)
- 10% Aprendizado Formal (cursos, treinamentos, certificações)

Gere 6-8 ações de desenvolvimento específicas, práticas e mensuráveis, distribuídas proporcionalmente no modelo 70-20-10. Para cada ação, inclua:
- Título claro e objetivo
- Descrição detalhada
- Tipo (pratica, social ou formal)
- Competência que desenvolve
- Prazo estimado em meses`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em RH e desenvolvimento de talentos. Sempre fornece recomendações práticas, específicas e mensuráveis." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pdi_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título da ação" },
                        description: { type: "string", description: "Descrição detalhada" },
                        type: { type: "string", enum: ["pratica", "social", "formal"], description: "Tipo de aprendizado" },
                        competency: { type: "string", description: "Competência que desenvolve" },
                        estimatedMonths: { type: "integer", description: "Prazo estimado em meses" }
                      },
                      required: ["title", "description", "type", "competency", "estimatedMonths"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["actions"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0].message.content;
        const result = typeof content === "string" ? JSON.parse(content) : content;
        
        return (result as { actions: any[] }).actions;
      }),
  }),

  // ============================================================================
  // APROVACAO DE PDI
  // ============================================================================
  pdiApproval: router({
    // Submeter PDI para aprovação
    submit: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(pdiPlans)
          .set({ 
            status: "pendente_aprovacao",
            updatedAt: new Date()
          })
          .where(eq(pdiPlans.id, input.planId));

        // TODO: Enviar notificação por e-mail ao gestor
        return { success: true };
      }),

    // Aprovar PDI (gestor)
    approve: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const employee = await getUserByOpenId(ctx.user.openId);
        if (!employee) throw new Error("Employee not found");

        // Buscar PDI para pegar employeeId
        const pdi = await db.select().from(pdiPlans).where(eq(pdiPlans.id, input.planId)).limit(1);
        
        await db.update(pdiPlans)
          .set({ 
            status: "aprovado",
            approvedBy: employee.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(pdiPlans.id, input.planId));

        // Verificar badges de PDI ao aprovar
        if (pdi[0]?.employeeId) {
          const { checkPDIBadges } = await import("./services/badgeService");
          await checkPDIBadges(pdi[0].employeeId);
        }

        // TODO: Enviar notificação por e-mail ao colaborador
        return { success: true };
      }),

    // Rejeitar PDI (gestor)
    reject: protectedProcedure
      .input(z.object({ planId: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(pdiPlans)
          .set({ 
            status: "rascunho",
            updatedAt: new Date()
          })
          .where(eq(pdiPlans.id, input.planId));

        // TODO: Enviar notificação por e-mail ao colaborador com motivo da rejeição
        return { success: true, reason: input.reason };
      }),

    // Listar PDIs pendentes de aprovação (gestor)
    listPending: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];

        const employee = await getUserByOpenId(ctx.user.openId);
        if (!employee) return [];

        // Buscar PDIs de subordinados pendentes de aprovação
        const result = await db.select()
          .from(pdiPlans)
          .innerJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .where(
            and(
              eq(employees.managerId, employee.id),
              eq(pdiPlans.status, "pendente_aprovacao")
            )
          );

        return result;
      }),
  }),

  // ============================================================================
  // CALIBRAÇÃO DA MATRIZ 9-BOX
  // ============================================================================
  nineBoxCalibration: router({
    // Listar colaboradores para calibração
    list: protectedProcedure
      .input(z.object({ cycleId: z.number(), departmentId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const conditions = [eq(nineBoxPositions.cycleId, input.cycleId)];
        if (input.departmentId) {
          conditions.push(eq(employees.departmentId, input.departmentId));
        }

        const result = await db.select()
          .from(nineBoxPositions)
          .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
          .where(and(...conditions));

        return result;
      }),

    // Ajustar posicionamento na Matriz 9-Box
    adjust: protectedProcedure
      .input(z.object({ 
        positionId: z.number(),
        performance: z.number().min(1).max(3),
        potential: z.number().min(1).max(3),
        justification: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const employee = await getUserByOpenId(ctx.user.openId);
        if (!employee) throw new Error("Employee not found");

        await db.update(nineBoxPositions)
          .set({ 
            performance: input.performance,
            potential: input.potential,
            calibrated: true,
            calibratedBy: employee.id,
            calibratedAt: new Date(),
            notes: input.justification,
            updatedAt: new Date()
          })
          .where(eq(nineBoxPositions.id, input.positionId));

        return { success: true };
      }),

    // Finalizar calibração
    finalize: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Marcar todas as posições do ciclo como calibradas
        await db.update(nineBoxPositions)
          .set({ 
            calibrated: true,
            updatedAt: new Date()
          })
          .where(eq(nineBoxPositions.cycleId, input.cycleId));

        return { success: true };
      }),
  }),

  // ============================================================================
  // EXPORTAÇÃO DE RELATÓRIOS PDF
  // ============================================================================
  reports: router({
    // Exportar relatório de avaliação 360°
    export360: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const evaluation = await db.select()
          .from(performanceEvaluations)
          .innerJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
          .where(eq(performanceEvaluations.id, input.evaluationId))
          .limit(1);

        if (evaluation.length === 0) throw new Error("Evaluation not found");

        return evaluation[0];
      }),

    // Exportar relatório de PDI
    exportPDI: protectedProcedure
      .input(z.object({ pdiId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const pdi = await db.select()
          .from(pdiPlans)
          .innerJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .where(eq(pdiPlans.id, input.pdiId))
          .limit(1);

        if (pdi.length === 0) throw new Error("PDI not found");

        // Buscar itens do PDI
        const items = await db.select()
          .from(pdiItems)
          .where(eq(pdiItems.planId, input.pdiId));

        return { pdi: pdi[0], items };
      }),

    // Exportar relatório de Matriz 9-Box
    export9Box: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const positions = await db.select()
          .from(nineBoxPositions)
          .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
          .where(eq(nineBoxPositions.cycleId, input.cycleId));

        return positions;
      }),
  }),

  // ============================================================================
  // HISTÓRICO
  // ============================================================================
  history: router({
    // Histórico de avaliações 360°
    evaluations: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const evaluations = await database
          .select()
          .from(performanceEvaluations)
          .where(eq(performanceEvaluations.employeeId, input.employeeId))
          .orderBy(desc(performanceEvaluations.createdAt));

        return evaluations;
      }),

    // Histórico de PDIs
    pdis: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const pdis = await database
          .select()
          .from(pdiPlans)
          .where(eq(pdiPlans.employeeId, input.employeeId))
          .orderBy(desc(pdiPlans.createdAt));

        return pdis;
      }),

    // Histórico de Matriz 9-Box
    nineBox: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const positions = await database
          .select()
          .from(nineBoxPositions)
          .where(eq(nineBoxPositions.employeeId, input.employeeId))
          .orderBy(desc(nineBoxPositions.createdAt));

        return positions;
      }),

    // Evolução de competências ao longo do tempo
    competenciesEvolution: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeCompetencies(input.employeeId);
      }),
  }),

  // Router de Planos de Sucessão
  successionPlans: router({
    list: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      // Buscar planos de sucessão com informações relacionadas
      const plans = await database.select()
        .from(successionPlans)
        .orderBy(desc(successionPlans.createdAt));

      return plans;
    }),
  }),

  // Router de Testes Psicométricos
  psychometric: router({
    // Buscar perguntas de um teste específico (PÚBLICO - sem necessidade de login)
    getQuestionsPublic: publicProcedure
      .input(z.object({ testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]) }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const questions = await database.select()
          .from(testQuestions)
          .where(eq(testQuestions.testType, input.testType))
          .orderBy(testQuestions.questionNumber);

        return questions;
      }),

    // Buscar perguntas de um teste específico (PROTEGIDO - requer login)
    getQuestions: protectedProcedure
      .input(z.object({ testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]) }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const questions = await database.select()
          .from(testQuestions)
          .where(eq(testQuestions.testType, input.testType))
          .orderBy(testQuestions.questionNumber);

        return questions;
      }),

    // Submeter respostas de um teste (PÚBLICO - sem necessidade de login)
    submitTestPublic: publicProcedure
      .input(z.object({
        testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]),
        email: z.string().email(),
        responses: z.array(z.object({
          questionId: z.number(),
          score: z.number().min(1).max(5),
        })),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Buscar colaborador pelo email
        const employee = await database.select()
          .from(employees)
          .where(eq(employees.email, input.email))
          .limit(1);

        if (employee.length === 0) {
          throw new Error("Email não encontrado. Por favor, verifique se o email está correto.");
        }

        // Calcular perfil baseado nas respostas
        const profile = await calculateProfile(input.testType, input.responses, database);

        // Preparar valores para inserção
        const testValues: any = {
          employeeId: employee[0].id,
          testType: input.testType,
          completedAt: new Date(),
          responses: JSON.stringify(input.responses),
        };

        // Adicionar scores específicos baseado no tipo de teste
        if (input.testType === "disc") {
          testValues.discDominance = Math.round((profile.D || 0) * 20);
          testValues.discInfluence = Math.round((profile.I || 0) * 20);
          testValues.discSteadiness = Math.round((profile.S || 0) * 20);
          testValues.discCompliance = Math.round((profile.C || 0) * 20);
          const maxDimension = Object.entries(profile).reduce((a, b) => a[1] > b[1] ? a : b)[0];
          testValues.discProfile = maxDimension;
        } else if (input.testType === "bigfive") {
          testValues.bigFiveOpenness = Math.round((profile.O || 0) * 20);
          testValues.bigFiveConscientiousness = Math.round((profile.C || 0) * 20);
          testValues.bigFiveExtraversion = Math.round((profile.E || 0) * 20);
          testValues.bigFiveAgreeableness = Math.round((profile.A || 0) * 20);
          testValues.bigFiveNeuroticism = Math.round((profile.N || 0) * 20);
        }

        // Salvar teste no banco
        await database.insert(psychometricTests).values(testValues);

        // Enviar notificação por email para gestor e RH
        try {
          const testTypeLabels: Record<string, string> = {
            disc: "DISC - Avaliação Comportamental",
            bigfive: "Big Five (OCEAN) - Personalidade",
            mbti: "MBTI - Tipo de Personalidade",
            ie: "Inteligência Emocional",
            vark: "VARK - Estilos de Aprendizagem",
            leadership: "Estilos de Liderança",
            careeranchors: "Âncoras de Carreira",
          };

          const testLabel = testTypeLabels[input.testType] || input.testType.toUpperCase();
          const profileSummary = input.testType === 'disc'
            ? `Perfil: ${profile.profile || 'N/A'} (D:${profile.D || 0}, I:${profile.I || 0}, S:${profile.S || 0}, C:${profile.C || 0})`
            : input.testType === 'bigfive'
            ? `Perfis: O:${Math.round((profile.O || 0) * 20)}, C:${Math.round((profile.C || 0) * 20)}, E:${Math.round((profile.E || 0) * 20)}, A:${Math.round((profile.A || 0) * 20)}, N:${Math.round((profile.N || 0) * 20)}`
            : `Perfil: ${profile.profile || 'Concluído'}`;

          // Buscar gestor do colaborador
          let managerEmail = null;
          if (employee[0].managerId) {
            const manager = await database.select()
              .from(employees)
              .where(eq(employees.id, employee[0].managerId))
              .limit(1);
            
            if (manager.length > 0 && manager[0].email) {
              managerEmail = manager[0].email;
            }
          }

          // Buscar email do owner/admin (do ENV)
          const ownerEmail = process.env.OWNER_EMAIL || null;

          // Lista de destinatários
          const recipients = [managerEmail, ownerEmail].filter(Boolean) as string[];

          if (recipients.length > 0) {
            await sendEmail({
              to: recipients.join(', '),
              subject: `✅ Teste Psicométrico Concluído - ${employee[0].name}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
                    .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0;">✅ Teste Concluído!</h1>
                    </div>
                    <div class="content">
                      <p>Olá,</p>
                      <p>O colaborador <strong>${employee[0].name}</strong> concluiu um teste psicométrico.</p>
                      
                      <div class="info-box">
                        <h3 style="margin-top: 0; color: #8b5cf6;">📊 Detalhes do Teste</h3>
                        <p><strong>Teste:</strong> ${testLabel}</p>
                        <p><strong>Colaborador:</strong> ${employee[0].name}</p>
                        <p><strong>Email:</strong> ${employee[0].email}</p>
                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p><strong>Resultado:</strong> ${profileSummary}</p>
                      </div>

                      <p>Acesse o sistema para visualizar o relatório completo e insights detalhados.</p>
                      
                      <a href="${process.env.VITE_APP_URL || 'https://avduisa-sys-vd5bj8to.manus.space'}/testes-psicometricos/resultados" class="button">
                        Ver Resultados Completos
                      </a>

                      <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AVD UISA</strong></p>
                    </div>
                    <div class="footer">
                      <p>Este é um email automático do Sistema AVD UISA</p>
                      <p>${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
          }
        } catch (error) {
          console.error('[Psychometric] Erro ao enviar email de notificação:', error);
          // Não falhar a operação principal se email falhar
        }

        return { success: true, profile, employeeName: employee[0].name };
      }),

    // Submeter respostas de um teste (PROTEGIDO - requer login)
    submitTest: protectedProcedure
      .input(z.object({
        testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]),
        responses: z.array(z.object({
          questionId: z.number(),
          score: z.number().min(1).max(5),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Buscar colaborador do usuário
        const employee = await database.select()
          .from(employees)
          .where(eq(employees.userId, ctx.user.id))
          .limit(1);

        if (employee.length === 0) {
          throw new Error("Colaborador não encontrado");
        }

        // Calcular perfil baseado nas respostas
        const profile = await calculateProfile(input.testType, input.responses, database);

        // Preparar valores para inserção
        const testValues: any = {
          employeeId: employee[0].id,
          testType: input.testType,
          completedAt: new Date(),
          responses: JSON.stringify(input.responses),
        };

        // Adicionar scores específicos baseado no tipo de teste
        if (input.testType === "disc") {
          testValues.discDominance = Math.round((profile.D || 0) * 20); // Converter 1-5 para 0-100
          testValues.discInfluence = Math.round((profile.I || 0) * 20);
          testValues.discSteadiness = Math.round((profile.S || 0) * 20);
          testValues.discCompliance = Math.round((profile.C || 0) * 20);
          // Determinar perfil dominante
          const maxDimension = Object.entries(profile).reduce((a, b) => a[1] > b[1] ? a : b)[0];
          testValues.discProfile = maxDimension;
        } else if (input.testType === "bigfive") {
          testValues.bigFiveOpenness = Math.round((profile.O || 0) * 20);
          testValues.bigFiveConscientiousness = Math.round((profile.C || 0) * 20);
          testValues.bigFiveExtraversion = Math.round((profile.E || 0) * 20);
          testValues.bigFiveAgreeableness = Math.round((profile.A || 0) * 20);
          testValues.bigFiveNeuroticism = Math.round((profile.N || 0) * 20);
        }

        // Salvar teste no banco
        await database.insert(psychometricTests).values(testValues);

        // Criar notificação in-app e email para gestores/RH
        try {
          const testTypeLabels: Record<string, string> = {
            disc: "DISC - Avaliação Comportamental",
            bigfive: "Big Five (OCEAN) - Personalidade",
            mbti: "MBTI - Tipo de Personalidade",
            ie: "Inteligência Emocional",
            vark: "VARK - Estilos de Aprendizagem",
            leadership: "Estilos de Liderança",
            careeranchors: "Âncoras de Carreira",
          };

          const testLabel = testTypeLabels[input.testType] || input.testType.toUpperCase();
          const profileSummary = input.testType === 'disc'
            ? `Perfil: ${profile.profile || 'N/A'} (D:${profile.D || 0}, I:${profile.I || 0}, S:${profile.S || 0}, C:${profile.C || 0})`
            : input.testType === 'bigfive'
            ? `Perfis: O:${Math.round((profile.O || 0) * 20)}, C:${Math.round((profile.C || 0) * 20)}, E:${Math.round((profile.E || 0) * 20)}, A:${Math.round((profile.A || 0) * 20)}, N:${Math.round((profile.N || 0) * 20)}`
            : `Perfil: ${profile.profile || 'Concluído'}`;

          // Buscar gestor do colaborador
          let managerEmail = null;
          if (employee[0].managerId) {
            const manager = await database.select()
              .from(employees)
              .where(eq(employees.id, employee[0].managerId))
              .limit(1);

            if (manager.length > 0) {
              // Notificação in-app
              if (manager[0].userId) {
                await createNotification({
                  userId: manager[0].userId,
                  type: "test_completed",
                  title: "Teste Psicométrico Concluído",
                  message: `${employee[0].name} completou o teste ${testLabel}`,
                  link: `/testes-psicometricos/resultados`,
                });
              }
              
              // Email
              if (manager[0].email) {
                managerEmail = manager[0].email;
              }
            }
          }

          // Buscar email do owner/admin (do ENV)
          const ownerEmail = process.env.OWNER_EMAIL || null;

          // Lista de destinatários
          const recipients = [managerEmail, ownerEmail].filter(Boolean) as string[];

          if (recipients.length > 0) {
            await sendEmail({
              to: recipients.join(', '),
              subject: `✅ Teste Psicométrico Concluído - ${employee[0].name}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
                    .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0;">✅ Teste Concluído!</h1>
                    </div>
                    <div class="content">
                      <p>Olá,</p>
                      <p>O colaborador <strong>${employee[0].name}</strong> concluiu um teste psicométrico.</p>
                      
                      <div class="info-box">
                        <h3 style="margin-top: 0; color: #8b5cf6;">📊 Detalhes do Teste</h3>
                        <p><strong>Teste:</strong> ${testLabel}</p>
                        <p><strong>Colaborador:</strong> ${employee[0].name}</p>
                        <p><strong>Email:</strong> ${employee[0].email || 'N/A'}</p>
                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p><strong>Resultado:</strong> ${profileSummary}</p>
                      </div>

                      <p>Acesse o sistema para visualizar o relatório completo e insights detalhados.</p>
                      
                      <a href="${process.env.VITE_APP_URL || 'https://avduisa-sys-vd5bj8to.manus.space'}/testes-psicometricos/resultados" class="button">
                        Ver Resultados Completos
                      </a>

                      <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AVD UISA</strong></p>
                    </div>
                    <div class="footer">
                      <p>Este é um email automático do Sistema AVD UISA</p>
                      <p>${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
          }
        } catch (error) {
          console.error('[Psychometric] Erro ao criar notificação/email:', error);
          // Não falhar a operação principal se notificação falhar
        }

        return { success: true, profile };
      }),

    // Buscar TODOS os testes (apenas RH/Admin)
    getAllTests: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];

      // Verificar se é RH/Admin
      const employee = await database.select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      // TODO: Verificar role quando campo estiver disponível no schema de employees
      // if (employee.length === 0 || (employee[0].role !== 'admin' && employee[0].role !== 'rh')) {
      //   throw new TRPCError({
      //     code: "FORBIDDEN",
      //     message: "Apenas RH e Administradores podem visualizar todos os testes",
      //   });
      // }

      // Buscar todos os testes com informações do colaborador
      const tests = await database.select({
        id: psychometricTests.id,
        employeeId: psychometricTests.employeeId,
        employeeName: employees.name,
        employeeDepartmentId: employees.departmentId,
        employeeDepartmentName: departments.name,
        testType: psychometricTests.testType,
        discProfile: psychometricTests.discProfile,
        discDominance: psychometricTests.discDominance,
        discInfluence: psychometricTests.discInfluence,
        discSteadiness: psychometricTests.discSteadiness,
        discCompliance: psychometricTests.discCompliance,
        bigFiveOpenness: psychometricTests.bigFiveOpenness,
        bigFiveConscientiousness: psychometricTests.bigFiveConscientiousness,
        bigFiveExtraversion: psychometricTests.bigFiveExtraversion,
        bigFiveAgreeableness: psychometricTests.bigFiveAgreeableness,
        bigFiveNeuroticism: psychometricTests.bigFiveNeuroticism,
        completedAt: psychometricTests.completedAt,
        createdAt: psychometricTests.createdAt,
      })
        .from(psychometricTests)
        .leftJoin(employees, eq(psychometricTests.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(sql`${psychometricTests.completedAt} IS NOT NULL`)
        .orderBy(desc(psychometricTests.completedAt));

      return tests;
    }),

    // Buscar testes de um colaborador
    getTests: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];

      // Buscar colaborador do usuário
      const employee = await database.select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (employee.length === 0) return [];

      const tests = await database.select()
        .from(psychometricTests)
        .where(eq(psychometricTests.employeeId, employee[0].id))
        .orderBy(desc(psychometricTests.completedAt));

      return tests.map(test => {
        // Reconstruir perfil a partir dos campos individuais
        let profile: any = null;
        if (test.testType === "disc") {
          profile = {
            D: test.discDominance ? test.discDominance / 20 : 0,
            I: test.discInfluence ? test.discInfluence / 20 : 0,
            S: test.discSteadiness ? test.discSteadiness / 20 : 0,
            C: test.discCompliance ? test.discCompliance / 20 : 0,
            dominantProfile: test.discProfile,
          };
        } else if (test.testType === "bigfive") {
          profile = {
            O: test.bigFiveOpenness ? test.bigFiveOpenness / 20 : 0,
            C: test.bigFiveConscientiousness ? test.bigFiveConscientiousness / 20 : 0,
            E: test.bigFiveExtraversion ? test.bigFiveExtraversion / 20 : 0,
            A: test.bigFiveAgreeableness ? test.bigFiveAgreeableness / 20 : 0,
            N: test.bigFiveNeuroticism ? test.bigFiveNeuroticism / 20 : 0,
          };
        } else if (test.testType === "mbti" || test.testType === "ie" || test.testType === "vark") {
          // Para novos testes, retornar profile vazio por enquanto
          // TODO: Implementar cálculo de perfil para MBTI, IE e VARK
          profile = {};
        }
        return { ...test, profile };
      });
    }),

    // Enviar convite para teste psicométrico por email
    sendTestInvite: protectedProcedure
      .input(z.object({
        emails: z.array(z.string().min(5).refine((email) => {
          // Validação mais permissiva de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        }, { message: "Email inválido" })),
        testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado: apenas administradores");
        }

        const { createTestInviteEmail, testInfo } = await import("./utils/testInviteTemplate");
        const { emailService } = await import("./utils/emailService");
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const results = [];
        const testData = testInfo[input.testType];

        for (const email of input.emails) {
          // Buscar colaborador pelo email
          const employee = await database.select()
            .from(employees)
            .where(eq(employees.email, email))
            .limit(1);

          if (employee.length === 0) {
            results.push({ email, success: false, message: "Colaborador não encontrado" });
            continue;
          }

          // Usar URL base do ambiente (funciona tanto em dev quanto em produção)
          const baseUrl = process.env.VITE_APP_URL || ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get('host')}`;
          
          // Mapeamento de tipos de teste (inglês → português) para URLs corretas
          const testTypeMap: Record<string, string> = {
            'disc': 'disc',
            'bigfive': 'bigfive',
            'mbti': 'mbti',
            'ie': 'ie',
            'vark': 'vark',
            'leadership': 'lideranca',
            'career-anchors': 'ancoras-carreira',
          };
          
          const testSlug = testTypeMap[input.testType] || input.testType;
          const testUrl = `${baseUrl}/teste-${testSlug}`;
          
          const emailTemplate = createTestInviteEmail({
            employeeName: employee[0].name,
            testType: testData.type,
            testName: testData.name,
            testDescription: testData.description,
            estimatedTime: testData.estimatedTime,
            testUrl,
          });

          // Enviar email usando o emailService
          const sent = await emailService.sendCustomEmail(
            email,
            emailTemplate.subject,
            emailTemplate.html
          );

          if (!sent) {
            // Verificar se SMTP está configurado
            const smtpConfig = await database.select()
              .from(systemSettings)
              .where(eq(systemSettings.settingKey, "smtp_config"))
              .limit(1);
            
            const errorMessage = smtpConfig.length === 0 
              ? "SMTP não configurado. Acesse /admin/smtp para configurar"
              : "Erro ao enviar email. Verifique as configurações SMTP";
            
            results.push({
              email,
              success: false,
              message: errorMessage,
            });
          } else {
            results.push({
              email,
              success: true,
              message: "Convite enviado com sucesso",
            });
          }
        }

        return { results };
      }),

    // Buscar resultados agregados por equipe/departamento/cargo
    getAggregatedResults: protectedProcedure
      .input(z.object({
        groupBy: z.enum(["department", "position", "team"]),
        testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar todos os testes
        const testsQuery = database.select({
          test: psychometricTests,
          employee: employees,
          department: departments,
          position: positions,
        })
          .from(psychometricTests)
          .leftJoin(employees, eq(psychometricTests.employeeId, employees.id))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .leftJoin(positions, eq(employees.positionId, positions.id));

        const tests = input.testType 
          ? await testsQuery.where(eq(psychometricTests.testType, input.testType))
          : await testsQuery;

        // Agrupar por critério
        const grouped: Record<string, any[]> = {};
        for (const item of tests) {
          let groupKey = "";
          let groupName = "";

          if (input.groupBy === "department" && item.department) {
            groupKey = item.department.id.toString();
            groupName = item.department.name;
          } else if (input.groupBy === "position" && item.position) {
            groupKey = item.position.id.toString();
            groupName = item.position.title;
          } else if (input.groupBy === "team" && item.employee?.managerId) {
            groupKey = item.employee.managerId.toString();
            groupName = `Equipe ${item.employee.managerId}`;
          } else {
            continue;
          }

          if (!grouped[groupKey]) {
            grouped[groupKey] = [];
          }
          grouped[groupKey].push({ ...item.test, groupName });
        }

        // Calcular médias por grupo
        const results = [];
        for (const [groupKey, groupTests] of Object.entries(grouped)) {
          const groupName = groupTests[0]?.groupName || "Sem nome";
          const testsByType: Record<string, any[]> = {};

          // Agrupar por tipo de teste
          for (const test of groupTests) {
            if (!testsByType[test.testType]) {
              testsByType[test.testType] = [];
            }
            testsByType[test.testType].push(test);
          }

          // Calcular médias por tipo
          const averages: Record<string, any> = {};
          for (const [testType, testList] of Object.entries(testsByType)) {
            if (testType === "disc") {
              averages.disc = {
                D: testList.reduce((sum, t) => sum + (t.discD || 0), 0) / testList.length,
                I: testList.reduce((sum, t) => sum + (t.discI || 0), 0) / testList.length,
                S: testList.reduce((sum, t) => sum + (t.discS || 0), 0) / testList.length,
                C: testList.reduce((sum, t) => sum + (t.discC || 0), 0) / testList.length,
              };
            } else if (testType === "bigfive") {
              averages.bigfive = {
                O: testList.reduce((sum, t) => sum + (t.bigFiveOpenness || 0), 0) / testList.length / 20,
                C: testList.reduce((sum, t) => sum + (t.bigFiveConscientiousness || 0), 0) / testList.length / 20,
                E: testList.reduce((sum, t) => sum + (t.bigFiveExtraversion || 0), 0) / testList.length / 20,
                A: testList.reduce((sum, t) => sum + (t.bigFiveAgreeableness || 0), 0) / testList.length / 20,
                N: testList.reduce((sum, t) => sum + (t.bigFiveNeuroticism || 0), 0) / testList.length / 20,
              };
            }
            // TODO: Adicionar cálculos para outros tipos de teste
          }

          results.push({
            groupKey,
            groupName,
            count: groupTests.length,
            averages,
          });
        }

        return results;
      }),

    // Gerar recomendações de PDI baseadas em testes psicométricos
    getPDIRecommendations: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar todos os testes do funcionário
        const tests = await database.select()
          .from(psychometricTests)
          .where(eq(psychometricTests.employeeId, input.employeeId))
          .orderBy(desc(psychometricTests.completedAt));

        if (tests.length === 0) {
          return [];
        }

        // Importar funções de recomendação
        const { generateConsolidatedRecommendations } = await import("./utils/pdiRecommendations");

        // Preparar perfis dos testes mais recentes
        const latestTests: any = {};
        
        for (const test of tests) {
          if (!latestTests[test.testType]) {
            if (test.testType === "disc") {
              latestTests.disc = {
                D: test.discDominance || 0,
                I: test.discInfluence || 0,
                S: test.discSteadiness || 0,
                C: test.discCompliance || 0,
              };
            } else if (test.testType === "bigfive") {
              latestTests.bigfive = {
                O: (test.bigFiveOpenness || 0) / 20,
                C: (test.bigFiveConscientiousness || 0) / 20,
                E: (test.bigFiveExtraversion || 0) / 20,
                A: (test.bigFiveAgreeableness || 0) / 20,
                N: (test.bigFiveNeuroticism || 0) / 20,
              };
            }
            // TODO: Adicionar outros tipos de teste
          }
        }

        // Gerar recomendações consolidadas
        const recommendations = generateConsolidatedRecommendations(latestTests);

        return recommendations;
      }),
  }),


  // Router de Calibração
  calibration: router({
    // Listar avaliações para calibração
    getEvaluations: protectedProcedure
      .input(z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        // Buscar avaliações com nome do colaborador
        const evals = await database.select({
          id: performanceEvaluations.id,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          cycleId: performanceEvaluations.cycleId,
          type: performanceEvaluations.type,
          status: performanceEvaluations.status,
          finalScore: performanceEvaluations.finalScore,
          selfEvaluationCompleted: performanceEvaluations.selfEvaluationCompleted,
          managerEvaluationCompleted: performanceEvaluations.managerEvaluationCompleted,
          peersEvaluationCompleted: performanceEvaluations.peersEvaluationCompleted,
          subordinatesEvaluationCompleted: performanceEvaluations.subordinatesEvaluationCompleted,
          createdAt: performanceEvaluations.createdAt,
        })
          .from(performanceEvaluations)
          .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
          .orderBy(desc(performanceEvaluations.createdAt))
          .limit(100);

        return evals;
      }),

    // Criar sessão de calibração
    createSession: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        departmentId: z.number().optional(),
        scheduledDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const [session] = await database.insert(calibrationSessions).values({
          cycleId: input.cycleId,
          departmentId: input.departmentId,
          facilitatorId: ctx.user.id,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        });

        return { success: true, sessionId: session.insertId };
      }),

    // Salvar calibração
    saveCalibration: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        evaluationId: z.number(),
        originalScore: z.number(),
        calibratedScore: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Salvar review de calibração
        await database.insert(calibrationReviews).values({
          sessionId: input.sessionId,
          evaluationId: input.evaluationId,
          originalScore: input.originalScore,
          calibratedScore: input.calibratedScore,
          reason: input.reason,
          reviewedBy: ctx.user.id,
        });

        // Atualizar nota final da avaliação
        await database.update(performanceEvaluations)
          .set({ finalScore: input.calibratedScore })
          .where(eq(performanceEvaluations.id, input.evaluationId));

        return { success: true };
      }),

    // Buscar histórico de calibrações
    getHistory: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const history = await database.select()
          .from(calibrationReviews)
          .where(eq(calibrationReviews.evaluationId, input.evaluationId))
          .orderBy(desc(calibrationReviews.createdAt));

        return history;
      }),
  }),

  // Router de Audit Trail (apenas admin)
  auditTrail: router({
    // Buscar logs de auditoria com filtros
    getLogs: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        entity: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        // Apenas admin pode acessar
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }

        const database = await getDb();
        if (!database) return { logs: [], total: 0 };

        // Construir condições de filtro
        const conditions: any[] = [];
        if (input.userId) conditions.push(eq(auditLogs.userId, input.userId));
        if (input.action) conditions.push(eq(auditLogs.action, input.action));
        if (input.entity) conditions.push(eq(auditLogs.entity, input.entity));
        
        // Buscar logs
        const logs = await database.select()
          .from(auditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Contar total
        const totalResult = await database.select()
          .from(auditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        return { logs, total: totalResult.length };
      }),

    // Buscar detalhes de um log específico
    getLogDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado");
        }

        const database = await getDb();
        if (!database) return null;

        const log = await database.select()
          .from(auditLogs)
          .where(eq(auditLogs.id, input.id))
          .limit(1);

        return log.length > 0 ? log[0] : null;
      }),
  }),

  // Router de Analytics (apenas admin)
  analytics: analyticsRouter,

  // Router de Analytics Avançado com Tendências Históricas
  advancedAnalytics: advancedAnalyticsRouter,

  // Router de Feedback Contínuo
  feedback: feedbackRouter,

  // Router de Badges Gamificado
  badges: badgesRouter,

  // Router de Notificações Push
  pushNotifications: pushNotificationsRouter,

  // ============================================================================
  // NOVOS ROUTERS - ITENS 1-3
  // ============================================================================

  // Router de Gestão de Funcionários (Item 1)
  // employees: employeesRouter, // REMOVIDO - já existe inline acima

  // Router de Avaliações de Desempenho (Item 2)
  // evaluations: evaluationsRouter, // REMOVIDO - já existe inline acima

  // Router de Relatórios de Desempenho (Item 3)
  performanceReports: performanceReportsRouter,

  // Router de Templates de Avaliação Customizados
  evaluationTemplates: evaluationTemplatesRouter,

  // Router de Calibração Diretoria Nine Box
  calibrationDirector: calibrationDirectorRouter,

  // Router de Reuniões de Calibração em Tempo Real
  calibrationMeeting: calibrationMeetingRouter,

  // Router de Relatórios de Progresso de Ciclos
  cycleReports: reportsRouter,

  // Router de Relatórios Agendados (apenas admin)
  scheduledReports: scheduledReportsRouter,

  // Router de Dashboard Executivo (apenas admin)
  executive: executiveRouter,

  // Router de Mapa de Sucessão
  succession: successionRouter,

  // Router de Metas em Cascata Hierárquico
  goalsCascade: goalsCascadeRouter,

  // Router de PDI Inteligente
  pdiIntelligent: pdiIntelligentRouter,

  // Router de Nine Box Comparativo
  nineBoxComparative: nineBoxRouter,
  
  // Router de Avaliação 360° com Fluxo Sequencial
  evaluation360: evaluation360Router,
  
  // Router de Avaliação 360° Enhanced (Wizard de 4 etapas)
  evaluation360Enhanced: evaluation360EnhancedRouter,
  
  // Router de Visão Geral de Ciclos 360°
  cycles360Overview: cycles360OverviewRouter,
  
  // Router de Gestão de Ciclos de Avaliação (360°)
  evaluationCycles: evaluationCyclesRouter,
  jobDescription: jobDescriptionRouter,
  cycles: cyclesRouter, // Alias para compatibilidade
  
  // Router de   // Templates de Ciclos 360°
  cycles360Templates: cycles360TemplatesRouter,

  // Rastreamento Automático de Tempo
  timeTracking: timeTrackingRouter,
  
  // Atividades Manuais e Sugestões Inteligentes
  activities: activitiesRouter,
  
  // Estatísticas de Aprovações
  approvalsStats: approvalsStatsRouter,
  
  // Regras de Aprovação
  approvalRules: router({
    list: protectedProcedure
      .input(z.object({
        ruleType: z.enum(["departamento", "centro_custo", "individual", "todos"]).optional(),
        approvalContext: z.enum(["metas", "avaliacoes", "pdi", "descricao_cargo", "ciclo_360", "bonus", "promocao", "todos"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        const conditions = [];
        if (input.ruleType && input.ruleType !== "todos") {
          conditions.push(eq(approvalRules.ruleType, input.ruleType));
        }
        if (input.approvalContext && input.approvalContext !== "todos") {
          conditions.push(eq(approvalRules.approvalContext, input.approvalContext));
        }
        if (input.isActive !== undefined) {
          conditions.push(eq(approvalRules.isActive, input.isActive));
        }
        
        const rules = await database.select({
          rule: approvalRules,
          approver: employees,
          department: departments,
        })
        .from(approvalRules)
        .leftJoin(employees, eq(approvalRules.approverId, employees.id))
        .leftJoin(departments, eq(approvalRules.departmentId, departments.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(approvalRules.createdAt));
        
        return rules.map(r => ({
          ...r.rule,
          approverName: r.approver?.name || "Desconhecido",
          departmentName: r.department?.name,
        }));
      }),
      
    create: protectedProcedure
      .input(z.object({
        ruleType: z.enum(["departamento", "centro_custo", "individual"]),
        approvalContext: z.enum(["metas", "avaliacoes", "pdi", "descricao_cargo", "ciclo_360", "bonus", "promocao", "todos"]),
        departmentId: z.number().optional(),
        costCenterId: z.number().optional(),
        employeeId: z.number().optional(),
        approverId: z.number(),
        approverLevel: z.number().default(1),
        requiresSequentialApproval: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const currentEmployee = await database.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);
        if (!currentEmployee[0]) throw new Error("Funcionário não encontrado");
        
        const newRule = {
          ruleType: input.ruleType,
          approvalContext: input.approvalContext,
          departmentId: input.departmentId,
          costCenterId: input.costCenterId,
          employeeId: input.employeeId,
          approverId: input.approverId,
          approverLevel: input.approverLevel,
          requiresSequentialApproval: input.requiresSequentialApproval,
          isActive: true,
          createdBy: currentEmployee[0].id,
        };
              const result = await database.insert(approvalRules).values(newRule as any);
        const ruleId = Number(result[0].insertId);
        
        // Registrar histórico de criação
        await database.insert(approvalRuleHistory).values({
          ruleId,
          action: "criado",
          newData: JSON.stringify(newRule),
          changedBy: currentEmployee[0].id,
        } as any);
        
        // Enviar email para o aprovador
        try {
          const approver = await database.select().from(employees).where(eq(employees.id, input.approverId)).limit(1);
          if (approver[0] && approver[0].email) {
            const { ruleCreatedTemplate } = await import('./emailTemplates/approvalRuleTemplates');
            
            // Buscar nome da vinculação
            let departmentName, costCenterName, employeeName;
            if (input.departmentId) {
              const dept = await database.select().from(departments).where(eq(departments.id, input.departmentId)).limit(1);
              departmentName = dept[0]?.name;
            }
            if (input.costCenterId) {
              const cc = await database.select().from(costCenters).where(eq(costCenters.id, input.costCenterId)).limit(1);
              costCenterName = cc[0] ? `${cc[0].code} - ${cc[0].name}` : undefined;
            }
            if (input.employeeId) {
              const emp = await database.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
              employeeName = emp[0]?.name;
            }
            
            const template = ruleCreatedTemplate({
              approverName: approver[0].name,
              ruleType: input.ruleType,
              approvalContext: input.approvalContext,
              departmentName,
              costCenterName,
              employeeName,
              approverLevel: input.approverLevel,
              createdByName: currentEmployee[0].name,
            });
            
            await sendEmail({
              to: approver[0].email,
              subject: template.subject,
              html: template.html,
            });
          }
        } catch (emailError) {
          console.error('[approvalRules.create] Erro ao enviar email:', emailError);
          // Não falhar a operação se o email falhar
        }
        
        return { success: true, id: ruleId };
      }),
      
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        ruleType: z.enum(["departamento", "centro_custo", "individual"]).optional(),
        approvalContext: z.enum(["metas", "avaliacoes", "pdi", "descricao_cargo", "ciclo_360", "bonus", "promocao", "todos"]).optional(),
        departmentId: z.number().optional(),
        costCenterId: z.number().optional(),
        employeeId: z.number().optional(),
        approverId: z.number().optional(),
        approverLevel: z.number().optional(),
        requiresSequentialApproval: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const currentEmployee = await database.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);
        if (!currentEmployee[0]) throw new Error("Funcionário não encontrado");
        
        // Buscar dados anteriores
        const previousRule = await database.select().from(approvalRules).where(eq(approvalRules.id, input.id)).limit(1);
        if (!previousRule[0]) throw new Error("Regra não encontrada");
        
        const { id, ...updateData } = input;
        
        // Atualizar regra
        await database.update(approvalRules)
          .set(updateData as any)
          .where(eq(approvalRules.id, input.id));
        
        // Registrar histórico de atualização
        await database.insert(approvalRuleHistory).values({
          ruleId: input.id,
          action: "atualizado",
          previousData: JSON.stringify(previousRule[0]),
          newData: JSON.stringify({ ...previousRule[0], ...updateData }),
          changedBy: currentEmployee[0].id,
        } as any);
        
        // Enviar email para o aprovador
        try {
          const approver = await database.select().from(employees).where(eq(employees.id, input.approverId)).limit(1);
          if (approver[0] && approver[0].email) {
            const { ruleUpdatedTemplate } = await import('./emailTemplates/approvalRuleTemplates');
            
            // Buscar nome da vinculação
            let departmentName, costCenterName, employeeName;
            if (input.departmentId) {
              const dept = await database.select().from(departments).where(eq(departments.id, input.departmentId)).limit(1);
              departmentName = dept[0]?.name;
            }
            if (input.costCenterId) {
              const cc = await database.select().from(costCenters).where(eq(costCenters.id, input.costCenterId)).limit(1);
              costCenterName = cc[0] ? `${cc[0].code} - ${cc[0].name}` : undefined;
            }
            if (input.employeeId) {
              const emp = await database.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
              employeeName = emp[0]?.name;
            }
            
            const template = ruleUpdatedTemplate({
              approverName: approver[0].name,
              ruleType: input.ruleType || 'todos',
              approvalContext: input.approvalContext || 'todos',
              departmentName: departmentName || undefined,
              costCenterName: costCenterName || undefined,
              employeeName: employeeName || undefined,
              approverLevel: input.approverLevel || 1,
              createdByName: currentEmployee[0].name,
            });
            
            await sendEmail({
              to: approver[0].email,
              subject: template.subject,
              html: template.html,
            });
          }
        } catch (emailError) {
          console.error('[approvalRules.update] Erro ao enviar email:', emailError);
          // Não falhar a operação se o email falhar
        }
        
        return { success: true };
      }),
      
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const currentEmployee = await database.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);
        if (!currentEmployee[0]) throw new Error("Funcionário não encontrado");
        
        // Buscar dados antes de excluir
        const ruleToDelete = await database.select().from(approvalRules).where(eq(approvalRules.id, input.id)).limit(1);
        if (!ruleToDelete[0]) throw new Error("Regra não encontrada");
        
        // Registrar histórico de exclusão
        await database.insert(approvalRuleHistory).values({
          ruleId: input.id,
          action: "excluido",
          previousData: JSON.stringify(ruleToDelete[0]),
          changedBy: currentEmployee[0].id,
        } as any);
        
        // Enviar email para o aprovador antes de excluir
        try {
          const approver = await database.select().from(employees).where(eq(employees.id, ruleToDelete[0].approverId)).limit(1);
          if (approver[0] && approver[0].email) {
            const { ruleDeletedTemplate } = await import('./emailTemplates/approvalRuleTemplates');
            
            // Buscar nome da vinculação
            let departmentName, costCenterName, employeeName;
            if (ruleToDelete[0].departmentId) {
              const dept = await database.select().from(departments).where(eq(departments.id, ruleToDelete[0].departmentId)).limit(1);
              departmentName = dept[0]?.name;
            }
            if (ruleToDelete[0].costCenterId) {
              const cc = await database.select().from(costCenters).where(eq(costCenters.id, ruleToDelete[0].costCenterId)).limit(1);
              costCenterName = cc[0] ? `${cc[0].code} - ${cc[0].name}` : undefined;
            }
            if (ruleToDelete[0].employeeId) {
              const emp = await database.select().from(employees).where(eq(employees.id, ruleToDelete[0].employeeId)).limit(1);
              employeeName = emp[0]?.name;
            }
            
            const template = ruleDeletedTemplate({
              approverName: approver[0].name,
              ruleType: ruleToDelete[0].ruleType,
              approvalContext: ruleToDelete[0].approvalContext,
              departmentName,
              costCenterName,
              employeeName,
              approverLevel: ruleToDelete[0].approverLevel,
              createdByName: currentEmployee[0].name,
            });
            
            await sendEmail({
              to: approver[0].email,
              subject: template.subject,
              html: template.html,
            });
          }
        } catch (emailError) {
          console.error('[approvalRules.delete] Erro ao enviar email:', emailError);
          // Não falhar a operação se o email falhar
        }
        
        // Excluir regra
        await database.delete(approvalRules).where(eq(approvalRules.id, input.id));
        return { success: true };
      }),
      
    getHistory: protectedProcedure
      .input(z.object({ ruleId: z.number().optional() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        const query = database.select({
          history: approvalRuleHistory,
          changedByEmployee: employees,
        })
        .from(approvalRuleHistory)
        .leftJoin(employees, eq(approvalRuleHistory.changedBy, employees.id))
        .orderBy(desc(approvalRuleHistory.changedAt));
        
        if (input.ruleId) {
          const results = await query.where(eq(approvalRuleHistory.ruleId, input.ruleId));
          return results.map(r => ({
            ...r.history,
            changedByName: r.changedByEmployee?.name || "Desconhecido",
          }));
        }
        
        const results = await query.limit(100);
        return results.map(r => ({
          ...r.history,
          changedByName: r.changedByEmployee?.name || "Desconhecido",
        }));
      }),
      
    getDepartments: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(departments).where(eq(departments.active, true)).orderBy(departments.name);
    }),
    
    getCostCenters: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(costCenters).where(eq(costCenters.active, true)).orderBy(costCenters.name);
    }),
    
    getEmployees: protectedProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        const results = await database.select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          employeeCode: employees.employeeCode,
          department: departments,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.active, true))
        .orderBy(employees.name)
        .limit(100);
        
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          return results.filter(e => 
            e.name.toLowerCase().includes(searchLower) ||
            e.email.toLowerCase().includes(searchLower) ||
            e.employeeCode.toLowerCase().includes(searchLower)
          );
        }
        
        return results;
      }),
      
    checkConflicts: protectedProcedure
      .input(z.object({
        ruleType: z.enum(["departamento", "centro_custo", "individual"]),
        approvalContext: z.enum(["metas", "avaliacoes", "pdi", "descricao_cargo", "ciclo_360", "bonus", "promocao", "todos"]),
        departmentId: z.number().optional(),
        costCenterId: z.number().optional(),
        employeeId: z.number().optional(),
        excludeRuleId: z.number().optional(), // Para excluir a própria regra ao editar
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return { hasConflict: false, conflicts: [] };
        
        // Buscar regras ativas que possam conflitar
        const conditions = [
          eq(approvalRules.isActive, true),
          eq(approvalRules.ruleType, input.ruleType),
        ];
        
        // Adicionar condição de contexto ("todos" conflita com tudo)
        if (input.approvalContext !== "todos") {
          conditions.push(
            or(
              eq(approvalRules.approvalContext, input.approvalContext),
              eq(approvalRules.approvalContext, "todos")
            )!
          );
        }
        
        // Adicionar condição de vinculação
        if (input.ruleType === "departamento" && input.departmentId) {
          conditions.push(eq(approvalRules.departmentId, input.departmentId));
        } else if (input.ruleType === "centro_custo" && input.costCenterId) {
          conditions.push(eq(approvalRules.costCenterId, input.costCenterId));
        } else if (input.ruleType === "individual" && input.employeeId) {
          conditions.push(eq(approvalRules.employeeId, input.employeeId));
        }
        
        const conflictingRules = await database.select({
          rule: approvalRules,
          approver: employees,
        })
        .from(approvalRules)
        .leftJoin(employees, eq(approvalRules.approverId, employees.id))
        .where(and(...conditions));
        
        // Filtrar regra atual se estiver editando
        const conflicts = conflictingRules
          .filter(r => !input.excludeRuleId || r.rule.id !== input.excludeRuleId)
          .map(r => ({
            ...r.rule,
            approverName: r.approver?.name || "Desconhecido",
          }));
        
        return {
          hasConflict: conflicts.length > 0,
          conflicts,
          suggestions: conflicts.length > 0 ? [
            "Considere desativar as regras conflitantes antes de criar esta nova regra.",
            "Você pode ajustar o nível hierárquico (approverLevel) para criar uma cadeia de aprovação.",
            "Se necessário, altere o contexto da aprovação para ser mais específico.",
          ] : [],
        };
      }),
  }),
  
  // Metas de Produtividade
  productivityGoals: productivityGoalsRouter,
  
  reportBuilder: reportBuilderRouter,
  reportAnalytics: reportAnalyticsRouter,
  
  // Router de Metas SMART
  goals: goalsRouter,
  goalApprovals: goalApprovalsRouter,
  uisaImport: uisaImportRouter,
  payroll: payrollRouter,
  bonus: bonusRouter,
  bonusWorkflow: bonusWorkflowRouter,
  calibrationDiretoria: calibrationRouter,
  gamification: gamificationRouter,
  integrations: integrationsRouter,

  // Router de Notificações
  notifications: notificationsRouter,

  // Router de Templates de Notificações Personalizáveis
  notificationTemplates: notificationTemplatesRouter,

  // Router de Pesquisas de Pulse
  pulse: pulseRouter,

  // Router de Gerenciamento de Emails Falhados
  emailFailures: emailFailuresRouter,

  // Router de Ciclo de Avaliação de Desempenho
  performanceEvaluationCycle: performanceEvaluationCycleRouter,

  // Router de Avaliações de Desempenho
  performance: router({
    listByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const evaluations = await database.select()
          .from(performanceEvaluations)
          .where(eq(performanceEvaluations.employeeId, input.employeeId))
          .orderBy(desc(performanceEvaluations.createdAt));

        return evaluations.map(evaluation => ({
          id: evaluation.id,
          employeeId: evaluation.employeeId,
          cycleId: evaluation.cycleId,
          status: evaluation.workflowStatus,
          selfScore: evaluation.selfScore,
          cycle: null,
        }));
      }),
  }),

  // Router de Descrição de Cargos
  positionsManagement: positionsRouter,
  
  // Router de Descrição de Cargos - Template UISA
  jobDescriptions: jobDescriptionsRouter,
  jobDescriptionsPDF: jobDescriptionsPDFRouter,
  productivity: productivityRouter,
  import: importRouter,
  alerts: alertsRouter,
  timeClock: timeClockRouter,
  organization: organizationRouter,

  // Router de Emails
  emails: router({
    // Buscar métricas de emails
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const database = await getDb();
      if (!database) return { total: 0, sent: 0, failed: 0, pending: 0 };

      const allMetrics = await database.select().from(emailMetrics);

      const total = allMetrics.length;
      const sent = allMetrics.filter(m => m.success).length;
      const failed = allMetrics.filter(m => !m.success).length;
      const pending = 0; // TODO: implementar fila de emails pendentes

      return { total, sent, failed, pending };
    }),

    // Buscar histórico de emails
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const database = await getDb();
      if (!database) return [];

      const history = await database.select()
        .from(emailMetrics)
        .orderBy(desc(emailMetrics.sentAt))
        .limit(500);

      return history.map(email => ({
        id: email.id,
        recipient: email.toEmail,
        subject: email.subject,
        emailType: email.type,
        status: email.success ? "sent" : "failed",
        sentAt: email.sentAt,
        createdAt: email.sentAt,
        errorMessage: email.error,
      }));
    }),

    // Reenviar email falhado
    resend: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Buscar email original
        const originalEmail = await database.select()
          .from(emailMetrics)
          .where(eq(emailMetrics.id, input.emailId))
          .limit(1);

        if (originalEmail.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email não encontrado",
          });
        }

        const email = originalEmail[0];

        // Reenviar usando emailService
        try {
          const success = await sendEmail({
            to: email.toEmail,
            subject: email.subject || "Notificação do Sistema AVD UISA",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #F39200;">Notificação do Sistema</h2>
                <p>Esta é uma notificação do Sistema AVD UISA.</p>
                <p>Tipo: <strong>${email.type}</strong></p>
                <p>Por favor, acesse o sistema para mais detalhes.</p>
              </div>
            `,
          });

          if (success) {
            // Registrar novo envio
            await database.insert(emailMetrics).values({
              type: email.type,
              toEmail: email.toEmail,
              subject: email.subject,
              success: true,
              deliveryTime: 0,
              attempts: (email.attempts || 1) + 1,
            });
          }

          return { success, message: success ? "Email reenviado com sucesso" : "Falha ao reenviar email" };
        } catch (error: any) {
          console.error("[Emails] Erro ao reenviar:", error);
          return { success: false, message: `Erro: ${error.message}` };
        }
      }),

    // Reenviar todos os emails falhados
    resendAllFailed: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Buscar todos os emails falhados (limitar a 100)
        const failedEmails = await database.select()
          .from(emailMetrics)
          .where(eq(emailMetrics.success, false))
          .orderBy(desc(emailMetrics.sentAt))
          .limit(100);

        if (failedEmails.length === 0) {
          return {
            successCount: 0,
            failedCount: 0,
            total: 0,
            message: "Não há emails falhados para reenviar.",
          };
        }

        console.log(`[Emails] Reenviando ${failedEmails.length} emails falhados...`);

        let successCount = 0;
        let failedCount = 0;

        for (const email of failedEmails) {
          try {
            const success = await sendEmail({
              to: email.toEmail,
              subject: email.subject || "Notificação do Sistema AVD UISA",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #F39200;">Notificação do Sistema</h2>
                  <p>Esta é uma notificação do Sistema AVD UISA.</p>
                  <p>Tipo: <strong>${email.type}</strong></p>
                  <p>Por favor, acesse o sistema para mais detalhes.</p>
                </div>
              `,
            });

            if (success) {
              successCount++;
              // Registrar novo envio
              await database.insert(emailMetrics).values({
                type: email.type,
                toEmail: email.toEmail,
                subject: email.subject,
                success: true,
                deliveryTime: 0,
                attempts: (email.attempts || 1) + 1,
              });
              console.log(`[Emails] ✓ Reenviado para ${email.toEmail}`);
            } else {
              failedCount++;
              console.warn(`[Emails] ✗ Falha ao reenviar para ${email.toEmail}`);
            }
          } catch (error: any) {
            failedCount++;
            console.error(`[Emails] ✗ Erro ao reenviar para ${email.toEmail}:`, error.message);
          }
        }

        console.log(`[Emails] Resumo: ${successCount} enviados, ${failedCount} falharam`);

        return {
          successCount,
          failedCount,
          total: failedEmails.length,
          message: `${successCount} email(s) reenviado(s) com sucesso${failedCount > 0 ? `, ${failedCount} falharam` : ''}.`,
        };
      }),
  }),

  // Router de Centros de Custos
  costCenters: router({
    // Listar todos os centros de custos ativos
    list: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      // Buscar centros de custos da tabela costCenters
      const result = await database.select()
        .from(costCenters)
        .where(eq(costCenters.active, true))
        .orderBy(costCenters.name);

      return result;
    }),

    // Criar novo centro de custos
    create: protectedProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        budgetCents: z.number().optional(), // Orçamento em centavos
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const [result] = await database.insert(costCenters).values({
          code: input.code,
          name: input.name,
          description: input.description,
          departmentId: input.departmentId,
          budgetCents: input.budgetCents,
          active: true,
        });

        return { id: result.insertId, ...input };
      }),

    // Atualizar centro de custos
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        budgetCents: z.number().optional(), // Orçamento em centavos
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const updateData: any = {};
        if (input.code !== undefined) updateData.code = input.code;
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
        if (input.budgetCents !== undefined) updateData.budgetCents = input.budgetCents;
        if (input.active !== undefined) updateData.active = input.active;

        await database.update(costCenters)
          .set(updateData)
          .where(eq(costCenters.id, input.id));

        return { success: true };
      }),

    // Deletar (desativar) centro de custos
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        await database.update(costCenters)
          .set({ active: false })
          .where(eq(costCenters.id, input.id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // E-MAIL
  // ============================================================================
  smtpConfig: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar configuração mais recente
      const configs = await db.select().from(smtpConfig).where(eq(smtpConfig.isActive, true)).orderBy(desc(smtpConfig.createdAt)).limit(1);
      
      return configs.length > 0 ? configs[0] : null;
    }),

    save: protectedProcedure
      .input(z.object({
        host: z.string(),
        port: z.number(),
        secure: z.boolean(),
        user: z.string(),
        password: z.string().optional(),
        fromEmail: z.string().email(),
        fromName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Desativar configurações antigas
        await db.update(smtpConfig).set({ isActive: false }).where(eq(smtpConfig.isActive, true));

        // Criar nova configuração
        const result = await db.insert(smtpConfig).values({
          host: input.host,
          port: input.port,
          secure: input.secure,
          user: input.user,
          password: input.password || "***", // TODO: Encrypt password
          fromEmail: input.fromEmail,
          fromName: input.fromName,
          isActive: true,
        });

        return { success: true, configId: result[0].insertId };
      }),
  }),

  email: router({
    // Enviar e-mail de teste
    sendTest: protectedProcedure
      .input(z.object({ recipientEmail: z.string().email() }))
      .mutation(async ({ input }) => {
        const { sendTestEmail } = await import('./utils/emailService');
        return await sendTestEmail(input.recipientEmail);
      }),

    // Enviar e-mail de meta
    sendGoalEmail: protectedProcedure
      .input(z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        goalTitle: z.string(),
        goalDescription: z.string(),
        deadline: z.string(),
        assignedBy: z.string(),
        dashboardUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { sendTemplateEmail } = await import('./emailService');
        const { newGoalTemplate } = await import('./emailTemplates');
        
        const template = newGoalTemplate(input);
        const success = await sendTemplateEmail(input.recipientEmail, template);
        
        return { success, message: success ? 'E-mail enviado com sucesso' : 'Falha ao enviar e-mail' };
      }),

    // Enviar e-mail de resultado de performance
    sendPerformanceEmail: protectedProcedure
      .input(z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        evaluationPeriod: z.string(),
        overallScore: z.number(),
        performanceLevel: z.string(),
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
        evaluatorName: z.string(),
        dashboardUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { sendTemplateEmail } = await import('./emailService');
        const { performanceResultTemplate } = await import('./emailTemplates');
        
        const template = performanceResultTemplate(input);
        const success = await sendTemplateEmail(input.recipientEmail, template);
        
        return { success, message: success ? 'E-mail enviado com sucesso' : 'Falha ao enviar e-mail' };
      }),
  }),

  // ============================================================================
  // WORKFLOWS
  // ============================================================================
  workflows: router({
    // Listar todos os workflows
    list: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      const allWorkflows = await database
        .select()
        .from(workflows)
        .orderBy(desc(workflows.createdAt));

      return allWorkflows;
    }),

    // Criar novo workflow
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum([
          "aprovacao_metas",
          "aprovacao_pdi",
          "aprovacao_avaliacao",
          "aprovacao_bonus",
          "aprovacao_ferias",
          "aprovacao_promocao",
          "aprovacao_horas_extras",
          "aprovacao_despesas",
          "outro"
        ]),
        steps: z.string(), // JSON stringified
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado",
          });
        }

        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Colaborador não encontrado",
          });
        }

        const [workflow] = await database.insert(workflows).values({
          name: input.name,
          description: input.description || null,
          type: input.type,
          steps: input.steps,
          isActive: input.isActive ?? true,
          isDefault: input.isDefault ?? false,
          createdBy: employee.id,
        });

        return { success: true, workflowId: workflow.insertId };
      }),

    // Atualizar workflow
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        steps: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.steps !== undefined) updateData.steps = input.steps;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

        await database.update(workflows)
          .set(updateData)
          .where(eq(workflows.id, input.id));

        return { success: true };
      }),

    // Deletar workflow
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        await database.delete(workflows)
          .where(eq(workflows.id, input.id));

        return { success: true };
      }),
  }),
});

// Função auxiliar para calcular perfil psicométrico
async function calculateProfile(
  testType: "disc" | "bigfive" | "mbti" | "ie" | "vark" | "leadership" | "careeranchors",
  responses: Array<{ questionId: number; score: number }>,
  database: any
) {
  // Buscar perguntas com dimensões
  const questions = await database.select()
    .from(testQuestions)
    .where(eq(testQuestions.testType, testType));

  const dimensionScores: Record<string, number[]> = {};

  // Agrupar scores por dimensão
  for (const response of responses) {
    const question = questions.find((q: any) => q.id === response.questionId);
    if (!question) continue;

    const dimension = question.dimension;
    if (!dimensionScores[dimension]) dimensionScores[dimension] = [];

    // Inverter score se a pergunta for reversa
    const score = question.reverse ? (6 - response.score) : response.score;
    dimensionScores[dimension].push(score);
  }

  // Calcular médias por dimensão
  const profile: Record<string, number> = {};
  for (const [dimension, scores] of Object.entries(dimensionScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    profile[dimension] = Math.round(avg * 10) / 10; // Arredondar para 1 casa decimal
  }

  return profile;
}

// ============================================================================
// ROUTER DE NOTIFICAÇÕES
// ============================================================================

async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const database = await getDb();
  if (!database) return null;

  const [notification] = await database.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    read: false,
  }).$returningId();

  return notification;
}

export type AppRouter = typeof appRouter;
