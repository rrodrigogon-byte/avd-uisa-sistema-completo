/**
 * Sistema de Logging Centralizado
 * Captura erros e eventos importantes do sistema
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: number;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Formata a entrada de log para exibição
   */
  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const userId = entry.userId ? `[User:${entry.userId}]` : "";
    const requestId = entry.requestId ? `[Req:${entry.requestId}]` : "";
    
    let message = `[${timestamp}] ${level} ${userId}${requestId} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (this.isDevelopment && entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  /**
   * Registra uma entrada de log
   */
  private log(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);
    
    switch (entry.level) {
      case "error":
        console.error(formattedLog);
        // Em produção, aqui você pode enviar para serviço externo
        // como Sentry, LogRocket, DataDog, etc.
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
      case "info":
      default:
        console.log(formattedLog);
        break;
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date(),
      level: "info",
      message,
      context,
    });
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date(),
      level: "warn",
      message,
      context,
    });
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date(),
      level: "error",
      message,
      error,
      context,
    });
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date(),
      level: "debug",
      message,
      context,
    });
  }

  /**
   * Log de erro com contexto de usuário
   */
  errorWithUser(
    message: string,
    userId: number,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date(),
      level: "error",
      message,
      error,
      context,
      userId,
    });
  }

  /**
   * Log de erro com contexto de requisição
   */
  errorWithRequest(
    message: string,
    requestId: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date(),
      level: "error",
      message,
      error,
      context,
      requestId,
    });
  }
}

// Exportar instância singleton
export const logger = new Logger();
