import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  orgChartStructure,
  employeeMovements,
  employees,
  departments,
  positions
} from "../../drizzle/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router de Organograma Dinâmico
 * Gerencia estrutura hierárquica e movimentações de colaboradores
 */
export const orgChartRouter = router({
  /**
   * Obter estrutura completa do organograma
   */
  getStructure: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Buscar todos os nós da estrutura
      const nodes = await db
        .select({
          id: orgChartStructure.id,
          nodeType: orgChartStructure.nodeType,
          departmentId: orgChartStructure.departmentId,
          positionId: orgChartStructure.positionId,
          parentId: orgChartStructure.parentId,
          level: orgChartStructure.level,
          orderIndex: orgChartStructure.orderIndex,
          displayName: orgChartStructure.displayName,
          color: orgChartStructure.color,
          icon: orgChartStructure.icon,
          positionX: orgChartStructure.positionX,
          positionY: orgChartStructure.positionY,
          active: orgChartStructure.active,
        })
        .from(orgChartStructure)
        .where(eq(orgChartStructure.active, true))
        .orderBy(orgChartStructure.level, orgChartStructure.orderIndex);
      
      // Buscar colaboradores para cada nó
      const nodesWithEmployees = await Promise.all(
        nodes.map(async (node) => {
          let employeesList: any[] = [];
          
          if (node.nodeType === 'department' && node.departmentId) {
            employeesList = await db
              .select({
                id: employees.id,
                name: employees.name,
                employeeCode: employees.employeeCode,
                email: employees.email,
                photoUrl: employees.photoUrl,
                positionTitle: positions.title,
              })
              .from(employees)
              .leftJoin(positions, eq(employees.positionId, positions.id))
              .where(
                and(
                  eq(employees.departmentId, node.departmentId),
                  eq(employees.active, true)
                )
              )
              .limit(10); // Limitar para performance
          } else if (node.nodeType === 'position' && node.positionId) {
            employeesList = await db
              .select({
                id: employees.id,
                name: employees.name,
                employeeCode: employees.employeeCode,
                email: employees.email,
                photoUrl: employees.photoUrl,
                departmentName: departments.name,
              })
              .from(employees)
              .leftJoin(departments, eq(employees.departmentId, departments.id))
              .where(
                and(
                  eq(employees.positionId, node.positionId),
                  eq(employees.active, true)
                )
              )
              .limit(10);
          }
          
          return {
            ...node,
            employees: employeesList,
            employeeCount: employeesList.length
          };
        })
      );
      
      return {
        nodes: nodesWithEmployees,
        totalNodes: nodes.length
      };
    }),
  
  /**
   * Criar nó no organograma
   */
  createNode: adminProcedure
    .input(z.object({
      nodeType: z.enum(['department', 'position']),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      parentId: z.number().optional(),
      displayName: z.string(),
      color: z.string().optional(),
      icon: z.string().optional(),
      level: z.number().default(0),
      orderIndex: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Validar que departmentId ou positionId foi fornecido
      if (input.nodeType === 'department' && !input.departmentId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'departmentId é obrigatório para nós de departamento' });
      }
      
      if (input.nodeType === 'position' && !input.positionId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'positionId é obrigatório para nós de cargo' });
      }
      
      const [result] = await db.insert(orgChartStructure).values({
        nodeType: input.nodeType,
        departmentId: input.departmentId || null,
        positionId: input.positionId || null,
        parentId: input.parentId || null,
        level: input.level,
        orderIndex: input.orderIndex,
        displayName: input.displayName,
        color: input.color || null,
        icon: input.icon || null,
        active: true,
      });
      
      return {
        success: true,
        nodeId: result.insertId
      };
    }),
  
  /**
   * Atualizar posição de nó (drag-and-drop)
   */
  updateNodePosition: protectedProcedure
    .input(z.object({
      nodeId: z.number(),
      parentId: z.number().optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
      level: z.number().optional(),
      orderIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const updateData: any = {};
      
      if (input.parentId !== undefined) updateData.parentId = input.parentId;
      if (input.positionX !== undefined) updateData.positionX = input.positionX;
      if (input.positionY !== undefined) updateData.positionY = input.positionY;
      if (input.level !== undefined) updateData.level = input.level;
      if (input.orderIndex !== undefined) updateData.orderIndex = input.orderIndex;
      
      await db.update(orgChartStructure)
        .set(updateData)
        .where(eq(orgChartStructure.id, input.nodeId));
      
      return { success: true };
    }),
  
  /**
   * Mover colaborador (drag-and-drop no organograma)
   */
  moveEmployee: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      newDepartmentId: z.number().optional(),
      newPositionId: z.number().optional(),
      newManagerId: z.number().optional(),
      movementType: z.enum(['promocao', 'transferencia', 'mudanca_gestor', 'reorganizacao', 'outro']),
      reason: z.string().optional(),
      notes: z.string().optional(),
      effectiveDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Buscar dados atuais do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);
      
      if (!employee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Colaborador não encontrado' });
      }
      
      // Registrar movimentação no histórico
      await db.insert(employeeMovements).values({
        employeeId: input.employeeId,
        previousDepartmentId: employee.departmentId,
        previousPositionId: employee.positionId,
        previousManagerId: employee.managerId,
        newDepartmentId: input.newDepartmentId || employee.departmentId,
        newPositionId: input.newPositionId || employee.positionId,
        newManagerId: input.newManagerId || employee.managerId,
        movementType: input.movementType,
        reason: input.reason || null,
        notes: input.notes || null,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : new Date(),
        createdBy: ctx.user.id,
      });
      
      // Atualizar dados do colaborador
      const updateData: any = {};
      
      if (input.newDepartmentId !== undefined) {
        updateData.departmentId = input.newDepartmentId;
      }
      
      if (input.newPositionId !== undefined) {
        updateData.positionId = input.newPositionId;
      }
      
      if (input.newManagerId !== undefined) {
        updateData.managerId = input.newManagerId;
      }
      
      await db.update(employees)
        .set(updateData)
        .where(eq(employees.id, input.employeeId));
      
      return {
        success: true,
        message: 'Colaborador movimentado com sucesso'
      };
    }),
  
  /**
   * Listar movimentações com filtros
   */
  listMovements: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      movementType: z.enum(['promocao', 'transferencia', 'mudanca_gestor', 'reorganizacao', 'outro']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      let query = db
        .select({
          id: employeeMovements.id,
          employeeId: employeeMovements.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          previousDepartment: sql<string>`prev_dept.name`,
          newDepartment: sql<string>`new_dept.name`,
          previousPosition: sql<string>`prev_pos.title`,
          newPosition: sql<string>`new_pos.title`,
          movementType: employeeMovements.movementType,
          reason: employeeMovements.reason,
          notes: employeeMovements.notes,
          effectiveDate: employeeMovements.effectiveDate,
          createdAt: employeeMovements.createdAt,
        })
        .from(employeeMovements)
        .leftJoin(employees, eq(employeeMovements.employeeId, employees.id))
        .leftJoin(
          sql`departments as prev_dept`,
          sql`${employeeMovements.previousDepartmentId} = prev_dept.id`
        )
        .leftJoin(
          sql`departments as new_dept`,
          sql`${employeeMovements.newDepartmentId} = new_dept.id`
        )
        .leftJoin(
          sql`positions as prev_pos`,
          sql`${employeeMovements.previousPositionId} = prev_pos.id`
        )
        .leftJoin(
          sql`positions as new_pos`,
          sql`${employeeMovements.newPositionId} = new_pos.id`
        )
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(input.limit)
        .$dynamic();
      
      const movements = await query;
      
      // Filtrar em memória
      let filtered = movements;
      
      if (input.employeeId) {
        filtered = filtered.filter(m => m.employeeId === input.employeeId);
      }
      
      if (input.movementType) {
        filtered = filtered.filter(m => m.movementType === input.movementType);
      }
      
      if (input.startDate) {
        const startDate = new Date(input.startDate);
        filtered = filtered.filter(m => m.effectiveDate && new Date(m.effectiveDate) >= startDate);
      }
      
      if (input.endDate) {
        const endDate = new Date(input.endDate);
        filtered = filtered.filter(m => m.effectiveDate && new Date(m.effectiveDate) <= endDate);
      }
      
      return {
        movements: filtered,
        total: filtered.length
      };
    }),
  
  /**
   * Obter histórico de movimentações de um colaborador
   */
  getEmployeeMovementHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const movements = await db
        .select({
          id: employeeMovements.id,
          previousDepartment: sql<string>`prev_dept.name`,
          newDepartment: sql<string>`new_dept.name`,
          previousPosition: sql<string>`prev_pos.title`,
          newPosition: sql<string>`new_pos.title`,
          previousManager: sql<string>`prev_mgr.name`,
          newManager: sql<string>`new_mgr.name`,
          movementType: employeeMovements.movementType,
          reason: employeeMovements.reason,
          notes: employeeMovements.notes,
          effectiveDate: employeeMovements.effectiveDate,
          createdAt: employeeMovements.createdAt,
        })
        .from(employeeMovements)
        .leftJoin(
          sql`departments as prev_dept`,
          sql`${employeeMovements.previousDepartmentId} = prev_dept.id`
        )
        .leftJoin(
          sql`departments as new_dept`,
          sql`${employeeMovements.newDepartmentId} = new_dept.id`
        )
        .leftJoin(
          sql`positions as prev_pos`,
          sql`${employeeMovements.previousPositionId} = prev_pos.id`
        )
        .leftJoin(
          sql`positions as new_pos`,
          sql`${employeeMovements.newPositionId} = new_pos.id`
        )
        .leftJoin(
          sql`employees as prev_mgr`,
          sql`${employeeMovements.previousManagerId} = prev_mgr.id`
        )
        .leftJoin(
          sql`employees as new_mgr`,
          sql`${employeeMovements.newManagerId} = new_mgr.id`
        )
        .where(eq(employeeMovements.employeeId, input.employeeId))
        .orderBy(desc(employeeMovements.effectiveDate));
      
      return {
        movements,
        total: movements.length
      };
    }),
  
  /**
   * Gerar estrutura hierárquica automaticamente a partir dos departamentos
   */
  generateFromDepartments: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Buscar todos os departamentos
      const depts = await db
        .select()
        .from(departments)
        .where(eq(departments.active, true))
        .orderBy(departments.id);
      
      let createdCount = 0;
      
      // Criar nós para cada departamento
      for (const dept of depts) {
        // Verificar se já existe
        const [existing] = await db
          .select()
          .from(orgChartStructure)
          .where(
            and(
              eq(orgChartStructure.nodeType, 'department'),
              eq(orgChartStructure.departmentId, dept.id)
            )
          )
          .limit(1);
        
        if (!existing) {
          // Calcular nível baseado na hierarquia de departamentos
          let level = 0;
          if (dept.parentId) {
            const [parent] = await db
              .select()
              .from(orgChartStructure)
              .where(
                and(
                  eq(orgChartStructure.nodeType, 'department'),
                  eq(orgChartStructure.departmentId, dept.parentId)
                )
              )
              .limit(1);
            
            if (parent) {
              level = (parent.level || 0) + 1;
            }
          }
          
          // Buscar parentId no organograma
          let parentOrgId = null;
          if (dept.parentId) {
            const [parentOrg] = await db
              .select()
              .from(orgChartStructure)
              .where(
                and(
                  eq(orgChartStructure.nodeType, 'department'),
                  eq(orgChartStructure.departmentId, dept.parentId)
                )
              )
              .limit(1);
            
            if (parentOrg) {
              parentOrgId = parentOrg.id;
            }
          }
          
          await db.insert(orgChartStructure).values({
            nodeType: 'department',
            departmentId: dept.id,
            positionId: null,
            parentId: parentOrgId,
            level,
            orderIndex: 0,
            displayName: dept.name,
            color: null,
            icon: null,
            active: true,
          });
          
          createdCount++;
        }
      }
      
      return {
        success: true,
        message: `${createdCount} nós criados no organograma`,
        totalDepartments: depts.length
      };
    }),
});
