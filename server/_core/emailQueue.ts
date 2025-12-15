/**
 * Sistema Robusto de E-mails com Fila, Retry e Logs
 * 
 * Funcionalidades:
 * - Fila de e-mails com retry automático
 * - Logs detalhados de todos os envios
 * - Monitoramento de taxa de entrega
 */

import { getDb } from "../db";
import { sendEmail } from "./email";
import { eq, and, lte, or } from "drizzle-orm";
import { emailQueue } from "../../drizzle/schema";

export interface QueueEmailOptions {
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledFor?: Date;
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
    recipientEmail: options.recipientEmail,
    subject: options.subject,
    body: options.body,
    status: "pending",
    attempts: 0,
    scheduledFor: options.scheduledFor || new Date(),
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

  // Buscar e-mails pendentes
  const now = new Date();
  const pendingEmails = await db
    .select()
    .from(emailQueue)
    .where(
      eq(emailQueue.status, "pending")
    )
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

    // Verificar se já atingiu o máximo de tentativas (3)
    if (email.attempts >= 3) {
      await db
        .update(emailQueue)
        .set({
          status: "failed",
          lastError: "Máximo de tentativas atingido",
        })
        .where(eq(emailQueue.id, emailId));

      return;
    }

    // Atualizar status para "sending"
    await db
      .update(emailQueue)
      .set({
        status: "sending",
        attempts: email.attempts + 1,
      })
      .where(eq(emailQueue.id, emailId));

    // Tentar enviar o e-mail
    try {
      await sendEmail({
        to: email.recipientEmail,
        subject: email.subject,
        html: email.body,
      });

      // Sucesso!
      await db
        .update(emailQueue)
        .set({
          status: "sent",
          sentAt: new Date(),
        })
        .where(eq(emailQueue.id, emailId));

      console.log(`[EmailQueue] ✓ E-mail ${emailId} enviado com sucesso`);
    } catch (error: any) {
      // Falha no envio
      const nextRetry = calculateNextRetry(email.attempts + 1);

      await db
        .update(emailQueue)
        .set({
          status: "failed",
          lastError: error.message,
          scheduledFor: nextRetry,
        })
        .where(eq(emailQueue.id, emailId));

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
function calculateNextRetry(attempt: number): Date {
  // Backoff exponencial: 1min, 5min, 15min
  const delays = [1, 5, 15]; // minutos
  const delayMinutes = delays[Math.min(attempt - 1, delays.length - 1)];
  
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  
  return nextRetry;
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
  pending: number;
  sent: number;
  failed: number;
  deliveryRate: number;
}> {
  const db = await getDb();
  if (!db) {
    return { pending: 0, sent: 0, failed: 0, deliveryRate: 0 };
  }

  const stats = await db
    .select()
    .from(emailQueue);

  const pending = stats.filter(e => e.status === "pending" || e.status === "sending").length;
  const sent = stats.filter(e => e.status === "sent").length;
  const failed = stats.filter(e => e.status === "failed").length;

  const total = sent + failed;
  const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

  return {
    pending,
    sent,
    failed,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
  };
}
