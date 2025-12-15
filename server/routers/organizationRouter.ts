import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { departments, costCenters } from "../../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";

/**
 * Router para gerenciamento de Departamentos e Centros de Custos
 */
export const organizationRouter = router({
  // ============================================================================
  // DEPARTAMENTOS
  // ============================================================================
  
  departments: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let query = db.select().from(departments).orderBy(desc(departments.createdAt));

        if (input?.search) {
          query = query.where(
            or(
              like(departments.name, `%${input.search}%`),
              like(departments.code, `%${input.search}%`)
            )
          ) as any;
        }

        const results = await query;
        return results;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(departments)
          .where(eq(departments.id, input.id))
          .limit(1);

        return result[0] || null;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        code: z.string().min(1, "Código é obrigatório"),
        description: z.string().optional(),
        managerId: z.number().optional(),
        parentId: z.number().optional(),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(departments).values({
          name: input.name,
          code: input.code,
          description: input.description || null,
          managerId: input.managerId || null,
          parentId: input.parentId || null,
          active: input.active,
        });

        return {
          success: true,
          id: Number(result[0].insertId),
        };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        code: z.string().min(1, "Código é obrigatório"),
        description: z.string().optional(),
        managerId: z.number().optional(),
        parentId: z.number().optional(),
        active: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(departments)
          .set({
            name: input.name,
            code: input.code,
            description: input.description || null,
            managerId: input.managerId || null,
            parentId: input.parentId || null,
            active: input.active,
            updatedAt: new Date(),
          })
          .where(eq(departments.id, input.id));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verificar se há funcionários vinculados
        const { employees } = await import("../../drizzle/schema");
        const linkedEmployees = await db
          .select()
          .from(employees)
          .where(eq(employees.departmentId, input.id))
          .limit(1);

        if (linkedEmployees.length > 0) {
          throw new Error("Não é possível excluir departamento com funcionários vinculados");
        }

        await db.delete(departments).where(eq(departments.id, input.id));

        return { success: true };
      }),

    getHierarchy: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const allDepartments = await db.select().from(departments);

        // Construir hierarquia
        const buildTree = (parentId: number | null = null): any[] => {
          return allDepartments
            .filter(dept => dept.parentId === parentId)
            .map(dept => ({
              ...dept,
              children: buildTree(dept.id),
            }));
        };

        return buildTree(null);
      }),
  }),

  // ============================================================================
  // CENTROS DE CUSTOS
  // ============================================================================
  
  costCenters: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        departmentId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let query = db
          .select({
            costCenter: costCenters,
            department: departments,
          })
          .from(costCenters)
          .leftJoin(departments, eq(costCenters.departmentId, departments.id))
          .orderBy(desc(costCenters.createdAt));

        if (input?.search) {
          query = query.where(
            or(
              like(costCenters.name, `%${input.search}%`),
              like(costCenters.code, `%${input.search}%`)
            )
          ) as any;
        }

        if (input?.departmentId) {
          query = query.where(eq(costCenters.departmentId, input.departmentId)) as any;
        }

        const results = await query;
        return results.map(r => ({
          ...r.costCenter,
          departmentName: r.department?.name || null,
        }));
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(costCenters)
          .where(eq(costCenters.id, input.id))
          .limit(1);

        return result[0] || null;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        code: z.string().min(1, "Código é obrigatório"),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        budgetCents: z.number().optional(), // Orçamento em centavos
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(costCenters).values({
          name: input.name,
          code: input.code,
          description: input.description || null,
          departmentId: input.departmentId || null,
          budgetCents: input.budgetCents || null,
          active: input.active,
        });

        return {
          success: true,
          id: Number(result[0].insertId),
        };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        code: z.string().min(1, "Código é obrigatório"),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        budgetCents: z.number().optional(), // Orçamento em centavos
        active: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(costCenters)
          .set({
            name: input.name,
            code: input.code,
            description: input.description || null,
            departmentId: input.departmentId || null,
            budgetCents: input.budgetCents || null,
            active: input.active,
            updatedAt: new Date(),
          })
          .where(eq(costCenters.id, input.id));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(costCenters).where(eq(costCenters.id, input.id));

        return { success: true };
      }),
  }),
});
