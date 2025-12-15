/**
 * Serviço de Envio de E-mail
 * Integração com SMTP para envio de notificações do sistema
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Cria transporter SMTP baseado nas configurações do sistema
 */
async function createTransporter(): Promise<Transporter | null> {
  try {
    // Buscar configurações SMTP do banco de dados
    const { getDb } = await import('./db');
    const { systemSettings } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const database = await getDb();
    if (!database) {
      console.warn('[Email] Database not available');
      return null;
    }

    const settings = await database
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, 'smtp_config'))
      .limit(1);

    if (settings.length === 0) {
      console.warn('[Email] SMTP not configured');
      return null;
    }

    const smtpConfig = JSON.parse(settings[0].settingValue || '{}');

    // Validar configuração mínima
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password) {
      console.warn('[Email] Incomplete SMTP configuration');
      return null;
    }

    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.secure !== false, // true para 465, false para outros
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: smtpConfig.rejectUnauthorized !== false,
      },
    });

    // Verificar conexão
    await transporter.verify();
    console.log('[Email] SMTP connection verified');

    return transporter;
  } catch (error) {
    console.error('[Email] Failed to create transporter:', error);
    return null;
  }
}

/**
 * Envia e-mail usando configuração SMTP do sistema
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn('[Email] Transporter not available, email not sent');
      return false;
    }

    const mailOptions = {
      from: options.from || '"Sistema AVD UISA" <noreply@uisa.com.br>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Message sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Envia e-mail de teste para validar configuração SMTP
 */
export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const testHtml = `
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
      <h2>✅ E-mail de Teste</h2>
      <div class="success">
        <p><strong>Parabéns!</strong> A configuração SMTP está funcionando corretamente.</p>
      </div>
      <p>Este é um e-mail de teste enviado pelo Sistema AVD UISA para validar a configuração de envio de e-mails.</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>Destinatário:</strong> ${recipientEmail}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280;">
        Se você recebeu este e-mail, significa que o sistema está pronto para enviar notificações automáticas.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const success = await sendEmail({
      to: recipientEmail,
      subject: '✅ Teste de Configuração SMTP - Sistema AVD UISA',
      html: testHtml,
    });

    if (success) {
      return {
        success: true,
        message: `E-mail de teste enviado com sucesso para ${recipientEmail}`,
      };
    } else {
      return {
        success: false,
        message: 'Falha ao enviar e-mail. Verifique as configurações SMTP.',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao enviar e-mail: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Envia e-mail usando template específico
 */
export async function sendTemplateEmail(
  recipientEmail: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}
