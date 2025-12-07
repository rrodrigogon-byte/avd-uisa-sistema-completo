/**
 * Teste de Validação de Configuração SMTP
 * Valida se as credenciais SMTP estão corretas e funcionando
 */

import { describe, it, expect } from 'vitest';
import { sendEmail } from '../_core/email';

describe('SMTP Configuration Validation', () => {
  it('should have SMTP environment variables configured', () => {
    expect(process.env.SMTP_HOST).toBeDefined();
    expect(process.env.SMTP_PORT).toBeDefined();
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_PASS).toBeDefined();
    
    console.log('[SMTP Test] SMTP_HOST:', process.env.SMTP_HOST);
    console.log('[SMTP Test] SMTP_PORT:', process.env.SMTP_PORT);
    console.log('[SMTP Test] SMTP_USER:', process.env.SMTP_USER);
    console.log('[SMTP Test] SMTP_FROM:', process.env.SMTP_FROM);
  });

  it('should send test email successfully', async () => {
    const testEmail = process.env.SMTP_USER || 'avd@uisa.com.br';
    
    const result = await sendEmail({
      to: testEmail,
      subject: '✅ Teste de Validação SMTP - Sistema AVD UISA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Sistema AVD UISA</h1>
            </div>
            <div class="content">
              <h2>✅ Configuração SMTP Validada com Sucesso!</h2>
              <div class="success">
                <p><strong>Parabéns!</strong> O sistema de envio de e-mails está funcionando corretamente.</p>
              </div>
              <p>Este e-mail confirma que as credenciais SMTP foram configuradas corretamente e o sistema está pronto para enviar notificações automáticas.</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              <p><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST}</p>
              <p><strong>Porta:</strong> ${process.env.SMTP_PORT}</p>
              <p><strong>Usuário:</strong> ${process.env.SMTP_USER}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <h3>📧 E-mails Automáticos Habilitados:</h3>
              <ul>
                <li>✅ Credenciais de novos usuários</li>
                <li>✅ Notificações de novos funcionários</li>
                <li>✅ Início de ciclos de avaliação</li>
                <li>✅ Metas SMART criadas/atualizadas</li>
                <li>✅ PDI criados/concluídos</li>
                <li>✅ Avaliações 360° concluídas</li>
                <li>✅ Mudanças na Nine Box</li>
                <li>✅ Convites para testes psicométricos</li>
                <li>✅ Pesquisas Pulse</li>
                <li>✅ Alertas de segurança</li>
              </ul>
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                O sistema está totalmente operacional e enviará e-mails automaticamente para todos os eventos importantes.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    expect(result).toBe(true);
    console.log('[SMTP Test] ✅ E-mail de teste enviado com sucesso!');
  }, 30000); // Timeout de 30 segundos para envio de email
});
