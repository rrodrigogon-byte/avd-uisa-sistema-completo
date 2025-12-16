/**
 * Hierarchy Router
 * Gestão de hierarquia organizacional
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, departments, employeeHierarchy, organizationalSections, organizationalPositions, hierarchyImportLogs } from "../../drizzle/schema";
import { eq, isNull, sql, like, or, asc, desc, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const hierarchyRouter = router({
  /**
   * Obter árvore hierárquica completa
   */
  getOrganizationTree: protectedProcedure.query(async ({ ctx }) => {
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
  getHierarchyStats: protectedProcedure.query(async ({ ctx }) => {
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


// ============================================================================
// PROCEDURES ADICIONAIS PARA HIERARQUIA TOTVS (employeeHierarchy)
// ============================================================================

export const hierarchyTotvsRouter = router({
  /**
   * Obter subordinados diretos de um líder (pela chapa TOTVS)
   */
  getSubordinatesByChapa: protectedProcedure
    .input(z.object({
      leaderChapa: z.string().optional(),
      leaderEmail: z.string().optional(),
      level: z.enum(["coordenador", "gestor", "diretor", "presidente"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { subordinates: [], total: 0 };

      // Encontrar a chapa do líder
      let leaderChapa = input.leaderChapa;
      
      if (!leaderChapa && input.leaderEmail) {
        const leader = await db
          .select({ employeeChapa: employeeHierarchy.employeeChapa })
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.employeeEmail, input.leaderEmail))
          .limit(1);
        
        if (leader.length > 0) {
          leaderChapa = leader[0].employeeChapa;
        }
      }

      if (!leaderChapa && ctx.user?.email) {
        const leader = await db
          .select({ employeeChapa: employeeHierarchy.employeeChapa })
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.employeeEmail, ctx.user.email))
          .limit(1);
        
        if (leader.length > 0) {
          leaderChapa = leader[0].employeeChapa;
        }
      }

      if (!leaderChapa) {
        return { subordinates: [], total: 0, message: "Líder não encontrado" };
      }

      // Buscar subordinados baseado no nível hierárquico
      let subordinates;
      
      if (input.level === "coordenador" || !input.level) {
        subordinates = await db
          .select()
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.coordinatorChapa, leaderChapa));
      } else if (input.level === "gestor") {
        subordinates = await db
          .select()
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.managerChapa, leaderChapa));
      } else if (input.level === "diretor") {
        subordinates = await db
          .select()
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.directorChapa, leaderChapa));
      } else if (input.level === "presidente") {
        subordinates = await db
          .select()
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.presidentChapa, leaderChapa));
      }

      return {
        subordinates: subordinates || [],
        total: subordinates?.length || 0,
        leaderChapa,
      };
    }),

  /**
   * Obter todos os subordinados (diretos e indiretos) de um líder
   */
  getAllSubordinatesByChapa: protectedProcedure
    .input(z.object({
      leaderChapa: z.string().optional(),
      leaderEmail: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { directReports: [], managedReports: [], directedReports: [], total: 0 };

      let leaderChapa = input.leaderChapa;
      
      if (!leaderChapa && input.leaderEmail) {
        const leader = await db
          .select({ employeeChapa: employeeHierarchy.employeeChapa })
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.employeeEmail, input.leaderEmail))
          .limit(1);
        
        if (leader.length > 0) {
          leaderChapa = leader[0].employeeChapa;
        }
      }

      if (!leaderChapa && ctx.user?.email) {
        const leader = await db
          .select({ employeeChapa: employeeHierarchy.employeeChapa })
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.employeeEmail, ctx.user.email))
          .limit(1);
        
        if (leader.length > 0) {
          leaderChapa = leader[0].employeeChapa;
        }
      }

      if (!leaderChapa) {
        return { directReports: [], managedReports: [], directedReports: [], total: 0 };
      }

      const directReports = await db
        .select()
        .from(employeeHierarchy)
        .where(eq(employeeHierarchy.coordinatorChapa, leaderChapa));

      const managedReports = await db
        .select()
        .from(employeeHierarchy)
        .where(eq(employeeHierarchy.managerChapa, leaderChapa));

      const directedReports = await db
        .select()
        .from(employeeHierarchy)
        .where(eq(employeeHierarchy.directorChapa, leaderChapa));

      return {
        directReports,
        managedReports,
        directedReports,
        total: directReports.length + managedReports.length + directedReports.length,
        leaderChapa,
      };
    }),

  /**
   * Obter informações do líder atual (usuário logado)
   */
  getMyLeaderInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user?.email) return null;

    const employee = await db
      .select()
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.employeeEmail, ctx.user.email))
      .limit(1);

    if (employee.length === 0) return null;

    const emp = employee[0];

    const hasDirectReports = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.coordinatorChapa, emp.employeeChapa));

    const hasManagedReports = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.managerChapa, emp.employeeChapa));

    const hasDirectedReports = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.directorChapa, emp.employeeChapa));

    const isLeader = 
      (hasDirectReports[0]?.count || 0) > 0 ||
      (hasManagedReports[0]?.count || 0) > 0 ||
      (hasDirectedReports[0]?.count || 0) > 0;

    let hierarchyLevel: "presidente" | "diretor" | "gestor" | "coordenador" | "colaborador" = "colaborador";
    
    if (emp.presidentChapa === emp.employeeChapa) {
      hierarchyLevel = "presidente";
    } else if (emp.directorChapa === emp.employeeChapa) {
      hierarchyLevel = "diretor";
    } else if (emp.managerChapa === emp.employeeChapa) {
      hierarchyLevel = "gestor";
    } else if (emp.coordinatorChapa === emp.employeeChapa) {
      hierarchyLevel = "coordenador";
    }

    return {
      ...emp,
      isLeader,
      hierarchyLevel,
      subordinatesCount: {
        direct: hasDirectReports[0]?.count || 0,
        managed: hasManagedReports[0]?.count || 0,
        directed: hasDirectedReports[0]?.count || 0,
      },
    };
  }),

  /**
   * Buscar funcionários na hierarquia TOTVS
   */
  searchEmployeesTotvs: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      section: z.string().optional(),
      position: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { employees: [], total: 0 };

      const conditions = [];

      if (input.query) {
        conditions.push(
          or(
            like(employeeHierarchy.employeeName, `%${input.query}%`),
            like(employeeHierarchy.employeeEmail, `%${input.query}%`),
            like(employeeHierarchy.employeeChapa, `%${input.query}%`)
          )
        );
      }

      if (input.section) {
        conditions.push(like(employeeHierarchy.employeeSection, `%${input.section}%`));
      }

      if (input.position) {
        conditions.push(like(employeeHierarchy.employeeFunction, `%${input.position}%`));
      }

      const whereClause = conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined;

      const employeesResult = await db
        .select()
        .from(employeeHierarchy)
        .orderBy(asc(employeeHierarchy.employeeName))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeHierarchy);

      return {
        employees: employeesResult,
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Obter estatísticas da hierarquia TOTVS
   */
  getTotvsStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const [
      totalEmployees,
      totalSections,
      totalPositions,
      coordinatorsCount,
      managersCount,
      directorsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(employeeHierarchy),
      db.select({ count: sql<number>`count(*)` }).from(organizationalSections),
      db.select({ count: sql<number>`count(*)` }).from(organizationalPositions),
      db.select({ count: sql<number>`count(DISTINCT coordinatorChapa)` }).from(employeeHierarchy).where(isNotNull(employeeHierarchy.coordinatorChapa)),
      db.select({ count: sql<number>`count(DISTINCT managerChapa)` }).from(employeeHierarchy).where(isNotNull(employeeHierarchy.managerChapa)),
      db.select({ count: sql<number>`count(DISTINCT directorChapa)` }).from(employeeHierarchy).where(isNotNull(employeeHierarchy.directorChapa)),
    ]);

    return {
      totalEmployees: totalEmployees[0]?.count || 0,
      totalSections: totalSections[0]?.count || 0,
      totalPositions: totalPositions[0]?.count || 0,
      totalCoordinators: coordinatorsCount[0]?.count || 0,
      totalManagers: managersCount[0]?.count || 0,
      totalDirectors: directorsCount[0]?.count || 0,
    };
  }),

  /**
   * Listar seções organizacionais
   */
  listSections: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.query) {
        return db
          .select()
          .from(organizationalSections)
          .where(
            or(
              like(organizationalSections.name, `%${input.query}%`),
              like(organizationalSections.code, `%${input.query}%`)
            )
          )
          .orderBy(asc(organizationalSections.name))
          .limit(input.limit);
      }

      return db
        .select()
        .from(organizationalSections)
        .orderBy(asc(organizationalSections.name))
        .limit(input.limit);
    }),

  /**
   * Listar funções/cargos organizacionais
   */
  listPositions: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.query) {
        return db
          .select()
          .from(organizationalPositions)
          .where(
            or(
              like(organizationalPositions.title, `%${input.query}%`),
              like(organizationalPositions.code, `%${input.query}%`)
            )
          )
          .orderBy(asc(organizationalPositions.title))
          .limit(input.limit);
      }

      return db
        .select()
        .from(organizationalPositions)
        .orderBy(asc(organizationalPositions.title))
        .limit(input.limit);
    }),

  /**
   * Obter histórico de importações
   */
  getImportLogs: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(hierarchyImportLogs)
      .orderBy(desc(hierarchyImportLogs.startedAt))
      .limit(20);
  }),

  /**
   * Obter árvore hierárquica de um funcionário
   */
  getHierarchyTreeByChapa: protectedProcedure
    .input(z.object({
      chapa: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const employee = await db
        .select()
        .from(employeeHierarchy)
        .where(eq(employeeHierarchy.employeeChapa, input.chapa))
        .limit(1);

      if (employee.length === 0) return null;

      const emp = employee[0];

      return {
        employee: {
          chapa: emp.employeeChapa,
          name: emp.employeeName,
          email: emp.employeeEmail,
          function: emp.employeeFunction,
          section: emp.employeeSection,
        },
        coordinator: emp.coordinatorChapa ? {
          chapa: emp.coordinatorChapa,
          name: emp.coordinatorName,
          email: emp.coordinatorEmail,
          function: emp.coordinatorFunction,
        } : null,
        manager: emp.managerChapa ? {
          chapa: emp.managerChapa,
          name: emp.managerName,
          email: emp.managerEmail,
          function: emp.managerFunction,
        } : null,
        director: emp.directorChapa ? {
          chapa: emp.directorChapa,
          name: emp.directorName,
          email: emp.directorEmail,
          function: emp.directorFunction,
        } : null,
        president: emp.presidentChapa ? {
          chapa: emp.presidentChapa,
          name: emp.presidentName,
          email: emp.presidentEmail,
          function: emp.presidentFunction,
        } : null,
      };
    }),

  /**
   * Obter funcionário por chapa
   */
  getByChapa: protectedProcedure
    .input(z.object({
      chapa: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(employeeHierarchy)
        .where(eq(employeeHierarchy.employeeChapa, input.chapa))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),
});
