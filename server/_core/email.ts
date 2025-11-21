import nodemailer from 'nodemailer';
import { ENV } from './env';

/**
 * Configuração do transporte de email usando SMTP
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('[Email] SMTP não configurado');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log(`[Email] SMTP configurado: ${smtpHost}:${smtpPort}`);
    return transporter;
  } catch (error) {
    console.error('[Email] Erro ao configurar SMTP:', error);
    return null;
  }
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();
  
  if (!transport) {
    console.warn('[Email] SMTP não configurado');
    return false;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Sistema AVD UISA';
    
    const mailOptions = {
      from: options.from || `"${fromName}" <${smtpFrom}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transport.sendMail(mailOptions);
    console.log('[Email] Enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return false;
  }
}

export async function sendTestInvite(
  employeeEmail: string,
  employeeName: string,
  testType: string,
  inviteLink: string
): Promise<boolean> {
  const testNames: Record<string, string> = {
    disc: 'DISC',
    bigfive: 'Big Five',
    mbti: 'MBTI',
    ei: 'Inteligência Emocional',
    vark: 'VARK',
    leadership: 'Liderança',
    anchors: 'Âncoras de Carreira',
  };

  const testName = testNames[testType] || testType;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">Convite para Teste Psicométrico</h2>
      <p>Olá <strong>${employeeName}</strong>,</p>
      <p>Você foi convidado(a) para realizar o teste <strong>${testName}</strong>.</p>
      <p>Este teste faz parte do processo de desenvolvimento profissional da empresa.</p>
      <p style="margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #f97316; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Iniciar Teste
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${inviteLink}">${inviteLink}</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: employeeEmail,
    subject: `Convite: Teste ${testName}`,
    html,
  });
}

export async function sendPulseSurveyInvite(
  employeeEmail: string,
  employeeName: string,
  surveyTitle: string,
  surveyQuestion: string,
  responseLink: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">Nova Pesquisa de Pulse</h2>
      <p>Olá <strong>${employeeName}</strong>,</p>
      <p>Uma nova pesquisa de satisfação está disponível:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${surveyTitle}</h3>
        <p style="color: #666;">${surveyQuestion}</p>
      </div>
      <p style="margin: 30px 0;">
        <a href="${responseLink}" 
           style="background-color: #f97316; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Responder Pesquisa
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Sua opinião é muito importante para nós!
      </p>
    </div>
  `;

  return sendEmail({
    to: employeeEmail,
    subject: `Pesquisa: ${surveyTitle}`,
    html,
  });
}

export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  title: string,
  content: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">${title}</h2>
      <p>Olá <strong>${recipientName}</strong>,</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${content}
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: title,
    html,
  });
}
