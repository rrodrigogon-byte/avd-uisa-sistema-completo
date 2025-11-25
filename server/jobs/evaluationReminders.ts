import { CronJob } from "cron";
import { getDb } from "../db";
import {
  evaluationCycles,
  evaluation360CycleParticipants,
  employees,
  emailMetrics,
} from "../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * Job Cron para enviar lembretes de avaliações 360° pendentes
 * Executa diariamente às 9h
 * Envia lembretes escalonados:
 * - 3 dias antes do prazo
 * - 1 dia antes do prazo
 * - No dia do prazo
 */

async function sendEvaluationReminders() {
  console.log("[Cron] Iniciando envio de lembretes de avaliações 360°...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Cron] Database não disponível");
      return;
    }

    // Buscar ciclos ativos
    const activeCycles = await db
      .select()
      .from(evaluationCycles)
      .where(
        and(
          eq(evaluationCycles.status, "ativo"),
          sql`${evaluationCycles.endDate} >= CURDATE()`
        )
      );

    if (activeCycles.length === 0) {
      console.log("[Cron] Nenhum ciclo ativo encontrado");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEmailsSent = 0;

    for (const cycle of activeCycles) {
      const endDate = new Date(cycle.endDate);
      endDate.setHours(0, 0, 0, 0);

      const daysUntilDeadline = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Verificar se é um dia de envio de lembrete (3 dias, 1 dia, ou no prazo)
      if (![3, 1, 0].includes(daysUntilDeadline)) {
        continue;
      }

      // Buscar participantes pendentes do ciclo
      const participants = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(
          and(
            eq(evaluation360CycleParticipants.cycleId, cycle.id),
            inArray(evaluation360CycleParticipants.status, ["pending", "in_progress"])
          )
        );

      if (participants.length === 0) {
        console.log(`[Cron] Nenhum participante pendente no ciclo ${cycle.name}`);
        continue;
      }

      // Buscar dados dos funcionários
      const employeeIds = Array.from(new Set(participants.map((p) => p.employeeId)));
      const employeesData = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds));

      const employeeMap = new Map(employeesData.map((e) => [e.id, e]));

      // Enviar emails
      for (const participant of participants) {
        const employee = employeeMap.get(participant.employeeId);
        if (!employee || !employee.email) continue;

        let subject = "";
        let urgency = "";

        if (daysUntilDeadline === 3) {
          subject = `Lembrete: Avaliação 360° - ${cycle.name} (3 dias restantes)`;
          urgency = "Você tem <strong>3 dias</strong> para completar suas avaliações.";
        } else if (daysUntilDeadline === 1) {
          subject = `⚠️ Urgente: Avaliação 360° - ${cycle.name} (1 dia restante)`;
          urgency =
            "⚠️ <strong>ATENÇÃO:</strong> Você tem apenas <strong>1 dia</strong> para completar suas avaliações!";
        } else {
          subject = `🚨 ÚLTIMO DIA: Avaliação 360° - ${cycle.name}`;
          urgency =
            "🚨 <strong>ÚLTIMO DIA!</strong> O prazo para completar suas avaliações termina <strong>HOJE</strong>!";
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .urgency { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Lembrete de Avaliação 360°</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${employee.name}</strong>,</p>
                
                <div class="urgency">
                  ${urgency}
                </div>
                
                <p>Este é um lembrete de que você possui avaliações 360° pendentes no ciclo <strong>${cycle.name}</strong>.</p>
                
                <p><strong>Informações do Ciclo:</strong></p>
                <ul>
                  <li><strong>Nome:</strong> ${cycle.name}</li>
                  <li><strong>Prazo Final:</strong> ${new Date(cycle.endDate).toLocaleDateString("pt-BR")}</li>
                  <li><strong>Status:</strong> Pendente</li>
                </ul>
                
                <p>Por favor, acesse o sistema e complete suas avaliações o quanto antes.</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/360-enhanced" class="button">
                    Acessar Sistema
                  </a>
                </div>
                
                <p>Obrigado pela sua colaboração!</p>
                <p><em>Equipe de RH</em></p>
              </div>
              <div class="footer">
                <p>Este é um e-mail automático. Por favor, não responda.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const emailSent = await sendEmail({
            to: employee.email,
            subject,
            html: emailHtml,
          });

          if (emailSent) {
            totalEmailsSent++;

            // Registrar métrica de email
            await db.insert(emailMetrics).values({
              type: "evaluation_reminder",
              toEmail: employee.email,
              subject,
              success: true,
              sentAt: new Date(),
            });

            console.log(
              `[Cron] Lembrete enviado para ${employee.name} (${employee.email}) - Ciclo: ${cycle.name}`
            );
          } else {
            await db.insert(emailMetrics).values({
              type: "evaluation_reminder",
              toEmail: employee.email,
              subject,
              success: false,
              error: "Falha no envio",
              sentAt: new Date(),
            });

            console.error(
              `[Cron] Falha ao enviar lembrete para ${employee.name} (${employee.email})`
            );
          }
        } catch (error) {
          console.error(
            `[Cron] Erro ao enviar lembrete para ${employee.email}:`,
            error
          );

          await db.insert(emailMetrics).values({
            type: "evaluation_reminder",
            toEmail: employee.email,
            subject,
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
            sentAt: new Date(),
          });
        }
      }
    }

    console.log(
      `[Cron] Lembretes de avaliações 360° concluídos. Total de emails enviados: ${totalEmailsSent}`
    );
  } catch (error) {
    console.error("[Cron] Erro ao executar job de lembretes de avaliações:", error);
  }
}

// Executar diariamente às 9h (horário do servidor)
export const evaluationRemindersJob = new CronJob(
  "0 9 * * *", // Todos os dias às 9h
  sendEvaluationReminders,
  null,
  false,
  "America/Sao_Paulo"
);

// Exportar função para teste manual
export { sendEvaluationReminders };
