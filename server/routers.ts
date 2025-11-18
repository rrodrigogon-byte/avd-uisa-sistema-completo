import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getUserByOpenId } from "./db";
import { employees, goals, pdiPlans, pdiItems, performanceEvaluations, nineBoxPositions, passwordResetTokens, users, successionPlans, testQuestions, psychometricTests, systemSettings, emailMetrics, calibrationSessions, calibrationReviews, evaluationResponses, evaluationQuestions, departments, evaluationCycles, notifications, auditLogs } from "../drizzle/schema";
import { getDb } from "./db";
import { analyticsRouter } from "./analyticsRouter";
import { feedbackRouter } from "./feedbackRouter";
import { badgesRouter } from "./badgesRouter";
import { eq, and, desc } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  
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
      return await db.getAllEmployees();
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
  // CICLOS, DEPARTAMENTOS E CARGOS
  // ============================================================================
  cycles: router({
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

        await db.update(pdiPlans)
          .set({ 
            status: "aprovado",
            approvedBy: employee.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(pdiPlans.id, input.planId));

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
    // Buscar perguntas de um teste específico
    getQuestions: protectedProcedure
      .input(z.object({ testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark"]) }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const questions = await database.select()
          .from(testQuestions)
          .where(eq(testQuestions.testType, input.testType))
          .orderBy(testQuestions.questionNumber);

        return questions;
      }),

    // Submeter respostas de um teste
    submitTest: protectedProcedure
      .input(z.object({
        testType: z.enum(["disc", "bigfive", "mbti", "ie", "vark"]),
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

        return { success: true, profile };
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
  }),

  // Router de Administração (apenas admin)
  admin: router({
    // Buscar configurações SMTP
    getSmtpConfig: protectedProcedure.query(async ({ ctx }) => {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado: apenas administradores");
      }

      const database = await getDb();
      if (!database) return null;

      const settings = await database.select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, "smtp_config"))
        .limit(1);

      if (settings.length === 0) return null;

      // Parse do JSON armazenado
      const config = settings[0].settingValue ? JSON.parse(settings[0].settingValue) : null;
      return config;
    }),

    // Atualizar configurações SMTP
    updateSmtpConfig: protectedProcedure
      .input(z.object({
        host: z.string().min(1),
        port: z.number().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().min(1),
        pass: z.string().min(1),
        fromName: z.string().min(1),
        fromEmail: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado: apenas administradores");
        }

        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Verificar se já existe configuração
        const existing = await database.select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, "smtp_config"))
          .limit(1);

        const configJson = JSON.stringify(input);

        if (existing.length > 0) {
          // Atualizar
          await database.update(systemSettings)
            .set({
              settingValue: configJson,
              updatedBy: ctx.user.id,
              updatedAt: new Date(),
            })
            .where(eq(systemSettings.settingKey, "smtp_config"));
        } else {
          // Inserir
          await database.insert(systemSettings).values({
            settingKey: "smtp_config",
            settingValue: configJson,
            description: "Configurações do servidor SMTP para envio de e-mails",
            isEncrypted: false,
            updatedBy: ctx.user.id,
          });
        }

        return { success: true };
      }),

    // Testar conexão SMTP
    testSmtpConnection: protectedProcedure
      .input(z.object({
        host: z.string().min(1),
        port: z.number().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().min(1),
        pass: z.string().min(1),
        fromName: z.string().min(1),
        fromEmail: z.string().email(),
        testEmail: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado: apenas administradores");
        }

        const nodemailer = require("nodemailer");

        try {
          // Criar transporter com as configurações fornecidas
          const transporter = nodemailer.createTransport({
            host: input.host,
            port: input.port,
            secure: input.secure,
            auth: {
              user: input.user,
              pass: input.pass,
            },
          });

          // Verificar conexão
          await transporter.verify();

          // Enviar e-mail de teste
          await transporter.sendMail({
            from: `"${input.fromName}" <${input.fromEmail}>`,
            to: input.testEmail,
            subject: "Teste de Configuração SMTP - Sistema AVD UISA",
            html: `
              <h2>Teste de Configuração SMTP</h2>
              <p>Este é um e-mail de teste enviado pelo Sistema AVD UISA.</p>
              <p>Se você recebeu esta mensagem, significa que as configurações SMTP estão corretas!</p>
              <hr>
              <p><small>Servidor: ${input.host}:${input.port}</small></p>
              <p><small>Data/Hora: ${new Date().toLocaleString("pt-BR")}</small></p>
            `,
          });

          return { success: true, message: "E-mail de teste enviado com sucesso!" };
        } catch (error: any) {
          console.error("[SMTP Test] Erro:", error);
          return { success: false, message: error.message || "Erro ao testar conexão SMTP" };
        }
      }),

    // Buscar métricas de e-mail
    getEmailMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new Error("Acesso negado: apenas administradores");
        }

        const database = await getDb();
        if (!database) return [];

        // Buscar métricas com filtros opcionais
        const metrics = await database.select()
          .from(emailMetrics)
          .orderBy(desc(emailMetrics.sentAt))
          .limit(input.limit || 1000);

        return metrics;
      }),

    // Buscar estatísticas agregadas de e-mail
    getEmailStats: protectedProcedure.query(async ({ ctx }) => {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado: apenas administradores");
      }

      const database = await getDb();
      if (!database) return null;

      // Buscar todas as métricas
      const allMetrics = await database.select().from(emailMetrics);

      // Calcular estatísticas
      const total = allMetrics.length;
      const successful = allMetrics.filter(m => m.success).length;
      const failed = total - successful;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      // Agrupar por tipo
      const byType: Record<string, number> = {};
      allMetrics.forEach(m => {
        byType[m.type] = (byType[m.type] || 0) + 1;
      });

      // Agrupar por mês (últimos 12 meses)
      const monthlyData: Record<string, { sent: number; success: number; failed: number }> = {};
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      allMetrics.forEach(m => {
        const sentDate = new Date(m.sentAt);
        if (sentDate >= twelveMonthsAgo) {
          const monthKey = `${sentDate.getFullYear()}-${String(sentDate.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sent: 0, success: 0, failed: 0 };
          }
          monthlyData[monthKey].sent++;
          if (m.success) {
            monthlyData[monthKey].success++;
          } else {
            monthlyData[monthKey].failed++;
          }
        }
      });

      // Converter para array ordenado
      const monthlyArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        total,
        successful,
        failed,
        successRate: Math.round(successRate * 10) / 10,
        byType,
        monthlyData: monthlyArray,
      };
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

        const evals = await database.select()
          .from(performanceEvaluations)
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

  // Router de Avaliação 360°
  evaluation360: router({
    // Buscar perguntas de avaliação
    getQuestions: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      const questions = await database.select()
        .from(evaluationQuestions)
        .where(eq(evaluationQuestions.active, true))
        .orderBy(evaluationQuestions.category, evaluationQuestions.id);

      return questions;
    }),

    // Listar avaliações 360°
    list: protectedProcedure
      .input(z.object({
        cycleId: z.number().optional(),
        employeeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];

        const evals = await database.select()
          .from(performanceEvaluations)
          .where(eq(performanceEvaluations.type, "360"))
          .orderBy(desc(performanceEvaluations.createdAt))
          .limit(100);

        return evals;
      }),

    // Buscar detalhes de uma avaliação 360°
    getDetails: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return null;

        const [evaluation] = await database.select()
          .from(performanceEvaluations)
          .where(eq(performanceEvaluations.id, input.evaluationId))
          .limit(1);

        if (!evaluation) return null;

        // Buscar respostas agrupadas por tipo de avaliador
        const responses = await database.select()
          .from(evaluationResponses)
          .where(eq(evaluationResponses.evaluationId, input.evaluationId));

        // Agrupar por tipo de avaliador
        const grouped = {
          self: responses.filter(r => r.evaluatorType === "self"),
          manager: responses.filter(r => r.evaluatorType === "manager"),
          peers: responses.filter(r => r.evaluatorType === "peer"),
          subordinates: responses.filter(r => r.evaluatorType === "subordinate"),
        };

        // Calcular médias por tipo
        const averages = {
          self: grouped.self.length > 0 ? grouped.self.reduce((sum, r) => sum + (r.score || 0), 0) / grouped.self.length : 0,
          manager: grouped.manager.length > 0 ? grouped.manager.reduce((sum, r) => sum + (r.score || 0), 0) / grouped.manager.length : 0,
          peers: grouped.peers.length > 0 ? grouped.peers.reduce((sum, r) => sum + (r.score || 0), 0) / grouped.peers.length : 0,
          subordinates: grouped.subordinates.length > 0 ? grouped.subordinates.reduce((sum, r) => sum + (r.score || 0), 0) / grouped.subordinates.length : 0,
        };

        return {
          evaluation,
          responses: grouped,
          averages,
        };
      }),

    // Submeter feedback 360°
    submitFeedback: protectedProcedure
      .input(z.object({
        evaluationId: z.number(),
        questionId: z.number(),
        evaluatorType: z.enum(["self", "manager", "peer", "subordinate"]),
        score: z.number().optional(),
        textResponse: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        await database.insert(evaluationResponses).values({
          evaluationId: input.evaluationId,
          questionId: input.questionId,
          evaluatorId: ctx.user.id,
          evaluatorType: input.evaluatorType,
          score: input.score,
          textResponse: input.textResponse,
        });

        return { success: true };
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

  // Router de Notificações
  notifications: router({
    // Buscar notificações do usuário
    getNotifications: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];

      const userNotifications = await database.select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      return userNotifications;
    }),

    // Contar notificações não lidas
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return 0;

      const unread = await database.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        ));

      return unread.length;
    }),

    // Marcar notificação como lida
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        await database.update(notifications)
          .set({ read: true, readAt: new Date() })
          .where(and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Marcar todas como lidas
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        ));

      return { success: true };
    }),
  }),

  // Router de Analytics (apenas admin)
  analytics: analyticsRouter,

  // Router de Feedback Contínuo
  feedback: feedbackRouter,

  // Router de Badges Gamificado
  badges: badgesRouter,
});

// Função auxiliar para calcular perfil psicométrico
async function calculateProfile(
  testType: "disc" | "bigfive" | "mbti" | "ie" | "vark",
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

export type AppRouter = typeof appRouter;
