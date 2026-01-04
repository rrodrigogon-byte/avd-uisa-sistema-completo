/**
 * Utilitários para operações seguras com Object
 * Previne erros "Cannot convert undefined or null to object"
 */

/**
 * Versão segura de Object.keys que não quebra com null/undefined
 */
export function safeObjectKeys<T extends object>(obj: T | null | undefined): string[] {
  if (obj == null) return [];
  return Object.keys(obj);
}

/**
 * Versão segura de Object.entries que não quebra com null/undefined
 */
export function safeObjectEntries<T extends object>(
  obj: T | null | undefined
): [string, any][] {
  if (obj == null) return [];
  return Object.entries(obj);
}

/**
 * Versão segura de Object.values que não quebra com null/undefined
 */
export function safeObjectValues<T extends object>(obj: T | null | undefined): any[] {
  if (obj == null) return [];
  return Object.values(obj);
}

/**
 * Garante que um valor seja um objeto válido
 */
export function ensureObject<T extends object>(obj: T | null | undefined): T | {} {
  return obj ?? {};
}
