import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { 
  pdiPlans, 
  pdiKpis, 
  pdiRemunerationStrategy, 
  pdiRemunerationMovements,
  pdiActionPlan702010,
  pdiResponsibilities,
  pdiSignatures,
  pdiTimeline,
  pdiIntelligentDetails,
  pdiCompetencyGaps,
  pdiImportHistory,
  pdiEditHistory,
  employees,
  departments,
  positions
} from "../../drizzle/schema";
import { eq, and, desc, or, like, gte, lte, inArray, sql } from "drizzle-orm";
import { parsePDIHtml } from "../pdiHtmlParser";

/**
 * Router de PDI (Plano de Desenvolvimento Individual)
 * Gerencia PDIs completos com todos os campos dos modelos Wilson/Fernando
 */
export const pdiRouter = router({
  /**
   * Listar todos os PDIs
   */
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db.select({
        id: pdiPlans.id,
        employeeId: pdiPlans.employeeId,
        employeeName: employees.name,
        employeePosition: employees.cargo,
        status: pdiPlans.status,
        startDate: pdiPlans.startDate,
        endDate: pdiPlans.endDate,
        overallProgress: pdiPlans.overallProgress,
        createdAt: pdiPlans.createdAt,
      })
      .from(pdiPlans)
      .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
      .orderBy(desc(pdiPlans.createdAt))
      .$dynamic();

      if (input.employeeId) {
        query = query.where(eq(pdiPlans.employeeId, input.employeeId));
      }
      if (input.status) {
        query = query.where(eq(pdiPlans.status, input.status));
      }

      const plans = await query;
      return plans;
    }),

  /**
   * Buscar PDI por ID com todos os dados relacionados
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar plano principal
      const [plan] = await db.select()
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(eq(pdiPlans.id, input.id));

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
      }

      // Buscar KPIs
      const [kpis] = await db.select().from(pdiKpis).where(eq(pdiKpis.planId, input.id));

      // Buscar estratégia de remuneração e movimentos
      const [remunerationStrategy] = await db.select()
        .from(pdiRemunerationStrategy)
        .where(eq(pdiRemunerationStrategy.planId, input.id));

      let remunerationMovements: any[] = [];
      if (remunerationStrategy) {
        remunerationMovements = await db.select()
          .from(pdiRemunerationMovements)
          .where(eq(pdiRemunerationMovements.strategyId, remunerationStrategy.id))
          .orderBy(pdiRemunerationMovements.orderIndex);
      }

      // Buscar plano de ação 70-20-10
      const [actionPlan] = await db.select()
        .from(pdiActionPlan702010)
        .where(eq(pdiActionPlan702010.planId, input.id));

      // Buscar responsabilidades
      const [responsibilities] = await db.select()
        .from(pdiResponsibilities)
        .where(eq(pdiResponsibilities.planId, input.id));

      // Buscar assinaturas
      const [signatures] = await db.select()
        .from(pdiSignatures)
        .where(eq(pdiSignatures.planId, input.id));

      // Buscar timeline
      const timeline = await db.select()
        .from(pdiTimeline)
        .where(eq(pdiTimeline.planId, input.id))
        .orderBy(pdiTimeline.orderIndex);

      // Buscar detalhes inteligentes (se existir)
      const [intelligentDetails] = await db.select()
        .from(pdiIntelligentDetails)
        .where(eq(pdiIntelligentDetails.planId, input.id));

      // Buscar gaps de competências
      const competencyGaps = await db.select()
        .from(pdiCompetencyGaps)
        .where(eq(pdiCompetencyGaps.planId, input.id));

      return {
        plan: plan.pdiPlans,
        employee: plan.employees,
        kpis,
        remunerationStrategy,
        remunerationMovements,
        actionPlan,
        responsibilities,
        signatures,
        timeline,
        intelligentDetails,
        competencyGaps,
      };
    }),

  /**
   * Criar novo PDI completo
   */
  create: protectedProcedure
    .input(z.object({
      // Dados do plano principal
      employeeId: z.number(),
      cycleId: z.number(),
      targetPositionId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      
      // KPIs
      kpis: z.object({
        currentPosition: z.string().optional(),
        reframing: z.string().optional(),
        newPosition: z.string().optional(),
        performancePlanMonths: z.number().optional(),
        technicalExcellence: z.string().optional(),
        leadership: z.string().optional(),
        immediateIncentive: z.string().optional(),
      }).optional(),

      // Estratégia de Remuneração
      remunerationStrategy: z.object({
        title: z.string(),
        description: z.string().optional(),
        midpoint: z.string().optional(),
        movements: z.array(z.object({
          level: z.string(),
          deadline: z.string().optional(),
          trigger: z.string().optional(),
          mechanism: z.string().optional(),
          projectedSalary: z.string().optional(),
          positionInRange: z.string().optional(),
          justification: z.string().optional(),
          orderIndex: z.number(),
        })),
      }).optional(),

      // Plano de Ação 70-20-10
      actionPlan: z.object({
        practice70Items: z.array(z.string()),
        social20Items: z.array(z.string()),
        formal10Items: z.array(z.string()),
      }).optional(),

      // Responsabilidades
      responsibilities: z.object({
        employeeResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
        leadershipResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
        dhoResponsibilities: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
      }).optional(),

      // Timeline
      timeline: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        targetDate: z.string(),
        orderIndex: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar plano principal
      const [plan] = await db.insert(pdiPlans).values({
        cycleId: input.cycleId,
        employeeId: input.employeeId,
        targetPositionId: input.targetPositionId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "rascunho",
        overallProgress: 0,
      }).$returningId();

      const planId = plan.id;

      // Criar KPIs se fornecidos
      if (input.kpis) {
        await db.insert(pdiKpis).values({
          planId,
          ...input.kpis,
        });
      }

      // Criar estratégia de remuneração se fornecida
      if (input.remunerationStrategy) {
        const [strategy] = await db.insert(pdiRemunerationStrategy).values({
          planId,
          title: input.remunerationStrategy.title,
          description: input.remunerationStrategy.description,
          midpoint: input.remunerationStrategy.midpoint,
        }).$returningId();

        // Criar movimentos salariais
        if (input.remunerationStrategy.movements.length > 0) {
          await db.insert(pdiRemunerationMovements).values(
            input.remunerationStrategy.movements.map(m => ({
              strategyId: strategy.id,
              ...m,
            }))
          );
        }
      }

      // Criar plano de ação 70-20-10 se fornecido
      if (input.actionPlan) {
        await db.insert(pdiActionPlan702010).values({
          planId,
          practice70Items: input.actionPlan.practice70Items,
          social20Items: input.actionPlan.social20Items,
          formal10Items: input.actionPlan.formal10Items,
        });
      }

      // Criar responsabilidades se fornecidas
      if (input.responsibilities) {
        await db.insert(pdiResponsibilities).values({
          planId,
          employeeResponsibilities: input.responsibilities.employeeResponsibilities,
          leadershipResponsibilities: input.responsibilities.leadershipResponsibilities,
          dhoResponsibilities: input.responsibilities.dhoResponsibilities,
        });
      }

      // Criar timeline se fornecida
      if (input.timeline && input.timeline.length > 0) {
        await db.insert(pdiTimeline).values(
          input.timeline.map(t => ({
            planId,
            title: t.title,
            description: t.description,
            targetDate: new Date(t.targetDate),
            orderIndex: t.orderIndex,
            status: "pendente" as const,
            progress: 0,
          }))
        );
      }

      // Criar assinaturas vazias
      await db.insert(pdiSignatures).values({
        planId,
        allSigned: false,
      });

      return { id: planId, success: true };
    }),

  /**
   * Atualizar PDI existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
      kpis: z.object({
        currentPosition: z.string().optional(),
        reframing: z.string().optional(),
        newPosition: z.string().optional(),
        performancePlanMonths: z.number().optional(),
        technicalExcellence: z.string().optional(),
        leadership: z.string().optional(),
        immediateIncentive: z.string().optional(),
      }).optional(),
      actionPlan: z.object({
        practice70Items: z.array(z.string()),
        social20Items: z.array(z.string()),
        formal10Items: z.array(z.string()),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Atualizar status do plano se fornecido
      if (input.status) {
        await db.update(pdiPlans)
          .set({ status: input.status })
          .where(eq(pdiPlans.id, input.id));
      }

      // Atualizar KPIs se fornecidos
      if (input.kpis) {
        const [existing] = await db.select().from(pdiKpis).where(eq(pdiKpis.planId, input.id));
        if (existing) {
          await db.update(pdiKpis)
            .set(input.kpis)
            .where(eq(pdiKpis.planId, input.id));
        } else {
          await db.insert(pdiKpis).values({
            planId: input.id,
            ...input.kpis,
          });
        }
      }

      // Atualizar plano de ação se fornecido
      if (input.actionPlan) {
        const [existing] = await db.select().from(pdiActionPlan702010).where(eq(pdiActionPlan702010.planId, input.id));
        if (existing) {
          await db.update(pdiActionPlan702010)
            .set(input.actionPlan)
            .where(eq(pdiActionPlan702010.planId, input.id));
        } else {
          await db.insert(pdiActionPlan702010).values({
            planId: input.id,
            ...input.actionPlan,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Excluir PDI
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Excluir todos os dados relacionados
      await db.delete(pdiKpis).where(eq(pdiKpis.planId, input.id));
      await db.delete(pdiActionPlan702010).where(eq(pdiActionPlan702010.planId, input.id));
      await db.delete(pdiResponsibilities).where(eq(pdiResponsibilities.planId, input.id));
      await db.delete(pdiSignatures).where(eq(pdiSignatures.planId, input.id));
      await db.delete(pdiTimeline).where(eq(pdiTimeline.planId, input.id));
      await db.delete(pdiCompetencyGaps).where(eq(pdiCompetencyGaps.planId, input.id));
      await db.delete(pdiIntelligentDetails).where(eq(pdiIntelligentDetails.planId, input.id));

      // Excluir estratégia de remuneração e movimentos
      const [strategy] = await db.select().from(pdiRemunerationStrategy).where(eq(pdiRemunerationStrategy.planId, input.id));
      if (strategy) {
        await db.delete(pdiRemunerationMovements).where(eq(pdiRemunerationMovements.strategyId, strategy.id));
        await db.delete(pdiRemunerationStrategy).where(eq(pdiRemunerationStrategy.id, strategy.id));
      }

      // Excluir plano principal
      await db.delete(pdiPlans).where(eq(pdiPlans.id, input.id));

      return { success: true };
    }),

  /**
   * Atualizar timeline de um PDI
   */
  updateTimeline: protectedProcedure
    .input(z.object({
      planId: z.number(),
      timelineId: z.number(),
      status: z.enum(["pendente", "em_andamento", "concluido", "atrasado"]).optional(),
      progress: z.number().optional(),
      notes: z.string().optional(),
      completedDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.status) updateData.status = input.status;
      if (input.progress !== undefined) updateData.progress = input.progress;
      if (input.notes) updateData.notes = input.notes;
      if (input.completedDate) updateData.completedDate = new Date(input.completedDate);

      await db.update(pdiTimeline)
        .set(updateData)
        .where(and(
          eq(pdiTimeline.id, input.timelineId),
          eq(pdiTimeline.planId, input.planId)
        ));

      return { success: true };
    }),

  /**
   * Registrar assinatura no PDI
   */
  sign: protectedProcedure
    .input(z.object({
      planId: z.number(),
      role: z.enum(["employee", "sponsor", "mentor", "dho"]),
      name: z.string(),
      signature: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      const now = new Date();

      switch (input.role) {
        case "employee":
          updateData.employeeName = input.name;
          updateData.employeeSignedAt = now;
          if (input.signature) updateData.employeeSignature = input.signature;
          break;
        case "sponsor":
          updateData.sponsorName = input.name;
          updateData.sponsorSignedAt = now;
          if (input.signature) updateData.sponsorSignature = input.signature;
          break;
        case "mentor":
          updateData.mentorName = input.name;
          updateData.mentorSignedAt = now;
          if (input.signature) updateData.mentorSignature = input.signature;
          break;
        case "dho":
          updateData.dhoName = input.name;
          updateData.dhoSignedAt = now;
          if (input.signature) updateData.dhoSignature = input.signature;
          break;
      }

      await db.update(pdiSignatures)
        .set(updateData)
        .where(eq(pdiSignatures.planId, input.planId));

      // Verificar se todas as assinaturas foram coletadas
      const [signatures] = await db.select().from(pdiSignatures).where(eq(pdiSignatures.planId, input.planId));
      if (signatures && signatures.employeeSignedAt && signatures.sponsorSignedAt && signatures.dhoSignedAt) {
        await db.update(pdiSignatures)
          .set({ allSigned: true })
          .where(eq(pdiSignatures.planId, input.planId));
      }

      return { success: true };
    }),

  /**
   * Importar PDI de arquivo HTML
   */
  importFromHtml: protectedProcedure
    .input(z.object({
      htmlContent: z.string(),
      employeeId: z.number().optional(),
      cycleId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Parse do HTML
        const parsedData = parsePDIHtml(input.htmlContent);

        // Buscar ou criar colaborador
        let employeeId = input.employeeId;
        if (!employeeId) {
          const [employee] = await db.select()
            .from(employees)
            .where(like(employees.name, `%${parsedData.employeeName}%`))
            .limit(1);
          
          if (!employee) {
            throw new TRPCError({ 
              code: "NOT_FOUND", 
              message: `Colaborador "${parsedData.employeeName}" não encontrado no sistema` 
            });
          }
          employeeId = employee.id;
        }

        // Criar PDI
        const [plan] = await db.insert(pdiPlans).values({
          cycleId: input.cycleId || null,
          employeeId,
          status: 'em_andamento',
          startDate: new Date(),
          endDate: null,
          overallProgress: 0,
        });

        const planId = plan.insertId;

        // Criar KPIs
        if (parsedData.kpis) {
          await db.insert(pdiKpis).values({
            planId,
            currentPosition: parsedData.kpis.currentPosition,
            reframing: parsedData.kpis.reframing,
            newPosition: parsedData.kpis.newPosition,
          });
        }

        // Criar estratégia de remuneração
        if (parsedData.compensationTrack && parsedData.compensationTrack.length > 0) {
          const [strategy] = await db.insert(pdiRemunerationStrategy).values({
            planId,
            title: 'Trilha de Remuneração por Performance',
            description: 'Importado de HTML',
          });

          const movements = parsedData.compensationTrack.map((track, index) => ({
            strategyId: strategy.insertId,
            level: track.level,
            deadline: track.timeline,
            action: track.trigger,
            projectedSalary: track.projectedSalary,
            rangePosition: track.positionInRange,
            orderIndex: index + 1,
          }));

          await db.insert(pdiRemunerationMovements).values(movements);
        }

        // Criar plano de ação 70-20-10
        if (parsedData.actionPlan) {
          await db.insert(pdiActionPlan702010).values({
            planId,
            practice70Items: JSON.stringify(parsedData.actionPlan.onTheJob),
            social20Items: JSON.stringify(parsedData.actionPlan.social),
            formal10Items: JSON.stringify(parsedData.actionPlan.formal),
          });
        }

        // Criar responsabilidades
        if (parsedData.responsibilityPact) {
          await db.insert(pdiResponsibilities).values({
            planId,
            employeeResponsibilities: JSON.stringify(parsedData.responsibilityPact.employee),
            leadershipResponsibilities: JSON.stringify(parsedData.responsibilityPact.leadership),
            dhoResponsibilities: JSON.stringify(parsedData.responsibilityPact.dho),
          });
        }

        // Criar detalhes inteligentes
        await db.insert(pdiIntelligentDetails).values({
          planId,
          importedFromHtml: true,
          htmlSource: input.htmlContent,
        });

        // Registrar histórico de importação
        await db.insert(pdiImportHistory).values({
          fileName: 'PDI_Importado.html',
          fileSize: input.htmlContent.length,
          importedBy: ctx.user.id,
          totalPdisImported: 1,
          successfulImports: 1,
          failedImports: 0,
          status: 'completed',
        });

        return {
          success: true,
          planId,
          employeeId,
          message: 'PDI importado com sucesso'
        };
      } catch (error: any) {
        console.error('Erro ao importar PDI:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || 'Erro ao importar PDI do HTML'
        });
      }
    }),

  /**
   * Buscar PDIs com filtros avançados
   */
  listWithFilters: protectedProcedure
    .input(z.object({
      status: z.enum(['rascunho', 'em_andamento', 'concluido', 'cancelado']).optional(),
      employeeId: z.number().optional(),
      employeeName: z.string().optional(),
      departmentId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      searchText: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      orderBy: z.enum(['createdAt', 'employeeName', 'status', 'progress']).default('createdAt'),
      orderDirection: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [];

      // Filtro por status
      if (input.status) {
        conditions.push(eq(pdiPlans.status, input.status));
      }

      // Filtro por colaborador
      if (input.employeeId) {
        conditions.push(eq(pdiPlans.employeeId, input.employeeId));
      }

      // Filtro por nome do colaborador
      if (input.employeeName) {
        conditions.push(like(employees.name, `%${input.employeeName}%`));
      }

      // Filtro por departamento
      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      // Filtro por período
      if (input.startDate) {
        conditions.push(gte(pdiPlans.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(pdiPlans.createdAt, input.endDate));
      }

      // Busca por texto livre
      if (input.searchText) {
        conditions.push(
          or(
            like(employees.name, `%${input.searchText}%`),
            like(employees.cargo, `%${input.searchText}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar total de registros
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(whereClause);

      // Buscar PDIs com paginação
      const offset = (input.page - 1) * input.pageSize;
      
      let query = db
        .select({
          id: pdiPlans.id,
          employeeId: pdiPlans.employeeId,
          employeeName: employees.name,
          employeePosition: employees.cargo,
          departmentName: departments.name,
          status: pdiPlans.status,
          startDate: pdiPlans.startDate,
          endDate: pdiPlans.endDate,
          overallProgress: pdiPlans.overallProgress,
          createdAt: pdiPlans.createdAt,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(whereClause)
        .limit(input.pageSize)
        .offset(offset)
        .$dynamic();

      // Ordenação
      if (input.orderBy === 'createdAt') {
        query = input.orderDirection === 'asc' 
          ? query.orderBy(pdiPlans.createdAt)
          : query.orderBy(desc(pdiPlans.createdAt));
      } else if (input.orderBy === 'employeeName') {
        query = input.orderDirection === 'asc'
          ? query.orderBy(employees.name)
          : query.orderBy(desc(employees.name));
      } else if (input.orderBy === 'status') {
        query = input.orderDirection === 'asc'
          ? query.orderBy(pdiPlans.status)
          : query.orderBy(desc(pdiPlans.status));
      } else if (input.orderBy === 'progress') {
        query = input.orderDirection === 'asc'
          ? query.orderBy(pdiPlans.overallProgress)
          : query.orderBy(desc(pdiPlans.overallProgress));
      }

      const pdis = await query;

      return {
        pdis,
        pagination: {
          total: count,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(count / input.pageSize),
        }
      };
    }),

  /**
   * Dashboard de estatísticas de PDIs
   */
  getDashboardStats: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [];

      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      if (input.startDate) {
        conditions.push(gte(pdiPlans.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(pdiPlans.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Estatísticas gerais
      const stats = await db
        .select({
          total: sql<number>`count(*)`,
          concluidos: sql<number>`sum(case when ${pdiPlans.status} = 'concluido' then 1 else 0 end)`,
          emAndamento: sql<number>`sum(case when ${pdiPlans.status} = 'em_andamento' then 1 else 0 end)`,
          atrasados: sql<number>`sum(case when ${pdiPlans.status} = 'em_andamento' and ${pdiPlans.endDate} < NOW() then 1 else 0 end)`,
          progressoMedio: sql<number>`avg(${pdiPlans.overallProgress})`,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(whereClause);

      // PDIs por departamento
      const byDepartment = await db
        .select({
          departmentId: departments.id,
          departmentName: departments.name,
          total: sql<number>`count(*)`,
          concluidos: sql<number>`sum(case when ${pdiPlans.status} = 'concluido' then 1 else 0 end)`,
          progressoMedio: sql<number>`avg(${pdiPlans.overallProgress})`,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(whereClause)
        .groupBy(departments.id, departments.name);

      // PDIs atrasados (detalhes)
      const atrasados = await db
        .select({
          id: pdiPlans.id,
          employeeName: employees.name,
          employeePosition: employees.cargo,
          departmentName: departments.name,
          endDate: pdiPlans.endDate,
          overallProgress: pdiPlans.overallProgress,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            eq(pdiPlans.status, 'em_andamento'),
            sql`${pdiPlans.endDate} < NOW()`,
            whereClause
          )
        )
        .orderBy(pdiPlans.endDate)
        .limit(10);

      // Competências mais trabalhadas (top 10)
      const topCompetencies = await db
        .select({
          competencyId: pdiCompetencyGaps.competencyId,
          count: sql<number>`count(*)`,
        })
        .from(pdiCompetencyGaps)
        .leftJoin(pdiPlans, eq(pdiCompetencyGaps.planId, pdiPlans.id))
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(whereClause)
        .groupBy(pdiCompetencyGaps.competencyId)
        .orderBy(desc(sql`count(*)`)) 
        .limit(10);

      return {
        general: stats[0] || {
          total: 0,
          concluidos: 0,
          emAndamento: 0,
          atrasados: 0,
          progressoMedio: 0,
        },
        byDepartment,
        atrasados,
        topCompetencies,
      };
    }),
});
