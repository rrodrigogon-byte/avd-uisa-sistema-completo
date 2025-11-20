import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { notifications } from "../../drizzle/schema";

/**
 * Criar notificação no banco de dados para o usuário
 */
const createNotification = async (params: { userId: number; type: string; title: string; message: string; link: string }) => {
  const db = await getDb();
  if (!db) {
    console.warn('[Notification] Database not available');
    return;
  }

  try {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    });
    console.log(`[Notification] Enviada para usuário ${params.userId}: ${params.title}`);
  } catch (error) {
    console.error('[Notification] Erro ao criar notificação:', error);
  }
};

export const bonusWorkflowRouter = router({
  // Listar workflows de aprovação
  list: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = sql`
        SELECT 
          w.*,
          d.name as departmentName,
          COUNT(DISTINCT l.id) as levelCount
        FROM bonusApprovalWorkflows w
        LEFT JOIN departments d ON w.departmentId = d.id
        LEFT JOIN bonusApprovalLevels l ON w.id = l.workflowId
        WHERE 1=1
      `;

      if (input?.departmentId) {
        query = sql`${query} AND w.departmentId = ${input.departmentId}`;
      }
      if (input?.isActive !== undefined) {
        query = sql`${query} AND w.isActive = ${input.isActive}`;
      }

      query = sql`${query} GROUP BY w.id ORDER BY w.createdAt DESC`;

      const result = await db.execute(query);
      return result as any;
    }),

  // Buscar workflow por ID com níveis
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input: id }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const workflow = await db.execute(sql`
        SELECT w.*, d.name as departmentName
        FROM bonusApprovalWorkflows w
        LEFT JOIN departments d ON w.departmentId = d.id
        WHERE w.id = ${id}
      `);

      if (!workflow[0]) {
        throw new Error("Workflow não encontrado");
      }

      const levels = await db.execute(sql`
        SELECT * FROM bonusApprovalLevels
        WHERE workflowId = ${id}
        ORDER BY levelOrder ASC
      `);

      return {
        ...workflow[0],
        levels: levels as any,
      };
    }),

  // Criar workflow
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3),
      description: z.string().optional(),
      minValue: z.number().min(0).default(0),
      maxValue: z.number().optional(),
      departmentId: z.number().optional(),
      levels: z.array(z.object({
        levelOrder: z.number().min(1),
        approverRole: z.enum(['gestor_direto', 'gerente', 'diretor', 'diretor_gente', 'cfo']),
        requiresComment: z.boolean().default(false),
        requiresEvidence: z.boolean().default(false),
        timeoutDays: z.number().default(3),
      })).min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar workflow
      const workflowResult = await db.execute(sql`
        INSERT INTO bonusApprovalWorkflows (name, description, minValue, maxValue, departmentId, isActive)
        VALUES (${input.name}, ${input.description || null}, ${input.minValue}, ${input.maxValue || null}, ${input.departmentId || null}, 1)
      `);

      const workflowId = Number((workflowResult as any).insertId);

      // Criar níveis
      for (const level of input.levels) {
        await db.execute(sql`
          INSERT INTO bonusApprovalLevels (workflowId, levelOrder, approverRole, requiresComment, requiresEvidence, timeoutDays)
          VALUES (${workflowId}, ${level.levelOrder}, ${level.approverRole}, ${level.requiresComment}, ${level.requiresEvidence}, ${level.timeoutDays})
        `);
      }

      return { id: workflowId, success: true };
    }),

  // Atualizar workflow
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(3).optional(),
      description: z.string().optional(),
      minValue: z.number().min(0).optional(),
      maxValue: z.number().optional(),
      departmentId: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: string[] = [];
      const values: any[] = [];

      if (input.name) {
        updates.push("name = ?");
        values.push(input.name);
      }
      if (input.description !== undefined) {
        updates.push("description = ?");
        values.push(input.description);
      }
      if (input.minValue !== undefined) {
        updates.push("minValue = ?");
        values.push(input.minValue);
      }
      if (input.maxValue !== undefined) {
        updates.push("maxValue = ?");
        values.push(input.maxValue);
      }
      if (input.departmentId !== undefined) {
        updates.push("departmentId = ?");
        values.push(input.departmentId);
      }
      if (input.isActive !== undefined) {
        updates.push("isActive = ?");
        values.push(input.isActive);
      }

      if (updates.length === 0) {
        throw new Error("Nenhum campo para atualizar");
      }

      values.push(input.id);
      const query = `UPDATE bonusApprovalWorkflows SET ${updates.join(", ")} WHERE id = ?`;

      await db.execute(sql.raw(query));

      return { success: true };
    }),

  // Deletar workflow
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: id }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se há instâncias ativas
      const [instancesResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM bonusWorkflowInstances
        WHERE workflowId = ${id} AND status = 'em_andamento'
      `);

      const instancesRows = instancesResult as unknown as any[];
      if (instancesRows && instancesRows.length > 0 && Number(instancesRows[0].count) > 0) {
        throw new Error("Não é possível excluir workflow com instâncias ativas");
      }

      // Deletar níveis
      await db.execute(sql`DELETE FROM bonusApprovalLevels WHERE workflowId = ${id}`);

      // Deletar workflow
      await db.execute(sql`DELETE FROM bonusApprovalWorkflows WHERE id = ${id}`);

      return { success: true };
    }),

  // Iniciar workflow para um bônus
  startWorkflow: protectedProcedure
    .input(z.object({
      bonusCalculationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar cálculo de bônus
      const [calculationResult] = await db.execute(sql`
        SELECT bc.*, e.departmentId, e.name as employeeName
        FROM bonusCalculations bc
        JOIN employees e ON bc.employeeId = e.id
        WHERE bc.id = ${input.bonusCalculationId}
      `);

      const calculationRows = calculationResult as unknown as any[];
      if (!calculationRows || calculationRows.length === 0) {
        throw new Error("Cálculo de bônus não encontrado");
      }

      const calc = calculationRows[0];

      // Encontrar workflow aplicável
      const workflow = await db.execute(sql`
        SELECT * FROM bonusApprovalWorkflows
        WHERE isActive = 1
          AND (departmentId IS NULL OR departmentId = ${calc.departmentId})
          AND (minValue IS NULL OR ${calc.totalAmount} >= minValue)
          AND (maxValue IS NULL OR ${calc.totalAmount} <= maxValue)
        ORDER BY departmentId DESC, minValue DESC
        LIMIT 1
      `);

      const workflowRows = workflow as unknown as any[];
      if (!workflowRows || workflowRows.length === 0) {
        throw new Error("Nenhum workflow aplicável encontrado");
      }

      const workflowId = Number(workflowRows[0].id);

      // Criar instância de workflow
      const instanceResult = await db.execute(sql`
        INSERT INTO bonusWorkflowInstances (bonusCalculationId, workflowId, currentLevel, status)
        VALUES (${input.bonusCalculationId}, ${workflowId}, 1, 'em_andamento')
      `);

      const instanceId = Number((instanceResult as any).insertId);

      // Buscar níveis do workflow
      const levels = await db.execute(sql`
        SELECT * FROM bonusApprovalLevels
        WHERE workflowId = ${workflowId}
        ORDER BY levelOrder ASC
      `);

      // Criar aprovações pendentes para cada nível
      for (const level of levels as any) {
        // Buscar aprovador baseado no role
        let approverId = null;

        if (level.approverRole === 'gestor_direto') {
          const [managerResult] = await db.execute(sql`
            SELECT managerId FROM employees WHERE id = ${calc.employeeId}
          `);
          const managerRows = managerResult as unknown as any[];
          approverId = managerRows && managerRows.length > 0 ? managerRows[0]?.managerId : null;
        } else if (level.approverRole === 'gerente' || level.approverRole === 'diretor') {
          // Buscar primeiro usuário com role admin (simplificado)
          const [adminResult] = await db.execute(sql`
            SELECT id FROM users WHERE role = 'admin' LIMIT 1
          `);
          const adminRows = adminResult as unknown as any[];
          approverId = adminRows && adminRows.length > 0 ? adminRows[0]?.id : null;
        }

        if (approverId) {
          await db.execute(sql`
            INSERT INTO bonusLevelApprovals (workflowInstanceId, levelId, approverId, status)
            VALUES (${instanceId}, ${level.id}, ${approverId}, 'pendente')
          `);

          // Enviar notificação para o aprovador do primeiro nível
          if (level.levelOrder === 1) {
            await createNotification({
              userId: approverId,
              type: 'bonus_approval',
              title: 'Novo Bônus para Aprovação',
              message: `Bônus de ${calc.employeeName} no valor de R$ ${(calc.totalAmount / 100).toFixed(2)} aguarda sua aprovação (Nível ${level.levelOrder}).`,
              link: `/aprovacoes/bonus-workflow/${instanceId}`,
            });
          }
        }
      }

      return { instanceId, success: true };
    }),

  // Aprovar nível
  approveLevel: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      comments: z.string().optional(),
      evidenceUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar aprovação
      await db.execute(sql`
        UPDATE bonusLevelApprovals
        SET status = 'aprovado', comments = ${input.comments || null}, evidenceUrl = ${input.evidenceUrl || null}, decidedAt = NOW()
        WHERE id = ${input.approvalId} AND approverId = ${ctx.user.id}
      `);

      // Buscar detalhes da aprovação
      const approval = await db.execute(sql`
        SELECT bla.*, bwi.*, bal.levelOrder, bal.workflowId
        FROM bonusLevelApprovals bla
        JOIN bonusWorkflowInstances bwi ON bla.workflowInstanceId = bwi.id
        JOIN bonusApprovalLevels bal ON bla.levelId = bal.id
        WHERE bla.id = ${input.approvalId}
      `);

      const approvalData = approval as any;
      if (!approvalData[0]) {
        throw new Error("Aprovação não encontrada");
      }

      const currentApproval = approvalData[0];

      // Verificar se é o último nível
      const [totalLevelsResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM bonusApprovalLevels
        WHERE workflowId = ${currentApproval.workflowId}
      `);

      const totalLevelsRows = totalLevelsResult as unknown as any[];
      const totalLevelsCount = totalLevelsRows && totalLevelsRows.length > 0 ? Number(totalLevelsRows[0].count) : 0;

      if (currentApproval.levelOrder >= totalLevelsCount) {
        // Último nível aprovado - marcar workflow como aprovado
        await db.execute(sql`
          UPDATE bonusWorkflowInstances
          SET status = 'aprovado', completedAt = NOW()
          WHERE id = ${currentApproval.workflowInstanceId}
        `);

        // Marcar cálculo de bônus como aprovado
        await db.execute(sql`
          UPDATE bonusCalculations
          SET status = 'aprovado'
          WHERE id = ${currentApproval.bonusCalculationId}
        `);

        // Notificar colaborador
        const [calculationResult] = await db.execute(sql`
          SELECT bc.id, bc.totalAmount, e.userId
          FROM bonusCalculations bc
          JOIN employees e ON bc.employeeId = e.id
          WHERE bc.id = ${currentApproval.bonusCalculationId}
        `);

        const calculation = calculationResult as any;
        if (calculation && calculation.userId) {
          await createNotification({
            userId: calculation.userId,
            type: 'bonus_approved',
            title: 'Bônus Aprovado!',
            message: `Seu bônus no valor de R$ ${(calculation.totalAmount / 100).toFixed(2)} foi aprovado em todos os níveis.`,
            link: `/bonus/meus-bonus`,
          });
        }
      } else {
        // Avançar para próximo nível
        const nextLevel = currentApproval.levelOrder + 1;
        await db.execute(sql`
          UPDATE bonusWorkflowInstances
          SET currentLevel = ${nextLevel}
          WHERE id = ${currentApproval.workflowInstanceId}
        `);

        // Notificar próximo aprovador
        const nextApproval = await db.execute(sql`
          SELECT bla.approverId, bal.levelOrder, e.name as employeeName, bc.totalAmount
          FROM bonusLevelApprovals bla
          JOIN bonusApprovalLevels bal ON bla.levelId = bal.id
          JOIN bonusWorkflowInstances bwi ON bla.workflowInstanceId = bwi.id
          JOIN bonusCalculations bc ON bwi.bonusCalculationId = bc.id
          JOIN employees e ON bc.employeeId = e.id
          WHERE bla.workflowInstanceId = ${currentApproval.workflowInstanceId}
            AND bal.levelOrder = ${nextLevel}
        `);

        const nextApprovalData = nextApproval as any;
        if (nextApprovalData[0]) {
          await createNotification({
            userId: nextApprovalData[0].approverId,
            type: 'bonus_approval',
            title: 'Novo Bônus para Aprovação',
            message: `Bônus de ${nextApprovalData[0].employeeName} no valor de R$ ${(nextApprovalData[0].totalAmount / 100).toFixed(2)} aguarda sua aprovação (Nível ${nextLevel}).`,
            link: `/aprovacoes/bonus-workflow/${currentApproval.workflowInstanceId}`,
          });
        }
      }

      return { success: true };
    }),

  // Rejeitar nível
  rejectLevel: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      comments: z.string().min(10, "Comentário obrigatório para rejeição"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar aprovação
      await db.execute(sql`
        UPDATE bonusLevelApprovals
        SET status = 'rejeitado', comments = ${input.comments}, decidedAt = NOW()
        WHERE id = ${input.approvalId} AND approverId = ${ctx.user.id}
      `);

      // Buscar detalhes
      const approval = await db.execute(sql`
        SELECT bla.*, bwi.bonusCalculationId
        FROM bonusLevelApprovals bla
        JOIN bonusWorkflowInstances bwi ON bla.workflowInstanceId = bwi.id
        WHERE bla.id = ${input.approvalId}
      `);

      const approvalData = approval as any;
      if (!approvalData[0]) {
        throw new Error("Aprovação não encontrada");
      }

      const currentApproval = approvalData[0];

      // Marcar workflow como rejeitado
      await db.execute(sql`
        UPDATE bonusWorkflowInstances
        SET status = 'rejeitado', completedAt = NOW()
        WHERE id = ${currentApproval.workflowInstanceId}
      `);

      // Marcar cálculo como rejeitado
      await db.execute(sql`
        UPDATE bonusCalculations
        SET status = 'rejeitado'
        WHERE id = ${currentApproval.bonusCalculationId}
      `);

      // Notificar colaborador
      const calculation = await db.execute(sql`
        SELECT e.userId, e.name, bc.totalAmount
        FROM bonusCalculations bc
        JOIN employees e ON bc.employeeId = e.id
        WHERE bc.id = ${currentApproval.bonusCalculationId}
      `);

      const calcData = calculation as any;
      if (calcData[0]?.userId) {
        await createNotification({
          userId: calcData[0].userId,
          type: 'bonus_rejected',
          title: 'Bônus Rejeitado',
          message: `Seu bônus no valor de R$ ${(calcData[0].totalAmount / 100).toFixed(2)} foi rejeitado. Motivo: ${input.comments}`,
          link: `/bonus/meus-bonus`,
        });
      }

      return { success: true };
    }),

  // Buscar instâncias de workflow pendentes
  getPendingInstances: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const instances = await db.execute(sql`
        SELECT 
          bwi.*,
          bc.totalAmount,
          bc.referenceMonth,
          e.name as employeeName,
          e.employeeCode,
          d.name as departmentName,
          baw.name as workflowName,
          bla.id as approvalId,
          bla.status as approvalStatus,
          bal.levelOrder,
          bal.requiresComment,
          bal.requiresEvidence,
          bal.timeoutDays
        FROM bonusWorkflowInstances bwi
        JOIN bonusCalculations bc ON bwi.bonusCalculationId = bc.id
        JOIN employees e ON bc.employeeId = e.id
        LEFT JOIN departments d ON e.departmentId = d.id
        JOIN bonusApprovalWorkflows baw ON bwi.workflowId = baw.id
        JOIN bonusLevelApprovals bla ON bwi.id = bla.workflowInstanceId
        JOIN bonusApprovalLevels bal ON bla.levelId = bal.id
        WHERE bwi.status = 'em_andamento'
          AND bla.approverId = ${ctx.user.id}
          AND bla.status = 'pendente'
          AND bal.levelOrder = bwi.currentLevel
        ORDER BY bwi.startedAt ASC
      `);

      return instances as any;
    }),
});
