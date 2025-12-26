import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { positions, departments } from "../../drizzle/schema";
import { eq, and, desc, sql, count, avg } from "drizzle-orm";

// Schema de validação
const createPositionSchema = z.object({
  code: z.string().min(3, "Código deve ter no mínimo 3 caracteres"),
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  level: z.enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]),
  departmentId: z.number().optional(),
  salaryMin: z.number().min(0, "Salário mínimo deve ser maior que 0"),
  salaryMax: z.number().min(0, "Salário máximo deve ser maior que 0"),
});

const updatePositionSchema = createPositionSchema.partial().extend({
  id: z.number(),
});

export const positionsRouter = router({
  // Listar todos os cargos
  list: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allPositions = await db
      .select({
        id: positions.id,
        code: positions.code,
        title: positions.title,
        description: positions.description,
        level: positions.level,
        departmentId: positions.departmentId,
        salaryMin: positions.salaryMin,
        salaryMax: positions.salaryMax,
        active: positions.active,
        departmentName: departments.name,
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .where(eq(positions.active, true))
      .orderBy(desc(positions.createdAt));

    return allPositions.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      level: p.level,
      department: p.departmentName || "Sem departamento",
      departmentId: p.departmentId,
      salaryMin: p.salaryMin,
      salaryMax: p.salaryMax,
      active: p.active,
    }));
  }),

  // Buscar cargo por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const position = await db
        .select({
          id: positions.id,
          code: positions.code,
          title: positions.title,
          description: positions.description,
          level: positions.level,
          departmentId: positions.departmentId,
          salaryMin: positions.salaryMin,
          salaryMax: positions.salaryMax,
          active: positions.active,
          departmentName: departments.name,
        })
        .from(positions)
        .leftJoin(departments, eq(positions.departmentId, departments.id))
        .where(eq(positions.id, input.id))
        .limit(1)
        .then((r) => r[0]);

      if (!position) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cargo não encontrado",
        });
      }

      return {
        id: position.id,
        code: position.code,
        title: position.title,
        description: position.description,
        level: position.level,
        department: position.departmentName || "Sem departamento",
        departmentId: position.departmentId,
        salaryMin: position.salaryMin,
        salaryMax: position.salaryMax,
        active: position.active,
      };
    }),

  // Criar novo cargo
  create: protectedProcedure
    .input(createPositionSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se usuário tem permissão (RH ou Admin)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem criar cargos",
        });
      }

      // Validar faixa salarial
      if (input.salaryMax < input.salaryMin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Salário máximo deve ser maior que o salário mínimo",
        });
      }

      // Verificar se código já existe
      const existingPosition = await db
        .select()
        .from(positions)
        .where(eq(positions.code, input.code))
        .limit(1)
        .then((r) => r[0]);

      if (existingPosition) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um cargo com este código",
        });
      }

      const [newPosition] = await db.insert(positions).values({
        code: input.code,
        title: input.title,
        description: input.description,
        level: input.level,
        departmentId: input.departmentId || null,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        active: true,
      });

      return {
        id: newPosition.insertId,
        ...input,
        department: "Tecnologia", // TODO: buscar do banco
        active: true,
      };
    }),

  // Atualizar cargo
  update: protectedProcedure
    .input(updatePositionSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem atualizar cargos",
        });
      }

      // Validar faixa salarial se ambos forem fornecidos
      if (input.salaryMin && input.salaryMax && input.salaryMax < input.salaryMin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Salário máximo deve ser maior que o salário mínimo",
        });
      }

      const { id, ...updateData } = input;

      await db
        .update(positions)
        .set(updateData)
        .where(eq(positions.id, id));

      return {
        success: true,
        message: "Cargo atualizado com sucesso!",
      };
    }),

  // Excluir cargo (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem excluir cargos",
        });
      }

      await db
        .update(positions)
        .set({ active: false })
        .where(eq(positions.id, input.id));

      return {
        success: true,
        message: "Cargo excluído com sucesso!",
      };
    }),

  // Obter estatísticas de cargos
  getStats: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const stats = await db
      .select({
        total: count(),
        avgSalary: avg(positions.salaryMin),
      })
      .from(positions)
      .where(eq(positions.active, true))
      .then((r) => r[0]);

    // Contar por nível
    const byLevel = await db
      .select({
        level: positions.level,
        count: count(),
      })
      .from(positions)
      .where(eq(positions.active, true))
      .groupBy(positions.level);

    const byLevelObj: Record<string, number> = {
      junior: 0,
      pleno: 0,
      senior: 0,
      especialista: 0,
      coordenador: 0,
      gerente: 0,
      diretor: 0,
    };

    byLevel.forEach((l) => {
      if (l.level) {
        byLevelObj[l.level] = l.count;
      }
    });

    // Contar departamentos únicos
    const deptCount = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${positions.departmentId})`,
      })
      .from(positions)
      .where(eq(positions.active, true))
      .then((r) => r[0]);

    return {
      total: stats?.total || 0,
      active: stats?.total || 0,
      byLevel: byLevelObj,
      avgSalary: stats?.avgSalary ? Math.round(Number(stats.avgSalary)) : 0,
      departments: deptCount?.count || 0,
    };
  }),
});
