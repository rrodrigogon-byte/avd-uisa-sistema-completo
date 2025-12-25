/**
 * Sistema de Cache em Memória
 * 
 * Otimiza performance de queries frequentes armazenando resultados em memória
 * com TTL (Time To Live) configurável.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verifica se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Remove um valor do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove múltiplos valores do cache por padrão
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Instância singleton do cache
export const cache = new MemoryCache();

// Limpar cache expirado a cada 10 minutos
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

/**
 * Decorator para cachear resultados de funções
 */
export function cached<T>(
  keyPrefix: string,
  ttl?: number
): (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<T> {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Tentar buscar do cache
      const cachedResult = cache.get<T>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Executar função original
      const result = await originalMethod.apply(this, args);

      // Armazenar no cache
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper para invalidar cache relacionado a uma entidade
 */
export function invalidateEntityCache(entityType: string, entityId?: number): void {
  if (entityId) {
    cache.deletePattern(`${entityType}:.*${entityId}.*`);
  } else {
    cache.deletePattern(`${entityType}:.*`);
  }
}

/**
 * Chaves de cache comuns
 */
export const CacheKeys = {
  employees: (id?: number) => id ? `employees:${id}` : 'employees:list',
  departments: (id?: number) => id ? `departments:${id}` : 'departments:list',
  positions: (id?: number) => id ? `positions:${id}` : 'positions:list',
  cycles: (id?: number) => id ? `cycles:${id}` : 'cycles:list',
  goals: (employeeId: number) => `goals:employee:${employeeId}`,
  evaluations: (employeeId: number) => `evaluations:employee:${employeeId}`,
  stats: (type: string) => `stats:${type}`,
};
