import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";

/**
 * Middleware de tracking automático de atividades
 * Registra todas as ações importantes dos usuários no sistema
 */

export type ActivityType =
  | "login"
  | "logout"
  | "create_goal"
  | "update_goal"
  | "create_pdi"
  | "update_pdi"
  | "submit_evaluation"
  | "approve_request"
  | "reject_request"
  | "upload_file"
  | "generate_report"
  | "create_job_description"
  | "approve_job_description"
  | "reject_job_description"
  | "register_activity"
  | "view_dashboard"
  | "other";

export async function logActivity(params: {
  userId: number;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, any>;
}) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[ActivityTracking] Database not available");
      return;
    }

    await db.insert(activityLogs).values({
      employeeId: params.userId, // Usando userId como employeeId
      userId: params.userId,
      activityType: params.activityType,
      activityDescription: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });

    console.log(`[ActivityTracking] Logged: ${params.activityType} by user ${params.userId}`);
  } catch (error) {
    console.error("[ActivityTracking] Failed to log activity:", error);
  }
}

/**
 * Wrapper para procedures que registra automaticamente a atividade
 */
export function withActivityTracking<T extends (...args: any[]) => any>(
  activityType: ActivityType,
  getDescription: (input: any) => string
) {
  return (handler: T): T => {
    return (async (...args: any[]) => {
      const result = await handler(...args);
      
      // Extrair userId do contexto (args[0] geralmente é { input, ctx })
      const ctx = args[0]?.ctx;
      const input = args[0]?.input;
      
      if (ctx?.user?.id) {
        await logActivity({
          userId: ctx.user.id,
          activityType,
          description: getDescription(input),
          metadata: input,
        });
      }

      return result;
    }) as T;
  };
}

/**
 * Categorizar atividade automática em categoria manual equivalente
 */
export function mapActivityTypeToCategory(activityType: ActivityType): string {
  const mapping: Record<ActivityType, string> = {
    login: "outros",
    logout: "outros",
    create_goal: "planejamento",
    update_goal: "planejamento",
    create_pdi: "planejamento",
    update_pdi: "planejamento",
    submit_evaluation: "analise",
    approve_request: "execucao",
    reject_request: "execucao",
    upload_file: "execucao",
    generate_report: "analise",
    create_job_description: "planejamento",
    approve_job_description: "execucao",
    reject_job_description: "execucao",
    register_activity: "execucao",
    view_dashboard: "analise",
    other: "outros",
  };

  return mapping[activityType] || "outros";
}

/**
 * Calcular tempo estimado de uma atividade automática (em minutos)
 */
export function estimateActivityDuration(activityType: ActivityType): number {
  const durations: Record<ActivityType, number> = {
    login: 1,
    logout: 1,
    create_goal: 15,
    update_goal: 10,
    create_pdi: 30,
    update_pdi: 15,
    submit_evaluation: 20,
    approve_request: 5,
    reject_request: 5,
    upload_file: 5,
    generate_report: 10,
    create_job_description: 45,
    approve_job_description: 10,
    reject_job_description: 10,
    register_activity: 3,
    view_dashboard: 2,
    other: 5,
  };

  return durations[activityType] || 5;
}
