/**
 * Templates de E-mail para Sistema AVD UISA
 * Fornece templates HTML profissionais para notificações do sistema
 */

export interface EmailTemplateData {
  recipientName: string;
  [key: string]: any;
}

/**
 * Template base com layout responsivo e branding UISA
 */
function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #f97316;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #ea580c;
    }
    .info-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid: #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Sistema AVD UISA</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Sistema AVD UISA</strong></p>
      <p>Avaliação de Desempenho e Desenvolvimento Profissional</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Este é um e-mail automático. Por favor, não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template: Nova Meta Atribuída
 */
export function newGoalTemplate(data: {
  recipientName: string;
  goalTitle: string;
  goalDescription: string;
  deadline: string;
  assignedBy: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Uma nova meta foi atribuída a você:</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0; color: #92400e;">${data.goalTitle}</h3>
      <p style="color: #78350f; margin-bottom: 0;">${data.goalDescription}</p>
    </div>
    
    <p><strong>Prazo:</strong> ${data.deadline}</p>
    <p><strong>Atribuída por:</strong> ${data.assignedBy}</p>
    
    <p>Acesse o sistema para visualizar os detalhes completos e começar a trabalhar nesta meta.</p>
    
    <a href="${data.dashboardUrl}" class="button">Acessar Minha Meta</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Dica:</strong> Defina marcos intermediários para acompanhar seu progresso e mantenha evidências do seu trabalho.
    </p>
  `;

  return {
    subject: `🎯 Nova Meta: ${data.goalTitle}`,
    html: baseTemplate("Nova Meta Atribuída", content),
  };
}

/**
 * Template: Resultado de Avaliação de Performance
 */
export function performanceResultTemplate(data: {
  recipientName: string;
  evaluationPeriod: string;
  overallScore: number;
  performanceLevel: string;
  strengths: string[];
  improvements: string[];
  evaluatorName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const strengthsList = data.strengths.map(s => `<li>${s}</li>`).join('');
  const improvementsList = data.improvements.map(i => `<li>${i}</li>`).join('');

  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Sua avaliação de desempenho referente ao período <strong>${data.evaluationPeriod}</strong> foi concluída.</p>
    
    <div class="success-box">
      <h3 style="margin-top: 0; color: #065f46;">Resultado Geral</h3>
      <p style="font-size: 32px; font-weight: 700; color: #059669; margin: 10px 0;">
        ${data.overallScore}/100
      </p>
      <p style="color: #047857; margin-bottom: 0;">
        <strong>Nível de Performance:</strong> ${data.performanceLevel}
      </p>
    </div>
    
    <h3 style="color: #059669;">✅ Pontos Fortes</h3>
    <ul style="color: #4b5563; line-height: 1.8;">
      ${strengthsList}
    </ul>
    
    <h3 style="color: #f59e0b;">📈 Oportunidades de Melhoria</h3>
    <ul style="color: #4b5563; line-height: 1.8;">
      ${improvementsList}
    </ul>
    
    <p><strong>Avaliado por:</strong> ${data.evaluatorName}</p>
    
    <p>Acesse o sistema para visualizar o feedback completo e discutir seu Plano de Desenvolvimento Individual (PDI).</p>
    
    <a href="${data.dashboardUrl}" class="button">Ver Avaliação Completa</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Próximos Passos:</strong> Agende uma reunião com seu gestor para discutir seu PDI e definir ações de desenvolvimento.
    </p>
  `;

  return {
    subject: `📊 Resultado da Avaliação de Desempenho - ${data.evaluationPeriod}`,
    html: baseTemplate("Resultado de Avaliação", content),
  };
}

/**
 * Template: Lembrete de Meta Próxima do Prazo
 */
export function goalDeadlineReminderTemplate(data: {
  recipientName: string;
  goalTitle: string;
  deadline: string;
  daysRemaining: number;
  currentProgress: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const urgencyClass = data.daysRemaining <= 3 ? 'info-box' : 'info-box';
  
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Este é um lembrete sobre a meta que está próxima do prazo:</p>
    
    <div class="${urgencyClass}">
      <h3 style="margin-top: 0;">${data.goalTitle}</h3>
      <p><strong>Prazo:</strong> ${data.deadline}</p>
      <p><strong>Tempo restante:</strong> ${data.daysRemaining} ${data.daysRemaining === 1 ? 'dia' : 'dias'}</p>
      <p><strong>Progresso atual:</strong> ${data.currentProgress}%</p>
    </div>
    
    <p>Certifique-se de concluir todas as atividades e adicionar evidências antes do prazo final.</p>
    
    <a href="${data.dashboardUrl}" class="button">Atualizar Progresso</a>
  `;

  return {
    subject: `⏰ Lembrete: Meta "${data.goalTitle}" - ${data.daysRemaining} ${data.daysRemaining === 1 ? 'dia' : 'dias'} restantes`,
    html: baseTemplate("Lembrete de Meta", content),
  };
}

/**
 * Template: PDI Criado
 */
export function pdiCreatedTemplate(data: {
  recipientName: string;
  pdiTitle: string;
  targetPosition: string;
  duration: string;
  actionsCount: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Seu Plano de Desenvolvimento Individual (PDI) foi criado com sucesso!</p>
    
    <div class="success-box">
      <h3 style="margin-top: 0; color: #065f46;">${data.pdiTitle}</h3>
      <p style="color: #047857;"><strong>Posição-alvo:</strong> ${data.targetPosition}</p>
      <p style="color: #047857;"><strong>Duração:</strong> ${data.duration}</p>
      <p style="color: #047857; margin-bottom: 0;"><strong>Ações de desenvolvimento:</strong> ${data.actionsCount}</p>
    </div>
    
    <p>Seu PDI contém ações estruturadas seguindo o modelo 70-20-10 para acelerar seu desenvolvimento profissional.</p>
    
    <a href="${data.dashboardUrl}" class="button">Acessar Meu PDI</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Lembre-se:</strong> O desenvolvimento é uma jornada contínua. Revise seu PDI regularmente e celebre cada conquista!
    </p>
  `;

  return {
    subject: `🚀 Seu PDI foi criado: ${data.pdiTitle}`,
    html: baseTemplate("PDI Criado", content),
  };
}

/**
 * Template: Período Avaliativo Iniciado
 */
export function periodStartedTemplate(data: {
  recipientName: string;
  periodName: string;
  startDate: string;
  endDate: string;
  description?: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Um novo período de avaliação de desempenho foi iniciado e você está incluído(a) neste processo.</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0; color: #92400e;">📅 ${data.periodName}</h3>
      <p style="color: #78350f;"><strong>Início:</strong> ${data.startDate}</p>
      <p style="color: #78350f;"><strong>Término:</strong> ${data.endDate}</p>
      ${data.description ? `<p style="color: #78350f; margin-bottom: 0;">${data.description}</p>` : ''}
    </div>
    
    <p>Você receberá notificações adicionais quando for necessário realizar sua autoavaliação.</p>
    
    <a href="${data.dashboardUrl}" class="button">Acessar Sistema</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Dica:</strong> Prepare-se revisando suas metas e conquistas do período.
    </p>
  `;

  return {
    subject: `📅 Novo Período Avaliativo: ${data.periodName}`,
    html: baseTemplate("Período Avaliativo Iniciado", content),
  };
}

/**
 * Template: Lembrete de Autoavaliação Pendente
 */
export function selfEvaluationReminderTemplate(data: {
  recipientName: string;
  periodName: string;
  deadline: string;
  daysRemaining: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const isUrgent = data.daysRemaining <= 3;
  const boxClass = isUrgent ? 'info-box' : 'info-box';
  const emoji = isUrgent ? '⚠️' : '⏰';

  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Este é um lembrete sobre sua autoavaliação pendente no período <strong>${data.periodName}</strong>.</p>
    
    <div class="${boxClass}">
      <p style="margin: 0;"><strong>${emoji} Prazo Final:</strong> ${data.deadline}</p>
      <p style="margin: 8px 0 0 0;"><strong>Tempo Restante:</strong> ${data.daysRemaining} ${data.daysRemaining === 1 ? 'dia' : 'dias'}</p>
    </div>
    
    ${isUrgent ? `
    <p style="color: #dc2626; font-weight: 600;">
      ⚠️ Atenção: O prazo está próximo! Complete sua autoavaliação o quanto antes.
    </p>
    ` : `
    <p>Por favor, reserve um tempo para refletir sobre seu desempenho e preencher sua autoavaliação.</p>
    `}
    
    <a href="${data.dashboardUrl}" class="button">Preencher Autoavaliação</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Lembre-se:</strong> A autoavaliação é uma oportunidade de reflexão sobre suas conquistas e áreas de desenvolvimento.
    </p>
  `;

  return {
    subject: `${emoji} Lembrete: Autoavaliação Pendente - ${data.periodName}`,
    html: baseTemplate("Lembrete de Autoavaliação", content),
  };
}

/**
 * Template: Notificação para Supervisor Avaliar
 */
export function supervisorEvaluationTemplate(data: {
  recipientName: string;
  employeeName: string;
  periodName: string;
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Você precisa avaliar o desempenho de um colaborador da sua equipe.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>👤 Colaborador:</strong> ${data.employeeName}</p>
      <p style="margin: 8px 0;"><strong>📅 Período:</strong> ${data.periodName}</p>
      <p style="margin: 0;"><strong>⏰ Prazo Final:</strong> ${data.deadline}</p>
    </div>
    
    <p>O colaborador já concluiu sua autoavaliação. Agora é sua vez de avaliar o desempenho dele(a) durante este período.</p>
    
    <a href="${data.dashboardUrl}" class="button">Avaliar Colaborador</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Dica:</strong> Revise as metas estabelecidas e as entregas realizadas antes de avaliar.
    </p>
  `;

  return {
    subject: `👤 Avaliação Pendente: ${data.employeeName} - ${data.periodName}`,
    html: baseTemplate("Avaliação de Colaborador", content),
  };
}

/**
 * Template: Confirmação de Avaliação Concluída
 */
export function evaluationCompletedTemplate(data: {
  recipientName: string;
  periodName: string;
  evaluationType: 'autoavaliacao' | 'supervisor';
  submissionDate: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const typeText = data.evaluationType === 'autoavaliacao' ? 'Autoavaliação' : 'Avaliação de Supervisor';

  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Sua ${typeText.toLowerCase()} foi recebida e registrada no sistema.</p>
    
    <div class="success-box">
      <p style="margin: 0;"><strong>✅ Status:</strong> Concluída</p>
      <p style="margin: 8px 0;"><strong>📅 Período:</strong> ${data.periodName}</p>
      <p style="margin: 0;"><strong>🕐 Data de Envio:</strong> ${data.submissionDate}</p>
    </div>
    
    ${data.evaluationType === 'autoavaliacao' ? `
    <p>Agora sua avaliação será analisada por seu supervisor. Você receberá uma notificação quando o processo estiver completo.</p>
    ` : `
    <p>A avaliação foi registrada e o colaborador será notificado sobre a conclusão do processo.</p>
    `}
    
    <a href="${data.dashboardUrl}" class="button">Ver Detalhes</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Obrigado por participar do processo de avaliação de desempenho!
    </p>
  `;

  return {
    subject: `✅ ${typeText} Concluída - ${data.periodName}`,
    html: baseTemplate("Avaliação Concluída", content),
  };
}

/**
 * Template: Resultado Final da Avaliação
 */
export function finalResultTemplate(data: {
  recipientName: string;
  periodName: string;
  selfScore: number;
  supervisorScore: number;
  finalScore: number;
  supervisorComments?: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <p>Sua avaliação de desempenho foi concluída. Confira os resultados abaixo:</p>
    
    <div class="success-box">
      <h3 style="margin-top: 0; color: #065f46;">🎯 Resultado da Avaliação</h3>
      <p style="color: #047857; margin: 8px 0;"><strong>📅 Período:</strong> ${data.periodName}</p>
      <p style="color: #047857; margin: 8px 0;"><strong>📊 Sua Autoavaliação:</strong> ${data.selfScore.toFixed(2)}</p>
      <p style="color: #047857; margin: 8px 0;"><strong>👤 Avaliação do Supervisor:</strong> ${data.supervisorScore.toFixed(2)}</p>
      <p style="font-size: 24px; font-weight: 700; color: #059669; margin: 16px 0 0 0;">
        <strong>🏆 Nota Final:</strong> ${data.finalScore.toFixed(2)}
      </p>
    </div>
    
    ${data.supervisorComments ? `
    <div class="info-box">
      <h4 style="margin-top: 0; color: #92400e;">💬 Comentários do Supervisor:</h4>
      <p style="color: #78350f; margin-bottom: 0;">${data.supervisorComments}</p>
    </div>
    ` : ''}
    
    <p>Acesse o sistema para ver os detalhes completos da sua avaliação e discutir os próximos passos com seu supervisor.</p>
    
    <a href="${data.dashboardUrl}" class="button">Ver Avaliação Completa</a>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      💡 <strong>Próximos Passos:</strong> Agende uma reunião com seu supervisor para discutir seu desenvolvimento profissional.
    </p>
  `;

  return {
    subject: `🎯 Resultado da Avaliação - ${data.periodName}`,
    html: baseTemplate("Resultado da Avaliação", content),
  };
}

/**
 * Template: Notificação Genérica
 */
export function genericNotificationTemplate(data: {
  recipientName: string;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}): { subject: string; html: string } {
  const content = `
    <h2>👋 Olá, ${data.recipientName}!</h2>
    <h3 style="color: #1f2937;">${data.title}</h3>
    <p>${data.message}</p>
    
    ${data.actionText && data.actionUrl ? `
    <a href="${data.actionUrl}" class="button">${data.actionText}</a>
    ` : ''}
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Sistema AVD UISA - Avaliação de Desempenho
    </p>
  `;

  return {
    subject: `🔔 ${data.title}`,
    html: baseTemplate(data.title, content),
  };
}
