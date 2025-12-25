import { describe, it, expect, beforeAll } from 'vitest';
import { emailService, sendTestEmail } from '../utils/emailService';

describe('Email Service', () => {
  beforeAll(() => {
    // Verificar que variáveis de ambiente SMTP estão configuradas
    expect(process.env.SMTP_HOST).toBeDefined();
    expect(process.env.SMTP_PORT).toBeDefined();
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_PASS).toBeDefined();
  });

  it('deve ter configuração SMTP válida', () => {
    expect(process.env.SMTP_HOST).toBe('smtp.gmail.com');
    expect(process.env.SMTP_PORT).toBe('587');
    expect(process.env.SMTP_USER).toBe('avd@uisa.com.br');
  });

  it('deve enviar email de teste com sucesso', async () => {
    const result = await sendTestEmail('rodrigo.goncalves@uisa.com.br');
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain('sucesso');
  }, 30000); // Timeout de 30 segundos para envio de email

  it('deve enviar email customizado com sucesso', async () => {
    const sent = await emailService.sendCustomEmail(
      'rodrigo.goncalves@uisa.com.br',
      'Teste de Email - Sistema AVD UISA',
      '<h1>Teste de Email</h1><p>Este é um email de teste do sistema.</p>'
    );
    
    expect(sent).toBe(true);
  }, 30000);
});
