import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e inputs que disparam queries
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 300ms)
 * @returns Valor debounced
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * // Query só é executada após 500ms sem mudanças
 * const { data } = trpc.employees.list.useQuery({ search: debouncedSearch });
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
