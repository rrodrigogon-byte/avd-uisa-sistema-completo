/**
 * Sistema Robusto de E-mails com Fila, Retry e Logs
 * 
 * Funcionalidades:
 * - Fila de e-mails com prioridades
 * - Retry automático com backoff exponencial
 * - Logs detalhados de todos os envios
 * - Monitoramento de taxa de entrega
 */

import { getDb } from "../db";
import { sendEmail } from "./email";
import { eq, and, lte, or } from "drizzle-orm";
import { emailQueue, emailLogs } from "../../drizzle/schema";

export type EmailPriority = "baixa" | "normal" | "alta" | "urgente";
export type EmailStatus = "pendente" | "enviando" | "enviado" | "falhou" | "cancelado";

export interface QueueEmailOptions {
  destinatario: string;
  assunto: string;
  corpo: string;
  tipoEmail: string;
  prioridade?: EmailPriority;
  maxTentativas?: number;
  metadados?: Record<string, any>;
}

/**
 * Adiciona um e-mail à fila para envio
 */
export async function queueEmail(options: QueueEmailOptions): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database não disponível");
  }

  const result = await db.insert(emailQueue).values({
    destinatario: options.destinatario,
    assunto: options.assunto,
    corpo: options.corpo,
    tipoEmail: options.tipoEmail,
    prioridade: options.prioridade || "normal",
    status: "pendente",
    tentativas: 0,
    maxTentativas: options.maxTentativas || 3,
    proximaTentativa: new Date(),
    metadados: options.metadados ? JSON.stringify(options.metadados) : null,
  });

  return result[0].insertId;
}

/**
 * Processa a fila de e-mails pendentes
 */
export async function processEmailQueue(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailQueue] Database não disponível");
    return;
  }

  // Buscar e-mails pendentes ou que falharam e estão prontos para retry
  const now = new Date();
  const pendingEmails = await db
    .select()
    .from(emailQueue)
    .where(
      and(
        or(
          eq(emailQueue.status, "pendente"),
          and(
            eq(emailQueue.status, "falhou"),
            lte(emailQueue.proximaTentativa, now)
          )
        )
      )
    )
    .orderBy(emailQueue.prioridade, emailQueue.createdAt)
    .limit(10); // Processar 10 por vez

  console.log(`[EmailQueue] Processando ${pendingEmails.length} e-mails`);

  for (const email of pendingEmails) {
    await processEmail(email.id);
  }
}

/**
 * Processa um e-mail específico da fila
 */
async function processEmail(emailId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const startTime = Date.now();

  try {
    // Buscar e-mail
    const emails = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.id, emailId))
      .limit(1);

    if (emails.length === 0) {
      console.warn(`[EmailQueue] E-mail ${emailId} não encontrado`);
      return;
    }

    const email = emails[0];

    // Verificar se já atingiu o máximo de tentativas
    if (email.tentativas >= email.maxTentativas) {
      await db
        .update(emailQueue)
        .set({
          status: "falhou",
          erroMensagem: "Máximo de tentativas atingido",
        })
        .where(eq(emailQueue.id, emailId));

      await logEmail({
        emailQueueId: emailId,
        destinatario: email.destinatario,
        assunto: email.assunto,
        tipoEmail: email.tipoEmail,
        status: "falha",
        tentativa: email.tentativas,
        erroMensagem: "Máximo de tentativas atingido",
        tempoResposta: Date.now() - startTime,
      });

      return;
    }

    // Atualizar status para "enviando"
    await db
      .update(emailQueue)
      .set({
        status: "enviando",
        tentativas: email.tentativas + 1,
      })
      .where(eq(emailQueue.id, emailId));

    // Tentar enviar o e-mail
    try {
      const result = await sendEmail({
        to: email.destinatario,
        subject: email.assunto,
        html: email.corpo,
      });

      // Sucesso!
      await db
        .update(emailQueue)
        .set({
          status: "enviado",
          enviadoEm: new Date(),
        })
        .where(eq(emailQueue.id, emailId));

      await logEmail({
        emailQueueId: emailId,
        destinatario: email.destinatario,
        assunto: email.assunto,
        tipoEmail: email.tipoEmail,
        status: "sucesso",
        tentativa: email.tentativas + 1,
        tempoResposta: Date.now() - startTime,
        smtpResponse: JSON.stringify(result),
      });

      console.log(`[EmailQueue] ✓ E-mail ${emailId} enviado com sucesso`);
    } catch (error: any) {
      // Falha no envio
      const nextRetry = calculateNextRetry(email.tentativas + 1);

      await db
        .update(emailQueue)
        .set({
          status: "falhou",
          erroMensagem: error.message,
          proximaTentativa: nextRetry,
        })
        .where(eq(emailQueue.id, emailId));

      await logEmail({
        emailQueueId: emailId,
        destinatario: email.destinatario,
        assunto: email.assunto,
        tipoEmail: email.tipoEmail,
        status: "falha",
        tentativa: email.tentativas + 1,
        erroMensagem: error.message,
        tempoResposta: Date.now() - startTime,
      });

      console.error(`[EmailQueue] ✗ Falha ao enviar e-mail ${emailId}:`, error.message);
      console.log(`[EmailQueue] Próxima tentativa em: ${nextRetry}`);
    }
  } catch (error: any) {
    console.error(`[EmailQueue] Erro ao processar e-mail ${emailId}:`, error);
  }
}

/**
 * Calcula o próximo horário de retry com backoff exponencial
 */
function calculateNextRetry(tentativa: number): Date {
  // Backoff exponencial: 1min, 5min, 15min, 30min, 1h
  const delays = [1, 5, 15, 30, 60]; // minutos
  const delayMinutes = delays[Math.min(tentativa - 1, delays.length - 1)];
  
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  
  return nextRetry;
}

/**
 * Registra um log de e-mail
 */
async function logEmail(log: {
  emailQueueId: number;
  destinatario: string;
  assunto: string;
  tipoEmail: string;
  status: "sucesso" | "falha" | "bounce" | "spam";
  tentativa: number;
  erroMensagem?: string;
  tempoResposta?: number;
  smtpResponse?: string;
  metadados?: Record<string, any>;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(emailLogs).values({
    emailQueueId: log.emailQueueId,
    destinatario: log.destinatario,
    assunto: log.assunto,
    tipoEmail: log.tipoEmail,
    status: log.status,
    tentativa: log.tentativa,
    erroMensagem: log.erroMensagem || null,
    tempoResposta: log.tempoResposta || null,
    smtpResponse: log.smtpResponse || null,
    metadados: log.metadados ? JSON.stringify(log.metadados) : null,
  });
}

/**
 * Inicia o processador de fila de e-mails
 * Executa a cada 1 minuto
 */
export function startEmailQueueProcessor(): void {
  console.log("[EmailQueue] Iniciando processador de fila de e-mails");

  // Processar imediatamente
  processEmailQueue().catch(console.error);

  // Processar a cada 1 minuto
  setInterval(() => {
    processEmailQueue().catch(console.error);
  }, 60 * 1000); // 1 minuto
}

/**
 * Obtém estatísticas da fila de e-mails
 */
export async function getEmailQueueStats(): Promise<{
  pendentes: number;
  enviados: number;
  falhas: number;
  taxaEntrega: number;
}> {
  const db = await getDb();
  if (!db) {
    return { pendentes: 0, enviados: 0, falhas: 0, taxaEntrega: 0 };
  }

  const stats = await db
    .select()
    .from(emailQueue);

  const pendentes = stats.filter(e => e.status === "pendente" || e.status === "enviando").length;
  const enviados = stats.filter(e => e.status === "enviado").length;
  const falhas = stats.filter(e => e.status === "falhou").length;

  const total = enviados + falhas;
  const taxaEntrega = total > 0 ? (enviados / total) * 100 : 0;

  return {
    pendentes,
    enviados,
    falhas,
    taxaEntrega: Math.round(taxaEntrega * 100) / 100,
  };
}
