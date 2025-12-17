import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  orgChartStructure,
  employeeMovements,
  employees,
  departments,
  positions,
  managerChangeHistory
} from "../../drizzle/schema";
import { eq, and, desc, isNull, sql, gte, lte, or } from "drizzle-orm";
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

  /**
   * Buscar histórico de mudanças de gestor
   */
  getManagerHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        departmentId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        changeType: z.enum([
          "promocao",
          "transferencia",
          "reorganizacao",
          "desligamento_gestor",
          "ajuste_hierarquico",
          "outro",
        ]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input.employeeId) {
        conditions.push(eq(managerChangeHistory.employeeId, input.employeeId));
      }

      if (input.departmentId) {
        conditions.push(eq(managerChangeHistory.departmentId, input.departmentId));
      }

      if (input.startDate) {
        conditions.push(gte(managerChangeHistory.effectiveDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(managerChangeHistory.effectiveDate, new Date(input.endDate)));
      }

      if (input.changeType) {
        conditions.push(eq(managerChangeHistory.changeType, input.changeType));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const history = await db
        .select()
        .from(managerChangeHistory)
        .where(whereClause)
        .orderBy(desc(managerChangeHistory.effectiveDate))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(managerChangeHistory)
        .where(whereClause);

      return {
        history,
        total: countResult?.count ?? 0,
      };
    }),

  /**
   * Exportar dados hierárquicos completos
   */
  exportHierarchy: protectedProcedure
    .input(
      z.object({
        format: z.enum(["json", "csv"]).default("json"),
        departmentId: z.number().optional(),
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (!input.includeInactive) {
        conditions.push(eq(employees.active, true));
      }

      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const employeesData = await db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          name: employees.name,
          email: employees.email,
          cpf: employees.cpf,
          birthDate: employees.birthDate,
          hireDate: employees.hireDate,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
          managerId: employees.managerId,
          managerName: sql<string>`mgr.name`,
          active: employees.active,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(sql`employees as mgr`, sql`${employees.managerId} = mgr.id`)
        .where(whereClause);

      if (input.format === "csv") {
        // Converter para formato CSV
        const headers = [
          "ID",
          "Código",
          "Nome",
          "Email",
          "CPF",
          "Data Nascimento",
          "Data Admissão",
          "Departamento",
          "Cargo",
          "Gestor",
          "Status",
        ];

        const rows = employeesData.map((emp) => [
          emp.id,
          emp.employeeCode,
          emp.name,
          emp.email || "",
          emp.cpf || "",
          emp.birthDate ? new Date(emp.birthDate).toLocaleDateString("pt-BR") : "",
          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("pt-BR") : "",
          emp.departmentName || "",
          emp.positionTitle || "",
          emp.managerName || "",
          emp.active ? "Ativo" : "Inativo",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        return {
          format: "csv",
          data: csvContent,
          filename: `organograma_${new Date().toISOString().split("T")[0]}.csv`,
        };
      }

      // Formato JSON (padrão)
      return {
        format: "json",
        data: employeesData,
        total: employeesData.length,
        exportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Obter métricas de integridade organizacional
   */
  getIntegrityMetrics: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(employees.active, true)];

      if (input?.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      const whereClause = and(...conditions);

      // Total de funcionários
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(whereClause);

      const totalEmployees = totalResult?.count ?? 0;

      // Funcionários sem gestor (possíveis CEOs/Diretores)
      const [noManagerResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(and(...conditions, isNull(employees.managerId)));

      const employeesWithoutManager = noManagerResult?.count ?? 0;

      // Span of control (subordinados por gestor)
      const spanOfControl = await db
        .select({
          managerId: employees.managerId,
          managerName: sql<string>`mgr.name`,
          subordinateCount: sql<number>`count(*)`,
        })
        .from(employees)
        .leftJoin(sql`employees as mgr`, sql`${employees.managerId} = mgr.id`)
        .where(and(...conditions, sql`${employees.managerId} IS NOT NULL`))
        .groupBy(employees.managerId, sql`mgr.name`);

      // Calcular profundidade máxima da hierarquia
      const allEmployees = await db
        .select({
          id: employees.id,
          managerId: employees.managerId,
        })
        .from(employees)
        .where(whereClause);

      const calculateDepth = (empId: number, visited = new Set<number>()): number => {
        if (visited.has(empId)) return 0; // Evitar loops
        visited.add(empId);

        const emp = allEmployees.find((e) => e.id === empId);
        if (!emp || !emp.managerId) return 1;

        return 1 + calculateDepth(emp.managerId, visited);
      };

      const depths = allEmployees.map((emp) => calculateDepth(emp.id));
      const maxDepth = Math.max(...depths, 0);

      // Identificar alertas de risco
      const alerts = [];

      // Alerta: Gestores com muitos subordinados diretos (>10)
      const overloadedManagers = spanOfControl.filter((soc) => soc.subordinateCount > 10);
      if (overloadedManagers.length > 0) {
        alerts.push({
          type: "span_of_control_high",
          severity: "warning",
          message: `${overloadedManagers.length} gestor(es) com mais de 10 subordinados diretos`,
          data: overloadedManagers,
        });
      }

      // Alerta: Hierarquia muito profunda (>6 níveis)
      if (maxDepth > 6) {
        alerts.push({
          type: "hierarchy_too_deep",
          severity: "warning",
          message: `Hierarquia com ${maxDepth} níveis (recomendado: máximo 6)`,
          data: { maxDepth },
        });
      }

      // Alerta: Muitos funcionários sem gestor
      if (employeesWithoutManager > 5) {
        alerts.push({
          type: "too_many_without_manager",
          severity: "info",
          message: `${employeesWithoutManager} funcionários sem gestor definido`,
          data: { count: employeesWithoutManager },
        });
      }

      return {
        totalEmployees,
        employeesWithoutManager,
        maxHierarchyDepth: maxDepth,
        averageSpanOfControl:
          spanOfControl.length > 0
            ? spanOfControl.reduce((sum, soc) => sum + soc.subordinateCount, 0) / spanOfControl.length
            : 0,
        spanOfControlDistribution: spanOfControl || [],
        alerts: alerts || [],
      };
    }),
});
