import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { reportAnalytics } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Report Analytics Router
 * Rastreia uso de relatórios customizados e fornece insights
 */

export const reportAnalyticsRouter = router({
  // Registrar ação de analytics
  track: protectedProcedure
    .input(
      z.object({
        reportId: z.number().optional(),
        reportName: z.string(),
        action: z.enum(["view", "export_pdf", "export_excel", "create", "update", "delete"]),
        metrics: z.array(z.string()).optional(),
        filters: z.any().optional(),
        executionTimeMs: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(reportAnalytics).values({
        reportId: input.reportId,
        reportName: input.reportName,
        action: input.action,
        userId: ctx.user.id,
        metrics: input.metrics ? JSON.stringify(input.metrics) : null,
        filters: input.filters ? JSON.stringify(input.filters) : null,
        executionTimeMs: input.executionTimeMs,
      });

      return { success: true };
    }),

  // Obter estatísticas de uso
  getUsageStats: protectedProcedure.query(async () => {
    const database = await getDb();
    if (!database) return null;

    // Total de relatórios gerados
    const totalReports = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(reportAnalytics)
      .where(sql`action IN ('view', 'create')`);

    // Total de exportações
    const totalExports = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(reportAnalytics)
      .where(sql`action IN ('export_pdf', 'export_excel')`);

    // Exportações por tipo
    const exportsByType = await database
      .select({
        action: reportAnalytics.action,
        count: sql<number>`COUNT(*)`,
      })
      .from(reportAnalytics)
      .where(sql`action IN ('export_pdf', 'export_excel')`)
      .groupBy(reportAnalytics.action);

    // Tempo médio de execução
    const avgExecutionTime = await database
      .select({
        avg: sql<number>`AVG(executionTimeMs)`,
      })
      .from(reportAnalytics)
      .where(sql`executionTimeMs IS NOT NULL`);

    return {
      totalReports: Number(totalReports[0]?.count || 0),
      totalExports: Number(totalExports[0]?.count || 0),
      exportsPdf: Number(exportsByType.find((e) => e.action === "export_pdf")?.count || 0),
      exportsExcel: Number(exportsByType.find((e) => e.action === "export_excel")?.count || 0),
      avgExecutionTimeMs: Number(avgExecutionTime[0]?.avg || 0),
    };
  }),

  // Obter métricas mais usadas
  getMostUsedMetrics: protectedProcedure.query(async () => {
    const database = await getDb();
    if (!database) return [];

    const results = await database
      .select({
        metrics: reportAnalytics.metrics,
        count: sql<number>`COUNT(*)`,
      })
      .from(reportAnalytics)
      .where(sql`metrics IS NOT NULL`)
      .groupBy(reportAnalytics.metrics)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // Processar métricas (JSON array)
    const metricCounts: Record<string, number> = {};
    
    results.forEach((row) => {
      try {
        const metrics = typeof row.metrics === 'string' 
          ? JSON.parse(row.metrics) 
          : row.metrics;
        
        if (Array.isArray(metrics)) {
          metrics.forEach((metric: string) => {
            metricCounts[metric] = (metricCounts[metric] || 0) + Number(row.count);
          });
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    });

    return Object.entries(metricCounts)
      .map(([metric, count]) => ({ metric, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }),

  // Obter histórico de exportações
  getExportHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      const results = await database
        .select({
          id: reportAnalytics.id,
          reportName: reportAnalytics.reportName,
          action: reportAnalytics.action,
          userId: reportAnalytics.userId,
          createdAt: reportAnalytics.createdAt,
          executionTimeMs: reportAnalytics.executionTimeMs,
        })
        .from(reportAnalytics)
        .where(sql`action IN ('export_pdf', 'export_excel')`)
        .orderBy(sql`createdAt DESC`)
        .limit(input.limit);

      return results;
    }),

  // Obter tendências de uso (últimos 30 dias)
  getTrends: protectedProcedure.query(async () => {
    const database = await getDb();
    if (!database) return [];

    const results = await database
      .select({
        date: sql<string>`DATE(createdAt)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reportAnalytics)
      .where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`)
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt) ASC`);

    return results.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }),
});
