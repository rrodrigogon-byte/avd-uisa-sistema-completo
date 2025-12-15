/**
 * Testes para Envio Real de Emails
 * Valida que o sistema consegue enviar emails via SMTP
 */

import { describe, it, expect } from 'vitest';
import { sendEmail } from './emailService';

describe('Envio de Emails', () => {
  it('deve enviar email de teste com sucesso', async () => {
    const result = await sendEmail({
      to: 'avd@uisa.com.br',
      subject: 'Teste Automatizado - Sistema AVD UISA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Teste de Email</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Sucesso!</strong> O sistema de emails está funcionando corretamente.
              </div>
              <p>Este é um email de teste automático enviado pelo sistema AVD UISA.</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <p><strong>Servidor SMTP:</strong> smtp.gmail.com</p>
              <p><strong>Porta:</strong> 587</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    expect(result).toBe(true);
  }, 30000); // Timeout de 30 segundos para envio de email

  it('deve enviar email com template de credenciais', async () => {
    const tempPassword = 'Teste123!@#';
    const employeeName = 'Usuário Teste';
    const employeeCode = 'TEST001';

    const result = await sendEmail({
      to: 'avd@uisa.com.br',
      subject: 'Credenciais de Acesso - Sistema AVD UISA (TESTE)',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #667eea; }
            .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Credenciais de Acesso</h1>
              <p>Sistema AVD UISA</p>
            </div>
            <div class="content">
              <p>Olá <strong>${employeeName}</strong>,</p>
              <p>Suas credenciais de acesso ao Sistema AVD UISA foram geradas com sucesso:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <div class="credential-label">👤 Código do Funcionário:</div>
                  <div class="credential-value">${employeeCode}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔑 Senha Temporária:</div>
                  <div class="credential-value">${tempPassword}</div>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por favor, altere sua senha no primeiro acesso ao sistema.
              </div>

              <p><strong>Link de Acesso:</strong><br>
              <a href="https://avd.uisa.com.br" style="color: #667eea;">https://avd.uisa.com.br</a></p>

              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    expect(result).toBe(true);
  }, 30000);
});
