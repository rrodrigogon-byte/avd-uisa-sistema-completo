import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Network, Search, ZoomIn, ZoomOut, Maximize2, User } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface TreeNode {
  id: number;
  name: string;
  employeeCode: string;
  email?: string;
  photoUrl?: string;
  positionTitle?: string;
  departmentName?: string;
  status?: string;
  children: TreeNode[];
}

export default function OrganizationChart() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [draggedEmployee, setDraggedEmployee] = useState<number | null>(null);

  const { data: employees, isLoading, refetch } = trpc.hrEmployees.list.useQuery({});
  const { data: departments } = trpc.departments.list.useQuery({});
  const { data: positions } = trpc.hrPositions.list.useQuery({});

  const updateManagerMutation = trpc.hrHierarchy.updateManager.useMutation({
    onSuccess: () => {
      toast.success("Hierarquia atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar hierarquia: ${error.message}`);
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Construir árvore hierárquica
  const buildTree = (employees: any[]): TreeNode[] => {
    const employeeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Criar nós
    employees.forEach((emp) => {
      const position = positions?.find((p) => p.id === emp.positionId);
      const department = departments?.find((d) => d.id === emp.departmentId);

      employeeMap.set(emp.id, {
        id: emp.id,
        name: emp.name,
        employeeCode: emp.employeeCode,
        email: emp.email,
        photoUrl: emp.photoUrl,
        positionTitle: position?.title,
        departmentName: department?.name,
        status: emp.status,
        children: [],
      });
    });

    // Construir hierarquia
    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id);
      if (!node) return;

      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const parent = employeeMap.get(emp.managerId);
        parent?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        filterDepartment === "all" || emp.departmentId?.toString() === filterDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, filterDepartment]);

  const tree = useMemo(() => {
    if (!filteredEmployees) return [];
    return buildTree(filteredEmployees);
  }, [filteredEmployees, positions, departments]);

  const handleDragStart = (employeeId: number) => {
    setDraggedEmployee(employeeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newManagerId: number) => {
    if (!draggedEmployee || draggedEmployee === newManagerId) {
      setDraggedEmployee(null);
      return;
    }

    // Verificar se não está tentando se tornar subordinado de um de seus subordinados
    const isDescendant = (nodeId: number, ancestorId: number): boolean => {
      const employee = employees?.find((e) => e.id === nodeId);
      if (!employee) return false;
      if (employee.managerId === ancestorId) return true;
      if (employee.managerId) return isDescendant(employee.managerId, ancestorId);
      return false;
    };

    if (isDescendant(newManagerId, draggedEmployee)) {
      toast.error("Não é possível mover um gestor para ser subordinado de seu subordinado");
      setDraggedEmployee(null);
      return;
    }

    updateManagerMutation.mutate({
      employeeId: draggedEmployee,
      newManagerId,
    });

    setDraggedEmployee(null);
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isRoot = level === 0;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <Card
          className={`w-64 cursor-move hover:shadow-lg transition-all ${
            draggedEmployee === node.id ? "opacity-50" : ""
          }`}
          draggable
          onDragStart={() => handleDragStart(node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => {
            e.stopPropagation();
            handleDrop(node.id);
          }}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={node.photoUrl || undefined} />
                <AvatarFallback>{getInitials(node.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{node.name}</p>
                <p className="text-xs text-muted-foreground truncate">{node.employeeCode}</p>
              </div>
            </div>

            {node.positionTitle && (
              <p className="text-sm font-medium mb-1 truncate">{node.positionTitle}</p>
            )}

            {node.departmentName && (
              <p className="text-xs text-muted-foreground mb-2 truncate">{node.departmentName}</p>
            )}

            {node.status && (
              <Badge
                variant={node.status === "ativo" ? "default" : "secondary"}
                className="text-xs"
              >
                {node.status}
              </Badge>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => navigate(`/employees/${node.id}`)}
              >
                <User className="h-3 w-3 mr-1" />
                Ver perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasChildren && (
          <div className="flex flex-col items-center mt-4">
            <div className="h-8 w-0.5 bg-border"></div>
            <div className="flex gap-8 relative">
              {node.children.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-border"></div>
              )}
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center">
                  {node.children.length > 1 && <div className="h-8 w-0.5 bg-border"></div>}
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando organograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Network className="h-10 w-10" />
            Organograma
          </h1>
          <p className="text-muted-foreground">
            Visualize e reorganize a estrutura hierárquica da organização
          </p>
        </div>
      </div>

      {/* Controles */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Dica:</strong> Arraste e solte os cards para reorganizar a hierarquia.
            Clique em "Ver perfil" para mais detalhes do funcionário.
          </p>
        </CardContent>
      </Card>

      {/* Organograma */}
      <div className="overflow-auto">
        <div
          className="inline-flex flex-col items-center p-8 min-w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {tree.length > 0 ? (
            <div className="flex gap-16">
              {tree.map((root) => renderNode(root))}
            </div>
          ) : (
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterDepartment !== "all"
                    ? "Tente ajustar os filtros"
                    : "Cadastre funcionários para visualizar o organograma"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total de Funcionários</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{departments?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Departamentos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {employees?.filter((e) => !e.managerId).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Posições de Liderança</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
