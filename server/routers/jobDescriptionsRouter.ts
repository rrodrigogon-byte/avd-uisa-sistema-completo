import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  jobDescriptions, 
  jobResponsibilities, 
  jobKnowledge, 
  jobCompetencies,
  jobDescriptionApprovals,
  employeeActivities,
  activityLogs
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Router de Descrição de Cargos - Template UISA
 * Workflow: Ocupante → Superior Imediato → Gerente RH
 */
export const jobDescriptionsRouter = router({
  /**
   * Listar descrições de cargo com filtros
   */
  list: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      status: z.enum(['draft', 'pending_occupant', 'pending_manager', 'pending_hr', 'approved', 'rejected']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(jobDescriptions);

      if (input?.departmentId) {
        query = query.where(eq(jobDescriptions.departmentId, input.departmentId)) as any;
      }

      if (input?.status) {
        query = query.where(eq(jobDescriptions.status, input.status)) as any;
      }

      const results = await query.orderBy(desc(jobDescriptions.createdAt));
      return results;
    }),

  /**
   * Buscar descrição de cargo por ID com todas as relações
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [jobDesc] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, input.id));
      if (!jobDesc) throw new Error("Descrição de cargo não encontrada");

      const responsibilities = await db.select().from(jobResponsibilities).where(eq(jobResponsibilities.jobDescriptionId, input.id));
      const knowledge = await db.select().from(jobKnowledge).where(eq(jobKnowledge.jobDescriptionId, input.id));
      const competencies = await db.select().from(jobCompetencies).where(eq(jobCompetencies.jobDescriptionId, input.id));
      const approvals = await db.select().from(jobDescriptionApprovals).where(eq(jobDescriptionApprovals.jobDescriptionId, input.id));

      return {
        ...jobDesc,
        responsibilities,
        knowledge,
        competencies,
        approvals,
      };
    }),

  /**
   * Criar descrição de cargo
   */
  create: protectedProcedure
    .input(z.object({
      positionId: z.number(),
      positionTitle: z.string(),
      departmentId: z.number(),
      departmentName: z.string(),
      cbo: z.string().optional(),
      division: z.string().optional(),
      reportsTo: z.string().optional(),
      revision: z.string().optional(),
      mainObjective: z.string(),
      mandatoryTraining: z.array(z.string()).optional(),
      educationLevel: z.string().optional(),
      requiredExperience: z.string().optional(),
      eSocialSpecs: z.string().optional(),
      responsibilities: z.array(z.object({
        category: z.string(),
        description: z.string(),
        displayOrder: z.number().default(0),
      })),
      knowledge: z.array(z.object({
        name: z.string(),
        level: z.enum(['basico', 'intermediario', 'avancado', 'obrigatorio']),
        displayOrder: z.number().default(0),
      })),
      competencies: z.array(z.object({
        name: z.string(),
        type: z.enum(['competencia', 'habilidade']).default('competencia'),
        displayOrder: z.number().default(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar descrição de cargo
      const [jobDesc] = await db.insert(jobDescriptions).values({
        positionId: input.positionId,
        positionTitle: input.positionTitle,
        departmentId: input.departmentId,
        departmentName: input.departmentName,
        cbo: input.cbo,
        division: input.division,
        reportsTo: input.reportsTo,
        revision: input.revision,
        mainObjective: input.mainObjective,
        mandatoryTraining: input.mandatoryTraining ? JSON.stringify(input.mandatoryTraining) : null,
        educationLevel: input.educationLevel,
        requiredExperience: input.requiredExperience,
        eSocialSpecs: input.eSocialSpecs,
        status: 'draft',
        createdById: ctx.user.id,
      });

      const jobDescId = jobDesc.insertId;

      // Inserir responsabilidades
      if (input.responsibilities.length > 0) {
        await db.insert(jobResponsibilities).values(
          input.responsibilities.map(r => ({
            jobDescriptionId: jobDescId,
            category: r.category,
            description: r.description,
            displayOrder: r.displayOrder,
          }))
        );
      }

      // Inserir conhecimentos
      if (input.knowledge.length > 0) {
        await db.insert(jobKnowledge).values(
          input.knowledge.map(k => ({
            jobDescriptionId: jobDescId,
            name: k.name,
            level: k.level,
            displayOrder: k.displayOrder,
          }))
        );
      }

      // Inserir competências
      if (input.competencies.length > 0) {
        await db.insert(jobCompetencies).values(
          input.competencies.map(c => ({
            jobDescriptionId: jobDescId,
            name: c.name,
            type: c.type,
            displayOrder: c.displayOrder,
          }))
        );
      }

      return { id: jobDescId, success: true };
    }),

  /**
   * Atualizar descrição de cargo
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      positionTitle: z.string().optional(),
      departmentName: z.string().optional(),
      cbo: z.string().optional(),
      division: z.string().optional(),
      reportsTo: z.string().optional(),
      revision: z.string().optional(),
      mainObjective: z.string().optional(),
      mandatoryTraining: z.array(z.string()).optional(),
      educationLevel: z.string().optional(),
      requiredExperience: z.string().optional(),
      eSocialSpecs: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.positionTitle) updateData.positionTitle = input.positionTitle;
      if (input.departmentName) updateData.departmentName = input.departmentName;
      if (input.cbo) updateData.cbo = input.cbo;
      if (input.division) updateData.division = input.division;
      if (input.reportsTo) updateData.reportsTo = input.reportsTo;
      if (input.revision) updateData.revision = input.revision;
      if (input.mainObjective) updateData.mainObjective = input.mainObjective;
      if (input.mandatoryTraining) updateData.mandatoryTraining = JSON.stringify(input.mandatoryTraining);
      if (input.educationLevel) updateData.educationLevel = input.educationLevel;
      if (input.requiredExperience) updateData.requiredExperience = input.requiredExperience;
      if (input.eSocialSpecs) updateData.eSocialSpecs = input.eSocialSpecs;

      await db.update(jobDescriptions).set(updateData).where(eq(jobDescriptions.id, input.id));

      return { success: true };
    }),

  /**
   * Enviar para aprovação
   */
  submitForApproval: protectedProcedure
    .input(z.object({
      id: z.number(),
      occupantId: z.number(), // ID do ocupante do cargo
      managerId: z.number(), // ID do superior imediato
      hrManagerId: z.number(), // ID do gerente de RH
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar status para pending_occupant
      await db.update(jobDescriptions).set({ status: 'pending_occupant' }).where(eq(jobDescriptions.id, input.id));

      // Criar registros de aprovação para os 3 níveis
      await db.insert(jobDescriptionApprovals).values([
        {
          jobDescriptionId: input.id,
          approvalLevel: 'occupant',
          approverId: input.occupantId,
          approverName: 'Ocupante do Cargo',
          status: 'pending',
        },
        {
          jobDescriptionId: input.id,
          approvalLevel: 'manager',
          approverId: input.managerId,
          approverName: 'Superior Imediato',
          status: 'pending',
        },
        {
          jobDescriptionId: input.id,
          approvalLevel: 'hr',
          approverId: input.hrManagerId,
          approverName: 'Gerente de RH',
          status: 'pending',
        },
      ]);

      // TODO: Enviar notificação por email para o ocupante

      return { success: true };
    }),

  /**
   * Aprovar descrição de cargo
   */
  approve: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar aprovação
      await db.update(jobDescriptionApprovals).set({
        status: 'approved',
        comments: input.comments,
        decidedAt: new Date(),
      }).where(eq(jobDescriptionApprovals.id, input.approvalId));

      // Buscar aprovação para saber o nível
      const [approval] = await db.select().from(jobDescriptionApprovals).where(eq(jobDescriptionApprovals.id, input.approvalId));

      if (!approval) throw new Error("Aprovação não encontrada");

      // Atualizar status da descrição de cargo
      let newStatus: any = 'draft';
      if (approval.approvalLevel === 'occupant') {
        newStatus = 'pending_manager';
      } else if (approval.approvalLevel === 'manager') {
        newStatus = 'pending_hr';
      } else if (approval.approvalLevel === 'hr') {
        newStatus = 'approved';
        await db.update(jobDescriptions).set({ 
          status: newStatus,
          approvedAt: new Date(),
        }).where(eq(jobDescriptions.id, approval.jobDescriptionId));
        return { success: true };
      }

      await db.update(jobDescriptions).set({ status: newStatus }).where(eq(jobDescriptions.id, approval.jobDescriptionId));

      // TODO: Enviar notificação para próximo aprovador

      return { success: true };
    }),

  /**
   * Rejeitar descrição de cargo
   */
  reject: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      comments: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar aprovação
      await db.update(jobDescriptionApprovals).set({
        status: 'rejected',
        comments: input.comments,
        decidedAt: new Date(),
      }).where(eq(jobDescriptionApprovals.id, input.approvalId));

      // Buscar aprovação
      const [approval] = await db.select().from(jobDescriptionApprovals).where(eq(jobDescriptionApprovals.id, input.approvalId));

      if (!approval) throw new Error("Aprovação não encontrada");

      // Atualizar status da descrição de cargo para rejected
      await db.update(jobDescriptions).set({ status: 'rejected' }).where(eq(jobDescriptions.id, approval.jobDescriptionId));

      // TODO: Enviar notificação para criador

      return { success: true };
    }),

  /**
   * Histórico de aprovações
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const approvals = await db.select().from(jobDescriptionApprovals).where(eq(jobDescriptionApprovals.jobDescriptionId, input.jobDescriptionId));

      return approvals;
    }),

  /**
   * Registrar atividade manual
   */
  addActivity: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      jobDescriptionId: z.number().optional(),
      responsibilityId: z.number().optional(),
      title: z.string(),
      description: z.string().optional(),
      category: z.enum(['reuniao', 'analise', 'planejamento', 'execucao', 'suporte', 'outros']),
      activityDate: z.string(), // ISO date
      startTime: z.string(), // HH:MM
      endTime: z.string(), // HH:MM
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calcular duração em minutos
      const [startHour, startMin] = input.startTime.split(':').map(Number);
      const [endHour, endMin] = input.endTime.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      await db.insert(employeeActivities).values({
        employeeId: input.employeeId,
        jobDescriptionId: input.jobDescriptionId,
        responsibilityId: input.responsibilityId,
        title: input.title,
        description: input.description,
        category: input.category,
        activityDate: new Date(input.activityDate),
        startTime: input.startTime,
        endTime: input.endTime,
        durationMinutes,
      });

      return { success: true };
    }),

  /**
   * Buscar atividades do funcionário
   */
  getActivities: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      category: z.enum(['reuniao', 'analise', 'planejamento', 'execucao', 'suporte', 'outros']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(employeeActivities).where(eq(employeeActivities.employeeId, input.employeeId));

      // TODO: Adicionar filtros de data e categoria

      const activities = await query.orderBy(desc(employeeActivities.activityDate));

      return activities;
    }),
});
