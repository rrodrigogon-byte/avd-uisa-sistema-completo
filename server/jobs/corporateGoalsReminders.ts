import { getDb } from '../db';
import { smartGoals, employees, notifications } from '../../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';
import { emailService } from '../utils/emailService';

/**
 * Job de Lembretes de Metas Corporativas Sem Progresso
 * Envia lembretes para funcionários que não atualizaram progresso de metas corporativas há mais de 7 dias
 */
export async function sendCorporateGoalsReminders() {
  console.log('[CorporateGoalsReminders] Iniciando verificação de metas corporativas...');
  
  const db = await getDb();
  if (!db) {
    console.error('[CorporateGoalsReminders] Database not available');
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Buscar metas corporativas ativas sem atualização há 7+ dias
    const staleGoals = await db.select()
      .from(smartGoals)
      .innerJoin(employees, eq(smartGoals.employeeId, employees.id))
      .where(
        and(
          eq(smartGoals.goalType, 'corporate'),
          eq(smartGoals.status, 'in_progress'),
          lt(smartGoals.updatedAt, sevenDaysAgo)
        )
      );

    console.log(`[CorporateGoalsReminders] ${staleGoals.length} metas corporativas sem progresso há 7+ dias`);

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const goal of staleGoals) {
      const employee = goal.employees;
      
      if (!employee.email) continue;

      const daysWithoutUpdate = Math.floor((new Date().getTime() - goal.smartGoals.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const progress = parseFloat(goal.smartGoals.currentValue || "0") || 0;
      const target = parseFloat(goal.smartGoals.targetValue || "100") || 100;
      const progressPercent = Math.round((progress / target) * 100);

      // Enviar email de lembrete
      try {
        await emailService.sendCustomEmail(
          employee.email,
          `Lembrete: Atualizar Progresso da Meta Corporativa "${goal.smartGoals.title}"`,
          `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #F39200; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
    .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .progress-bar { background-color: #e0e0e0; border-radius: 10px; height: 30px; margin: 15px 0; }
    .progress-fill { background-color: #F39200; height: 100%; border-radius: 10px; text-align: center; line-height: 30px; color: white; font-weight: bold; }
    .button { display: inline-block; padding: 12px 30px; background-color: #F39200; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Lembrete de Meta Corporativa</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${employee.name}</strong>!</p>
      
      <div class="alert">
        <strong>⏰ Atenção:</strong> Faz <strong>${daysWithoutUpdate} dias</strong> que você não atualiza o progresso da meta corporativa abaixo.
      </div>

      <p><strong>Meta:</strong> ${goal.smartGoals.title}</p>
      <p><strong>Descrição:</strong> ${goal.smartGoals.description || 'Não informada'}</p>

      <p><strong>Progresso Atual:</strong></p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercent}%">${progressPercent}%</div>
      </div>

      <p><strong>Detalhes:</strong></p>
      <ul>
        <li><strong>Valor Atual:</strong> ${progress}</li>
        <li><strong>Meta:</strong> ${target}</li>
        <li><strong>Prazo:</strong> ${goal.smartGoals.endDate.toLocaleDateString('pt-BR')}</li>
        <li><strong>Categoria:</strong> ${goal.smartGoals.category || 'Não informada'}</li>
      </ul>

      <p>Por favor, acesse o sistema e atualize o progresso da sua meta para mantermos o acompanhamento em dia.</p>

      <a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://3000-i58so038s6oxj3hgv9pq5-dd7bd28d.manusvm.computer'}/metas/${goal.smartGoals.id}/progresso" class="button">
        Atualizar Progresso
      </a>
    </div>
    <div class="footer">
      <p>Sistema AVD UISA - Avaliação de Desempenho</p>
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
          `
        );
        emailsSent++;
      } catch (emailError) {
        console.error(`[CorporateGoalsReminders] Erro ao enviar email para ${employee.email}:`, emailError);
      }

      // Criar notificação in-app
      if (employee.userId) {
        try {
          await db.insert(notifications).values({
            userId: employee.userId,
            type: 'goal_reminder',
            title: `Lembrete: Atualizar Meta Corporativa`,
            message: `Faz ${daysWithoutUpdate} dias que você não atualiza o progresso da meta "${goal.smartGoals.title}". Progresso atual: ${progressPercent}%`,
            link: `/metas/${goal.smartGoals.id}/progresso`,
            read: false,
          });
          notificationsCreated++;
        } catch (notifError) {
          console.error(`[CorporateGoalsReminders] Erro ao criar notificação:`, notifError);
        }
      }
    }

    console.log(`[CorporateGoalsReminders] ✅ Concluído: ${emailsSent} emails enviados, ${notificationsCreated} notificações criadas`);
    
    return {
      success: true,
      emailsSent,
      notificationsCreated,
      totalStale: staleGoals.length,
    };
  } catch (error) {
    console.error('[CorporateGoalsReminders] Erro ao processar lembretes:', error);
    return { success: false, error: String(error) };
  }
}
