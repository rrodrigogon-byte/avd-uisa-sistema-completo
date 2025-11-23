import { getDb } from "../db";
import { pulseSurveys, pulseSurveyEmailLogs, employees } from "../../drizzle/schema";
import { eq, and, lt, or, isNull, sql } from "drizzle-orm";
import { emailService } from "../utils/emailService";

/**
 * Job para envio automático de e-mails de Pesquisas Pulse
 * Executa a cada 8 horas e envia e-mails para funcionários que ainda não responderam
 */
export async function sendPulseEmailsJob() {
  console.log("[Pulse Job] Iniciando envio de e-mails de pesquisas Pulse...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Pulse Job] Database not available");
    return;
  }

  try {
    const now = new Date();
    
    // Buscar pesquisas ativas que ainda não expiraram
    const activeSurveys = await db
      .select()
      .from(pulseSurveys)
      .where(
        and(
          eq(pulseSurveys.status, "active"),
          or(
            isNull(pulseSurveys.closedAt),
            sql`${pulseSurveys.closedAt} > ${now}`
          )
        )
      );

    console.log(`[Pulse Job] ${activeSurveys.length} pesquisas ativas encontradas`);

    for (const survey of activeSurveys) {
      await sendSurveyEmails(survey);
    }

    console.log("[Pulse Job] Envio de e-mails concluído");
  } catch (error) {
    console.error("[Pulse Job] Erro ao enviar e-mails:", error);
  }
}

async function sendSurveyEmails(survey: any) {
  const db = await getDb();
  if (!db) return;

  console.log(`[Pulse Job] Processando pesquisa: ${survey.title}`);

  // Determinar público-alvo
  let targetEmployees: any[] = [];

  if (survey.targetEmployeeIds && Array.isArray(survey.targetEmployeeIds) && survey.targetEmployeeIds.length > 0) {
    // Enviar para IDs específicos
    targetEmployees = await db
      .select()
      .from(employees)
      .where(
        sql`${employees.id} IN (${sql.join(survey.targetEmployeeIds.map((id: number) => sql`${id}`), sql`, `)})`
      );
  } else if (survey.targetDepartmentId) {
    // Enviar para departamento específico
    targetEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.departmentId, survey.targetDepartmentId));
  } else {
    // Enviar para todos os funcionários ativos
    targetEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, "ativo"));
  }

  console.log(`[Pulse Job] ${targetEmployees.length} funcionários no público-alvo`);

  // Buscar logs de envio existentes
  const existingLogs = await db
    .select()
    .from(pulseSurveyEmailLogs)
    .where(eq(pulseSurveyEmailLogs.surveyId, survey.id));

  const sentEmployeeIds = new Set(
    existingLogs
      .filter(log => log.status === "enviada")
      .map(log => log.employeeId)
  );

  // Filtrar funcionários que ainda não receberam ou que falharam
  const employeesToSend = targetEmployees.filter(emp => {
    if (!emp.email) return false;
    
    // Se já foi enviado com sucesso, não enviar novamente
    if (sentEmployeeIds.has(emp.id)) return false;
    
    // Verificar se houve falha recente (menos de 8 horas atrás)
    const failedLog = existingLogs.find(
      log => log.employeeId === emp.id && log.status === "failed"
    );
    
    if (failedLog && failedLog.lastAttemptAt) {
      const hoursSinceLastAttempt = (Date.now() - new Date(failedLog.lastAttemptAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAttempt < 8) {
        return false; // Não tentar novamente se falhou há menos de 8h
      }
    }
    
    return true;
  });

  console.log(`[Pulse Job] ${employeesToSend.length} e-mails para enviar`);

  let successCount = 0;
  let failCount = 0;

  for (const employee of employeesToSend) {
    try {
      // Gerar link da pesquisa
      const surveyLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/pesquisas-pulse/${survey.id}/responder`;

      // Enviar e-mail
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Olá, ${employee.name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Você foi convidado(a) a participar da pesquisa: <strong>${survey.title}</strong>
          </p>
          <p style="color: #666; line-height: 1.6;">
            ${survey.description || "Sua opinião é muito importante para nós!"}
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; margin: 0; font-weight: bold;">Pergunta:</p>
            <p style="color: #666; margin: 10px 0 0 0;">${survey.question}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Responder Agora
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ${survey.closedAt ? `Esta pesquisa estará disponível até ${new Date(survey.closedAt).toLocaleDateString("pt-BR")}.` : ""}
          </p>
        </div>
      `;
      
      await emailService.sendCustomEmail(employee.email, `📊 ${survey.title}`, emailHtml);

      // Registrar sucesso
      await db.insert(pulseSurveyEmailLogs).values({
        surveyId: survey.id,
        employeeId: employee.id,
        email: employee.email,
        status: "enviada",
        attemptCount: 1,
        lastAttemptAt: new Date(),
        sentAt: new Date(),
      });

      successCount++;
      console.log(`[Pulse Job] E-mail enviado para ${employee.email}`);
    } catch (error: any) {
      // Registrar falha
      await db.insert(pulseSurveyEmailLogs).values({
        surveyId: survey.id,
        employeeId: employee.id,
        email: employee.email,
        status: "failed",
        attemptCount: 1,
        lastAttemptAt: new Date(),
        errorMessage: error.message || "Erro desconhecido",
      });

      failCount++;
      console.error(`[Pulse Job] Erro ao enviar e-mail para ${employee.email}:`, error.message);
    }

    // Aguardar 100ms entre envios para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[Pulse Job] Pesquisa ${survey.title}: ${successCount} enviados, ${failCount} falhas`);
}
