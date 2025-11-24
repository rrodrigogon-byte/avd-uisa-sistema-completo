import { getDb } from "../db";
import { smartGoals, criticalGoalAlerts, goalMonitoringLogs, users, performanceHistory } from "../../drizzle/schema";
import { lt, ne, eq, and, sql } from "drizzle-orm";
import { emailService } from "../services/emailService";
import { InsertCriticalGoalAlert, InsertGoalMonitoringLog, InsertPerformanceHistory } from "../../drizzle/schema";

/**
 * Job Cron para Monitoramento de Metas Criticas
 * Executa a cada hora para verificar metas com progresso < 20%
 * Envia alertas e notificacoes aos usuarios
 */

interface CriticalGoal {
  id: number;
  userId: number;
  title: string;
  progress: string | number;
  endDate: Date | null;
  status: string | null;
}

interface ProcessingResult {
  processed: number;
  alertsGenerated: number;
  emailsSent: number;
  goals: CriticalGoal[];
  error?: string;
}

/**
 * Calcular severidade com base no progresso e dias restantes
 */
function calculateSeverity(progress: number, daysRemaining: number): string {
  if (progress <= 5 && daysRemaining <= 7) return "extreme";
  if (progress <= 10 && daysRemaining <= 14) return "high";
  if (progress <= 15 && daysRemaining <= 21) return "medium";
  return "low";
}

/**
 * Calcular score de performance do usuario
 */
function calculatePerformanceScore(
  goalsCompleted: number,
  goalsTotal: number,
  criticalGoalsCount: number
): number {
  if (goalsTotal === 0) return 0;
  
  const completionRate = (goalsCompleted / goalsTotal) * 100;
  const criticalPenalty = criticalGoalsCount * 5;
  
  return Math.max(0, completionRate - criticalPenalty);
}

/**
 * Processar metas criticas e gerar alertas
 */
export async function processCriticalGoals(): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    alertsGenerated: 0,
    emailsSent: 0,
    goals: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      result.error = "Database not available";
      return result;
    }

    // Buscar todas as metas em andamento com progresso < 20%
    const allGoals = await db
      .select()
      .from(smartGoals)
      .where(
        and(
          ne(smartGoals.status, "concluida"),
          ne(smartGoals.status, "cancelada")
        )
      );

    // Filtrar metas com progresso < 20%
    const criticalGoals = allGoals.filter(g => {
      const progress = typeof g.progress === 'string' ? parseFloat(g.progress) : g.progress;
      return progress < 20;
    });

    result.processed = criticalGoals.length;

    // Agrupar metas por usuario para calcular performance
    const goalsByUser: { [userId: number]: CriticalGoal[] } = {};
    const allUserIds: number[] = [];

    for (const goal of criticalGoals) {
      const userId = goal.userId;
      if (!goalsByUser[userId]) {
        goalsByUser[userId] = [];
      }
      goalsByUser[userId].push(goal as CriticalGoal);
      if (!allUserIds.includes(userId)) {
        allUserIds.push(userId);
      }
    }

    // Processar cada meta critica
    for (const goal of criticalGoals) {
      const now = new Date();
      const endDate = goal.endDate ? new Date(goal.endDate) : new Date();
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const progressNum = typeof goal.progress === 'string' ? parseFloat(goal.progress) : goal.progress;
      const severity = calculateSeverity(progressNum, daysRemaining);

      // Criar alerta no banco de dados
      const alertMessage = `Meta critica detectada: ${goal.title} com ${goal.progress}% de progresso. ${daysRemaining} dias restantes.`;

      const alert: InsertCriticalGoalAlert = {
        goalId: goal.id,
        userId: goal.userId,
        goalTitle: goal.title,
        currentProgress: progressNum as any,
        severity: severity as "low" | "medium" | "high" | "critical",
        message: alertMessage,
        isRead: 0,
        createdAt: new Date(),
      };

      await db.insert(criticalGoalAlerts).values(alert);
      result.alertsGenerated++;

      // Buscar usuario para enviar email
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, goal.userId))
        .limit(1);

      if (userRecord.length > 0 && userRecord[0].email) {
        const emailSent = await emailService.sendCriticalAlert(
          userRecord[0].email,
          goal.title,
          progressNum,
          severity,
          daysRemaining
        );

        if (emailSent) {
          result.emailsSent++;
        }
      }

      result.goals.push({
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        progress: progressNum,
        endDate: goal.endDate || new Date(),
        status: goal.status || 'em_andamento',
      });
    }

    // Atualizar historico de performance para cada usuario
    for (const userId of allUserIds) {
      const userGoals = await db
        .select()
        .from(smartGoals)
        .where(eq(smartGoals.userId, userId));

      const completedGoals = userGoals.filter(g => g.status === "concluida").length;
      const criticalCount = goalsByUser[userId]?.length || 0;
      const performanceScore = calculatePerformanceScore(
        completedGoals,
        userGoals.length,
        criticalCount
      );

      const performanceRecord: InsertPerformanceHistory = {
        userId,
        performanceScore: performanceScore as any,
        goalsCompleted: completedGoals,
        goalsTotal: userGoals.length,
        alertsGenerated: criticalCount,
        criticalGoals: criticalCount,
        recordedAt: new Date(),
      } as any;

      await db.insert(performanceHistory).values(performanceRecord);
    }

    // Registrar execucao do job
    const log: InsertGoalMonitoringLog = {
      executedAt: new Date(),
      goalsProcessed: result.processed,
      alertsGenerated: result.alertsGenerated,
      status: "success",
    };

    await db.insert(goalMonitoringLogs).values(log);

    console.log(`[GoalsMonitoring] Job completed: ${result.processed} goals processed, ${result.alertsGenerated} alerts generated, ${result.emailsSent} emails sent`);

    return result;
  } catch (error) {
    console.error("[GoalsMonitoring] Error processing critical goals:", error);

    const db = await getDb();
    if (db) {
      const log: InsertGoalMonitoringLog = {
        executedAt: new Date(),
        goalsProcessed: result.processed,
        alertsGenerated: result.alertsGenerated,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };

      await db.insert(goalMonitoringLogs).values(log);
    }

    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

/**
 * Processar relatorios agendados
 */
export async function processScheduledReports(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[ScheduledReports] Database not available");
      return;
    }

    // Aqui sera implementada a logica de processamento de relatorios agendados
    // Por enquanto, apenas registramos a execucao
    console.log("[ScheduledReports] Processing scheduled reports...");
  } catch (error) {
    console.error("[ScheduledReports] Error processing scheduled reports:", error);
  }
}
