import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook customizado para busca de funcionários com debounce
 * 
 * Encapsula a lógica de busca server-side com debounce para evitar
 * carregar todos os funcionários de uma vez e melhorar performance.
 * 
 * @param initialSearch - Termo de busca inicial (opcional)
 * @param debounceMs - Tempo de debounce em ms (padrão: 300ms)
 * @param filters - Filtros adicionais (departmentId, positionId, status)
 * @returns Objeto com dados, loading, search state e setters
 * 
 * @example
 * ```tsx
 * const { employees, isLoading, search, setSearch } = useEmployeeSearch();
 * 
 * <CommandInput 
 *   placeholder="Buscar funcionário..."
 *   value={search}
 *   onValueChange={setSearch}
 * />
 * ```
 */
export function useEmployeeSearch(
  initialSearch = "",
  debounceMs = 300,
  filters?: {
    departmentId?: number;
    positionId?: number;
    status?: "ativo" | "afastado" | "desligado";
  }
) {
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  // Query com busca e filtros
  const { data: employees, isLoading } = trpc.employees.list.useQuery(
    debouncedSearch || filters ? {
      search: debouncedSearch || undefined,
      ...filters,
    } : undefined
  );

  return {
    employees,
    isLoading,
    search,
    setSearch,
    debouncedSearch,
  };
}
