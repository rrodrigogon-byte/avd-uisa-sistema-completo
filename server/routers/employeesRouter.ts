import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  listEmployees,
  upsertEmployee,
  deactivateEmployee,
  reactivateEmployee,
  logEmployeeAudit,
  getEmployeeAuditLog,
} from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Router para Gestão Completa de Funcionários (Item 1)
 */
export const employeesRouter = router({
  /**
   * Listar funcionários com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        status: z.enum(["ativo", "afastado", "desligado"]).optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await listEmployees(input || {});
    }),

  /**
   * Obter funcionário por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getEmployeeById } = await import("../db");
      return await getEmployeeById(input.id);
    }),

  /**
   * Obter funcionário por User ID
   */
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const { getEmployeeByUserId } = await import("../db");
      const employee = await getEmployeeByUserId(input.userId);
      return employee || null;
    }),

  /**
   * Obter funcionário do usuário logado
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }
    const { getEmployeeByUserId } = await import("../db");
    const employee = await getEmployeeByUserId(ctx.user.id);
    return employee || null;
  }),

  /**
   * Criar funcionário
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeCode: z.string().min(1),
        name: z.string().min(3),
        email: z.string().email(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        hireDate: z.string(),
        departmentId: z.number(),
        positionId: z.number(),
        managerId: z.number().optional(),
        salary: z.number().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão (admin ou RH)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem criar funcionários",
        });
      }

      const employeeId = await upsertEmployee({
        ...input,
        active: true,
        status: "ativo",
      });

      // Registrar auditoria
      await logEmployeeAudit({
        employeeId,
        action: "criado",
        changedBy: ctx.user.id,
      });

      return { id: employeeId, success: true };
    }),

  /**
   * Atualizar funcionário
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        managerId: z.number().optional(),
        salary: z.number().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem atualizar funcionários",
        });
      }

      const { id, ...updateData } = input;
      await upsertEmployee({ id, ...updateData });

      // Registrar auditoria para cada campo alterado
      for (const [field, value] of Object.entries(updateData)) {
        await logEmployeeAudit({
          employeeId: id,
          action: "atualizado",
          fieldChanged: field,
          newValue: String(value),
          changedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  /**
   * Desativar funcionário
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem desativar funcionários",
        });
      }

      await deactivateEmployee(input.id);

      await logEmployeeAudit({
        employeeId: input.id,
        action: "desativado",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Reativar funcionário
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem reativar funcionários",
        });
      }

      await reactivateEmployee(input.id);

      await logEmployeeAudit({
        employeeId: input.id,
        action: "reativado",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Obter histórico de auditoria
   */
  auditLog: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem ver logs de auditoria",
        });
      }

      return await getEmployeeAuditLog(input.employeeId);
    }),

  /**
   * Importar funcionários em lote (placeholder)
   */
  importBatch: protectedProcedure
    .input(
      z.object({
        fileUrl: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem importar funcionários",
        });
      }

      // TODO: Implementar lógica de importação
      // Por enquanto, apenas registrar a tentativa
      const { employeeImportHistory } = await import("../../drizzle/schema");
      const { getDb } = await import("../db");
      const db = await getDb();

      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db.insert(employeeImportHistory).values({
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        totalRecords: 0,
        successCount: 0,
        errorCount: 0,
        status: "processando",
        importedBy: ctx.user.id,
      });

      return {
        importId: result[0].insertId,
        message: "Importação iniciada. Processamento em andamento.",
      };
    }),

  /**
   * Exportar lista de funcionários
   */
  export: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "excel"]),
        filters: z
          .object({
            departmentId: z.number().optional(),
            positionId: z.number().optional(),
            status: z.enum(["ativo", "afastado", "desligado"]).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem exportar dados",
        });
      }

      const employees = await listEmployees(input.filters);

      // TODO: Implementar geração de arquivo CSV/Excel
      // Por enquanto, retornar os dados
      return {
        data: employees,
        format: input.format,
        count: employees.length,
      };
    }),

  /**
   * Obter lista de departamentos
   */
  getDepartments: protectedProcedure.query(async () => {
    const { getAllDepartments } = await import("../db");
    return await getAllDepartments();
  }),

  /**
   * Atualizar flag de Líder de Cargos e Salários
   */
  updateSalaryLeadFlag: protectedProcedure
    .input(z.object({
      userId: z.number(),
      isSalaryLead: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(users)
        .set({ isSalaryLead: input.isSalaryLead })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Listar líderes de cargos e salários
   */
  listSalaryLeads: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];

    const salaryLeads = await database
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isSalaryLead, true));

    return salaryLeads;
  }),

  /**
   * Buscar equipe direta do gestor
   */
  getTeamByManager: protectedProcedure
    .input(z.object({ managerId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { employees, departments, positions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) return [];

      const teamMembers = await database
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          managerId: employees.managerId,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
        })
        .from(employees)
        .where(eq(employees.managerId, input.managerId));

      const depts = await database.select().from(departments);
      const positionsData = await database.select().from(positions);

      return teamMembers.map(emp => ({
        ...emp,
        department: depts.find(d => d.id === emp.departmentId),
        position: positionsData.find((p: any) => p.id === emp.positionId),
      }));
    }),

  /**
   * Hierarquia organizacional
   */
  getHierarchy: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { employees, departments, positions } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];

    const allEmployees = await database
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeCode: employees.employeeCode,
        name: employees.name,
        email: employees.email,
        managerId: employees.managerId,
        costCenter: employees.costCenter,
        department: departments.name,
        departmentId: employees.departmentId,
        position: positions.title,
        positionId: employees.positionId,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id));
    
    const employeesWithCount = allEmployees.map(emp => {
      const subordinateCount = allEmployees.filter(e => e.managerId === emp.id).length;
      return { ...emp, subordinateCount };
    });
    
    return employeesWithCount;
  }),

  /**
   * Exportar relatório de hierarquia
   */
  exportHierarchyReport: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { employees, departments, positions } = await import("../../drizzle/schema");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const allEmployees = await database
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        managerId: employees.managerId,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
        costCenter: employees.costCenter,
      })
      .from(employees);

    const depts = await database.select().from(departments);
    const positionsData = await database.select().from(positions);

    const totalEmployees = allEmployees.length;
    const employeesWithManager = allEmployees.filter(e => e.managerId).length;
    const employeesWithoutManager = totalEmployees - employeesWithManager;
    const uniqueManagers = new Set(allEmployees.map(e => e.managerId).filter(Boolean)).size;

    const byDepartment = new Map<number, number>();
    allEmployees.forEach(e => {
      if (e.departmentId) {
        byDepartment.set(e.departmentId, (byDepartment.get(e.departmentId) || 0) + 1);
      }
    });

    const subordinatesCount = new Map<number, number>();
    allEmployees.forEach(e => {
      if (e.managerId) {
        subordinatesCount.set(e.managerId, (subordinatesCount.get(e.managerId) || 0) + 1);
      }
    });
    const avgSpanOfControl = subordinatesCount.size > 0
      ? Array.from(subordinatesCount.values()).reduce((a, b) => a + b, 0) / subordinatesCount.size
      : 0;

    return {
      totalEmployees,
      employeesWithManager,
      employeesWithoutManager,
      uniqueManagers,
      avgSpanOfControl: Math.round(avgSpanOfControl * 10) / 10,
      departmentStats: Array.from(byDepartment.entries()).map(([deptId, count]) => ({
        departmentId: deptId,
        departmentName: depts.find(d => d.id === deptId)?.name || `Dept ${deptId}`,
        count,
      })),
      employeesWithoutManagerList: allEmployees
        .filter(e => !e.managerId)
        .map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          department: depts.find(d => d.id === e.departmentId)?.name || "",
          position: positionsData.find((p: any) => p.id === e.positionId)?.title || "",
          costCenter: e.costCenter || "",
        })),
    };
  }),

  /**
   * Atualizar colaborador (campos específicos)
   */
  updateEmployee: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        managerId: z.number().optional(),
        costCenter: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { employees } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const updateData: any = {};
      if (input.managerId !== undefined) updateData.managerId = input.managerId;
      if (input.costCenter !== undefined) updateData.costCenter = input.costCenter;

      await database
        .update(employees)
        .set(updateData)
        .where(eq(employees.id, input.id));

      return { success: true, message: "Colaborador atualizado com sucesso" };
    }),

  /**
   * Obter centros de custo
   */
  getCostCenters: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { costCenters } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];

    const allCostCenters = await database.select().from(costCenters).where(eq(costCenters.active, true));
    return allCostCenters;
  }),

  /**
   * Obter gestores
   */
  getManagers: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { employees } = await import("../../drizzle/schema");
    const database = await getDb();
    if (!database) return [];

    const allEmployees = await database.select().from(employees);
    return allEmployees;
  }),

  /**
   * Buscar todos os líderes (colaboradores com subordinados)
   */
  getLeaders: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { employees, departments, positions } = await import("../../drizzle/schema");
    const database = await getDb();
    if (!database) return [];

    const allEmployees = await database
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
        managerId: employees.managerId,
        passwordHash: employees.passwordHash,
      })
      .from(employees);

    const depts = await database.select().from(departments);
    const positionsData = await database.select().from(positions);

    const leaders = allEmployees.filter(emp => {
      const subordinatesCount = allEmployees.filter(e => e.managerId === emp.id).length;
      return subordinatesCount > 0;
    });

    return leaders.map(leader => {
      const subordinatesCount = allEmployees.filter(e => e.managerId === leader.id).length;
      return {
        id: leader.id,
        name: leader.name,
        email: leader.email,
        department: depts.find(d => d.id === leader.departmentId)?.name || "N/A",
        position: positionsData.find((p: any) => p.id === leader.positionId)?.title || "N/A",
        subordinatesCount,
        hasPassword: !!leader.passwordHash,
      };
    });
  }),

  /**
   * Atualizar senha de líder
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        password: z.string().min(8),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { employees, passwordChangeHistory } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { sendEmail } = await import("../emailService");
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.password, 10);

      await database
        .update(employees)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(employees.id, input.employeeId));

      await database.insert(passwordChangeHistory).values({
        employeeId: input.employeeId,
        changedBy: ctx.user!.id,
        changedByName: ctx.user!.name || "Usuário desconhecido",
        reason: input.reason || "Cadastro/atualização de senha",
        ipAddress: null,
        userAgent: null,
      });

      const employee = await database
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (employee.length > 0 && employee[0].email) {
        try {
          await sendEmail({
            to: employee[0].email,
            subject: "Senha de Aprovação Cadastrada - Sistema AVD UISA",
            html: `<p>Olá ${employee[0].name},</p><p>Sua senha de aprovação para consensos em Avaliações 360° foi cadastrada com sucesso.</p><p>Você poderá utilizar esta senha para aprovar avaliações na etapa de consenso.</p><p>Atenciosamente,<br>Equipe AVD UISA</p>`,
          });
        } catch (emailError) {
          console.error("[updatePassword] Erro ao enviar email:", emailError);
        }
      }

      return { success: true, message: "Senha atualizada com sucesso" };
    }),

  /**
   * Histórico de alterações de senha
   */
  getPasswordHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { employees, passwordChangeHistory } = await import("../../drizzle/schema");
      const { eq, and, gte, lte, desc } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) return [];

      let query = database
        .select({
          id: passwordChangeHistory.id,
          employeeId: passwordChangeHistory.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          changedBy: passwordChangeHistory.changedBy,
          changedByName: passwordChangeHistory.changedByName,
          reason: passwordChangeHistory.reason,
          ipAddress: passwordChangeHistory.ipAddress,
          createdAt: passwordChangeHistory.createdAt,
        })
        .from(passwordChangeHistory)
        .innerJoin(employees, eq(passwordChangeHistory.employeeId, employees.id))
        .orderBy(desc(passwordChangeHistory.createdAt));

      const conditions = [];
      if (input.employeeId) {
        conditions.push(eq(passwordChangeHistory.employeeId, input.employeeId));
      }
      if (input.startDate) {
        conditions.push(gte(passwordChangeHistory.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(passwordChangeHistory.createdAt, new Date(input.endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const history = await query;
      return history;
    }),
});
