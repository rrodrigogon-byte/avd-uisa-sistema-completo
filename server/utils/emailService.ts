import nodemailer from "nodemailer";

// Criar transporter baseado em variáveis de ambiente
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn("[EmailService] SMTP não configurado");
    return null;
  }

  try {
    return nodemailer.createTransport({
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
  } catch (error) {
    console.error("[EmailService] Erro ao criar transporter:", error);
    return null;
  }
}

// Função base de envio de email
async function sendCustomEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn("[EmailService] SMTP não configurado");
    return false;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || "Sistema AVD UISA";

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
