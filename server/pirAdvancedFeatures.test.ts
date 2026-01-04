import { describe, it, expect, beforeAll } from "vitest";
import { calculateAllEngagementMetrics } from "./analytics/pirEngagementMetrics";
import { detectPendingTests, generateDailyReport } from "./jobs/pirIntegrityNotifications";

/**
 * Testes para funcionalidades avançadas do PIR Integridade:
 * - Sistema de testes end-to-end
 * - Jobs cron de notificações
 * - Dashboard de métricas
 */

describe("PIR Integridade - Funcionalidades Avançadas", () => {
  describe("Analytics de Engajamento", () => {
    it("deve calcular métricas gerais sem erros", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
      expect(metrics.overview.totalTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.completedTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.completionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.completionRate).toBeLessThanOrEqual(100);
      expect(metrics.overview.averageCompletionTime).toBeGreaterThanOrEqual(0);
    });

    it("deve retornar métricas por departamento", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics.byDepartment).toBeDefined();
      expect(Array.isArray(metrics.byDepartment)).toBe(true);
      
      if (metrics.byDepartment.length > 0) {
        const firstDept = metrics.byDepartment[0];
        expect(firstDept.department).toBeDefined();
        expect(firstDept.totalSent).toBeGreaterThanOrEqual(0);
        expect(firstDept.completed).toBeGreaterThanOrEqual(0);
        expect(firstDept.completionRate).toBeGreaterThanOrEqual(0);
        expect(firstDept.completionRate).toBeLessThanOrEqual(100);
      }
    });

    it("deve retornar métricas mensais", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics.byMonth).toBeDefined();
      expect(Array.isArray(metrics.byMonth)).toBe(true);
      
      if (metrics.byMonth.length > 0) {
        const firstMonth = metrics.byMonth[0];
        expect(firstMonth.month).toBeDefined();
        expect(firstMonth.year).toBeGreaterThan(2020);
        expect(firstMonth.totalSent).toBeGreaterThanOrEqual(0);
        expect(firstMonth.completed).toBeGreaterThanOrEqual(0);
      }
    });

    it("deve retornar distribuição de tempo de conclusão", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics.completionTimeDistribution).toBeDefined();
      expect(Array.isArray(metrics.completionTimeDistribution)).toBe(true);
      
      if (metrics.completionTimeDistribution.length > 0) {
        const firstRange = metrics.completionTimeDistribution[0];
        expect(firstRange.range).toBeDefined();
        expect(firstRange.count).toBeGreaterThanOrEqual(0);
        expect(firstRange.percentage).toBeGreaterThanOrEqual(0);
        expect(firstRange.percentage).toBeLessThanOrEqual(100);
      }
    });

    it("deve calcular taxa de conclusão corretamente", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      if (metrics.overview.totalTests > 0) {
        const expectedRate = (metrics.overview.completedTests / metrics.overview.totalTests) * 100;
        const roundedExpected = Math.round(expectedRate * 10) / 10;
        
        expect(metrics.overview.completionRate).toBe(roundedExpected);
      }
    });
  });

  describe("Jobs Cron de Notificações", () => {
    it("deve detectar testes pendentes sem erros", async () => {
      const pendingTests = await detectPendingTests();
      
      expect(pendingTests).toBeDefined();
      expect(Array.isArray(pendingTests)).toBe(true);
      
      if (pendingTests.length > 0) {
        const firstTest = pendingTests[0];
        expect(firstTest.id).toBeDefined();
        expect(firstTest.candidateName).toBeDefined();
        expect(firstTest.candidateEmail).toBeDefined();
        expect(firstTest.expiresAt).toBeInstanceOf(Date);
        expect(firstTest.status).toMatch(/pending|in_progress/);
      }
    });

    it("deve gerar relatório diário com estrutura correta", async () => {
      const report = await generateDailyReport();
      
      expect(report).toBeDefined();
      expect(report.total).toBeGreaterThanOrEqual(0);
      expect(report.pending).toBeGreaterThanOrEqual(0);
      expect(report.inProgress).toBeGreaterThanOrEqual(0);
      expect(report.completed).toBeGreaterThanOrEqual(0);
      expect(report.expired).toBeGreaterThanOrEqual(0);
      expect(report.expiringIn3Days).toBeGreaterThanOrEqual(0);
    });

    it("deve validar que soma de status não excede total", async () => {
      const report = await generateDailyReport();
      
      const sumOfStatuses = report.pending + report.inProgress + report.completed + report.expired;
      
      // A soma pode ser menor ou igual ao total (nunca maior)
      expect(sumOfStatuses).toBeLessThanOrEqual(report.total);
    });

    it("deve validar que testes expirando estão dentro do total pendente", async () => {
      const report = await generateDailyReport();
      
      // Testes expirando em 3 dias devem estar incluídos em pendentes ou em andamento
      expect(report.expiringIn3Days).toBeLessThanOrEqual(report.pending + report.inProgress);
    });
  });

  describe("Validações de Dados", () => {
    it("deve garantir que métricas não retornam valores negativos", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics.overview.totalTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.completedTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.pendingTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.expiredTests).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.averageCompletionTime).toBeGreaterThanOrEqual(0);
    });

    it("deve garantir que taxas de conclusão estão entre 0 e 100", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(metrics.overview.completionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.overview.completionRate).toBeLessThanOrEqual(100);
      
      metrics.byDepartment.forEach(dept => {
        expect(dept.completionRate).toBeGreaterThanOrEqual(0);
        expect(dept.completionRate).toBeLessThanOrEqual(100);
      });
      
      metrics.byMonth.forEach(month => {
        expect(month.completionRate).toBeGreaterThanOrEqual(0);
        expect(month.completionRate).toBeLessThanOrEqual(100);
      });
    });

    it("deve garantir que percentagens de distribuição somam aproximadamente 100%", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      if (metrics.completionTimeDistribution.length > 0) {
        const totalPercentage = metrics.completionTimeDistribution.reduce(
          (sum, item) => sum + item.percentage,
          0
        );
        
        // Permitir pequena margem de erro por arredondamento (±1%)
        expect(totalPercentage).toBeGreaterThanOrEqual(99);
        expect(totalPercentage).toBeLessThanOrEqual(101);
      }
    });
  });

  describe("Robustez e Tratamento de Erros", () => {
    it("deve lidar com banco de dados vazio sem erros", async () => {
      // Este teste valida que as funções não quebram mesmo sem dados
      const metrics = await calculateAllEngagementMetrics();
      const report = await generateDailyReport();
      const pendingTests = await detectPendingTests();
      
      expect(metrics).toBeDefined();
      expect(report).toBeDefined();
      expect(pendingTests).toBeDefined();
    });

    it("deve retornar arrays vazios ao invés de undefined", async () => {
      const metrics = await calculateAllEngagementMetrics();
      
      expect(Array.isArray(metrics.byDepartment)).toBe(true);
      expect(Array.isArray(metrics.byMonth)).toBe(true);
      expect(Array.isArray(metrics.completionTimeDistribution)).toBe(true);
    });

    it("deve retornar valores padrão seguros quando não há dados", async () => {
      const report = await generateDailyReport();
      
      // Mesmo sem dados, deve retornar estrutura válida com zeros
      expect(typeof report.total).toBe("number");
      expect(typeof report.pending).toBe("number");
      expect(typeof report.inProgress).toBe("number");
      expect(typeof report.completed).toBe("number");
      expect(typeof report.expired).toBe("number");
      expect(typeof report.expiringIn3Days).toBe("number");
    });
  });
});
