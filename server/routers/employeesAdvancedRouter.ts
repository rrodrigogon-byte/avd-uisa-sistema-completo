import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { 
  employees, 
  employeeMovements, 
  departments, 
  positions,
  users 
} from "../../drizzle/schema";
import { eq, and, desc, sql, or, like, inArray } from "drizzle-orm";
import { 
  sendPromotionNotificationEmail, 
  sendTransferNotificationEmail, 
  sendTerminationNotificationEmail 
} from "../_core/email";

/**
 * Router Avançado para Gestão de Funcionários
 * Inclui operações de promoção, transferência, desligamento e histórico
 */
export const employeesAdvancedRouter = router({
  /**
   * Promover funcionário (mudança de cargo/posição)
   */
  promote: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        newPositionId: z.number(),
        newDepartmentId: z.number().optional(),
        newSalary: z.number().optional(),
        reason: z.string(),
        notes: z.string().optional(),
        effectiveDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar dados atuais do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      // Criar registro de movimentação
      const [movement] = await db.insert(employeeMovements).values({
        employeeId: input.employeeId,
        previousPositionId: employee.positionId,
        previousDepartmentId: employee.departmentId,
        newPositionId: input.newPositionId,
        newDepartmentId: input.newDepartmentId || employee.departmentId,
        movementType: "promocao",
        reason: input.reason,
        notes: input.notes,
        approvalStatus: "aprovado",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        effectiveDate: new Date(input.effectiveDate),
        createdBy: ctx.user.id,
      });

      // Atualizar dados do funcionário
      const updateData: any = {
        positionId: input.newPositionId,
      };

      if (input.newDepartmentId) {
        updateData.departmentId = input.newDepartmentId;
      }

      if (input.newSalary) {
        updateData.salary = input.newSalary;
      }

      await db
        .update(employees)
        .set(updateData)
        .where(eq(employees.id, input.employeeId));

      // Buscar dados para o email
      const [previousPosition] = await db
        .select({ title: positions.title })
        .from(positions)
        .where(eq(positions.id, employee.positionId!))
        .limit(1);

      const [newPosition] = await db
        .select({ title: positions.title })
        .from(positions)
        .where(eq(positions.id, input.newPositionId))
        .limit(1);

      let newDepartmentName: string | undefined;
      if (input.newDepartmentId) {
        const [newDept] = await db
          .select({ name: departments.name })
          .from(departments)
          .where(eq(departments.id, input.newDepartmentId))
          .limit(1);
        newDepartmentName = newDept?.name;
      }

      // Enviar email de notificação
      if (employee.email) {
        try {
          await sendPromotionNotificationEmail(
            employee.email,
            employee.name,
            {
              previousPosition: previousPosition?.title || "N/A",
              newPosition: newPosition?.title || "N/A",
              newDepartment: newDepartmentName,
              newSalary: input.newSalary,
              effectiveDate: input.effectiveDate,
              reason: input.reason,
            }
          );
        } catch (error) {
          console.error("Erro ao enviar email de promoção:", error);
        }
      }

      return {
        success: true,
        movementId: movement.insertId,
        message: "Funcionário promovido com sucesso",
      };
    }),

  /**
   * Transferir funcionário (mudança de departamento/gestor)
   */
  transfer: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        newDepartmentId: z.number(),
        newManagerId: z.number().optional(),
        newPositionId: z.number().optional(),
        reason: z.string(),
        notes: z.string().optional(),
        effectiveDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar dados atuais do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      // Criar registro de movimentação
      const [movement] = await db.insert(employeeMovements).values({
        employeeId: input.employeeId,
        previousDepartmentId: employee.departmentId,
        previousPositionId: employee.positionId,
        previousManagerId: employee.managerId,
        newDepartmentId: input.newDepartmentId,
        newPositionId: input.newPositionId || employee.positionId,
        newManagerId: input.newManagerId,
        movementType: "transferencia",
        reason: input.reason,
        notes: input.notes,
        approvalStatus: "aprovado",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        effectiveDate: new Date(input.effectiveDate),
        createdBy: ctx.user.id,
      });

      // Atualizar dados do funcionário
      const updateData: any = {
        departmentId: input.newDepartmentId,
      };

      if (input.newManagerId !== undefined) {
        updateData.managerId = input.newManagerId;
      }

      if (input.newPositionId) {
        updateData.positionId = input.newPositionId;
      }

      await db
        .update(employees)
        .set(updateData)
        .where(eq(employees.id, input.employeeId));

      // Buscar dados para o email
      const [previousDept] = await db
        .select({ name: departments.name })
        .from(departments)
        .where(eq(departments.id, employee.departmentId!))
        .limit(1);

      const [newDept] = await db
        .select({ name: departments.name })
        .from(departments)
        .where(eq(departments.id, input.newDepartmentId))
        .limit(1);

      let previousManagerName: string | undefined;
      if (employee.managerId) {
        const [prevMgr] = await db
          .select({ name: employees.name })
          .from(employees)
          .where(eq(employees.id, employee.managerId))
          .limit(1);
        previousManagerName = prevMgr?.name;
      }

      let newManagerName: string | undefined;
      if (input.newManagerId) {
        const [newMgr] = await db
          .select({ name: employees.name })
          .from(employees)
          .where(eq(employees.id, input.newManagerId))
          .limit(1);
        newManagerName = newMgr?.name;
      }

      let newPositionTitle: string | undefined;
      if (input.newPositionId) {
        const [newPos] = await db
          .select({ title: positions.title })
          .from(positions)
          .where(eq(positions.id, input.newPositionId))
          .limit(1);
        newPositionTitle = newPos?.title;
      }

      // Enviar email de notificação
      if (employee.email) {
        try {
          await sendTransferNotificationEmail(
            employee.email,
            employee.name,
            {
              previousDepartment: previousDept?.name || "N/A",
              newDepartment: newDept?.name || "N/A",
              previousManager: previousManagerName,
              newManager: newManagerName,
              newPosition: newPositionTitle,
              effectiveDate: input.effectiveDate,
              reason: input.reason,
            }
          );
        } catch (error) {
          console.error("Erro ao enviar email de transferência:", error);
        }
      }

      return {
        success: true,
        movementId: movement.insertId,
        message: "Funcionário transferido com sucesso",
      };
    }),

  /**
   * Desligar funcionário
   */
  terminate: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        reason: z.string(),
        notes: z.string().optional(),
        effectiveDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar dados atuais do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      if (!employee.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Funcionário já está desligado",
        });
      }

      // Criar registro de movimentação
      const [movement] = await db.insert(employeeMovements).values({
        employeeId: input.employeeId,
        previousDepartmentId: employee.departmentId,
        previousPositionId: employee.positionId,
        previousManagerId: employee.managerId,
        newDepartmentId: null,
        newPositionId: null,
        newManagerId: null,
        movementType: "desligamento",
        reason: input.reason,
        notes: input.notes,
        approvalStatus: "aprovado",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        effectiveDate: new Date(input.effectiveDate),
        createdBy: ctx.user.id,
      });

      // Desativar funcionário
      await db
        .update(employees)
        .set({ 
          active: false,
          departmentId: null,
          positionId: null,
          managerId: null,
        })
        .where(eq(employees.id, input.employeeId));

      // Buscar dados para o email
      let positionTitle = "N/A";
      if (employee.positionId) {
        const [pos] = await db
          .select({ title: positions.title })
          .from(positions)
          .where(eq(positions.id, employee.positionId))
          .limit(1);
        positionTitle = pos?.title || "N/A";
      }

      let departmentName = "N/A";
      if (employee.departmentId) {
        const [dept] = await db
          .select({ name: departments.name })
          .from(departments)
          .where(eq(departments.id, employee.departmentId))
          .limit(1);
        departmentName = dept?.name || "N/A";
      }

      // Enviar email de notificação
      if (employee.email) {
        try {
          await sendTerminationNotificationEmail(
            employee.email,
            employee.name,
            {
              position: positionTitle,
              department: departmentName,
              effectiveDate: input.effectiveDate,
              reason: input.reason,
            }
          );
        } catch (error) {
          console.error("Erro ao enviar email de desligamento:", error);
        }
      }

      return {
        success: true,
        movementId: movement.insertId,
        message: "Funcionário desligado com sucesso",
      };
    }),

  /**
   * Obter histórico de mudanças de um funcionário
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const movements = await db
        .select({
          id: employeeMovements.id,
          movementType: employeeMovements.movementType,
          reason: employeeMovements.reason,
          notes: employeeMovements.notes,
          effectiveDate: employeeMovements.effectiveDate,
          approvalStatus: employeeMovements.approvalStatus,
          approvedAt: employeeMovements.approvedAt,
          createdAt: employeeMovements.createdAt,
          previousDepartment: {
            id: departments.id,
            name: departments.name,
          },
          previousPosition: {
            id: positions.id,
            title: positions.title,
          },
        })
        .from(employeeMovements)
        .leftJoin(departments, eq(employeeMovements.previousDepartmentId, departments.id))
        .leftJoin(positions, eq(employeeMovements.previousPositionId, positions.id))
        .where(eq(employeeMovements.employeeId, input.employeeId))
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(input.limit)
        .offset(input.offset);

      return {
        movements,
        total: movements.length,
      };
    }),

  /**
   * Obter detalhes completos de um funcionário
   */
  getFullDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar funcionário com relacionamentos
      const [employeeData] = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
          manager: {
            id: sql<number>`manager.id`,
            name: sql<string>`manager.name`,
            email: sql<string>`manager.email`,
          },
          user: users,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(
          sql`${employees} as manager`,
          sql`${employees.managerId} = manager.id`
        )
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.id, input.id))
        .limit(1);

      if (!employeeData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      // Buscar subordinados diretos
      const subordinates = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          position: {
            id: positions.id,
            title: positions.title,
          },
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.managerId, input.id));

      // Buscar últimas movimentações
      const recentMovements = await db
        .select()
        .from(employeeMovements)
        .where(eq(employeeMovements.employeeId, input.id))
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(5);

      return {
        ...employeeData,
        subordinates,
        recentMovements,
      };
    }),

  /**
   * Buscar funcionários com filtros avançados
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        departmentIds: z.array(z.number()).optional(),
        positionIds: z.array(z.number()).optional(),
        active: z.boolean().optional(),
        hasManager: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const conditions = [];

      if (input.query) {
        conditions.push(
          or(
            like(employees.name, `%${input.query}%`),
            like(employees.email, `%${input.query}%`),
            like(employees.employeeCode, `%${input.query}%`)
          )
        );
      }

      if (input.departmentIds && input.departmentIds.length > 0) {
        conditions.push(inArray(employees.departmentId, input.departmentIds));
      }

      if (input.positionIds && input.positionIds.length > 0) {
        conditions.push(inArray(employees.positionId, input.positionIds));
      }

      if (input.active !== undefined) {
        conditions.push(eq(employees.active, input.active));
      }

      if (input.hasManager !== undefined) {
        if (input.hasManager) {
          conditions.push(sql`${employees.managerId} IS NOT NULL`);
        } else {
          conditions.push(sql`${employees.managerId} IS NULL`);
        }
      }

      const results = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit)
        .offset(input.offset);

      return {
        employees: results,
        total: results.length,
      };
    }),
});
