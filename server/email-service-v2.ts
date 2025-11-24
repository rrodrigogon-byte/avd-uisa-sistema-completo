/**
 * Email Service V2 - Sistema AVD UISA
 * 
 * Serviço completo de envio de e-mails usando Gmail SMTP
 * com retry automático, templates HTML e sistema de fila.
 * 
 * @version 2.0
 * @author Manus AI
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts: number;
  deliveryTime: number;
}

export interface EmailMetrics {
  type: string;
  to: string;
  success: boolean;
  deliveryTime: number;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

// ============================================
// CONFIGURAÇÃO DO GMAIL SMTP
// ============================================

const GMAIL_CONFIG: EmailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para porta 465, false para outras portas
  auth: {
    user: 'avd@uisa.com.br',
    pass: process.env.GMAIL_APP_PASSWORD || 'C8HNBnv@Wfjznqo6CKSzw^'
  }
};

// Configurações de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos
const RETRY_BACKOFF = 2; // Multiplicador exponencial

// ============================================
// CLASSE PRINCIPAL: EmailService
// ============================================

export class EmailService {
  private transporter: Transporter;
  private metrics: EmailMetrics[] = [];
  private failedQueue: EmailOptions[] = [];

  constructor(config?: EmailConfig) {
    const emailConfig = config || GMAIL_CONFIG;
    
    // Validar configuração
    if (!emailConfig.auth.pass || emailConfig.auth.pass === '') {
      throw new Error('GMAIL_APP_PASSWORD não configurado');
    }

    // Criar transporter
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Verifica se o serviço de e-mail está funcionando
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Serviço de e-mail verificado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar serviço de e-mail:', error);
      return false;
    }
  }

  /**
   * Envia um e-mail com retry automático
   */
  async sendEmail(options: EmailOptions, type: string = 'general'): Promise<EmailResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from: `"AVD UISA" <${GMAIL_CONFIG.auth.user}>`,
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          subject: options.subject,
          html: options.html,
          attachments: options.attachments
        });

        const deliveryTime = Date.now() - startTime;

        // Registrar métrica de sucesso
        this.recordMetric({
          type,
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          success: true,
          deliveryTime,
          messageId: info.messageId,
          sentAt: new Date()
        });

        console.log(`✅ E-mail enviado com sucesso: ${info.messageId}`);

        return {
          success: true,
          messageId: info.messageId,
          attempts: attempt,
          deliveryTime
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Tentativa ${attempt}/${MAX_RETRIES} falhou:`, error);

        // Se não for a última tentativa, aguardar antes de tentar novamente
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(RETRY_BACKOFF, attempt - 1);
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }

    // Todas as tentativas falharam
    const deliveryTime = Date.now() - startTime;

    // Registrar métrica de falha
    this.recordMetric({
      type,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      success: false,
      deliveryTime,
      error: lastError?.message,
      sentAt: new Date()
    });

    // Adicionar à fila de falhas
    this.failedQueue.push(options);

    return {
      success: false,
      error: lastError?.message || 'Erro desconhecido',
      attempts: MAX_RETRIES,
      deliveryTime
    };
  }

  /**
   * Envia múltiplos e-mails em lote
   */
  async sendBatch(emails: Array<{ options: EmailOptions; type: string }>): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email.options, email.type);
      results.push(result);
      
      // Pequeno delay entre e-mails para evitar rate limiting
      await this.sleep(100);
    }

    return results;
  }

  /**
   * Reprocessa e-mails que falharam
   */
  async retryFailed(): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    const failedCopy = [...this.failedQueue];
    this.failedQueue = [];

    for (const options of failedCopy) {
      const result = await this.sendEmail(options, 'retry');
      results.push(result);
    }

    return results;
  }

  /**
   * Registra métrica de envio
   */
  private recordMetric(metric: EmailMetrics): void {
    this.metrics.push(metric);

    // Limitar tamanho do array de métricas (últimas 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Retorna métricas de envio
   */
  getMetrics(): EmailMetrics[] {
    return this.metrics;
  }

  /**
   * Retorna estatísticas de envio
   */
  getStats() {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;
    const avgDeliveryTime = total > 0
      ? this.metrics.reduce((sum, m) => sum + m.deliveryTime, 0) / total
      : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      failedQueueSize: this.failedQueue.length
    };
  }

  /**
   * Limpa fila de e-mails falhados
   */
  clearFailedQueue(): void {
    this.failedQueue = [];
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// TEMPLATES DE E-MAIL
// ============================================

/**
 * Template base para e-mails
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVD UISA</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .alert {
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .alert-warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      color: #856404;
    }
    .alert-success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      color: #155724;
    }
    .alert-danger {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      color: #721c24;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 AVD UISA</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Sistema de Avaliação de Desempenho</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este é um e-mail automático do Sistema AVD UISA.</p>
      <p>Não responda este e-mail. Em caso de dúvidas, acesse o <a href="https://avd.uisa.com.br">sistema</a>.</p>
      <p style="margin-top: 15px;">© 2025 UISA - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template: Ação de PDI Vencida
 */
export function getPDIActionOverdueTemplate(data: {
  employeeName: string;
  actionTitle: string;
  actionDescription: string;
  dueDate: string;
  daysOverdue: number;
  managerName: string;
  pdiUrl: string;
}): string {
  const content = `
    <h2>⚠️ Ação de PDI Vencida</h2>
    
    <p>Olá <strong>${data.employeeName}</strong>,</p>
    
    <div class="alert alert-warning">
      <strong>Atenção!</strong> Uma ação do seu Plano de Desenvolvimento Individual (PDI) está vencida.
    </div>
    
    <h3>Detalhes da Ação:</h3>
    
    <table>
      <tr>
        <th>Ação</th>
        <td>${data.actionTitle}</td>
      </tr>
      <tr>
        <th>Descrição</th>
        <td>${data.actionDescription}</td>
      </tr>
      <tr>
        <th>Data de Vencimento</th>
        <td>${data.dueDate}</td>
      </tr>
      <tr>
        <th>Dias em Atraso</th>
        <td><strong style="color: #dc3545;">${data.daysOverdue} dia(s)</strong></td>
      </tr>
      <tr>
        <th>Seu Gestor</th>
        <td>${data.managerName}</td>
      </tr>
    </table>
    
    <p><strong>O que fazer agora?</strong></p>
    <ul>
      <li>Acesse seu PDI e atualize o status da ação</li>
      <li>Se a ação foi concluída, marque como "Concluída"</li>
      <li>Se ainda está em andamento, atualize o progresso</li>
      <li>Se houver dificuldades, converse com seu gestor</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${data.pdiUrl}" class="button">Acessar Meu PDI</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
      <em>Lembre-se: O PDI é uma ferramenta importante para o seu desenvolvimento profissional. 
      Mantenha-o sempre atualizado!</em>
    </p>
  `;

  return getBaseTemplate(content);
}

/**
 * Template: Bem-vindo ao Sistema
 */
export function getWelcomeTemplate(data: {
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}): string {
  const content = `
    <h2>🎉 Bem-vindo ao Sistema AVD UISA!</h2>
    
    <p>Olá <strong>${data.userName}</strong>,</p>
    
    <p>Sua conta foi criada com sucesso no Sistema de Avaliação de Desempenho da UISA.</p>
    
    <div class="alert alert-success">
      <strong>Acesso liberado!</strong> Use as credenciais abaixo para fazer seu primeiro login.
    </div>
    
    <h3>Suas Credenciais:</h3>
    
    <table>
      <tr>
        <th>E-mail</th>
        <td>${data.email}</td>
      </tr>
      <tr>
        <th>Senha Temporária</th>
        <td><code style="background: #f8f9fa; padding: 5px 10px; border-radius: 3px;">${data.temporaryPassword}</code></td>
      </tr>
    </table>
    
    <div class="alert alert-warning">
      <strong>Importante:</strong> Por segurança, você será solicitado a alterar sua senha no primeiro login.
    </div>
    
    <div style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Fazer Login</a>
    </div>
    
    <p style="margin-top: 30px;"><strong>O que você pode fazer no sistema:</strong></p>
    <ul>
      <li>📊 Visualizar e gerenciar suas metas</li>
      <li>📝 Participar de avaliações 360°</li>
      <li>🎯 Criar e acompanhar seu PDI</li>
      <li>📈 Acompanhar seu desempenho</li>
      <li>💬 Receber e dar feedbacks</li>
    </ul>
  `;

  return getBaseTemplate(content);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Cria instância singleton do EmailService
 */
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

/**
 * Envia e-mail de ação de PDI vencida
 */
export async function sendPDIActionOverdueEmail(data: {
  employeeEmail: string;
  employeeName: string;
  actionTitle: string;
  actionDescription: string;
  dueDate: string;
  daysOverdue: number;
  managerName: string;
  managerEmail: string;
  pdiUrl: string;
}): Promise<EmailResult> {
  const emailService = getEmailService();

  const html = getPDIActionOverdueTemplate({
    employeeName: data.employeeName,
    actionTitle: data.actionTitle,
    actionDescription: data.actionDescription,
    dueDate: data.dueDate,
    daysOverdue: data.daysOverdue,
    managerName: data.managerName,
    pdiUrl: data.pdiUrl
  });

  return await emailService.sendEmail(
    {
      to: data.employeeEmail,
      cc: data.managerEmail, // Cópia para o gestor
      subject: `⚠️ Ação de PDI Vencida: ${data.actionTitle}`,
      html
    },
    'pdi_action_overdue'
  );
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default EmailService;
