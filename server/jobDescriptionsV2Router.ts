import { TRPCError } from "@trpc/server";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import {
  jobDescriptions,
  jobDescriptionWorkflow,
  jobDescriptionWorkflowHistory,
  batchApprovals,
  employees,
  departments,
  positions,
  type InsertJobDescription,
  type InsertJobDescriptionWorkflow,
  type InsertJobDescriptionWorkflowHistory,
} from "../drizzle/schema";
import { sendEmail } from "./emailService";

/**
 * Router V2 de Descrições de Cargo
 * Sistema completo com workflow de aprovação hierárquico de 4 níveis
 * 
 * Fluxo de Aprovação:
 * 1. Líder da Vaga
 * 2. Especialista em Cargos e Salários
 * 3. Gerente de RH
 * 4. Diretor (Rodrigo Gonçalves)
 */

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const jobDescriptionSchema = z.object({
  // Identificação
  positionId: z.number(),
  positionTitle: z.string().min(1),
  positionCode: z.string().optional(),
  departmentId: z.number(),
  departmentName: z.string(),
  division: z.string().optional(),
  hierarchyLevel: z.enum(["junior", "pleno", "senior", "coordenacao", "gerencia", "diretoria"]).optional(),
  cbo: z.string().optional(),
  
  // Missão e Objetivo
  mission: z.string().min(10, "Missão deve ter pelo menos 10 caracteres"),
  strategicObjective: z.string().optional(),
  
  // Relacionamentos
  reportsTo: z.string().optional(),
  subordinates: z.array(z.string()).optional(),
  internalInterfaces: z.array(z.string()).optional(),
  externalClients: z.string().optional(),
  suppliers: z.string().optional(),
  
  // Requisitos Técnicos
  educationLevel: z.string().optional(),
  minimumExperienceYears: z.number().optional(),
  requiredExperience: z.string().optional(),
  languages: z.array(z.object({
    idioma: z.string(),
    nivel: z.enum(["basico", "intermediario", "avancado", "fluente"])
  })).optional(),
  certifications: z.array(z.string()).optional(),
  mandatoryTraining: z.array(z.string()).optional(),
  
  // Indicadores de Desempenho
  kpis: z.array(z.string()).optional(),
  quantitativeGoals: z.array(z.object({
    metrica: z.string(),
    valor: z.string()
  })).optional(),
  
  // Condições de Trabalho
  workSchedule: z.string().optional(),
  workLocation: z.enum(["presencial", "hibrido", "remoto"]).optional(),
  travelFrequency: z.string().optional(),
  specialConditions: z.string().optional(),
  eSocialSpecs: z.string().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const jobDescriptionsV2Router = router({
  
  // ==========================================================================
  // CRUD BÁSICO
  // ==========================================================================
  
  /**
   * Listar todas as descrições de cargo com filtros
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "pending_leader", "pending_cs_specialist", "pending_hr_manager", "pending_director", "approved", "rejected"]).optional(),
      departmentId: z.number().optional(),
      hierarchyLevel: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const conditions = [];
      
      if (input?.status) {
        conditions.push(eq(jobDescriptions.status, input.status));
      }
      
      if (input?.departmentId) {
        conditions.push(eq(jobDescriptions.departmentId, input.departmentId));
      }
      
      if (input?.hierarchyLevel) {
        conditions.push(eq(jobDescriptions.hierarchyLevel, input.hierarchyLevel as any));
      }
      
      if (input?.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(
          or(
            sql`${jobDescriptions.positionTitle} LIKE ${searchPattern}`,
            sql`${jobDescriptions.positionCode} LIKE ${searchPattern}`,
            sql`${jobDescriptions.departmentName} LIKE ${searchPattern}`
          )
        );
      }
      
      let query = db.select().from(jobDescriptions);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query
        .orderBy(desc(jobDescriptions.createdAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);
      
      return results;
    }),
  
  /**
   * Buscar descrição de cargo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const result = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, input.id))
        .limit(1);
      
      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Descrição de cargo não encontrada" });
      }
      
      // Buscar workflow se existir
      const workflow = await db
        .select()
        .from(jobDescriptionWorkflow)
        .where(eq(jobDescriptionWorkflow.jobDescriptionId, input.id))
        .limit(1);
      
      return {
        ...result[0],
        workflow: workflow[0] || null
      };
    }),
  
  /**
   * Criar nova descrição de cargo (rascunho)
   */
  create: protectedProcedure
    .input(jobDescriptionSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const data: InsertJobDescription = {
        ...input,
        status: "draft",
        currentApprovalLevel: 0,
        versionNumber: 1,
        createdById: ctx.user.id,
      };
      
      const result = await db.insert(jobDescriptions).values(data);
      
      return {
        id: result[0].insertId,
        success: true
      };
    }),
  
  /**
   * Atualizar descrição de cargo (apenas rascunhos)
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: jobDescriptionSchema.partial()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se existe e se está em rascunho
      const existing = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, input.id))
        .limit(1);
      
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Descrição de cargo não encontrada" });
      }
      
      if (existing[0].status !== "draft") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Apenas descrições em rascunho podem ser editadas" 
        });
      }
      
      await db
        .update(jobDescriptions)
        .set({
          ...input.data,
          updatedAt: new Date()
        })
        .where(eq(jobDescriptions.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Deletar descrição de cargo (apenas rascunhos)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se está em rascunho
      const existing = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, input.id))
        .limit(1);
      
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Descrição de cargo não encontrada" });
      }
      
      if (existing[0].status !== "draft") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Apenas descrições em rascunho podem ser deletadas" 
        });
      }
      
      await db.delete(jobDescriptions).where(eq(jobDescriptions.id, input.id));
      
      return { success: true };
    }),
  
  // ==========================================================================
  // WORKFLOW DE APROVAÇÃO
  // ==========================================================================
  
  /**
   * Submeter descrição para aprovação (inicia workflow)
   */
  submit: protectedProcedure
    .input(z.object({
      id: z.number(),
      leaderId: z.number(),
      csSpecialistId: z.number(),
      hrManagerId: z.number(),
      directorId: z.number(),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se descrição existe e está em rascunho
      const description = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, input.id))
        .limit(1);
      
      if (!description[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Descrição de cargo não encontrada" });
      }
      
      if (description[0].status !== "draft") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Descrição já foi submetida para aprovação" 
        });
      }
      
      // Atualizar status da descrição
      await db
        .update(jobDescriptions)
        .set({
          status: "pending_leader",
          currentApprovalLevel: 1,
          approvalDeadline: input.deadline || null,
          updatedAt: new Date()
        })
        .where(eq(jobDescriptions.id, input.id));
      
      // Criar workflow
      const workflowData: InsertJobDescriptionWorkflow = {
        jobDescriptionId: input.id,
        status: "pending_leader",
        currentLevel: 1,
        leaderId: input.leaderId,
        csSpecialistId: input.csSpecialistId,
        hrManagerId: input.hrManagerId,
        directorId: input.directorId,
        approvalDeadline: input.deadline || null,
        submittedAt: new Date(),
      };
      
      const workflowResult = await db.insert(jobDescriptionWorkflow).values(workflowData);
      
      // Registrar no histórico
      const historyData: InsertJobDescriptionWorkflowHistory = {
        workflowId: workflowResult[0].insertId,
        jobDescriptionId: input.id,
        action: "submitted",
        level: 1,
        userId: ctx.user.id,
        userName: ctx.user.name || "",
        userRole: ctx.user.role,
        comments: "Descrição submetida para aprovação",
        previousStatus: "draft",
        newStatus: "pending_leader",
      };
      
      await db.insert(jobDescriptionWorkflowHistory).values(historyData);
      
      // Enviar notificação para o líder
      await sendApprovalNotification(
        db,
        input.leaderId,
        description[0].positionTitle,
        1,
        "pending_leader"
      );
      
      return { success: true, workflowId: workflowResult[0].insertId };
    }),
  
  /**
   * Aprovar no nível atual
   */
  approve: protectedProcedure
    .input(z.object({
      jobDescriptionId: z.number(),
      comments: z.string().optional(),
      complementData: z.record(z.any()).optional(), // Dados complementares adicionados pelo aprovador
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar workflow
      const workflow = await db
        .select()
        .from(jobDescriptionWorkflow)
        .where(eq(jobDescriptionWorkflow.jobDescriptionId, input.jobDescriptionId))
        .limit(1);
      
      if (!workflow[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow não encontrado" });
      }
      
      const currentLevel = workflow[0].currentLevel;
      const currentStatus = workflow[0].status;
      
      // Verificar se usuário é o aprovador do nível atual
      const approverField = getApproverField(currentLevel);
      const approverId = workflow[0][approverField as keyof typeof workflow[0]] as number;
      
      if (approverId !== ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Você não tem permissão para aprovar neste nível" 
        });
      }
      
      // Determinar próximo nível e status
      const nextLevel = currentLevel + 1;
      const nextStatus = getNextStatus(nextLevel);
      const isLastLevel = nextLevel > 4;
      
      // Atualizar workflow
      const workflowUpdate: any = {
        currentLevel: isLastLevel ? 4 : nextLevel,
        status: isLastLevel ? "approved" : nextStatus,
        updatedAt: new Date(),
      };
      
      // Atualizar status e comentários do nível atual
      const statusField = getStatusField(currentLevel);
      const commentsField = getCommentsField(currentLevel);
      const approvedAtField = getApprovedAtField(currentLevel);
      
      workflowUpdate[statusField] = "approved";
      workflowUpdate[commentsField] = input.comments || null;
      workflowUpdate[approvedAtField] = new Date();
      
      if (isLastLevel) {
        workflowUpdate.completedAt = new Date();
      }
      
      await db
        .update(jobDescriptionWorkflow)
        .set(workflowUpdate)
        .where(eq(jobDescriptionWorkflow.id, workflow[0].id));
      
      // Atualizar descrição de cargo
      const descriptionUpdate: any = {
        status: isLastLevel ? "approved" : nextStatus,
        currentApprovalLevel: isLastLevel ? 4 : nextLevel,
        updatedAt: new Date(),
      };
      
      // Adicionar comentários do aprovador
      const descCommentsField = getDescriptionCommentsField(currentLevel);
      descriptionUpdate[descCommentsField] = input.comments || null;
      
      // Adicionar dados complementares se fornecidos
      if (input.complementData) {
        Object.assign(descriptionUpdate, input.complementData);
      }
      
      if (isLastLevel) {
        descriptionUpdate.approvedAt = new Date();
      }
      
      await db
        .update(jobDescriptions)
        .set(descriptionUpdate)
        .where(eq(jobDescriptions.id, input.jobDescriptionId));
      
      // Registrar no histórico
      const historyData: InsertJobDescriptionWorkflowHistory = {
        workflowId: workflow[0].id,
        jobDescriptionId: input.jobDescriptionId,
        action: "approved",
        level: currentLevel,
        userId: ctx.user.id,
        userName: ctx.user.name || "",
        userRole: ctx.user.role,
        comments: input.comments || null,
        previousStatus: currentStatus,
        newStatus: isLastLevel ? "approved" : nextStatus,
      };
      
      await db.insert(jobDescriptionWorkflowHistory).values(historyData);
      
      // Enviar notificação para próximo aprovador (se não for último nível)
      if (!isLastLevel) {
        const nextApproverField = getApproverField(nextLevel);
        const nextApproverId = workflow[0][nextApproverField as keyof typeof workflow[0]] as number;
        
        const description = await db
          .select()
          .from(jobDescriptions)
          .where(eq(jobDescriptions.id, input.jobDescriptionId))
          .limit(1);
        
        await sendApprovalNotification(
          db,
          nextApproverId,
          description[0].positionTitle,
          nextLevel,
          nextStatus
        );
      }
      
      return { 
        success: true, 
        isComplete: isLastLevel,
        nextLevel: isLastLevel ? null : nextLevel 
      };
    }),
  
  /**
   * Rejeitar no nível atual
   */
  reject: protectedProcedure
    .input(z.object({
      jobDescriptionId: z.number(),
      comments: z.string().min(10, "Comentário obrigatório ao rejeitar (mínimo 10 caracteres)"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar workflow
      const workflow = await db
        .select()
        .from(jobDescriptionWorkflow)
        .where(eq(jobDescriptionWorkflow.jobDescriptionId, input.jobDescriptionId))
        .limit(1);
      
      if (!workflow[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow não encontrado" });
      }
      
      const currentLevel = workflow[0].currentLevel;
      const currentStatus = workflow[0].status;
      
      // Verificar se usuário é o aprovador do nível atual
      const approverField = getApproverField(currentLevel);
      const approverId = workflow[0][approverField as keyof typeof workflow[0]] as number;
      
      if (approverId !== ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Você não tem permissão para rejeitar neste nível" 
        });
      }
      
      // Atualizar workflow
      const workflowUpdate: any = {
        status: "rejected",
        updatedAt: new Date(),
        completedAt: new Date(),
      };
      
      const statusField = getStatusField(currentLevel);
      const commentsField = getCommentsField(currentLevel);
      
      workflowUpdate[statusField] = "rejected";
      workflowUpdate[commentsField] = input.comments;
      
      await db
        .update(jobDescriptionWorkflow)
        .set(workflowUpdate)
        .where(eq(jobDescriptionWorkflow.id, workflow[0].id));
      
      // Atualizar descrição de cargo
      const descCommentsField = getDescriptionCommentsField(currentLevel);
      
      await db
        .update(jobDescriptions)
        .set({
          status: "rejected",
          [descCommentsField]: input.comments,
          updatedAt: new Date(),
        })
        .where(eq(jobDescriptions.id, input.jobDescriptionId));
      
      // Registrar no histórico
      const historyData: InsertJobDescriptionWorkflowHistory = {
        workflowId: workflow[0].id,
        jobDescriptionId: input.jobDescriptionId,
        action: "rejected",
        level: currentLevel,
        userId: ctx.user.id,
        userName: ctx.user.name || "",
        userRole: ctx.user.role,
        comments: input.comments,
        previousStatus: currentStatus,
        newStatus: "rejected",
      };
      
      await db.insert(jobDescriptionWorkflowHistory).values(historyData);
      
      // Enviar notificação para o criador
      const description = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, input.jobDescriptionId))
        .limit(1);
      
      await sendRejectionNotification(
        db,
        description[0].createdById,
        description[0].positionTitle,
        currentLevel,
        input.comments
      );
      
      return { success: true };
    }),
  
  /**
   * Buscar aprovações pendentes para o usuário atual
   */
  getPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const userId = ctx.user.id;
      
      // Buscar workflows onde o usuário é aprovador no nível atual
      const workflows = await db
        .select()
        .from(jobDescriptionWorkflow)
        .where(
          or(
            and(
              eq(jobDescriptionWorkflow.currentLevel, 1),
              eq(jobDescriptionWorkflow.leaderId, userId),
              eq(jobDescriptionWorkflow.leaderStatus, "pending")
            ),
            and(
              eq(jobDescriptionWorkflow.currentLevel, 2),
              eq(jobDescriptionWorkflow.csSpecialistId, userId),
              eq(jobDescriptionWorkflow.csSpecialistStatus, "pending")
            ),
            and(
              eq(jobDescriptionWorkflow.currentLevel, 3),
              eq(jobDescriptionWorkflow.hrManagerId, userId),
              eq(jobDescriptionWorkflow.hrManagerStatus, "pending")
            ),
            and(
              eq(jobDescriptionWorkflow.currentLevel, 4),
              eq(jobDescriptionWorkflow.directorId, userId),
              eq(jobDescriptionWorkflow.directorStatus, "pending")
            )
          )
        );
      
      if (workflows.length === 0) {
        return [];
      }
      
      // Buscar descrições correspondentes
      const jobDescriptionIds = workflows.map(w => w.jobDescriptionId);
      const descriptions = await db
        .select()
        .from(jobDescriptions)
        .where(inArray(jobDescriptions.id, jobDescriptionIds));
      
      // Combinar dados
      return descriptions.map(desc => {
        const workflow = workflows.find(w => w.jobDescriptionId === desc.id);
        return {
          ...desc,
          workflow
        };
      });
    }),
  
  /**
   * Buscar histórico de aprovação
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar workflow
      const workflow = await db
        .select()
        .from(jobDescriptionWorkflow)
        .where(eq(jobDescriptionWorkflow.jobDescriptionId, input.jobDescriptionId))
        .limit(1);
      
      if (!workflow[0]) {
        return [];
      }
      
      // Buscar histórico
      const history = await db
        .select()
        .from(jobDescriptionWorkflowHistory)
        .where(eq(jobDescriptionWorkflowHistory.workflowId, workflow[0].id))
        .orderBy(desc(jobDescriptionWorkflowHistory.createdAt));
      
      return history;
    }),
  
  // ==========================================================================
  // APROVAÇÃO EM LOTE
  // ==========================================================================
  
  /**
   * Aprovar múltiplas descrições em lote
   */
  batchApprove: protectedProcedure
    .input(z.object({
      jobDescriptionIds: z.array(z.number()).min(1),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const jobDescriptionId of input.jobDescriptionIds) {
        try {
          // Buscar workflow
          const workflow = await db
            .select()
            .from(jobDescriptionWorkflow)
            .where(eq(jobDescriptionWorkflow.jobDescriptionId, jobDescriptionId))
            .limit(1);
          
          if (!workflow[0]) {
            results.failed++;
            results.errors.push(`Workflow não encontrado para descrição ${jobDescriptionId}`);
            continue;
          }
          
          const currentLevel = workflow[0].currentLevel;
          const approverField = getApproverField(currentLevel);
          const approverId = workflow[0][approverField as keyof typeof workflow[0]] as number;
          
          if (approverId !== ctx.user.id) {
            results.failed++;
            results.errors.push(`Sem permissão para aprovar descrição ${jobDescriptionId}`);
            continue;
          }
          
          // Aprovar (reutilizar lógica do approve)
          const nextLevel = currentLevel + 1;
          const nextStatus = getNextStatus(nextLevel);
          const isLastLevel = nextLevel > 4;
          
          const workflowUpdate: any = {
            currentLevel: isLastLevel ? 4 : nextLevel,
            status: isLastLevel ? "approved" : nextStatus,
            updatedAt: new Date(),
          };
          
          const statusField = getStatusField(currentLevel);
          const commentsField = getCommentsField(currentLevel);
          const approvedAtField = getApprovedAtField(currentLevel);
          
          workflowUpdate[statusField] = "approved";
          workflowUpdate[commentsField] = input.comments || null;
          workflowUpdate[approvedAtField] = new Date();
          
          if (isLastLevel) {
            workflowUpdate.completedAt = new Date();
          }
          
          await db
            .update(jobDescriptionWorkflow)
            .set(workflowUpdate)
            .where(eq(jobDescriptionWorkflow.id, workflow[0].id));
          
          // Atualizar descrição
          const descriptionUpdate: any = {
            status: isLastLevel ? "approved" : nextStatus,
            currentApprovalLevel: isLastLevel ? 4 : nextLevel,
            updatedAt: new Date(),
          };
          
          const descCommentsField = getDescriptionCommentsField(currentLevel);
          descriptionUpdate[descCommentsField] = input.comments || null;
          
          if (isLastLevel) {
            descriptionUpdate.approvedAt = new Date();
          }
          
          await db
            .update(jobDescriptions)
            .set(descriptionUpdate)
            .where(eq(jobDescriptions.id, jobDescriptionId));
          
          // Registrar no histórico
          const historyData: InsertJobDescriptionWorkflowHistory = {
            workflowId: workflow[0].id,
            jobDescriptionId,
            action: "approved",
            level: currentLevel,
            userId: ctx.user.id,
            userName: ctx.user.name || "",
            userRole: ctx.user.role,
            comments: `Aprovação em lote: ${input.comments || ""}`,
            previousStatus: workflow[0].status,
            newStatus: isLastLevel ? "approved" : nextStatus,
          };
          
          await db.insert(jobDescriptionWorkflowHistory).values(historyData);
          
          results.success++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao aprovar descrição ${jobDescriptionId}: ${error}`);
        }
      }
      
      return results;
    }),
  
  // ==========================================================================
  // ESTATÍSTICAS E DASHBOARD
  // ==========================================================================
  
  /**
   * Obter estatísticas de descrições de cargo
   */
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobDescriptions);
      
      const byStatus = await db
        .select({
          status: jobDescriptions.status,
          count: sql<number>`count(*)`
        })
        .from(jobDescriptions)
        .groupBy(jobDescriptions.status);
      
      const byLevel = await db
        .select({
          level: jobDescriptions.hierarchyLevel,
          count: sql<number>`count(*)`
        })
        .from(jobDescriptions)
        .groupBy(jobDescriptions.hierarchyLevel);
      
      return {
        total: total[0]?.count || 0,
        byStatus,
        byLevel
      };
    }),
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getApproverField(level: number): string {
  switch (level) {
    case 1: return "leaderId";
    case 2: return "csSpecialistId";
    case 3: return "hrManagerId";
    case 4: return "directorId";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

function getStatusField(level: number): string {
  switch (level) {
    case 1: return "leaderStatus";
    case 2: return "csSpecialistStatus";
    case 3: return "hrManagerStatus";
    case 4: return "directorStatus";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

function getCommentsField(level: number): string {
  switch (level) {
    case 1: return "leaderComments";
    case 2: return "csSpecialistComments";
    case 3: return "hrManagerComments";
    case 4: return "directorComments";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

function getApprovedAtField(level: number): string {
  switch (level) {
    case 1: return "leaderApprovedAt";
    case 2: return "csSpecialistApprovedAt";
    case 3: return "hrManagerApprovedAt";
    case 4: return "directorApprovedAt";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

function getDescriptionCommentsField(level: number): string {
  switch (level) {
    case 1: return "leaderComments";
    case 2: return "specialistComments";
    case 3: return "hrManagerComments";
    case 4: return "directorComments";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

function getNextStatus(level: number): string {
  switch (level) {
    case 1: return "pending_leader";
    case 2: return "pending_cs_specialist";
    case 3: return "pending_hr_manager";
    case 4: return "pending_director";
    case 5: return "approved";
    default: throw new Error(`Invalid level: ${level}`);
  }
}

async function sendApprovalNotification(
  db: any,
  approverId: number,
  positionTitle: string,
  level: number,
  status: string
) {
  try {
    const { notifications } = await import("../drizzle/schema");
    
    const levelNames = ["", "Líder da Vaga", "Especialista C&S", "Gerente RH", "Diretor"];
    const levelName = levelNames[level] || "Aprovador";
    
    await db.insert(notifications).values({
      userId: approverId,
      type: "job_description_approval",
      title: `📋 Descrição de Cargo Aguardando Aprovação`,
      message: `A descrição do cargo "${positionTitle}" aguarda sua aprovação como ${levelName}.`,
      link: `/descricoes-cargo/aprovar`,
      read: false,
    });
    
    console.log(`[JobDescriptionsV2] Notificação enviada para aprovador ID ${approverId}`);
  } catch (error) {
    console.error("[JobDescriptionsV2] Erro ao enviar notificação:", error);
  }
}

async function sendRejectionNotification(
  db: any,
  creatorId: number,
  positionTitle: string,
  level: number,
  comments: string
) {
  try {
    const { notifications } = await import("../drizzle/schema");
    
    const levelNames = ["", "Líder da Vaga", "Especialista C&S", "Gerente RH", "Diretor"];
    const levelName = levelNames[level] || "Aprovador";
    
    await db.insert(notifications).values({
      userId: creatorId,
      type: "job_description_rejection",
      title: `❌ Descrição de Cargo Rejeitada`,
      message: `A descrição do cargo "${positionTitle}" foi rejeitada pelo ${levelName}. Motivo: ${comments}`,
      link: `/descricoes-cargo`,
      read: false,
    });
    
    console.log(`[JobDescriptionsV2] Notificação de rejeição enviada para criador ID ${creatorId}`);
  } catch (error) {
    console.error("[JobDescriptionsV2] Erro ao enviar notificação:", error);
  }
}
