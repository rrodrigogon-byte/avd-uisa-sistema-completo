/**
 * Router de Funcionalidades Administrativas Avançadas
 * Sistema AVD UISA - Avaliação de Desempenho
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { 
  users, 
  employees, 
  evaluationInstances, 
  evaluationCycles,
  auditLogs,
  departments,
  positions
} from '../../drizzle/schema';
import { eq, and, or, like, desc, sql, gte, lte, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { sendEmail } from '../emailService';

/**
 * Verifica se o usuário é administrador
 */
function requireAdmin(ctx: any) {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
    });
  }
}

export const adminAdvancedRouter = router({
  /**
   * Dashboard administrativo com estatísticas gerais
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);

    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    // Total de usuários
    const totalUsers = await db.select({ count: count() }).from(users);
    
    // Total de funcionários
    const totalEmployees = await db.select({ count: count() }).from(employees);
    
    // Total de ciclos ativos
    const activeCycles = await db
      .select({ count: count() })
      .from(evaluationCycles)
      .where(eq(evaluationCycles.status, 'ativo'));
    
    // Total de avaliações pendentes
    const pendingEvaluations = await db
      .select({ count: count() })
      .from(evaluationInstances)
      .where(eq(evaluationInstances.status, 'pendente'));
    
    // Total de avaliações em andamento
    const inProgressEvaluations = await db
      .select({ count: count() })
      .from(evaluationInstances)
      .where(eq(evaluationInstances.status, 'em_andamento'));
    
    // Total de avaliações concluídas
    const completedEvaluations = await db
      .select({ count: count() })
      .from(evaluationInstances)
      .where(eq(evaluationInstances.status, 'concluida'));

    // Departamentos
    const totalDepartments = await db.select({ count: count() }).from(departments);
    
    // Cargos
    const totalPositions = await db.select({ count: count() }).from(positions);

    // Últimas atividades (audit logs)
    const recentActivities = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
      activeCycles: activeCycles[0]?.count || 0,
      pendingEvaluations: pendingEvaluations[0]?.count || 0,
      inProgressEvaluations: inProgressEvaluations[0]?.count || 0,
      completedEvaluations: completedEvaluations[0]?.count || 0,
      totalDepartments: totalDepartments[0]?.count || 0,
      totalPositions: totalPositions[0]?.count || 0,
      recentActivities,
    };
  }),

  /**
   * Listar todos os usuários com filtros avançados
   */
  listUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(['admin', 'user']).optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const offset = (input.page - 1) * input.pageSize;

      // Construir condições de filtro
      const conditions = [];
      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`)
          )
        );
      }
      if (input.role) {
        conditions.push(eq(users.role, input.role));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar usuários
      const usersList = await db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      // Contar total
      const totalCount = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

      return {
        users: usersList,
        total: totalCount[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.pageSize),
      };
    }),

  /**
   * Criar novo usuário
   */
  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['admin', 'user']).default('user'),
        sendCredentials: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verificar se email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe um usuário com este email.',
        });
      }

      // Gerar openId único
      const openId = `user_${crypto.randomBytes(16).toString('hex')}`;

      // Criar usuário
      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        role: input.role,
        loginMethod: 'manual',
      });

      // Registrar auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'create_user',
        entityType: 'user',
        entityId: openId,
        details: JSON.stringify({ name: input.name, email: input.email, role: input.role }),
      });

      // Enviar credenciais por email se solicitado
      if (input.sendCredentials && input.email) {
        const loginUrl = process.env.VITE_APP_URL || 'https://avd-uisa.manus.space';
        await sendEmail({
          to: input.email,
          subject: '🎯 Bem-vindo ao Sistema AVD UISA',
          html: `
            <h2>Olá, ${input.name}!</h2>
            <p>Sua conta foi criada no Sistema AVD UISA.</p>
            <p><strong>Email:</strong> ${input.email}</p>
            <p>Acesse o sistema através do link abaixo:</p>
            <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px;">Acessar Sistema</a>
          `,
        });
      }

      return { success: true, openId };
    }),

  /**
   * Atualizar usuário
   */
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'user']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.role) updateData.role = input.role;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.userId));

      // Registrar auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'update_user',
        entityType: 'user',
        entityId: input.userId.toString(),
        details: JSON.stringify(updateData),
      });

      return { success: true };
    }),

  /**
   * Promover/rebaixar usuário
   */
  changeUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newRole: z.enum(['admin', 'user']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db
        .update(users)
        .set({ role: input.newRole })
        .where(eq(users.id, input.userId));

      // Registrar auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'change_user_role',
        entityType: 'user',
        entityId: input.userId.toString(),
        details: JSON.stringify({ newRole: input.newRole }),
      });

      return { success: true };
    }),

  /**
   * Listar todas as avaliações com filtros avançados
   */
  listEvaluations: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).optional(),
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const offset = (input.page - 1) * input.pageSize;

      // Construir condições de filtro
      const conditions = [];
      if (input.status) {
        conditions.push(eq(evaluationInstances.status, input.status));
      }
      if (input.cycleId) {
        conditions.push(eq(evaluationInstances.cycleId, input.cycleId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar avaliações com dados relacionados
      const evaluationsList = await db
        .select({
          instance: evaluationInstances,
          employee: employees,
          cycle: evaluationCycles,
        })
        .from(evaluationInstances)
        .innerJoin(employees, eq(evaluationInstances.employeeId, employees.id))
        .innerJoin(evaluationCycles, eq(evaluationInstances.cycleId, evaluationCycles.id))
        .where(whereClause)
        .orderBy(desc(evaluationInstances.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      // Contar total
      const totalCount = await db
        .select({ count: count() })
        .from(evaluationInstances)
        .where(whereClause);

      return {
        evaluations: evaluationsList,
        total: totalCount[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.pageSize),
      };
    }),

  /**
   * Ações em lote: Enviar lembretes
   */
  sendBulkReminders: protectedProcedure
    .input(
      z.object({
        instanceIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      let successCount = 0;
      let errorCount = 0;

      for (const instanceId of input.instanceIds) {
        try {
          // Buscar dados da instância
          const result = await db
            .select({
              instance: evaluationInstances,
              employee: employees,
              user: users,
              cycle: evaluationCycles,
            })
            .from(evaluationInstances)
            .innerJoin(employees, eq(evaluationInstances.employeeId, employees.id))
            .innerJoin(users, eq(employees.userId, users.id))
            .innerJoin(evaluationCycles, eq(evaluationInstances.cycleId, evaluationCycles.id))
            .where(eq(evaluationInstances.id, instanceId))
            .limit(1);

          if (result.length === 0 || !result[0].user.email) {
            errorCount++;
            continue;
          }

          const { employee, user, cycle } = result[0];

          // Enviar email de lembrete
          await sendEmail({
            to: user.email,
            subject: `⏰ Lembrete: Avaliação Pendente - ${cycle.name}`,
            html: `
              <h2>Olá, ${employee.nome}!</h2>
              <p>Este é um lembrete sobre sua avaliação pendente no período <strong>${cycle.name}</strong>.</p>
              <p>Por favor, acesse o sistema e complete sua avaliação.</p>
            `,
          });

          successCount++;
        } catch (error) {
          console.error(`Error sending reminder for instance ${instanceId}:`, error);
          errorCount++;
        }
      }

      // Registrar auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'send_bulk_reminders',
        entityType: 'evaluation_instance',
        entityId: input.instanceIds.join(','),
        details: JSON.stringify({ successCount, errorCount }),
      });

      return { success: true, successCount, errorCount };
    }),

  /**
   * Histórico de auditoria
   */
  getAuditLog: protectedProcedure
    .input(
      z.object({
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const offset = (input.page - 1) * input.pageSize;

      // Construir condições de filtro
      const conditions = [];
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.entityType) {
        conditions.push(eq(auditLogs.entityType, input.entityType));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar logs com dados do usuário
      const logs = await db
        .select({
          log: auditLogs,
          user: users,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      // Contar total
      const totalCount = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause);

      return {
        logs,
        total: totalCount[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.pageSize),
      };
    }),
});
