import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { employees, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router de Permissões
 * Gerencia validações de acesso baseadas em roles para operações críticas
 */
export const permissionsRouter = router({
  /**
   * Verifica se o usuário pode movimentar um colaborador
   * Apenas admin, RH e gestores diretos podem movimentar colaboradores
   */
  canMoveEmployee: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const userRole = ctx.user.role;

      // Admin e RH sempre podem movimentar
      if (userRole === "admin" || userRole === "rh") {
        return {
          canMove: true,
          reason: "Permissão total como " + (userRole === "admin" ? "administrador" : "RH"),
        };
      }

      // Para gestores, verificar se é gestor direto do colaborador
      if (userRole === "gestor") {
        // Buscar o colaborador associado ao usuário logado
        const [managerEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.userId, ctx.user.id))
          .limit(1);

        if (!managerEmployee) {
          return {
            canMove: false,
            reason: "Usuário gestor não está vinculado a um colaborador no sistema",
          };
        }

        // Buscar o colaborador que será movimentado
        const [targetEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);

        if (!targetEmployee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Colaborador não encontrado",
          });
        }

        // Verificar se é o gestor direto
        if (targetEmployee.managerId === managerEmployee.id) {
          return {
            canMove: true,
            reason: "Gestor direto do colaborador",
          };
        }

        return {
          canMove: false,
          reason: "Você não é o gestor direto deste colaborador",
        };
      }

      // Colaboradores comuns não podem movimentar
      return {
        canMove: false,
        reason: "Apenas administradores, RH e gestores podem movimentar colaboradores",
      };
    }),

  /**
   * Verifica se o usuário pode aprovar um PDI
   * Apenas admin, RH e gestores diretos podem aprovar PDIs
   */
  canApprovePDI: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const userRole = ctx.user.role;

      // Admin e RH sempre podem aprovar
      if (userRole === "admin" || userRole === "rh") {
        return {
          canApprove: true,
          reason: "Permissão total como " + (userRole === "admin" ? "administrador" : "RH"),
        };
      }

      // Para gestores, verificar se é gestor direto
      if (userRole === "gestor") {
        const [managerEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.userId, ctx.user.id))
          .limit(1);

        if (!managerEmployee) {
          return {
            canApprove: false,
            reason: "Usuário gestor não está vinculado a um colaborador no sistema",
          };
        }

        const [targetEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);

        if (!targetEmployee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Colaborador não encontrado",
          });
        }

        if (targetEmployee.managerId === managerEmployee.id) {
          return {
            canApprove: true,
            reason: "Gestor direto do colaborador",
          };
        }

        return {
          canApprove: false,
          reason: "Você não é o gestor direto deste colaborador",
        };
      }

      return {
        canApprove: false,
        reason: "Apenas administradores, RH e gestores podem aprovar PDIs",
      };
    }),

  /**
   * Verifica se o usuário pode editar dados organizacionais
   * Apenas admin e RH podem editar estrutura organizacional
   */
  canEditOrganization: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const userRole = ctx.user.role;

    if (userRole === "admin" || userRole === "rh") {
      return {
        canEdit: true,
        reason: "Permissão total como " + (userRole === "admin" ? "administrador" : "RH"),
      };
    }

    return {
      canEdit: false,
      reason: "Apenas administradores e RH podem editar a estrutura organizacional",
    };
  }),

  /**
   * Verifica se o usuário pode visualizar dados de um colaborador
   * Admin e RH veem todos, gestores veem sua equipe, colaboradores veem apenas seus dados
   */
  canViewEmployee: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const userRole = ctx.user.role;

      // Admin e RH podem ver todos
      if (userRole === "admin" || userRole === "rh") {
        return {
          canView: true,
          reason: "Permissão total como " + (userRole === "admin" ? "administrador" : "RH"),
        };
      }

      // Buscar colaborador do usuário logado
      const [userEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!userEmployee) {
        return {
          canView: false,
          reason: "Usuário não está vinculado a um colaborador no sistema",
        };
      }

      // Pode ver seus próprios dados
      if (userEmployee.id === input.employeeId) {
        return {
          canView: true,
          reason: "Visualização dos próprios dados",
        };
      }

      // Gestores podem ver dados de sua equipe
      if (userRole === "gestor") {
        const [targetEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);

        if (targetEmployee && targetEmployee.managerId === userEmployee.id) {
          return {
            canView: true,
            reason: "Gestor direto do colaborador",
          };
        }
      }

      return {
        canView: false,
        reason: "Você não tem permissão para visualizar dados deste colaborador",
      };
    }),

  /**
   * Retorna as permissões do usuário atual
   */
  getMyPermissions: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados não disponível",
      });
    }

    const userRole = ctx.user.role;

    // Buscar se usuário está vinculado a um colaborador
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, ctx.user.id))
      .limit(1);

    const isManager = employee?.managerId !== null && employee?.managerId !== undefined;

    return {
      role: userRole,
      isLinkedToEmployee: !!employee,
      employeeId: employee?.id,
      permissions: {
        canMoveEmployees: userRole === "admin" || userRole === "rh" || (userRole === "gestor" && isManager),
        canApprovePDI: userRole === "admin" || userRole === "rh" || (userRole === "gestor" && isManager),
        canEditOrganization: userRole === "admin" || userRole === "rh",
        canViewAllEmployees: userRole === "admin" || userRole === "rh",
        canManageUsers: userRole === "admin",
        canAccessReports: userRole === "admin" || userRole === "rh" || userRole === "gestor",
      },
    };
  }),
});
