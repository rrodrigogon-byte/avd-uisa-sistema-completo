/**
 * Helpers para parse seguro de campos JSON armazenados como text() no banco
 * 
 * Alguns campos no schema usam text() ao invés de json() para armazenar JSON.
 * Esses campos precisam de parse manual antes de serem enviados ao frontend.
 */

/**
 * Faz parse seguro de um campo JSON string para objeto/array
 * Retorna defaultValue se o parse falhar ou o valor for null/undefined
 */
export function safeJSONParse<T = any>(value: any, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string') {
    // Se já é um objeto/array, retorna direto
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[safeJSONParse] Erro ao fazer parse de JSON:', error);
    return defaultValue;
  }
}

/**
 * Faz parse seguro de campo options (sempre retorna array)
 */
export function parseOptions(options: any): any[] {
  return safeJSONParse(options, []);
}

/**
 * Faz parse seguro de campo config (sempre retorna objeto)
 */
export function parseConfig(config: any): Record<string, any> {
  return safeJSONParse(config, {});
}

/**
 * Processa um array de registros fazendo parse de campos JSON específicos
 * 
 * @param records - Array de registros do banco
 * @param jsonFields - Array de nomes de campos que precisam de parse
 * @param defaultValues - Objeto com valores padrão para cada campo (opcional)
 * @returns Array de registros com campos parseados
 */
export function parseJSONFields<T extends Record<string, any>>(
  records: T[],
  jsonFields: string[],
  defaultValues: Record<string, any> = {}
): T[] {
  return records.map(record => {
    const parsed = { ...record };
    
    jsonFields.forEach(field => {
      if (field in parsed) {
        const defaultValue = defaultValues[field] ?? (Array.isArray(parsed[field]) ? [] : {});
        parsed[field] = safeJSONParse(parsed[field], defaultValue);
      }
    });
    
    return parsed;
  });
}

/**
 * Processa um único registro fazendo parse de campos JSON específicos
 */
export function parseJSONFieldsSingle<T extends Record<string, any>>(
  record: T | null | undefined,
  jsonFields: string[],
  defaultValues: Record<string, any> = {}
): T | null {
  if (!record) return null;
  
  const parsed = { ...record };
  
  jsonFields.forEach(field => {
    if (field in parsed) {
      const defaultValue = defaultValues[field] ?? (Array.isArray(parsed[field]) ? [] : {});
      parsed[field] = safeJSONParse(parsed[field], defaultValue);
    }
  });
  
  return parsed;
}
