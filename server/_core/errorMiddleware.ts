/**
 * Middleware de captura de erros para tRPC
 * Registra todos os erros que ocorrem nas procedures
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

/**
 * Middleware que captura e registra erros
 */
export const errorLoggingMiddleware = async (opts: any) => {
  const { next, ctx, path, type } = opts;
  
  const start = Date.now();
  
  try {
    const result = await next();
    
    // Log de sucesso (apenas em debug)
    const duration = Date.now() - start;
    logger.debug(`[tRPC] ${type} ${path} - ${duration}ms`, {
      userId: ctx.user?.id,
      duration,
    });
    
    return result;
  } catch (error) {
    // Log de erro
    const duration = Date.now() - start;
    
    if (error instanceof TRPCError) {
      logger.errorWithUser(
        `[tRPC Error] ${type} ${path} - ${error.code}`,
        ctx.user?.id || 0,
        error,
        {
          code: error.code,
          duration,
          path,
          type,
        }
      );
    } else if (error instanceof Error) {
      logger.errorWithUser(
        `[tRPC Error] ${type} ${path} - Unexpected Error`,
        ctx.user?.id || 0,
        error,
        {
          duration,
          path,
          type,
        }
      );
    } else {
      logger.error(`[tRPC Error] ${type} ${path} - Unknown Error`, undefined, {
        error: String(error),
        duration,
        path,
        type,
        userId: ctx.user?.id,
      });
    }
    
    // Re-throw para que o tRPC possa tratar normalmente
    throw error;
  }
};
