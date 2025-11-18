import { z } from "zod";
import { desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  successionPlans, 
  successionCandidates,
  positions,
  employees,
  nineBoxPositions,
  pdiPlans
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
          developmentPlanId: successionCandidates.developmentPlanId,
          notes: successionCandidates.notes,
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

  // Adicionar sucessor ao plano
  addSuccessor: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        employeeId: z.number(),
        readinessLevel: z.enum(["imediato", "1_ano", "2_3_anos", "mais_3_anos"]),
        priority: z.number().default(1),
        developmentPlanId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const [result] = await database.insert(successionCandidates).values(input);

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

  // Atualizar sucessor
  updateSuccessor: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        readinessLevel: z.enum(["imediato", "1_ano", "2_3_anos", "mais_3_anos"]).optional(),
        priority: z.number().optional(),
        developmentPlanId: z.number().optional(),
        notes: z.string().optional(),
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
});
