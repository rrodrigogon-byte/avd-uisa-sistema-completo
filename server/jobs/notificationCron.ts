import { CronJob } from "cron";
import { getDb } from "../db";
import { goals, performanceEvaluations, pdiPlans, employees, users } from "../../drizzle/schema";
import { and, eq, lt, lte, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Cron Job para Notificações Automáticas
 * Executa diariamente às 9h para verificar:
 * - Metas próximas do vencimento (< 7 dias)
 * - Avaliações 360° pendentes
 * - PDIs sem atualização há mais de 30 dias
 */

export function startNotificationCron() {
  // Executar todos os dias às 9h (horário do servidor)
  const job = new CronJob(
    "0 0 9 * * *", // Segundos Minutos Horas Dia Mês DiaDaSemana
    async () => {
      console.log("[Cron] Executando verificação de notificações automáticas...");
      
      try {
        const db = await getDb();
        if (!db) {
          console.error("[Cron] Database not available");
          return;
        }

        // 1. Verificar metas próximas do vencimento (< 7 dias)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const expiringGoals = await db
          .select({
            goalId: goals.id,
            goalTitle: goals.title,
            endDate: goals.endDate,
            employeeName: employees.name,
            employeeEmail: employees.email,
          })
          .from(goals)
          .leftJoin(employees, eq(goals.employeeId, employees.id))
          .where(
            and(
              eq(goals.status, "em_andamento"),
              lte(goals.endDate, sevenDaysFromNow)
            )
          );

        if (expiringGoals.length > 0) {
          const message = `⚠️ **${expiringGoals.length} metas próximas do vencimento**\n\n` +
            expiringGoals.map(g => 
              `- ${g.goalTitle} (${g.employeeName}) - Vence em: ${new Date(g.endDate!).toLocaleDateString('pt-BR')}`
            ).join('\n');
          
          await notifyOwner({
            title: "Alerta: Metas Próximas do Vencimento",
            content: message,
          });
          console.log(`[Cron] Notificação enviada: ${expiringGoals.length} metas próximas do vencimento`);
        }

        // 2. Verificar avaliações 360° pendentes
        const pendingEvaluations = await db
          .select({
            evalId: performanceEvaluations.id,
            employeeName: employees.name,
            cycleId: performanceEvaluations.cycleId,
            createdAt: performanceEvaluations.createdAt,
          })
          .from(performanceEvaluations)
          .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
          .where(eq(performanceEvaluations.status, "pendente"));

        if (pendingEvaluations.length > 0) {
          const message = `📋 **${pendingEvaluations.length} avaliações 360° pendentes**\n\n` +
            pendingEvaluations.slice(0, 10).map(e => 
              `- ${e.employeeName} - Criada em: ${new Date(e.createdAt!).toLocaleDateString('pt-BR')}`
            ).join('\n') +
            (pendingEvaluations.length > 10 ? `\n\n... e mais ${pendingEvaluations.length - 10} avaliações` : '');
          
          await notifyOwner({
            title: "Alerta: Avaliações 360° Pendentes",
            content: message,
          });
          console.log(`[Cron] Notificação enviada: ${pendingEvaluations.length} avaliações pendentes`);
        }

        // 3. Verificar PDIs sem atualização há mais de 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const stalePDIs = await db
          .select({
            pdiId: pdiPlans.id,
            employeeName: employees.name,
            employeeEmail: employees.email,
            updatedAt: pdiPlans.updatedAt,
          })
          .from(pdiPlans)
          .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .where(
            and(
              eq(pdiPlans.status, "em_andamento"),
              lt(pdiPlans.updatedAt, thirtyDaysAgo)
            )
          );

        if (stalePDIs.length > 0) {
          const message = `📝 **${stalePDIs.length} PDIs sem atualização há mais de 30 dias**\n\n` +
            stalePDIs.slice(0, 10).map(p => 
              `- ${p.employeeName} - Última atualização: ${new Date(p.updatedAt!).toLocaleDateString('pt-BR')}`
            ).join('\n') +
            (stalePDIs.length > 10 ? `\n\n... e mais ${stalePDIs.length - 10} PDIs` : '');
          
          await notifyOwner({
            title: "Alerta: PDIs Sem Atualização",
            content: message,
          });
          console.log(`[Cron] Notificação enviada: ${stalePDIs.length} PDIs sem atualização`);
        }

        console.log("[Cron] Verificação de notificações concluída com sucesso");
      } catch (error) {
        console.error("[Cron] Erro ao executar verificação de notificações:", error);
      }
    },
    null,
    true,
    "America/Sao_Paulo" // Timezone de São Paulo
  );

  console.log("[Cron] Job de notificações automáticas iniciado (executa diariamente às 9h)");
  return job;
}
