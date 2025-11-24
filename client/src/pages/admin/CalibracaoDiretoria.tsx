import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Grid3x3,
  User,
  FileText,
  Upload,
  History,
  Download,
  Save,
  Filter,
  X,
  FileDown,
} from "lucide-react";
import { generateCalibrationPDF } from "@/lib/calibrationPDF";

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  level: string;
  costCenter: string;
  photo?: string;
  performanceScore: number;
  potentialScore: number;
  nineBoxQuadrant: string;
  justification?: string;
  evidenceFiles?: string;
  previousPosition?: string;
}

/**
 * Card de profissional arrastável
 */
function DraggableEmployee({ employee }: { employee: Employee }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: employee.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-2 shadow-sm cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2">
        {employee.photo ? (
          <img src={employee.photo} alt={employee.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {employee.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">{employee.name}</p>
          <p className="text-xs text-gray-500 truncate">{employee.position}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Quadrante do Nine Box
 */
function NineBoxQuadrant({
  title,
  quadrant,
  employees,
  onEmployeeClick,
}: {
  title: string;
  quadrant: string;
  employees: Employee[];
  onEmployeeClick: (employee: Employee) => void;
}) {
  const quadrantEmployees = employees.filter((e) => e.nineBoxQuadrant === quadrant);

  const getQuadrantColor = (q: string) => {
    if (q.includes("high_high")) return "bg-green-50 border-green-300";
    if (q.includes("high_medium") || q.includes("medium_high")) return "bg-blue-50 border-blue-300";
    if (q.includes("low_low")) return "bg-red-50 border-red-300";
    return "bg-gray-50 border-gray-300";
  };

  return (
    <div className={`border-2 rounded-lg p-3 min-h-[180px] ${getQuadrantColor(quadrant)}`}>
      <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
        {title}
        <Badge variant="secondary" className="text-xs">
          {quadrantEmployees.length}
        </Badge>
      </h3>
      <div className="space-y-2">
        {quadrantEmployees.map((employee) => (
          <div key={employee.id} onClick={() => onEmployeeClick(employee)}>
            <DraggableEmployee employee={employee} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Página de Calibração Diretoria
 */
export default function CalibracaoDiretoria() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Filtros
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");

  // Formulário de edição
  const [performanceScore, setPerformanceScore] = useState(3);
  const [potentialScore, setPotentialScore] = useState(3);
  const [justification, setJustification] = useState("");

  // Drag and drop
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Queries
  const { data: sessions } = trpc.calibrationDirector.listSessions.useQuery({});
  const { data: employees, refetch: refetchEmployees } =
    trpc.calibrationDirector.getEmployeesForCalibration.useQuery(
      {
        sessionId: sessionId || 0,
        departmentIds: departmentFilter ? [parseInt(departmentFilter)] : undefined,
        levels: levelFilter ? [levelFilter] : undefined,
      },
      { enabled: !!sessionId }
    );

  const { data: history } = trpc.calibrationDirector.getEmployeeHistory.useQuery(
    { employeeId: selectedEmployee?.id || 0 },
    { enabled: !!selectedEmployee && historyDialogOpen }
  );

  // Mutations
  const updatePositionMutation = trpc.calibrationDirector.updatePosition.useMutation({
    onSuccess: () => {
      toast.success("Posição atualizada com sucesso!");
      refetchEmployees();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar posição: ${error.message}`);
    },
  });

  const createSessionMutation = trpc.calibrationDirector.createSession.useMutation({
    onSuccess: (data) => {
      toast.success("Sessão criada com sucesso!");
      setSessionId(data.sessionId);
    },
    onError: (error) => {
      toast.error(`Erro ao criar sessão: ${error.message}`);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !sessionId) return;

    const employeeId = active.id as number;
    const targetQuadrant = over.id as string;

    // Calcular scores baseado no quadrante
    const [perfLevel, potLevel] = targetQuadrant.split("_");
    const perfScore = perfLevel === "low" ? 2 : perfLevel === "medium" ? 3 : 4;
    const potScore = potLevel === "low" ? 2 : potLevel === "medium" ? 3 : 4;

    const employee = employees?.find((e) => e.id === employeeId);
    if (!employee) return;

    // Atualizar posição
    updatePositionMutation.mutate({
      sessionId,
      employeeId,
      performanceScore: perfScore,
      potentialScore: potScore,
      justification: `Movido para ${targetQuadrant} via drag-and-drop`,
    });
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setPerformanceScore(employee.performanceScore);
    setPotentialScore(employee.potentialScore);
    setJustification(employee.justification || "");
    setDialogOpen(true);
  };

  const handleSavePosition = () => {
    if (!selectedEmployee || !sessionId) return;

    updatePositionMutation.mutate({
      sessionId,
      employeeId: selectedEmployee.id,
      performanceScore,
      potentialScore,
      justification,
    });
  };

  const handleCreateSession = () => {
    createSessionMutation.mutate({
      sessionName: `Calibração ${new Date().toLocaleDateString("pt-BR")}`,
    });
  };

  const handleExportPDF = async () => {
    if (!sessionId) {
      toast.error("Selecione uma sessão para exportar");
      return;
    }

    try {
      // Buscar dados completos da sessão
      const reportData = await trpc.calibrationDirector.getCalibrationReportData.query({ sessionId });
      
      // Gerar PDF
      await generateCalibrationPDF(reportData);
      
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório PDF");
      console.error(error);
    }
  };

  const activeEmployee = useMemo(
    () => employees?.find((e) => e.id === activeId),
    [activeId, employees]
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Grid3x3 className="h-8 w-8" />
            Calibração Diretoria - Nine Box Interativo
          </h1>
          <p className="text-gray-600 mt-1">
            Arraste profissionais para calibrar performance e potencial
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            disabled={!sessionId}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleCreateSession} variant="outline">
            Nova Sessão
          </Button>
        </div>
      </div>

      {/* Seleção de Sessão e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Sessão de Calibração</Label>
              <Select
                value={sessionId?.toString()}
                onValueChange={(v) => setSessionId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sessão" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.sessionName} - {new Date(session.sessionDate).toLocaleDateString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filtrar por Departamento</Label>
              <Input
                placeholder="ID do Departamento"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />
            </div>

            <div>
              <Label>Filtrar por Nível</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Diretoria">Diretoria</SelectItem>
                  <SelectItem value="Gerência">Gerência</SelectItem>
                  <SelectItem value="Coordenação">Coordenação</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDepartmentFilter("");
                  setLevelFilter("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nine Box Grid */}
      {sessionId && employees && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nine Box Matrix ({employees.length} profissionais)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Finalizar Calibração
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Arraste os profissionais para os quadrantes adequados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-4">
                {/* Linha Superior (Alto Potencial) */}
                <NineBoxQuadrant
                  title="Enigma (Baixa Perf / Alto Pot)"
                  quadrant="low_high"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Crescimento (Média Perf / Alto Pot)"
                  quadrant="medium_high"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Estrela (Alta Perf / Alto Pot)"
                  quadrant="high_high"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />

                {/* Linha Média (Médio Potencial) */}
                <NineBoxQuadrant
                  title="Risco (Baixa Perf / Médio Pot)"
                  quadrant="low_medium"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Núcleo (Média Perf / Médio Pot)"
                  quadrant="medium_medium"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Profissional (Alta Perf / Médio Pot)"
                  quadrant="high_medium"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />

                {/* Linha Inferior (Baixo Potencial) */}
                <NineBoxQuadrant
                  title="Crítico (Baixa Perf / Baixo Pot)"
                  quadrant="low_low"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Manutenção (Média Perf / Baixo Pot)"
                  quadrant="medium_low"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
                <NineBoxQuadrant
                  title="Especialista (Alta Perf / Baixo Pot)"
                  quadrant="high_low"
                  employees={employees}
                  onEmployeeClick={handleEmployeeClick}
                />
              </div>

              <DragOverlay>
                {activeEmployee ? <DraggableEmployee employee={activeEmployee} /> : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição de Profissional */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee?.position} - {selectedEmployee?.department}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Performance (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={performanceScore}
                  onChange={(e) => setPerformanceScore(parseInt(e.target.value) || 3)}
                />
              </div>
              <div>
                <Label>Potencial (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={potentialScore}
                  onChange={(e) => setPotentialScore(parseInt(e.target.value) || 3)}
                />
              </div>
            </div>

            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Descreva os motivos para esta classificação..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setHistoryDialogOpen(true)}
                className="flex-1"
              >
                <History className="h-4 w-4 mr-2" />
                Ver Histórico
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidências
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePosition}
              disabled={updatePositionMutation.isPending || !justification}
            >
              {updatePositionMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Calibrações</DialogTitle>
            <DialogDescription>{selectedEmployee?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history && history.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum histórico encontrado</p>
            )}
            {history?.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{item.sessionName}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(item.changedAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          Performance: {item.oldPerformance} → {item.newPerformance}
                        </div>
                        <div>
                          Potencial: {item.oldPotential} → {item.newPotential}
                        </div>
                        <div>
                          Quadrante: {item.oldQuadrant} → {item.newQuadrant}
                        </div>
                        {item.justification && (
                          <div className="text-gray-600 mt-2">{item.justification}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{item.changedByName}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
