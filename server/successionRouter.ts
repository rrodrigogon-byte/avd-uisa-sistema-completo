import { z } from "zod";
import { desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  successionPlans, 
  successionCandidates,
  successionHistory,
  positions,
  employees,
  nineBoxPositions,
  pdiPlans,
  users
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Succession Router
 * Metodologia: 9-Box Succession Planning
 * 
 * Esta metodologia é amplamente utilizada por empresas Fortune 500 e combina:
 * - Avaliação de Performance (eixo Y)
 * - Avaliação de Potencial (eixo X)
 * - Identificação de sucessores em posições críticas
 * - Planos de desenvolvimento estruturados
 * - Gestão de riscos de saída
 */

export const successionRouter = router({
  // Listar todos os planos de sucessão
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

    const plans = await database
      .select({
        id: successionPlans.id,
        positionId: successionPlans.positionId,
        positionTitle: positions.title,
        currentHolderId: successionPlans.currentHolderId,
        currentHolderName: employees.name,
        isCritical: successionPlans.isCritical,
        riskLevel: successionPlans.riskLevel,
        exitRisk: successionPlans.exitRisk,
        status: successionPlans.status,
        preparationTime: successionPlans.preparationTime,
        nextReviewDate: successionPlans.nextReviewDate,
        createdAt: successionPlans.createdAt,
      })
      .from(successionPlans)
      .leftJoin(positions, eq(successionPlans.positionId, positions.id))
      .leftJoin(employees, eq(successionPlans.currentHolderId, employees.id))
      .orderBy(desc(successionPlans.createdAt));

    // Buscar sucessores para cada plano
    const plansWithSuccessors = await Promise.all(
      plans.map(async (plan) => {
        const candidates = await database
          .select({
            id: successionCandidates.id,
            employeeId: successionCandidates.employeeId,
            employeeName: employees.name,
            readinessLevel: successionCandidates.readinessLevel,
            priority: successionCandidates.priority,
          })
          .from(successionCandidates)
          .leftJoin(employees, eq(successionCandidates.employeeId, employees.id))
          .where(eq(successionCandidates.planId, plan.id))
          .orderBy(successionCandidates.priority);

        return {
          ...plan,
          successors: candidates,
        };
      })
    );

    return plansWithSuccessors;
  }),

  // Buscar plano por ID com detalhes completos
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return null;

      const [plan] = await database
        .select()
        .from(successionPlans)
        .where(eq(successionPlans.id, input.id))
        .limit(1);

      if (!plan) return null;

      // Buscar posição
      const [position] = await database
        .select()
        .from(positions)
        .where(eq(positions.id, plan.positionId))
        .limit(1);

      // Buscar titular atual
      let currentHolder = null;
      if (plan.currentHolderId) {
        [currentHolder] = await database
          .select()
          .from(employees)
          .where(eq(employees.id, plan.currentHolderId))
          .limit(1);
      }

      // Buscar sucessores
      const candidates = await database
        .select({
          id: successionCandidates.id,
          employeeId: successionCandidates.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          readinessLevel: successionCandidates.readinessLevel,
          priority: successionCandidates.priority,
          comments: successionCandidates.comments,
          createdAt: successionCandidates.createdAt,
        })
        .from(successionCandidates)
        .leftJoin(employees, eq(successionCandidates.employeeId, employees.id))
        .where(eq(successionCandidates.planId, input.id))
        .orderBy(successionCandidates.priority);

      // Buscar Nine Box dos sucessores
      const candidatesWithNineBox = await Promise.all(
        candidates.map(async (candidate) => {
          const [nineBox] = await database
            .select()
            .from(nineBoxPositions)
            .where(eq(nineBoxPositions.employeeId, candidate.employeeId))
            .orderBy(desc(nineBoxPositions.createdAt))
            .limit(1);

          return {
            ...candidate,
            nineBox: nineBox || null,
          };
        })
      );

      return {
        ...plan,
        position,
        currentHolder,
        successors: candidatesWithNineBox,
      };
    }),

  // Criar novo plano de sucessão
  create: protectedProcedure
    .input(
      z.object({
        positionId: z.number(),
        currentHolderId: z.number().optional(),
        isCritical: z.boolean().default(false),
        riskLevel: z.enum(["baixo", "medio", "alto", "critico"]).default("medio"),
        exitRisk: z.enum(["baixo", "medio", "alto"]).default("medio"),
        competencyGap: z.string().optional(),
        preparationTime: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const [result] = await database.insert(successionPlans).values({
        ...input,
        status: "ativo",
      });

      return { id: result.insertId, success: true };
    }),

  // Atualizar plano de sucessão
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isCritical: z.boolean().optional(),
        riskLevel: z.enum(["baixo", "medio", "alto", "critico"]).optional(),
        exitRisk: z.enum(["baixo", "medio", "alto"]).optional(),
        competencyGap: z.string().optional(),
        preparationTime: z.number().optional(),
        trackingPlan: z.string().optional(),
        nextReviewDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const { id, ...data } = input;

      await database
        .update(successionPlans)
        .set(data)
        .where(eq(successionPlans.id, id));

      return { success: true };
    }),

  // Adicionar sucessor ao plano (FORMULÁRIO COMPLETO CONFORME MODAL)
  addSuccessor: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        employeeId: z.number(),
        // Nível de Prontidão (conforme modal)
        readinessLevel: z.enum([
          "imediato",
          "1_ano",
          "2_3_anos",
          "mais_3_anos"
        ]),
        // Prioridade
        priority: z.number().default(1),
        // Performance e Potencial (conforme modal)
        performance: z.enum(["baixo", "medio", "alto"]),
        potential: z.enum(["baixo", "medio", "alto"]),
        // Análise de Gaps de Competências
        gapAnalysis: z.string().optional(),
        // Ações de Desenvolvimento
        developmentActions: z.string().optional(),
        // Comentários
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const [result] = await database.insert(successionCandidates).values({
        planId: input.planId,
        employeeId: input.employeeId,
        readinessLevel: input.readinessLevel,
        priority: input.priority,
        performance: input.performance,
        potential: input.potential,
        gapAnalysis: input.gapAnalysis || null,
        developmentActions: input.developmentActions || null,
        comments: input.comments || null,
      });

      return { id: result.insertId, success: true };
    }),

  // Remover sucessor do plano
  removeSuccessor: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .delete(successionCandidates)
        .where(eq(successionCandidates.id, input.id));

      return { success: true };
    }),

  // Atualizar sucessor (conforme modal)
  updateSuccessor: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        readinessLevel: z.enum([
          "imediato",
          "1_ano",
          "2_3_anos",
          "mais_3_anos"
        ]).optional(),
        priority: z.number().optional(),
        performance: z.enum(["baixo", "medio", "alto"]).optional(),
        potential: z.enum(["baixo", "medio", "alto"]).optional(),
        gapAnalysis: z.string().optional(),
        developmentActions: z.string().optional(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const { id, ...data } = input;

      await database
        .update(successionCandidates)
        .set(data)
        .where(eq(successionCandidates.id, id));

      return { success: true };
    }),

  // Sugerir sucessores automaticamente baseado em Nine Box (Alto Potencial)
  suggestSuccessors: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      // Buscar colaboradores com alto potencial (potencial >= 2) no Nine Box
      const suggestions = await database
        .select({
          employeeId: employees.id,
          employeeName: employees.name,
          employeeEmail: employees.email,
          positionTitle: positions.title,
          performance: nineBoxPositions.performance,
          potential: nineBoxPositions.potential,
        })
        .from(nineBoxPositions)
        .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(sql`${nineBoxPositions.potential} >= 2`)
        .orderBy(desc(nineBoxPositions.potential), desc(nineBoxPositions.performance))
        .limit(10);

      return suggestions;
    }),

  // Deletar plano de sucessão
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Deletar sucessores primeiro
      await database
        .delete(successionCandidates)
        .where(eq(successionCandidates.planId, input.id));

      // Deletar plano
      await database
        .delete(successionPlans)
        .where(eq(successionPlans.id, input.id));

      return { success: true };
    }),

  // Importar dados de sucessão UISA
  importSuccessionData: protectedProcedure
    .input(
      z.object({
        plans: z.array(
          z.object({
            positionTitle: z.string(),
            positionCode: z.string(),
            currentHolderName: z.string().optional(),
            isCritical: z.boolean(),
            riskLevel: z.enum(["baixo", "medio", "alto", "critico"]),
            exitRisk: z.enum(["baixo", "medio", "alto"]).optional(),
            competencyGap: z.string().optional(),
            preparationTime: z.number().optional(),
            notes: z.string().optional(),
            successors: z.array(
              z.object({
                employeeName: z.string(),
                employeeCode: z.string(),
                readinessLevel: z.enum(["imediato", "1_ano", "2_3_anos", "mais_3_anos"]),
                priority: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const results = {
        success: 0,
        errors: [] as string[],
      };

      for (const planData of input.plans) {
        try {
          // 1. Buscar ou criar posição
          let position = await database
            .select()
            .from(positions)
            .where(eq(positions.code, planData.positionCode))
            .limit(1);

          if (position.length === 0) {
            // Criar posição se não existir
            const [newPosition] = await database.insert(positions).values({
              code: planData.positionCode,
              title: planData.positionTitle,
              active: true,
            });
            position = await database
              .select()
              .from(positions)
              .where(eq(positions.id, newPosition.insertId))
              .limit(1);
          }

          const positionId = position[0].id;

          // 2. Buscar ocupante atual (se fornecido)
          let currentHolderId: number | null = null;
          if (planData.currentHolderName) {
            const holder = await database
              .select()
              .from(employees)
              .where(eq(employees.name, planData.currentHolderName))
              .limit(1);
            if (holder.length > 0) {
              currentHolderId = holder[0].id;
            }
          }

          // 3. Criar plano de sucessão
          const [newPlan] = await database.insert(successionPlans).values({
            positionId,
            currentHolderId,
            isCritical: planData.isCritical,
            riskLevel: planData.riskLevel,
            exitRisk: planData.exitRisk || "medio",
            competencyGap: planData.competencyGap,
            preparationTime: planData.preparationTime,
            notes: planData.notes,
            status: "ativo",
          });

          const planId = newPlan.insertId;

          // 4. Adicionar sucessores
          for (const successorData of planData.successors) {
            // Buscar ou criar colaborador
            let employee = await database
              .select()
              .from(employees)
              .where(eq(employees.employeeCode, successorData.employeeCode))
              .limit(1);

            if (employee.length === 0) {
              // Criar colaborador se não existir (com dados mínimos)
              const [newEmployee] = await database.insert(employees).values({
                employeeCode: successorData.employeeCode,
                name: successorData.employeeName,
                email: `${successorData.employeeCode}@uisa.com.br`,
                hireDate: new Date(),
                departmentId: 1, // Departamento padrão
                positionId: positionId,
                status: "ativo",
              });
              employee = await database
                .select()
                .from(employees)
                .where(eq(employees.id, newEmployee.insertId))
                .limit(1);
            }

            const employeeId = employee[0].id;

            // Adicionar sucessor ao plano
            await database.insert(successionCandidates).values({
              planId,
              employeeId,
              readinessLevel: successorData.readinessLevel,
              priority: successorData.priority,
              performance: "medio",
              potential: "medio",
            });
          }

          results.success++;
        } catch (error: any) {
          results.errors.push(
            `Erro ao importar plano "${planData.positionTitle}": ${error.message}`
          );
        }
      }

      return results;
    }),

  // Importar planos UISA no formato simplificado
  importUIPlans: protectedProcedure
    .input(
      z.array(
        z.object({
          positionName: z.string(),
          department: z.string(),
          currentOccupant: z.string().optional(),
          riskLevel: z.enum(["baixo", "médio", "alto", "crítico"]),
          priority: z.enum(["baixa", "média", "alta", "crítica"]),
          notes: z.string().optional(),
          successors: z.array(
            z.object({
              name: z.string(),
              readinessLevel: z.enum(["ready_now", "1-2_years", "2-3_years", "3+_years"]),
              developmentPlan: z.string().optional(),
            })
          ),
        })
      )
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const results = {
        success: 0,
        errors: [] as string[],
      };

      // Mapear readinessLevel
      const mapReadiness = (level: string) => {
        const map: Record<string, string> = {
          ready_now: "pronto_ate_12_meses",
          "1-2_years": "pronto_12_24_meses",
          "2-3_years": "pronto_24_36_meses",
          "3+_years": "pronto_mais_36_meses",
        };
        return map[level] || "pronto_12_24_meses";
      };

      // Mapear riskLevel (remover acentos)
      const mapRiskLevel = (level: string) => {
        const map: Record<string, string> = {
          "baixo": "baixo",
          "médio": "medio",
          "alto": "alto",
          "crítico": "critico",
        };
        return map[level] || "medio";
      };

      for (const planData of input) {
        try {
          // 1. Buscar ou criar posição
          let position = await database
            .select()
            .from(positions)
            .where(eq(positions.title, planData.positionName))
            .limit(1);

          if (position.length === 0) {
            const code = planData.positionName.toUpperCase().replace(/\s+/g, "-");
            const [newPosition] = await database.insert(positions).values({
              code,
              title: planData.positionName,
              departmentId: null,
              active: true,
            });
            position = await database
              .select()
              .from(positions)
              .where(eq(positions.id, newPosition.insertId))
              .limit(1);
          }

          const positionId = position[0].id;

          // 2. Buscar ocupante atual
          let currentHolderId: number | null = null;
          if (planData.currentOccupant) {
            const holder = await database
              .select()
              .from(employees)
              .where(eq(employees.name, planData.currentOccupant))
              .limit(1);
            if (holder.length > 0) {
              currentHolderId = holder[0].id;
            }
          }

          // 3. Criar plano de sucessão
          const [newPlan] = await database.insert(successionPlans).values({
            positionId,
            currentHolderId,
            isCritical: planData.priority === "crítica",
            riskLevel: mapRiskLevel(planData.riskLevel) as any,
            exitRisk: "medio",
            notes: planData.notes,
            status: "ativo",
          });

          const planId = newPlan.insertId;

          // 4. Adicionar sucessores
          for (let i = 0; i < planData.successors.length; i++) {
            const successorData = planData.successors[i];
            
            // Buscar ou criar colaborador
            let employee = await database
              .select()
              .from(employees)
              .where(eq(employees.name, successorData.name))
              .limit(1);

            if (employee.length === 0) {
              const empCode = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const [newEmployee] = await database.insert(employees).values({
                employeeCode: empCode,
                name: successorData.name,
                email: `${empCode.toLowerCase()}@uisa.com.br`,
                hireDate: new Date(),
                departmentId: 1, // Departamento padrão
                positionId: 1, // Posição padrão
                status: "ativo",
              });
              employee = await database
                .select()
                .from(employees)
                .where(eq(employees.id, newEmployee.insertId))
                .limit(1);
            }

            const employeeId = employee[0].id;

            // Adicionar candidato
            await database.insert(successionCandidates).values({
              planId,
              employeeId,
              readinessLevel: mapReadiness(successorData.readinessLevel) as any,
              priority: i + 1,
              performance: "medio",
              potential: "medio",
            });
          }

          results.success++;
        } catch (error: any) {
          results.errors.push(`${planData.positionName}: ${error.message}`);
        }
      }

      return results;
    }),

  // Buscar histórico de alterações
  getHistory: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      const history = await database
        .select({
          id: successionHistory.id,
          planId: successionHistory.planId,
          candidateId: successionHistory.candidateId,
          userId: successionHistory.userId,
          userName: users.name,
          actionType: successionHistory.actionType,
          fieldName: successionHistory.fieldName,
          oldValue: successionHistory.oldValue,
          newValue: successionHistory.newValue,
          notes: successionHistory.notes,
          createdAt: successionHistory.createdAt,
        })
        .from(successionHistory)
        .leftJoin(users, eq(successionHistory.userId, users.id))
        .where(eq(successionHistory.planId, input.planId))
        .orderBy(desc(successionHistory.createdAt));

      return history;
    }),

  // Registrar alteração no histórico
  logChange: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        candidateId: z.number().optional(),
        actionType: z.enum([
          "plan_created", "plan_updated", "plan_deleted",
          "candidate_added", "candidate_updated", "candidate_removed",
          "risk_updated", "timeline_updated", "development_updated",
          "test_sent"
        ]),
        fieldName: z.string().optional(),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(successionHistory).values({
        planId: input.planId,
        candidateId: input.candidateId || null,
        userId: ctx.user.id,
        actionType: input.actionType,
        fieldName: input.fieldName || null,
        oldValue: input.oldValue || null,
        newValue: input.newValue || null,
        notes: input.notes || null,
      });

      return { success: true };
    }),

  // Enviar testes psicométricos para sucessores
  sendTests: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        candidateIds: z.array(z.number()).optional(), // Se vazio, envia para todos
        testTypes: z.array(z.string()), // ['disc', 'big_five', 'mbti', etc]
        targetType: z.enum(["candidates", "department", "emails", "groups"]),
        departmentIds: z.array(z.number()).optional(),
        emails: z.array(z.string()).optional(),
        groupIds: z.array(z.number()).optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Buscar plano
      const [plan] = await database
        .select()
        .from(successionPlans)
        .where(eq(successionPlans.id, input.planId))
        .limit(1);

      if (!plan) throw new Error("Plano não encontrado");

      // Determinar destinatários baseado no targetType
      let recipients: { id: number; name: string; email: string }[] = [];

      if (input.targetType === "candidates") {
        // Enviar para candidatos específicos ou todos
        const candidateFilter = input.candidateIds && input.candidateIds.length > 0
          ? and(
              eq(successionCandidates.planId, input.planId),
              sql`${successionCandidates.employeeId} IN (${input.candidateIds.join(",")})`
            )
          : eq(successionCandidates.planId, input.planId);

        const candidates = await database
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
          })
          .from(successionCandidates)
          .innerJoin(employees, eq(successionCandidates.employeeId, employees.id))
          .where(candidateFilter);

        recipients = candidates.filter(c => c.email) as any;
      } else if (input.targetType === "department" && input.departmentIds) {
        // Enviar para departamentos
        const deptEmployees = await database
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
          })
          .from(employees)
          .where(
            and(
              sql`${employees.departmentId} IN (${input.departmentIds.join(",")})`,
              sql`${employees.email} IS NOT NULL`
            )
          );

        recipients = deptEmployees as any;
      } else if (input.targetType === "emails" && input.emails) {
        // Enviar para emails específicos
        recipients = input.emails.map((email, idx) => ({
          id: 0,
          name: email,
          email,
        }));
      }

      if (recipients.length === 0) {
        throw new Error("Nenhum destinatário encontrado");
      }

      // TODO: Integrar com sistema de envio de emails real
      // Por enquanto, apenas registrar no histórico
      await database.insert(successionHistory).values({
        planId: input.planId,
        candidateId: null,
        userId: ctx.user.id,
        actionType: "test_sent",
        fieldName: "tests",
        oldValue: null,
        newValue: JSON.stringify({
          testTypes: input.testTypes,
          recipientCount: recipients.length,
          targetType: input.targetType,
        }),
        notes: input.message || `Testes enviados: ${input.testTypes.join(", ")}`,
      });

      return {
        success: true,
        recipientCount: recipients.length,
        recipients: recipients.map(r => ({ name: r.name, email: r.email })),
      };
    }),

  /**
   * Listar planos de sucessão com filtros avançados
   */
  listWithFilters: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        readinessLevel: z.string().optional(),
        riskLevel: z.string().optional(),
        searchQuery: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      // Buscar todos os candidatos com joins
      let query = database
        .select({
          id: successionCandidates.id,
          planId: successionCandidates.planId,
          successorName: employees.name,
          successorId: successionCandidates.employeeId,
          currentPosition: sql<string>`current_pos.title`,
          targetPosition: sql<string>`target_pos.title`,
          department: sql<string>`dept.name`,
          departmentId: employees.departmentId,
          readinessLevel: successionCandidates.readinessLevel,
          riskLevel: successionPlans.riskLevel,
          performance: successionCandidates.performance,
          potential: successionCandidates.potential,
        })
        .from(successionCandidates)
        .leftJoin(employees, eq(successionCandidates.employeeId, employees.id))
        .leftJoin(
          sql`positions as current_pos`,
          sql`${employees.positionId} = current_pos.id`
        )
        .leftJoin(successionPlans, eq(successionCandidates.planId, successionPlans.id))
        .leftJoin(
          sql`positions as target_pos`,
          sql`${successionPlans.positionId} = target_pos.id`
        )
        .leftJoin(sql`departments as dept`, sql`${employees.departmentId} = dept.id`);

      // Aplicar filtros
      const conditions = [];

      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      if (input.readinessLevel) {
        conditions.push(eq(successionCandidates.readinessLevel, input.readinessLevel as any));
      }

      if (input.riskLevel) {
        conditions.push(eq(successionPlans.riskLevel, input.riskLevel as any));
      }

      if (input.searchQuery) {
        conditions.push(sql`${employees.name} LIKE ${`%${input.searchQuery}%`}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query;
      return results;
    }),

  /**
   * Buscar estatísticas de sucessão
   */
  getStats: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        return {
          totalSuccessors: 0,
          readyNow: 0,
          highRisk: 0,
          coverageRate: 0,
        };
      }

      // Buscar todos os candidatos
      let query = database
        .select({
          readinessLevel: successionCandidates.readinessLevel,
          riskLevel: successionPlans.riskLevel,
        })
        .from(successionCandidates)
        .leftJoin(employees, eq(successionCandidates.employeeId, employees.id))
        .leftJoin(successionPlans, eq(successionCandidates.planId, successionPlans.id));

      if (input.departmentId) {
        query = query.where(eq(employees.departmentId, input.departmentId)) as any;
      }

      const candidates = await query;

      const totalSuccessors = candidates.length;
      const readyNow = candidates.filter((c) => c.readinessLevel === "imediato").length;
      const highRisk = candidates.filter(
        (c) => c.riskLevel === "alto" || c.riskLevel === "critico"
      ).length;

      // Calcular taxa de cobertura (simplificado)
      const coverageRate = totalSuccessors > 0 ? Math.round((readyNow / totalSuccessors) * 100) : 0;

      return {
        totalSuccessors,
        readyNow,
        highRisk,
        coverageRate,
      };
    }),

  /**
   * Exportar relatório de sucessão
   */
  exportReport: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        readinessLevel: z.string().optional(),
        riskLevel: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implementar exportação real
      const filename = `relatorio-sucessao-${Date.now()}.xlsx`;
      return {
        url: `/api/reports/download/${filename}`,
        filename,
      };
    }),
});
