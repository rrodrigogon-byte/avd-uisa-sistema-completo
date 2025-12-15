import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Building2 } from "lucide-react";

interface CostCenterFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showLabel?: boolean;
}

/**
 * Componente de filtro por centro de custos
 * Reutilizável em múltiplos dashboards
 */
export function CostCenterFilter({ 
  value, 
  onChange, 
  label = "Centro de Custos",
  showLabel = true 
}: CostCenterFilterProps) {
  // Buscar centros de custos
  const { data: costCenters, isLoading } = trpc.costCenters.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor="cost-center-filter" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="cost-center-filter" className="w-full md:w-[280px]">
          <SelectValue placeholder="Selecione um centro de custos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-semibold">📊 Todos os Centros de Custos</span>
          </SelectItem>
          {costCenters && costCenters.length > 0 ? (
            costCenters.map((cc: any) => (
              <SelectItem key={cc.id} value={cc.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{cc.code}</span>
                  <span className="text-xs text-muted-foreground">{cc.name}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              Nenhum centro de custos encontrado
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
