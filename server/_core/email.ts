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

/**
 * Enviar credenciais de acesso por email
 * IMPORTANTE: Envia username E senha
 */
export async function sendCredentialsEmail(
  recipientEmail: string,
  recipientName: string,
  username: string,
  password: string,
  loginUrl?: string
): Promise<boolean> {
  const appUrl = loginUrl || process.env.VITE_OAUTH_PORTAL_URL || 'https://portal.manus.im';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #d97f00 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Sistema AVD UISA</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Suas credenciais de acesso</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Suas credenciais de acesso ao Sistema AVD UISA foram criadas com sucesso. 
          Utilize os dados abaixo para fazer login:
        </p>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #F39200; margin: 25px 0;">
          <div style="margin-bottom: 15px;">
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Usuário</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #333; font-weight: bold; font-family: 'Courier New', monospace;">
              ${username}
            </p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Senha</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #333; font-weight: bold; font-family: 'Courier New', monospace;">
              ${password}
            </p>
          </div>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; font-size: 13px; color: #856404;">
            <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
          </p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" 
             style="background-color: #F39200; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; 
                    font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Acessar Sistema
          </a>
        </p>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            Se o botão não funcionar, copie e cole este link no navegador:<br>
            <a href="${appUrl}" style="color: #F39200; word-break: break-all;">${appUrl}</a>
          </p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.<br>
            Em caso de dúvidas, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Suas credenciais de acesso - Sistema AVD UISA',
    html,
  });
}
