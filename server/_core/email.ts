import nodemailer from 'nodemailer';
import { ENV } from './env';

/**
 * Lista de emails permitidos para receber mensagens do sistema
 * Apenas ativa se ENABLE_EMAIL_WHITELIST=true nas variáveis de ambiente
 */
const EMAIL_WHITELIST = [
  'rodrigo.goncalves@uisa.com.br',
  'caroline.silva@uisa.com.br',
  'andre.sbardellini@uisa.com.br',
];

/**
 * Verifica se a whitelist está habilitada via variável de ambiente
 */
function isWhitelistEnabled(): boolean {
  return process.env.ENABLE_EMAIL_WHITELIST === 'true';
}

/**
 * Verifica se um email está na whitelist
 */
function isEmailAllowed(email: string): boolean {
  // Se whitelist não está habilitada, permite todos os emails
  if (!isWhitelistEnabled()) {
    return true;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  return EMAIL_WHITELIST.some(allowed => allowed.toLowerCase() === normalizedEmail);
}

/**
 * Filtra uma lista de emails, retornando apenas os permitidos
 */
function filterAllowedEmails(emails: string | string[]): string[] {
  const emailList = Array.isArray(emails) ? emails : [emails];
  
  // Se whitelist não está habilitada, retorna todos os emails
  if (!isWhitelistEnabled()) {
    return emailList;
  }
  
  const allowed = emailList.filter(isEmailAllowed);
  const blocked = emailList.filter(email => !isEmailAllowed(email));
  
  if (blocked.length > 0) {
    console.log('[Email] Emails bloqueados pela whitelist:', blocked);
    console.log('[Email] ATENÇÃO: Whitelist está ATIVA. Para desabilitar, remova ENABLE_EMAIL_WHITELIST das variáveis de ambiente.');
  }
  
  return allowed;
}

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

  // Filtrar emails permitidos (apenas se whitelist estiver habilitada)
  const allowedEmails = filterAllowedEmails(options.to);
  
  if (allowedEmails.length === 0) {
    if (isWhitelistEnabled()) {
      console.log('[Email] Nenhum email permitido na whitelist. Email não enviado.');
      console.log('[Email] ATENÇÃO: Whitelist está ATIVA. Para desabilitar, remova ENABLE_EMAIL_WHITELIST das variáveis de ambiente.');
    } else {
      console.log('[Email] Nenhum destinatário válido fornecido.');
    }
    return false;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Sistema AVD UISA';
    
    const mailOptions = {
      from: options.from || `"${fromName}" <${smtpFrom}>`,
      to: allowedEmails.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transport.sendMail(mailOptions);
    console.log('[Email] Enviado para:', allowedEmails);
    console.log('[Email] Message ID:', info.messageId);
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

/**
 * Email de boas-vindas ao criar novo usuário
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #d97f00 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao Sistema AVD UISA!</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          É um prazer tê-lo(a) conosco! Sua conta foi criada com sucesso no Sistema AVD UISA.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          O Sistema AVD UISA é uma plataforma completa de gestão de desempenho que permite:
        </p>
        
        <ul style="color: #666; font-size: 14px; line-height: 1.8;">
          <li>Acompanhar suas avaliações de desempenho</li>
          <li>Definir e gerenciar metas SMART</li>
          <li>Criar e acompanhar seu Plano de Desenvolvimento Individual (PDI)</li>
          <li>Participar de avaliações 360°</li>
          <li>Receber e enviar feedbacks</li>
        </ul>
        
        <p style="font-size: 14px; color: #666; margin-top: 25px;">
          Em breve você receberá suas credenciais de acesso por email.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
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
    subject: 'Bem-vindo ao Sistema AVD UISA',
    html,
  });
}

/**
 * Email de notificação de login
 */
export async function sendLoginNotification(
  recipientEmail: string,
  recipientName: string,
  loginTime: Date,
  ipAddress?: string
): Promise<boolean> {
  const formattedDate = loginTime.toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #F39200;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Novo acesso detectado</h2>
        <p style="font-size: 14px; color: #666; margin: 0;">Sistema AVD UISA</p>
      </div>
      
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666;">
          Detectamos um novo acesso à sua conta no Sistema AVD UISA:
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Data e Hora:</strong> ${formattedDate}
          </p>
          ${ipAddress ? `<p style="margin: 0; font-size: 14px; color: #666;"><strong>Endereço IP:</strong> ${ipAddress}</p>` : ''}
        </div>
        
        <p style="font-size: 13px; color: #666;">
          Se você não reconhece este acesso, entre em contato imediatamente com o suporte.
        </p>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px;">
        <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
          Este é um e-mail de segurança do Sistema AVD UISA.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Novo acesso à sua conta - Sistema AVD UISA',
    html,
  });
}

/**
 * Email quando nova avaliação é criada
 */
export async function sendEvaluationCreatedEmail(
  recipientEmail: string,
  recipientName: string,
  evaluationType: string,
  cycleName: string,
  dueDate?: Date
): Promise<boolean> {
  const dueDateText = dueDate
    ? `<p style="font-size: 14px; color: #666;"><strong>Prazo:</strong> ${dueDate.toLocaleDateString('pt-BR')}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #d97f00 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Nova Avaliação Disponível</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Uma nova avaliação foi criada para você no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F39200; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Tipo:</strong> ${evaluationType}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Ciclo:</strong> ${cycleName}
          </p>
          ${dueDateText}
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar os detalhes e iniciar sua avaliação.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Nova Avaliação: ${evaluationType} - ${cycleName}`,
    html,
  });
}

/**
 * Email de lembrete de avaliação pendente
 */
export async function sendEvaluationReminderEmail(
  recipientEmail: string,
  recipientName: string,
  evaluationType: string,
  cycleName: string,
  daysRemaining: number
): Promise<boolean> {
  const urgencyColor = daysRemaining <= 1 ? '#dc3545' : daysRemaining <= 3 ? '#ffc107' : '#F39200';
  const urgencyText = daysRemaining === 0 
    ? 'HOJE é o último dia!' 
    : daysRemaining === 1 
    ? 'Falta apenas 1 dia!' 
    : `Faltam ${daysRemaining} dias!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${urgencyColor}; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Lembrete: Avaliação Pendente</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Este é um lembrete de que você tem uma avaliação pendente no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 18px; color: #856404; font-weight: bold;">
            ${urgencyText}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Tipo:</strong> ${evaluationType}
          </p>
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Ciclo:</strong> ${cycleName}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Por favor, acesse o sistema o quanto antes para completar sua avaliação.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `⏰ Lembrete: Avaliação Pendente - ${urgencyText}`,
    html,
  });
}

/**
 * Email quando avaliação é concluída
 */
export async function sendEvaluationCompletedEmail(
  recipientEmail: string,
  recipientName: string,
  evaluationType: string,
  cycleName: string,
  completedBy: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20883b 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Avaliação Concluída</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Uma avaliação foi concluída no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">
            <strong>Tipo:</strong> ${evaluationType}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">
            <strong>Ciclo:</strong> ${cycleName}
          </p>
          <p style="margin: 0; font-size: 14px; color: #155724;">
            <strong>Concluída por:</strong> ${completedBy}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar os resultados.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `✅ Avaliação Concluída: ${evaluationType} - ${cycleName}`,
    html,
  });
}

/**
 * Email quando período de avaliação inicia
 */
export async function sendCycleStartedEmail(
  recipientEmail: string,
  recipientName: string,
  cycleName: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Novo Período de Avaliação Iniciado</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Um novo período de avaliação foi iniciado no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #cfe2ff; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px; color: #084298; font-weight: bold;">
            ${cycleName}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #084298;">
            <strong>Início:</strong> ${startDate.toLocaleDateString('pt-BR')}
          </p>
          <p style="margin: 0; font-size: 14px; color: #084298;">
            <strong>Término:</strong> ${endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Prepare-se para participar das avaliações de desempenho deste período.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `🚀 Novo Período de Avaliação: ${cycleName}`,
    html,
  });
}

/**
 * Email quando meta SMART é criada
 */
export async function sendGoalCreatedEmail(
  recipientEmail: string,
  recipientName: string,
  goalTitle: string,
  dueDate?: Date
): Promise<boolean> {
  const dueDateText = dueDate
    ? `<p style="margin: 0; font-size: 14px; color: #084298;"><strong>Prazo:</strong> ${dueDate.toLocaleDateString('pt-BR')}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #d97f00 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎯 Nova Meta Criada</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Uma nova meta foi criada para você no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #F39200; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px; color: #856404; font-weight: bold;">
            ${goalTitle}
          </p>
          ${dueDateText}
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar os detalhes e começar a trabalhar nesta meta.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `🎯 Nova Meta: ${goalTitle}`,
    html,
  });
}

/**
 * Email quando meta SMART é concluída
 */
export async function sendGoalCompletedEmail(
  recipientEmail: string,
  recipientName: string,
  goalTitle: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20883b 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Meta Concluída!</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Parabéns! Uma meta foi marcada como concluída.
        </p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 25px 0;">
          <p style="margin: 0; font-size: 16px; color: #155724; font-weight: bold;">
            ${goalTitle}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Continue assim! Acesse o sistema para visualizar suas outras metas.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `🎉 Meta Concluída: ${goalTitle}`,
    html,
  });
}

/**
 * Email quando PDI é criado
 */
export async function sendPDICreatedEmail(
  recipientEmail: string,
  recipientName: string,
  pdiTitle: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📚 Novo PDI Criado</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Um novo Plano de Desenvolvimento Individual (PDI) foi criado para você.
        </p>
        
        <div style="background-color: #e7d6f5; padding: 20px; border-radius: 8px; border-left: 4px solid #6f42c1; margin: 25px 0;">
          <p style="margin: 0; font-size: 16px; color: #432874; font-weight: bold;">
            ${pdiTitle}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar as ações de desenvolvimento planejadas para você.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `📚 Novo PDI: ${pdiTitle}`,
    html,
  });
}

/**
 * Email quando feedback é enviado
 */
export async function sendFeedbackReceivedEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  feedbackType: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💬 Novo Feedback Recebido</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Você recebeu um novo feedback no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #0c5460;">
            <strong>De:</strong> ${senderName}
          </p>
          <p style="margin: 0; font-size: 14px; color: #0c5460;">
            <strong>Tipo:</strong> ${feedbackType}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para ler o feedback completo.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `💬 Novo Feedback de ${senderName}`,
    html,
  });
}

/**
 * Email quando funcionário é promovido/rebaixado
 */
export async function sendRoleChangeEmail(
  recipientEmail: string,
  recipientName: string,
  changeType: 'promocao' | 'transferencia' | 'mudanca_cargo',
  details: string
): Promise<boolean> {
  const titles = {
    promocao: '🎊 Promoção',
    transferencia: '🔄 Transferência',
    mudanca_cargo: '📋 Mudança de Cargo',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #d97f00 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${titles[changeType]}</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Informamos que houve uma atualização em seu cadastro no Sistema AVD UISA.
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #F39200; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            ${details}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar as atualizações em seu perfil.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${titles[changeType]} - Sistema AVD UISA`,
    html,
  });
}

/**
 * Email de relatório periódico para administradores
 */
export async function sendAdminReportEmail(
  recipientEmail: string,
  recipientName: string,
  reportData: {
    totalEmployees: number;
    pendingEvaluations: number;
    completedEvaluations: number;
    activeGoals: number;
    completedGoals: number;
  }
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #343a40 0%, #23272b 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📊 Relatório do Sistema</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">
          Olá <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          Aqui está o relatório periódico do Sistema AVD UISA.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Estatísticas Gerais</h3>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Total de Colaboradores:</strong> ${reportData.totalEmployees}
            </p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Avaliações</h4>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
              <strong>Pendentes:</strong> ${reportData.pendingEvaluations}
            </p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Concluídas:</strong> ${reportData.completedEvaluations}
            </p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Metas</h4>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
              <strong>Ativas:</strong> ${reportData.activeGoals}
            </p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Concluídas:</strong> ${reportData.completedGoals}
            </p>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Acesse o sistema para visualizar relatórios detalhados.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            Este é um e-mail automático do Sistema AVD UISA.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: '📊 Relatório Periódico - Sistema AVD UISA',
    html,
  });
}
