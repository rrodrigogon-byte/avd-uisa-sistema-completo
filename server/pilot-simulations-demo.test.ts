/**
 * Testes para Simulados do Piloto e Alertas de Segurança
 * Valida as novas funcionalidades implementadas
 */

import { describe, it, expect } from 'vitest';

describe('Simulados do Piloto - Dados de Demonstração', () => {
  it('deve ter a procedure seedDemoData disponível no router', async () => {
    const { pilotSimulationsRouter } = await import('./routers/pilotSimulationsRouter');
    
    expect(pilotSimulationsRouter).toBeDefined();
    expect(pilotSimulationsRouter._def.procedures).toBeDefined();
    
    const procedures = pilotSimulationsRouter._def.procedures;
    expect(procedures.seedDemoData).toBeDefined();
  });

  it('deve ter a procedure clearDemoData disponível no router', async () => {
    const { pilotSimulationsRouter } = await import('./routers/pilotSimulationsRouter');
    
    const procedures = pilotSimulationsRouter._def.procedures;
    expect(procedures.clearDemoData).toBeDefined();
  });

  it('deve ter todas as procedures básicas do piloto', async () => {
    const { pilotSimulationsRouter } = await import('./routers/pilotSimulationsRouter');
    
    const procedures = pilotSimulationsRouter._def.procedures;
    
    expect(procedures.create).toBeDefined();
    expect(procedures.list).toBeDefined();
    expect(procedures.getById).toBeDefined();
    expect(procedures.addParticipants).toBeDefined();
    expect(procedures.updateParticipantStatus).toBeDefined();
    expect(procedures.updatePhase).toBeDefined();
    expect(procedures.updateStatus).toBeDefined();
    expect(procedures.updateScheduleStep).toBeDefined();
    expect(procedures.recordMetrics).toBeDefined();
    expect(procedures.getDashboard).toBeDefined();
    expect(procedures.getAvailableEmployees).toBeDefined();
    expect(procedures.seedDemoData).toBeDefined();
    expect(procedures.clearDemoData).toBeDefined();
  });
});

describe('Alertas de Segurança - Notificações por Email', () => {
  it('deve ter a procedure notifyManagersAboutAlerts disponível', async () => {
    const { pirSuspiciousAccessRouter } = await import('./routers/pirSuspiciousAccessRouter');
    
    expect(pirSuspiciousAccessRouter).toBeDefined();
    expect(pirSuspiciousAccessRouter._def.procedures).toBeDefined();
    
    const procedures = pirSuspiciousAccessRouter._def.procedures;
    expect(procedures.notifyManagersAboutAlerts).toBeDefined();
  });

  it('deve ter a procedure sendAutomaticAlertEmail disponível', async () => {
    const { pirSuspiciousAccessRouter } = await import('./routers/pirSuspiciousAccessRouter');
    
    const procedures = pirSuspiciousAccessRouter._def.procedures;
    expect(procedures.sendAutomaticAlertEmail).toBeDefined();
  });

  it('deve ter todas as procedures de alertas de segurança', async () => {
    const { pirSuspiciousAccessRouter } = await import('./routers/pirSuspiciousAccessRouter');
    
    const procedures = pirSuspiciousAccessRouter._def.procedures;
    
    expect(procedures.logAnomaly).toBeDefined();
    expect(procedures.detectFastResponses).toBeDefined();
    expect(procedures.detectTabSwitch).toBeDefined();
    expect(procedures.listAlerts).toBeDefined();
    expect(procedures.reviewAlert).toBeDefined();
    expect(procedures.getStats).toBeDefined();
    expect(procedures.getByAssessment).toBeDefined();
    expect(procedures.notifyManagersAboutAlerts).toBeDefined();
    expect(procedures.sendAutomaticAlertEmail).toBeDefined();
  });
});

describe('Menu Lateral - Links de Navegação', () => {
  it('deve ter os arquivos de página necessários', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const clientPagesPath = path.resolve(__dirname, '../client/src/pages');
    
    const pilotSimulationsPath = path.join(clientPagesPath, 'PilotSimulations.tsx');
    const pilotSimulationsExists = await fs.access(pilotSimulationsPath).then(() => true).catch(() => false);
    expect(pilotSimulationsExists).toBe(true);
    
    const suspiciousAccessPath = path.join(clientPagesPath, 'SuspiciousAccessDashboard.tsx');
    const suspiciousAccessExists = await fs.access(suspiciousAccessPath).then(() => true).catch(() => false);
    expect(suspiciousAccessExists).toBe(true);
  });

  it('deve ter o DashboardLayout com a seção Piloto', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dashboardLayoutPath = path.resolve(__dirname, '../client/src/components/DashboardLayout.tsx');
    const content = await fs.readFile(dashboardLayoutPath, 'utf-8');
    
    expect(content).toContain('Piloto');
    expect(content).toContain('/piloto/simulados');
    expect(content).toContain('/seguranca/alertas');
    expect(content).toContain('Simulados');
    expect(content).toContain('Alertas de Segurança');
  });
});

describe('Serviço de Email', () => {
  it('deve ter a função sendEmail disponível', async () => {
    const { sendEmail } = await import('./emailService');
    
    expect(sendEmail).toBeDefined();
    expect(typeof sendEmail).toBe('function');
  });

  it('deve ter a função sendTestEmail disponível', async () => {
    const { sendTestEmail } = await import('./emailService');
    
    expect(sendTestEmail).toBeDefined();
    expect(typeof sendTestEmail).toBe('function');
  });

  it('deve ter a função sendTemplateEmail disponível', async () => {
    const { sendTemplateEmail } = await import('./emailService');
    
    expect(sendTemplateEmail).toBeDefined();
    expect(typeof sendTemplateEmail).toBe('function');
  });
});
