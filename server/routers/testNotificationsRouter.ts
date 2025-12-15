import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  testResults, 
  testInvitations,
  employees, 
  notifications,
  users
} from "../../drizzle/schema";
import { eq, and, lt, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../emailService";

/**
 * Router para Notificações Automáticas de Testes
 * Envia alertas quando testes são concluídos e lembretes para pendências
 */
export const testNotificationsRouter = router({
  /**
   * Verificar e enviar notificações para testes concluídos
   */
  notifyCompletedTests: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar testes concluídos nas últimas 24 horas que ainda não foram notificados
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const completedTests = await db
      .select({
        resultId: testResults.id,
        employeeId: testResults.employeeId,
        employeeName: employees.name,
        employeeEmail: employees.email,
        testType: testResults.testType,
        score: testResults.score,
        completedAt: testResults.completedAt,
      })
      .from(testResults)
      .leftJoin(employees, eq(testResults.employeeId, employees.id))
      .where(
        and(
          sql`${testResults.completedAt} >= ${oneDayAgo}`,
          sql`${testResults.notified} = 0 OR ${testResults.notified} IS NULL`
        )
      );

    const notificationResults = [];

    for (const test of completedTests) {
      try {
        // Criar notificação no sistema
        await db.insert(notifications).values({
          userId: null, // Sistema
          type: "test_completed",
          title: "Teste Concluído",
          message: `${test.employeeName} concluiu o teste ${test.testType?.toUpperCase()} com pontuação ${test.score}%`,
          relatedEntityType: "test_result",
          relatedEntityId: test.resultId,
          read: false,
        });

        // Enviar e-mail para RH/Admin (se configurado)
        if (test.employeeEmail) {
          try {
            await sendEmail({
              to: test.employeeEmail,
              subject: `Teste Concluído - ${test.testType?.toUpperCase()}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .score-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>✅ Teste Concluído</h1>
                      <p>Sistema AVD UISA - Avaliação de Desempenho</p>
                    </div>
                    <div class="content">
                      <p>Olá,</p>
                      <p><strong>${test.employeeName}</strong> concluiu um teste psicométrico:</p>
                      
                      <div class="score-box">
                        <p><strong>Tipo de Teste:</strong> ${test.testType?.toUpperCase()}</p>
                        <p><strong>Pontuação:</strong> ${test.score}%</p>
                        <p><strong>Data de Conclusão:</strong> ${new Date(test.completedAt).toLocaleString("pt-BR")}</p>
                      </div>

                      <p>Acesse o sistema para visualizar os resultados detalhados.</p>
                    </div>
                    <div class="footer">
                      <p>Este é um e-mail automático. Por favor, não responda.</p>
                      <p>&copy; ${new Date().getFullYear()} UISA - Todos os direitos reservados</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
          } catch (emailError) {
            console.error(`Erro ao enviar e-mail para ${test.employeeEmail}:`, emailError);
          }
        }

        // Marcar como notificado
        await db
          .update(testResults)
          .set({ notified: true })
          .where(eq(testResults.id, test.resultId));

        notificationResults.push({
          resultId: test.resultId,
          success: true,
        });
      } catch (error) {
        console.error(`Erro ao notificar teste ${test.resultId}:`, error);
        notificationResults.push({
          resultId: test.resultId,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return {
      success: true,
      totalProcessed: completedTests.length,
      results: notificationResults,
    };
  }),

  /**
   * Verificar e enviar lembretes para testes pendentes há mais de 7 dias
   */
  sendPendingReminders: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar convites pendentes há mais de 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pendingInvitations = await db
      .select({
        invitationId: testInvitations.id,
        employeeId: testInvitations.employeeId,
        employeeName: employees.name,
        employeeEmail: employees.email,
        testType: testInvitations.testType,
        sentAt: testInvitations.sentAt,
        token: testInvitations.token,
      })
      .from(testInvitations)
      .leftJoin(employees, eq(testInvitations.employeeId, employees.id))
      .where(
        and(
          eq(testInvitations.status, "pending"),
          sql`${testInvitations.sentAt} <= ${sevenDaysAgo}`,
          sql`(${testInvitations.reminderSent} = 0 OR ${testInvitations.reminderSent} IS NULL)`
        )
      );

    const reminderResults = [];

    for (const invitation of pendingInvitations) {
      try {
        // Criar notificação no sistema
        await db.insert(notifications).values({
          userId: null,
          type: "test_reminder",
          title: "Lembrete: Teste Pendente",
          message: `${invitation.employeeName} possui um teste ${invitation.testType?.toUpperCase()} pendente há mais de 7 dias`,
          relatedEntityType: "test_invitation",
          relatedEntityId: invitation.invitationId,
          read: false,
        });

        // Enviar e-mail de lembrete
        if (invitation.employeeEmail) {
          try {
            const testLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/testes/responder/${invitation.token}`;

            await sendEmail({
              to: invitation.employeeEmail,
              subject: `Lembrete: Teste Pendente - ${invitation.testType?.toUpperCase()}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .reminder-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>⏰ Lembrete: Teste Pendente</h1>
                      <p>Sistema AVD UISA - Avaliação de Desempenho</p>
                    </div>
                    <div class="content">
                      <p>Olá <strong>${invitation.employeeName}</strong>,</p>
                      
                      <div class="reminder-box">
                        <p><strong>⚠️ Você possui um teste pendente:</strong></p>
                        <p><strong>Tipo de Teste:</strong> ${invitation.testType?.toUpperCase()}</p>
                        <p><strong>Enviado em:</strong> ${new Date(invitation.sentAt).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Dias pendente:</strong> ${Math.floor((Date.now() - new Date(invitation.sentAt).getTime()) / (1000 * 60 * 60 * 24))} dias</p>
                      </div>

                      <p>Por favor, complete o teste o mais breve possível. Clique no botão abaixo para acessar:</p>

                      <div style="text-align: center;">
                        <a href="${testLink}" class="button">Responder Teste Agora</a>
                      </div>

                      <p>Em caso de dúvidas, entre em contato com o departamento de RH.</p>
                    </div>
                    <div class="footer">
                      <p>Este é um e-mail automático. Por favor, não responda.</p>
                      <p>&copy; ${new Date().getFullYear()} UISA - Todos os direitos reservados</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
          } catch (emailError) {
            console.error(`Erro ao enviar lembrete para ${invitation.employeeEmail}:`, emailError);
          }
        }

        // Marcar como lembrete enviado
        await db
          .update(testInvitations)
          .set({ reminderSent: true })
          .where(eq(testInvitations.id, invitation.invitationId));

        reminderResults.push({
          invitationId: invitation.invitationId,
          success: true,
        });
      } catch (error) {
        console.error(`Erro ao enviar lembrete ${invitation.invitationId}:`, error);
        reminderResults.push({
          invitationId: invitation.invitationId,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return {
      success: true,
      totalProcessed: pendingInvitations.length,
      results: reminderResults,
    };
  }),

  /**
   * Buscar estatísticas de notificações
   */
  getNotificationStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Contar testes concluídos nas últimas 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCompleted = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(testResults)
      .where(sql`${testResults.completedAt} >= ${oneDayAgo}`);

    // Contar convites pendentes há mais de 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const overduePending = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(testInvitations)
      .where(
        and(
          eq(testInvitations.status, "pending"),
          sql`${testInvitations.sentAt} <= ${sevenDaysAgo}`
        )
      );

    // Contar notificações não lidas
    const unreadNotifications = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.read, false),
          sql`${notifications.type} IN ('test_completed', 'test_reminder')`
        )
      );

    return {
      recentCompleted: recentCompleted[0]?.count || 0,
      overduePending: overduePending[0]?.count || 0,
      unreadNotifications: unreadNotifications[0]?.count || 0,
    };
  }),

  /**
   * Executar todas as notificações automáticas
   */
  runAutomatedNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Verificar permissão (apenas admin)
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem executar notificações automáticas" });
    }

    // Executar notificações de testes concluídos
    const completedResult = await testNotificationsRouter.createCaller(ctx).notifyCompletedTests();

    // Executar lembretes de testes pendentes
    const remindersResult = await testNotificationsRouter.createCaller(ctx).sendPendingReminders();

    return {
      success: true,
      completed: completedResult,
      reminders: remindersResult,
      executedAt: new Date(),
    };
  }),
});
