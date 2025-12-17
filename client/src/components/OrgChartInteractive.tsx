import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Users, Building2, Briefcase, ChevronDown, ChevronRight } from "lucide-react";

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
  subordinates?: Employee[];
}

interface DraggableEmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  level?: number;
}

function DraggableEmployeeCard({ employee, onEdit, level = 0 }: DraggableEmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expandir primeiros 2 níveis

  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center">
      <Card
        className="w-64 cursor-move hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
        data-employee-id={employee.id}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{employee.name}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{employee.employeeCode}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {employee.positionTitle && (
            <div className="flex items-center gap-2 text-xs">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{employee.positionTitle}</span>
            </div>
          )}
          {employee.departmentName && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{employee.departmentName}</span>
            </div>
          )}
          {hasSubordinates && (
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span>{employee.subordinates!.length} subordinado(s)</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => onEdit?.(employee)}
            >
              Editar
            </Button>
            {hasSubordinates && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linha conectora */}
      {hasSubordinates && isExpanded && (
        <div className="w-0.5 h-8 bg-border my-2" />
      )}

      {/* Subordinados */}
      {hasSubordinates && isExpanded && (
        <div className="flex gap-8 relative">
          {/* Linha horizontal conectando subordinados */}
          {employee.subordinates!.length > 1 && (
            <div
              className="absolute top-0 left-0 right-0 h-0.5 bg-border"
              style={{
                width: `calc(100% - ${64 * 2}px)`,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          )}

          {employee.subordinates!.map((sub) => (
            <div key={sub.id} className="flex flex-col items-center">
              {/* Linha vertical para cada subordinado */}
              <div className="w-0.5 h-8 bg-border" />
              <DraggableEmployeeCard employee={sub} onEdit={onEdit} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MoveEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    newManagerId: number | null;
    reason: string;
    changeType: string;
  }) => void;
  availableManagers: Employee[];
}

function MoveEmployeeDialog({
  employee,
  open,
  onClose,
  onConfirm,
  availableManagers,
}: MoveEmployeeDialogProps) {
  const [newManagerId, setNewManagerId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [changeType, setChangeType] = useState("ajuste_hierarquico");

  const handleConfirm = () => {
    onConfirm({
      newManagerId: newManagerId ? parseInt(newManagerId) : null,
      reason,
      changeType,
    });
    setNewManagerId("");
    setReason("");
    setChangeType("ajuste_hierarquico");
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Gestor</DialogTitle>
          <DialogDescription>
            Alterar gestor de <strong>{employee.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Novo Gestor</Label>
            <Select value={newManagerId} onValueChange={setNewManagerId}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Selecione o novo gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sem gestor (CEO/Diretor)</SelectItem>
                {availableManagers
                  .filter((m) => m.id !== employee.id) // Não pode ser gestor de si mesmo
                  .map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name} - {manager.positionTitle || "Sem cargo"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeType">Tipo de Mudança</Label>
            <Select value={changeType} onValueChange={setChangeType}>
              <SelectTrigger id="changeType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promocao">Promoção</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="reorganizacao">Reorganização</SelectItem>
                <SelectItem value="desligamento_gestor">Desligamento de Gestor</SelectItem>
                <SelectItem value="ajuste_hierarquico">Ajuste Hierárquico</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Mudança</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da mudança..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Alteração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrgChartInteractive() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const { data: orgData, isLoading, refetch } = trpc.orgChart.getOrgChart.useQuery();
  const updateManagerMutation = trpc.orgChart.updateManager.useMutation();

  const utils = trpc.useUtils();

  // Achatar árvore para lista de funcionários disponíveis como gestores
  const flattenEmployees = (employees: Employee[]): Employee[] => {
    const result: Employee[] = [];
    employees.forEach((emp) => {
      result.push(emp);
      if (emp.subordinates) {
        result.push(...flattenEmployees(emp.subordinates));
      }
    });
    return result;
  };

  const allEmployees = useMemo(() => {
    if (!orgData?.tree) return [];
    return flattenEmployees(orgData.tree);
  }, [orgData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const employeeId = event.active.id;
    const employee = allEmployees.find((e) => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setSelectedEmployee(null);
      return;
    }

    const draggedEmployee = allEmployees.find((e) => e.id === active.id);
    const targetEmployee = allEmployees.find((e) => e.id === over.id);

    if (draggedEmployee && targetEmployee) {
      // Abrir diálogo de confirmação
      setSelectedEmployee(draggedEmployee);
      setMoveDialogOpen(true);
    }
  };

  const handleMoveConfirm = async (data: {
    newManagerId: number | null;
    reason: string;
    changeType: string;
  }) => {
    if (!selectedEmployee) return;

    try {
      await updateManagerMutation.mutateAsync({
        employeeId: selectedEmployee.id,
        newManagerId: data.newManagerId,
        reason: data.reason,
        changeType: data.changeType as any,
      });

      toast.success("Gestor atualizado com sucesso!");
      setMoveDialogOpen(false);
      setSelectedEmployee(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar gestor"
      );
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setMoveDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orgData || !orgData.tree || orgData.tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum organograma encontrado</p>
        <p className="text-sm text-muted-foreground">
          Configure a hierarquia de funcionários para visualizar o organograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organograma Interativo</h2>
          <p className="text-muted-foreground">
            Arraste e solte funcionários para reorganizar a hierarquia
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {orgData.totalEmployees} funcionários
        </Badge>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-8">
          <div className="inline-flex gap-8 min-w-full justify-center p-8">
            {orgData.tree.map((employee) => (
              <DraggableEmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {selectedEmployee && (
            <Card className="w-64 opacity-80 rotate-3 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={selectedEmployee.photoUrl || undefined}
                      alt={selectedEmployee.name}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedEmployee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {selectedEmployee.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedEmployee.employeeCode}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <MoveEmployeeDialog
        employee={selectedEmployee}
        open={moveDialogOpen}
        onClose={() => {
          setMoveDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleMoveConfirm}
        availableManagers={allEmployees}
      />
    </div>
  );
}
