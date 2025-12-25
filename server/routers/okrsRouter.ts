import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  objectives,
  keyResults,
  okrCheckIns,
  okrAlignments,
  okrHistory,
  okrTemplates,
  employees,
  departments,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray, or, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router de OKRs (Objectives and Key Results)
 * Gerencia objetivos estratégicos, resultados-chave e acompanhamento
 */
export const okrsRouter = router({
  /**
   * Listar objetivos
   */
  listObjectives: protectedProcedure
    .input(
      z
        .object({
          level: z.enum(["company", "department", "team", "individual"]).optional(),
          departmentId: z.number().optional(),
          employeeId: z.number().optional(),
          status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
          year: z.number().optional(),
          quarter: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let conditions = [];

      if (input?.level) {
        conditions.push(eq(objectives.level, input.level));
      }
      if (input?.departmentId) {
        conditions.push(eq(objectives.departmentId, input.departmentId));
      }
      if (input?.employeeId) {
        conditions.push(eq(objectives.employeeId, input.employeeId));
      }
      if (input?.status) {
        conditions.push(eq(objectives.status, input.status));
      }
      if (input?.year) {
        conditions.push(eq(objectives.year, input.year));
      }
      if (input?.quarter) {
        conditions.push(eq(objectives.quarter, input.quarter));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const objectivesList = await db
        .select({
          id: objectives.id,
          parentId: objectives.parentId,
          level: objectives.level,
          departmentId: objectives.departmentId,
          employeeId: objectives.employeeId,
          title: objectives.title,
          description: objectives.description,
          startDate: objectives.startDate,
          endDate: objectives.endDate,
          quarter: objectives.quarter,
          year: objectives.year,
          status: objectives.status,
          progress: objectives.progress,
          createdBy: objectives.createdBy,
          createdAt: objectives.createdAt,
          employeeName: employees.name,
          departmentName: departments.name,
        })
        .from(objectives)
        .leftJoin(employees, eq(objectives.employeeId, employees.id))
        .leftJoin(departments, eq(objectives.departmentId, departments.id))
        .where(whereClause)
        .orderBy(desc(objectives.createdAt));

      // Buscar key results para cada objetivo
      const objectivesWithKRs = await Promise.all(
        objectivesList.map(async (obj) => {
          const krs = await db
            .select()
            .from(keyResults)
            .where(eq(keyResults.objectiveId, obj.id))
            .orderBy(keyResults.id);

          return {
            ...obj,
            keyResults: krs,
            keyResultsCount: krs.length,
          };
        })
      );

      return objectivesWithKRs;
    }),

  /**
   * Obter detalhes de um objetivo
   */
  getObjectiveById: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [objective] = await db
        .select({
          id: objectives.id,
          parentId: objectives.parentId,
          level: objectives.level,
          departmentId: objectives.departmentId,
          employeeId: objectives.employeeId,
          title: objectives.title,
          description: objectives.description,
          startDate: objectives.startDate,
          endDate: objectives.endDate,
          quarter: objectives.quarter,
          year: objectives.year,
          status: objectives.status,
          progress: objectives.progress,
          createdBy: objectives.createdBy,
          createdAt: objectives.createdAt,
          employeeName: employees.name,
          departmentName: departments.name,
        })
        .from(objectives)
        .leftJoin(employees, eq(objectives.employeeId, employees.id))
        .leftJoin(departments, eq(objectives.departmentId, departments.id))
        .where(eq(objectives.id, input.objectiveId))
        .limit(1);

      if (!objective) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Objetivo não encontrado",
        });
      }

      // Buscar key results
      const krs = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.objectiveId, input.objectiveId))
        .orderBy(keyResults.id);

      // Buscar check-ins recentes
      const checkIns = await db
        .select()
        .from(okrCheckIns)
        .where(eq(okrCheckIns.objectiveId, input.objectiveId))
        .orderBy(desc(okrCheckIns.checkInDate))
        .limit(10);

      // Buscar alinhamentos
      const alignments = await db
        .select({
          id: okrAlignments.id,
          parentObjectiveId: okrAlignments.parentObjectiveId,
          childObjectiveId: okrAlignments.childObjectiveId,
          alignmentType: okrAlignments.alignmentType,
          contributionWeight: okrAlignments.contributionWeight,
          parentTitle: objectives.title,
        })
        .from(okrAlignments)
        .leftJoin(objectives, eq(okrAlignments.parentObjectiveId, objectives.id))
        .where(
          or(
            eq(okrAlignments.parentObjectiveId, input.objectiveId),
            eq(okrAlignments.childObjectiveId, input.objectiveId)
          )
        );

      return {
        ...objective,
        keyResults: krs,
        checkIns,
        alignments,
      };
    }),

  /**
   * Criar novo objetivo
   */
  createObjective: protectedProcedure
    .input(
      z.object({
        parentId: z.number().optional(),
        level: z.enum(["company", "department", "team", "individual"]),
        departmentId: z.number().optional(),
        employeeId: z.number().optional(),
        title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        quarter: z.number().optional(),
        year: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(objectives).values({
        parentId: input.parentId || null,
        level: input.level,
        departmentId: input.departmentId || null,
        employeeId: input.employeeId || null,
        title: input.title,
        description: input.description || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        quarter: input.quarter || null,
        year: input.year,
        status: "draft",
        progress: 0,
        createdBy: ctx.user.id,
      });

      // Registrar histórico
      await db.insert(okrHistory).values({
        objectiveId: result.insertId,
        changeType: "created",
        changedBy: ctx.user.id,
        comment: "Objetivo criado",
      });

      return {
        success: true,
        objectiveId: result.insertId,
        message: "Objetivo criado com sucesso",
      };
    }),

  /**
   * Atualizar objetivo
   */
  updateObjective: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number(),
        title: z.string().min(5).optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
        progress: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const updateData: any = {};
      const changes: string[] = [];

      if (input.title) {
        updateData.title = input.title;
        changes.push("título");
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
        changes.push("descrição");
      }
      if (input.startDate) {
        updateData.startDate = new Date(input.startDate);
        changes.push("data de início");
      }
      if (input.endDate) {
        updateData.endDate = new Date(input.endDate);
        changes.push("data de término");
      }
      if (input.status) {
        updateData.status = input.status;
        changes.push("status");
      }
      if (input.progress !== undefined) {
        updateData.progress = input.progress;
        changes.push("progresso");
      }

      await db
        .update(objectives)
        .set(updateData)
        .where(eq(objectives.id, input.objectiveId));

      // Registrar histórico
      await db.insert(okrHistory).values({
        objectiveId: input.objectiveId,
        changeType: "updated",
        changedBy: ctx.user.id,
        comment: `Atualizado: ${changes.join(", ")}`,
      });

      return {
        success: true,
        message: "Objetivo atualizado com sucesso",
      };
    }),

  /**
   * Criar resultado-chave
   */
  createKeyResult: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number(),
        title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
        description: z.string().optional(),
        metricType: z.enum(["number", "percentage", "currency", "boolean"]),
        startValue: z.number().default(0),
        targetValue: z.number(),
        unit: z.string().optional(),
        weight: z.number().min(0).max(100).default(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(keyResults).values({
        objectiveId: input.objectiveId,
        title: input.title,
        description: input.description || null,
        metricType: input.metricType,
        startValue: input.startValue,
        targetValue: input.targetValue,
        currentValue: input.startValue,
        unit: input.unit || null,
        progress: 0,
        status: "not_started",
        weight: input.weight,
      });

      return {
        success: true,
        keyResultId: result.insertId,
        message: "Resultado-chave criado com sucesso",
      };
    }),

  /**
   * Atualizar resultado-chave
   */
  updateKeyResult: protectedProcedure
    .input(
      z.object({
        keyResultId: z.number(),
        title: z.string().min(5).optional(),
        description: z.string().optional(),
        currentValue: z.number().optional(),
        status: z.enum(["not_started", "on_track", "at_risk", "behind", "completed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Buscar KR atual
      const [kr] = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.id, input.keyResultId))
        .limit(1);

      if (!kr) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resultado-chave não encontrado",
        });
      }

      const updateData: any = {};

      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.currentValue !== undefined) {
        updateData.currentValue = input.currentValue;
        // Calcular progresso
        const progress = Math.min(
          100,
          Math.round(((input.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100)
        );
        updateData.progress = progress;
      }
      if (input.status) updateData.status = input.status;

      await db
        .update(keyResults)
        .set(updateData)
        .where(eq(keyResults.id, input.keyResultId));

      // Atualizar progresso do objetivo pai
      if (input.currentValue !== undefined) {
        await this.updateObjectiveProgress(db, kr.objectiveId);
      }

      return {
        success: true,
        message: "Resultado-chave atualizado com sucesso",
      };
    }),

  /**
   * Criar check-in
   */
  createCheckIn: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number().optional(),
        keyResultId: z.number().optional(),
        currentValue: z.number(),
        status: z.enum(["on_track", "at_risk", "behind"]),
        confidence: z.enum(["low", "medium", "high"]).default("medium"),
        comment: z.string().optional(),
        blockers: z.string().optional(),
        nextSteps: z.string().optional(),
        checkInDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Buscar valor anterior
      let previousValue = 0;
      let progress = 0;

      if (input.keyResultId) {
        const [kr] = await db
          .select()
          .from(keyResults)
          .where(eq(keyResults.id, input.keyResultId))
          .limit(1);

        if (kr) {
          previousValue = kr.currentValue;
          progress = Math.min(
            100,
            Math.round(((input.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100)
          );

          // Atualizar KR
          await db
            .update(keyResults)
            .set({
              currentValue: input.currentValue,
              progress,
              status: input.status === "on_track" ? "on_track" : input.status === "at_risk" ? "at_risk" : "behind",
            })
            .where(eq(keyResults.id, input.keyResultId));
        }
      }

      const [result] = await db.insert(okrCheckIns).values({
        objectiveId: input.objectiveId || null,
        keyResultId: input.keyResultId || null,
        previousValue,
        currentValue: input.currentValue,
        progress,
        status: input.status,
        confidence: input.confidence,
        comment: input.comment || null,
        blockers: input.blockers || null,
        nextSteps: input.nextSteps || null,
        checkInDate: new Date(input.checkInDate),
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        checkInId: result.insertId,
        message: "Check-in registrado com sucesso",
      };
    }),

  /**
   * Listar check-ins
   */
  listCheckIns: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number().optional(),
        keyResultId: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let conditions = [];

      if (input.objectiveId) {
        conditions.push(eq(okrCheckIns.objectiveId, input.objectiveId));
      }
      if (input.keyResultId) {
        conditions.push(eq(okrCheckIns.keyResultId, input.keyResultId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const checkIns = await db
        .select({
          id: okrCheckIns.id,
          objectiveId: okrCheckIns.objectiveId,
          keyResultId: okrCheckIns.keyResultId,
          previousValue: okrCheckIns.previousValue,
          currentValue: okrCheckIns.currentValue,
          progress: okrCheckIns.progress,
          status: okrCheckIns.status,
          confidence: okrCheckIns.confidence,
          comment: okrCheckIns.comment,
          blockers: okrCheckIns.blockers,
          nextSteps: okrCheckIns.nextSteps,
          checkInDate: okrCheckIns.checkInDate,
          createdBy: okrCheckIns.createdBy,
          createdAt: okrCheckIns.createdAt,
          createdByName: employees.name,
        })
        .from(okrCheckIns)
        .leftJoin(employees, eq(okrCheckIns.createdBy, employees.id))
        .where(whereClause)
        .orderBy(desc(okrCheckIns.checkInDate))
        .limit(input.limit);

      return checkIns;
    }),

  /**
   * Criar alinhamento entre objetivos
   */
  createAlignment: protectedProcedure
    .input(
      z.object({
        parentObjectiveId: z.number(),
        childObjectiveId: z.number(),
        alignmentType: z.enum(["supports", "contributes_to", "depends_on"]),
        contributionWeight: z.number().min(0).max(100).default(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(okrAlignments).values({
        parentObjectiveId: input.parentObjectiveId,
        childObjectiveId: input.childObjectiveId,
        alignmentType: input.alignmentType,
        contributionWeight: input.contributionWeight,
      });

      return {
        success: true,
        alignmentId: result.insertId,
        message: "Alinhamento criado com sucesso",
      };
    }),

  /**
   * Listar templates de OKRs
   */
  listTemplates: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          level: z.enum(["company", "department", "team", "individual"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let conditions = [eq(okrTemplates.isPublic, true)];

      if (input?.category) {
        conditions.push(eq(okrTemplates.category, input.category));
      }
      if (input?.level) {
        conditions.push(eq(okrTemplates.level, input.level));
      }

      const templates = await db
        .select()
        .from(okrTemplates)
        .where(and(...conditions))
        .orderBy(desc(okrTemplates.usageCount));

      return templates;
    }),

  /**
   * Função auxiliar para atualizar progresso do objetivo
   */
  async updateObjectiveProgress(db: any, objectiveId: number) {
    // Buscar todos os KRs do objetivo
    const krs = await db
      .select()
      .from(keyResults)
      .where(eq(keyResults.objectiveId, objectiveId));

    if (krs.length === 0) return;

    // Calcular progresso ponderado
    let totalWeight = 0;
    let weightedProgress = 0;

    krs.forEach((kr: any) => {
      totalWeight += kr.weight;
      weightedProgress += kr.progress * kr.weight;
    });

    const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    // Atualizar objetivo
    await db
      .update(objectives)
      .set({ progress: overallProgress })
      .where(eq(objectives.id, objectiveId));
  },
});
