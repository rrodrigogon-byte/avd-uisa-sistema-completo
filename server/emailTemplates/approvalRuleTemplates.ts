/**
 * Templates de Email para Notificações de Regras de Aprovação
 * Sistema AVD UISA
 */

interface RuleData {
  approverName: string;
  ruleType: string;
  approvalContext: string;
  departmentName?: string;
  costCenterName?: string;
  employeeName?: string;
  approverLevel: number;
  createdByName: string;
  previousApproverName?: string;
  reason?: string;
}

const getRuleTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    departamento: "Departamento",
    centro_custo: "Centro de Custo",
    individual: "Individual",
  };
  return labels[type] || type;
};

const getContextLabel = (context: string): string => {
  const labels: Record<string, string> = {
    metas: "Metas",
    avaliacoes: "Avaliações",
    pdi: "PDI",
    descricao_cargo: "Descrição de Cargo",
    ciclo_360: "Ciclo 360°",
    bonus: "Bônus",
    promocao: "Promoção",
    todos: "Todos os Contextos",
  };
  return labels[context] || context;
};

const getVinculacaoLabel = (data: RuleData): string => {
  if (data.departmentName) return `Departamento: ${data.departmentName}`;
  if (data.costCenterName) return `Centro de Custo: ${data.costCenterName}`;
  if (data.employeeName) return `Funcionário: ${data.employeeName}`;
  return "Geral";
};

/**
 * Template de email para criação de regra
 */
export function ruleCreatedTemplate(data: RuleData): { subject: string; html: string } {
  const ruleTypeLabel = getRuleTypeLabel(data.ruleType);
  const contextLabel = getContextLabel(data.approvalContext);
  const vinculacaoLabel = getVinculacaoLabel(data);

  return {
    subject: `🔔 Você foi designado como aprovador - ${contextLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #1f2937; }
    .info-value { color: #4b5563; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nova Regra de Aprovação</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.approverName}</strong>,</p>
      
      <p>Você foi designado como aprovador no Sistema AVD UISA!</p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>📋 Detalhes da Regra de Aprovação</strong></p>
      </div>
      
      <div class="info-row">
        <span class="info-label">Contexto:</span>
        <span class="info-value"><strong>${contextLabel}</strong></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Tipo de Regra:</span>
        <span class="info-value">${ruleTypeLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vinculação:</span>
        <span class="info-value">${vinculacaoLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Nível de Aprovação:</span>
        <span class="info-value"><span class="badge">Nível ${data.approverLevel}</span></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Criado por:</span>
        <span class="info-value">${data.createdByName}</span>
      </div>
      
      <p style="margin-top: 24px;">
        <strong>O que isso significa?</strong><br>
        A partir de agora, você será responsável por aprovar ${contextLabel.toLowerCase()} relacionados a ${vinculacaoLabel.toLowerCase()}.
      </p>
      
      <p>
        Você receberá notificações automáticas sempre que houver itens pendentes de sua aprovação.
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/aprovacoes" class="button">
          Acessar Painel de Aprovações
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Sistema AVD UISA - Gestão de Desempenho e Talentos</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Template de email para edição de regra
 */
export function ruleUpdatedTemplate(data: RuleData): { subject: string; html: string } {
  const ruleTypeLabel = getRuleTypeLabel(data.ruleType);
  const contextLabel = getContextLabel(data.approvalContext);
  const vinculacaoLabel = getVinculacaoLabel(data);

  return {
    subject: `🔄 Sua regra de aprovação foi atualizada - ${contextLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #1f2937; }
    .info-value { color: #4b5563; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 Regra de Aprovação Atualizada</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.approverName}</strong>,</p>
      
      <p>Uma regra de aprovação na qual você está designado foi atualizada no Sistema AVD UISA.</p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>📋 Detalhes Atualizados</strong></p>
      </div>
      
      <div class="info-row">
        <span class="info-label">Contexto:</span>
        <span class="info-value"><strong>${contextLabel}</strong></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Tipo de Regra:</span>
        <span class="info-value">${ruleTypeLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vinculação:</span>
        <span class="info-value">${vinculacaoLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Nível de Aprovação:</span>
        <span class="info-value"><span class="badge">Nível ${data.approverLevel}</span></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Atualizado por:</span>
        <span class="info-value">${data.createdByName}</span>
      </div>
      
      <p style="margin-top: 24px;">
        <strong>O que mudou?</strong><br>
        As configurações da sua regra de aprovação foram atualizadas. Revise os detalhes acima para entender as mudanças.
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/admin/aprovadores" class="button">
          Ver Todas as Regras
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Sistema AVD UISA - Gestão de Desempenho e Talentos</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Template de email para exclusão de regra
 */
export function ruleDeletedTemplate(data: RuleData): { subject: string; html: string } {
  const ruleTypeLabel = getRuleTypeLabel(data.ruleType);
  const contextLabel = getContextLabel(data.approvalContext);
  const vinculacaoLabel = getVinculacaoLabel(data);

  return {
    subject: `❌ Regra de aprovação removida - ${contextLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #1f2937; }
    .info-value { color: #4b5563; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
    .button { display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Regra de Aprovação Removida</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.approverName}</strong>,</p>
      
      <p>Uma regra de aprovação na qual você estava designado foi removida do Sistema AVD UISA.</p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>📋 Regra Removida</strong></p>
      </div>
      
      <div class="info-row">
        <span class="info-label">Contexto:</span>
        <span class="info-value"><strong>${contextLabel}</strong></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Tipo de Regra:</span>
        <span class="info-value">${ruleTypeLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vinculação:</span>
        <span class="info-value">${vinculacaoLabel}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Removido por:</span>
        <span class="info-value">${data.createdByName}</span>
      </div>
      
      ${data.reason ? `
      <div class="info-row">
        <span class="info-label">Motivo:</span>
        <span class="info-value">${data.reason}</span>
      </div>
      ` : ''}
      
      <p style="margin-top: 24px;">
        <strong>O que isso significa?</strong><br>
        Você não é mais responsável por aprovar ${contextLabel.toLowerCase()} relacionados a ${vinculacaoLabel.toLowerCase()}.
      </p>
      
      <p>
        Se você acredita que isso foi um erro, entre em contato com o administrador do sistema.
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/admin/aprovadores" class="button">
          Ver Regras Ativas
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Sistema AVD UISA - Gestão de Desempenho e Talentos</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
