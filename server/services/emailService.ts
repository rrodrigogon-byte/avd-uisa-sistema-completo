import nodemailer from "nodemailer";
import { getDb } from "../db";
import { emailConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Servico de Email - Suporta SMTP, SendGrid e AWS SES
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendGridEmailOptions extends EmailOptions {
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: any = null;

  /**
   * Inicializar servico de email com configuracoes do banco
   */
  async initialize() {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[EmailService] Database not available");
        return false;
      }

      const configs = await db.select().from(emailConfig).where(eq(emailConfig.isActive, true));
      
      if (configs.length === 0) {
        console.warn("[EmailService] No active email configuration found");
        return false;
      }

      this.config = configs[0];

      if (this.config.provider === "smtp") {
        this.transporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpPort === 465,
          auth: {
            user: this.config.smtpUser,
            pass: this.config.smtpPassword,
          },
        });
      } else if (this.config.provider === "sendgrid") {
        // SendGrid via SMTP
        this.transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: this.config.sendgridApiKey,
          },
        });
      }

      return true;
    } catch (error) {
      console.error("[EmailService] Failed to initialize:", error);
      return false;
    }
  }

  /**
   * Enviar email simples
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn("[EmailService] Email service not available");
          return false;
        }
      }

      const result = await this.transporter!.sendMail({
        from: this.config?.fromEmail || "noreply@avd-uisa.com",
        ...options,
      });

      console.log(`[EmailService] Email sent successfully: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return false;
    }
  }

  /**
   * Enviar email de alerta critico
   */
  async sendCriticalAlert(
    to: string,
    goalTitle: string,
    progress: number,
    severity: string,
    daysRemaining: number
  ): Promise<boolean> {
    const severityLabel = {
      extreme: "EXTREMA",
      high: "ALTA",
      medium: "MEDIA",
      low: "BAIXA",
    }[severity] || "DESCONHECIDA";

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 4px; text-align: center; }
            .content { margin: 20px 0; }
            .metric { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d32f2f; margin: 10px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ ALERTA DE META CRITICA</h2>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Uma de suas metas atingiu um nivel critico de severidade e requer atencao imediata.</p>
              
              <div class="metric">
                <strong>Meta:</strong> ${goalTitle}<br>
                <strong>Progresso:</strong> ${progress.toFixed(2)}%<br>
                <strong>Severidade:</strong> <span style="color: #d32f2f; font-weight: bold;">${severityLabel}</span><br>
                <strong>Dias Restantes:</strong> ${daysRemaining}
              </div>

              <p style="color: #d32f2f; font-weight: bold;">
                Acoes recomendadas:
              </p>
              <ul>
                <li>Revisar o progresso atual da meta</li>
                <li>Identificar obstaculos e bloqueios</li>
                <li>Ajustar o plano de acao se necessario</li>
                <li>Comunicar com seu gestor se houver riscos</li>
              </ul>
            </div>
            <div class="footer">
              <p>Este eh um email automatico do Sistema AVD UISA. Nao responda este email.</p>
              <p>&copy; 2024 AVD UISA - Sistema de Avaliacao de Desempenho</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `⚠️ ALERTA CRITICO: ${goalTitle} - ${severityLabel}`,
      html,
      text: `Alerta critico para meta: ${goalTitle}. Progresso: ${progress}%. Severidade: ${severityLabel}. Dias restantes: ${daysRemaining}.`,
    });
  }

  /**
   * Enviar relatorio de performance
   */
  async sendPerformanceReport(
    to: string | string[],
    userName: string,
    reportData: {
      performanceScore: number;
      goalsCompleted: number;
      goalsTotal: number;
      criticalGoals: number;
      period: string;
    }
  ): Promise<boolean> {
    const completionRate = reportData.goalsTotal > 0 
      ? ((reportData.goalsCompleted / reportData.goalsTotal) * 100).toFixed(2)
      : "0.00";

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background-color: #1976d2; color: white; padding: 20px; border-radius: 4px; text-align: center; }
            .content { margin: 20px 0; }
            .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .metric-box { background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #1976d2; }
            .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .metric-value { font-size: 28px; font-weight: bold; color: #1976d2; margin: 10px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 RELATORIO DE PERFORMANCE</h2>
              <p>Periodo: ${reportData.period}</p>
            </div>
            <div class="content">
              <p>Olá ${userName},</p>
              <p>Segue seu relatorio de performance para o periodo solicitado:</p>
              
              <div class="metric-grid">
                <div class="metric-box">
                  <div class="metric-label">Score de Performance</div>
                  <div class="metric-value">${reportData.performanceScore.toFixed(2)}</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Taxa de Conclusao</div>
                  <div class="metric-value">${completionRate}%</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Metas Concluidas</div>
                  <div class="metric-value">${reportData.goalsCompleted}/${reportData.goalsTotal}</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Metas Criticas</div>
                  <div class="metric-value" style="color: #d32f2f;">${reportData.criticalGoals}</div>
                </div>
              </div>

              <p>Para mais detalhes, acesse o dashboard de performance no sistema AVD UISA.</p>
            </div>
            <div class="footer">
              <p>Este eh um email automatico do Sistema AVD UISA. Nao responda este email.</p>
              <p>&copy; 2024 AVD UISA - Sistema de Avaliacao de Desempenho</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `📊 Relatorio de Performance - ${reportData.period}`,
      html,
      text: `Relatorio de Performance. Score: ${reportData.performanceScore}. Taxa de conclusao: ${completionRate}%. Metas concluidas: ${reportData.goalsCompleted}/${reportData.goalsTotal}.`,
    });
  }

  /**
   * Enviar relatorio agendado
   */
  async sendScheduledReport(
    to: string | string[],
    reportName: string,
    fileUrl: string,
    reportType: string
  ): Promise<boolean> {
    const typeLabel = {
      goals: "Metas",
      alerts: "Alertas",
      performance: "Performance",
      summary: "Resumo",
    }[reportType] || "Relatorio";

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background-color: #388e3c; color: white; padding: 20px; border-radius: 4px; text-align: center; }
            .content { margin: 20px 0; }
            .button { display: inline-block; background-color: #388e3c; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📄 ${typeLabel.toUpperCase()} - RELATORIO AGENDADO</h2>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Seu relatorio agendado "${reportName}" foi gerado com sucesso e esta pronto para download.</p>
              
              <p>Tipo de Relatorio: <strong>${typeLabel}</strong></p>
              
              <a href="${fileUrl}" class="button">📥 Baixar Relatorio</a>

              <p style="color: #666; font-size: 12px;">
                O link para download estara disponivel por 7 dias.
              </p>
            </div>
            <div class="footer">
              <p>Este eh um email automatico do Sistema AVD UISA. Nao responda este email.</p>
              <p>&copy; 2024 AVD UISA - Sistema de Avaliacao de Desempenho</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `📄 Relatorio Agendado: ${reportName}`,
      html,
      text: `Seu relatorio agendado "${reportName}" foi gerado. Acesse: ${fileUrl}`,
    });
  }
}

export const emailService = new EmailService();
