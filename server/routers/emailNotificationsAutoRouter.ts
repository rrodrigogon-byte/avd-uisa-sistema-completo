import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { employees, users, employeeMovements, pdiPlans } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * Router de Notificações Automáticas por E-mail
 * Gerencia envio de e-mails para eventos importantes do sistema
 */
export const emailNotificationsAutoRouter = router({
  /**
   * Enviar notificação de movimentação de colaborador
   */
  sendMovementNotification: protectedProcedure
    .input(
      z.object({
        movementId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar movimentação
      const [movement] = await db
        .select()
        .from(employeeMovements)
        .where(eq(employeeMovements.id, input.movementId))
        .limit(1);

      if (!movement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Movimentação não encontrada",
        });
      }

      // Buscar dados do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, movement.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Colaborador não encontrado",
        });
      }

      // Buscar dados do gestor (se houver)
      let managerEmail = null;
      if (employee.managerId) {
        const [manager] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, employee.managerId))
          .limit(1);

        if (manager && manager.email) {
          managerEmail = manager.email;
        }
      }

      // Mapear tipos de movimentação
      const movementTypeLabels: Record<string, string> = {
        promocao: "Promoção",
        transferencia: "Transferência",
        mudanca_gestor: "Mudança de Gestor",
        mudanca_cargo: "Mudança de Cargo",
        ajuste_salarial: "Ajuste Salarial",
        desligamento: "Desligamento",
        admissao: "Admissão",
        retorno_afastamento: "Retorno de Afastamento",
        reorganizacao: "Reorganização",
        outro: "Outro",
      };

      const movementTypeLabel = movementTypeLabels[movement.movementType] || movement.movementType;

      // Template de e-mail para o colaborador
      const employeeEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Notificação de Movimentação</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${employee.name}</strong>,</p>
              <p>Informamos que foi registrada uma movimentação em seu cadastro:</p>
              
              <div class="info-box">
                <p><strong>Tipo de Movimentação:</strong> ${movementTypeLabel}</p>
                <p><strong>Data Efetiva:</strong> ${new Date(movement.effectiveDate).toLocaleDateString('pt-BR')}</p>
                ${movement.reason ? `<p><strong>Motivo:</strong> ${movement.reason}</p>` : ''}
                ${movement.notes ? `<p><strong>Observações:</strong> ${movement.notes}</p>` : ''}
              </div>
              
              <p>Esta movimentação está <strong>${movement.approvalStatus === 'aprovado' ? 'aprovada' : 'pendente de aprovação'}</strong>.</p>
              
              <p>Em caso de dúvidas, entre em contato com o RH.</p>
              
              <div class="footer">
                <p>Sistema AVD UISA - Gestão de Talentos</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar e-mail para o colaborador
      let employeeEmailSent = false;
      if (employee.email) {
        try {
          await sendEmail({
            to: employee.email,
            subject: `Notificação de Movimentação - ${movementTypeLabel}`,
            html: employeeEmailHtml,
          });
          employeeEmailSent = true;
        } catch (error) {
          console.error("Erro ao enviar e-mail para colaborador:", error);
        }
      }

      // Template de e-mail para o gestor
      const managerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Movimentação de Colaborador</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Informamos que foi registrada uma movimentação de um colaborador de sua equipe:</p>
              
              <div class="info-box">
                <p><strong>Colaborador:</strong> ${employee.name}</p>
                <p><strong>Tipo de Movimentação:</strong> ${movementTypeLabel}</p>
                <p><strong>Data Efetiva:</strong> ${new Date(movement.effectiveDate).toLocaleDateString('pt-BR')}</p>
                ${movement.reason ? `<p><strong>Motivo:</strong> ${movement.reason}</p>` : ''}
                <p><strong>Status:</strong> ${movement.approvalStatus === 'aprovado' ? 'Aprovado' : 'Pendente de Aprovação'}</p>
              </div>
              
              <p>Acesse o sistema para mais detalhes.</p>
              
              <div class="footer">
                <p>Sistema AVD UISA - Gestão de Talentos</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar e-mail para o gestor
      let managerEmailSent = false;
      if (managerEmail) {
        try {
          await sendEmail({
            to: managerEmail,
            subject: `Movimentação de Colaborador - ${employee.name}`,
            html: managerEmailHtml,
          });
          managerEmailSent = true;
        } catch (error) {
          console.error("Erro ao enviar e-mail para gestor:", error);
        }
      }

      return {
        success: true,
        employeeEmailSent,
        managerEmailSent,
      };
    }),

  /**
   * Enviar notificação de aprovação de PDI
   */
  sendPDIApprovalNotification: protectedProcedure
    .input(
      z.object({
        pdiId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar PDI
      const [pdi] = await db
        .select()
        .from(pdiPlans)
        .where(eq(pdiPlans.id, input.pdiId))
        .limit(1);

      if (!pdi) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PDI não encontrado",
        });
      }

      // Buscar dados do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, pdi.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Colaborador não encontrado",
        });
      }

      // Template de e-mail
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8b5cf6; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PDI Aprovado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${employee.name}</strong>,</p>
              <p>Seu Plano de Desenvolvimento Individual (PDI) foi aprovado!</p>
              
              <div class="info-box">
                <p><strong>Período:</strong> ${new Date(pdi.startDate).toLocaleDateString('pt-BR')} a ${new Date(pdi.endDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> Aprovado</p>
              </div>
              
              <p>Acesse o sistema para visualizar os detalhes do seu PDI e acompanhar o progresso das ações planejadas.</p>
              
              <div class="footer">
                <p>Sistema AVD UISA - Gestão de Talentos</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar e-mail
      let emailSent = false;
      if (employee.email) {
        try {
          await sendEmail({
            to: employee.email,
            subject: "Seu PDI foi aprovado!",
            html: emailHtml,
          });
          emailSent = true;
        } catch (error) {
          console.error("Erro ao enviar e-mail de aprovação de PDI:", error);
        }
      }

      return {
        success: true,
        emailSent,
      };
    }),

  /**
   * Enviar notificação de mudança organizacional
   */
  sendOrganizationalChangeNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
        affectedEmployeeIds: z.array(z.number()).optional(),
        sendToAll: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Buscar colaboradores afetados
      let targetEmployees = [];
      if (input.sendToAll) {
        targetEmployees = await db
          .select()
          .from(employees)
          .where(eq(employees.active, true));
      } else if (input.affectedEmployeeIds && input.affectedEmployeeIds.length > 0) {
        targetEmployees = await db
          .select()
          .from(employees)
          .where(
            and(
              eq(employees.active, true),
              // @ts-ignore - Drizzle ORM type issue
              sql`${employees.id} IN (${input.affectedEmployeeIds.join(",")})`
            )
          );
      }

      // Template de e-mail
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background-color: white; padding: 20px; margin: 15px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${input.title}</h1>
            </div>
            <div class="content">
              <div class="message-box">
                ${input.message.split('\n').map(line => `<p>${line}</p>`).join('')}
              </div>
              
              <p>Em caso de dúvidas, entre em contato com o RH.</p>
              
              <div class="footer">
                <p>Sistema AVD UISA - Gestão de Talentos</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar e-mails
      let sentCount = 0;
      for (const employee of targetEmployees) {
        if (employee.email) {
          try {
            await sendEmail({
              to: employee.email,
              subject: input.title,
              html: emailHtml,
            });
            sentCount++;
          } catch (error) {
            console.error(`Erro ao enviar e-mail para ${employee.email}:`, error);
          }
        }
      }

      return {
        success: true,
        totalEmployees: targetEmployees.length,
        emailsSent: sentCount,
      };
    }),
});
