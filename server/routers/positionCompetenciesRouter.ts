import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  positionCompetencies, 
  positions,
  competencies,
  employeeCompetencies,
  employees
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const positionCompetenciesRouter = router({
  // Listar competências vinculadas a um cargo
  listByPosition: protectedProcedure
    .input(z.object({
      positionId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select({
          id: positionCompetencies.id,
          positionId: positionCompetencies.positionId,
          competencyId: positionCompetencies.competencyId,
          requiredLevel: positionCompetencies.requiredLevel,
          weight: positionCompetencies.weight,
          createdAt: positionCompetencies.createdAt,
          competencyCode: competencies.code,
          competencyName: competencies.name,
          competencyDescription: competencies.description,
          competencyCategory: competencies.category,
        })
        .from(positionCompetencies)
        .innerJoin(competencies, eq(positionCompetencies.competencyId, competencies.id))
        .where(eq(positionCompetencies.positionId, input.positionId))
        .orderBy(competencies.category, competencies.name);

      return result;
    }),

  // Listar todos os cargos com suas competências
  listAll: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.departmentId) {
        conditions.push(eq(positions.departmentId, input.departmentId));
      }
      
      if (input.activeOnly) {
        conditions.push(eq(positions.active, true));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar todos os cargos
      const allPositions = await db
        .select()
        .from(positions)
        .where(whereClause)
        .orderBy(positions.title);

      // Para cada cargo, buscar competências
      const result = await Promise.all(
        allPositions.map(async (position) => {
          const competenciesResult = await db
            .select({
              id: positionCompetencies.id,
              competencyId: positionCompetencies.competencyId,
              requiredLevel: positionCompetencies.requiredLevel,
              weight: positionCompetencies.weight,
              competencyName: competencies.name,
              competencyCategory: competencies.category,
            })
            .from(positionCompetencies)
            .innerJoin(competencies, eq(positionCompetencies.competencyId, competencies.id))
            .where(eq(positionCompetencies.positionId, position.id));

          return {
            ...position,
            competencies: competenciesResult,
            totalCompetencies: competenciesResult.length,
          };
        })
      );

      return result;
    }),

  // Vincular competência a cargo
  create: protectedProcedure
    .input(z.object({
      positionId: z.number(),
      competencyId: z.number(),
      requiredLevel: z.number().min(1).max(5),
      weight: z.number().min(1).max(100).default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se já existe
      const [existing] = await db
        .select()
        .from(positionCompetencies)
        .where(and(
          eq(positionCompetencies.positionId, input.positionId),
          eq(positionCompetencies.competencyId, input.competencyId)
        ))
        .limit(1);

      if (existing) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Esta competência já está vinculada a este cargo" 
        });
      }

      const [result] = await db.insert(positionCompetencies).values({
        positionId: input.positionId,
        competencyId: input.competencyId,
        requiredLevel: input.requiredLevel,
        weight: input.weight,
      });

      return { id: result.insertId, success: true };
    }),

  // Vincular múltiplas competências a cargo
  createBulk: protectedProcedure
    .input(z.object({
      positionId: z.number(),
      competencies: z.array(z.object({
        competencyId: z.number(),
        requiredLevel: z.number().min(1).max(5),
        weight: z.number().min(1).max(100).default(1),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Remover competências existentes
      await db
        .delete(positionCompetencies)
        .where(eq(positionCompetencies.positionId, input.positionId));

      // Inserir novas
      if (input.competencies.length > 0) {
        await db.insert(positionCompetencies).values(
          input.competencies.map(c => ({
            positionId: input.positionId,
            competencyId: c.competencyId,
            requiredLevel: c.requiredLevel,
            weight: c.weight,
          }))
        );
      }

      return { success: true, count: input.competencies.length };
    }),

  // Atualizar nível mínimo de competência
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      requiredLevel: z.number().min(1).max(5).optional(),
      weight: z.number().min(1).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Record<string, unknown> = {};
      if (input.requiredLevel !== undefined) updateData.requiredLevel = input.requiredLevel;
      if (input.weight !== undefined) updateData.weight = input.weight;

      await db
        .update(positionCompetencies)
        .set(updateData)
        .where(eq(positionCompetencies.id, input.id));

      return { success: true };
    }),

  // Remover vínculo de competência
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(positionCompetencies).where(eq(positionCompetencies.id, input.id));

      return { success: true };
    }),

  // Analisar gaps de competências de um colaborador em relação ao cargo
  analyzeGaps: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar colaborador e seu cargo
      const [employee] = await db
        .select({
          id: employees.id,
          name: employees.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee || !employee.positionId) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Colaborador não encontrado ou sem cargo definido" 
        });
      }

      // Buscar competências exigidas pelo cargo
      const requiredCompetencies = await db
        .select({
          competencyId: positionCompetencies.competencyId,
          requiredLevel: positionCompetencies.requiredLevel,
          weight: positionCompetencies.weight,
          competencyName: competencies.name,
          competencyCategory: competencies.category,
        })
        .from(positionCompetencies)
        .innerJoin(competencies, eq(positionCompetencies.competencyId, competencies.id))
        .where(eq(positionCompetencies.positionId, employee.positionId));

      // Buscar competências atuais do colaborador
      const currentCompetencies = await db
        .select({
          competencyId: employeeCompetencies.competencyId,
          currentLevel: employeeCompetencies.currentLevel,
        })
        .from(employeeCompetencies)
        .where(eq(employeeCompetencies.employeeId, input.employeeId));

      // Criar mapa de competências atuais
      const currentMap = new Map(
        currentCompetencies.map(c => [c.competencyId, c.currentLevel])
      );

      // Calcular gaps
      const gaps = requiredCompetencies.map(req => {
        const currentLevel = currentMap.get(req.competencyId) || 0;
        const gap = req.requiredLevel - currentLevel;
        
        return {
          competencyId: req.competencyId,
          competencyName: req.competencyName,
          competencyCategory: req.competencyCategory,
          requiredLevel: req.requiredLevel,
          currentLevel,
          gap,
          weight: req.weight,
          status: gap <= 0 ? "atende" : gap === 1 ? "proximo" : "gap_significativo",
        };
      });

      // Calcular estatísticas
      const totalCompetencies = gaps.length;
      const atendidas = gaps.filter(g => g.status === "atende").length;
      const comGap = gaps.filter(g => g.gap > 0).length;
      
      // Calcular score ponderado
      const totalWeight = gaps.reduce((sum, g) => sum + g.weight, 0);
      const weightedScore = totalWeight > 0
        ? gaps.reduce((sum, g) => {
            const score = Math.min(g.currentLevel / g.requiredLevel, 1) * 100;
            return sum + (score * g.weight);
          }, 0) / totalWeight
        : 0;

      return {
        employee: {
          id: employee.id,
          name: employee.name,
          positionTitle: employee.positionTitle,
        },
        gaps,
        summary: {
          totalCompetencies,
          atendidas,
          comGap,
          taxaAtendimento: totalCompetencies > 0 ? Math.round((atendidas / totalCompetencies) * 100) : 0,
          scorePonderado: Math.round(weightedScore),
        },
      };
    }),

  // Listar colaboradores abaixo do nível mínimo
  listBelowMinimum: protectedProcedure
    .input(z.object({
      positionId: z.number().optional(),
      departmentId: z.number().optional(),
      competencyId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar colaboradores com filtros
      const conditions = [];
      if (input.positionId) conditions.push(eq(employees.positionId, input.positionId));
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));
      conditions.push(eq(employees.active, true));

      const employeesList = await db
        .select({
          id: employees.id,
          name: employees.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
          departmentName: sql`(SELECT name FROM departments WHERE id = ${employees.departmentId})`,
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(and(...conditions));

      // Para cada colaborador, verificar gaps
      const results = [];

      for (const emp of employeesList) {
        if (!emp.positionId) continue;

        // Buscar competências exigidas
        const required = await db
          .select({
            competencyId: positionCompetencies.competencyId,
            requiredLevel: positionCompetencies.requiredLevel,
            competencyName: competencies.name,
          })
          .from(positionCompetencies)
          .innerJoin(competencies, eq(positionCompetencies.competencyId, competencies.id))
          .where(eq(positionCompetencies.positionId, emp.positionId));

        if (input.competencyId) {
          const filtered = required.filter(r => r.competencyId === input.competencyId);
          if (filtered.length === 0) continue;
        }

        // Buscar níveis atuais
        const current = await db
          .select({
            competencyId: employeeCompetencies.competencyId,
            currentLevel: employeeCompetencies.currentLevel,
          })
          .from(employeeCompetencies)
          .where(eq(employeeCompetencies.employeeId, emp.id));

        const currentMap = new Map(current.map(c => [c.competencyId, c.currentLevel]));

        // Identificar gaps
        const gaps = required
          .filter(r => {
            const currentLevel = currentMap.get(r.competencyId) || 0;
            return currentLevel < r.requiredLevel;
          })
          .map(r => ({
            competencyId: r.competencyId,
            competencyName: r.competencyName,
            requiredLevel: r.requiredLevel,
            currentLevel: currentMap.get(r.competencyId) || 0,
            gap: r.requiredLevel - (currentMap.get(r.competencyId) || 0),
          }));

        if (gaps.length > 0) {
          results.push({
            employee: {
              id: emp.id,
              name: emp.name,
              positionTitle: emp.positionTitle,
              departmentName: emp.departmentName,
            },
            gaps,
            totalGaps: gaps.length,
            maxGap: Math.max(...gaps.map(g => g.gap)),
          });
        }
      }

      // Ordenar por maior número de gaps
      results.sort((a, b) => b.totalGaps - a.totalGaps);

      return results;
    }),

  // Matriz de competências por cargo
  getMatrix: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todas as competências
      const allCompetencies = await db
        .select()
        .from(competencies)
        .where(eq(competencies.active, true))
        .orderBy(competencies.category, competencies.name);

      // Buscar cargos
      const positionConditions = [eq(positions.active, true)];
      if (input.departmentId) {
        positionConditions.push(eq(positions.departmentId, input.departmentId));
      }

      const allPositions = await db
        .select()
        .from(positions)
        .where(and(...positionConditions))
        .orderBy(positions.title);

      // Buscar todos os vínculos
      const allLinks = await db
        .select()
        .from(positionCompetencies);

      // Criar matriz
      const matrix = allPositions.map(position => {
        const positionLinks = allLinks.filter(l => l.positionId === position.id);
        const competencyLevels: Record<number, number> = {};
        
        positionLinks.forEach(link => {
          competencyLevels[link.competencyId] = link.requiredLevel;
        });

        return {
          positionId: position.id,
          positionTitle: position.title,
          positionLevel: position.level,
          competencyLevels,
        };
      });

      return {
        competencies: allCompetencies.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          category: c.category,
        })),
        positions: matrix,
      };
    }),
});
