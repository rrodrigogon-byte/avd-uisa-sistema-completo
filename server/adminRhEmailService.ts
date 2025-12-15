/**
 * Serviço de Notificação por Email para Administradores e RH
 * Envia emails automáticos sobre eventos importantes do sistema
 */

import { sendEmail } from './emailService';
import { getDb } from './db';
import { users, employees } from '../drizzle/schema';
import { eq, or, inArray } from 'drizzle-orm';

interface EmailNotificationOptions {
  subject: string;
  title: string;
  message: string;
  details?: Array<{ label: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Busca emails de todos os administradores e RH
 */
async function getAdminAndRhEmails(): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[AdminRhEmail] Database not available');
      return [];
    }

    const adminRhUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'rh')));

    const emails = adminRhUsers
      .map(u => u.email)
      .filter((email): email is string => !!email);

    return emails;
  } catch (error) {
    console.error('[AdminRhEmail] Failed to get admin/rh emails:', error);
    return [];
  }
}

/**
 * Gera HTML do email com template profissional
 */
function generateEmailHtml(options: EmailNotificationOptions): string {
  const { title, message, details, actionUrl, actionLabel, priority } = options;
  
  const priorityColors = {
    low: '#3b82f6',
    normal: '#10b981',
    high: '#ef4444',
  };
  
  const priorityColor = priorityColors[priority || 'normal'];
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              ${details && details.length > 0 ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                ${details.map(detail => `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 500; width: 40%;">
                    ${detail.label}
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600;">
                    ${detail.value}
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              
              ${actionUrl && actionLabel ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${priorityColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
                      ${actionLabel}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Este é um email automático do <strong>Sistema AVD UISA</strong>.<br>
                Você está recebendo esta notificação porque é administrador ou membro do RH.
              </p>
              <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Sistema AVD UISA. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envia notificação por email para todos os administradores e RH
 */
export async function notifyAdminAndRh(options: EmailNotificationOptions): Promise<boolean> {
  try {
    const emails = await getAdminAndRhEmails();
    
    if (emails.length === 0) {
      console.warn('[AdminRhEmail] No admin/rh emails found');
      return false;
    }

    const html = generateEmailHtml(options);
    
    // Enviar para todos os emails
    const results = await Promise.allSettled(
      emails.map(email => 
        sendEmail({
          to: email,
          subject: options.subject,
          html,
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failCount = results.length - successCount;

    console.log(`[AdminRhEmail] Sent ${successCount}/${emails.length} emails (${failCount} failed)`);

    return successCount > 0;
  } catch (error) {
    console.error('[AdminRhEmail] Failed to notify admin/rh:', error);
    return false;
  }
}

/**
 * Notificação: Novo usuário criado
 */
export async function notifyNewUser(userName: string, userEmail: string, userRole: string) {
  return notifyAdminAndRh({
    subject: '🆕 Novo usuário criado no sistema',
    title: 'Novo Usuário Criado',
    message: 'Um novo usuário foi cadastrado no Sistema AVD UISA.',
    details: [
      { label: 'Nome', value: userName },
      { label: 'Email', value: userEmail },
      { label: 'Perfil', value: userRole },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: 'normal',
  });
}

/**
 * Notificação: Novo funcionário cadastrado
 */
export async function notifyNewEmployee(employeeName: string, employeeCode: string, department: string) {
  return notifyAdminAndRh({
    subject: '👤 Novo funcionário cadastrado',
    title: 'Novo Funcionário Cadastrado',
    message: 'Um novo funcionário foi adicionado ao sistema.',
    details: [
      { label: 'Nome', value: employeeName },
      { label: 'Código', value: employeeCode },
      { label: 'Departamento', value: department },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: 'normal',
  });
}

/**
 * Notificação: Novo ciclo de avaliação iniciado
 */
export async function notifyNewEvaluationCycle(cycleName: string, startDate: Date, endDate: Date, participantsCount: number) {
  return notifyAdminAndRh({
    subject: '🔄 Novo ciclo de avaliação iniciado',
    title: 'Novo Ciclo de Avaliação',
    message: 'Um novo ciclo de avaliação foi iniciado no sistema.',
    details: [
      { label: 'Nome do Ciclo', value: cycleName },
      { label: 'Data de Início', value: startDate.toLocaleDateString('pt-BR') },
      { label: 'Data de Término', value: endDate.toLocaleDateString('pt-BR') },
      { label: 'Participantes', value: participantsCount.toString() },
    ],
    priority: 'high',
  });
}

/**
 * Notificação: Avaliação 360° concluída
 */
export async function notifyEvaluation360Completed(employeeName: string, evaluationType: string, score: number) {
  return notifyAdminAndRh({
    subject: '✅ Avaliação 360° concluída',
    title: 'Avaliação 360° Concluída',
    message: 'Uma avaliação 360° foi finalizada.',
    details: [
      { label: 'Funcionário', value: employeeName },
      { label: 'Tipo', value: evaluationType },
      { label: 'Pontuação', value: `${score.toFixed(1)}/10` },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: 'normal',
  });
}

/**
 * Notificação: Meta SMART criada ou atualizada
 */
export async function notifySmartGoalActivity(action: 'criada' | 'atualizada', goalTitle: string, employeeName: string, status: string) {
  return notifyAdminAndRh({
    subject: `🎯 Meta ${action}`,
    title: `Meta SMART ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: `Uma meta SMART foi ${action} no sistema.`,
    details: [
      { label: 'Título da Meta', value: goalTitle },
      { label: 'Funcionário', value: employeeName },
      { label: 'Status', value: status },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: 'normal',
  });
}

/**
 * Notificação: PDI criado ou concluído
 */
export async function notifyPdiActivity(action: 'criado' | 'concluído', employeeName: string, pdiTitle: string, progress: number) {
  return notifyAdminAndRh({
    subject: `📚 PDI ${action}`,
    title: `PDI ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: `Um Plano de Desenvolvimento Individual foi ${action}.`,
    details: [
      { label: 'Funcionário', value: employeeName },
      { label: 'Título do PDI', value: pdiTitle },
      { label: 'Progresso', value: `${progress}%` },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: action === 'concluído' ? 'high' : 'normal',
  });
}

/**
 * Notificação: Mudança na Nine Box
 */
export async function notifyNineBoxChange(employeeName: string, oldPosition: string, newPosition: string) {
  return notifyAdminAndRh({
    subject: '📊 Mudança na Nine Box',
    title: 'Atualização na Nine Box',
    message: 'A posição de um funcionário foi alterada na matriz Nine Box.',
    details: [
      { label: 'Funcionário', value: employeeName },
      { label: 'Posição Anterior', value: oldPosition },
      { label: 'Nova Posição', value: newPosition },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: 'high',
  });
}

/**
 * Notificação: Alerta de segurança
 */
export async function notifySecurityAlert(alertType: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  const priorityMap = {
    low: 'low' as const,
    medium: 'normal' as const,
    high: 'high' as const,
    critical: 'high' as const,
  };

  return notifyAdminAndRh({
    subject: '🔒 Alerta de Segurança',
    title: 'Alerta de Segurança',
    message: 'Um evento de segurança foi detectado no sistema.',
    details: [
      { label: 'Tipo de Alerta', value: alertType },
      { label: 'Descrição', value: description },
      { label: 'Severidade', value: severity.toUpperCase() },
      { label: 'Data', value: new Date().toLocaleString('pt-BR') },
    ],
    priority: priorityMap[severity],
  });
}

/**
 * Notificação: Resumo diário de atividades
 */
export async function notifyDailySummary(stats: {
  newUsers: number;
  newEmployees: number;
  completedEvaluations: number;
  newGoals: number;
  completedPdis: number;
}) {
  return notifyAdminAndRh({
    subject: '📊 Resumo Diário - Sistema AVD UISA',
    title: 'Resumo Diário de Atividades',
    message: 'Confira o resumo das atividades do dia no Sistema AVD UISA.',
    details: [
      { label: 'Novos Usuários', value: stats.newUsers.toString() },
      { label: 'Novos Funcionários', value: stats.newEmployees.toString() },
      { label: 'Avaliações Concluídas', value: stats.completedEvaluations.toString() },
      { label: 'Metas Criadas', value: stats.newGoals.toString() },
      { label: 'PDIs Concluídos', value: stats.completedPdis.toString() },
      { label: 'Data', value: new Date().toLocaleDateString('pt-BR') },
    ],
    priority: 'low',
  });
}
