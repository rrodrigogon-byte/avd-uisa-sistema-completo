/**
 * Router para monitoramento de erros
 * Permite visualizar estatísticas de erros e logs
 */

import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { logger } from "./_core/logger";

// Em produção, você pode armazenar logs em banco de dados
// Por enquanto, mantemos em memória (apenas para demonstração)
const errorLogs: Array<{
  id: number;
  timestamp: Date;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: number;
}> = [];

let errorLogIdCounter = 1;

/**
 * Função para adicionar log (chamada pelo sistema de logging)
 */
export function addErrorLog(
  level: string,
  message: string,
  context?: Record<string, any>,
  userId?: number
): void {
  errorLogs.push({
    id: errorLogIdCounter++,
    timestamp: new Date(),
    level,
    message,
    context,
    userId,
  });
  
  // Manter apenas os últimos 1000 logs em memória
  if (errorLogs.length > 1000) {
    errorLogs.shift();
  }
}

export const errorMonitoringRouter = router({
  /**
   * Registrar erro do frontend
   */
  logClientError: publicProcedure
    .input(
      z.object({
        message: z.string(),
        stack: z.string().optional(),
        url: z.string().optional(),
        userAgent: z.string().optional(),
        context: z.record(z.any()).optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      logger.errorWithUser(
        `[Client Error] ${input.message}`,
        ctx.user?.id || 0,
        undefined,
        {
          stack: input.stack,
          url: input.url,
          userAgent: input.userAgent,
          ...input.context,
        }
      );
      
      addErrorLog(
        "error",
        `[Client] ${input.message}`,
        {
          stack: input.stack,
          url: input.url,
          userAgent: input.userAgent,
          ...input.context,
        },
        ctx.user?.id
      );
      
      return { success: true };
    }),

  /**
   * Obter estatísticas de erros (apenas admin)
   */
  getErrorStats: adminProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(({ input }) => {
      const startDate = input?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // últimas 24h
      const endDate = input?.endDate || new Date();
      
      const filteredLogs = errorLogs.filter(
        (log) => log.timestamp >= startDate && log.timestamp <= endDate
      );
      
      const totalErrors = filteredLogs.filter((log) => log.level === "error").length;
      const totalWarnings = filteredLogs.filter((log) => log.level === "warn").length;
      const totalInfo = filteredLogs.filter((log) => log.level === "info").length;
      
      // Agrupar erros por mensagem
      const errorsByMessage: Record<string, number> = {};
      filteredLogs
        .filter((log) => log.level === "error")
        .forEach((log) => {
          const key = log.message.split(" - ")[0]; // Pegar apenas a parte principal
          errorsByMessage[key] = (errorsByMessage[key] || 0) + 1;
        });
      
      // Top 10 erros mais frequentes
      const topErrors = Object.entries(errorsByMessage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([message, count]) => ({ message, count }));
      
      return {
        totalErrors,
        totalWarnings,
        totalInfo,
        totalLogs: filteredLogs.length,
        topErrors,
        timeRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),

  /**
   * Obter logs recentes (apenas admin)
   */
  getRecentLogs: adminProcedure
    .input(
      z.object({
        level: z.enum(["error", "warn", "info", "debug", "all"]).optional().default("all"),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    .optional())
    .query(({ input }) => {
      let filteredLogs = errorLogs;
      
      if (input.level !== "all") {
        filteredLogs = errorLogs.filter((log) => log.level === input.level);
      }
      
      // Retornar logs mais recentes primeiro
      return filteredLogs
        .slice()
        .reverse()
        .slice(0, input.limit)
        .map((log) => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        }));
    }),

  /**
   * Limpar logs antigos (apenas admin)
   */
  clearOldLogs: adminProcedure
    .input(
      z.object({
        olderThan: z.date(),
      })
    )
    .mutation(({ input }) => {
      const initialLength = errorLogs.length;
      
      // Remover logs mais antigos que a data especificada
      let i = errorLogs.length;
      while (i--) {
        if (errorLogs[i].timestamp < input.olderThan) {
          errorLogs.splice(i, 1);
        }
      }
      
      const removedCount = initialLength - errorLogs.length;
      
      logger.info(`[Error Monitoring] Cleared ${removedCount} old logs`);
      
      return {
        success: true,
        removedCount,
        remainingCount: errorLogs.length,
      };
    }),
});
