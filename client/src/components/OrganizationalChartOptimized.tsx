import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Search,
  Filter,
  Users,
  Building2,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";
import { trpc } from "@/lib/trpc";

interface Employee {
  id: number;
  name: string;
  email: string | null;
  chapa: string | null;
  departmentId: number | null;
  positionId: number | null;
  managerId: number | null;
  cargo?: string | null;
  departamento?: string | null;
  telefone?: string | null;
}

interface HierarchyNode extends Employee {
  children: HierarchyNode[];
  hasChildren?: boolean;
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface OrganizationalChartOptimizedProps {
  departments?: Array<{ id: number; name: string }>;
  positions?: Array<{ id: number; title: string }>;
}

export function OrganizationalChartOptimized({
  departments = [],
  positions = [],
}: OrganizationalChartOptimizedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 100;
  const chartRef = useRef<HTMLDivElement>(null);

  // Buscar funcionários com paginação e filtros avançados
  const { data: employeesData, isLoading } = trpc.employees.list.useQuery({
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
    positionId: selectedPosition !== "all" ? parseInt(selectedPosition) : undefined,
    search: searchTerm || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const employees = employeesData?.employees || [];
  const total = employeesData?.total || 0;
  const hasMore = employeesData?.hasMore || false;

  // Construir árvore hierárquica com lazy loading
  const hierarchyTree = useMemo(() => {
    // Criar mapa de funcionários
    const employeeMap = new Map<number, HierarchyNode>();
    employees.forEach((emp) => {
      const hasChildren = employees.some((e) => e.managerId === emp.id);
      employeeMap.set(emp.id, {
        ...emp,
        children: [],
        hasChildren,
        isExpanded: expandedNodes.has(emp.id),
        isLoading: false,
      });
    });

    // Construir árvore apenas com nós expandidos
    const roots: HierarchyNode[] = [];
    employeeMap.forEach((node) => {
      if (node.managerId && employeeMap.has(node.managerId)) {
        const parent = employeeMap.get(node.managerId)!;
        // Adicionar apenas se o pai está expandido
        if (parent.isExpanded || expandedNodes.has(parent.id)) {
          parent.children.push(node);
        }
      } else {
        // Nós raiz (sem gestor)
        roots.push(node);
      }
    });

    return roots;
  }, [employees, expandedNodes]);

  // Toggle expansão de nó
  const toggleNode = useCallback((nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Verificar se nó corresponde aos filtros ativos
  const matchesFilters = (node: HierarchyNode): boolean => {
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedDepartment !== "all" && node.departmentId !== parseInt(selectedDepartment)) {
      return false;
    }
    if (selectedPosition !== "all" && node.positionId !== parseInt(selectedPosition)) {
      return false;
    }
    return true;
  };

  // Renderizar nó individual
  const renderNode = (node: HierarchyNode) => {
    const department = departments.find((d) => d.id === node.departmentId);
    const position = positions.find((p) => p.id === node.positionId);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedEmployee === node.id;
    const isHighlighted = hasActiveFilters && matchesFilters(node);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                min-w-[200px] cursor-pointer transition-all hover:shadow-lg
                ${isSelected ? "ring-2 ring-primary shadow-xl" : ""}
                ${isHighlighted ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950" : ""}
              `}
              onClick={() => setSelectedEmployee(node.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate flex-1">
                      {node.name}
                    </div>
                    {node.hasChildren && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(node.id);
                        }}
                      >
                        {node.isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  {(position?.title || node.cargo) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {position?.title || node.cargo}
                    </div>
                  )}
                  {(department?.name || node.departamento) && (
                    <Badge variant="secondary" className="text-xs">
                      {department?.name || node.departamento}
                    </Badge>
                  )}
                  {node.hasChildren && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Tem subordinados</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">{node.name}</div>
              {node.chapa && (
                <div className="text-xs">Chapa: {node.chapa}</div>
              )}
              {node.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3" />
                  {node.email}
                </div>
              )}
              {node.telefone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3" />
                  {node.telefone}
                </div>
              )}
              {(department?.name || node.departamento) && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3 w-3" />
                  {department?.name || node.departamento}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Renderizar árvore recursivamente
  const renderTree = (node: HierarchyNode) => {
    const isExpanded = expandedNodes.has(node.id);

    if (!isExpanded || node.children.length === 0) {
      return <TreeNode label={renderNode(node)} />;
    }

    return (
      <TreeNode label={renderNode(node)}>
        {node.children.map((child) => renderTree(child))}
      </TreeNode>
    );
  };

  // Exportar organograma como imagem
  const handleExport = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `organograma-${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Erro ao exportar organograma:", error);
    }
  };

  // Contar total de funcionários visíveis
  const totalVisible = useMemo(() => {
    const countNodes = (nodes: HierarchyNode[]): number => {
      return nodes.reduce((sum, node) => {
        return sum + 1 + countNodes(node.children);
      }, 0);
    };
    return countNodes(hierarchyTree);
  }, [hierarchyTree]);

  // Atualizar contador de filtrados usando useEffect
  useEffect(() => {
    setFilteredCount(totalVisible);
  }, [totalVisible]);

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm || selectedDepartment !== "all" || selectedPosition !== "all" || selectedLocation !== "all";

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0); // Reset page on search
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={selectedDepartment}
          onValueChange={(value) => {
            setSelectedDepartment(value);
            setPage(0); // Reset page on filter change
          }}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPosition}
          onValueChange={(value) => {
            setSelectedPosition(value);
            setPage(0); // Reset page on filter change
          }}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {positions.map((pos) => (
              <SelectItem key={pos.id} value={pos.id.toString()}>
                {pos.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => {
            setSearchTerm("");
            setSelectedDepartment("all");
            setSelectedPosition("all");
            setSelectedLocation("all");
            setPage(0);
          }} 
          variant="outline"
          size="sm"
        >
          Limpar Filtros
        </Button>

        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Estatísticas e Paginação */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {totalVisible} visível(is) de {total} total
              </span>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {filteredCount} resultado(s) filtrado(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Controles de paginação */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || isLoading}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Organograma com zoom */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TransformWrapper
              initialScale={0.8}
              minScale={0.3}
              maxScale={2}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Controles de zoom */}
                  <div className="flex gap-2 mb-4">
                    <Button onClick={() => zoomIn()} size="sm" variant="outline">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => zoomOut()} size="sm" variant="outline">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => resetTransform()}
                      size="sm"
                      variant="outline"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Área do organograma */}
                  <TransformComponent
                    wrapperStyle={{
                      width: "100%",
                      height: "600px",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      overflow: "hidden",
                    }}
                  >
                    <div ref={chartRef} className="p-8">
                      {hierarchyTree.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Nenhum funcionário encontrado
                        </div>
                      ) : (
                        <Tree
                          lineWidth="2px"
                          lineColor="hsl(var(--border))"
                          lineBorderRadius="10px"
                          label={
                            <div className="text-center font-semibold text-lg mb-4">
                              Organograma
                            </div>
                          }
                        >
                          {hierarchyTree.map((root) => renderTree(root))}
                        </Tree>
                      )}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
