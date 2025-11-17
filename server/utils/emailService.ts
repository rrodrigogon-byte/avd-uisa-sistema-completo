import nodemailer from "nodemailer";

// Email configuration
const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "avd@uisa.com.br",
    pass: "C8HNBnv@Wfjznqo6CKSzw^", // App password
  },
};

// Create reusable transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

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

  pdiApproved: (data: { employeeName: string; pdiTitle: string; startDate: string }) => ({
    subject: `PDI aprovado: ${data.pdiTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ PDI Aprovado!</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <div class="success">
                <strong>🎉 Parabéns!</strong> Seu Plano de Desenvolvimento Individual foi aprovado.
              </div>
              <p><strong>PDI:</strong> ${data.pdiTitle}</p>
              <p><strong>Data de início:</strong> ${data.startDate}</p>
              <p>Agora você pode começar a executar as ações planejadas e acompanhar seu progresso no sistema.</p>
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

  newGoalAssigned: (data: { employeeName: string; goalTitle: string; dueDate: string; managerName: string }) => ({
    subject: `Nova meta atribuída: ${data.goalTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #fa709a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Nova Meta Atribuída</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.employeeName}</strong>!</p>
              <p>Uma nova meta foi atribuída a você por <strong>${data.managerName}</strong>.</p>
              <div class="info">
                <p><strong>Meta:</strong> ${data.goalTitle}</p>
                <p><strong>Prazo:</strong> ${data.dueDate}</p>
              </div>
              <p>Acesse o sistema para visualizar os detalhes completos e começar a trabalhar nesta meta.</p>
              <div style="text-align: center;">
                <a href="https://avd.uisa.com.br/metas" class="button">Ver Meta</a>
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
};

// Email service class
export class EmailService {
  async sendGoalReminder(to: string, data: Parameters<typeof templates.goalReminder>[0]) {
    const template = templates.goalReminder(data);
    return this.sendEmail(to, template.subject, template.html);
  }

  async sendEvaluationPending(to: string, data: Parameters<typeof templates.evaluationPending>[0]) {
    const template = templates.evaluationPending(data);
    return this.sendEmail(to, template.subject, template.html);
  }

  async sendPDIApproved(to: string, data: Parameters<typeof templates.pdiApproved>[0]) {
    const template = templates.pdiApproved(data);
    return this.sendEmail(to, template.subject, template.html);
  }

  async sendNewGoalAssigned(to: string, data: Parameters<typeof templates.newGoalAssigned>[0]) {
    const template = templates.newGoalAssigned(data);
    return this.sendEmail(to, template.subject, template.html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await transporter.sendMail({
        from: `"Sistema AVD UISA" <${EMAIL_CONFIG.auth.user}>`,
        to,
        subject,
        html,
      });

      console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[EmailService] Error sending email to ${to}:`, error);
      return { success: false, error };
    }
  }

  async verifyConnection() {
    try {
      await transporter.verify();
      console.log("[EmailService] SMTP connection verified");
      return true;
    } catch (error) {
      console.error("[EmailService] SMTP connection failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
