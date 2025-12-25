/**
 * Templates de Email para Notificações de Resultados
 * Envia resultados de avaliações automaticamente após conclusão
 */

export interface ResultEmailData {
  employeeName: string;
  assessmentType: string;
  score: number;
  completedDate: string;
  resultUrl: string;
  highlights?: string[];
  recommendations?: string[];
}

export function generateResultNotificationEmail(data: ResultEmailData): string {
  const {
    employeeName,
    assessmentType,
    score,
    completedDate,
    resultUrl,
    highlights = [],
    recommendations = [],
  } = data;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resultados da Avaliação</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #F39200;
    }
    .header h1 {
      color: #F39200;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 20px 0;
    }
    .score-box {
      background: linear-gradient(135deg, #F39200 0%, #ff9f1a 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .score-box .score {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-box .label {
      font-size: 14px;
      opacity: 0.9;
    }
    .section {
      margin: 20px 0;
    }
    .section h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 10px;
      border-left: 4px solid #F39200;
      padding-left: 10px;
    }
    .highlight-list, .recommendation-list {
      list-style: none;
      padding: 0;
    }
    .highlight-list li, .recommendation-list li {
      padding: 10px;
      margin: 5px 0;
      background-color: #f8f9fa;
      border-left: 3px solid #F39200;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background-color: #F39200;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #d97f00;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Resultados da Avaliação</h1>
    </div>
    
    <div class="content">
      <p>Olá, <strong>${employeeName}</strong>!</p>
      
      <p>Sua avaliação de <strong>${assessmentType}</strong> foi concluída com sucesso. Confira abaixo um resumo dos seus resultados:</p>
      
      <div class="score-box">
        <div class="label">Pontuação Geral</div>
        <div class="score">${score}</div>
        <div class="label">de 100 pontos</div>
      </div>
      
      <div class="info-row">
        <span class="info-label">Tipo de Avaliação:</span>
        <span>${assessmentType}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data de Conclusão:</span>
        <span>${completedDate}</span>
      </div>
      
      ${highlights.length > 0 ? `
      <div class="section">
        <h2>✨ Destaques</h2>
        <ul class="highlight-list">
          ${highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${recommendations.length > 0 ? `
      <div class="section">
        <h2>💡 Recomendações</h2>
        <ul class="recommendation-list">
          ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${resultUrl}" class="cta-button">
          Ver Resultados Completos
        </a>
      </div>
      
      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        Clique no botão acima para acessar o relatório detalhado com gráficos, análises e recomendações personalizadas.
      </p>
    </div>
    
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA.</p>
      <p>Para dúvidas ou suporte, entre em contato com o RH.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateWeeklyProgressEmail(data: {
  employeeName: string;
  weeklyStats: {
    completedAssessments: number;
    averageScore: number;
    improvement: number;
  };
  dashboardUrl: string;
}): string {
  const { employeeName, weeklyStats, dashboardUrl } = data;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal de Progresso</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #F39200;
    }
    .header h1 {
      color: #F39200;
      margin: 0;
      font-size: 28px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #F39200;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #F39200;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .cta-button {
      display: inline-block;
      background-color: #F39200;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal</h1>
    </div>
    
    <div class="content">
      <p>Olá, <strong>${employeeName}</strong>!</p>
      
      <p>Aqui está o resumo do seu progresso esta semana:</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Avaliações</div>
          <div class="stat-value">${weeklyStats.completedAssessments}</div>
          <div class="stat-label">Concluídas</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Pontuação</div>
          <div class="stat-value">${weeklyStats.averageScore}</div>
          <div class="stat-label">Média</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Melhoria</div>
          <div class="stat-value">${weeklyStats.improvement > 0 ? '+' : ''}${weeklyStats.improvement}</div>
          <div class="stat-label">Pontos</div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">
          Ver Dashboard Completo
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA.</p>
    </div>
  </div>
</body>
</html>
  `;
}
