import { useState, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MarkerType,
  MiniMap,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Edit,
  Save,
  X,
  GripVertical,
} from "lucide-react";

interface Employee {
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
  active: boolean;
}

interface OrganogramaInterativoAvancadoProps {
  employees: Employee[];
  onEmployeeMove?: (employeeId: number, newManagerId: number | null) => void;
  onEmployeeEdit?: (employeeId: number, data: Partial<Employee>) => void;
  editable?: boolean;
}

/**
 * Nó customizado editável para colaborador
 */
function EditableEmployeeNode({ data }: { data: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(data.label);

  const handleSave = () => {
    if (data.onEdit && editedName !== data.label) {
      data.onEdit(data.employeeId, { name: editedName });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(data.label);
    setIsEditing(false);
  };

  const initials = data.label
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "??";

  return (
    <Card className="min-w-[220px] border-2 hover:shadow-xl transition-all cursor-move group relative">
      {data.editable && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {!isEditing ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="default"
                className="h-6 w-6 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={data.photoUrl} alt={data.label} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-7 text-sm font-semibold"
                onClick={(e) => e.stopPropagation()}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            ) : (
              <div className="font-semibold text-sm truncate">{data.label}</div>
            )}
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {data.employeeCode}
            </div>
          </div>
        </div>

        {data.position && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-1">Cargo</div>
            <div className="text-sm">{data.position}</div>
          </div>
        )}

        {data.department && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{data.department}</span>
            </div>
          </div>
        )}

        {data.subordinatesCount !== undefined && data.subordinatesCount > 0 && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {data.subordinatesCount} subordinado{data.subordinatesCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

const nodeTypes: NodeTypes = {
  employee: EditableEmployeeNode,
};

/**
 * Componente de Organograma Interativo Avançado
 * Com drag-and-drop, edição inline, busca e filtros
 */
export default function OrganogramaInterativoAvancado({
  employees,
  onEmployeeMove,
  onEmployeeEdit,
  editable = false,
}: OrganogramaInterativoAvancadoProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newManagerId, setNewManagerId] = useState<number | null>(null);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Filtrar colaboradores
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchTerm === "" ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === "all" ||
        emp.departmentId?.toString() === departmentFilter;

      return matchesSearch && matchesDepartment && emp.active;
    });
  }, [employees, searchTerm, departmentFilter]);

  // Departamentos únicos para filtro
  const departments = useMemo(() => {
    const deptMap = new Map<number, string>();
    employees.forEach((emp) => {
      if (emp.departmentId && emp.departmentName) {
        deptMap.set(emp.departmentId, emp.departmentName);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  // Construir hierarquia de nós e arestas
  useEffect(() => {
    if (filteredEmployees.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Criar mapa de subordinados
    const subordinatesMap = new Map<number, number>();
    filteredEmployees.forEach((emp) => {
      if (emp.managerId) {
        subordinatesMap.set(emp.managerId, (subordinatesMap.get(emp.managerId) || 0) + 1);
      }
    });

    // Criar nós
    const newNodes: Node[] = filteredEmployees.map((emp, index) => {
      // Calcular posição hierárquica
      const level = calculateLevel(emp, filteredEmployees);
      const siblingsAtLevel = filteredEmployees.filter(
        (e) => e.managerId === emp.managerId
      );
      const indexAtLevel = siblingsAtLevel.findIndex((e) => e.id === emp.id);

      return {
        id: emp.id.toString(),
        type: "employee",
        position: {
          x: indexAtLevel * 280 - (siblingsAtLevel.length * 280) / 2 + 140,
          y: level * 200,
        },
        data: {
          label: emp.name,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          position: emp.positionTitle,
          department: emp.departmentName,
          photoUrl: emp.photoUrl,
          subordinatesCount: subordinatesMap.get(emp.id) || 0,
          editable,
          onEdit: onEmployeeEdit,
        },
      };
    });

    // Criar arestas
    const newEdges: Edge[] = filteredEmployees
      .filter((emp) => emp.managerId)
      .map((emp) => ({
        id: `e-${emp.managerId}-${emp.id}`,
        source: emp.managerId!.toString(),
        target: emp.id.toString(),
        type: "smoothstep",
        animated: false,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--primary))",
        },
      }));

    setNodes(newNodes);
    setEdges(newEdges);

    // Auto-fit após renderização
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
  }, [filteredEmployees, editable, onEmployeeEdit, fitView, setNodes, setEdges]);

  // Calcular nível hierárquico
  const calculateLevel = (employee: Employee, allEmployees: Employee[]): number => {
    let level = 0;
    let currentEmp = employee;

    while (currentEmp.managerId) {
      level++;
      const manager = allEmployees.find((e) => e.id === currentEmp.managerId);
      if (!manager) break;
      currentEmp = manager;
    }

    return level;
  };

  // Handler para conexão (drag-and-drop)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!editable || !onEmployeeMove) return;

      const targetId = parseInt(connection.target!);
      const sourceId = connection.source ? parseInt(connection.source) : null;

      const employee = employees.find((e) => e.id === targetId);
      if (!employee) return;

      setSelectedEmployee(employee);
      setNewManagerId(sourceId);
      setMoveDialogOpen(true);
    },
    [editable, onEmployeeMove, employees]
  );

  // Confirmar movimentação
  const handleConfirmMove = () => {
    if (selectedEmployee && onEmployeeMove) {
      onEmployeeMove(selectedEmployee.id, newManagerId);
      toast.success(`${selectedEmployee.name} foi movido com sucesso!`);
    }
    setMoveDialogOpen(false);
    setSelectedEmployee(null);
    setNewManagerId(null);
  };

  // Exportar organograma
  const handleExport = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => "hsl(var(--primary))"}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        <Panel position="top-left" className="space-y-2">
          <Card className="p-4 w-80">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
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

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => zoomIn()}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Zoom +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => zoomOut()}
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Zoom -
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => fitView({ padding: 0.2, duration: 300 })}
              >
                <Maximize className="h-4 w-4 mr-2" />
                Ajustar à tela
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Total de colaboradores:</span>
                <Badge variant="secondary">{filteredEmployees.length}</Badge>
              </div>
              {editable && (
                <div className="text-xs text-amber-600 mt-2">
                  💡 Arraste os cards para reorganizar a hierarquia
                </div>
              )}
            </div>
          </Card>
        </Panel>
      </ReactFlow>

      {/* Dialog de confirmação de movimentação */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Movimentação</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar a hierarquia organizacional.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              <div>
                <Label>Colaborador</Label>
                <div className="mt-1 p-3 border rounded-md bg-muted/50">
                  <div className="font-medium">{selectedEmployee.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedEmployee.positionTitle}
                  </div>
                </div>
              </div>

              <div>
                <Label>Novo Gestor</Label>
                <div className="mt-1 p-3 border rounded-md bg-muted/50">
                  {newManagerId ? (
                    <>
                      <div className="font-medium">
                        {employees.find((e) => e.id === newManagerId)?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employees.find((e) => e.id === newManagerId)?.positionTitle}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Sem gestor direto (nível mais alto)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMove}>Confirmar Movimentação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
