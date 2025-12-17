/**
 * Helper functions para operações seguras em arrays
 * Previne erros quando dados são undefined/null
 */

/**
 * Executa map de forma segura, retornando array vazio se o input for inválido
 * @param array - Array para mapear (pode ser undefined/null)
 * @param callback - Função de mapeamento
 * @returns Array mapeado ou array vazio
 */
export function safeMap<T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R
): R[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.map(callback);
}

/**
 * Executa filter de forma segura, retornando array vazio se o input for inválido
 * @param array - Array para filtrar (pode ser undefined/null)
 * @param callback - Função de filtro
 * @returns Array filtrado ou array vazio
 */
export function safeFilter<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.filter(callback);
}

/**
 * Executa find de forma segura, retornando undefined se o input for inválido
 * @param array - Array para buscar (pode ser undefined/null)
 * @param callback - Função de busca
 * @returns Item encontrado ou undefined
 */
export function safeFind<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean
): T | undefined {
  if (!Array.isArray(array)) {
    return undefined;
  }
  return array.find(callback);
}

/**
 * Executa reduce de forma segura, retornando o valor inicial se o input for inválido
 * @param array - Array para reduzir (pode ser undefined/null)
 * @param callback - Função de redução
 * @param initialValue - Valor inicial
 * @returns Valor reduzido ou valor inicial
 */
export function safeReduce<T, R>(
  array: T[] | undefined | null,
  callback: (accumulator: R, current: T, index: number, array: T[]) => R,
  initialValue: R
): R {
  if (!Array.isArray(array)) {
    return initialValue;
  }
  return array.reduce(callback, initialValue);
}

/**
 * Executa forEach de forma segura, não faz nada se o input for inválido
 * @param array - Array para iterar (pode ser undefined/null)
 * @param callback - Função de iteração
 */
export function safeForEach<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => void
): void {
  if (!Array.isArray(array)) {
    return;
  }
  array.forEach(callback);
}

/**
 * Executa some de forma segura, retornando false se o input for inválido
 * @param array - Array para verificar (pode ser undefined/null)
 * @param callback - Função de verificação
 * @returns true se algum item atende a condição, false caso contrário
 */
export function safeSome<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean
): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  return array.some(callback);
}

/**
 * Executa every de forma segura, retornando true se o input for inválido (vacuously true)
 * @param array - Array para verificar (pode ser undefined/null)
 * @param callback - Função de verificação
 * @returns true se todos os itens atendem a condição, true para array vazio/inválido
 */
export function safeEvery<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean
): boolean {
  if (!Array.isArray(array)) {
    return true;
  }
  return array.every(callback);
}

/**
 * Retorna o comprimento do array de forma segura
 * @param array - Array para verificar (pode ser undefined/null)
 * @returns Comprimento do array ou 0
 */
export function safeLength(array: any[] | undefined | null): number {
  if (!Array.isArray(array)) {
    return 0;
  }
  return array.length;
}

/**
 * Verifica se o array está vazio ou inválido
 * @param array - Array para verificar (pode ser undefined/null)
 * @returns true se o array for vazio, undefined ou null
 */
export function isEmpty(array: any[] | undefined | null): boolean {
  return !Array.isArray(array) || array.length === 0;
}

/**
 * Retorna o array ou um array vazio se for inválido
 * @param array - Array para normalizar (pode ser undefined/null)
 * @returns Array original ou array vazio
 */
export function ensureArray<T>(array: T[] | undefined | null): T[] {
  return Array.isArray(array) ? array : [];
}
