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
import { notifyNewEmployee } from "../adminRhEmailService";

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
        hireDateFrom: z.string().optional(),
        hireDateTo: z.string().optional(),
        assessmentStatus: z.enum(["with_assessment", "without_assessment", "in_progress", "completed"]).optional(),
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const params = input || {};
        const limit = params.limit ?? 100;
        const offset = params.offset ?? 0;
        
        // listEmployees já retorna estrutura flat correta
        const allEmployees = await listEmployees(params);
        
        // Garantir que allEmployees é um array válido
        const safeEmployees = Array.isArray(allEmployees) ? allEmployees : [];
        
        // Aplicar paginação
        const paginatedEmployees = safeEmployees.slice(offset, offset + limit);
        
        return {
          employees: paginatedEmployees,
          total: safeEmployees.length,
          hasMore: offset + limit < safeEmployees.length,
        };
      } catch (error) {
        console.error('[employees.list] Erro ao listar funcionários:', error);
        // Retornar array vazio ao invés de erro para não quebrar a UI
        return {
          employees: [],
          total: 0,
          hasMore: false,
        };
      }
    }),

  /**
   * Obter funcionário por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getEmployeeById } = await import("../db");
      const employee = await getEmployeeById(input.id);
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }
      return employee;
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
  getCurrent: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
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
   * Obter funcionário do usuário logado (alias para getCurrent)
   */
  me: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
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

      // Enviar notificação para Admin e RH
      try {
        const { getDb } = await import("../db");
        const { departments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await getDb();
        let departmentName = "N/A";
        if (database) {
          const [dept] = await database.select().from(departments).where(eq(departments.id, input.departmentId)).limit(1);
          departmentName = dept?.name || "N/A";
        }
        await notifyNewEmployee(
          input.name,
          input.employeeCode,
          departmentName
        );
      } catch (error) {
        console.error('[EmployeesRouter] Failed to send email notification:', error);
      }

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
   * Deletar funcionário permanentemente
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar funcionários permanentemente",
        });
      }

      const { getDb } = await import("../db");
      const { employees } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await database.delete(employees).where(eq(employees.id, input.id));

      await logEmployeeAudit({
        employeeId: input.id,
        action: "deletado",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Alternar status do funcionário (ativo/desligado)
   */
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem alterar status de funcionários",
        });
      }

      const { getDb } = await import("../db");
      const { employees } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar funcionário atual
      const [employee] = await database.select().from(employees).where(eq(employees.id, input.id));
      
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      // Alternar status
      const newStatus = employee.status === "ativo" ? "desligado" : "ativo";
      await database.update(employees).set({ status: newStatus }).where(eq(employees.id, input.id));

      await logEmployeeAudit({
        employeeId: input.id,
        action: newStatus === "ativo" ? "reativado" : "desativado",
        changedBy: ctx.user.id,
      });

      return { success: true, newStatus };
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
            search: z.string().optional(),
            hireDateFrom: z.string().optional(),
            hireDateTo: z.string().optional(),
            assessmentStatus: z.enum(['with_assessment', 'without_assessment', 'in_progress', 'completed']).optional(),
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
      
      // Formatar dados para exportação
      const formattedData = employees.map(emp => ({
        'Matrícula': emp.employee.employeeCode || emp.employee.chapa || '-',
        'Nome': emp.employee.name || '-',
        'Email': emp.employee.email || '-',
        'CPF': emp.employee.cpf || '-',
        'Departamento': emp.department?.name || '-',
        'Cargo': emp.position?.title || '-',
        'Data de Admissão': emp.employee.hireDate ? new Date(emp.employee.hireDate).toLocaleDateString('pt-BR') : '-',
        'Salário': emp.employee.salary ? `R$ ${(emp.employee.salary / 100).toFixed(2)}` : '-',
        'Status': emp.employee.status || '-',
        'Telefone': emp.employee.phone || '-',
      }));
      
      if (input.format === 'csv') {
        // Gerar CSV
        const headers = Object.keys(formattedData[0] || {});
        const csvRows = [
          headers.join(','),
          ...formattedData.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row] || '';
              // Escapar aspas e adicionar aspas se contém vírgula
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
          )
        ];
        const csvContent = csvRows.join('\n');
        
        return {
          content: csvContent,
          filename: `funcionarios_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv;charset=utf-8;',
          count: employees.length,
        };
      } else {
        // Para Excel, retornar dados estruturados (frontend usará biblioteca)
        return {
          data: formattedData,
          filename: `funcionarios_${new Date().toISOString().split('T')[0]}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          count: employees.length,
        };
      }
    }),

  /**
   * Obter lista de departamentos
   */
  getDepartments: protectedProcedure.input(z.object({})).query(async () => {
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
  listSalaryLeads: protectedProcedure.input(z.object({})).query(async () => {
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
  getHierarchy: protectedProcedure.input(z.object({})).query(async () => {
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
  exportHierarchyReport: protectedProcedure.input(z.object({})).query(async () => {
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
  getCostCenters: protectedProcedure.input(z.object({})).query(async () => {
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
  getManagers: protectedProcedure.input(z.object({})).query(async () => {
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
  getLeaders: protectedProcedure.input(z.object({})).query(async () => {
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
    .optional())
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

  /**
   * Identificar registros inconsistentes no banco de dados
   */
  identifyInconsistentRecords: protectedProcedure
    .query(async ({ ctx }) => {
      // Apenas admin e RH podem executar
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem identificar registros inconsistentes",
        });
      }

      const { identifyInconsistentRecords } = await import("../db");
      return await identifyInconsistentRecords();
    }),

  /**
   * Limpar registros inconsistentes (soft delete)
   */
  cleanInconsistentRecords: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Apenas admin pode executar
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem limpar registros inconsistentes",
        });
      }

      const { cleanInconsistentRecords } = await import("../db");
      return await cleanInconsistentRecords();
    }),

  /**
   * Obter perfil completo de um funcionário
   * Inclui: dados básicos, testes, avaliações, metas, PDI, feedbacks, etc.
   */
  getFullProfile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const { getEmployeeFullProfile } = await import("../db");
      const profile = await getEmployeeFullProfile(input.id);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      return profile;
    }),

  /**
   * Obter perfil completo do funcionário logado
   */
  getMyFullProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const { getEmployeeByUserId, getEmployeeFullProfile } = await import("../db");
      
      // Buscar employeeId do usuário logado
      const employee = await getEmployeeByUserId(ctx.user.id);
      
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado para o usuário logado",
        });
      }

      const profile = await getEmployeeFullProfile(employee.id);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil do funcionário não encontrado",
        });
      }

      return profile;
    }),

  /**
   * Criar funcionários de exemplo (seed)
   * APENAS PARA DESENVOLVIMENTO/DEMONSTRAÇÃO
   */
  seedSampleEmployees: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar dados de exemplo",
        });
      }

      const { getDb } = await import("../db");
      const { employees, departments, positions } = await import("../../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Verificar se já existem funcionários
        const existingEmployees = await database.select().from(employees);
        if (existingEmployees.length > 0) {
          return {
            success: false,
            message: "Já existem funcionários cadastrados. Seed não executado para evitar duplicatas.",
            count: existingEmployees.length,
          };
        }

        // Buscar departamentos e cargos existentes
        const depts = await database.select().from(departments);
        const positionsData = await database.select().from(positions);

        if (depts.length === 0 || positionsData.length === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "É necessário ter departamentos e cargos cadastrados antes de criar funcionários",
          });
        }

        // Criar estrutura hierárquica de funcionários
        const employeesData = [
          // CEO (sem gestor)
          {
            employeeCode: "EMP001",
            name: "João Silva",
            email: "joao.silva@empresa.com",
            chapa: "001",
            departmentId: depts[0]?.id,
            positionId: positionsData[0]?.id,
            managerId: null,
            cargo: "CEO",
            departamento: depts[0]?.name,
            telefone: "(11) 98765-4321",
            active: true,
          },
          {
            employeeCode: "EMP002",
            name: "Maria Santos",
            email: "maria.santos@empresa.com",
            chapa: "002",
            departmentId: depts[1]?.id || depts[0]?.id,
            positionId: positionsData[1]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Diretora de RH",
            departamento: depts[1]?.name || depts[0]?.name,
            telefone: "(11) 98765-4322",
            active: true,
          },
          {
            employeeCode: "EMP003",
            name: "Carlos Oliveira",
            email: "carlos.oliveira@empresa.com",
            chapa: "003",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[1]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Diretor de TI",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4323",
            active: true,
          },
          {
            employeeCode: "EMP004",
            name: "Ana Paula Costa",
            email: "ana.costa@empresa.com",
            chapa: "004",
            departmentId: depts[3]?.id || depts[0]?.id,
            positionId: positionsData[1]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Diretora Comercial",
            departamento: depts[3]?.name || depts[0]?.name,
            telefone: "(11) 98765-4324",
            active: true,
          },
          {
            employeeCode: "EMP005",
            name: "Pedro Almeida",
            email: "pedro.almeida@empresa.com",
            chapa: "005",
            departmentId: depts[1]?.id || depts[0]?.id,
            positionId: positionsData[2]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Gerente de Recrutamento",
            departamento: depts[1]?.name || depts[0]?.name,
            telefone: "(11) 98765-4325",
            active: true,
          },
          {
            employeeCode: "EMP006",
            name: "Juliana Ferreira",
            email: "juliana.ferreira@empresa.com",
            chapa: "006",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[2]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Gerente de Desenvolvimento",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4326",
            active: true,
          },
          {
            employeeCode: "EMP007",
            name: "Roberto Lima",
            email: "roberto.lima@empresa.com",
            chapa: "007",
            departmentId: depts[3]?.id || depts[0]?.id,
            positionId: positionsData[2]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Gerente de Vendas",
            departamento: depts[3]?.name || depts[0]?.name,
            telefone: "(11) 98765-4327",
            active: true,
          },
          {
            employeeCode: "EMP008",
            name: "Fernanda Souza",
            email: "fernanda.souza@empresa.com",
            chapa: "008",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[3]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Coordenadora de Projetos",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4328",
            active: true,
          },
          {
            employeeCode: "EMP009",
            name: "Marcos Pereira",
            email: "marcos.pereira@empresa.com",
            chapa: "009",
            departmentId: depts[3]?.id || depts[0]?.id,
            positionId: positionsData[3]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Coordenador de Vendas",
            departamento: depts[3]?.name || depts[0]?.name,
            telefone: "(11) 98765-4329",
            active: true,
          },
          {
            employeeCode: "EMP010",
            name: "Beatriz Rodrigues",
            email: "beatriz.rodrigues@empresa.com",
            chapa: "010",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[4]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista de Sistemas Sênior",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4330",
            active: true,
          },
          {
            employeeCode: "EMP011",
            name: "Lucas Martins",
            email: "lucas.martins@empresa.com",
            chapa: "011",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[5]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista de Sistemas Pleno",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4331",
            active: true,
          },
          {
            employeeCode: "EMP012",
            name: "Camila Dias",
            email: "camila.dias@empresa.com",
            chapa: "012",
            departmentId: depts[1]?.id || depts[0]?.id,
            positionId: positionsData[5]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista de RH Pleno",
            departamento: depts[1]?.name || depts[0]?.name,
            telefone: "(11) 98765-4332",
            active: true,
          },
          {
            employeeCode: "EMP013",
            name: "Rafael Santos",
            email: "rafael.santos@empresa.com",
            chapa: "013",
            departmentId: depts[3]?.id || depts[0]?.id,
            positionId: positionsData[4]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista Comercial Sênior",
            departamento: depts[3]?.name || depts[0]?.name,
            telefone: "(11) 98765-4333",
            active: true,
          },
          {
            employeeCode: "EMP014",
            name: "Patricia Oliveira",
            email: "patricia.oliveira@empresa.com",
            chapa: "014",
            departmentId: depts[2]?.id || depts[0]?.id,
            positionId: positionsData[6]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista de Sistemas Júnior",
            departamento: depts[2]?.name || depts[0]?.name,
            telefone: "(11) 98765-4334",
            active: true,
          },
          {
            employeeCode: "EMP015",
            name: "Thiago Costa",
            email: "thiago.costa@empresa.com",
            chapa: "015",
            departmentId: depts[3]?.id || depts[0]?.id,
            positionId: positionsData[6]?.id || positionsData[0]?.id,
            managerId: null,
            cargo: "Analista Comercial Júnior",
            departamento: depts[3]?.name || depts[0]?.name,
            telefone: "(11) 98765-4335",
            active: true,
          },
        ];

        // Inserir funcionários
        const insertedIds: number[] = [];
        for (const emp of employeesData) {
          const result = await database.insert(employees).values(emp);
          insertedIds.push(Number(result[0].insertId));
        }

        // Atualizar hierarquia (managerId)
        // Diretores (2,3,4) reportam ao CEO (1)
        if (insertedIds.length >= 4) {
          await database.update(employees)
            .set({ managerId: insertedIds[0] })
            .where(sql`id IN (${insertedIds[1]}, ${insertedIds[2]}, ${insertedIds[3]})`);
        }

        // Gerentes reportam aos Diretores
        if (insertedIds.length >= 7) {
          await database.update(employees).set({ managerId: insertedIds[1] }).where(sql`id = ${insertedIds[4]}`); // Gerente RH -> Diretora RH
          await database.update(employees).set({ managerId: insertedIds[2] }).where(sql`id = ${insertedIds[5]}`); // Gerente TI -> Diretor TI
          await database.update(employees).set({ managerId: insertedIds[3] }).where(sql`id = ${insertedIds[6]}`); // Gerente Comercial -> Diretora Comercial
        }

        // Coordenadores reportam aos Gerentes
        if (insertedIds.length >= 9) {
          await database.update(employees).set({ managerId: insertedIds[5] }).where(sql`id = ${insertedIds[7]}`); // Coord. Projetos -> Gerente TI
          await database.update(employees).set({ managerId: insertedIds[6] }).where(sql`id = ${insertedIds[8]}`); // Coord. Vendas -> Gerente Comercial
        }

        // Analistas reportam aos Coordenadores/Gerentes
        if (insertedIds.length >= 15) {
          await database.update(employees).set({ managerId: insertedIds[7] }).where(sql`id IN (${insertedIds[9]}, ${insertedIds[10]}, ${insertedIds[13]})`);
          await database.update(employees).set({ managerId: insertedIds[4] }).where(sql`id = ${insertedIds[11]}`); // Analista RH -> Gerente RH
          await database.update(employees).set({ managerId: insertedIds[8] }).where(sql`id IN (${insertedIds[12]}, ${insertedIds[14]})`);
        }

        return {
          success: true,
          message: `${employeesData.length} funcionários de exemplo criados com sucesso!`,
          count: employeesData.length,
        };
      } catch (error) {
        console.error("Erro ao criar funcionários de exemplo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao criar funcionários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),
});
