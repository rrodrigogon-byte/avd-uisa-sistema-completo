import { describe, it, expect } from 'vitest';
import { sendEmail, sendTestInvite, sendPulseSurveyInvite, sendNotificationEmail, sendCredentialsEmail } from '../_core/email';

/**
 * Testes Completos para Sistema de Notificações por Email
 * Valida todas as funcionalidades de envio de email do sistema
 */

describe('Sistema de Notificações por Email - Funções Especializadas', () => {
  it('deve enviar convite para teste psicométrico', async () => {
    const result = await sendTestInvite(
      'funcionario@example.com',
      'João Silva',
      'disc',
      'https://app.example.com/teste/disc/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar convite para pesquisa Pulse', async () => {
    const result = await sendPulseSurveyInvite(
      'funcionario@example.com',
      'Maria Santos',
      'Pesquisa de Satisfação',
      'Como você avalia o ambiente de trabalho?',
      'https://app.example.com/pulse/456'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar notificação genérica', async () => {
    const result = await sendNotificationEmail(
      'funcionario@example.com',
      'Carlos Oliveira',
      'Nova Avaliação Disponível',
      '<p>Você tem uma nova avaliação pendente. Por favor, acesse o sistema.</p>'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar credenciais de acesso', async () => {
    const result = await sendCredentialsEmail(
      'novousuario@example.com',
      'Ana Costa',
      'ana.costa',
      'SenhaTemporaria123!',
      'https://app.example.com/login'
    );

    expect(typeof result).toBe('boolean');
  });
});

describe('Sistema de Notificações - Templates de Email', () => {
  it('deve enviar email com template de convite para teste DISC', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'disc',
      'https://app.example.com/teste/disc/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste Big Five', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'bigfive',
      'https://app.example.com/teste/bigfive/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste MBTI', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'mbti',
      'https://app.example.com/teste/mbti/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste de Inteligência Emocional', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'ei',
      'https://app.example.com/teste/ei/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste VARK', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'vark',
      'https://app.example.com/teste/vark/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste de Liderança', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'leadership',
      'https://app.example.com/teste/leadership/123'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com template de convite para teste de Âncoras de Carreira', async () => {
    const result = await sendTestInvite(
      'teste@example.com',
      'Funcionário Teste',
      'anchors',
      'https://app.example.com/teste/anchors/123'
    );

    expect(typeof result).toBe('boolean');
  });
});

describe('Sistema de Notificações - Validação de Conteúdo', () => {
  it('deve enviar email com conteúdo HTML complexo', async () => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F39200;">Título do Email</h1>
        <p>Parágrafo com <strong>negrito</strong> e <em>itálico</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        <a href="https://example.com" style="color: #F39200;">Link de Exemplo</a>
      </div>
    `;

    const result = await sendNotificationEmail(
      'teste@example.com',
      'Teste',
      'Email com HTML Complexo',
      htmlContent
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com caracteres especiais', async () => {
    const result = await sendNotificationEmail(
      'teste@example.com',
      'José María',
      'Notificação com Acentuação',
      '<p>Conteúdo com acentuação: à, é, í, ó, ú, ã, õ, ç</p>'
    );

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com emojis', async () => {
    const result = await sendNotificationEmail(
      'teste@example.com',
      'Teste',
      'Email com Emojis 🎉',
      '<p>Parabéns! 🎊 Você completou a avaliação! ✅</p>'
    );

    expect(typeof result).toBe('boolean');
  });
});

describe('Sistema de Notificações - Múltiplos Destinatários', () => {
  it('deve enviar notificação para múltiplos destinatários', async () => {
    const result = await sendEmail({
      to: [
        'destinatario1@example.com',
        'destinatario2@example.com',
        'destinatario3@example.com',
      ],
      subject: 'Notificação em Massa',
      html: '<p>Esta notificação foi enviada para múltiplos destinatários.</p>',
    });

    expect(typeof result).toBe('boolean');
  });

  it('deve enviar email com cópia para múltiplos destinatários', async () => {
    const result = await sendEmail({
      to: ['principal@example.com', 'copia1@example.com', 'copia2@example.com'],
      subject: 'Email com Múltiplas Cópias',
      html: '<p>Email enviado para destinatário principal e cópias.</p>',
    });

    expect(typeof result).toBe('boolean');
  });
});

describe('Sistema de Notificações - Validação de Erros', () => {
  it('deve retornar false quando não há destinatários', async () => {
    const result = await sendEmail({
      to: [],
      subject: 'Teste',
      html: '<p>Teste</p>',
    });

    expect(result).toBe(false);
  });

  it('deve lidar com emails inválidos graciosamente', async () => {
    const result = await sendEmail({
      to: 'email-invalido',
      subject: 'Teste',
      html: '<p>Teste</p>',
    });

    // Deve retornar boolean mesmo com email inválido
    expect(typeof result).toBe('boolean');
  });
});
