/**
 * Funções auxiliares para dashboard de métricas psicométricas
 */

import { getDb } from './db';
import { psychometricTests, employees, departments, positions } from '../drizzle/schema';
import { eq, and, isNotNull, sql, count } from 'drizzle-orm';

export interface PsychometricDashboardStats {
  totalTestsSent: number;
  totalTestsCompleted: number;
  completionRate: number;
  pendingTests: number;
  
  discProfiles: {
    dominant: number;
    influential: number;
    steady: number;
    conscientious: number;
  };
  
  mbtiDistribution: Record<string, number>;
  
  averageCompletionTime: number; // em dias
  
  byDepartment: Array<{
    departmentName: string;
    totalSent: number;
    completed: number;
    completionRate: number;
  }>;
  
  recentTests: Array<{
    employeeName: string;
    testType: string;
    completedAt: Date;
    profile: string;
  }>;
}

/**
 * Obter estatísticas do dashboard de testes psicométricos
 */
export async function getPsychometricDashboardStats(): Promise<PsychometricDashboardStats> {
  const database = await getDb();
  if (!database) {
    throw new Error('Database not available');
  }

  // Total de testes enviados e completados
  const allTests = await database
    .select()
    .from(psychometricTests)
    .leftJoin(employees, eq(psychometricTests.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));

  const totalTestsSent = allTests.length;
  const completedTests = allTests.filter(t => t.psychometricTests.completedAt !== null);
  const totalTestsCompleted = completedTests.length;
  const completionRate = totalTestsSent > 0 ? (totalTestsCompleted / totalTestsSent) * 100 : 0;
  const pendingTests = totalTestsSent - totalTestsCompleted;

  // Distribuição de perfis DISC
  const discProfiles = {
    dominant: 0,
    influential: 0,
    steady: 0,
    conscientious: 0,
  };

  for (const test of completedTests) {
    const t = test.psychometricTests;
    if (t.discD !== null && t.discI !== null && t.discS !== null && t.discC !== null) {
      const max = Math.max(t.discD, t.discI, t.discS, t.discC);
      if (max === t.discD) discProfiles.dominant++;
      else if (max === t.discI) discProfiles.influential++;
      else if (max === t.discS) discProfiles.steady++;
      else if (max === t.discC) discProfiles.conscientious++;
    }
  }

  // Distribuição MBTI
  const mbtiDistribution: Record<string, number> = {};
  for (const test of completedTests) {
    const mbti = test.psychometricTests.mbtiType;
    if (mbti) {
      mbtiDistribution[mbti] = (mbtiDistribution[mbti] || 0) + 1;
    }
  }

  // Tempo médio de conclusão
  let totalDays = 0;
  let countWithTime = 0;
  for (const test of completedTests) {
    const t = test.psychometricTests;
    if (t.sentAt && t.completedAt) {
      const days = Math.floor((new Date(t.completedAt).getTime() - new Date(t.sentAt).getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
      countWithTime++;
    }
  }
  const averageCompletionTime = countWithTime > 0 ? totalDays / countWithTime : 0;

  // Por departamento
  const byDepartmentMap: Record<string, { name: string; sent: number; completed: number }> = {};
  for (const test of allTests) {
    const deptId = test.departments?.id;
    const deptName = test.departments?.name || 'Sem departamento';
    
    if (!byDepartmentMap[deptName]) {
      byDepartmentMap[deptName] = { name: deptName, sent: 0, completed: 0 };
    }
    
    byDepartmentMap[deptName].sent++;
    if (test.psychometricTests.completedAt) {
      byDepartmentMap[deptName].completed++;
    }
  }

  const byDepartment = Object.values(byDepartmentMap).map(dept => ({
    departmentName: dept.name,
    totalSent: dept.sent,
    completed: dept.completed,
    completionRate: dept.sent > 0 ? (dept.completed / dept.sent) * 100 : 0,
  }));

  // Testes recentes (últimos 10)
  const recentTestsData = completedTests
    .sort((a, b) => {
      const dateA = a.psychometricTests.completedAt ? new Date(a.psychometricTests.completedAt).getTime() : 0;
      const dateB = b.psychometricTests.completedAt ? new Date(b.psychometricTests.completedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  const recentTests = recentTestsData.map(test => {
    const t = test.psychometricTests;
    let profile = 'N/A';
    
    // Determinar perfil dominante
    if (t.discD !== null && t.discI !== null && t.discS !== null && t.discC !== null) {
      const max = Math.max(t.discD, t.discI, t.discS, t.discC);
      if (max === t.discD) profile = 'D - Dominante';
      else if (max === t.discI) profile = 'I - Influente';
      else if (max === t.discS) profile = 'S - Estável';
      else if (max === t.discC) profile = 'C - Conforme';
    } else if (t.mbtiType) {
      profile = t.mbtiType;
    }

    return {
      employeeName: test.employees?.name || 'Desconhecido',
      testType: t.testType,
      completedAt: t.completedAt!,
      profile,
    };
  });

  return {
    totalTestsSent,
    totalTestsCompleted,
    completionRate: Math.round(completionRate * 10) / 10,
    pendingTests,
    discProfiles,
    mbtiDistribution,
    averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    byDepartment,
    recentTests,
  };
}

/**
 * Obter perfis DISC mais comuns
 */
export async function getMostCommonDISCProfiles(limit: number = 5): Promise<Array<{ profile: string; count: number; percentage: number }>> {
  const database = await getDb();
  if (!database) {
    throw new Error('Database not available');
  }

  const tests = await database
    .select()
    .from(psychometricTests)
    .where(and(
      isNotNull(psychometricTests.discD),
      isNotNull(psychometricTests.discI),
      isNotNull(psychometricTests.discS),
      isNotNull(psychometricTests.discC),
      isNotNull(psychometricTests.completedAt)
    ));

  const profileCounts: Record<string, number> = {
    'D - Dominante': 0,
    'I - Influente': 0,
    'S - Estável': 0,
    'C - Conforme': 0,
  };

  for (const test of tests) {
    const max = Math.max(test.discD!, test.discI!, test.discS!, test.discC!);
    if (max === test.discD) profileCounts['D - Dominante']++;
    else if (max === test.discI) profileCounts['I - Influente']++;
    else if (max === test.discS) profileCounts['S - Estável']++;
    else if (max === test.discC) profileCounts['C - Conforme']++;
  }

  const total = tests.length;
  const result = Object.entries(profileCounts)
    .map(([profile, count]) => ({
      profile,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return result;
}
