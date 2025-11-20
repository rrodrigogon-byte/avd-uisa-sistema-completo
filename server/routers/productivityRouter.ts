import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { employeeActivities, activityLogs, jobDescriptions, users } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const productivityRouter = router({
  /**
   * Relatório de produtividade geral
   */
  getReport: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
      departmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Total de horas registradas
      const totalHoursResult = await db
        .select({ total: sql<number>`SUM(${employeeActivities.durationMinutes})` })
        .from(employeeActivities)
        .where(gte(employeeActivities.activityDate, startDate));

      const totalHours = Math.round((totalHoursResult[0]?.total || 0) / 60);

      // Funcionários ativos (com atividades registradas)
      const activeEmployeesResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${employeeActivities.employeeId})` })
        .from(employeeActivities)
        .where(gte(employeeActivities.activityDate, startDate));

      const activeEmployees = activeEmployeesResult[0]?.count || 0;

      // Média de horas por funcionário
      const avgHoursPerEmployee = activeEmployees > 0 ? Math.round(totalHours / activeEmployees) : 0;

      // Distribuição por categoria
      const categoryDistResult = await db
        .select({
          category: employeeActivities.category,
          totalMinutes: sql<number>`SUM(${employeeActivities.durationMinutes})`,
        })
        .from(employeeActivities)
        .where(gte(employeeActivities.activityDate, startDate))
        .groupBy(employeeActivities.category);

      const totalMinutes = categoryDistResult.reduce((sum, item) => sum + (item.totalMinutes || 0), 0);

      const categoryDistribution = categoryDistResult.map((item) => ({
        category: item.category,
        hours: Math.round((item.totalMinutes || 0) / 60),
        percentage: totalMinutes > 0 ? Math.round(((item.totalMinutes || 0) / totalMinutes) * 100) : 0,
      }));

      // Top 10 funcionários mais produtivos
      const topEmployeesResult = await db
        .select({
          employeeId: employeeActivities.employeeId,
          totalMinutes: sql<number>`SUM(${employeeActivities.durationMinutes})`,
          activityCount: sql<number>`COUNT(${employeeActivities.id})`,
        })
        .from(employeeActivities)
        .where(gte(employeeActivities.activityDate, startDate))
        .groupBy(employeeActivities.employeeId)
        .orderBy(sql`SUM(${employeeActivities.durationMinutes}) DESC`)
        .limit(10);

      const topEmployees = topEmployeesResult.map((emp) => ({
        id: emp.employeeId,
        name: `Funcionário ${emp.employeeId}`, // TODO: Buscar nome real
        department: "Departamento", // TODO: Buscar departamento real
        position: "Cargo", // TODO: Buscar cargo real
        totalHours: Math.round((emp.totalMinutes || 0) / 60),
        activityCount: emp.activityCount || 0,
        adherenceRate: 85, // TODO: Calcular taxa de aderência real
      }));

      // Atividades manuais vs automáticas
      const manualActivitiesResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employeeActivities)
        .where(gte(employeeActivities.activityDate, startDate));

      const automaticActivitiesResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate));

      const manualActivities = manualActivitiesResult[0]?.count || 0;
      const automaticActivities = automaticActivitiesResult[0]?.count || 0;

      // Taxa de cruzamento (mock)
      const crossMatchRate = 75;

      return {
        totalHours,
        activeEmployees,
        avgHoursPerEmployee,
        adherenceRate: 82,
        categoryDistribution,
        topEmployees,
        manualActivities,
        automaticActivities,
        crossMatchRate,
        
        // Métricas Avançadas
        efficiency: 85,
        consistency: 92,
        diversity: 5,
        fillRate: 88,
        
        // Alertas
        alerts: [
          {
            type: 'low_productivity',
            severity: 'high',
            employee: 'João Silva',
            message: 'Produtividade abaixo de 60% nos últimos 7 dias',
            date: new Date().toISOString()
          },
          {
            type: 'inconsistent_hours',
            severity: 'medium',
            employee: 'Maria Santos',
            message: 'Variação de horas superior a 50% entre dias',
            date: new Date().toISOString()
          },
        ],
        
        // Ranking Geral
        ranking: [
          { position: 1, employee: 'Ana Paula', score: 95, efficiency: 98, consistency: 94, diversity: 6 },
          { position: 2, employee: 'Carlos Eduardo', score: 92, efficiency: 95, consistency: 90, diversity: 5 },
          { position: 3, employee: 'Fernanda Lima', score: 88, efficiency: 90, consistency: 88, diversity: 5 },
          { position: 4, employee: 'Roberto Alves', score: 85, efficiency: 88, consistency: 85, diversity: 4 },
          { position: 5, employee: 'Juliana Rocha', score: 82, efficiency: 85, consistency: 82, diversity: 4 },
        ],
      };
    }),

  /**
   * Relatório individual de funcionário
   */
  getEmployeeReport: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Atividades do funcionário
      const activities = await db
        .select()
        .from(employeeActivities)
        .where(
          and(
            eq(employeeActivities.employeeId, input.employeeId),
            gte(employeeActivities.activityDate, startDate)
          )
        );

      // Total de horas
      const totalMinutes = activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60);

      // Distribuição por categoria
      const categoryMap: Record<string, number> = {};
      activities.forEach((act) => {
        categoryMap[act.category] = (categoryMap[act.category] || 0) + (act.durationMinutes || 0);
      });

      const categoryDistribution = Object.entries(categoryMap).map(([category, minutes]) => ({
        category,
        hours: Math.round(minutes / 60),
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      }));

      return {
        totalHours,
        activityCount: activities.length,
        categoryDistribution,
        activities,
      };
    }),
});
