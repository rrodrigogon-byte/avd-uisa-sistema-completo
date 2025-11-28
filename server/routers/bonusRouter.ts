import { z } from "zod";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { bonusPolicies, bonusCalculations, smartGoals, employees, notifications, bonusAuditLogs, bonusApprovalComments, departments } from "../../drizzle/schema";

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
        salaryMultiplierPercent: z.number().min(0).max(1000), // 0-1000%
        minMultiplierPercent: z.number().min(0).max(1000).optional(),
        maxMultiplierPercent: z.number().min(0).max(1000).optional(),
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
        salaryMultiplierPercent: z.number().min(0).max(1000).optional(),
        minMultiplierPercent: z.number().min(0).max(1000).optional(),
        maxMultiplierPercent: z.number().min(0).max(1000).optional(),
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

      const { id, ...updateData } = input;

      await db
        .update(bonusPolicies)
        .set({
          ...updateData,
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
        ? Math.round(salary * policy[0].salaryMultiplierPercent / 100)
        : 0;

      // Salvar cálculo
      // Obter mês de referência atual (YYYY-MM)
      const now = new Date();
      const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const calculationResult = await db.insert(bonusCalculations).values({
        employeeId: input.employeeId,
        policyId: input.policyId,
        baseSalaryCents: Math.round(salary * 100),
        appliedMultiplierPercent: policy[0].salaryMultiplierPercent,
        bonusAmountCents: Math.round(bonusAmount * 100),
        goalCompletionRate: Math.round(goalCompletionRate),
        performanceScore: 0, // TODO: integrar com avaliações
        status: "calculado",
        referenceMonth,
      });

      // Enviar notificação ao funcionário
      try {
        await db.insert(notifications).values({
          userId: input.employeeId,
          title: "Bônus Calculado",
          message: `Seu bônus foi calculado: R$ ${(bonusAmount / 100).toFixed(2)}. Política: ${policy[0].name}. Taxa de conclusão de metas: ${Math.round(goalCompletionRate)}%. Aguardando aprovação.`,
          type: "info",
          read: false,
        });
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }

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

  /**
   * Aprovação em lote de bônus
   */
  approveBatch: protectedProcedure
    .input(
      z.object({
        calculationIds: z.array(z.number()),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];

      for (const calcId of input.calculationIds) {
        // Atualizar status
        await db
          .update(bonusCalculations)
          .set({ status: "aprovado" })
          .where(eq(bonusCalculations.id, calcId));

        // Registrar auditoria
        await db.insert(bonusAuditLogs).values({
          entityType: "calculation",
          entityId: calcId,
          action: "approved",
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          comment: input.comment,
        });

        // Adicionar comentário se fornecido
        if (input.comment) {
          await db.insert(bonusApprovalComments).values({
            calculationId: calcId,
            userId: ctx.user.id,
            userName: ctx.user.name || undefined,
            comment: input.comment,
          });
        }

        // Buscar cálculo para notificar funcionário
        const calc = await db.select().from(bonusCalculations).where(eq(bonusCalculations.id, calcId)).limit(1);
        if (calc[0]) {
          try {
            await db.insert(notifications).values({
              userId: calc[0].employeeId,
              title: "Bônus Aprovado",
              message: `Seu bônus de R$ ${(Number(calc[0].bonusAmount) / 100).toFixed(2)} foi aprovado! ${input.comment ? `Comentário: ${input.comment}` : ""}`,
              type: "success",
              read: false,
            });
          } catch (error) {
            console.error("Erro ao enviar notificação:", error);
          }
        }

        results.push({ id: calcId, success: true });
      }

      return { success: true, count: results.length };
    }),

  /**
   * Rejeição em lote de bônus
   */
  rejectBatch: protectedProcedure
    .input(
      z.object({
        calculationIds: z.array(z.number()),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];

      for (const calcId of input.calculationIds) {
        // Atualizar status
        await db
          .update(bonusCalculations)
          .set({ status: "calculado" })
          .where(eq(bonusCalculations.id, calcId));

        // Registrar auditoria
        await db.insert(bonusAuditLogs).values({
          entityType: "calculation",
          entityId: calcId,
          action: "rejected",
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          comment: input.reason,
        });

        // Adicionar comentário com motivo
        await db.insert(bonusApprovalComments).values({
          calculationId: calcId,
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          comment: `Rejeitado: ${input.reason}`,
        });

        // Buscar cálculo para notificar funcionário
        const calc = await db.select().from(bonusCalculations).where(eq(bonusCalculations.id, calcId)).limit(1);
        if (calc[0]) {
          try {
            await db.insert(notifications).values({
              userId: calc[0].employeeId,
              title: "Bônus Rejeitado",
              message: `Seu bônus de R$ ${(Number(calc[0].bonusAmount) / 100).toFixed(2)} foi rejeitado. Motivo: ${input.reason}`,
              type: "warning",
              read: false,
            });
          } catch (error) {
            console.error("Erro ao enviar notificação:", error);
          }
        }

        results.push({ id: calcId, success: true });
      }

      return { success: true, count: results.length };
    }),

  /**
   * Adicionar comentário em aprovação
   */
  addComment: protectedProcedure
    .input(
      z.object({
        calculationId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [comment] = await db.insert(bonusApprovalComments).values({
        calculationId: input.calculationId,
        userId: ctx.user.id,
        userName: ctx.user.name || undefined,
        comment: input.comment,
      });

      return { success: true, commentId: comment.insertId };
    }),

  /**
   * Listar comentários de um cálculo
   */
  getComments: protectedProcedure
    .input(z.object({ calculationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const comments = await db
        .select()
        .from(bonusApprovalComments)
        .where(eq(bonusApprovalComments.calculationId, input.calculationId));

      return comments;
    }),

  /**
   * Listar histórico de auditoria
   */
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["policy", "calculation"]).optional(),
        entityId: z.number().optional(),
        action: z.enum(["created", "updated", "deleted", "approved", "rejected", "paid"]).optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(bonusAuditLogs);

      if (input.entityType) {
        query = query.where(eq(bonusAuditLogs.entityType, input.entityType)) as any;
      }

      if (input.entityId) {
        query = query.where(eq(bonusAuditLogs.entityId, input.entityId)) as any;
      }

      if (input.action) {
        query = query.where(eq(bonusAuditLogs.action, input.action)) as any;
      }

      const logs = await query.limit(input.limit);

      return logs;
    }),

  /**
   * Obter métricas de aprovação
   */
  getApprovalMetrics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Total de aprovações
    const [approvalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bonusAuditLogs)
      .where(eq(bonusAuditLogs.action, "approved"));

    // Total de rejeições
    const [rejectionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bonusAuditLogs)
      .where(eq(bonusAuditLogs.action, "rejected"));

    // Taxa de aprovação
    const total = Number(approvalCount.count) + Number(rejectionCount.count);
    const approvalRate = total > 0 ? (Number(approvalCount.count) / total) * 100 : 0;

    // Tempo médio de aprovação (simplificado)
    const avgApprovalTime = [{ avgHours: 24 }]; // Placeholder - implementar cálculo real se necessário

    return {
      totalApprovals: Number(approvalCount.count),
      totalRejections: Number(rejectionCount.count),
      approvalRate: Math.round(approvalRate * 10) / 10,
      avgApprovalTimeHours: avgApprovalTime[0]?.avgHours ? Math.round(Number(avgApprovalTime[0].avgHours) * 10) / 10 : 0,
    };
  }),

  /**
   * Métricas de SLA e Compliance
   * Retorna estatísticas de tempo médio de aprovação, pendências e alertas
   */
  getSLAMetrics: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Buscar cálculos de bônus no período
      const baseQuery = db
        .select({
          id: bonusCalculations.id,
          status: bonusCalculations.status,
          calculatedAt: bonusCalculations.calculatedAt,
          approvedAt: bonusCalculations.approvedAt,
          departmentId: employees.departmentId,
          departmentName: departments.name,
        })
        .from(bonusCalculations)
        .leftJoin(employees, eq(bonusCalculations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id));

      const calculations = input.departmentId
        ? await baseQuery.where(
            and(
              gte(bonusCalculations.calculatedAt, startDate),
              eq(employees.departmentId, input.departmentId)
            )
          )
        : await baseQuery.where(gte(bonusCalculations.calculatedAt, startDate));

      // Calcular tempo médio de aprovação
      const approvedCalculations = calculations.filter(
        (c) => c.status === "aprovado" && c.approvedAt && c.calculatedAt
      );

      let avgApprovalTimeHours = 0;
      if (approvedCalculations.length > 0) {
        const totalHours = approvedCalculations.reduce((sum, calc) => {
          const calculated = new Date(calc.calculatedAt!);
          const approved = new Date(calc.approvedAt!);
          const hours = (approved.getTime() - calculated.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        avgApprovalTimeHours = totalHours / approvedCalculations.length;
      }

      // Pendências críticas (> 7 dias)
      const criticalThresholdDate = new Date();
      criticalThresholdDate.setDate(criticalThresholdDate.getDate() - 7);

      const criticalPending = calculations.filter(
        (c) =>
          c.status === "calculado" &&
          c.calculatedAt &&
          new Date(c.calculatedAt) < criticalThresholdDate
      );

      // Distribuição por departamento
      const byDepartment: Record<string, { total: number; avgHours: number; pending: number }> = {};

      calculations.forEach((calc) => {
        const deptName = calc.departmentName || "Sem Departamento";
        if (!byDepartment[deptName]) {
          byDepartment[deptName] = { total: 0, avgHours: 0, pending: 0 };
        }
        byDepartment[deptName].total++;
        if (calc.status === "calculado") {
          byDepartment[deptName].pending++;
        }
      });

      // Calcular tempo médio por departamento
      Object.keys(byDepartment).forEach((deptName) => {
        const deptCalcs = calculations.filter(
          (c) => (c.departmentName || "Sem Departamento") === deptName && c.status === "aprovado" && c.approvedAt && c.calculatedAt
        );
        if (deptCalcs.length > 0) {
          const totalHours = deptCalcs.reduce((sum, calc) => {
            const calculated = new Date(calc.calculatedAt!);
            const approved = new Date(calc.approvedAt!);
            const hours = (approved.getTime() - calculated.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          byDepartment[deptName].avgHours = totalHours / deptCalcs.length;
        }
      });

      return {
        avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10,
        totalCalculations: calculations.length,
        pendingCount: calculations.filter((c) => c.status === "calculado").length,
        approvedCount: approvedCalculations.length,
        criticalPendingCount: criticalPending.length,
        criticalPending: criticalPending.map((c) => ({
          id: c.id,
          calculatedAt: c.calculatedAt,
          departmentName: c.departmentName,
          daysWaiting: Math.floor(
            (new Date().getTime() - new Date(c.calculatedAt!).getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
        byDepartment: Object.entries(byDepartment).map(([name, stats]) => ({
          departmentName: name,
          total: stats.total,
          avgApprovalTimeHours: Math.round(stats.avgHours * 10) / 10,
          pendingCount: stats.pending,
        })),
      };
    }),
});
