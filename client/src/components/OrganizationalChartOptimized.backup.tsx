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
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import html2canvas from "html2canvas";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";

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
  level?: number;
}

interface OrganizationalChartOptimizedProps {
  departments?: Array<{ id: number; name: string }>;
  positions?: Array<{ id: number; title: string }>;
}

// Cores por nível hierárquico
const LEVEL_COLORS = {
  0: { bg: "bg-purple-100 dark:bg-purple-950", border: "border-purple-500", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-500" },
  1: { bg: "bg-blue-100 dark:bg-blue-950", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-500" },
  2: { bg: "bg-green-100 dark:bg-green-950", border: "border-green-500", text: "text-green-700 dark:text-green-300", badge: "bg-green-500" },
  3: { bg: "bg-orange-100 dark:bg-orange-950", border: "border-orange-500", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-500" },
  4: { bg: "bg-pink-100 dark:bg-pink-950", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300", badge: "bg-pink-500" },
  default: { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-500" },
};

const getLevelColor = (level: number) => {
  return LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.default;
};

// Calcular nível hierárquico de um nó
const calculateLevel = (node: Employee, employeeMap: Map<number, Employee>): number => {
  let level = 0;
  let current = node;
  while (current.managerId && employeeMap.has(current.managerId)) {
    level++;
    current = employeeMap.get(current.managerId)!;
  }
  return level;
};

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

  // Extrair lista única de localizações (empresas) dos funcionários
  const locations = useMemo(() => {
    const safeEmployees = ensureArray(employees);
    if (isEmpty(safeEmployees)) return [];
    const uniqueLocations = new Set<string>();
    safeEmployees.forEach((emp) => {
      if (emp.empresa) uniqueLocations.add(emp.empresa);
    });
    return Array.from(uniqueLocations).sort();
  }, [employees]);

  // Construir árvore hierárquica com lazy loading e níveis
  const hierarchyTree = useMemo(() => {
    const safeEmployees = ensureArray(employees);
    // Criar mapa de funcionários
    const employeeMap = new Map<number, Employee>();
    safeEmployees.forEach((emp) => {
      employeeMap.set(emp.id, emp);
    });

    // Criar mapa de nós com níveis
    const nodeMap = new Map<number, HierarchyNode>();
    safeEmployees.forEach((emp) => {
      const hasChildren = safeEmployees.some((e) => e.managerId === emp.id);
      const level = calculateLevel(emp, employeeMap);
      nodeMap.set(emp.id, {
        ...emp,
        children: [],
        hasChildren,
        isExpanded: expandedNodes.has(emp.id),
        isLoading: false,
        level,
      });
    });

    // Construir árvore apenas com nós expandidos
    const roots: HierarchyNode[] = [];
    nodeMap.forEach((node) => {
      if (node.managerId && nodeMap.has(node.managerId)) {
        const parent = nodeMap.get(node.managerId)!;
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

  // Expandir todos até um nível
  const expandToLevel = useCallback((maxLevel: number) => {
    const safeEmployees = ensureArray(employees);
    const employeeMap = new Map<number, Employee>();
    safeEmployees.forEach((emp) => {
      employeeMap.set(emp.id, emp);
    });

    const newExpanded = new Set<number>();
    safeEmployees.forEach((emp) => {
      const level = calculateLevel(emp, employeeMap);
      const hasChildren = safeEmployees.some((e) => e.managerId === emp.id);
      if (level < maxLevel && hasChildren) {
        newExpanded.add(emp.id);
      }
    });
    setExpandedNodes(newExpanded);
  }, [employees]);

  // Recolher todos
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedDepartment !== "all" ||
    selectedPosition !== "all" ||
    selectedLocation !== "all";

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
    // Filtro de localização (empresa)
    if (selectedLocation !== "all") {
      const employee = safeFind(ensureArray(employees), e => e.id === node.id);
      if (!employee || employee.empresa !== selectedLocation) {
        return false;
      }
    }
    return true;
  };

  // Renderizar nó individual com cores por nível
  const renderNode = (node: HierarchyNode) => {
    const department = safeFind(ensureArray(departments), (d) => d.id === node.departmentId);
    const position = safeFind(ensureArray(positions), (p) => p.id === node.positionId);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedEmployee === node.id;
    const isHighlighted = hasActiveFilters && matchesFilters(node);
    const level = node.level || 0;
    const colors = getLevelColor(level);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                min-w-[240px] cursor-pointer transition-all hover:shadow-xl
                ${colors.bg} border-2 ${colors.border}
                ${isSelected ? "ring-2 ring-primary shadow-xl scale-105" : ""}
                ${isHighlighted ? "ring-2 ring-yellow-500 shadow-yellow-200" : ""}
              `}
              onClick={() => setSelectedEmployee(node.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-bold text-base truncate flex-1 ${colors.text}`}>
                      {node.name}
                    </div>
                    {node.hasChildren && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 w-7 p-0 ${colors.text}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(node.id);
                        }}
                      >
                        {node.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isExpanded ? (
                          <MinusCircle className="h-4 w-4" />
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {node.chapa && (
                    <div className="text-xs font-mono text-muted-foreground">
                      Chapa: {node.chapa}
                    </div>
                  )}
                  {(position?.title || node.cargo) && (
                    <div className="text-sm font-medium text-foreground truncate">
                      {position?.title || node.cargo}
                    </div>
                  )}
                  {(department?.name || node.departamento) && (
                    <Badge variant="secondary" className={`text-xs ${colors.badge} text-white`}>
                      {department?.name || node.departamento}
                    </Badge>
                  )}
                  {node.hasChildren && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">
                        {safeLength(node.children)} subordinado{safeLength(node.children) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Nível {level + 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">{node.name}</div>
              <div className="text-xs text-muted-foreground">Nível Hierárquico: {level + 1}</div>
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
        {safeMap(ensureArray(node.children), (child) => renderTree(child))}
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

  // Atualizar contagem de filtrados
  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredCount(0);
      return;
    }

    const countMatches = (nodes: HierarchyNode[]): number => {
      let count = 0;
      nodes.forEach((node) => {
        if (matchesFilters(node)) count++;
        if (node.children.length > 0) {
          count += countMatches(node.children);
        }
      });
      return count;
    };

    setFilteredCount(countMatches(hierarchyTree));
  }, [hierarchyTree, hasActiveFilters, searchTerm, selectedDepartment, selectedPosition, selectedLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmpty(employees)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Nenhum funcionário encontrado</p>
        <p className="text-sm text-muted-foreground">
          Adicione funcionários para visualizar o organograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles e Filtros */}
      <div className="flex flex-col gap-4">
        {/* Linha 1: Busca e Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {safeMap(ensureArray(departments), (dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {safeMap(ensureArray(positions), (pos) => (
                <SelectItem key={pos.id} value={pos.id.toString()}>
                  {pos.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isEmpty(locations) && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                {safeMap(locations, (loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Linha 2: Controles de Expansão e Ações */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Expandir até:</span>
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant="outline"
                size="sm"
                onClick={() => expandToLevel(level)}
              >
                Nível {level}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Recolher Tudo
            </Button>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PNG
          </Button>
        </div>

        {/* Legenda de Cores */}
        <div className="flex items-center gap-4 flex-wrap p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span className="text-sm">Nível 1 (CEO/Conselho)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm">Nível 2 (Diretores)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Nível 3 (Gerentes)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-sm">Nível 4 (Coordenadores)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-500" />
            <span className="text-sm">Nível 5 (Supervisores)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500" />
            <span className="text-sm">Nível 6+</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total: {total} funcionários</span>
          {hasActiveFilters && filteredCount > 0 && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {filteredCount} correspondendo aos filtros
            </span>
          )}
        </div>
      </div>

      {/* Organograma */}
      <div className="border rounded-lg p-4 bg-background">
        <TransformWrapper
          initialScale={0.8}
          minScale={0.3}
          maxScale={2}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "600px",
                }}
              >
                <div ref={chartRef} className="p-8">
                  {!isEmpty(hierarchyTree) ? (
                    <Tree
                      lineWidth="2px"
                      lineColor="#cbd5e1"
                      lineBorderRadius="10px"
                      label={<div className="text-center font-bold text-lg mb-4">Estrutura Organizacional</div>}
                    >
                      {safeMap(hierarchyTree, (node) => renderTree(node))}
                    </Tree>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        Nenhum funcionário corresponde aos filtros aplicados
                      </p>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}
