import nodemailer from "nodemailer";
import { getDb } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Cache de configuração SMTP
let cachedSmtpConfig: any = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minuto

// Buscar configuração SMTP do banco de dados
async function getSmtpConfig() {
  const now = Date.now();
  
  // Retornar do cache se ainda válido
  if (cachedSmtpConfig && (now - lastFetch) < CACHE_TTL) {
    return cachedSmtpConfig;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[EmailService] Database not available");
      return null;
    }

    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, "smtp_config"))
      .limit(1);

    if (result.length === 0) {
      console.warn("[EmailService] SMTP não configurado no banco de dados");
      return null;
    }

    cachedSmtpConfig = JSON.parse(result[0].settingValue || '{}');
    lastFetch = now;
    console.log("[EmailService] SMTP config carregado do banco:", cachedSmtpConfig.host);
    return cachedSmtpConfig;
  } catch (error) {
    console.error("[EmailService] Erro ao buscar SMTP config:", error);
    return null;
  }
}

// Criar transporter baseado na configuração do banco
async function createTransporter() {
  const config = await getSmtpConfig();
  
  if (!config || !config.host || !config.port || !config.user || !config.pass) {
    console.warn("[EmailService] SMTP não configurado completamente");
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure || parseInt(config.port) === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    console.error("[EmailService] Erro ao criar transporter:", error);
    return null;
  }
}

// Função base de envio de email
async function sendCustomEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = await createTransporter();
  
  if (!transporter) {
    const errorMsg = "[EmailService] SMTP não configurado. Configure em /admin/smtp";
    console.error(errorMsg);
    return false; // Retorna false ao invés de lançar exceção
  }

  try {
    const config = await getSmtpConfig();
    const smtpFrom = config?.fromEmail || config?.user || "noreply@avduisa.com";
    const fromName = config?.fromName || "Sistema AVD UISA";

    await transporter.sendMail({
      from: `"${fromName}" <${smtpFrom}>`,
      to,
      subject,
      html,
    });

    console.log(`[EmailService] Email enviado para ${to}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Erro ao enviar email para ${to}:`, error);
    return false;
  }
}

// Export com compatibilidade para ambos os formatos
export async function sendEmail(
  toOrOptions: string | { to: string; subject: string; html: string },
  subject?: string,
  html?: string
): Promise<boolean> {
  if (typeof toOrOptions === 'string') {
    // Formato: sendEmail(to, subject, html)
    return sendCustomEmail(toOrOptions, subject!, html!);
  } else {
    // Formato: sendEmail({ to, subject, html })
    return sendCustomEmail(toOrOptions.to, toOrOptions.subject, toOrOptions.html);
  }
}

// Serviço de email
export const emailService = {
  sendCustomEmail,

  async sendGoalReminder(to: string, data: { employeeName: string; goalTitle: string; dueDate: string; progress: number }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F39200;">Lembrete de Meta</h2>
        <p>Olá, ${data.employeeName}!</p>
        <p>A meta <strong>"${data.goalTitle}"</strong> vence em ${data.dueDate}.</p>
        <p>Progresso atual: <strong>${data.progress}%</strong></p>
        <p>Não se esqueça de atualizar seu progresso!</p>
      </div>
    `;
    return sendCustomEmail(to, `Lembrete: Meta "${data.goalTitle}" vence em breve`, html);
  },

  async sendEvaluationReminder(to: string, data: { employeeName: string; evaluationType: string; dueDate: string }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F39200;">Lembrete de Avaliação</h2>
        <p>Olá, ${data.employeeName}!</p>
        <p>Você tem uma avaliação <strong>${data.evaluationType}</strong> pendente.</p>
        <p>Prazo: ${data.dueDate}</p>
        <p>Acesse o sistema para completar sua avaliação.</p>
      </div>
    `;
    return sendCustomEmail(to, `Lembrete: Avaliação ${data.evaluationType} pendente`, html);
  },

  async sendBonusApproval(to: string, data: { approverName: string; employeeName: string; amount: number; period: string }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F39200;">Aprovação de Bônus</h2>
        <p>Olá, ${data.approverName}!</p>
        <p>Um bônus está aguardando sua aprovação:</p>
        <ul>
          <li><strong>Colaborador:</strong> ${data.employeeName}</li>
          <li><strong>Valor:</strong> R$ ${data.amount.toFixed(2)}</li>
          <li><strong>Período:</strong> ${data.period}</li>
        </ul>
        <p>Acesse o sistema para aprovar ou rejeitar.</p>
      </div>
    `;
    return sendCustomEmail(to, 'Aprovação de Bônus Pendente', html);
  },

  async sendBadgeNotification(to: string, data: { employeeName: string; badgeName: string; badgeDescription: string }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F39200;">🏆 Nova Conquista Desbloqueada!</h2>
        <p>Olá, ${data.employeeName}!</p>
        <p>Parabéns! Você conquistou um novo badge:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.badgeName}</h3>
          <p>${data.badgeDescription}</p>
        </div>
        <p>Continue assim! 🎉</p>
      </div>
    `;
    return sendCustomEmail(to, `🏆 Nova Conquista: ${data.badgeName}`, html);
  },

  async sendActionOverdue(to: string, data: { employeeName: string; actionTitle: string; dueDate: string }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F39200;">⚠️ Ação Vencida</h2>
        <p>Olá, ${data.employeeName}!</p>
        <p>A ação <strong>"${data.actionTitle}"</strong> está vencida desde ${data.dueDate}.</p>
        <p>Por favor, atualize o status no sistema.</p>
      </div>
    `;
    return sendCustomEmail(to, `⚠️ Ação Vencida: ${data.actionTitle}`, html);
  },
};

// Função para enviar email de teste
export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F39200 0%, #FF6B00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">✅ Email de Teste</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Olá!</p>
        <p>Este é um <strong>email de teste</strong> do Sistema AVD UISA.</p>
        <p>Se você recebeu esta mensagem, significa que a configuração SMTP está funcionando corretamente! 🎉</p>
        <div style="background: white; padding: 20px; border-left: 4px solid #F39200; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #F39200;">📧 Informações do Teste</h3>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Destinatário:</strong> ${recipientEmail}</p>
          <p><strong>Sistema:</strong> AVD UISA - Avaliação de Desempenho</p>
        </div>
        <p>Atenciosamente,<br><strong>Sistema AVD UISA</strong></p>
      </div>
      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
        <p>Este é um email automático do Sistema AVD UISA</p>
      </div>
    </div>
  `;

  const success = await sendCustomEmail(recipientEmail, '✅ Email de Teste - Sistema AVD UISA', html);
  
  return {
    success,
    message: success 
      ? `Email de teste enviado com sucesso para ${recipientEmail}` 
      : 'Falha ao enviar email de teste. Verifique as configurações SMTP.'
  };
}
