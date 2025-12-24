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

/**
 * Executa sort de forma segura, retornando array vazio se o input for inválido
 * @param array - Array para ordenar (pode ser undefined/null)
 * @param compareFn - Função de comparação
 * @returns Array ordenado ou array vazio
 */
export function safeSort<T>(
  array: T[] | undefined | null,
  compareFn?: (a: T, b: T) => number
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  // Criar cópia para não mutar o original
  return [...array].sort(compareFn);
}

/**
 * Retorna o primeiro elemento do array de forma segura
 * @param array - Array para acessar (pode ser undefined/null)
 * @returns Primeiro elemento ou undefined
 */
export function safeFirst<T>(array: T[] | undefined | null): T | undefined {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  return array[0];
}

/**
 * Retorna o último elemento do array de forma segura
 * @param array - Array para acessar (pode ser undefined/null)
 * @returns Último elemento ou undefined
 */
export function safeLast<T>(array: T[] | undefined | null): T | undefined {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  return array[array.length - 1];
}

/**
 * Executa slice de forma segura, retornando array vazio se o input for inválido
 * @param array - Array para fatiar (pode ser undefined/null)
 * @param start - Índice inicial
 * @param end - Índice final (opcional)
 * @returns Array fatiado ou array vazio
 */
export function safeSlice<T>(
  array: T[] | undefined | null,
  start?: number,
  end?: number
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.slice(start, end);
}

/**
 * Executa join de forma segura, retornando string vazia se o input for inválido
 * @param array - Array para juntar (pode ser undefined/null)
 * @param separator - Separador (padrão: ",")
 * @returns String concatenada ou string vazia
 */
export function safeJoin(
  array: any[] | undefined | null,
  separator: string = ","
): string {
  if (!Array.isArray(array)) {
    return "";
  }
  return array.join(separator);
}

/**
 * Executa includes de forma segura, retornando false se o input for inválido
 * @param array - Array para verificar (pode ser undefined/null)
 * @param searchElement - Elemento a buscar
 * @returns true se o elemento existe, false caso contrário
 */
export function safeIncludes<T>(
  array: T[] | undefined | null,
  searchElement: T
): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  return array.includes(searchElement);
}

/**
 * Executa indexOf de forma segura, retornando -1 se o input for inválido
 * @param array - Array para buscar (pode ser undefined/null)
 * @param searchElement - Elemento a buscar
 * @returns Índice do elemento ou -1
 */
export function safeIndexOf<T>(
  array: T[] | undefined | null,
  searchElement: T
): number {
  if (!Array.isArray(array)) {
    return -1;
  }
  return array.indexOf(searchElement);
}

/**
 * Retorna um elemento do array por índice de forma segura
 * @param array - Array para acessar (pode ser undefined/null)
 * @param index - Índice do elemento
 * @returns Elemento no índice ou undefined
 */
export function safeAt<T>(
  array: T[] | undefined | null,
  index: number
): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Executa flatMap de forma segura, retornando array vazio se o input for inválido
 * @param array - Array para mapear e achatar (pode ser undefined/null)
 * @param callback - Função de mapeamento
 * @returns Array mapeado e achatado ou array vazio
 */
export function safeFlatMap<T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R | R[]
): R[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.flatMap(callback);
}

/**
 * Remove duplicatas de um array de forma segura
 * @param array - Array para remover duplicatas (pode ser undefined/null)
 * @returns Array sem duplicatas ou array vazio
 */
export function safeUnique<T>(array: T[] | undefined | null): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return [...new Set(array)];
}

/**
 * Agrupa elementos de um array por uma chave de forma segura
 * @param array - Array para agrupar (pode ser undefined/null)
 * @param keyFn - Função que retorna a chave de agrupamento
 * @returns Objeto com elementos agrupados ou objeto vazio
 */
export function safeGroupBy<T, K extends string | number>(
  array: T[] | undefined | null,
  keyFn: (item: T) => K
): Record<K, T[]> {
  if (!Array.isArray(array)) {
    return {} as Record<K, T[]>;
  }
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Valida se o valor é um array válido e não vazio
 * @param value - Valor para validar
 * @returns true se for array válido e não vazio
 */
export function isValidArray(value: any): value is any[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Converte qualquer valor em array de forma segura
 * @param value - Valor para converter
 * @returns Array contendo o valor ou array vazio
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
