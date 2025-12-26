import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { approverAssignments, approverRoles, employees } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Router para Monitoramento de Aprovadores
 * Monitora status de aprovadores e envia alertas quando há problemas
 */

export const approverMonitoringRouter = router({
  /**
   * Dashboard de status de aprovadores
   * Retorna estatísticas e status de todos os aprovadores
   */
  getDashboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar todas as atribuições de aprovadores
    const assignments = await db
      .select({
        id: approverAssignments.id,
        roleId: approverAssignments.roleId,
        employeeId: approverAssignments.employeeId,
        isActive: approverAssignments.isActive,
        isPrimary: approverAssignments.isPrimary,
        roleName: approverRoles.name,
        roleCode: approverRoles.code,
        employeeName: employees.name,
        employeeActive: employees.active,
        employeeEmail: employees.email,
      })
      .from(approverAssignments)
      .leftJoin(approverRoles, eq(approverAssignments.roleId, approverRoles.id))
      .leftJoin(employees, eq(approverAssignments.employeeId, employees.id));

    // Estatísticas
    const total = assignments.length;
    const active = assignments.filter((a) => a.isActive && a.employeeActive).length;
    const inactive = assignments.filter((a) => !a.isActive || !a.employeeActive).length;
    const employeeInactive = assignments.filter((a) => !a.employeeActive).length;

    // Agrupar por papel
    const byRole: Record<string, any> = {};
    for (const assignment of assignments) {
      const roleCode = assignment.roleCode || "unknown";
      if (!byRole[roleCode]) {
        byRole[roleCode] = {
          roleCode,
          roleName: assignment.roleName,
          total: 0,
          active: 0,
          inactive: 0,
          employeeInactive: 0,
          approvers: [],
        };
      }

      byRole[roleCode].total++;
      if (assignment.isActive && assignment.employeeActive) {
        byRole[roleCode].active++;
      } else {
        byRole[roleCode].inactive++;
      }

      if (!assignment.employeeActive) {
        byRole[roleCode].employeeInactive++;
      }

      byRole[roleCode].approvers.push({
        id: assignment.id,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        employeeEmail: assignment.employeeEmail,
        isActive: assignment.isActive,
        employeeActive: assignment.employeeActive,
        isPrimary: assignment.isPrimary,
        status:
          !assignment.employeeActive
            ? "employee_inactive"
            : !assignment.isActive
            ? "assignment_inactive"
            : "active",
      });
    }

    // Identificar papéis sem aprovadores ativos
    const rolesWithoutApprovers: string[] = [];
    const allRoles = await db.select().from(approverRoles).where(eq(approverRoles.isActive, true));

    for (const role of allRoles) {
      const roleAssignments = assignments.filter(
        (a) => a.roleId === role.id && a.isActive && a.employeeActive
      );
      if (roleAssignments.length === 0) {
        rolesWithoutApprovers.push(role.name);
      }
    }

    return {
      summary: {
        total,
        active,
        inactive,
        employeeInactive,
        rolesWithoutApprovers: rolesWithoutApprovers.length,
      },
      byRole: Object.values(byRole),
      alerts: {
        rolesWithoutApprovers,
        criticalIssues: employeeInactive > 0 || rolesWithoutApprovers.length > 0,
      },
    };
  }),

  /**
   * Verificar status de aprovadores e enviar alertas
   * Procedure que pode ser chamada periodicamente (ex: via cron)
   */
  checkAndAlert: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar aprovadores inativos
    const inactiveApprovers = await db
      .select({
        id: approverAssignments.id,
        roleId: approverAssignments.roleId,
        employeeId: approverAssignments.employeeId,
        roleName: approverRoles.name,
        roleCode: approverRoles.code,
        employeeName: employees.name,
        employeeActive: employees.active,
      })
      .from(approverAssignments)
      .leftJoin(approverRoles, eq(approverAssignments.roleId, approverRoles.id))
      .leftJoin(employees, eq(approverAssignments.employeeId, employees.id))
      .where(
        and(
          eq(approverAssignments.isActive, true), // Atribuição ativa
          eq(employees.active, false) // Mas funcionário inativo
        )
      );

    // Buscar papéis sem aprovadores
    const allRoles = await db.select().from(approverRoles).where(eq(approverRoles.isActive, true));

    const rolesWithoutApprovers: Array<{ roleId: number; roleName: string; roleCode: string }> = [];

    for (const role of allRoles) {
      const activeAssignments = await db
        .select()
        .from(approverAssignments)
        .leftJoin(employees, eq(approverAssignments.employeeId, employees.id))
        .where(
          and(
            eq(approverAssignments.roleId, role.id),
            eq(approverAssignments.isActive, true),
            eq(employees.active, true)
          )
        );

      if (activeAssignments.length === 0) {
        rolesWithoutApprovers.push({
          roleId: role.id,
          roleName: role.name,
          roleCode: role.code,
        });
      }
    }

    // Enviar alertas se houver problemas
    let alertsSent = 0;

    if (inactiveApprovers.length > 0) {
      const message = `
🚨 **Alerta: Aprovadores Inativos Detectados**

Foram encontrados ${inactiveApprovers.length} aprovadores com funcionários inativos:

${inactiveApprovers
  .map(
    (a) =>
      `- **${a.roleName}** (${a.roleCode}): ${a.employeeName} (ID: ${a.employeeId}) está inativo`
  )
  .join("\n")}

**Ação Necessária:** Acesse a Gestão de Aprovadores e atribua novos aprovadores ativos para estes papéis.

🔗 [Acessar Gestão de Aprovadores](/admin/gestao-aprovadores)
      `.trim();

      await notifyOwner({
        title: "⚠️ Aprovadores Inativos Detectados",
        content: message,
      });

      alertsSent++;
    }

    if (rolesWithoutApprovers.length > 0) {
      const message = `
🚨 **Alerta Crítico: Papéis Sem Aprovadores**

Os seguintes papéis de aprovação não possuem aprovadores ativos:

${rolesWithoutApprovers.map((r) => `- **${r.roleName}** (${r.roleCode})`).join("\n")}

**Impacto:** Processos de aprovação podem estar bloqueados!

**Ação Necessária:** Atribua aprovadores ativos imediatamente para estes papéis.

🔗 [Acessar Gestão de Aprovadores](/admin/gestao-aprovadores)
      `.trim();

      await notifyOwner({
        title: "🔴 Papéis Sem Aprovadores - Ação Urgente",
        content: message,
      });

      alertsSent++;
    }

    return {
      success: true,
      inactiveApprovers: inactiveApprovers.length,
      rolesWithoutApprovers: rolesWithoutApprovers.length,
      alertsSent,
      details: {
        inactiveApprovers: inactiveApprovers.map((a) => ({
          roleName: a.roleName,
          employeeName: a.employeeName,
          employeeId: a.employeeId,
        })),
        rolesWithoutApprovers,
      },
    };
  }),

  /**
   * Histórico de mudanças de aprovadores
   */
  getChangeHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          roleId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Por enquanto, retornar dados mockados
      // TODO: Implementar tabela de auditoria para mudanças de aprovadores
      return {
        changes: [],
        total: 0,
      };
    }),

  /**
   * Sugestões de substituição automática
   * Sugere funcionários ativos que podem substituir aprovadores inativos
   */
  getSuggestions: adminProcedure
    .input(
      z.object({
        roleId: z.number(),
        employeeId: z.number(), // Aprovador inativo
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar papel e aprovador inativo
      const role = await db.select().from(approverRoles).where(eq(approverRoles.id, input.roleId)).limit(1);

      if (role.length === 0) {
        throw new Error("Papel não encontrado");
      }

      const inactiveEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (inactiveEmployee.length === 0) {
        throw new Error("Funcionário não encontrado");
      }

      // Buscar funcionários ativos da mesma gerência/departamento
      const suggestions = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.active, true),
            eq(employees.gerencia, inactiveEmployee[0].gerencia || "")
          )
        )
        .limit(10);

      return {
        role: role[0],
        inactiveEmployee: inactiveEmployee[0],
        suggestions: suggestions.map((emp) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          position: emp.funcao,
          department: emp.gerencia,
          hierarchyLevel: emp.hierarchyLevel,
        })),
      };
    }),
});
