/**
 * Helper Centralizado de Email com CC Automático
 * Sistema AVD UISA
 * 
 * IMPORTANTE: Todos os emails enviados pelo sistema SEMPRE copiam rodrigo.goncalves@uisa.com.br
 * 
 * @version 1.0
 * @author Sistema AVD UISA
 */

import { sendEmail as baseSendEmail } from '../emailService';

/**
 * Email do gestor que SEMPRE receberá cópia de todos os emails
 * Este valor é fixo e não deve ser alterado
 */
const ALWAYS_CC_EMAIL = 'rodrigo.goncalves@uisa.com.br';

export interface EmailOptionsWithCC {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Envia email garantindo que rodrigo.goncalves@uisa.com.br sempre receba cópia
 * 
 * @param options Opções do email (to, subject, html, cc opcional, bcc opcional)
 * @returns Promise<boolean> true se enviado com sucesso
 * 
 * @example
 * ```typescript
 * await sendEmailWithCC({
 *   to: 'funcionario@uisa.com.br',
 *   subject: 'Nova Avaliação Disponível',
 *   html: '<p>Você tem uma nova avaliação...</p>'
 * });
 * // rodrigo.goncalves@uisa.com.br receberá cópia automaticamente
 * ```
 */
export async function sendEmailWithCC(options: EmailOptionsWithCC): Promise<boolean> {
  // Garantir que CC sempre inclua rodrigo.goncalves@uisa.com.br
  let ccList: string[] = [ALWAYS_CC_EMAIL];
  
  // Adicionar CCs adicionais se fornecidos
  if (options.cc) {
    const additionalCCs = Array.isArray(options.cc) ? options.cc : [options.cc];
    ccList = [...ccList, ...additionalCCs];
  }
  
  // Remover duplicatas
  ccList = Array.from(new Set(ccList));
  
  // Garantir que o destinatário principal não esteja no CC
  const toEmails = Array.isArray(options.to) ? options.to : [options.to];
  ccList = ccList.filter(cc => !toEmails.includes(cc));
  
  // Log para auditoria
  console.log(`[EmailWithCC] Enviando para: ${toEmails.join(', ')}`);
  console.log(`[EmailWithCC] CC: ${ccList.join(', ')}`);
  
  // Enviar email usando o serviço base
  // Nota: O emailService atual não suporta CC nativamente, então vamos adicionar ao destinatário
  // TODO: Atualizar emailService para suportar CC quando possível
  const allRecipients = [...toEmails, ...ccList];
  
  return await baseSendEmail({
    to: allRecipients.join(', '),
    subject: options.subject,
    html: options.html,
  });
}

/**
 * Templates de Email Profissionais
 */

export interface NovoCicloEmailData {
  employeeName: string;
  cycleName: string;
  cycleDescription: string;
  startDate: string;
  endDate: string;
  dashboardUrl: string;
}

export function createNovoCicloEmail(data: NovoCicloEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #F39200; margin: 0; font-size: 28px;">🎯 Novo Ciclo de Avaliação</h1>
    </div>
    
    <!-- Greeting -->
    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
      Olá, <strong>${data.employeeName}</strong>!
    </p>
    
    <!-- Main Content -->
    <div style="background-color: #f8f9fa; border-left: 4px solid #F39200; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #333333; font-size: 20px; margin-top: 0;">
        ${data.cycleName}
      </h2>
      <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
        ${data.cycleDescription}
      </p>
      
      <div style="margin-top: 20px;">
        <p style="margin: 5px 0; color: #666666;">
          <strong>📅 Início:</strong> ${data.startDate}
        </p>
        <p style="margin: 5px 0; color: #666666;">
          <strong>📅 Término:</strong> ${data.endDate}
        </p>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl}" 
         style="display: inline-block; background-color: #F39200; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
        Acessar Sistema
      </a>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Este é um email automático do Sistema AVD UISA
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Por favor, não responda a este email
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface AvaliacaoAtribuidaEmailData {
  employeeName: string;
  evaluatedName: string;
  evaluationType: string;
  cycleName: string;
  deadline: string;
  evaluationUrl: string;
}

export function createAvaliacaoAtribuidaEmail(data: AvaliacaoAtribuidaEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #F39200; margin: 0; font-size: 28px;">📝 Nova Avaliação Atribuída</h1>
    </div>
    
    <!-- Greeting -->
    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
      Olá, <strong>${data.employeeName}</strong>!
    </p>
    
    <!-- Main Content -->
    <div style="background-color: #f8f9fa; border-left: 4px solid #F39200; padding: 20px; margin-bottom: 25px;">
      <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
        Você foi designado(a) para realizar a <strong>${data.evaluationType}</strong> de:
      </p>
      
      <p style="font-size: 18px; color: #333333; margin: 15px 0;">
        <strong>${data.evaluatedName}</strong>
      </p>
      
      <div style="margin-top: 20px;">
        <p style="margin: 5px 0; color: #666666;">
          <strong>🎯 Ciclo:</strong> ${data.cycleName}
        </p>
        <p style="margin: 5px 0; color: #666666;">
          <strong>⏰ Prazo:</strong> ${data.deadline}
        </p>
      </div>
    </div>
    
    <!-- Alert Box -->
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⚠️ <strong>Atenção:</strong> Por favor, complete a avaliação dentro do prazo estabelecido.
      </p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.evaluationUrl}" 
         style="display: inline-block; background-color: #F39200; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
        Preencher Avaliação
      </a>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Este é um email automático do Sistema AVD UISA
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Por favor, não responda a este email
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface LembreteAvaliacaoEmailData {
  employeeName: string;
  evaluatedName: string;
  evaluationType: string;
  cycleName: string;
  deadline: string;
  daysRemaining: number;
  evaluationUrl: string;
}

export function createLembreteAvaliacaoEmail(data: LembreteAvaliacaoEmailData): string {
  const urgencyColor = data.daysRemaining <= 2 ? '#dc3545' : '#ffc107';
  const urgencyIcon = data.daysRemaining <= 2 ? '🚨' : '⏰';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: ${urgencyColor}; margin: 0; font-size: 28px;">
        ${urgencyIcon} Lembrete: Avaliação Pendente
      </h1>
    </div>
    
    <!-- Greeting -->
    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
      Olá, <strong>${data.employeeName}</strong>!
    </p>
    
    <!-- Main Content -->
    <div style="background-color: #f8f9fa; border-left: 4px solid ${urgencyColor}; padding: 20px; margin-bottom: 25px;">
      <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
        Este é um lembrete sobre a <strong>${data.evaluationType}</strong> pendente de:
      </p>
      
      <p style="font-size: 18px; color: #333333; margin: 15px 0;">
        <strong>${data.evaluatedName}</strong>
      </p>
      
      <div style="margin-top: 20px;">
        <p style="margin: 5px 0; color: #666666;">
          <strong>🎯 Ciclo:</strong> ${data.cycleName}
        </p>
        <p style="margin: 5px 0; color: #666666;">
          <strong>⏰ Prazo:</strong> ${data.deadline}
        </p>
        <p style="margin: 5px 0; color: ${urgencyColor}; font-size: 16px;">
          <strong>⚠️ Faltam ${data.daysRemaining} dia(s) para o prazo!</strong>
        </p>
      </div>
    </div>
    
    <!-- Alert Box -->
    <div style="background-color: ${data.daysRemaining <= 2 ? '#f8d7da' : '#fff3cd'}; border: 1px solid ${urgencyColor}; border-radius: 5px; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; color: ${data.daysRemaining <= 2 ? '#721c24' : '#856404'}; font-size: 14px;">
        ${urgencyIcon} <strong>Urgente:</strong> Por favor, complete a avaliação o quanto antes para evitar atrasos.
      </p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.evaluationUrl}" 
         style="display: inline-block; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
        Completar Agora
      </a>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Este é um email automático do Sistema AVD UISA
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Por favor, não responda a este email
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface AvaliacaoConcluidaEmailData {
  employeeName: string;
  evaluatedName: string;
  evaluationType: string;
  cycleName: string;
  completedDate: string;
  resultUrl: string;
}

export function createAvaliacaoConcluidaEmail(data: AvaliacaoConcluidaEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #28a745; margin: 0; font-size: 28px;">✅ Avaliação Concluída</h1>
    </div>
    
    <!-- Greeting -->
    <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
      Olá, <strong>${data.employeeName}</strong>!
    </p>
    
    <!-- Main Content -->
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px;">
      <p style="color: #155724; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
        A <strong>${data.evaluationType}</strong> de <strong>${data.evaluatedName}</strong> foi concluída com sucesso!
      </p>
      
      <div style="margin-top: 20px;">
        <p style="margin: 5px 0; color: #155724;">
          <strong>🎯 Ciclo:</strong> ${data.cycleName}
        </p>
        <p style="margin: 5px 0; color: #155724;">
          <strong>📅 Concluída em:</strong> ${data.completedDate}
        </p>
      </div>
    </div>
    
    <!-- Success Message -->
    <div style="text-align: center; margin: 25px 0;">
      <p style="font-size: 16px; color: #666666;">
        Obrigado por contribuir com o processo de avaliação de desempenho!
      </p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resultUrl}" 
         style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
        Ver Resultados
      </a>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Este é um email automático do Sistema AVD UISA
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        Por favor, não responda a este email
      </p>
      <p style="color: #999999; font-size: 13px; margin: 5px 0;">
        ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Exporta o email que sempre será copiado para referência
 */
export const RODRIGO_EMAIL = ALWAYS_CC_EMAIL;
