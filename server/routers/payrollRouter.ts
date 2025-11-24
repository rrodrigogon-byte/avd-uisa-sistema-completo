import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { bonusCalculations } from "../../drizzle/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { isAdmin } from "../utils/permissions";

export const payrollRouter = router({
  /**
   * Confirma pagamento de bônus em lote
   */
  confirmPayment: protectedProcedure
    .input(z.object({
      bonusIds: z.array(z.number()).min(1, "Selecione pelo menos um bônus"),
      paymentDate: z.string(),
      paymentMethod: z.enum(["bank_transfer", "check", "cash", "payroll"]).default("payroll"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se é admin
      if (!(await isAdmin(ctx.user.id))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem confirmar pagamentos" });
      }

      try {
        // Verificar se todos os bônus estão aprovados
        const bonuses = await db.select()
          .from(bonusCalculations)
          .where(
            and(
              inArray(bonusCalculations.id, input.bonusIds),
              eq(bonusCalculations.status, 'aprovado')
            )
          );

        if (bonuses.length !== input.bonusIds.length) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Alguns bônus não estão aprovados ou não foram encontrados" 
          });
        }

        // Atualizar status para 'pago'
        await db.update(bonusCalculations)
          .set({
            status: 'pago',
            paidAt: new Date(input.paymentDate),
          })
          .where(inArray(bonusCalculations.id, input.bonusIds));

        // Calcular total
        const totalAmount = bonuses.reduce((sum, b) => sum + Number(b.bonusAmount), 0);

        return {
          success: true,
          confirmedCount: bonuses.length,
          totalAmount,
        };
      } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }),

  /**
   * Lista bônus pagos
   */
  getPaidBonuses: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const paid = await db.select()
        .from(bonusCalculations)
        .where(eq(bonusCalculations.status, 'pago'))
        .orderBy(sql`${bonusCalculations.paidAt} DESC`)
        .limit(input.limit)
        .offset(input.offset);

      return paid;
    }),

  /**
   * Cancela confirmação de pagamento (reverte para 'aprovado')
   */
  cancelPayment: protectedProcedure
    .input(z.object({
      bonusIds: z.array(z.number()).min(1),
      reason: z.string().min(10, "Motivo obrigatório (mínimo 10 caracteres)"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se é admin
      if (!(await isAdmin(ctx.user.id))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem cancelar pagamentos" });
      }

      try {
        // Reverter status para 'aprovado'
        await db.update(bonusCalculations)
          .set({
            status: 'aprovado',
            paidAt: null,
          })
          .where(
            and(
              inArray(bonusCalculations.id, input.bonusIds),
              eq(bonusCalculations.status, 'pago')
            )
          );

        return {
          success: true,
          canceledCount: input.bonusIds.length,
        };
      } catch (error) {
        console.error('Erro ao cancelar pagamento:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }),
});
