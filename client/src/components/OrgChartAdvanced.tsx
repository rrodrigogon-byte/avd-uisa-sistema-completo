import { useState, useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, isEmpty, ensureArray } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  List,
  Circle,
  Edit,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  UserCheck,
  UserX,
  MoreVertical,
} from "lucide-react";

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  managerId: number | null;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionTitle: string | null;
  photoUrl: string | null;
  active: boolean;
  hireDate: string | null;
  subordinates?: Employee[];
}

type LayoutType = "vertical" | "horizontal" | "compact";

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onViewDetails?: (employee: Employee) => void;
  level?: number;
  layout?: LayoutType;
  searchTerm?: string;
}

function EmployeeCard({
  employee,
  onEdit,
  onViewDetails,
  level = 0,
  layout = "vertical",
  searchTerm = "",
}: EmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Highlight search term
  const isMatch = searchTerm && (
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardClass = `w-64 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 ${
    isMatch ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950" : "hover:border-primary/50"
  } ${!employee.active ? "opacity-60" : ""}`;

  return (
    <div className={`flex ${layout === "horizontal" ? "flex-row" : "flex-col"} items-center gap-4`}>
      <Card className={cardClass} data-employee-id={employee.id}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-primary/20">
                <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!employee.active && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                  <UserX className="h-3 w-3 text-white" />
                </div>
              )}
              {employee.active && level === 0 && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <Award className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-bold truncate">{employee.name}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{employee.employeeCode}</p>
              {!employee.active && (
                <Badge variant="destructive" className="text-[10px] mt-1">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {employee.positionTitle && (
            <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-md p-2">
              <Briefcase className="h-3 w-3 text-primary" />
              <span className="truncate font-medium">{employee.positionTitle}</span>
            </div>
          )}
          {employee.departmentName && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{employee.departmentName}</span>
            </div>
          )}
          {employee.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {hasSubordinates && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 rounded-md p-2">
              <Users className="h-3 w-3 text-primary" />
              <span className="font-semibold text-primary">
                {employee.subordinates!.length} subordinado{employee.subordinates!.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onViewDetails?.(employee)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onEdit?.(employee)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(employee)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Alterar Gestor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewDetails?.(employee)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfil Completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {hasSubordinates && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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

      {/* Subordinados */}
      {hasSubordinates && isExpanded && (
        <div className={`flex ${layout === "horizontal" ? "flex-col" : "flex-row"} gap-6 relative`}>
          {/* Linha conectora */}
          {layout === "vertical" && (
            <>
              <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/50 to-transparent -translate-x-1/2" />
              {employee.subordinates!.length > 1 && (
                <div
                  className="absolute top-6 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  style={{
                    width: `calc(100% - 64px)`,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </>
          )}

          {safeMap(employee.subordinates, (sub) => (
            <div key={sub.id} className="flex flex-col items-center">
              {layout === "vertical" && (
                <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-transparent" />
              )}
              <EmployeeCard
                employee={sub}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                level={level + 1}
                layout={layout}
                searchTerm={searchTerm}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Importar ícone Eye que estava faltando
import { Eye } from "lucide-react";

interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

function EmployeeDetailsDialog({ employee, open, onClose }: EmployeeDetailsDialogProps) {
  if (!employee) return null;

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Perfil do Colaborador</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header com foto e info básica */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-20 w-20 ring-4 ring-offset-2 ring-primary/20">
              <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-xl font-bold">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
              </div>
              <div className="flex gap-2">
                {employee.active ? (
                  <Badge variant="default" className="gap-1">
                    <UserCheck className="h-3 w-3" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <UserX className="h-3 w-3" />
                    Inativo
                  </Badge>
                )}
                {employee.positionTitle && (
                  <Badge variant="secondary">{employee.positionTitle}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="grid grid-cols-2 gap-4">
            {employee.departmentName && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Departamento</Label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{employee.departmentName}</span>
                </div>
              </div>
            )}

            {employee.email && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate">{employee.email}</span>
                </div>
              </div>
            )}

            {employee.phone && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{employee.phone}</span>
                </div>
              </div>
            )}

            {employee.hireDate && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data de Admissão</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {new Date(employee.hireDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          {employee.subordinates && employee.subordinates.length > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <Label className="text-sm font-semibold">Equipe</Label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {employee.subordinates.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Subordinados Diretos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {safeFilter(employee.subordinates, (s) => s.active).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {safeFilter(employee.subordinates, (s) => !s.active).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Inativos</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  allEmployees: Employee[];
}

function MoveEmployeeDialog({
  employee,
  open,
  onClose,
  onConfirm,
  allEmployees,
}: MoveEmployeeDialogProps) {
  const [newManagerId, setNewManagerId] = useState<string>(employee?.managerId?.toString() || "");
  const [reason, setReason] = useState("");
  const [changeType, setChangeType] = useState("mudanca_gestor");
  const [searchManager, setSearchManager] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo da mudança");
      return;
    }

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
            <Label htmlFor="manager">Novo Gestor *</Label>
            <Select value={newManagerId} onValueChange={setNewManagerId}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Selecione o novo gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sem gestor (CEO/Diretor)</SelectItem>
                {safeMap(
                  safeFilter(allEmployees, (m) => m.id !== employee.id && m.active),
                  (manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name} - {manager.positionTitle || "Sem cargo"}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeType">Tipo de Mudança *</Label>
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
            <Label htmlFor="reason">Motivo da Mudança *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva detalhadamente o motivo da mudança..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrgChartAdvanced() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [layout, setLayout] = useState<LayoutType>("vertical");
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: orgData, isLoading, refetch } = trpc.orgChart.getOrgChart.useQuery(undefined);
  const updateManagerMutation = trpc.orgChart.updateManager.useMutation();

  const utils = trpc.useUtils();

  // Achatar árvore para lista de funcionários
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

  // Filtrar por busca
  const filteredTree = useMemo(() => {
    if (!searchTerm || !orgData?.tree) return orgData?.tree || [];
    
    const filterTree = (employees: Employee[]): Employee[] => {
      return safeFilter(
        safeMap(employees, (emp) => {
          const matches =
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.departmentName?.toLowerCase().includes(searchTerm.toLowerCase());

          const filteredSubs = emp.subordinates ? filterTree(emp.subordinates) : [];

          if (matches || filteredSubs.length > 0) {
            return { ...emp, subordinates: filteredSubs };
          }
          return null;
        }),
        (emp): emp is Employee => emp !== null
      );
    };

    return filterTree(orgData.tree);
  }, [orgData, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const employeeId = event.active.id;
    const employee = safeFind(allEmployees, (e) => e.id === employeeId);
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

    const draggedEmployee = safeFind(allEmployees, (e) => e.id === active.id);
    const targetEmployee = safeFind(allEmployees, (e) => e.id === over.id);

    if (draggedEmployee && targetEmployee) {
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

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsDialogOpen(true);
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;

    try {
      toast.info("Gerando imagem...");
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `organograma-${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Organograma exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar organograma");
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;

    try {
      toast.info("Gerando PDF...");
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`organograma-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    }
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
        <p className="text-muted-foreground text-lg font-semibold">
          Nenhum organograma encontrado
        </p>
        <p className="text-sm text-muted-foreground">
          Configure a hierarquia de funcionários para visualizar o organograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Organograma Interativo
          </h2>
          <p className="text-muted-foreground">
            Visualize e gerencie a hierarquia organizacional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm gap-2">
            <Users className="h-4 w-4" />
            {orgData.totalEmployees} colaboradores
          </Badge>
          <Badge variant="outline" className="text-sm gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            {safeFilter(allEmployees, (e) => e.active).length} ativos
          </Badge>
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código, email ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Vertical
                </div>
              </SelectItem>
              <SelectItem value="horizontal">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Horizontal
                </div>
              </SelectItem>
              <SelectItem value="compact">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  Compacto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPNG}>
                <Download className="h-4 w-4 mr-2" />
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Organograma com zoom e pan */}
      <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={3}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Controles de zoom */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => zoomIn()}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => zoomOut()}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetTransform()}
                  className="h-8 w-8 p-0"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>

              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "calc(100vh - 400px)",
                  minHeight: "600px",
                }}
              >
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div ref={chartRef} className="p-12">
                    <div className="inline-flex gap-8 min-w-full justify-center">
                      {safeMap(ensureArray(filteredTree), (employee) => (
                        <EmployeeCard
                          key={employee.id}
                          employee={employee}
                          onEdit={handleEdit}
                          onViewDetails={handleViewDetails}
                          layout={layout}
                          searchTerm={searchTerm}
                        />
                      ))}
                    </div>
                  </div>

                  <DragOverlay>
                    {selectedEmployee && (
                      <Card className="w-64 opacity-90 rotate-3 shadow-2xl border-2 border-primary">
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
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Dialogs */}
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

      <EmployeeDetailsDialog
        employee={selectedEmployee}
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
}
