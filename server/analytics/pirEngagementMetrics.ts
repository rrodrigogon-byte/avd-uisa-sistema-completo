import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Sistema de Analytics de Engajamento para PIR Integridade
 * 
 * Calcula e fornece métricas de:
 * - Tempo médio de conclusão
 * - Taxa de resposta por departamento
 * - Taxa de conclusão geral
 * - Evolução temporal
 */

export interface EngagementMetrics {
  overview: {
    totalTests: number;
    completedTests: number;
    completionRate: number;
    averageCompletionTime: number; // em minutos
    pendingTests: number;
    expiredTests: number;
  };
  byDepartment: Array<{
    department: string;
    totalSent: number;
    completed: number;
    completionRate: number;
    averageTime: number;
  }>;
  byMonth: Array<{
    month: string;
    year: number;
    totalSent: number;
    completed: number;
    completionRate: number;
  }>;
  completionTimeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Calcula métricas gerais de engajamento
 */
export async function calculateOverviewMetrics() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Total de testes
  const totalResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM pirIntegrityAssessments
  `);
  const totalTests = (totalResult[0] as any)[0]?.count || 0;

  // Testes concluídos
  const completedResult = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM pirIntegrityAssessments 
    WHERE status = 'completed'
  `);
  const completedTests = (completedResult[0] as any)[0]?.count || 0;

  // Taxa de conclusão
  const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  // Tempo médio de conclusão (em minutos)
  const avgTimeResult = await db.execute(sql`
    SELECT AVG(TIMESTAMPDIFF(MINUTE, createdAt, completedAt)) as avgTime
    FROM pirIntegrityAssessments
    WHERE status = 'completed' AND completedAt IS NOT NULL
  `);
  const averageCompletionTime = Math.round((avgTimeResult[0] as any)[0]?.avgTime || 0);

  // Testes pendentes
  const pendingResult = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM pirIntegrityAssessments 
    WHERE status IN ('pending', 'in_progress')
  `);
  const pendingTests = (pendingResult[0] as any)[0]?.count || 0;

  // Testes expirados
  const expiredResult = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM pirIntegrityAssessments 
    WHERE status = 'expired'
  `);
  const expiredTests = (expiredResult[0] as any)[0]?.count || 0;

  return {
    totalTests,
    completedTests,
    completionRate: Math.round(completionRate * 10) / 10,
    averageCompletionTime,
    pendingTests,
    expiredTests,
  };
}

/**
 * Calcula métricas por departamento
 */
export async function calculateDepartmentMetrics() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.execute(sql`
    SELECT 
      COALESCE(d.name, 'Sem Departamento') as department,
      COUNT(a.id) as totalSent,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
      AVG(CASE 
        WHEN a.status = 'completed' AND a.completedAt IS NOT NULL 
        THEN TIMESTAMPDIFF(MINUTE, a.createdAt, a.completedAt) 
        ELSE NULL 
      END) as averageTime
    FROM pirIntegrityAssessments a
    LEFT JOIN employees e ON a.employeeId = e.id
    LEFT JOIN departments d ON e.departmentId = d.id
    GROUP BY d.name
    ORDER BY totalSent DESC
  `);

  const departments = (result[0] as any[]).map((row: any) => {
    const totalSent = Number(row.totalSent) || 0;
    const completed = Number(row.completed) || 0;
    return {
      department: row.department || "Sem Departamento",
      totalSent,
      completed,
      completionRate: totalSent > 0 ? Math.round((completed / totalSent) * 1000) / 10 : 0,
      averageTime: Math.round(Number(row.averageTime) || 0),
    };
  });

  return departments;
}

/**
 * Calcula métricas por mês (últimos 12 meses)
 */
export async function calculateMonthlyMetrics() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.execute(sql`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as monthYear,
      YEAR(createdAt) as year,
      MONTH(createdAt) as month,
      COUNT(*) as totalSent,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM pirIntegrityAssessments
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), YEAR(createdAt), MONTH(createdAt)
    ORDER BY year DESC, month DESC
  `);

  const months = (result[0] as any[]).map((row: any) => {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const totalSent = Number(row.totalSent) || 0;
    const completed = Number(row.completed) || 0;

    return {
      month: monthNames[row.month - 1],
      year: Number(row.year),
      totalSent,
      completed,
      completionRate: totalSent > 0 ? Math.round((completed / totalSent) * 1000) / 10 : 0,
    };
  });

  return months;
}

/**
 * Calcula distribuição de tempo de conclusão
 */
export async function calculateCompletionTimeDistribution() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.execute(sql`
    SELECT 
      CASE 
        WHEN TIMESTAMPDIFF(MINUTE, createdAt, completedAt) < 15 THEN '0-15 min'
        WHEN TIMESTAMPDIFF(MINUTE, createdAt, completedAt) < 30 THEN '15-30 min'
        WHEN TIMESTAMPDIFF(MINUTE, createdAt, completedAt) < 60 THEN '30-60 min'
        WHEN TIMESTAMPDIFF(MINUTE, createdAt, completedAt) < 120 THEN '1-2 horas'
        ELSE '2+ horas'
      END as timeRange,
      COUNT(*) as count
    FROM pirIntegrityAssessments
    WHERE status = 'completed' AND completedAt IS NOT NULL
    GROUP BY timeRange
    ORDER BY 
      CASE timeRange
        WHEN '0-15 min' THEN 1
        WHEN '15-30 min' THEN 2
        WHEN '30-60 min' THEN 3
        WHEN '1-2 horas' THEN 4
        ELSE 5
      END
  `);

  const total = (result[0] as any[]).reduce((sum: number, row: any) => sum + (row.count || 0), 0);

  const distribution = (result[0] as any[]).map((row: any) => {
    const count = Number(row.count) || 0;
    return {
      range: row.timeRange,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });

  return distribution;
}

/**
 * Calcula todas as métricas de engajamento
 */
export async function calculateAllEngagementMetrics(): Promise<EngagementMetrics> {
  const [overview, byDepartment, byMonth, completionTimeDistribution] = await Promise.all([
    calculateOverviewMetrics(),
    calculateDepartmentMetrics(),
    calculateMonthlyMetrics(),
    calculateCompletionTimeDistribution(),
  ]);

  return {
    overview,
    byDepartment,
    byMonth,
    completionTimeDistribution,
  };
}
