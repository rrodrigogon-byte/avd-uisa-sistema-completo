/**
 * Hierarchy Router
 * Gestão de hierarquia organizacional
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, departments } from "../../drizzle/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const hierarchyRouter = router({
  /**
   * Obter árvore hierárquica completa
   */
  getOrganizationTree: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar todos os funcionários ativos
    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        positionId: employees.positionId,
        departmentId: employees.departmentId,
        managerId: employees.managerId,
        hierarchyLevel: employees.hierarchyLevel,
        photoUrl: employees.photoUrl,
      })
      .from(employees)
      .where(eq(employees.status, "ativo"));

    // Construir árvore hierárquica
    const employeeMap = new Map(allEmployees.map(emp => [emp.id, { ...emp, subordinates: [] as any[] }]));
    const roots: any[] = [];

    allEmployees.forEach(emp => {
      const employee = employeeMap.get(emp.id)!;
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const manager = employeeMap.get(emp.managerId)!;
        manager.subordinates.push(employee);
      } else {
        // Sem gestor = raiz da árvore (CEO, Diretores)
        roots.push(employee);
      }
    });

    return roots;
  }),

  /**
   * Obter subordinados diretos de um funcionário
   */
  getDirectReports: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const subordinates = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          positionId: employees.positionId,
          departmentId: employees.departmentId,
          hierarchyLevel: employees.hierarchyLevel,
          photoUrl: employees.photoUrl,
        })
        .from(employees)
        .where(eq(employees.managerId, input.employeeId));

      return subordinates;
    }),

  /**
   * Obter todos os subordinados (diretos e indiretos)
   */
  getAllSubordinates: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todos os funcionários
      const allEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.status, "ativo"));

      // Função recursiva para buscar subordinados
      function getSubordinatesRecursive(managerId: number): any[] {
        const direct = allEmployees.filter(emp => emp.managerId === managerId);
        const indirect = direct.flatMap(emp => getSubordinatesRecursive(emp.id));
        return [...direct, ...indirect];
      }

      const allSubs = getSubordinatesRecursive(input.employeeId);

      return allSubs.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        positionId: emp.positionId,
        departmentId: emp.departmentId,
        hierarchyLevel: emp.hierarchyLevel,
        photoUrl: emp.photoUrl,
        level: calculateLevel(emp.id, input.employeeId, allEmployees),
      }));
    }),

  /**
   * Obter cadeia de comando (do funcionário até o CEO)
   */
  getChainOfCommand: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const chain: any[] = [];
      let currentId: number | null = input.employeeId;

      while (currentId !== null) {
        const [employee] = await db
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
            positionId: employees.positionId,
            departmentId: employees.departmentId,
            managerId: employees.managerId,
            hierarchyLevel: employees.hierarchyLevel,
            photoUrl: employees.photoUrl,
          })
          .from(employees)
          .where(eq(employees.id, currentId))
          .limit(1);

        if (!employee) break;

        chain.push(employee);
        currentId = employee.managerId;

        // Prevenir loops infinitos
        if (chain.length > 20) {
          console.error("[Hierarchy] Loop detectado na hierarquia!");
          break;
        }
      }

      return chain;
    }),

  /**
   * Definir gestor direto de um funcionário
   */
  setManager: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      managerId: z.number().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode alterar hierarquia
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem alterar a hierarquia" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validar que não é o próprio funcionário
      if (input.employeeId === input.managerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Um funcionário não pode ser gestor de si mesmo" });
      }

      // Validar que não cria loop hierárquico
      if (input.managerId !== null) {
        const wouldCreateLoop = await checkHierarchyLoop(db, input.employeeId, input.managerId);
        if (wouldCreateLoop) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta alteração criaria um loop hierárquico" });
        }
      }

      // Atualizar gestor
      await db
        .update(employees)
        .set({ managerId: input.managerId })
        .where(eq(employees.id, input.employeeId));

      return { success: true, message: "Gestor atualizado com sucesso" };
    }),

  /**
   * Obter estatísticas de hierarquia
   */
  getHierarchyStats: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Total de funcionários por nível hierárquico
    const byLevel = await db
      .select({
        level: employees.hierarchyLevel,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(eq(employees.status, "ativo"))
      .groupBy(employees.hierarchyLevel);

    // Funcionários sem gestor (CEOs, Diretores)
    const [{ count: withoutManager }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(sql`${employees.status} = 'ativo' AND ${employees.managerId} IS NULL`);

    // Span of control médio (quantos subordinados por gestor)
    const managers = await db
      .select({
        managerId: employees.managerId,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(sql`${employees.status} = 'ativo' AND ${employees.managerId} IS NOT NULL`)
      .groupBy(employees.managerId);

    const avgSpanOfControl = managers.length > 0
      ? managers.reduce((sum, m) => sum + Number(m.count), 0) / managers.length
      : 0;

    return {
      byLevel,
      withoutManager: Number(withoutManager),
      avgSpanOfControl: Math.round(avgSpanOfControl * 10) / 10,
      totalManagers: managers.length,
    };
  }),
});

/**
 * Calcular nível de distância entre dois funcionários na hierarquia
 */
function calculateLevel(employeeId: number, managerId: number, allEmployees: any[]): number {
  let level = 1;
  let currentId: number | null = employeeId;

  while (currentId !== null && currentId !== managerId) {
    const employee = allEmployees.find(emp => emp.id === currentId);
    if (!employee) break;
    currentId = employee.managerId;
    level++;

    // Prevenir loops
    if (level > 20) break;
  }

  return level;
}

/**
 * Verificar se uma alteração criaria um loop hierárquico
 */
async function checkHierarchyLoop(db: any, employeeId: number, newManagerId: number): Promise<boolean> {
  // Verificar se o novo gestor é subordinado do funcionário
  let currentId: number | null = newManagerId;
  let depth = 0;

  while (currentId !== null) {
    if (currentId === employeeId) {
      return true; // Loop detectado!
    }

    const [manager] = await db
      .select({ managerId: employees.managerId })
      .from(employees)
      .where(eq(employees.id, currentId))
      .limit(1);

    if (!manager) break;
    currentId = manager.managerId;
    depth++;

    // Prevenir loops infinitos
    if (depth > 20) {
      console.error("[Hierarchy] Loop infinito detectado ao verificar hierarquia");
      return true;
    }
  }

  return false;
}
