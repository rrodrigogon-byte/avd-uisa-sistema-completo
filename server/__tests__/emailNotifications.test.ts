import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import {
  evaluationProcesses,
  processParticipants,
  processEvaluators,
  employees,
} from '../../drizzle/schema';

/**
 * Testes para Sistema de Notificações por Email
 * Valida envio de emails automáticos do sistema de avaliação
 */
describe('Sistema de Notificações por Email', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve ter router de notificações por email disponível', () => {
    expect(appRouter.emailNotifications).toBeDefined();
    expect(appRouter.emailNotifications.notifyProcessStarted).toBeDefined();
    expect(appRouter.emailNotifications.notifyEvaluatorAssigned).toBeDefined();
    expect(appRouter.emailNotifications.sendPendingEvaluationReminders).toBeDefined();
    expect(appRouter.emailNotifications.notifyEvaluationsCompleted).toBeDefined();
    expect(appRouter.emailNotifications.sendResultsSummary).toBeDefined();
  });

  it('deve ter templates de email definidos', async () => {
    const { 
      emailProcessoIniciado,
      emailAvaliadorDesignado,
      emailLembreteAvaliacao,
      emailAvaliacoesConcluidas,
      emailResumoResultados,
    } = await import('../_core/emailTemplates');

    // Validar template de processo iniciado
    const templateProcesso = emailProcessoIniciado({
      employeeName: 'João Silva',
      processName: 'Avaliação 360° 2025',
      startDate: '01/01/2025',
      endDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });
    expect(templateProcesso.subject).toContain('Avaliação 360° 2025');
    expect(templateProcesso.html).toContain('João Silva');
    expect(templateProcesso.html).toContain('01/01/2025');

    // Validar template de avaliador designado
    const templateAvaliador = emailAvaliadorDesignado({
      evaluatorName: 'Maria Santos',
      evaluatedName: 'João Silva',
      processName: 'Avaliação 360° 2025',
      dueDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });
    expect(templateAvaliador.subject).toContain('João Silva');
    expect(templateAvaliador.html).toContain('Maria Santos');
    expect(templateAvaliador.html).toContain('avaliador');

    // Validar template de lembrete
    const templateLembrete = emailLembreteAvaliacao({
      evaluatorName: 'Maria Santos',
      evaluatedName: 'João Silva',
      processName: 'Avaliação 360° 2025',
      daysRemaining: 3,
      dueDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });
    expect(templateLembrete.subject).toContain('LEMBRETE');
    expect(templateLembrete.html).toContain('3');
    expect(templateLembrete.html).toContain('dias');

    // Validar template de avaliações concluídas
    const templateConcluidas = emailAvaliacoesConcluidas({
      employeeName: 'João Silva',
      processName: 'Avaliação 360° 2025',
      totalEvaluations: 5,
      loginUrl: 'https://app.manus.im/login',
    });
    expect(templateConcluidas.subject).toContain('Concluídas');
    expect(templateConcluidas.html).toContain('5');
    expect(templateConcluidas.html).toContain('CONCLUÍDO');

    // Validar template de resumo de resultados
    const templateResultados = emailResumoResultados({
      employeeName: 'João Silva',
      processName: 'Avaliação 360° 2025',
      finalScore: 4.5,
      selfScore: 4.2,
      managerScore: 4.8,
      peerScore: 4.3,
      resultsUrl: 'https://app.manus.im/resultados/1',
    });
    expect(templateResultados.subject).toContain('Resultados');
    expect(templateResultados.html).toContain('4.5');
    expect(templateResultados.html).toContain('4.2');
    expect(templateResultados.html).toContain('4.8');
  });

  it('deve validar estrutura dos templates de email', async () => {
    const { emailProcessoIniciado } = await import('../_core/emailTemplates');

    const template = emailProcessoIniciado({
      employeeName: 'Teste',
      processName: 'Processo Teste',
      startDate: '01/01/2025',
      endDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });

    // Validar que o HTML contém elementos essenciais
    expect(template.html).toContain('<!DOCTYPE html>');
    expect(template.html).toContain('AVD UISA');
    expect(template.html).toContain('Sistema de Avaliação de Desempenho');
    expect(template.html).toContain('Acessar Sistema');
    expect(template.html).toContain('https://app.manus.im/login');
    
    // Validar que é responsivo
    expect(template.html).toContain('viewport');
    expect(template.html).toContain('width=');
    
    // Validar que tem footer
    expect(template.html).toContain('email automático');
    expect(template.html).toContain(new Date().getFullYear().toString());
  });

  it('deve ter tabelas necessárias no schema para processos avaliativos', async () => {
    if (!db) {
      console.warn('Database not available, skipping test');
      return;
    }

    // Verificar se as tabelas existem consultando-as
    const processesCount = await db.select().from(evaluationProcesses).limit(1);
    expect(Array.isArray(processesCount)).toBe(true);

    const participantsCount = await db.select().from(processParticipants).limit(1);
    expect(Array.isArray(participantsCount)).toBe(true);

    const evaluatorsCount = await db.select().from(processEvaluators).limit(1);
    expect(Array.isArray(evaluatorsCount)).toBe(true);

    const employeesCount = await db.select().from(employees).limit(1);
    expect(Array.isArray(employeesCount)).toBe(true);
  });

  it('deve validar cores de urgência nos lembretes', async () => {
    const { emailLembreteAvaliacao } = await import('../_core/emailTemplates');

    // Lembrete urgente (2 dias)
    const lembreteUrgente = emailLembreteAvaliacao({
      evaluatorName: 'Teste',
      evaluatedName: 'Teste',
      processName: 'Teste',
      daysRemaining: 2,
      dueDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });
    expect(lembreteUrgente.subject).toContain('URGENTE');
    expect(lembreteUrgente.html).toContain('#dc3545'); // Cor vermelha

    // Lembrete normal (5 dias)
    const lembreteNormal = emailLembreteAvaliacao({
      evaluatorName: 'Teste',
      evaluatedName: 'Teste',
      processName: 'Teste',
      daysRemaining: 5,
      dueDate: '31/12/2025',
      loginUrl: 'https://app.manus.im/login',
    });
    expect(lembreteNormal.subject).toContain('LEMBRETE');
    expect(lembreteNormal.html).toContain('#ffc107'); // Cor amarela
  });

  it('deve validar classificação de pontuação nos resultados', async () => {
    const { emailResumoResultados } = await import('../_core/emailTemplates');

    // Pontuação alta (verde)
    const resultadoAlto = emailResumoResultados({
      employeeName: 'Teste',
      processName: 'Teste',
      finalScore: 4.5,
      resultsUrl: 'https://app.manus.im/resultados/1',
    });
    expect(resultadoAlto.html).toContain('#28a745'); // Verde

    // Pontuação média (amarelo)
    const resultadoMedio = emailResumoResultados({
      employeeName: 'Teste',
      processName: 'Teste',
      finalScore: 3.2,
      resultsUrl: 'https://app.manus.im/resultados/1',
    });
    expect(resultadoMedio.html).toContain('#ffc107'); // Amarelo

    // Pontuação baixa (vermelho)
    const resultadoBaixo = emailResumoResultados({
      employeeName: 'Teste',
      processName: 'Teste',
      finalScore: 2.5,
      resultsUrl: 'https://app.manus.im/resultados/1',
    });
    expect(resultadoBaixo.html).toContain('#dc3545'); // Vermelho
  });
});
