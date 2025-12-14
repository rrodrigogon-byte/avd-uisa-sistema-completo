import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  resultCount?: number;
}

export default function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  resultCount,
}: FilterBarProps) {
  const activeFilterCount = Object.values(activeFilters).filter(v => v !== 'todos').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Campo de busca */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Filtros */}
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || 'todos'}
            onValueChange={(value) => onFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.placeholder || filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Botão limpar filtros */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Indicadores de filtros ativos e contagem de resultados */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterCount > 0 && (
            <>
              <span className="text-muted-foreground">Filtros ativos:</span>
              {Object.entries(activeFilters).map(([key, value]) => {
                if (value === 'todos') return null;
                const filter = filters.find(f => f.key === key);
                const option = filter?.options.find(o => o.value === value);
                return (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {filter?.label}: {option?.label || value}
                    <button
                      onClick={() => onFilterChange(key, 'todos')}
                      className="ml-1 hover:bg-muted rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </>
          )}
        </div>
        
        {resultCount !== undefined && (
          <span className="text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>
    </div>
  );
}
