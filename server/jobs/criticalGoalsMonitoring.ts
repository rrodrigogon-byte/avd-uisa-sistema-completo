import { getDb, createCriticalAlert, logGoalMonitoring } from "../db";
import { notifyOwner } from "../_core/notification";

/**
 * Job cron que executa a cada hora
 * Monitora metas críticas com progresso < 20%
 * Gera alertas automáticos para gestores
 */
export async function processCriticalGoals() {
  console.log("[CriticalGoals] Starting monitoring job...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[CriticalGoals] Database not available");
      await logGoalMonitoring({
        status: "failed",
        errorMessage: "Database not available",
        goalsProcessed: 0,
        alertsGenerated: 0,
      });
      return;
    }

    // Simular busca de metas críticas
    // Em produção, isso consultaria a tabela de metas do sistema
    const criticalGoals = [
      {
        id: 1,
        userId: 1,
        title: "Meta de Vendas Q4",
        progress: 15,
        severity: "critical",
      },
      {
        id: 2,
        userId: 1,
        title: "Implementação de Sistema",
        progress: 18,
        severity: "high",
      },
    ];

    let alertsGenerated = 0;

    for (const goal of criticalGoals) {
      if (goal.progress < 20) {
        // Criar alerta
        await createCriticalAlert({
          goalId: goal.id,
          userId: goal.userId,
          goalTitle: goal.title,
          currentProgress: goal.progress.toString(),
          severity: goal.severity as any,
          message: `Meta crítica "${goal.title}" com apenas ${goal.progress}% de progresso. Ação imediata recomendada.`,
          isRead: 0,
        });

        alertsGenerated++;

        // Notificar gestor
        try {
          await notifyOwner({
            title: `🚨 Alerta Crítico: ${goal.title}`,
            content: `A meta "${goal.title}" está com apenas ${goal.progress}% de progresso. Acesse o dashboard de alertas para mais detalhes.`,
          });
        } catch (error) {
          console.warn("[CriticalGoals] Failed to notify owner:", error);
        }
      }
    }

    // Log de execução
    await logGoalMonitoring({
      status: "success",
      goalsProcessed: criticalGoals.length,
      alertsGenerated,
    });

    console.log(`[CriticalGoals] Monitoring completed. Processed: ${criticalGoals.length}, Alerts: ${alertsGenerated}`);
  } catch (error) {
    console.error("[CriticalGoals] Error during monitoring:", error);
    
    await logGoalMonitoring({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      goalsProcessed: 0,
      alertsGenerated: 0,
    });
  }
}

/**
 * Agenda o job cron para executar a cada hora
 */
export function scheduleCriticalGoalsMonitoring() {
  // Executar imediatamente na inicialização
  processCriticalGoals().catch(console.error);

  // Agendar para executar a cada hora (3600000 ms)
  setInterval(() => {
    processCriticalGoals().catch(console.error);
  }, 3600000); // 1 hora

  console.log("[CriticalGoals] Monitoring job scheduled to run every hour");
}
