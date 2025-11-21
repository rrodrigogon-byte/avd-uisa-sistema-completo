import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getUserByOpenId } from "./db";
import { employees, goals, pdiPlans, pdiItems, performanceEvaluations, nineBoxPositions, passwordResetTokens, users, successionPlans, testQuestions, psychometricTests, systemSettings, emailMetrics, calibrationSessions, calibrationReviews, evaluationResponses, evaluationQuestions, departments, positions, evaluationCycles, notifications, auditLogs, scheduledReports, reportExecutionLogs, workflows, workflowInstances, workflowStepApprovals, smtpConfig } from "../drizzle/schema";
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
import { bonusRouter } from "./bonusRouter";
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
import { organizationRouter } from "./routers/organizationRouter";
import { goalApprovalsRouter } from "./goalApprovalsRouter";
import { uisaImportRouter } from "./routers/uisaImportRouter";
import { payrollRouter } from "./routers/payrollRouter";
import { adminRouter } from "./routers/adminRouter";
import { pushNotificationsRouter } from "./routers/pushNotificationsRouter";
import { advancedAnalyticsRouter } from "./advancedAnalyticsRouter";
import { evaluationTemplatesRouter } from "./routers/evaluationTemplatesRouter";
import { calibrationDirectorRouter } from "./routers/calibrationDirectorRouter";
import { reportsRouter } from "./routers/reportsRouter";
import { and, desc, eq, sql, gte, lte } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
  
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
  // COLABORADORES
  // ============================================================================
  employees: router({
    list: protectedProcedure.query(async () => {
      try {
        const result = await db.getAllEmployees();
        return result || [];
      } catch (error) {
        console.error('[employees.list] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar funcionários',
          cause: error,
        });
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeById(input.id);
        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Colaborador não encontrado",
          });
        }
        return employee;
      }),

    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeByUserId(input.userId);
        return employee || null;
      }),

    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }
      const employee = await db.getEmployeeByUserId(ctx.user.id);
      return employee || null;
    }),

    // Buscar equipe direta do gestor
    getTeamByManager: protectedProcedure
      .input(z.object({ managerId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const teamMembers = await database
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
            managerId: employees.managerId,
            departmentId: employees.departmentId,
            positionId: employees.positionId,
          })
          .from(employees)
          .where(eq(employees.managerId, input.managerId));

        // Buscar departamentos e cargos
        const depts = await database.select().from(departments);
        const positionsData = await database.select().from(positions);

        return teamMembers.map(emp => ({
          ...emp,
          department: depts.find(d => d.id === emp.departmentId),
          position: positionsData.find((p: any) => p.id === emp.positionId),
        }));
      }),

    // Hierarquia organizacional
    getHierarchy: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      // Buscar todos os colaboradores com JOIN em departments e positions
      const allEmployees = await database
        .select({
          id: employees.id,
          userId: employees.userId,
          employeeCode: employees.employeeCode,
          name: employees.name,
          email: employees.email,
          managerId: employees.managerId,
          costCenter: employees.costCenter,
          department: departments.name,
          departmentId: employees.departmentId,
          position: positions.title,
          positionId: employees.positionId,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id));
      
      // Calcular contagem de subordinados para cada colaborador
      const employeesWithCount = allEmployees.map(emp => {
        const subordinateCount = allEmployees.filter(e => e.managerId === emp.id).length;
        return { ...emp, subordinateCount };
      });
      
      return employeesWithCount;
    }),

    // Atualizar colaborador (para importação em massa)
    exportHierarchyReport: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar todos os colaboradores com departamentos e cargos
      const allEmployees = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          managerId: employees.managerId,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          costCenter: employees.costCenter,
        })
        .from(employees);

      // Buscar departamentos e cargos
      const depts = await db.select().from(departments);
      const positionsData = await db.select().from(positions);

      // Calcular estatísticas
      const totalEmployees = allEmployees.length;
      const employeesWithManager = allEmployees.filter(e => e.managerId).length;
      const employeesWithoutManager = totalEmployees - employeesWithManager;
      const uniqueManagers = new Set(allEmployees.map(e => e.managerId).filter(Boolean)).size;

      // Agrupar por departamento
      const byDepartment = new Map<number, number>();
      allEmployees.forEach(e => {
        if (e.departmentId) {
          byDepartment.set(e.departmentId, (byDepartment.get(e.departmentId) || 0) + 1);
        }
      });

      // Calcular span of control (média de subordinados por gestor)
      const subordinatesCount = new Map<number, number>();
      allEmployees.forEach(e => {
        if (e.managerId) {
          subordinatesCount.set(e.managerId, (subordinatesCount.get(e.managerId) || 0) + 1);
        }
      });
      const avgSpanOfControl = subordinatesCount.size > 0
        ? Array.from(subordinatesCount.values()).reduce((a, b) => a + b, 0) / subordinatesCount.size
        : 0;

      return {
        totalEmployees,
        employeesWithManager,
        employeesWithoutManager,
        uniqueManagers,
        avgSpanOfControl: Math.round(avgSpanOfControl * 10) / 10,
        departmentStats: Array.from(byDepartment.entries()).map(([deptId, count]) => ({
          departmentId: deptId,
          departmentName: depts.find(d => d.id === deptId)?.name || `Dept ${deptId}`,
          count,
        })),
        employeesWithoutManagerList: allEmployees
          .filter(e => !e.managerId)
          .map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            department: depts.find(d => d.id === e.departmentId)?.name || "",
            position: positionsData.find((p: any) => p.id === e.positionId)?.title || "",
            costCenter: e.costCenter || "",
          })),
      };
    }),

    updateEmployee: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          managerId: z.number().optional(),
          costCenter: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: any = {};
        if (input.managerId !== undefined) updateData.managerId = input.managerId;
        if (input.costCenter !== undefined) updateData.costCenter = input.costCenter;

        await database
          .update(employees)
          .set(updateData)
          .where(eq(employees.id, input.id));

        return { success: true, message: "Colaborador atualizado com sucesso" };
      }),

    // Atualizar colaborador completo (para formulário de edição)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          employeeCode: z.string(),
          name: z.string(),
          email: z.string().email(),
          cpf: z.string().optional(),
          birthDate: z.string().optional(),
          hireDate: z.string(),
          departmentId: z.number(),
          positionId: z.number(),
          managerId: z.number().optional(),
          salary: z.number().optional(),
          hierarchyLevel: z.enum(["diretoria", "gerencia", "coordenacao", "supervisao", "operacional"]).optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: any = {
          employeeCode: input.employeeCode,
          name: input.name,
          email: input.email,
          hireDate: input.hireDate,
          departmentId: input.departmentId,
          positionId: input.positionId,
          updatedAt: new Date(),
        };

        if (input.cpf !== undefined) updateData.cpf = input.cpf;
        if (input.birthDate !== undefined) updateData.birthDate = input.birthDate;
        if (input.managerId !== undefined) updateData.managerId = input.managerId;
        if (input.salary !== undefined) updateData.salary = input.salary;
        if (input.hierarchyLevel !== undefined) updateData.hierarchyLevel = input.hierarchyLevel;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.address !== undefined) updateData.address = input.address;

        await database
          .update(employees)
          .set(updateData)
          .where(eq(employees.id, input.id));

        return { success: true, message: "Colaborador atualizado com sucesso" };
      }),

    getDepartments: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      const allDepartments = await database.select().from(departments).where(eq(departments.active, true));
      return allDepartments.map(d => d.name).sort();
    }),

    getManagers: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      const allEmployees = await database.select().from(employees);
      return allEmployees;
    }),

    // Buscar todos os líderes (colaboradores com subordinados)
    getLeaders: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      // Buscar todos os colaboradores
      const allEmployees = await database
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          managerId: employees.managerId,
          passwordHash: employees.passwordHash,
        })
        .from(employees);

      // Buscar departamentos e cargos
      const depts = await database.select().from(departments);
      const positionsData = await database.select().from(positions);

      // Filtrar apenas líderes (quem tem subordinados)
      const leaders = allEmployees.filter(emp => {
        const subordinatesCount = allEmployees.filter(e => e.managerId === emp.id).length;
        return subordinatesCount > 0;
      });

      // Retornar com dados completos
      return leaders.map(leader => {
        const subordinatesCount = allEmployees.filter(e => e.managerId === leader.id).length;
        return {
          id: leader.id,
          name: leader.name,
          email: leader.email,
          department: depts.find(d => d.id === leader.departmentId)?.name || "N/A",
          position: positionsData.find((p: any) => p.id === leader.positionId)?.title || "N/A",
          subordinatesCount,
          hasPassword: !!leader.passwordHash,
        };
      });
    }),

    // Atualizar senha de líder
    updatePassword: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          password: z.string().min(8),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Hash da senha com bcrypt
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Atualizar senha no banco
        await database
          .update(employees)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(employees.id, input.employeeId));

        // Registrar no histórico de alterações
        const { passwordChangeHistory } = await import("../drizzle/schema");
        await database.insert(passwordChangeHistory).values({
          employeeId: input.employeeId,
          changedBy: ctx.user!.id,
          changedByName: ctx.user!.name || "Usuário desconhecido",
          reason: input.reason || "Cadastro/atualização de senha",
          ipAddress: null,
          userAgent: null,
        });

        // Buscar dados do colaborador para enviar email
        const employee = await database
          .select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);

        if (employee.length > 0 && employee[0].email) {
          // Enviar email de notificação
          try {
            await sendEmail({
              to: employee[0].email,
              subject: "Senha de Aprovação Cadastrada - Sistema AVD UISA",
              html: `<p>Olá ${employee[0].name},</p><p>Sua senha de aprovação para consensos em Avaliações 360° foi cadastrada com sucesso.</p><p>Você poderá utilizar esta senha para aprovar avaliações na etapa de consenso.</p><p>Atenciosamente,<br>Equipe AVD UISA</p>`,
            });
          } catch (emailError) {
            console.error("[updatePassword] Erro ao enviar email:", emailError);
            // Não falhar a operação se o email falhar
          }
        }

        return { success: true, message: "Senha atualizada com sucesso" };
      }),

    // Histórico de alterações de senha
    getPasswordHistory: protectedProcedure
      .input(
        z.object({
          employeeId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const { passwordChangeHistory } = await import("../drizzle/schema");

        let query = database
          .select({
            id: passwordChangeHistory.id,
            employeeId: passwordChangeHistory.employeeId,
            employeeName: employees.name,
            employeeEmail: employees.email,
            changedBy: passwordChangeHistory.changedBy,
            changedByName: passwordChangeHistory.changedByName,
            reason: passwordChangeHistory.reason,
            ipAddress: passwordChangeHistory.ipAddress,
            createdAt: passwordChangeHistory.createdAt,
          })
          .from(passwordChangeHistory)
          .innerJoin(employees, eq(passwordChangeHistory.employeeId, employees.id))
          .orderBy(desc(passwordChangeHistory.createdAt));

        // Aplicar filtros
        const conditions = [];
        if (input.employeeId) {
          conditions.push(eq(passwordChangeHistory.employeeId, input.employeeId));
        }
        if (input.startDate) {
          conditions.push(gte(passwordChangeHistory.createdAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          conditions.push(lte(passwordChangeHistory.createdAt, new Date(input.endDate)));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        const history = await query;
        return history;
      }),
  }),

  // ============================================================================
  // METAS
  // ============================================================================
  goals: router({
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
        return await db.getGoalsByEmployee(employeeId, input.cycleId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const goal = await db.getGoalById(input.id);
        if (!goal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meta não encontrada",
          });
        }
        return goal;
      }),

    // Buscar metas da equipe do gestor
    getTeamGoals: protectedProcedure
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

        // Buscar metas dos subordinados
        const teamGoals = await database
          .select()
          .from(goals)
          .where(sql`${goals.employeeId} IN (${sql.join(teamMemberIds, sql`, `)})`);

        // Buscar dados dos colaboradores
        const employeesData = await database
          .select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(sql`${employees.id} IN (${sql.join(teamMemberIds, sql`, `)})`);

        return teamGoals.map(goal => ({
          ...goal,
          employee: employeesData.find(e => e.id === goal.employeeId),
        }));
      }),

    create: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        employeeId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["individual", "equipe", "organizacional"]),
        category: z.enum(["quantitativa", "qualitativa"]),
        targetValue: z.string().optional(),
        unit: z.string().optional(),
        weight: z.number().default(1),
        startDate: z.date(),
        endDate: z.date(),
        linkedToPLR: z.boolean().default(false),
        linkedToBonus: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const [result] = await database.insert(goals).values({
          ...input,
          createdBy: ctx.user!.id,
          status: "rascunho",
          progress: 0,
        });

        const goalId = Number(result.insertId);

        await db.logAudit(
          ctx.user!.id,
          "CREATE",
          "goals",
          goalId,
          input,
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        return { id: goalId, success: true };
      }),

    updateProgress: protectedProcedure
      .input(z.object({
        id: z.number(),
        progress: z.number().min(0).max(100),
        currentValue: z.string().optional(),
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

        const goal = await db.getGoalById(input.id);
        if (!goal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meta não encontrada",
          });
        }

        await database.update(goals)
          .set({
            progress: input.progress,
            currentValue: input.currentValue,
            status: input.progress === 100 ? "concluida" : "em_andamento",
          })
          .where(eq(goals.id, input.id));

        await db.logAudit(
          ctx.user!.id,
          "UPDATE_PROGRESS",
          "goals",
          input.id,
          { progress: input.progress, currentValue: input.currentValue },
          ctx.req.ip,
          ctx.req.headers["user-agent"]
        );

        // Verificar badges de metas se progresso = 100%
        if (input.progress === 100 && goal.employeeId) {
          const { checkGoalBadges } = await import("./services/badgeService");
          await checkGoalBadges(goal.employeeId);

          // Criar notificação de meta atingida
          try {
            const employee = await database.select()
              .from(employees)
              .where(eq(employees.id, goal.employeeId))
              .limit(1);

            if (employee.length > 0 && employee[0].managerId) {
              const manager = await database.select()
                .from(employees)
                .where(eq(employees.id, employee[0].managerId))
                .limit(1);

              if (manager.length > 0 && manager[0].userId) {
                await createNotification({
                  userId: manager[0].userId,
                  type: "goal_achieved",
                  title: "Meta Atingida",
                  message: `${employee[0].name} atingiu 100% da meta: ${goal.title}`,
                  link: `/metas`,
                });
              }
            }
          } catch (error) {
            console.error("Erro ao criar notificação de meta:", error);
          }
        }

        // Notificar marcos de progresso (25%, 50%, 75%)
        const milestones = [25, 50, 75];
        if (milestones.includes(input.progress) && goal.employeeId) {
          try {
            const employee = await database.select()
              .from(employees)
              .where(eq(employees.id, goal.employeeId))
              .limit(1);

            if (employee.length > 0 && employee[0].managerId) {
              const manager = await database.select()
                .from(employees)
                .where(eq(employees.id, employee[0].managerId))
                .limit(1);

              if (manager.length > 0 && manager[0].userId) {
                await createNotification({
                  userId: manager[0].userId,
                  type: "pdi_milestone",
                  title: "Marco de Progresso Atingido",
                  message: `${employee[0].name} atingiu ${input.progress}% da meta: ${goal.title}`,
                  link: `/metas`,
                });
              }
            }
          } catch (error) {
            console.error("Erro ao criar notificação de marco:", error);
          }
        }

        return { success: true };
      }),
  }),

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

        const [result] = await database.insert(pdiPlans).values({
          ...input,
          status: "rascunho",
          overallProgress: 0,
        });

        const pdiId = Number(result.insertId);

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
        
        return result.actions;
      }),
  }),

  // ============================================================================
  // APROVAÇÃO DE PDI
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
        emails: z.array(z.string().email()),
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

  // Router de Templates de Avaliação Customizados
  evaluationTemplates: evaluationTemplatesRouter,

  // Router de Calibração Diretoria Nine Box
  calibrationDirector: calibrationDirectorRouter,

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
  
  // Router de Gestão de Ciclos de Avaliação (360°)
  evaluationCycles: cyclesRouter,
  
  reportBuilder: reportBuilderRouter,
  reportAnalytics: reportAnalyticsRouter,
  
  // Router de Metas SMART
  smartGoals: goalsRouter,
  goalApprovals: goalApprovalsRouter,
  uisaImport: uisaImportRouter,
  payroll: payrollRouter,
  bonus: bonusRouter,
  calibrationDiretoria: calibrationRouter,
  gamification: gamificationRouter,
  integrations: integrationsRouter,

  // Router de Notificações
  notifications: notificationsRouter,

  // Router de Pesquisas de Pulse
  pulse: pulseRouter,

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

        // TODO: Implementar lógica de reenvio usando emailService
        // Por enquanto, apenas retornar sucesso
        return { success: true, message: "Email reenviado com sucesso" };
      }),
  }),

  // Router de Centros de Custos
  costCenters: router({
    // Listar todos os centros de custos únicos
    list: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      // Buscar valores únicos de costCenter da tabela employees
      const result = await database.selectDistinct({ costCenter: employees.costCenter })
        .from(employees)
        .where(sql`${employees.costCenter} IS NOT NULL AND ${employees.costCenter} != ''`)
        .orderBy(employees.costCenter);

      // Transformar em formato {id, code, name}
      return result.map((r, index) => ({
        id: index + 1,
        code: r.costCenter || '',
        name: r.costCenter || '',
      }));
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
