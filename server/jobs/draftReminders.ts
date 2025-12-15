import { CronJob } from "cron";
import { getDb } from "../db";
import { cycle360Drafts } from "../../drizzle/schema";
import { lt, sql } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * Job para enviar lembretes de rascunhos não finalizados
 * Executa diariamente às 10h e notifica usuários com rascunhos de 3+ dias
 */
export function startDraftRemindersJob() {
  // Executa diariamente às 10h (horário do servidor)
  const job = new CronJob("0 0 10 * * *", async () => {
    console.log("[Draft Reminders] Iniciando verificação de rascunhos antigos...");
    
    try {
      const db = await getDb();
      if (!db) {
        console.error("[Draft Reminders] Database não disponível");
        return;
      }

      // Buscar rascunhos com mais de 3 dias
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const oldDrafts = await db
        .select({
          draftKey: cycle360Drafts.draftKey,
          userId: cycle360Drafts.userId,
          userEmail: cycle360Drafts.userEmail,
          userName: cycle360Drafts.userName,
          draftData: cycle360Drafts.draftData,
          createdAt: cycle360Drafts.createdAt,
          updatedAt: cycle360Drafts.updatedAt,
        })
        .from(cycle360Drafts)
        .where(lt(cycle360Drafts.updatedAt, threeDaysAgo));

      console.log(`[Draft Reminders] Encontrados ${oldDrafts.length} rascunhos antigos`);

      // Enviar notificação para cada rascunho
      for (const draft of oldDrafts) {
        try {
          const daysOld = Math.floor(
            (Date.now() - new Date(draft.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Parse draft data para obter informações do ciclo
          let cycleName = "Ciclo de Avaliação 360°";
          try {
            const draftData = JSON.parse(draft.draftData);
            if (draftData.cycleData?.name) {
              cycleName = draftData.cycleData.name;
            }
          } catch (e) {
            // Ignorar erro de parse
          }

          // Enviar email
          await sendEmail({
            to: draft.userEmail,
            subject: `Lembrete: Rascunho de ciclo 360° pendente há ${daysOld} dias`,
            html: generateReminderEmail(draft.userName, cycleName, daysOld, draft.draftKey),
          });

          console.log(`[Draft Reminders] Email enviado para ${draft.userEmail}`);
        } catch (error) {
          console.error(`[Draft Reminders] Erro ao enviar email para ${draft.userEmail}:`, error);
        }
      }

      console.log("[Draft Reminders] Verificação concluída");
    } catch (error) {
      console.error("[Draft Reminders] Erro ao executar job:", error);
    }
  });

  job.start();
  console.log("[Draft Reminders] Job de lembretes de rascunhos iniciado (executa diariamente às 10h)");
  
  return job;
}

/**
 * Gera HTML do email de lembrete
 */
function generateReminderEmail(
  userName: string,
  cycleName: string,
  daysOld: number,
  draftKey: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .alert-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">⏰ Lembrete de Rascunho Pendente</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${userName}</strong>!</p>
        
        <p>Você tem um rascunho de ciclo de avaliação 360° que não foi finalizado:</p>
        
        <div class="alert-box">
          <strong>📋 ${cycleName}</strong><br>
          <span style="color: #92400e;">Pendente há ${daysOld} dias</span>
        </div>
        
        <p>Não perca o progresso que você já fez! Complete a criação do ciclo para que as avaliações possam ser iniciadas.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.VITE_APP_URL || "https://avd-uisa.manus.space"}/ciclos/360-enhanced/criar" class="button">
            Retomar Criação do Ciclo
          </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          <strong>Dica:</strong> Ao acessar o wizard, você verá a opção de recuperar o rascunho salvo automaticamente.
        </p>
      </div>
      <div class="footer">
        <p>Sistema AVD UISA - Avaliação de Desempenho</p>
        <p style="font-size: 12px;">Este é um email automático. Por favor, não responda.</p>
      </div>
    </body>
    </html>
  `;
}
