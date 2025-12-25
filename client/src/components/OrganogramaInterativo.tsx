import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ZoomIn, ZoomOut, Maximize2, User, Mail, Phone, Building2, Briefcase } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";

interface Employee {
  id: number;
  name: string;
  email: string | null;
  position: string | null;
  departmentId: number | null;
  managerId: number | null;
  phone: string | null;
  cpf: string;
  status: string;
  department?: {
    id: number;
    name: string;
  } | null;
}

interface OrgNode {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  children: OrgNode[];
  employee: Employee;
}

export default function OrganogramaInterativo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar dados da hierarquia
  const { data: hierarchyData, isLoading } = trpc.orgChart.getOrgChart.useQuery({});
  const { data: departments } = trpc.departments.list.useQuery({});

  // Construir árvore hierárquica
  const orgTree = useMemo(() => {
    if (!hierarchyData || isEmpty(hierarchyData)) return null;

    const buildTree = (employees: Employee[], parentId: number | null = null): OrgNode[] => {
      return safeMap(
        employees.filter((emp) => emp.managerId === parentId),
        (emp) => ({
          id: emp.id,
          name: emp.name,
          position: emp.position || "Sem cargo",
          department: emp.department?.name || "Sem departamento",
          email: emp.email || "",
          phone: emp.phone || "",
          children: buildTree(employees, emp.id),
          employee: emp,
        })
      );
    };

    return buildTree(hierarchyData);
  }, [hierarchyData]);

  // Filtrar árvore por busca e departamento
  const filteredTree = useMemo(() => {
    if (!orgTree) return null;

    const filterNode = (node: OrgNode): OrgNode | null => {
      const matchesSearch =
        searchTerm === "" ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "all" || node.department === selectedDepartment;

      const filteredChildren = safeMap(node.children, filterNode).filter(
        (child): child is OrgNode => child !== null
      );

      if (matchesSearch && matchesDepartment) {
        return { ...node, children: filteredChildren };
      }

      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }

      return null;
    };

    return safeMap(orgTree, filterNode).filter((node): node is OrgNode => node !== null);
  }, [orgTree, searchTerm, selectedDepartment]);

  // Renderizar nó do organograma
  const renderNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <Card
          className="w-64 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            setSelectedEmployee(node.employee);
            setDialogOpen(true);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{node.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{node.position}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Badge variant="secondary" className="text-xs">
                {node.department}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {hasChildren && (
          <div className="mt-4 relative">
            {/* Linha vertical */}
            <div className="absolute left-1/2 top-0 w-px h-4 bg-border -translate-x-1/2" />
            
            <div className="flex gap-8 mt-4">
              {safeMap(node.children, (child) => (
                <div key={child.id} className="relative">
                  {/* Linha horizontal */}
                  {node.children.length > 1 && (
                    <div className="absolute top-0 left-1/2 w-full h-px bg-border -translate-y-4" />
                  )}
                  {/* Linha vertical para filho */}
                  <div className="absolute left-1/2 -top-4 w-px h-4 bg-border -translate-x-1/2" />
                  
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando organograma...</p>
        </div>
      </div>
    );
  }

  if (!orgTree || isEmpty(orgTree)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground">
            Não há colaboradores cadastrados ou não há hierarquia definida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador, cargo ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os departamentos</SelectItem>
            {safeMap(departments || [], (dept) => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Organograma */}
      <div className="border rounded-lg p-8 overflow-auto bg-muted/20">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.2s",
          }}
        >
          {filteredTree && !isEmpty(filteredTree) ? (
            <div className="flex flex-col items-center gap-8">
              {safeMap(filteredTree, (node) => renderNode(node))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para os filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Colaborador</DialogTitle>
            <DialogDescription>
              Informações completas do colaborador selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                  <Badge variant="secondary">{selectedEmployee.status}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo</p>
                    <p className="font-medium">
                      {selectedEmployee.position || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">
                      {selectedEmployee.department?.name || "Não informado"}
                    </p>
                  </div>
                </div>

                {selectedEmployee.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                  </div>
                )}

                {selectedEmployee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedEmployee.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
