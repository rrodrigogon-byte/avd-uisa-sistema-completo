import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { 
  employees, 
  departments, 
  positions,
  employeeMovements
} from "../../drizzle/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

/**
 * Router de Organograma Dinâmico
 * Gerencia estrutura hierárquica e movimentações de colaboradores
 */
export const organogramaRouter = router({
  /**
   * Buscar estrutura hierárquica completa
   */
  getHierarchy: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todos os colaboradores com seus departamentos e posições
      const allEmployees = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          cargo: employees.cargo,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
          managerId: employees.managerId,
          hireDate: employees.hireDate,
          photoUrl: employees.photoUrl,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(input.departmentId ? eq(employees.departmentId, input.departmentId) : undefined)
        .orderBy(employees.name);

      // Buscar todos os departamentos
      const allDepartments = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          parentId: departments.parentId,
          managerId: departments.managerId,
        })
        .from(departments)
        .where(input.departmentId ? eq(departments.id, input.departmentId) : undefined)
        .orderBy(departments.name);

      // Construir árvore hierárquica
      const buildTree = (parentId: number | null = null): any[] => {
        return allEmployees
          .filter(emp => emp.managerId === parentId)
          .map(emp => ({
            ...emp,
            children: buildTree(emp.id),
          }));
      };

      // Buscar colaboradores sem gestor (raiz da árvore)
      const rootEmployees = buildTree(null);

      return {
        employees: allEmployees,
        departments: allDepartments,
        hierarchy: rootEmployees,
      };
    }),

  /**
   * Buscar detalhes de um colaborador
   */
  getEmployeeDetails: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [employee] = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          cargo: employees.cargo,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
          managerId: employees.managerId,
          managerName: sql<string>`manager.name`,
          hireDate: employees.hireDate,
          photoUrl: employees.photoUrl,
          phone: employees.phone,
          birthDate: employees.birthDate,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(sql`employees manager`, sql`${employees.managerId} = manager.id`)
        .where(eq(employees.id, input.employeeId));

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
      }

      // Buscar subordinados diretos
      const subordinates = await db
        .select({
          id: employees.id,
          name: employees.name,
          cargo: employees.cargo,
          photoUrl: employees.photoUrl,
        })
        .from(employees)
        .where(eq(employees.managerId, input.employeeId));

      // Buscar histórico de movimentações
      const movementHistory = await db
        .select({
          id: employeeMovements.id,
          movementType: employeeMovements.movementType,
          previousDepartmentName: sql<string>`prev_dept.name`,
          newDepartmentName: sql<string>`new_dept.name`,
          previousPositionTitle: sql<string>`prev_pos.title`,
          newPositionTitle: sql<string>`new_pos.title`,
          previousManagerName: sql<string>`prev_mgr.name`,
          newManagerName: sql<string>`new_mgr.name`,
          reason: employeeMovements.reason,
          effectiveDate: employeeMovements.effectiveDate,
          createdAt: employeeMovements.createdAt,
        })
        .from(employeeMovements)
        .leftJoin(sql`departments prev_dept`, sql`${employeeMovements.previousDepartmentId} = prev_dept.id`)
        .leftJoin(sql`departments new_dept`, sql`${employeeMovements.newDepartmentId} = new_dept.id`)
        .leftJoin(sql`positions prev_pos`, sql`${employeeMovements.previousPositionId} = prev_pos.id`)
        .leftJoin(sql`positions new_pos`, sql`${employeeMovements.newPositionId} = new_pos.id`)
        .leftJoin(sql`employees prev_mgr`, sql`${employeeMovements.previousManagerId} = prev_mgr.id`)
        .leftJoin(sql`employees new_mgr`, sql`${employeeMovements.newManagerId} = new_mgr.id`)
        .where(eq(employeeMovements.employeeId, input.employeeId))
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(10);

      return {
        employee,
        subordinates,
        movementHistory,
      };
    }),

  /**
   * Criar movimentação de colaborador
   */
  createMovement: adminProcedure
    .input(z.object({
      employeeId: z.number(),
      newDepartmentId: z.number().optional(),
      newPositionId: z.number().optional(),
      newManagerId: z.number().optional(),
      movementType: z.enum(['promocao', 'transferencia', 'mudanca_gestor', 'reorganizacao', 'outro']),
      reason: z.string(),
      notes: z.string().optional(),
      effectiveDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados atuais do colaborador
      const [currentEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId));

      if (!currentEmployee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
      }

      // Registrar movimentação
      await db.insert(employeeMovements).values({
        employeeId: input.employeeId,
        previousDepartmentId: currentEmployee.departmentId,
        previousPositionId: currentEmployee.positionId,
        previousManagerId: currentEmployee.managerId,
        newDepartmentId: input.newDepartmentId || currentEmployee.departmentId,
        newPositionId: input.newPositionId || currentEmployee.positionId,
        newManagerId: input.newManagerId !== undefined ? input.newManagerId : currentEmployee.managerId,
        movementType: input.movementType,
        reason: input.reason,
        notes: input.notes,
        effectiveDate: input.effectiveDate,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        createdBy: ctx.user.id,
      });

      // Atualizar dados do colaborador
      const updateData: any = {};
      if (input.newDepartmentId) updateData.departmentId = input.newDepartmentId;
      if (input.newPositionId) updateData.positionId = input.newPositionId;
      if (input.newManagerId !== undefined) updateData.managerId = input.newManagerId;

      if (Object.keys(updateData).length > 0) {
        await db.update(employees)
          .set(updateData)
          .where(eq(employees.id, input.employeeId));
      }

      return { success: true };
    }),

  /**
   * Buscar histórico de movimentações
   */
  getMovementHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [];

      if (input.employeeId) {
        conditions.push(eq(employeeMovements.employeeId, input.employeeId));
      }

      if (input.departmentId) {
        conditions.push(
          or(
            eq(employeeMovements.previousDepartmentId, input.departmentId),
            eq(employeeMovements.newDepartmentId, input.departmentId)
          )
        );
      }

      if (input.startDate) {
        conditions.push(sql`${employeeMovements.effectiveDate} >= ${input.startDate}`);
      }

      if (input.endDate) {
        conditions.push(sql`${employeeMovements.effectiveDate} <= ${input.endDate}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar total de registros
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeMovements)
        .where(whereClause);

      // Buscar movimentações com paginação
      const offset = (input.page - 1) * input.pageSize;

      const movements = await db
        .select({
          id: employeeMovements.id,
          employeeId: employeeMovements.employeeId,
          employeeName: employees.name,
          movementType: employeeMovements.movementType,
          previousDepartmentName: sql<string>`prev_dept.name`,
          newDepartmentName: sql<string>`new_dept.name`,
          previousPositionTitle: sql<string>`prev_pos.title`,
          newPositionTitle: sql<string>`new_pos.title`,
          previousManagerName: sql<string>`prev_mgr.name`,
          newManagerName: sql<string>`new_mgr.name`,
          reason: employeeMovements.reason,
          notes: employeeMovements.notes,
          effectiveDate: employeeMovements.effectiveDate,
          approvedBy: employeeMovements.approvedBy,
          approverName: sql<string>`approver.name`,
          createdAt: employeeMovements.createdAt,
        })
        .from(employeeMovements)
        .leftJoin(employees, eq(employeeMovements.employeeId, employees.id))
        .leftJoin(sql`departments prev_dept`, sql`${employeeMovements.previousDepartmentId} = prev_dept.id`)
        .leftJoin(sql`departments new_dept`, sql`${employeeMovements.newDepartmentId} = new_dept.id`)
        .leftJoin(sql`positions prev_pos`, sql`${employeeMovements.previousPositionId} = prev_pos.id`)
        .leftJoin(sql`positions new_pos`, sql`${employeeMovements.newPositionId} = new_pos.id`)
        .leftJoin(sql`employees prev_mgr`, sql`${employeeMovements.previousManagerId} = prev_mgr.id`)
        .leftJoin(sql`employees new_mgr`, sql`${employeeMovements.newManagerId} = new_mgr.id`)
        .leftJoin(sql`employees approver`, sql`${employeeMovements.approvedBy} = approver.id`)
        .where(whereClause)
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(input.pageSize)
        .offset(offset);

      return {
        movements,
        pagination: {
          total: count,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(count / input.pageSize),
        }
      };
    }),

  /**
   * Buscar estatísticas de movimentações
   */
  getMovementStats: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [];

      if (input.startDate) {
        conditions.push(sql`${employeeMovements.effectiveDate} >= ${input.startDate}`);
      }

      if (input.endDate) {
        conditions.push(sql`${employeeMovements.effectiveDate} <= ${input.endDate}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Estatísticas por tipo de movimentação
      const byType = await db
        .select({
          movementType: employeeMovements.movementType,
          count: sql<number>`count(*)`,
        })
        .from(employeeMovements)
        .where(whereClause)
        .groupBy(employeeMovements.movementType);

      // Movimentações por departamento
      const byDepartment = await db
        .select({
          departmentId: departments.id,
          departmentName: departments.name,
          incoming: sql<number>`sum(case when ${employeeMovements.newDepartmentId} = ${departments.id} then 1 else 0 end)`,
          outgoing: sql<number>`sum(case when ${employeeMovements.previousDepartmentId} = ${departments.id} then 1 else 0 end)`,
        })
        .from(departments)
        .leftJoin(employeeMovements, sql`${employeeMovements.newDepartmentId} = ${departments.id} OR ${employeeMovements.previousDepartmentId} = ${departments.id}`)
        .where(whereClause)
        .groupBy(departments.id, departments.name);

      return {
        byType,
        byDepartment,
      };
    }),
});
