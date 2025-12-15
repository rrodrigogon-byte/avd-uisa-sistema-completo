import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

let transporter: ReturnType<typeof nodemailer.createTransporter> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: `"${ENV.smtpFromName}" <${ENV.smtpFrom}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false, error };
  }
}

export function getAvaliationCreatedEmailTemplate(data: {
  avaliadoName: string;
  avaliadorName: string;
  periodo: string;
  resultadoUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Avaliação de Desempenho</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${data.avaliadoName}</strong>,</p>
          
          <p>Uma nova avaliação de desempenho foi registrada para você:</p>
          
          <ul>
            <li><strong>Avaliador:</strong> ${data.avaliadorName}</li>
            <li><strong>Período:</strong> ${data.periodo}</li>
          </ul>
          
          <p>Você pode visualizar os resultados completos clicando no botão abaixo:</p>
          
          <center>
            <a href="${data.resultadoUrl}" class="button">Ver Resultados da Avaliação</a>
          </center>
          
          <p>Este email é uma notificação automática do Sistema AVD UISA.</p>
        </div>
        <div class="footer">
          <p>Sistema de Avaliação de Desempenho AVD UISA</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getAvaliationReminderEmailTemplate(data: {
  avaliadorName: string;
  avaliadoName: string;
  periodo: string;
  formUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lembrete: Avaliação Pendente</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${data.avaliadorName}</strong>,</p>
          
          <p>Este é um lembrete de que você tem uma avaliação pendente:</p>
          
          <ul>
            <li><strong>Avaliado:</strong> ${data.avaliadoName}</li>
            <li><strong>Período:</strong> ${data.periodo}</li>
          </ul>
          
          <p>Por favor, acesse o sistema para preencher a avaliação:</p>
          
          <center>
            <a href="${data.formUrl}" class="button">Preencher Avaliação</a>
          </center>
          
          <p>Este email é uma notificação automática do Sistema AVD UISA.</p>
        </div>
        <div class="footer">
          <p>Sistema de Avaliação de Desempenho AVD UISA</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
