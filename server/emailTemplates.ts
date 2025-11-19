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
