import { z } from "zod";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, employees } from "../../drizzle/schema";
import { eq, and, or, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para gerenciamento de papéis e permissões de usuários
 * Permite configurar roles (admin, rh, gestor, colaborador) e flags especiais (isSalaryLead)
 */
export const userRolesRouter = router({
  /**
   * Listar usuários com seus papéis e permissões
   */
  list: protectedProcedure
    .input(
      z.object({
        role: z.enum(["admin", "rh", "gestor", "colaborador"]).optional(),
        isSalaryLead: z.boolean().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let conditions: any[] = [];

      if (input.role) {
        conditions.push(eq(users.role, input.role));
      }

      if (input.isSalaryLead !== undefined) {
        conditions.push(eq(users.isSalaryLead, input.isSalaryLead));
      }

      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const usersList = await db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          role: users.role,
          isSalaryLead: users.isSalaryLead,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(whereClause)
        .orderBy(users.name);

      return usersList;
    }),

  /**
   * Buscar usuário por ID com detalhes completos
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      return user;
    }),

  /**
   * Buscar usuário por email
   */
  getByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      return user || null;
    }),

  /**
   * Atualizar papel (role) de um usuário
   * Apenas admins podem executar
   */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "rh", "gestor", "colaborador"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Atualizar role
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: `Papel atualizado para ${input.role}`,
      };
    }),

  /**
   * Configurar usuário como Líder de Cargos e Salários
   * Apenas admins podem executar
   */
  setSalaryLead: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        isSalaryLead: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Atualizar flag
      await db
        .update(users)
        .set({ isSalaryLead: input.isSalaryLead })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: input.isSalaryLead
          ? "Usuário configurado como Líder de Cargos e Salários"
          : "Permissão de Líder de Cargos e Salários removida",
      };
    }),

  /**
   * Configurar Alexsandra como RH e Líder de Cargos e Salários
   * Procedure específica para a configuração inicial
   */
  configureAlexsandra: adminProcedure
    .input(z.object({}).optional())
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar Alexsandra por email ou nome
      const [alexsandra] = await db
        .select()
        .from(users)
        .where(
          or(
            like(users.email, "%alexsandra%"),
            like(users.name, "%Alexsandra%"),
            like(users.name, "%Alexandra%")
          )
        )
        .limit(1);

      if (!alexsandra) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário Alexsandra não encontrado. Verifique se ela já está cadastrada no sistema.",
        });
      }

      // Configurar como RH e Líder de Cargos e Salários
      await db
        .update(users)
        .set({
          role: "rh",
          isSalaryLead: true,
        })
        .where(eq(users.id, alexsandra.id));

      return {
        success: true,
        user: {
          id: alexsandra.id,
          name: alexsandra.name,
          email: alexsandra.email,
          role: "rh",
          isSalaryLead: true,
        },
        message: `Alexsandra (${alexsandra.email}) configurada como RH e Líder de Cargos e Salários`,
      };
    }),

  /**
   * Listar líderes de cargos e salários
   */
  listSalaryLeads: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const salaryLeads = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isSalaryLead: users.isSalaryLead,
        })
        .from(users)
        .where(eq(users.isSalaryLead, true))
        .orderBy(users.name);

      return salaryLeads;
    }),

  /**
   * Listar gestores (para atribuição de liderados)
   */
  listManagers: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.role, "gestor"))
        .orderBy(users.name);

      return managers;
    }),

  /**
   * Estatísticas de papéis
   */
  stats: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allUsers = await db.select().from(users);

      const byRole = {
        admin: allUsers.filter(u => u.role === "admin").length,
        rh: allUsers.filter(u => u.role === "rh").length,
        gestor: allUsers.filter(u => u.role === "gestor").length,
        colaborador: allUsers.filter(u => u.role === "colaborador").length,
      };

      const salaryLeadsCount = allUsers.filter(u => u.isSalaryLead).length;

      return {
        total: allUsers.length,
        byRole,
        salaryLeadsCount,
      };
    }),
});
