import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  jobDescriptions,
  jobDescriptionApprovals,
  employees,
  leadershipHierarchy,
} from "../../drizzle/schema";
import { eq, and, or, desc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Aprovações de Descrições de Cargo
 * Workflow de 4 níveis obrigatórios:
 * 1. Líder Imediato
 * 2. Alexsandra Oliveira (RH C&S)
 * 3. André (Gerente RH)
 * 4. Rodrigo Ribeiro Gonçalves (Diretor)
 */
export const jobDescriptionApprovalsRouter = router({
  /**
   * Criar workflow de aprovação para descrição de cargo
   */
  createApprovalWorkflow: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        level1ApproverId: z.number(), // Líder Imediato
        level2ApproverId: z.number(), // Alexsandra Oliveira
        level3ApproverId: z.number(), // André
        level4ApproverId: z.number(), // Rodrigo Ribeiro Gonçalves
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar nomes dos aprovadores
      const approvers = await db
        .select()
        .from(employees)
        .where(
          inArray(employees.id, [
            input.level1ApproverId,
            input.level2ApproverId,
            input.level3ApproverId,
            input.level4ApproverId,
          ])
        );

      const approverMap = new Map(approvers.map((a) => [a.id, a.name]));

      const [result] = await db.insert(jobDescriptionApprovals).values({
        jobDescriptionId: input.jobDescriptionId,
        level1ApproverId: input.level1ApproverId,
        level1ApproverName: approverMap.get(input.level1ApproverId) || null,
        level1Status: "pending",
        level2ApproverId: input.level2ApproverId,
        level2ApproverName: approverMap.get(input.level2ApproverId) || null,
        level2Status: "pending",
        level3ApproverId: input.level3ApproverId,
        level3ApproverName: approverMap.get(input.level3ApproverId) || null,
        level3Status: "pending",
        level4ApproverId: input.level4ApproverId,
        level4ApproverName: approverMap.get(input.level4ApproverId) || null,
        level4Status: "pending",
        currentLevel: 1,
        overallStatus: "pending",
      });

      return {
        id: result.insertId,
        success: true,
      };
    }),

  /**
   * Listar aprovações pendentes do usuário
   */
  getPendingApprovals: protectedProcedure
    .input(
      z.object({
        level: z.number().min(1).max(4).optional(), // Filtrar por nível específico
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar employee vinculado ao usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) return [];

      // Construir query baseada no nível
      let conditions: any[] = [];

      if (input.level) {
        // Filtrar por nível específico
        switch (input.level) {
          case 1:
            conditions.push(
              and(
                eq(jobDescriptionApprovals.level1ApproverId, employee.id),
                eq(jobDescriptionApprovals.level1Status, "pending"),
                eq(jobDescriptionApprovals.currentLevel, 1)
              )
            );
            break;
          case 2:
            conditions.push(
              and(
                eq(jobDescriptionApprovals.level2ApproverId, employee.id),
                eq(jobDescriptionApprovals.level2Status, "pending"),
                eq(jobDescriptionApprovals.currentLevel, 2)
              )
            );
            break;
          case 3:
            conditions.push(
              and(
                eq(jobDescriptionApprovals.level3ApproverId, employee.id),
                eq(jobDescriptionApprovals.level3Status, "pending"),
                eq(jobDescriptionApprovals.currentLevel, 3)
              )
            );
            break;
          case 4:
            conditions.push(
              and(
                eq(jobDescriptionApprovals.level4ApproverId, employee.id),
                eq(jobDescriptionApprovals.level4Status, "pending"),
                eq(jobDescriptionApprovals.currentLevel, 4)
              )
            );
            break;
        }
      } else {
        // Buscar todos os níveis onde o usuário é aprovador
        conditions = [
          and(
            eq(jobDescriptionApprovals.level1ApproverId, employee.id),
            eq(jobDescriptionApprovals.level1Status, "pending"),
            eq(jobDescriptionApprovals.currentLevel, 1)
          ),
          and(
            eq(jobDescriptionApprovals.level2ApproverId, employee.id),
            eq(jobDescriptionApprovals.level2Status, "pending"),
            eq(jobDescriptionApprovals.currentLevel, 2)
          ),
          and(
            eq(jobDescriptionApprovals.level3ApproverId, employee.id),
            eq(jobDescriptionApprovals.level3Status, "pending"),
            eq(jobDescriptionApprovals.currentLevel, 3)
          ),
          and(
            eq(jobDescriptionApprovals.level4ApproverId, employee.id),
            eq(jobDescriptionApprovals.level4Status, "pending"),
            eq(jobDescriptionApprovals.currentLevel, 4)
          ),
        ];
      }

      const approvals = await db
        .select({
          approval: jobDescriptionApprovals,
          jobDescription: jobDescriptions,
        })
        .from(jobDescriptionApprovals)
        .leftJoin(
          jobDescriptions,
          eq(jobDescriptionApprovals.jobDescriptionId, jobDescriptions.id)
        )
        .where(or(...conditions))
        .orderBy(desc(jobDescriptionApprovals.createdAt));

      return approvals;
    }),

  /**
   * Aprovar nível específico
   */
  approveLevel: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar aprovação
      const [approval] = await db
        .select()
        .from(jobDescriptionApprovals)
        .where(eq(jobDescriptionApprovals.id, input.approvalId))
        .limit(1);

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aprovação não encontrada",
        });
      }

      // Verificar se é o nível correto
      if (approval.currentLevel !== input.level) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Aprovação está no nível ${approval.currentLevel}, não pode aprovar nível ${input.level}`,
        });
      }

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Funcionário não encontrado",
        });
      }

      // Verificar se o usuário é o aprovador do nível
      const approverIdField = `level${input.level}ApproverId` as keyof typeof approval;
      if (approval[approverIdField] !== employee.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o aprovador deste nível",
        });
      }

      // Atualizar status do nível
      const updateData: any = {
        [`level${input.level}Status`]: "approved",
        [`level${input.level}Comments`]: input.comments || null,
        [`level${input.level}ApprovedAt`]: new Date(),
      };

      // Se for o último nível, marcar como concluído
      if (input.level === 4) {
        updateData.overallStatus = "approved";
        updateData.completedAt = new Date();
      } else {
        // Avançar para o próximo nível
        updateData.currentLevel = input.level + 1;
      }

      await db
        .update(jobDescriptionApprovals)
        .set(updateData)
        .where(eq(jobDescriptionApprovals.id, input.approvalId));

      return { success: true };
    }),

  /**
   * Rejeitar nível específico
   */
  rejectLevel: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().min(1, "Comentários são obrigatórios para rejeição"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar aprovação
      const [approval] = await db
        .select()
        .from(jobDescriptionApprovals)
        .where(eq(jobDescriptionApprovals.id, input.approvalId))
        .limit(1);

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aprovação não encontrada",
        });
      }

      // Verificar se é o nível correto
      if (approval.currentLevel !== input.level) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Aprovação está no nível ${approval.currentLevel}, não pode rejeitar nível ${input.level}`,
        });
      }

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Funcionário não encontrado",
        });
      }

      // Verificar se o usuário é o aprovador do nível
      const approverIdField = `level${input.level}ApproverId` as keyof typeof approval;
      if (approval[approverIdField] !== employee.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é o aprovador deste nível",
        });
      }

      // Atualizar status do nível e marcar como rejeitado
      const updateData: any = {
        [`level${input.level}Status`]: "rejected",
        [`level${input.level}Comments`]: input.comments,
        [`level${input.level}ApprovedAt`]: new Date(),
        overallStatus: "rejected",
        completedAt: new Date(),
      };

      await db
        .update(jobDescriptionApprovals)
        .set(updateData)
        .where(eq(jobDescriptionApprovals.id, input.approvalId));

      return { success: true };
    }),

  /**
   * Buscar histórico de aprovação
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const approvals = await db
        .select()
        .from(jobDescriptionApprovals)
        .where(eq(jobDescriptionApprovals.jobDescriptionId, input.jobDescriptionId))
        .orderBy(desc(jobDescriptionApprovals.createdAt));

      return approvals;
    }),

  /**
   * Aprovação em lote (mesmo nível)
   */
  batchApprove: protectedProcedure
    .input(
      z.object({
        approvalIds: z.array(z.number()),
        level: z.number().min(1).max(4),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Funcionário não encontrado",
        });
      }

      // Buscar todas as aprovações
      const approvals = await db
        .select()
        .from(jobDescriptionApprovals)
        .where(inArray(jobDescriptionApprovals.id, input.approvalIds));

      // Validar que todas estão no nível correto e usuário é aprovador
      for (const approval of approvals) {
        if (approval.currentLevel !== input.level) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Aprovação ${approval.id} está no nível ${approval.currentLevel}, não pode aprovar nível ${input.level}`,
          });
        }

        const approverIdField = `level${input.level}ApproverId` as keyof typeof approval;
        if (approval[approverIdField] !== employee.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Você não é o aprovador do nível ${input.level} para aprovação ${approval.id}`,
          });
        }
      }

      // Aprovar todas
      const updateData: any = {
        [`level${input.level}Status`]: "approved",
        [`level${input.level}Comments`]: input.comments || null,
        [`level${input.level}ApprovedAt`]: new Date(),
      };

      if (input.level === 4) {
        updateData.overallStatus = "approved";
        updateData.completedAt = new Date();
      } else {
        updateData.currentLevel = input.level + 1;
      }

      await db
        .update(jobDescriptionApprovals)
        .set(updateData)
        .where(inArray(jobDescriptionApprovals.id, input.approvalIds));

      return {
        success: true,
        approvedCount: input.approvalIds.length,
      };
    }),

  /**
   * Buscar descrições de cargo por hierarquia (líder vê apenas sua equipe)
   */
  getByLeadership: protectedProcedure
    .input(
      z.object({
        includeIndirect: z.boolean().default(true), // Incluir subordinados indiretos
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) return [];

      // Se for admin ou RH, retornar todas
      if (ctx.user.role === "admin" || ctx.user.role === "rh") {
        const allDescriptions = await db
          .select()
          .from(jobDescriptions)
          .orderBy(desc(jobDescriptions.createdAt));
        return allDescriptions;
      }

      // Buscar subordinados diretos
      const directSubordinates = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, employee.id));

      let subordinateIds = directSubordinates.map((e) => e.id);

      // Se incluir indiretos, buscar hierarquia completa
      if (input.includeIndirect) {
        const hierarchy = await db
          .select()
          .from(leadershipHierarchy)
          .where(eq(leadershipHierarchy.managerId, employee.id));

        subordinateIds = [...subordinateIds, ...hierarchy.map((h) => h.employeeId)];
      }

      // Buscar descrições de cargo dos subordinados
      const descriptions = await db
        .select()
        .from(jobDescriptions)
        .where(inArray(jobDescriptions.employeeId, subordinateIds))
        .orderBy(desc(jobDescriptions.createdAt));

      return descriptions;
    }),
});
