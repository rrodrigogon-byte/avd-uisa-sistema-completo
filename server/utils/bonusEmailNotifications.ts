import nodemailer from "nodemailer";
import { getDb } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Função auxiliar para enviar email
async function sendEmail(options: { to: string; subject: string; html: string }) {
  const db = await getDb();
  if (!db) {
    console.warn("[BonusEmail] Database não disponível");
    return;
  }

  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, "smtp_config"))
      .limit(1);

    if (settings.length === 0) {
      console.warn("[BonusEmail] Configurações SMTP não encontradas");
      return;
    }

    const config = JSON.parse(settings[0].settingValue || "{}");

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[BonusEmail] Email enviado para ${options.to}`);
  } catch (error) {
    console.error("[BonusEmail] Erro ao enviar email:", error);
  }
}

/**
 * Sistema de Notificações por Email para Workflow de Bônus
 * Envia emails automáticos em cada etapa do processo de aprovação
 */

interface BonusNotificationData {
  employeeName: string;
  employeeEmail: string;
  approverName: string;
  approverEmail: string;
  cycleName: string;
  bonusAmount: number;
  approvalLevel: number;
  comments?: string;
}

/**
 * Enviar email quando bônus é submetido para aprovação
 */
export async function sendBonusSubmittedEmail(data: BonusNotificationData): Promise<void> {
  const subject = `🎯 Novo Bônus Submetido para Aprovação - ${data.cycleName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F39200; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #F39200; }
        .button { display: inline-block; background-color: #F39200; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Bônus Aguardando Aprovação</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.approverName}</strong>!</p>
          
          <p>Um novo bônus foi submetido para sua aprovação no sistema AVD UISA.</p>
          
          <div class="info-box">
            <h3>📋 Detalhes do Bônus</h3>
            <p><strong>Colaborador:</strong> ${data.employeeName}</p>
            <p><strong>Ciclo:</strong> ${data.cycleName}</p>
            <p><strong>Valor do Bônus:</strong> R$ ${data.bonusAmount.toFixed(2)}</p>
            <p><strong>Nível de Aprovação:</strong> ${data.approvalLevel}</p>
          </div>
          
          <p>Por favor, acesse o sistema para revisar e aprovar ou rejeitar este bônus.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.VITE_APP_URL || 'https://avd-uisa.manus.space'}/rh/dashboard-bonus" class="button">
              Acessar Sistema
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Este é um email automático do Sistema AVD UISA. Por favor, não responda.</p>
          <p>© 2025 UISA - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.approverEmail,
    subject,
    html: htmlContent,
  });
}

/**
 * Enviar email quando bônus é aprovado em um nível
 */
export async function sendBonusApprovedEmail(data: BonusNotificationData): Promise<void> {
  const subject = `✅ Bônus Aprovado - Nível ${data.approvalLevel} - ${data.cycleName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10B981; }
        .success-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Bônus Aprovado!</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.employeeName}</strong>!</p>
          
          <p>Temos uma ótima notícia! Seu bônus foi aprovado no <strong>Nível ${data.approvalLevel}</strong>.</p>
          
          <div class="info-box">
            <h3>📋 Detalhes da Aprovação</h3>
            <p><strong>Aprovador:</strong> ${data.approverName}</p>
            <p><strong>Ciclo:</strong> ${data.cycleName}</p>
            <p><strong>Valor do Bônus:</strong> R$ ${data.bonusAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> <span class="success-badge">Aprovado - Nível ${data.approvalLevel}</span></p>
            ${data.comments ? `<p><strong>Comentários:</strong> ${data.comments}</p>` : ''}
          </div>
          
          <p>Seu bônus está avançando no processo de aprovação. Você será notificado sobre os próximos passos.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático do Sistema AVD UISA. Por favor, não responda.</p>
          <p>© 2025 UISA - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.employeeEmail,
    subject,
    html: htmlContent,
  });
}

/**
 * Enviar email quando bônus é rejeitado
 */
export async function sendBonusRejectedEmail(data: BonusNotificationData): Promise<void> {
  const subject = `❌ Bônus Não Aprovado - ${data.cycleName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #EF4444; }
        .warning-badge { background-color: #EF4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Bônus Não Aprovado</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.employeeName}</strong>,</p>
          
          <p>Informamos que seu bônus não foi aprovado no <strong>Nível ${data.approvalLevel}</strong>.</p>
          
          <div class="info-box">
            <h3>📋 Detalhes</h3>
            <p><strong>Responsável pela Decisão:</strong> ${data.approverName}</p>
            <p><strong>Ciclo:</strong> ${data.cycleName}</p>
            <p><strong>Valor:</strong> R$ ${data.bonusAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> <span class="warning-badge">Não Aprovado</span></p>
            ${data.comments ? `<p><strong>Motivo:</strong> ${data.comments}</p>` : ''}
          </div>
          
          <p>Para mais informações, entre em contato com o departamento de Recursos Humanos.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático do Sistema AVD UISA. Por favor, não responda.</p>
          <p>© 2025 UISA - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.employeeEmail,
    subject,
    html: htmlContent,
  });
}

/**
 * Enviar email quando bônus é totalmente aprovado (todos os níveis)
 */
export async function sendBonusFinallyApprovedEmail(data: BonusNotificationData): Promise<void> {
  const subject = `🎉 Bônus Totalmente Aprovado - ${data.cycleName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F39200; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #F39200; }
        .highlight { background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .amount { font-size: 32px; font-weight: bold; color: #F39200; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Parabéns!</h1>
          <p style="font-size: 18px; margin-top: 10px;">Seu Bônus Foi Totalmente Aprovado</p>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.employeeName}</strong>!</p>
          
          <p>É com grande satisfação que informamos que seu bônus passou por todas as etapas de aprovação e foi <strong>totalmente aprovado</strong>!</p>
          
          <div class="highlight">
            <p style="margin: 0; font-size: 14px; color: #666;">Valor Aprovado</p>
            <p class="amount">R$ ${data.bonusAmount.toFixed(2)}</p>
          </div>
          
          <div class="info-box">
            <h3>📋 Informações do Bônus</h3>
            <p><strong>Ciclo de Avaliação:</strong> ${data.cycleName}</p>
            <p><strong>Aprovação Final:</strong> ${data.approverName}</p>
            <p><strong>Status:</strong> ✅ Aprovado em Todos os Níveis</p>
          </div>
          
          <p>O valor será processado pelo departamento financeiro e estará disponível conforme o calendário de pagamentos da empresa.</p>
          
          <p><strong>Parabéns pelo excelente desempenho!</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático do Sistema AVD UISA. Por favor, não responda.</p>
          <p>© 2025 UISA - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.employeeEmail,
    subject,
    html: htmlContent,
  });
}
