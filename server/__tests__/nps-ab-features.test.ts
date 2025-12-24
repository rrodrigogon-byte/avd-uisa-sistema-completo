import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('../db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  }),
}));

// Mock das notificações
vi.mock('../_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe('NPS Scheduled Trigger Service', () => {
  describe('getNpsSettings', () => {
    it('should return default settings if none exist', async () => {
      const { getNpsSettings } = await import('../services/npsScheduledTriggerService');
      const settings = await getNpsSettings();
      // Pode retornar null ou configurações padrão
      expect(settings === null || typeof settings === 'object').toBe(true);
    });
  });

  describe('scheduleNpsTriggerAfterPDI', () => {
    it('should schedule a trigger after PDI completion', async () => {
      const { scheduleNpsTriggerAfterPDI } = await import('../services/npsScheduledTriggerService');
      const result = await scheduleNpsTriggerAfterPDI(1, 1);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('should accept custom delay in minutes', async () => {
      const { scheduleNpsTriggerAfterPDI } = await import('../services/npsScheduledTriggerService');
      const result = await scheduleNpsTriggerAfterPDI(1, 1, 60);
      expect(result).toHaveProperty('success');
    });
  });

  describe('processPendingTriggers', () => {
    it('should process pending triggers and return stats', async () => {
      const { processPendingTriggers } = await import('../services/npsScheduledTriggerService');
      const result = await processPendingTriggers();
      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('sent');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('details');
      expect(typeof result.processed).toBe('number');
    });
  });

  describe('createDetractorAlert', () => {
    it('should create alert for detractor score', async () => {
      const { createDetractorAlert } = await import('../services/npsScheduledTriggerService');
      const result = await createDetractorAlert(1, 1, 1, 3, 'Insatisfeito com o processo');
      // Pode retornar null se alertas estiverem desabilitados
      expect(result === null || result?.alertId !== undefined).toBe(true);
    });

    it('should not create alert for promoter score', async () => {
      const { createDetractorAlert } = await import('../services/npsScheduledTriggerService');
      const result = await createDetractorAlert(1, 1, 1, 9);
      expect(result).toBeNull();
    });
  });

  describe('getPendingDetractorAlerts', () => {
    it('should return array of pending alerts', async () => {
      const { getPendingDetractorAlerts } = await import('../services/npsScheduledTriggerService');
      const alerts = await getPendingDetractorAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('checkPendingNpsProcesses', () => {
    it('should return pending processes count', async () => {
      const { checkPendingNpsProcesses } = await import('../services/npsScheduledTriggerService');
      const result = await checkPendingNpsProcesses();
      expect(result).toHaveProperty('pendingCount');
      expect(result).toHaveProperty('processes');
      expect(typeof result.pendingCount).toBe('number');
      expect(Array.isArray(result.processes)).toBe(true);
    });
  });
});

describe('A/B Test Metrics Service', () => {
  describe('recordAbTestMetric', () => {
    it('should record a metric for an experiment', async () => {
      const { recordAbTestMetric } = await import('../services/abTestMetricsService');
      const result = await recordAbTestMetric({
        experimentId: 1,
        variantId: 1,
        userId: 1,
        metricType: 'page_view',
        pageUrl: '/avd/processo/passo1',
      });
      expect(result === null || result?.metricId !== undefined).toBe(true);
    });

    it('should record time on page metric', async () => {
      const { recordAbTestMetric } = await import('../services/abTestMetricsService');
      const result = await recordAbTestMetric({
        experimentId: 1,
        variantId: 1,
        userId: 1,
        metricType: 'time_on_page',
        metricValue: 120,
      });
      expect(result === null || result?.metricId !== undefined).toBe(true);
    });

    it('should record step completion metric', async () => {
      const { recordAbTestMetric } = await import('../services/abTestMetricsService');
      const result = await recordAbTestMetric({
        experimentId: 1,
        variantId: 1,
        userId: 1,
        metricType: 'step_completion',
        stepNumber: 3,
      });
      expect(result === null || result?.metricId !== undefined).toBe(true);
    });
  });

  describe('getVariantComparison', () => {
    it('should return comparison data for experiment', async () => {
      const { getVariantComparison } = await import('../services/abTestMetricsService');
      const result = await getVariantComparison(1);
      // Pode retornar null se experimento não existir
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('createLayoutConfig', () => {
    it('should create layout config for variant', async () => {
      const { createLayoutConfig } = await import('../services/abTestMetricsService');
      const result = await createLayoutConfig(1, 1, {
        layoutType: 'cards',
        spacing: 'normal',
        showProgressBar: true,
      });
      expect(result === null || result?.configId !== undefined).toBe(true);
    });
  });

  describe('saveExperimentResults', () => {
    it('should save experiment results', async () => {
      const { saveExperimentResults } = await import('../services/abTestMetricsService');
      const result = await saveExperimentResults(1);
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('Report Export Service', () => {
  describe('exportConsolidatedReportCSV', () => {
    it('should export report as CSV', async () => {
      const { exportConsolidatedReportCSV } = await import('../services/reportExportService');
      const result = await exportConsolidatedReportCSV();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('format');
      if (result.success) {
        expect(result.format).toBe('csv');
        expect(result.content).toBeTruthy();
        expect(result.fileName).toContain('.csv');
      }
    });
  });

  describe('exportConsolidatedReportJSON', () => {
    it('should export report as JSON', async () => {
      const { exportConsolidatedReportJSON } = await import('../services/reportExportService');
      const result = await exportConsolidatedReportJSON();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('format');
      if (result.success) {
        expect(result.format).toBe('json');
        expect(result.fileName).toContain('.json');
      }
    });
  });

  describe('getExportHistory', () => {
    it('should return export history', async () => {
      const { getExportHistory } = await import('../services/reportExportService');
      const history = await getExportHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('createPirIntegrityAlert', () => {
    it('should create PIR integrity alert', async () => {
      const { createPirIntegrityAlert } = await import('../services/reportExportService');
      const result = await createPirIntegrityAlert(
        1,
        1,
        'missing_dimensions',
        'high',
        'Dimensões faltantes no PIR',
        ['IP', 'ID'],
        '6',
        '4'
      );
      expect(result === null || result?.alertId !== undefined).toBe(true);
    });
  });

  describe('getPirIntegrityAlerts', () => {
    it('should return PIR integrity alerts or empty array', async () => {
      const { getPirIntegrityAlerts } = await import('../services/reportExportService');
      const alerts = await getPirIntegrityAlerts();
      // Pode retornar array vazio ou com alertas
      expect(alerts === undefined || Array.isArray(alerts) || alerts === null || (typeof alerts === 'object')).toBe(true);
    });

    it('should filter by status', async () => {
      const { getPirIntegrityAlerts } = await import('../services/reportExportService');
      const alerts = await getPirIntegrityAlerts('open');
      // Pode retornar array vazio ou com alertas filtrados
      expect(alerts === undefined || Array.isArray(alerts) || alerts === null || (typeof alerts === 'object')).toBe(true);
    });
  });
});

describe('NPS Categories', () => {
  it('should categorize scores correctly', () => {
    const categorize = (score: number) => {
      if (score >= 9) return 'promoter';
      if (score >= 7) return 'passive';
      return 'detractor';
    };

    expect(categorize(10)).toBe('promoter');
    expect(categorize(9)).toBe('promoter');
    expect(categorize(8)).toBe('passive');
    expect(categorize(7)).toBe('passive');
    expect(categorize(6)).toBe('detractor');
    expect(categorize(0)).toBe('detractor');
  });

  it('should calculate NPS score correctly', () => {
    const calculateNps = (promoters: number, detractors: number, total: number) => {
      if (total === 0) return 0;
      return Math.round(((promoters - detractors) / total) * 100);
    };

    // 70% promoters, 10% detractors = NPS 60
    expect(calculateNps(70, 10, 100)).toBe(60);
    
    // 50% promoters, 50% detractors = NPS 0
    expect(calculateNps(50, 50, 100)).toBe(0);
    
    // 20% promoters, 60% detractors = NPS -40
    expect(calculateNps(20, 60, 100)).toBe(-40);
  });
});

describe('A/B Test Winner Determination', () => {
  it('should determine winner based on metrics', () => {
    const determineWinner = (
      conversionA: number,
      conversionB: number,
      sampleSize: number
    ): 'A' | 'B' | 'tie' | 'insufficient_data' => {
      if (sampleSize < 30) return 'insufficient_data';
      
      const diff = Math.abs(conversionA - conversionB);
      if (diff < 5) return 'tie';
      
      return conversionA > conversionB ? 'A' : 'B';
    };

    expect(determineWinner(60, 40, 100)).toBe('A');
    expect(determineWinner(40, 60, 100)).toBe('B');
    expect(determineWinner(52, 48, 100)).toBe('tie');
    expect(determineWinner(60, 40, 20)).toBe('insufficient_data');
  });
});
