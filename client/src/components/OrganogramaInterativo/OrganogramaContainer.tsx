import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import OrganogramaTree from "./OrganogramaTree";
import OrganogramaFilters from "./OrganogramaFilters";
import OrganogramaToolbar from "./OrganogramaToolbar";
import OrganogramaLegend from "./OrganogramaLegend";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  managerId: number | null;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionTitle: string | null;
  photoUrl: string | null;
  hierarchyLevel: string | null;
  active: boolean;
  level?: number;
  subordinates?: Employee[];
  subordinateCount?: number;
  totalTeamSize?: number;
}

export interface HierarchyStats {
  totalEmployees: number;
  byLevel: Record<string, number>;
  byDepartment: Record<string, number>;
  maxDepth: number;
  avgSpanOfControl: number;
}

export default function OrganogramaContainer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Buscar hierarquia completa
  const { data, isLoading, refetch } = trpc.orgChart.getFullHierarchy.useQuery({});
  
  // Mutation para mover funcionário
  const moveEmployeeMutation = trpc.orgChart.moveEmployeeInHierarchy.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => toast.warning(warning));
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao mover funcionário: ${error.message}`);
    }
  });

  // Validar movimentação
  const validateMoveMutation = trpc.orgChart.validateHierarchyMove.useQuery(
    {
      employeeId: 0,
      newManagerId: null,
    },
    {
      enabled: false,
    }
  );

  const handleDrop = async (draggedId: number, targetId: number) => {
    // Validar movimentação
    const validation = await validateMoveMutation.refetch({
      employeeId: draggedId,
      newManagerId: targetId,
    });

    if (!validation.data?.valid) {
      toast.error(`Movimentação inválida: ${validation.data?.errors.join(", ")}`);
      return;
    }

    // Confirmar com usuário
    const draggedEmployee = findEmployeeById(data?.tree || [], draggedId);
    const targetEmployee = findEmployeeById(data?.tree || [], targetId);

    if (!draggedEmployee || !targetEmployee) {
      toast.error("Funcionário não encontrado");
      return;
    }

    const confirmed = window.confirm(
      `Deseja mover ${draggedEmployee.name} para reportar a ${targetEmployee.name}?`
    );

    if (!confirmed) return;

    // Executar movimentação
    moveEmployeeMutation.mutate({
      employeeId: draggedId,
      newManagerId: targetId,
      changeType: "ajuste_hierarquico",
      reason: "Movimentação via organograma interativo",
    });
  };

  const findEmployeeById = (tree: Employee[], id: number): Employee | null => {
    for (const emp of tree) {
      if (emp.id === id) return emp;
      if (emp.subordinates && emp.subordinates.length > 0) {
        const found = findEmployeeById(emp.subordinates, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (employees: Employee[]) => {
      safeMap(employees, emp => {
        allIds.add(emp.id);
        if (emp.subordinates) {
          collectIds(emp.subordinates);
        }
      });
    };
    if (data?.tree) {
      collectIds(data.tree);
    }
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando organograma...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || isEmpty(data.tree)) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum dado de hierarquia encontrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {/* Header com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalEmployees}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Profundidade Máxima</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.maxDepth} níveis</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Span of Control Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.avgSpanOfControl}</div>
              <p className="text-xs text-muted-foreground">subordinados por gestor</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(data.timestamp).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <OrganogramaToolbar
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onRefresh={() => refetch()}
          onExport={() => toast.info("Exportação em desenvolvimento")}
        />

        {/* Filtros */}
        <OrganogramaFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          levelFilter={levelFilter}
          onLevelChange={setLevelFilter}
          departments={Object.keys(data.stats.byDepartment)}
        />

        {/* Legenda */}
        <OrganogramaLegend />

        {/* Árvore hierárquica */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <OrganogramaTree
                employees={data.tree}
                expandedNodes={expandedNodes}
                onToggleNode={toggleNode}
                onDrop={handleDrop}
                searchTerm={searchTerm}
                departmentFilter={departmentFilter}
                levelFilter={levelFilter}
                onSelectEmployee={setSelectedEmployee}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
}
