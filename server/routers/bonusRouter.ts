import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { bonusPolicies, bonusCalculations, smartGoals, employees, notifications } from "../../drizzle/schema";

/**
 * Router de Bônus por Cargo
 * Sistema de gestão de políticas de bônus com multiplicadores de salário
 */

export const bonusRouter = router({
  /**
   * Listar políticas de bônus
   */
  list: protectedProcedure
    .input(
      z.object({
        positionId: z.number().optional(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(bonusPolicies);

      if (input?.positionId) {
        query = query.where(eq(bonusPolicies.positionId, input.positionId)) as any;
      }

      if (input?.active !== undefined) {
        query = query.where(eq(bonusPolicies.active, input.active)) as any;
      }

      const policies = await query;
      return policies;
    }),

  /**
   * Buscar política por ID
   */
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const policy = await db
        .select()
        .from(bonusPolicies)
        .where(eq(bonusPolicies.id, input))
        .limit(1);

      return policy[0] || null;
    }),

  /**
   * Criar política de bônus
   */
  create: protectedProcedure
    .input(
      z.object({
        positionId: z.number().optional(),
        departmentId: z.number().optional(),
        name: z.string(),
        description: z.string().optional(),
        salaryMultiplier: z.number().min(0).max(10),
        minMultiplier: z.number().min(0).max(10).optional(),
        maxMultiplier: z.number().min(0).max(10).optional(),
        minTenureMonths: z.number().min(0).default(6),
        minGoalCompletionRate: z.number().min(0).max(100).default(70),
        requiresGoalCompletion: z.boolean().default(true),
        validFrom: z.date(),
        validUntil: z.date().optional(),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(bonusPolicies).values({
        ...input,
        salaryMultiplier: input.salaryMultiplier.toString(),
        minMultiplier: input.minMultiplier?.toString(),
        maxMultiplier: input.maxMultiplier?.toString(),
        createdBy: ctx.user.id,
      });

      return { success: true, id: result[0].insertId };
    }),

  /**
   * Atualizar política de bônus
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        positionId: z.number().optional(),
        departmentId: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        salaryMultiplier: z.number().min(0).max(10).optional(),
        minMultiplier: z.number().min(0).max(10).optional(),
        maxMultiplier: z.number().min(0).max(10).optional(),
        minTenureMonths: z.number().min(0).optional(),
        minGoalCompletionRate: z.number().min(0).max(100).optional(),
        requiresGoalCompletion: z.boolean().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, salaryMultiplier, minMultiplier, maxMultiplier, ...updateData } = input;

      await db
        .update(bonusPolicies)
        .set({
          ...updateData,
          ...(salaryMultiplier && { salaryMultiplier: salaryMultiplier.toString() }),
          ...(minMultiplier && { minMultiplier: minMultiplier.toString() }),
          ...(maxMultiplier && { maxMultiplier: maxMultiplier.toString() }),
        })
        .where(eq(bonusPolicies.id, id));

      return { success: true };
    }),

  /**
   * Excluir política de bônus
   */
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(bonusPolicies).where(eq(bonusPolicies.id, input));

      return { success: true };
    }),

  /**
   * Calcular bônus para um funcionário
   */
  calculateBonus: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        policyId: z.number(),
        cycleId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar política
      const policy = await db
        .select()
        .from(bonusPolicies)
        .where(eq(bonusPolicies.id, input.policyId))
        .limit(1);

      if (!policy[0]) {
        throw new Error("Política de bônus não encontrada");
      }

      // Buscar funcionário
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee[0]) {
        throw new Error("Funcionário não encontrado");
      }

      // Verificar elegibilidade
      const salary = employee[0].salary || 0;
      const hireDate = employee[0].hireDate;
      const tenureMonths = hireDate
        ? Math.floor(
            (new Date().getTime() - new Date(hireDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0;

      const isEligible = tenureMonths >= (policy[0].minTenureMonths || 0);

      // Buscar metas do funcionário (se cycleId fornecido)
      let goalCompletionRate = 0;
      if (input.cycleId) {
        const goals = await db
          .select()
          .from(smartGoals)
          .where(
            and(
              eq(smartGoals.employeeId, input.employeeId),
              eq(smartGoals.cycleId, input.cycleId)
            )
          );

        if (goals.length > 0) {
          const completedGoals = goals.filter(
            (g) => g.status === "completed" || g.progress >= 100
          );
          goalCompletionRate = (completedGoals.length / goals.length) * 100;
        }
      }

      const meetsGoalRequirement =
        goalCompletionRate >= (policy[0].minGoalCompletionRate || 0);

      // Calcular valor do bônus
      const bonusAmount = isEligible && meetsGoalRequirement
        ? salary * Number(policy[0].salaryMultiplier)
        : 0;

      // Salvar cálculo
      // Obter mês de referência atual (YYYY-MM)
      const now = new Date();
      const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const calculationResult = await db.insert(bonusCalculations).values({
        employeeId: input.employeeId,
        policyId: input.policyId,
        baseSalary: salary.toString(),
        appliedMultiplier: policy[0].salaryMultiplier.toString(),
        bonusAmount: bonusAmount.toString(),
        goalCompletionRate: Math.round(goalCompletionRate),
        performanceScore: 0, // TODO: integrar com avaliações
        status: "calculado",
        referenceMonth,
      });

      return {
        success: true,
        calculationId: calculationResult[0].insertId,
        bonusAmount,
        isEligible,
        goalCompletionRate,
        tenureMonths,
        meetsGoalRequirement,
      };
    }),

  /**
   * Listar cálculos de bônus
   */
  listCalculations: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        cycleId: z.number().optional(),
        status: z.enum(["calculado", "aprovado", "pago", "cancelado"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          calculation: bonusCalculations,
          employee: employees,
          policy: bonusPolicies,
        })
        .from(bonusCalculations)
        .leftJoin(employees, eq(bonusCalculations.employeeId, employees.id))
        .leftJoin(bonusPolicies, eq(bonusCalculations.policyId, bonusPolicies.id));

      if (input?.employeeId) {
        query = query.where(eq(bonusCalculations.employeeId, input.employeeId)) as any;
      }

      // Filtro por cycleId removido (campo não existe no schema)

      if (input?.status) {
        query = query.where(eq(bonusCalculations.status, input.status)) as any;
      }

      const calculations = await query;
      return calculations;
    }),

  /**
   * Aprovar cálculo de bônus
   */
  approveCalculation: protectedProcedure
    .input(
      z.object({
        calculationId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(bonusCalculations)
        .set({
          status: "aprovado",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          adjustmentReason: input.comments,
        })
        .where(eq(bonusCalculations.id, input.calculationId));

      // Enviar notificação ao colaborador
      const calculation = await db
        .select()
        .from(bonusCalculations)
        .where(eq(bonusCalculations.id, input.calculationId))
        .limit(1);

      if (calculation[0]) {
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.id, calculation[0].employeeId))
          .limit(1);

        if (employee[0] && employee[0].userId) {
          await db.insert(notifications).values({
            userId: employee[0].userId,
            title: "Bônus Aprovado! 🎉",
            message: `Seu bônus de R$ ${Number(calculation[0].bonusAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} foi aprovado e será processado em breve.`,
            type: "success",
            link: "/bonus",
          });
        }
      }

      return { success: true };
    }),

  /**
   * Marcar bônus como pago
   */
  markAsPaid: protectedProcedure
    .input(
      z.object({
        calculationId: z.number(),
        paymentDate: z.date(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(bonusCalculations)
        .set({
          status: "pago",
          paidAt: input.paymentDate,
          adjustmentReason: input.comments,
        })
        .where(eq(bonusCalculations.id, input.calculationId));

      return { success: true };
    }),

  /**
   * Obter estatísticas de bônus
   */
  getStats: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Total de políticas ativas
      const activePolicies = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(bonusPolicies)
        .where(eq(bonusPolicies.active, true));

      // Total de cálculos
      let calculationsQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(bonusCalculations);

      // Filtro por cycleId removido (campo não existe no schema)

      const totalCalculations = await calculationsQuery;

      // Valor total de bônus
      let bonusSumQuery = db
        .select({ total: sql<number>`SUM(bonusAmount)` })
        .from(bonusCalculations)
        .where(eq(bonusCalculations.status, "aprovado"));

      // Filtro por cycleId removido (campo não existe no schema)

      const bonusSum = await bonusSumQuery;

      return {
        activePolicies: Number(activePolicies[0]?.count || 0),
        totalCalculations: Number(totalCalculations[0]?.count || 0),
        totalBonusAmount: Number(bonusSum[0]?.total || 0),
      };
    }),

  /**
   * Obter tendências mensais de bônus
   * Retorna dados agregados por mês para gráficos
   */
  getMonthlyTrends: protectedProcedure
    .input(
      z.object({
        months: z.number().default(6), // Últimos 6 meses por padrão
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const monthsToFetch = input?.months || 6;

      // Buscar cálculos dos últimos N meses
      const calculations = await db
        .select({
          referenceMonth: bonusCalculations.referenceMonth,
          bonusAmount: bonusCalculations.bonusAmount,
          status: bonusCalculations.status,
        })
        .from(bonusCalculations);

      // Agrupar por mês
      const monthlyData: Record<string, { total: number; count: number; paid: number }> = {};

      calculations.forEach((calc) => {
        const month = calc.referenceMonth || "N/A";
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0, paid: 0 };
        }
        monthlyData[month].total += Number(calc.bonusAmount || 0);
        monthlyData[month].count += 1;
        if (calc.status === "pago") {
          monthlyData[month].paid += Number(calc.bonusAmount || 0);
        }
      });

      // Converter para array e ordenar por mês
      const trends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          totalAmount: data.total,
          count: data.count,
          paidAmount: data.paid,
          averageBonus: data.count > 0 ? data.total / data.count : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-monthsToFetch); // Pegar apenas os últimos N meses

      return trends;
    }),

  /**
   * Obter distribuição de bônus por departamento
   */
  getDepartmentDistribution: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar cálculos com informações de colaboradores e departamentos
      const results = await db
        .select({
          departmentId: employees.departmentId,
          bonusAmount: bonusCalculations.bonusAmount,
        })
        .from(bonusCalculations)
        .leftJoin(employees, eq(bonusCalculations.employeeId, employees.id))
        .where(eq(bonusCalculations.status, "pago"));

      // Agrupar por departamento
      const deptData: Record<number, { total: number; count: number }> = {};

      results.forEach((row) => {
        const deptId = row.departmentId || 0;
        if (!deptData[deptId]) {
          deptData[deptId] = { total: 0, count: 0 };
        }
        deptData[deptId].total += Number(row.bonusAmount || 0);
        deptData[deptId].count += 1;
      });

      // Converter para array
      const distribution = Object.entries(deptData).map(([deptId, data]) => ({
        departmentId: Number(deptId),
        totalAmount: data.total,
        count: data.count,
        averageBonus: data.count > 0 ? data.total / data.count : 0,
      }));

      return distribution;
    }),
});
