import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { safeMap } from "@/lib/arrayHelpers";

interface OrganogramaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  levelFilter: string;
  onLevelChange: (value: string) => void;
  departments: string[];
}

const HIERARCHY_LEVELS = [
  { value: "all", label: "Todos os níveis" },
  { value: "diretoria", label: "Diretoria" },
  { value: "gerencia", label: "Gerência" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "supervisao", label: "Supervisão" },
  { value: "operacional", label: "Operacional" },
];

export default function OrganogramaFilters({
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  levelFilter,
  onLevelChange,
  departments,
}: OrganogramaFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, código, cargo..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro de Departamento */}
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select value={departmentFilter} onValueChange={onDepartmentChange}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {safeMap(departments, (dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Nível */}
          <div className="space-y-2">
            <Label htmlFor="level">Nível Hierárquico</Label>
            <Select value={levelFilter} onValueChange={onLevelChange}>
              <SelectTrigger id="level">
                <SelectValue placeholder="Selecione um nível" />
              </SelectTrigger>
              <SelectContent>
                {safeMap(HIERARCHY_LEVELS, (level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
