import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  jobDescriptionWorkflow,
  jobDescriptionWorkflowHistory,
  batchApprovals,
  jobDescriptions,
  type InsertJobDescriptionWorkflow,
  type InsertJobDescriptionWorkflowHistory,
  type InsertBatchApproval,
  type JobDescriptionWorkflow,
  type JobDescriptionWorkflowHistory,
  type BatchApproval,
} from "../drizzle/schema";

// ============================================================================
// WORKFLOW DE APROVAÇÃO DE DESCRIÇÃO DE CARGOS - 4 NÍVEIS
// ============================================================================

/**
 * Cria um novo workflow de aprovação
 */
export async function createJobDescriptionWorkflow(
  jobDescriptionId: number,
  approvers: {
    csSpecialistId: number;
    directLeaderId: number;
    hrManagerId: number;
    gaiDirectorId: number;
  }
): Promise<JobDescriptionWorkflow> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const workflowData: InsertJobDescriptionWorkflow = {
    jobDescriptionId,
    status: "pending_cs_specialist",
    currentLevel: 1,
    ...approvers,
  };

  const result = await db.insert(jobDescriptionWorkflow).values(workflowData);

  // Registra criação no histórico
  await logWorkflowAction(
    result[0].insertId,
    jobDescriptionId,
    "created",
    1,
    approvers.csSpecialistId,
    "Sistema",
    "admin",
    "Workflow de aprovação criado",
    "draft",
    "pending_cs_specialist"
  );

  const workflow = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.id, result[0].insertId))
    .limit(1);

  return workflow[0];
}

/**
 * Obtém workflow por ID de descrição de cargo
 */
export async function getWorkflowByJobDescriptionId(
  jobDescriptionId: number
): Promise<JobDescriptionWorkflow | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.jobDescriptionId, jobDescriptionId))
    .limit(1);

  return result[0] || null;
}

/**
 * Aprova descrição de cargo em um nível específico
 */
export async function approveJobDescription(
  workflowId: number,
  level: number,
  userId: number,
  userName: string,
  userRole: string,
  comments?: string
): Promise<JobDescriptionWorkflow> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Busca workflow atual
  const workflow = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.id, workflowId))
    .limit(1);

  if (!workflow[0]) {
    throw new Error("Workflow not found");
  }

  const currentWorkflow = workflow[0];

  // Valida se é o nível correto
  if (currentWorkflow.currentLevel !== level) {
    throw new Error(`Cannot approve at level ${level}. Current level is ${currentWorkflow.currentLevel}`);
  }

  // Prepara atualização baseada no nível
  const now = new Date();
  let updateData: any = {};
  let newStatus: string;
  let newLevel: number;

  switch (level) {
    case 1: // Especialista C&S
      updateData = {
        csSpecialistApprovedAt: now,
        csSpecialistComments: comments || null,
        currentLevel: 2,
        status: "pending_direct_leader",
      };
      newStatus = "pending_direct_leader";
      newLevel = 2;
      break;
    case 2: // Líder Direto
      updateData = {
        directLeaderApprovedAt: now,
        directLeaderComments: comments || null,
        currentLevel: 3,
        status: "pending_hr_manager",
      };
      newStatus = "pending_hr_manager";
      newLevel = 3;
      break;
    case 3: // Gerente RH
      updateData = {
        hrManagerApprovedAt: now,
        hrManagerComments: comments || null,
        currentLevel: 4,
        status: "pending_gai_director",
      };
      newStatus = "pending_gai_director";
      newLevel = 4;
      break;
    case 4: // Diretor GAI
      updateData = {
        gaiDirectorApprovedAt: now,
        gaiDirectorComments: comments || null,
        status: "approved",
        completedAt: now,
      };
      newStatus = "approved";
      newLevel = 4;
      break;
    default:
      throw new Error(`Invalid approval level: ${level}`);
  }

  // Atualiza workflow
  await db
    .update(jobDescriptionWorkflow)
    .set(updateData)
    .where(eq(jobDescriptionWorkflow.id, workflowId));

  // Registra ação no histórico
  await logWorkflowAction(
    workflowId,
    currentWorkflow.jobDescriptionId,
    "approved",
    level,
    userId,
    userName,
    userRole,
    comments,
    currentWorkflow.status,
    newStatus
  );

  // Retorna workflow atualizado
  const updatedWorkflow = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.id, workflowId))
    .limit(1);

  return updatedWorkflow[0];
}

/**
 * Rejeita descrição de cargo
 */
export async function rejectJobDescription(
  workflowId: number,
  level: number,
  userId: number,
  userName: string,
  userRole: string,
  comments: string
): Promise<JobDescriptionWorkflow> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Busca workflow atual
  const workflow = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.id, workflowId))
    .limit(1);

  if (!workflow[0]) {
    throw new Error("Workflow not found");
  }

  const currentWorkflow = workflow[0];

  // Atualiza workflow para rejeitado
  const updateData: any = {
    status: "rejected",
    completedAt: new Date(),
  };

  // Adiciona comentário no nível apropriado
  switch (level) {
    case 1:
      updateData.csSpecialistComments = comments;
      break;
    case 2:
      updateData.directLeaderComments = comments;
      break;
    case 3:
      updateData.hrManagerComments = comments;
      break;
    case 4:
      updateData.gaiDirectorComments = comments;
      break;
  }

  await db
    .update(jobDescriptionWorkflow)
    .set(updateData)
    .where(eq(jobDescriptionWorkflow.id, workflowId));

  // Registra rejeição no histórico
  await logWorkflowAction(
    workflowId,
    currentWorkflow.jobDescriptionId,
    "rejected",
    level,
    userId,
    userName,
    userRole,
    comments,
    currentWorkflow.status,
    "rejected"
  );

  // Retorna workflow atualizado
  const updatedWorkflow = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(eq(jobDescriptionWorkflow.id, workflowId))
    .limit(1);

  return updatedWorkflow[0];
}

/**
 * Registra ação no histórico do workflow
 */
async function logWorkflowAction(
  workflowId: number,
  jobDescriptionId: number,
  action: "created" | "submitted" | "approved" | "rejected" | "returned" | "cancelled",
  level: number,
  userId: number,
  userName: string,
  userRole: string,
  comments?: string,
  previousStatus?: string,
  newStatus?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  const historyData: InsertJobDescriptionWorkflowHistory = {
    workflowId,
    jobDescriptionId,
    action,
    level,
    userId,
    userName,
    userRole,
    comments: comments || null,
    previousStatus: previousStatus || null,
    newStatus: newStatus || null,
  };

  await db.insert(jobDescriptionWorkflowHistory).values(historyData);
}

/**
 * Obtém histórico de um workflow
 */
export async function getWorkflowHistory(
  workflowId: number
): Promise<JobDescriptionWorkflowHistory[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(jobDescriptionWorkflowHistory)
    .where(eq(jobDescriptionWorkflowHistory.workflowId, workflowId))
    .orderBy(desc(jobDescriptionWorkflowHistory.createdAt));
}

// ============================================================================
// APROVAÇÕES EM LOTE
// ============================================================================

/**
 * Cria lote de aprovações
 */
export async function createBatchApproval(
  approverId: number,
  approverName: string,
  approvalLevel: number,
  jobDescriptionIds: number[],
  batchComments?: string
): Promise<BatchApproval> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Gera ID único para o lote
  const batchId = `BATCH-${Date.now()}-${approverId}`;

  const batchData: InsertBatchApproval = {
    batchId,
    approverId,
    approverName,
    approvalLevel,
    jobDescriptionIds,
    totalItems: jobDescriptionIds.length,
    batchComments: batchComments || null,
  };

  const result = await db.insert(batchApprovals).values(batchData);

  const batch = await db
    .select()
    .from(batchApprovals)
    .where(eq(batchApprovals.id, result[0].insertId))
    .limit(1);

  return batch[0];
}

/**
 * Processa lote de aprovações
 */
export async function processBatchApproval(
  batchId: string,
  userId: number,
  userName: string,
  userRole: string
): Promise<BatchApproval> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Busca lote
  const batch = await db
    .select()
    .from(batchApprovals)
    .where(eq(batchApprovals.batchId, batchId))
    .limit(1);

  if (!batch[0]) {
    throw new Error("Batch not found");
  }

  const currentBatch = batch[0];

  // Atualiza status para processing
  await db
    .update(batchApprovals)
    .set({ status: "processing" })
    .where(eq(batchApprovals.batchId, batchId));

  let approvedCount = 0;
  let rejectedCount = 0;
  let failedCount = 0;

  // Processa cada descrição de cargo
  const jobDescriptionIds = currentBatch.jobDescriptionIds as number[];

  for (const jobDescriptionId of jobDescriptionIds) {
    try {
      // Busca workflow
      const workflow = await getWorkflowByJobDescriptionId(jobDescriptionId);

      if (!workflow) {
        failedCount++;
        continue;
      }

      // Aprova no nível apropriado
      await approveJobDescription(
        workflow.id,
        currentBatch.approvalLevel,
        userId,
        userName,
        userRole,
        currentBatch.batchComments || undefined
      );

      approvedCount++;
    } catch (error) {
      console.error(`[Batch] Erro ao aprovar job description ${jobDescriptionId}:`, error);
      failedCount++;
    }
  }

  // Atualiza lote com resultados
  await db
    .update(batchApprovals)
    .set({
      status: "completed",
      approvedCount,
      rejectedCount,
      failedCount,
      completedAt: new Date(),
    })
    .where(eq(batchApprovals.batchId, batchId));

  // Retorna lote atualizado
  const updatedBatch = await db
    .select()
    .from(batchApprovals)
    .where(eq(batchApprovals.batchId, batchId))
    .limit(1);

  return updatedBatch[0];
}

/**
 * Obtém lotes de aprovação por aprovador
 */
export async function getBatchApprovalsByApprover(approverId: number): Promise<BatchApproval[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(batchApprovals)
    .where(eq(batchApprovals.approverId, approverId))
    .orderBy(desc(batchApprovals.createdAt));
}

/**
 * Obtém descrições de cargo pendentes de aprovação para um nível específico
 */
export async function getPendingJobDescriptionsByLevel(
  level: number,
  approverId: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  // Mapeia nível para status
  const statusMap: Record<number, string> = {
    1: "pending_cs_specialist",
    2: "pending_direct_leader",
    3: "pending_hr_manager",
    4: "pending_gai_director",
  };

  const status = statusMap[level];
  if (!status) {
    return [];
  }

  // Mapeia nível para campo de aprovador
  const approverFieldMap: Record<number, string> = {
    1: "csSpecialistId",
    2: "directLeaderId",
    3: "hrManagerId",
    4: "gaiDirectorId",
  };

  const approverField = approverFieldMap[level];

  // Busca workflows pendentes
  const workflows = await db
    .select()
    .from(jobDescriptionWorkflow)
    .where(
      and(
        eq(jobDescriptionWorkflow.status, status as any),
        eq(sql`${jobDescriptionWorkflow[approverField as keyof typeof jobDescriptionWorkflow]}`, approverId)
      )
    );

  // Busca descrições de cargo correspondentes
  const jobDescriptionIds = workflows.map((w) => w.jobDescriptionId);

  if (jobDescriptionIds.length === 0) {
    return [];
  }

  const descriptions = await db
    .select()
    .from(jobDescriptions)
    .where(inArray(jobDescriptions.id, jobDescriptionIds));

  // Combina workflows com descrições
  return descriptions.map((desc) => {
    const workflow = workflows.find((w) => w.jobDescriptionId === desc.id);
    return {
      ...desc,
      workflow,
    };
  });
}
