import { getDb } from '../db';
import { performanceEvaluations, employees, notifications } from '../../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';
import { emailService } from '../utils/emailService';

/**
 * Job de Lembretes de Consenso Pendente
 * Envia lembretes para líderes que têm avaliações 360° aguardando consenso há mais de 3 dias
 */
export async function sendConsensusReminders() {
  console.log('[ConsensusReminders] Iniciando verificação de consensos pendentes...');
  
  const db = await getDb();
  if (!db) {
    console.error('[ConsensusReminders] Database not available');
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Buscar avaliações em etapa de consenso há mais de 3 dias
    const pendingConsensus = await db.select()
      .from(performanceEvaluations)
      .innerJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
      .where(
        and(
          eq(performanceEvaluations.workflowStatus, 'pending_consensus'),
          lt(performanceEvaluations.managerCompletedAt, threeDaysAgo)
        )
      );

    console.log(`[ConsensusReminders] ${pendingConsensus.length} consensos pendentes há 3+ dias`);

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const evaluation of pendingConsensus) {
      const employee = evaluation.employees;
      
      // Buscar líder (managerId do colaborador)
      if (!employee.managerId) continue;

      const leaders = await db.select()
        .from(employees)
        .where(eq(employees.id, employee.managerId))
        .limit(1);

      if (leaders.length === 0 || !leaders[0].email) continue;

      const leader = leaders[0];
      const daysWaiting = Math.floor((new Date().getTime() - evaluation.performanceEvaluations.managerCompletedAt!.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular prazo final (7 dias após avaliação do gestor)
      const deadline = new Date(evaluation.performanceEvaluations.managerCompletedAt!);
      deadline.setDate(deadline.getDate() + 7);
      const deadlineStr = deadline.toLocaleDateString('pt-BR');
      const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      // Enviar email de lembrete
      try {
        await emailService.sendCustomEmail(
          leader.email,
          `Lembrete: Consenso Pendente - Avaliação 360° de ${employee.name}`,
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
    .button { display: inline-block; padding: 12px 30px; background-color: #F39200; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Lembrete de Consenso Pendente</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${leader.name}</strong>!</p>
      
      <div class="alert">
        <strong>⚠️ Atenção:</strong> A avaliação 360° de <strong>${employee.name}</strong> está aguardando seu consenso final há <strong>${daysWaiting} dias</strong>.
      </div>

      <p><strong>Informações da Avaliação:</strong></p>
      <ul>
        <li><strong>Colaborador:</strong> ${employee.name}</li>
        <li><strong>Cargo:</strong> ${employee.positionId || 'Não informado'}</li>
        <li><strong>Prazo Final:</strong> ${deadlineStr} (${daysRemaining} dias restantes)</li>
        <li><strong>Status:</strong> Aguardando Consenso</li>
      </ul>

      <p>Por favor, acesse o sistema e finalize o consenso para concluir a avaliação.</p>

      <a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://3000-i58so038s6oxj3hgv9pq5-dd7bd28d.manusvm.computer'}/avaliacoes/consenso/${evaluation.performanceEvaluations.id}" class="button">
        Acessar Consenso
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
        console.error(`[ConsensusReminders] Erro ao enviar email para ${leader.email}:`, emailError);
      }

      // Criar notificação in-app
      if (leader.userId) {
        try {
          await db.insert(notifications).values({
            userId: leader.userId,
            type: 'consensus_reminder',
            title: `Lembrete: Consenso Pendente (${daysWaiting} dias)`,
            message: `A avaliação 360° de ${employee.name} está aguardando seu consenso há ${daysWaiting} dias. Prazo: ${deadlineStr}`,
            link: `/avaliacoes/consenso/${evaluation.performanceEvaluations.id}`,
            read: false,
          });
          notificationsCreated++;
        } catch (notifError) {
          console.error(`[ConsensusReminders] Erro ao criar notificação:`, notifError);
        }
      }
    }

    console.log(`[ConsensusReminders] ✅ Concluído: ${emailsSent} emails enviados, ${notificationsCreated} notificações criadas`);
    
    return {
      success: true,
      emailsSent,
      notificationsCreated,
      totalPending: pendingConsensus.length,
    };
  } catch (error) {
    console.error('[ConsensusReminders] Erro ao processar lembretes:', error);
    return { success: false, error: String(error) };
  }
}
