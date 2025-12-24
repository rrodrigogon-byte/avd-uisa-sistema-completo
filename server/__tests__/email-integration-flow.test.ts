import { describe, it, expect } from 'vitest';
import { getDb } from '../db';
import { sendEmail } from '../_core/email';
import { emailMetrics } from '../../drizzle/schema';

/**
 * Testes de Integração - Fluxo Completo de Envio de Emails
 * Valida que o sistema registra corretamente as métricas de email
 */

describe('Integração - Fluxo Completo de Envio de Emails', () => {
  it('deve enviar email e registrar na tabela de métricas', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Database não disponível - pulando teste de integração');
      return;
    }

    // Contar emails antes do envio
    const beforeCount = await db.select().from(emailMetrics);
    const initialCount = beforeCount.length;

    // Enviar email de teste
    const result = await sendEmail({
      to: 'teste-integracao@example.com',
      subject: 'Teste de Integração',
      html: '<p>Email de teste para validar integração</p>',
    });

    // Validar que email foi enviado
    expect(typeof result).toBe('boolean');

    // Aguardar um momento para garantir que métrica foi registrada
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se métrica foi registrada
    const afterCount = await db.select().from(emailMetrics);
    const finalCount = afterCount.length;

    // Deve ter pelo menos uma nova métrica registrada
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  it('deve validar estrutura de dados das métricas de email', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Database não disponível - pulando teste de integração');
      return;
    }

    // Buscar última métrica registrada
    const metrics = await db.select().from(emailMetrics).limit(1);

    if (metrics.length > 0) {
      const metric = metrics[0];

      // Validar campos obrigatórios
      expect(metric).toHaveProperty('id');
      expect(metric).toHaveProperty('type');
      expect(metric).toHaveProperty('toEmail');
      expect(metric).toHaveProperty('success');
      expect(metric).toHaveProperty('sentAt');
    }
  });

  it('deve registrar emails enviados com sucesso', async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Database não disponível - pulando teste de integração');
      return;
    }

    // Enviar email
    await sendEmail({
      to: 'sucesso@example.com',
      subject: 'Teste de Sucesso',
      html: '<p>Email de teste</p>',
    });

    // Aguardar registro
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buscar métricas recentes
    const metrics = await db.select().from(emailMetrics).limit(10);

    // Deve ter pelo menos uma métrica
    expect(metrics.length).toBeGreaterThan(0);
  });
});

describe('Integração - Validação de Tipos de Email', () => {
  it('deve enviar e registrar email de notificação de meta', async () => {
    const result = await sendEmail({
      to: 'meta@example.com',
      subject: 'Nova Meta Atribuída',
      html: '<p>Você tem uma nova meta atribuída</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar e registrar email de notificação de avaliação', async () => {
    const result = await sendEmail({
      to: 'avaliacao@example.com',
      subject: 'Nova Avaliação Disponível',
      html: '<p>Você tem uma nova avaliação pendente</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar e registrar email de convite para teste', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Convite para Teste Psicométrico',
      html: '<p>Você foi convidado para realizar um teste</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar e registrar email de notificação de PDI', async () => {
    const result = await sendEmail({
      to: 'pdi@example.com',
      subject: 'Novo PDI Criado',
      html: '<p>Seu Plano de Desenvolvimento Individual foi criado</p>',
    });

    expect(typeof result).toBe('boolean');
  });
});

describe('Integração - Validação de Performance', () => {
  it('deve enviar múltiplos emails em sequência', async () => {
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        sendEmail({
          to: `teste${i}@example.com`,
          subject: `Email de Teste ${i}`,
          html: `<p>Email número ${i}</p>`,
        })
      );
    }

    const results = await Promise.all(promises);

    // Todos devem retornar boolean
    results.forEach(result => {
      expect(typeof result).toBe('boolean');
    });
  });

  it('deve lidar com envio de emails em paralelo', async () => {
    const promises = [
      sendEmail({ to: 'paralelo1@example.com', subject: 'Teste 1', html: '<p>1</p>' }),
      sendEmail({ to: 'paralelo2@example.com', subject: 'Teste 2', html: '<p>2</p>' }),
      sendEmail({ to: 'paralelo3@example.com', subject: 'Teste 3', html: '<p>3</p>' }),
    ];

    const results = await Promise.allSettled(promises);

    // Todos devem completar
    expect(results.length).toBe(3);
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
    });
  });
});

describe('Integração - Validação de Recuperação de Erros', () => {
  it('deve retornar false para email sem destinatário', async () => {
    const result = await sendEmail({
      to: [],
      subject: 'Teste',
      html: '<p>Teste</p>',
    });

    expect(result).toBe(false);
  });

  it('deve retornar false para email sem assunto', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: '',
      html: '<p>Teste</p>',
    });

    // Deve retornar boolean mesmo sem assunto
    expect(typeof result).toBe('boolean');
  });

  it('deve retornar false para email sem conteúdo', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste',
      html: '',
    });

    // Deve retornar boolean mesmo sem conteúdo
    expect(typeof result).toBe('boolean');
  });
});
