import nodemailer from "nodemailer";
import { getDb } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Função para obter configurações SMTP do banco
async function getSmtpConfig() {
  const db = await getDb();
  if (!db) return null;

  try {
    const settings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, "smtp_config"))
      .limit(1);

    if (settings.length === 0) return null;

    const config = settings[0].settingValue ? JSON.parse(settings[0].settingValue) : null;
    return config;
  } catch (error) {
    console.error("[EmailService] Erro ao buscar configurações SMTP:", error);
    return null;
  }
}

// Criar transporter dinâmico baseado nas configurações do banco
async function createTransporter() {
  const config = await getSmtpConfig();
  
  if (!config) {
    console.warn("[EmailService] Configurações SMTP não encontradas. Configure em /admin/smtp");
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

// Email templates
const templates = {
  goalReminder: (data: { employeeName: string; goalTitle: string; dueDate: string; progress: number }) => ({
    subject: `Lembrete: Meta "${data.goalTitle}" vence em breve`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
            .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Lembrete de Meta</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <p>Sua meta <strong>"${data.goalTitle}"</strong> está próxima do prazo de conclusão.</p>
              <p><strong>Data de vencimento:</strong> ${data.dueDate}</p>
              <p><strong>Progresso atual:</strong></p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${data.progress}%"></div>
              </div>
              <p style="text-align: center; margin: 0;">${data.progress}%</p>
              <p style="margin-top: 20px;">Acesse o sistema para atualizar o progresso e garantir o cumprimento no prazo.</p>
              <div style="text-align: center;">
                <a href="https://avd.uisa.com.br/metas" class="button">Ver Metas</a>
              </div>
            </div>
            <div class="footer">
              <p>Sistema AVD UISA - Avaliação de Desempenho</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  evaluationPending: (data: { employeeName: string; evaluationType: string; deadline: string }) => ({
    subject: `Avaliação 360° pendente - ${data.evaluationType}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Avaliação Pendente</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <p>Você tem uma <strong>${data.evaluationType}</strong> pendente no sistema AVD.</p>
              <div class="alert">
                <strong>⏰ Prazo:</strong> ${data.deadline}
              </div>
              <p>Sua participação é fundamental para o processo de avaliação 360°. Reserve alguns minutos para completar sua avaliação.</p>
              <div style="text-align: center;">
                <a href="https://avd.uisa.com.br/avaliacoes" class="button">Iniciar Avaliação</a>
              </div>
            </div>
            <div class="footer">
              <p>Sistema AVD UISA - Avaliação de Desempenho</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  actionOverdue: (data: { employeeName: string; actionTitle: string; dueDate: string; pdiTitle: string }) => ({
    subject: `Ação de PDI vencida: ${data.actionTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Ação de PDI Vencida</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <div class="alert">
                <strong>Atenção:</strong> A ação <strong>"${data.actionTitle}"</strong> do seu ${data.pdiTitle} está vencida.
              </div>
              <p><strong>Data de vencimento:</strong> ${data.dueDate}</p>
              <p>Acesse o sistema para atualizar o status da ação ou reprogramar o prazo.</p>
              <div style="text-align: center;">
                <a href="https://avd.uisa.com.br/pdi" class="button">Ver Meu PDI</a>
              </div>
            </div>
            <div class="footer">
              <p>Sistema AVD UISA - Avaliação de Desempenho</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  resetPassword: (data: { employeeName: string; resetLink: string; expiresIn: string }) => ({
    subject: "Redefinição de senha - Sistema AVD UISA",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinição de Senha</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sistema AVD UISA.</p>
              <div class="warning">
                <strong>⚠️ Atenção:</strong> Este link expira em <strong>${data.expiresIn}</strong>.
              </div>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${data.resetLink}" class="button">Redefinir Senha</a>
              </div>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">Se você não solicitou esta redefinição, ignore este e-mail.</p>
            </div>
            <div class="footer">
              <p>Sistema AVD UISA - Avaliação de Desempenho</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Email service methods
export const emailService = {
  async sendGoalReminder(to: string, data: Parameters<typeof templates.goalReminder>[0]) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn("[EmailService] Transporter não disponível");
      return false;
    }

    const config = await getSmtpConfig();
    if (!config) return false;

    const template = templates.goalReminder(data);
    
    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[EmailService] E-mail de lembrete de meta enviado para ${to}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Erro ao enviar e-mail:", error);
      return false;
    }
  },

  async sendEvaluationReminder(to: string, data: Parameters<typeof templates.evaluationPending>[0]) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn("[EmailService] Transporter não disponível");
      return false;
    }

    const config = await getSmtpConfig();
    if (!config) return false;

    const template = templates.evaluationPending(data);
    
    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[EmailService] E-mail de lembrete de avaliação enviado para ${to}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Erro ao enviar e-mail:", error);
      return false;
    }
  },

  async sendActionOverdue(to: string, data: Parameters<typeof templates.actionOverdue>[0]) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn("[EmailService] Transporter não disponível");
      return false;
    }

    const config = await getSmtpConfig();
    if (!config) return false;

    const template = templates.actionOverdue(data);
    
    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[EmailService] E-mail de ação vencida enviado para ${to}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Erro ao enviar e-mail:", error);
      return false;
    }
  },

  async sendPasswordReset(to: string, data: Parameters<typeof templates.resetPassword>[0]) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn("[EmailService] Transporter não disponível");
      return false;
    }

    const config = await getSmtpConfig();
    if (!config) return false;

    const template = templates.resetPassword(data);
    
    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[EmailService] E-mail de redefinição de senha enviado para ${to}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Erro ao enviar e-mail:", error);
      return false;
    }
  },
};
