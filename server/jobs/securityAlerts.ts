import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { and, gte, like, sql } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { ENV } from "../_core/env";

/**
 * Job para detectar atividades suspeitas e enviar alertas por email
 * Executa a cada hora
 */
export async function checkSecurityAlerts() {
  console.log("[Security] Verificando atividades suspeitas...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Security] Database not available");
    return;
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const alerts: string[] = [];

  try {
    // 1. Múltiplas tentativas de ações falhadas
    const failedActions = await db
      .select({
        userId: activityLogs.userId,
        action: activityLogs.activityType,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(
        and(
          gte(activityLogs.createdAt, last24h),
          like(activityLogs.activityType, "%failed%")
        )
      )
      .groupBy(activityLogs.userId, activityLogs.activityType)
      .having(sql`count(*) > 5`);

    if (failedActions.length > 0) {
      alerts.push(`<h3>🚨 Múltiplas Tentativas Falhadas</h3>`);
      alerts.push(`<ul>`);
      failedActions.forEach((item) => {
        alerts.push(
          `<li>Usuário ID: ${item.userId} - Ação: ${item.action} - ${item.count} tentativas</li>`
        );
      });
      alerts.push(`</ul>`);
    }

    // 2. Volume anormal de atividades
    const highVolume = await db
      .select({
        userId: activityLogs.userId,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last24h))
      .groupBy(activityLogs.userId)
      .having(sql`count(*) > 100`);

    if (highVolume.length > 0) {
      alerts.push(`<h3>⚠️ Volume Anormal de Atividades</h3>`);
      alerts.push(`<ul>`);
      highVolume.forEach((item) => {
        alerts.push(
          `<li>Usuário ID: ${item.userId} - ${item.count} atividades nas últimas 24h</li>`
        );
      });
      alerts.push(`</ul>`);
    }

    // 3. Atividades em horários incomuns (madrugada)
    const unusualHours = await db
      .select({
        userId: activityLogs.userId,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(
        and(
          gte(activityLogs.createdAt, last24h),
          sql`HOUR(${activityLogs.createdAt}) BETWEEN 0 AND 5`
        )
      )
      .groupBy(activityLogs.userId)
      .having(sql`count(*) > 10`);

    if (unusualHours.length > 0) {
      alerts.push(`<h3>🌙 Atividades em Horários Incomuns</h3>`);
      alerts.push(`<ul>`);
      unusualHours.forEach((item) => {
        alerts.push(
          `<li>Usuário ID: ${item.userId} - ${item.count} atividades entre 00h e 05h</li>`
        );
      });
      alerts.push(`</ul>`);
    }

    // Se houver alertas, enviar email
    if (alerts.length > 0) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Alerta de Segurança</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sistema AVD UISA</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Foram detectadas atividades suspeitas no sistema nas últimas 24 horas:
            </p>
            
            ${alerts.join("\n")}
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px;">
              <p style="margin: 0; color: #666;">
                <strong>Recomendação:</strong> Acesse o Dashboard de Segurança para investigar essas atividades e tomar as medidas necessárias.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="/admin/seguranca" 
                 style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Acessar Dashboard de Segurança
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Este é um email automático do Sistema AVD UISA</p>
            <p>Data: ${new Date().toLocaleString("pt-BR")}</p>
          </div>
        </div>
      `;

      // Enviar para o owner do sistema
      // Buscar email do owner
      const { getUserByOpenId } = await import("../db");
      const owner = await getUserByOpenId(ENV.ownerOpenId);
      
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "🚨 Alerta de Segurança - Atividades Suspeitas Detectadas",
          html: emailContent,
        });
      } else {
        console.warn("[Security] Email do owner não encontrado");
      }

      console.log(`[Security] Alerta enviado: ${alerts.length} tipos de atividades suspeitas detectadas`);
    } else {
      console.log("[Security] Nenhuma atividade suspeita detectada");
    }
  } catch (error) {
    console.error("[Security] Erro ao verificar atividades suspeitas:", error);
  }
}

// Registrar job para executar a cada hora
if (typeof setInterval !== "undefined") {
  // Executar imediatamente
  checkSecurityAlerts();
  
  // Executar a cada hora
  setInterval(checkSecurityAlerts, 60 * 60 * 1000);
  
  console.log("[Security] Job de alertas de segurança registrado (execução a cada hora)");
}
