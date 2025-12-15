/**
 * Sistema de Logs e Monitoramento
 * 
 * Centraliza logging e métricas para facilitar debugging e análise de performance
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: number;
  requestId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private minLevel: LogLevel = LogLevel.INFO;

  /**
   * Configura nível mínimo de log
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Registra um log
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    userId?: number,
    requestId?: string
  ): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      userId,
      requestId,
    };

    this.logs.push(entry);

    // Limitar tamanho do array
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Imprimir no console
    this.printLog(entry);
  }

  /**
   * Imprime log no console com formatação
   */
  private printLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;

    const logData = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    const fullMessage = `${prefix} ${entry.message}${logData}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage);
        break;
      case LogLevel.INFO:
        console.info(fullMessage);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(fullMessage);
        break;
    }
  }

  /**
   * Log de debug
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log de informação
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log de aviso
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log de erro
   */
  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log crítico
   */
  critical(category: string, message: string, data?: any): void {
    this.log(LogLevel.CRITICAL, category, message, data);
  }

  /**
   * Busca logs por filtros
   */
  query(filters: {
    level?: LogLevel;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filters.level !== undefined) {
      filtered = filtered.filter(log => log.level >= filters.level!);
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    const limit = filters.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Retorna estatísticas de logs
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
    };
  }

  /**
   * Limpa todos os logs
   */
  clear(): void {
    this.logs = [];
  }
}

// Instância singleton do logger
export const logger = new Logger();

/**
 * Métricas de performance
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Registra uma métrica de tempo
   */
  recordTime(operation: string, durationMs: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const times = this.metrics.get(operation)!;
    times.push(durationMs);

    // Manter apenas últimas 1000 medições
    if (times.length > 1000) {
      times.shift();
    }
  }

  /**
   * Retorna estatísticas de uma operação
   */
  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Retorna todas as métricas
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const operation of this.metrics.keys()) {
      result[operation] = this.getStats(operation);
    }

    return result;
  }

  /**
   * Limpa métricas
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Instância singleton do monitor de performance
export const perfMonitor = new PerformanceMonitor();

/**
 * Decorator para medir tempo de execução
 */
export function measureTime(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        perfMonitor.recordTime(operation, duration);
        
        if (duration > 1000) {
          logger.warn("Performance", `${operation} demorou ${duration}ms`, {
            operation,
            duration,
            args: args.length,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        perfMonitor.recordTime(`${operation}:error`, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper para criar contexto de request com ID único
 */
export function createRequestContext(): {
  requestId: string;
  startTime: number;
} {
  return {
    requestId: Math.random().toString(36).substring(7),
    startTime: Date.now(),
  };
}

/**
 * Helper para finalizar contexto de request
 */
export function finishRequestContext(
  context: { requestId: string; startTime: number },
  operation: string
): void {
  const duration = Date.now() - context.startTime;
  perfMonitor.recordTime(operation, duration);
  
  logger.info("Request", `${operation} completed`, {
    requestId: context.requestId,
    duration,
  });
}
