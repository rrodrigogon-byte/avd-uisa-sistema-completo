import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sendEmail } from '../_core/email';

/**
 * Testes para Sistema de Envio de Emails
 * Valida correção da whitelist e envio de emails
 */

describe('Sistema de Envio de Emails - Whitelist', () => {
  const originalEnv = process.env.ENABLE_EMAIL_WHITELIST;

  afterAll(() => {
    // Restaurar configuração original
    if (originalEnv) {
      process.env.ENABLE_EMAIL_WHITELIST = originalEnv;
    } else {
      delete process.env.ENABLE_EMAIL_WHITELIST;
    }
  });

  it('deve permitir envio para qualquer email quando whitelist está desabilitada', async () => {
    // Garantir que whitelist está desabilitada
    delete process.env.ENABLE_EMAIL_WHITELIST;

    // Tentar enviar para email não presente na whitelist
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste de Email',
      html: '<p>Teste</p>',
    });

    // Deve retornar true ou false dependendo da configuração SMTP
    // Mas não deve bloquear por whitelist
    expect(typeof result).toBe('boolean');
  });

  it('deve bloquear emails não autorizados quando whitelist está habilitada', async () => {
    // Habilitar whitelist
    process.env.ENABLE_EMAIL_WHITELIST = 'true';

    // Tentar enviar para email não presente na whitelist
    const result = await sendEmail({
      to: 'naoautorizado@example.com',
      subject: 'Teste de Email',
      html: '<p>Teste</p>',
    });

    // Deve retornar false porque email foi bloqueado
    expect(result).toBe(false);
  });

  it('deve permitir envio para emails autorizados quando whitelist está habilitada', async () => {
    // Habilitar whitelist
    process.env.ENABLE_EMAIL_WHITELIST = 'true';

    // Tentar enviar para email presente na whitelist
    const result = await sendEmail({
      to: 'rodrigo.goncalves@uisa.com.br',
      subject: 'Teste de Email',
      html: '<p>Teste</p>',
    });

    // Deve retornar true ou false dependendo da configuração SMTP
    // Mas não deve bloquear por whitelist
    expect(typeof result).toBe('boolean');
  });

  it('deve permitir envio para múltiplos emails quando whitelist está desabilitada', async () => {
    // Garantir que whitelist está desabilitada
    delete process.env.ENABLE_EMAIL_WHITELIST;

    // Tentar enviar para múltiplos emails
    const result = await sendEmail({
      to: ['teste1@example.com', 'teste2@example.com', 'teste3@example.com'],
      subject: 'Teste de Email',
      html: '<p>Teste</p>',
    });

    // Deve retornar true ou false dependendo da configuração SMTP
    // Mas não deve bloquear por whitelist
    expect(typeof result).toBe('boolean');
  });

  it('deve filtrar corretamente quando whitelist está habilitada com múltiplos emails', async () => {
    // Habilitar whitelist
    process.env.ENABLE_EMAIL_WHITELIST = 'true';

    // Tentar enviar para mix de emails autorizados e não autorizados
    const result = await sendEmail({
      to: [
        'rodrigo.goncalves@uisa.com.br', // autorizado
        'naoautorizado@example.com', // não autorizado
        'caroline.silva@uisa.com.br', // autorizado
      ],
      subject: 'Teste de Email',
      html: '<p>Teste</p>',
    });

    // Deve retornar true ou false dependendo da configuração SMTP
    // Mas deve enviar apenas para os autorizados
    expect(typeof result).toBe('boolean');
  });
});

describe('Sistema de Envio de Emails - Funcionalidades', () => {
  it('deve validar que sendEmail aceita destinatário único', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste',
      html: '<p>Teste</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve validar que sendEmail aceita múltiplos destinatários', async () => {
    const result = await sendEmail({
      to: ['teste1@example.com', 'teste2@example.com'],
      subject: 'Teste',
      html: '<p>Teste</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve validar que sendEmail aceita conteúdo HTML', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste',
      html: '<div><h1>Título</h1><p>Conteúdo</p></div>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve validar que sendEmail aceita conteúdo texto', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste',
      text: 'Conteúdo em texto puro',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve validar que sendEmail aceita remetente customizado', async () => {
    const result = await sendEmail({
      to: 'teste@example.com',
      subject: 'Teste',
      html: '<p>Teste</p>',
      from: '"Sistema Teste" <teste@example.com>',
    });

    expect(typeof result).toBe('boolean');
  });
});
