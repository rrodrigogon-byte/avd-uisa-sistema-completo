/**
 * Templates de Email para Sistema AVD UISA
 * Templates profissionais e responsivos para notificações do sistema
 */

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Template base para todos os emails
 */
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVD UISA</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AVD UISA</h1>
              <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Sistema de Avaliação de Desempenho</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                Este é um email automático do Sistema AVD UISA. Por favor, não responda a este email.
              </p>
              <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                © ${new Date().getFullYear()} AVD UISA. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Email de notificação quando um novo processo avaliativo inicia
 */
export function emailProcessoIniciado(data: {
  employeeName: string;
  processName: string;
  startDate: string;
  endDate: string;
  loginUrl: string;
}): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Novo Processo Avaliativo Iniciado</h2>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${data.employeeName}</strong>,
    </p>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Um novo processo avaliativo foi iniciado e você foi incluído(a) como participante.
    </p>
    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #212529; font-weight: 600;">Detalhes do Processo:</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Processo:</strong> ${data.processName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Início:</strong> ${data.startDate}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Término:</strong> ${data.endDate}</p>
    </div>
    <p style="margin: 20px 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Acesse o sistema para visualizar os detalhes e iniciar sua autoavaliação.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Acessar Sistema
      </a>
    </div>
  `;

  return {
    subject: `Novo Processo Avaliativo: ${data.processName}`,
    html: baseTemplate(content),
  };
}

/**
 * Email quando um avaliador é designado
 */
export function emailAvaliadorDesignado(data: {
  evaluatorName: string;
  evaluatedName: string;
  processName: string;
  dueDate: string;
  loginUrl: string;
}): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Você foi designado(a) como avaliador(a)</h2>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${data.evaluatorName}</strong>,
    </p>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Você foi designado(a) para avaliar <strong>${data.evaluatedName}</strong> no processo avaliativo.
    </p>
    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #212529; font-weight: 600;">Detalhes da Avaliação:</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Processo:</strong> ${data.processName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Avaliado:</strong> ${data.evaluatedName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Prazo:</strong> ${data.dueDate}</p>
    </div>
    <p style="margin: 20px 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Por favor, acesse o sistema para realizar a avaliação dentro do prazo estabelecido.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Realizar Avaliação
      </a>
    </div>
  `;

  return {
    subject: `Avaliação Pendente: ${data.evaluatedName}`,
    html: baseTemplate(content),
  };
}

/**
 * Email de lembrete para avaliação pendente
 */
export function emailLembreteAvaliacao(data: {
  evaluatorName: string;
  evaluatedName: string;
  processName: string;
  daysRemaining: number;
  dueDate: string;
  loginUrl: string;
}): EmailTemplate {
  const urgencyColor = data.daysRemaining <= 2 ? "#dc3545" : "#ffc107";
  const urgencyText = data.daysRemaining <= 2 ? "URGENTE" : "LEMBRETE";

  const content = `
    <div style="background-color: ${urgencyColor}; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
      <strong style="font-size: 14px;">${urgencyText}</strong>
    </div>
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Avaliação Pendente</h2>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${data.evaluatorName}</strong>,
    </p>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Este é um lembrete de que você tem uma avaliação pendente que precisa ser concluída.
    </p>
    <div style="background-color: #fff3cd; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #212529; font-weight: 600;">Detalhes da Avaliação:</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Processo:</strong> ${data.processName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Avaliado:</strong> ${data.evaluatedName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Prazo:</strong> ${data.dueDate}</p>
      <p style="margin: 10px 0 0 0; color: ${urgencyColor}; font-size: 16px; font-weight: 600;">
        Faltam apenas ${data.daysRemaining} ${data.daysRemaining === 1 ? "dia" : "dias"}!
      </p>
    </div>
    <p style="margin: 20px 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Por favor, acesse o sistema e complete a avaliação o quanto antes.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Completar Avaliação
      </a>
    </div>
  `;

  return {
    subject: `${urgencyText}: Avaliação Pendente - ${data.evaluatedName}`,
    html: baseTemplate(content),
  };
}

/**
 * Email quando todas as avaliações são concluídas
 */
export function emailAvaliacoesConcluidas(data: {
  employeeName: string;
  processName: string;
  totalEvaluations: number;
  loginUrl: string;
}): EmailTemplate {
  const content = `
    <div style="background-color: #28a745; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
      <strong style="font-size: 14px;">✓ PROCESSO CONCLUÍDO</strong>
    </div>
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Avaliações Concluídas</h2>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${data.employeeName}</strong>,
    </p>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Todas as avaliações do processo <strong>${data.processName}</strong> foram concluídas!
    </p>
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #212529; font-weight: 600;">Resumo:</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Processo:</strong> ${data.processName}</p>
      <p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Total de Avaliações:</strong> ${data.totalEvaluations}</p>
      <p style="margin: 10px 0 0 0; color: #28a745; font-size: 14px; font-weight: 600;">
        ✓ Status: Concluído
      </p>
    </div>
    <p style="margin: 20px 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Seus resultados estão sendo processados e estarão disponíveis em breve.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Acessar Sistema
      </a>
    </div>
  `;

  return {
    subject: `Avaliações Concluídas: ${data.processName}`,
    html: baseTemplate(content),
  };
}

/**
 * Email com resumo de resultados
 */
export function emailResumoResultados(data: {
  employeeName: string;
  processName: string;
  finalScore: number;
  selfScore?: number;
  managerScore?: number;
  peerScore?: number;
  resultsUrl: string;
}): EmailTemplate {
  const scoreColor = data.finalScore >= 4 ? "#28a745" : data.finalScore >= 3 ? "#ffc107" : "#dc3545";

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Seus Resultados Estão Disponíveis</h2>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${data.employeeName}</strong>,
    </p>
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Os resultados do processo <strong>${data.processName}</strong> já estão disponíveis para visualização.
    </p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">Pontuação Final</p>
      <p style="margin: 0; color: ${scoreColor}; font-size: 48px; font-weight: 700;">${data.finalScore.toFixed(1)}</p>
      <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">de 5.0</p>
    </div>
    ${
      data.selfScore || data.managerScore || data.peerScore
        ? `
    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #212529; font-weight: 600;">Resumo das Avaliações:</p>
      ${data.selfScore ? `<p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Autoavaliação:</strong> ${data.selfScore.toFixed(1)}</p>` : ""}
      ${data.managerScore ? `<p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Avaliação do Gestor:</strong> ${data.managerScore.toFixed(1)}</p>` : ""}
      ${data.peerScore ? `<p style="margin: 5px 0; color: #495057; font-size: 14px;"><strong>Média dos Pares:</strong> ${data.peerScore.toFixed(1)}</p>` : ""}
    </div>
    `
        : ""
    }
    <p style="margin: 20px 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Acesse o sistema para visualizar o relatório completo com análises detalhadas e feedback.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Ver Resultados Completos
      </a>
    </div>
  `;

  return {
    subject: `Resultados Disponíveis: ${data.processName}`,
    html: baseTemplate(content),
  };
}
