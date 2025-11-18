import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  bonusConfigs,
  bonusWorkflows,
  bonusApprovals,
  goalEvidences,
  smartGoals,
  employees,
  positions,
  evaluationCycles,
} from "../drizzle/schema";

/**
 * Router de Gestão de Bônus
 * Gerencia configurações de bônus por função, workflows de aprovação e evidências
 */
export const bonusRouter = router({
  // ==================== CONFIGURAÇÕES DE BÔNUS POR FUNÇÃO ====================

  /**
   * Listar configurações de bônus
   */
  listConfigs: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const configs = await db
      .select({
        id: bonusConfigs.id,
        positionId: bonusConfigs.positionId,
        positionName: bonusConfigs.positionName,
        baseSalaryMultiplier: bonusConfigs.baseSalaryMultiplier,
        extraBonusPercentage: bonusConfigs.extraBonusPercentage,
        isActive: bonusConfigs.isActive,
        createdAt: bonusConfigs.createdAt,
        updatedAt: bonusConfigs.updatedAt,
      })
      .from(bonusConfigs)
      .orderBy(desc(bonusConfigs.createdAt));

    return configs;
  }),

  /**
   * Criar configuração de bônus para função
   */
  createConfig: protectedProcedure
    .input(
      z.object({
        positionId: z.number(),
        positionName: z.string(),
        baseSalaryMultiplier: z.number().min(0).max(10), // Ex: 1.5 = 1.5 salários
        extraBonusPercentage: z.number().min(0).max(100), // % adicional
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(bonusConfigs).values({
        positionId: input.positionId,
        positionName: input.positionName,
        baseSalaryMultiplier: input.baseSalaryMultiplier.toString(),
        extraBonusPercentage: input.extraBonusPercentage.toString(),
        createdBy: ctx.user.id,
      });

      return { id: Number((result as any).insertId), success: true };
    }),

  /**
   * Atualizar configuração de bônus
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        baseSalaryMultiplier: z.number().min(0).max(10),
        extraBonusPercentage: z.number().min(0).max(100),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(bonusConfigs)
        .set({
          baseSalaryMultiplier: input.baseSalaryMultiplier.toString(),
          extraBonusPercentage: input.extraBonusPercentage.toString(),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        })
        .where(eq(bonusConfigs.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar configuração de bônus
   */
  deleteConfig: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(bonusConfigs).where(eq(bonusConfigs.id, input.id));

      return { success: true };
    }),

  // ==================== WORKFLOWS DE APROVAÇÃO ====================

  /**
   * Listar workflows de aprovação
   */
  listWorkflows: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const workflows = await db
      .select()
      .from(bonusWorkflows)
      .orderBy(desc(bonusWorkflows.createdAt));

    return workflows;
  }),

  /**
   * Criar workflow de aprovação
   */
  createWorkflow: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        approvers: z.array(
          z.object({
            employeeId: z.number(),
            role: z.string(),
          })
        ).min(1).max(5),
        requireAllApprovals: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const workflowData: any = {
        name: input.name,
        description: input.description || null,
        requireAllApprovals: input.requireAllApprovals,
        createdBy: ctx.user.id,
      };

      // Adicionar aprovadores (até 5)
      input.approvers.forEach((approver, index) => {
        const level = index + 1;
        workflowData[`approver${level}Id`] = approver.employeeId;
        workflowData[`approver${level}Role`] = approver.role;
      });

      const result = await db.insert(bonusWorkflows).values(workflowData);

      return { id: Number((result as any).insertId), success: true };
    }),

  /**
   * Atualizar workflow
   */
  updateWorkflow: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        approvers: z.array(
          z.object({
            employeeId: z.number(),
            role: z.string(),
          })
        ).min(1).max(5).optional(),
        requireAllApprovals: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};

      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.requireAllApprovals !== undefined) updateData.requireAllApprovals = input.requireAllApprovals;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      // Atualizar aprovadores se fornecidos
      if (input.approvers) {
        // Limpar aprovadores existentes
        for (let i = 1; i <= 5; i++) {
          updateData[`approver${i}Id`] = null;
          updateData[`approver${i}Role`] = null;
        }

        // Adicionar novos aprovadores
        input.approvers.forEach((approver, index) => {
          const level = index + 1;
          updateData[`approver${level}Id`] = approver.employeeId;
          updateData[`approver${level}Role`] = approver.role;
        });
      }

      await db
        .update(bonusWorkflows)
        .set(updateData)
        .where(eq(bonusWorkflows.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar workflow
   */
  deleteWorkflow: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(bonusWorkflows).where(eq(bonusWorkflows.id, input.id));

      return { success: true };
    }),

  // ==================== APROVAÇÕES DE BÔNUS ====================

  /**
   * Calcular bônus elegível para colaborador em um ciclo
   */
  calculateEligibleBonus: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar colaborador e salário
      const employee = await db
        .select({
          id: employees.id,
          name: employees.name,
          positionId: employees.positionId,
        })
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (employee.length === 0) {
        throw new Error("Colaborador não encontrado");
      }

      const emp = employee[0];
      // Nota: salário base deve ser configurado na tabela bonusConfigs por função
      const baseSalary = 0; // Será calculado pela configuração da função

      // Buscar configuração de bônus da função
      let bonusConfig = null;
      if (emp.positionId) {
        const configs = await db
          .select()
          .from(bonusConfigs)
          .where(
            and(
              eq(bonusConfigs.positionId, emp.positionId),
              eq(bonusConfigs.isActive, true)
            )
          )
          .limit(1);

        if (configs.length > 0) {
          bonusConfig = configs[0];
        }
      }

      // Buscar metas concluídas e elegíveis para bônus
      const goals = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.employeeId, input.employeeId),
            eq(smartGoals.cycleId, input.cycleId),
            eq(smartGoals.bonusEligible, true),
            eq(smartGoals.status, "completed")
          )
        );

      // Calcular bônus baseado em metas
      let bonusFromGoals = 0;
      for (const goal of goals) {
        const bonusAmount = goal.bonusAmount ? parseFloat(goal.bonusAmount) : 0;
        bonusFromGoals += bonusAmount;
      }

      // Calcular bônus baseado em configuração da função
      let bonusFromPosition = 0;
      if (bonusConfig && baseSalary > 0) {
        const multiplier = parseFloat(bonusConfig.baseSalaryMultiplier);
        const extraPercentage = parseFloat(bonusConfig.extraBonusPercentage);

        bonusFromPosition = baseSalary * multiplier;
        bonusFromPosition += bonusFromPosition * (extraPercentage / 100);
      }

      const totalEligible = bonusFromGoals + bonusFromPosition;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        baseSalary,
        bonusFromGoals,
        bonusFromPosition,
        totalEligible,
        goalsCount: goals.length,
        bonusConfig: bonusConfig
          ? {
              baseSalaryMultiplier: parseFloat(bonusConfig.baseSalaryMultiplier),
              extraBonusPercentage: parseFloat(bonusConfig.extraBonusPercentage),
            }
          : null,
      };
    }),

  /**
   * Iniciar processo de aprovação de bônus
   */
  initiateApproval: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
        workflowId: z.number(),
        eligibleAmount: z.number(),
        extraBonusPercentage: z.number().min(0).max(100).default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calcular valor final
      const extraAmount = input.eligibleAmount * (input.extraBonusPercentage / 100);
      const finalAmount = input.eligibleAmount + extraAmount;

      const result = await db.insert(bonusApprovals).values({
        cycleId: input.cycleId,
        employeeId: input.employeeId,
        workflowId: input.workflowId,
        eligibleAmount: input.eligibleAmount.toString(),
        extraBonusPercentage: input.extraBonusPercentage.toString(),
        finalAmount: finalAmount.toString(),
        currentLevel: 1,
        status: "pending",
      });

      return { id: Number((result as any).insertId), success: true };
    }),

  /**
   * Aprovar/Rejeitar bônus em um nível do workflow
   */
  approveLevel: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        level: z.number().min(1).max(5),
        action: z.enum(["approved", "rejected"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar aprovação
      const approval = await db
        .select()
        .from(bonusApprovals)
        .where(eq(bonusApprovals.id, input.approvalId))
        .limit(1);

      if (approval.length === 0) {
        throw new Error("Aprovação não encontrada");
      }

      const currentApproval = approval[0];

      // Verificar se o nível está correto
      if (currentApproval.currentLevel !== input.level) {
        throw new Error(`Aprovação deve estar no nível ${currentApproval.currentLevel}`);
      }

      // Buscar workflow para verificar próximo nível
      const workflow = await db
        .select()
        .from(bonusWorkflows)
        .where(eq(bonusWorkflows.id, currentApproval.workflowId))
        .limit(1);

      if (workflow.length === 0) {
        throw new Error("Workflow não encontrado");
      }

      const wf = workflow[0];

      // Atualizar status do nível atual
      const updateData: any = {};
      updateData[`level${input.level}Status`] = input.action;
      updateData[`level${input.level}ApproverId`] = ctx.user.id;
      updateData[`level${input.level}ApprovedAt`] = new Date();
      if (input.comments) {
        updateData[`level${input.level}Comments`] = input.comments;
      }

      // Se rejeitado, finalizar processo
      if (input.action === "rejected") {
        updateData.status = "rejected";
      } else {
        // Se aprovado, verificar se há próximo nível
        const nextLevel = input.level + 1;
        const hasNextApprover = wf[`approver${nextLevel}Id` as keyof typeof wf];

        if (hasNextApprover && nextLevel <= 5) {
          // Avançar para próximo nível
          updateData.currentLevel = nextLevel;
        } else {
          // Última aprovação - finalizar como aprovado
          updateData.status = "approved";
        }
      }

      await db
        .update(bonusApprovals)
        .set(updateData)
        .where(eq(bonusApprovals.id, input.approvalId));

      // Enviar notificações por email
      if (updateData.status === "approved" || updateData.status === "rejected") {
        const {
          sendBonusApprovedEmail,
          sendBonusRejectedEmail,
        } = await import("./utils/bonusEmailNotifications");

        // Buscar dados completos para notificação
        const approval = await db
          .select({
            employeeName: employees.name,
            employeeEmail: employees.email,
            cycleName: evaluationCycles.name,
            finalAmount: bonusApprovals.finalAmount,
          })
          .from(bonusApprovals)
          .leftJoin(employees, eq(bonusApprovals.employeeId, employees.id))
          .leftJoin(evaluationCycles, eq(bonusApprovals.cycleId, evaluationCycles.id))
          .where(eq(bonusApprovals.id, input.approvalId))
          .limit(1);

        if (approval.length > 0) {
          const data = approval[0];
          const notificationData = {
            employeeName: data.employeeName || "Colaborador",
            employeeEmail: data.employeeEmail || "",
            approverName: "Aprovador",
            approverEmail: "",
            cycleName: data.cycleName || "N/A",
            bonusAmount: parseFloat(data.finalAmount),
            approvalLevel: input.level || 1,
            comments: input.comments,
          };

          if (updateData.status === "approved") {
            await sendBonusApprovedEmail(notificationData);
          } else if (updateData.status === "rejected") {
            await sendBonusRejectedEmail(notificationData);
          }
        }
      }

      return { success: true, status: updateData.status || "pending" };
    }),

  /**
   * Gerar PDF de aprovação para assinatura
   */
  generateApprovalPDF: protectedProcedure
    .input(z.object({ approvalId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar aprovação completa
      const approval = await db
        .select({
          id: bonusApprovals.id,
          cycleId: bonusApprovals.cycleId,
          employeeId: bonusApprovals.employeeId,
          eligibleAmount: bonusApprovals.eligibleAmount,
          extraBonusPercentage: bonusApprovals.extraBonusPercentage,
          finalAmount: bonusApprovals.finalAmount,
          status: bonusApprovals.status,
          cycleName: evaluationCycles.name,
          employeeName: employees.name,
        })
        .from(bonusApprovals)
        .leftJoin(evaluationCycles, eq(bonusApprovals.cycleId, evaluationCycles.id))
        .leftJoin(employees, eq(bonusApprovals.employeeId, employees.id))
        .where(eq(bonusApprovals.id, input.approvalId))
        .limit(1);

      if (approval.length === 0) {
        throw new Error("Aprovação não encontrada");
      }

      const data = approval[0];

      // Gerar histórico de aprovações (simular por enquanto)
      const approvalHistory = [
        {
          level: 1,
          approverName: "RH",
          approverRole: "Recursos Humanos",
          status: "approved",
          approvedAt: new Date().toLocaleDateString("pt-BR"),
        },
        {
          level: 2,
          approverName: "Gerente RH",
          approverRole: "Gerência de RH",
          status: "approved",
          approvedAt: new Date().toLocaleDateString("pt-BR"),
        },
        {
          level: 3,
          approverName: "Diretor de Gente",
          approverRole: "Diretoria",
          status: "approved",
          approvedAt: new Date().toLocaleDateString("pt-BR"),
        },
      ];

      const { generateBonusApprovalPDF } = await import("./utils/bonusApprovalPDF");

      const pdfBuffer = await generateBonusApprovalPDF({
        approvalId: data.id,
        cycleName: data.cycleName || "N/A",
        employeeName: data.employeeName || "N/A",
        employeeId: data.employeeId,
        positionName: "Cargo",
        departmentName: "Departamento",
        eligibleAmount: parseFloat(data.eligibleAmount),
        extraBonusPercentage: parseFloat(data.extraBonusPercentage || "0"),
        finalAmount: parseFloat(data.finalAmount),
        approvalHistory,
        generatedAt: new Date().toLocaleString("pt-BR"),
      });

      return {
        filename: `aprovacao-bonus-${input.approvalId}-${Date.now()}.pdf`,
        data: pdfBuffer.toString("base64"),
      };
    }),

  /**
   * Enviar aprovação ao financeiro
   */
  sendToFinance: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        signedPdfUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(bonusApprovals)
        .set({
          signedPdfUrl: input.signedPdfUrl,
          sentToFinanceAt: new Date(),
        })
        .where(eq(bonusApprovals.id, input.approvalId));

      return { success: true };
    }),

  /**
   * Listar aprovações pendentes para o usuário atual
   */
  myPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar workflows onde o usuário é aprovador
    const workflows = await db
      .select()
      .from(bonusWorkflows)
      .where(
        sql`${bonusWorkflows.approver1Id} = ${ctx.user.id} 
        OR ${bonusWorkflows.approver2Id} = ${ctx.user.id}
        OR ${bonusWorkflows.approver3Id} = ${ctx.user.id}
        OR ${bonusWorkflows.approver4Id} = ${ctx.user.id}
        OR ${bonusWorkflows.approver5Id} = ${ctx.user.id}`
      );

    if (workflows.length === 0) {
      return [];
    }

    const workflowIds = workflows.map((w) => w.id);

    // Buscar aprovações pendentes desses workflows
    const approvals = await db
      .select({
        id: bonusApprovals.id,
        cycleId: bonusApprovals.cycleId,
        cycleName: evaluationCycles.name,
        employeeId: bonusApprovals.employeeId,
        employeeName: employees.name,
        eligibleAmount: bonusApprovals.eligibleAmount,
        extraBonusPercentage: bonusApprovals.extraBonusPercentage,
        finalAmount: bonusApprovals.finalAmount,
        currentLevel: bonusApprovals.currentLevel,
        status: bonusApprovals.status,
        createdAt: bonusApprovals.createdAt,
      })
      .from(bonusApprovals)
      .leftJoin(employees, eq(bonusApprovals.employeeId, employees.id))
      .leftJoin(evaluationCycles, eq(bonusApprovals.cycleId, evaluationCycles.id))
      .where(
        and(
          sql`${bonusApprovals.workflowId} IN (${sql.join(workflowIds, sql`, `)})`,
          eq(bonusApprovals.status, "pending")
        )
      )
      .orderBy(desc(bonusApprovals.createdAt));

    // Filtrar apenas aprovações onde o usuário é o aprovador do nível atual
    const filtered = approvals.filter((approval) => {
      const workflow = workflows.find((w) => w.id === approval.cycleId);
      if (!workflow) return false;

      const currentLevel = approval.currentLevel;
      const approverId = workflow[`approver${currentLevel}Id` as keyof typeof workflow];

      return approverId === ctx.user.id;
    });

    return filtered;
  }),

  /**
   * Dashboard de bônus para RH
   */
  getDashboard: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let whereConditions = [];
      if (input.cycleId) {
        whereConditions.push(eq(bonusApprovals.cycleId, input.cycleId));
      }

      const approvals = await db
        .select({
          id: bonusApprovals.id,
          employeeId: bonusApprovals.employeeId,
          employeeName: employees.name,
          departmentId: employees.departmentId,
          eligibleAmount: bonusApprovals.eligibleAmount,
          finalAmount: bonusApprovals.finalAmount,
          status: bonusApprovals.status,
        })
        .from(bonusApprovals)
        .leftJoin(employees, eq(bonusApprovals.employeeId, employees.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      // Calcular estatísticas
      let totalEligible = 0;
      let totalFinal = 0;
      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;

      approvals.forEach((approval) => {
        totalEligible += parseFloat(approval.eligibleAmount);
        totalFinal += parseFloat(approval.finalAmount);

        if (approval.status === "pending") pendingCount++;
        else if (approval.status === "approved") approvedCount++;
        else if (approval.status === "rejected") rejectedCount++;
      });

      return {
        totalApprovals: approvals.length,
        totalEligible,
        totalFinal,
        pendingCount,
        approvedCount,
        rejectedCount,
        approvals,
      };
    }),
});
