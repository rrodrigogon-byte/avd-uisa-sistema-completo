import { sendEmail } from "./emailService";

/**
 * Serviço de emails para PDI
 */

interface PDIImportNotification {
  employeeName: string;
  employeeEmail?: string;
  managerName?: string;
  managerEmail?: string;
  pdiId: number;
  importedBy: string;
  importDate: Date;
  totalGaps: number;
  totalActions: number;
}

/**
 * Enviar email quando importação de PDI for concluída
 */
export async function sendPDIImportCompletedEmail(data: PDIImportNotification): Promise<boolean> {
  try {
    const subject = `PDI Importado com Sucesso - ${data.employeeName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #002D62; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #65B32E; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #65B32E; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PDI Importado com Sucesso</h1>
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>Um novo Plano de Desenvolvimento Individual (PDI) foi importado com sucesso para o sistema AVD UISA.</p>
            
            <div class="info-box">
              <h3>Detalhes da Importação</h3>
              <p><strong>Colaborador:</strong> ${data.employeeName}</p>
              <p><strong>Data da Importação:</strong> ${data.importDate.toLocaleDateString('pt-BR')}</p>
              <p><strong>Importado por:</strong> ${data.importedBy}</p>
              <p><strong>Total de Gaps de Competências:</strong> ${data.totalGaps}</p>
              <p><strong>Total de Ações de Desenvolvimento:</strong> ${data.totalActions}</p>
            </div>
            
            <p>O PDI está aguardando aprovação. Por favor, acesse o sistema para revisar e aprovar o plano.</p>
            
            <a href="${process.env.VITE_APP_URL || 'https://avd-uisa.manus.space'}/pdi/${data.pdiId}" class="button">
              Visualizar PDI
            </a>
          </div>
          <div class="footer">
            <p>Sistema AVD UISA - Avaliação de Desempenho</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
PDI Importado com Sucesso

Um novo Plano de Desenvolvimento Individual (PDI) foi importado com sucesso para o sistema AVD UISA.

Detalhes da Importação:
- Colaborador: ${data.employeeName}
- Data da Importação: ${data.importDate.toLocaleDateString('pt-BR')}
- Importado por: ${data.importedBy}
- Total de Gaps de Competências: ${data.totalGaps}
- Total de Ações de Desenvolvimento: ${data.totalActions}

O PDI está aguardando aprovação. Por favor, acesse o sistema para revisar e aprovar o plano.

Acesse: ${process.env.VITE_APP_URL || 'https://avd-uisa.manus.space'}/pdi/${data.pdiId}

---
Sistema AVD UISA - Avaliação de Desempenho
Este é um email automático, por favor não responda.
    `;

    // Enviar para o colaborador (se tiver email)
    if (data.employeeEmail) {
      await sendEmail({
        to: data.employeeEmail,
        subject,
        html,
        text,
      });
    }

    // Enviar para o gestor (se tiver email)
    if (data.managerEmail) {
      await sendEmail({
        to: data.managerEmail,
        subject: `Novo PDI para Aprovação - ${data.employeeName}`,
        html: html.replace(
          'O PDI está aguardando aprovação. Por favor, acesse o sistema para revisar e aprovar o plano.',
          'Como gestor, você precisa revisar e aprovar este PDI. Por favor, acesse o sistema para avaliar o plano de desenvolvimento.'
        ),
        text: text.replace(
          'O PDI está aguardando aprovação. Por favor, acesse o sistema para revisar e aprovar o plano.',
          'Como gestor, você precisa revisar e aprovar este PDI. Por favor, acesse o sistema para avaliar o plano de desenvolvimento.'
        ),
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar email de PDI importado:', error);
    return false;
  }
}

interface PDIApprovalNotification {
  employeeName: string;
  employeeEmail?: string;
  approverName: string;
  pdiId: number;
  status: 'approved' | 'rejected';
  comments?: string;
}

/**
 * Enviar email quando PDI for aprovado ou rejeitado
 */
export async function sendPDIApprovalEmail(data: PDIApprovalNotification): Promise<boolean> {
  try {
    const isApproved = data.status === 'approved';
    const subject = `PDI ${isApproved ? 'Aprovado' : 'Rejeitado'} - ${data.employeeName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${isApproved ? '#65B32E' : '#F58220'}; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${isApproved ? '#65B32E' : '#F58220'}; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #002D62; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PDI ${isApproved ? 'Aprovado' : 'Rejeitado'}</h1>
          </div>
          <div class="content">
            <p>Olá ${data.employeeName},</p>
            <p>Seu Plano de Desenvolvimento Individual (PDI) foi ${isApproved ? 'aprovado' : 'rejeitado'} por ${data.approverName}.</p>
            
            ${data.comments ? `
            <div class="info-box">
              <h3>Comentários do Aprovador</h3>
              <p>${data.comments}</p>
            </div>
            ` : ''}
            
            ${isApproved ? `
            <p>Parabéns! Agora você pode começar a trabalhar nas ações de desenvolvimento definidas no seu PDI.</p>
            ` : `
            <p>Por favor, revise o PDI e faça os ajustes necessários conforme os comentários acima.</p>
            `}
            
            <a href="${process.env.VITE_APP_URL || 'https://avd-uisa.manus.space'}/pdi/${data.pdiId}" class="button">
              Visualizar PDI
            </a>
          </div>
          <div class="footer">
            <p>Sistema AVD UISA - Avaliação de Desempenho</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
PDI ${isApproved ? 'Aprovado' : 'Rejeitado'}

Olá ${data.employeeName},

Seu Plano de Desenvolvimento Individual (PDI) foi ${isApproved ? 'aprovado' : 'rejeitado'} por ${data.approverName}.

${data.comments ? `Comentários do Aprovador:\n${data.comments}\n\n` : ''}

${isApproved 
  ? 'Parabéns! Agora você pode começar a trabalhar nas ações de desenvolvimento definidas no seu PDI.' 
  : 'Por favor, revise o PDI e faça os ajustes necessários conforme os comentários acima.'}

Acesse: ${process.env.VITE_APP_URL || 'https://avd-uisa.manus.space'}/pdi/${data.pdiId}

---
Sistema AVD UISA - Avaliação de Desempenho
Este é um email automático, por favor não responda.
    `;

    if (data.employeeEmail) {
      await sendEmail({
        to: data.employeeEmail,
        subject,
        html,
        text,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar email de aprovação de PDI:', error);
    return false;
  }
}
