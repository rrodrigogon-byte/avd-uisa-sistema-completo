import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql, desc, and, eq, or, isNull } from "drizzle-orm";
import { 
  employees, 
  jobDescriptionApprovals,
  pdiPlans,
  performanceEvaluations,
  bonusPolicies
} from "../../drizzle/schema";

/**
 * Router de Gestão
 * Fornece estatísticas consolidadas e ações recentes para o dashboard de gestão
 */
export const gestaoRouter = router({
  /**
   * Obter estatísticas consolidadas do sistema
   * Retorna contadores de movimentações, aprovações pendentes e funcionários
   */
  getConsolidatedStats: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      // Estatísticas de Movimentações (usando employees como proxy)
      // Em um sistema real, você teria uma tabela específica de movimentações
      const [movimentacoesResult] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          pendentes: sql<number>`SUM(CASE WHEN ${employees.status} = 'pendente' THEN 1 ELSE 0 END)`,
          aprovadas: sql<number>`SUM(CASE WHEN ${employees.status} = 'ativo' THEN 1 ELSE 0 END)`,
          rejeitadas: sql<number>`SUM(CASE WHEN ${employees.status} = 'rejeitado' THEN 1 ELSE 0 END)`,
        })
        .from(employees);

      // Estatísticas de Aprovações Pendentes
      // jobDescriptionApprovals tem status por nível (level1Status, level2Status, etc)
      // Contar aprovações onde pelo menos um nível está pendente
      const [descricoesResult] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(jobDescriptionApprovals)
        .where(
          or(
            eq(jobDescriptionApprovals.level1Status, 'pending'),
            eq(jobDescriptionApprovals.level2Status, 'pending'),
            eq(jobDescriptionApprovals.level3Status, 'pending'),
            eq(jobDescriptionApprovals.level4Status, 'pending')
          )
        );

      const [pdisResult] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(pdiPlans)
        .where(eq(pdiPlans.status, 'pendente'));

      const [avaliacoesResult] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.status, 'pendente'));

      // Bônus pendentes (usando bonusPolicies como proxy)
      const [bonusResult] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(bonusPolicies)
        .where(eq(bonusPolicies.isActive, true));

      // Estatísticas de Funcionários
      const [funcionariosResult] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          ativos: sql<number>`SUM(CASE WHEN ${employees.status} = 'ativo' THEN 1 ELSE 0 END)`,
          inativos: sql<number>`SUM(CASE WHEN ${employees.status} = 'inativo' THEN 1 ELSE 0 END)`,
        })
        .from(employees);

      return {
        movimentacoes: {
          total: Number(movimentacoesResult?.total || 0),
          pendentes: Number(movimentacoesResult?.pendentes || 0),
          aprovadas: Number(movimentacoesResult?.aprovadas || 0),
          rejeitadas: Number(movimentacoesResult?.rejeitadas || 0),
        },
        aprovacoes: {
          descricoes: Number(descricoesResult?.count || 0),
          pdis: Number(pdisResult?.count || 0),
          avaliacoes: Number(avaliacoesResult?.count || 0),
          bonus: Number(bonusResult?.count || 0),
        },
        funcionarios: {
          total: Number(funcionariosResult?.total || 0),
          ativos: Number(funcionariosResult?.ativos || 0),
          inativos: Number(funcionariosResult?.inativos || 0),
        },
      };
    } catch (error) {
      console.error("[gestaoRouter] Error getting consolidated stats:", error);
      // Retornar valores padrão em caso de erro
      return {
        movimentacoes: { total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0 },
        aprovacoes: { descricoes: 0, pdis: 0, avaliacoes: 0, bonus: 0 },
        funcionarios: { total: 0, ativos: 0, inativos: 0 },
      };
    }
  }),

  /**
   * Obter ações recentes do sistema
   * Retorna as últimas ações realizadas (aprovações, cadastros, etc.)
   */
  getRecentActions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // Buscar ações recentes de diferentes tabelas
        // Aprovações de descrições de cargo
        const descricaoActions = await db
          .select({
            id: jobDescriptionApprovals.id,
            type: sql<string>`'aprovacao'`,
            description: sql<string>`CONCAT('Aprovação de descrição de cargo: ', ${jobDescriptionApprovals.jobTitle})`,
            status: jobDescriptionApprovals.status,
            userName: sql<string>`'Sistema'`, // Em produção, buscar do usuário
            createdAt: jobDescriptionApprovals.createdAt,
          })
          .from(jobDescriptionApprovals)
          .orderBy(desc(jobDescriptionApprovals.createdAt))
          .limit(input.limit);

        // Cadastros de funcionários recentes
        const employeeActions = await db
          .select({
            id: employees.id,
            type: sql<string>`'cadastro'`,
            description: sql<string>`CONCAT('Cadastro de funcionário: ', ${employees.name})`,
            status: employees.status,
            userName: sql<string>`'Sistema'`,
            createdAt: employees.createdAt,
          })
          .from(employees)
          .orderBy(desc(employees.createdAt))
          .limit(input.limit);

        // Combinar e ordenar todas as ações
        const allActions = [...descricaoActions, ...employeeActions]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, input.limit);

        return allActions;
      } catch (error) {
        console.error("[gestaoRouter] Error getting recent actions:", error);
        return [];
      }
    }),

  /**
   * Obter estatísticas de movimentações por tipo
   * Útil para gráficos e visualizações
   */
  getMovimentacoesByType: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      // Em um sistema real, você teria uma tabela de movimentações com tipos
      // Por enquanto, retornamos dados de exemplo
      return [
        { type: 'Promoção', count: 15, percentage: 30 },
        { type: 'Transferência', count: 20, percentage: 40 },
        { type: 'Admissão', count: 10, percentage: 20 },
        { type: 'Desligamento', count: 5, percentage: 10 },
      ];
    } catch (error) {
      console.error("[gestaoRouter] Error getting movimentacoes by type:", error);
      return [];
    }
  }),

  /**
   * Obter estatísticas de aprovações por status
   * Útil para gráficos e visualizações
   */
  getAprovacoesByStatus: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      // Contar aprovações por status considerando todos os níveis
      const [result] = await db
        .select({
          pendentes: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.level1Status} = 'pending' OR ${jobDescriptionApprovals.level2Status} = 'pending' OR ${jobDescriptionApprovals.level3Status} = 'pending' OR ${jobDescriptionApprovals.level4Status} = 'pending' THEN 1 ELSE 0 END)`,
          aprovadas: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.level1Status} = 'approved' AND ${jobDescriptionApprovals.level2Status} = 'approved' AND ${jobDescriptionApprovals.level3Status} = 'approved' AND ${jobDescriptionApprovals.level4Status} = 'approved' THEN 1 ELSE 0 END)`,
          rejeitadas: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.level1Status} = 'rejected' OR ${jobDescriptionApprovals.level2Status} = 'rejected' OR ${jobDescriptionApprovals.level3Status} = 'rejected' OR ${jobDescriptionApprovals.level4Status} = 'rejected' THEN 1 ELSE 0 END)`,
        })
        .from(jobDescriptionApprovals);

      // Calcular estatísticas baseadas nos níveis de aprovação
      const pendentes = Number(result?.pendentes || 0);
      const aprovadas = Number(result?.aprovadas || 0);
      const rejeitadas = Number(result?.rejeitadas || 0);
      const total = pendentes + aprovadas + rejeitadas;

      return [
        { 
          status: 'Pendentes', 
          count: pendentes,
          percentage: total > 0 ? Math.round((pendentes / total) * 100) : 0
        },
        { 
          status: 'Aprovadas', 
          count: aprovadas,
          percentage: total > 0 ? Math.round((aprovadas / total) * 100) : 0
        },
        { 
          status: 'Rejeitadas', 
          count: rejeitadas,
          percentage: total > 0 ? Math.round((rejeitadas / total) * 100) : 0
        },
      ];
    } catch (error) {
      console.error("[gestaoRouter] Error getting aprovacoes by status:", error);
      return [];
    }
  }),
});
