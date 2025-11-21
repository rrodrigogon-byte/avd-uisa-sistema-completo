import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../utils/emailService";

/**
 * Router de Administração
 * Endpoints para configurações do sistema (SMTP, etc)
 */
export const adminRouter = router({
  /**
   * Obter configurações SMTP
   */
  getSmtpConfig: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas administradores podem acessar configurações SMTP',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Banco de dados não disponível',
      });
    }

    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, 'smtp_config'))
      .limit(1);

    if (settings.length === 0) {
      return null;
    }

      const settingValue = settings[0].settingValue;
      if (!settingValue) return null;
      
      const config = JSON.parse(settingValue);
    
    // Não retornar senha completa por segurança
    return {
      ...config,
      pass: config.pass ? '••••••••' : '',
    };
  }),

  /**
   * Salvar configurações SMTP
   */
  saveSmtpConfig: protectedProcedure
    .input(
      z.object({
        host: z.string().min(1, 'Host é obrigatório'),
        port: z.number().int().positive(),
        secure: z.boolean(),
        user: z.string().email('Email inválido'),
        pass: z.string().min(1, 'Senha é obrigatória'),
        fromName: z.string().min(1, 'Nome do remetente é obrigatório'),
        fromEmail: z.string().email('Email do remetente inválido'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem salvar configurações SMTP',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      const configValue = JSON.stringify(input);

      // Verificar se já existe configuração
      const existing = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, 'smtp_config'))
        .limit(1);

      if (existing.length > 0) {
        // Atualizar
        await db
          .update(systemSettings)
          .set({
            settingValue: configValue,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.settingKey, 'smtp_config'));
      } else {
        // Inserir
        await db.insert(systemSettings).values({
          settingKey: 'smtp_config',
          settingValue: configValue,
        });
      }

      return { success: true };
    }),

  /**
   * Enviar email de teste
   */
  sendTestEmail: protectedProcedure
    .input(
      z.object({
        to: z.string().email('Email inválido'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem enviar emails de teste',
        });
      }

      try {
        await sendEmail(
          input.to,
          '✅ Teste de Configuração SMTP - Sistema AVD UISA',
          `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-icon { font-size: 48px; margin-bottom: 10px; }
                .info-box { background: white; padding: 20px; border-left: 4px solid #f97316; margin: 20px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="success-icon">✅</div>
                  <h1 style="margin: 0;">Configuração SMTP Funcionando!</h1>
                </div>
                <div class="content">
                  <p>Olá,</p>
                  <p>Este é um <strong>email de teste</strong> do Sistema AVD UISA.</p>
                  
                  <div class="info-box">
                    <h3 style="margin-top: 0; color: #f97316;">✓ Configurações Validadas</h3>
                    <p style="margin: 0;">Se você recebeu este email, significa que suas configurações SMTP estão corretas e o sistema está pronto para enviar notificações automáticas.</p>
                  </div>

                  <p><strong>O que acontece agora?</strong></p>
                  <ul>
                    <li>Lembretes de metas pendentes serão enviados automaticamente</li>
                    <li>Notificações de avaliações 360° serão distribuídas</li>
                    <li>Convites de Pesquisas Pulse chegarão aos colaboradores</li>
                    <li>Alertas de PDI vencidos manterão todos informados</li>
                  </ul>

                  <p>Caso tenha alguma dúvida, entre em contato com o suporte técnico.</p>
                  
                  <p>Atenciosamente,<br><strong>Equipe Sistema AVD UISA</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um email automático do Sistema AVD UISA de Avaliação de Desempenho</p>
                  <p>Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </body>
            </html>
          `
        );

        return {
          success: true,
          message: `Email de teste enviado com sucesso para ${input.to}`,
        };
      } catch (error: any) {
        console.error('[Admin] Erro ao enviar email de teste:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao enviar email: ${error.message || 'Erro desconhecido'}`,
        });
      }
    }),
});
