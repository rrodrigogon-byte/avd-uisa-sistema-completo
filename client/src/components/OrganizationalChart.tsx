import { useMemo, useRef, useState } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
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
}

interface OrganizationalChartProps {
  employees?: Employee[];
  departments?: Array<{ id: number; name: string }>;
  positions?: Array<{ id: number; title: string }>;
}

export function OrganizationalChart({
  employees = [],
  departments = [],
  positions = [],
}: OrganizationalChartProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Construir árvore hierárquica
  const hierarchyTree = useMemo(() => {
    // Garantir que employees é um array válido
    const safeEmployees = ensureArray(employees);
    
    // Filtrar funcionários
    let filteredEmployees = safeEmployees;

    if (selectedDepartment !== "all") {
      filteredEmployees = safeFilter(safeEmployees, (emp) => 
        emp.departmentId?.toString() === selectedDepartment
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredEmployees = safeFilter(filteredEmployees,
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.chapa?.toLowerCase().includes(term)
      );
    }

    // Criar mapa de funcionários
    const employeeMap = new Map<number, HierarchyNode>();
    filteredEmployees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    // Construir árvore
    const roots: HierarchyNode[] = [];
    employeeMap.forEach((node) => {
      if (node.managerId && employeeMap.has(node.managerId)) {
        const parent = employeeMap.get(node.managerId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [employees, selectedDepartment, searchTerm]);

  // Renderizar nó da árvore
  const renderNode = (node: HierarchyNode) => {
    const isSelected = selectedEmployee === node.id;
    const department = departments.find((d) => d.id === node.departmentId);
    const position = positions.find((p) => p.id === node.positionId);

    return (
      <TooltipProvider key={node.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                min-w-[200px] cursor-pointer transition-all hover:shadow-lg
                ${isSelected ? "ring-2 ring-primary shadow-xl" : ""}
              `}
              onClick={() => setSelectedEmployee(node.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-semibold text-sm truncate">
                    {node.name}
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
                  {node.children.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{node.children.length} subordinado(s)</span>
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
    if (node.children.length === 0) {
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

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full md:w-[250px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os departamentos</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PNG
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {totalVisible} funcionário(s) visível(is) de {employees.length} total
          </span>
        </div>
      </div>

      {/* Organograma com zoom */}
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
