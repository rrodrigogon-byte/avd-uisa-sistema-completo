import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Calendar,
  Target,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Eye,
  RefreshCw,
  ChevronRight,
  FlaskConical,
  Trash2,
} from "lucide-react";

const phaseLabels: Record<string, string> = {
  preparation: "Preparação",
  training: "Treinamento",
  execution: "Execução",
  analysis: "Análise",
  adjustment: "Ajustes",
  completed: "Concluído",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const participantStatusLabels: Record<string, string> = {
  invited: "Convidado",
  accepted: "Aceitou",
  in_training: "Em Treinamento",
  ready: "Pronto",
  in_progress: "Em Andamento",
  completed: "Concluído",
  declined: "Recusou",
  removed: "Removido",
};

const scheduleStatusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluído",
  delayed: "Atrasado",
  cancelled: "Cancelado",
};

export default function PilotSimulations() {
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddParticipantsOpen, setIsAddParticipantsOpen] = useState(false);
  const [newPilot, setNewPilot] = useState({
    name: "",
    description: "",
    targetParticipants: 30,
    startDate: "",
    endDate: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: pilotsData, isLoading: loadingPilots } = trpc.pilotSimulations.list.useQuery({
    status: "all",
    page: 1,
    limit: 50,
  });

  const { data: pilotDetails, isLoading: loadingDetails } = trpc.pilotSimulations.getById.useQuery(
    { id: selectedPilotId! },
    { enabled: !!selectedPilotId }
  );

  const { data: dashboard, isLoading: loadingDashboard } = trpc.pilotSimulations.getDashboard.useQuery(
    { pilotId: selectedPilotId! },
    { enabled: !!selectedPilotId }
  );

  const { data: availableEmployees } = trpc.pilotSimulations.getAvailableEmployees.useQuery(
    { pilotId: selectedPilotId!, search: employeeSearch },
    { enabled: !!selectedPilotId && isAddParticipantsOpen }
  );

  // Mutations
  const createMutation = trpc.pilotSimulations.create.useMutation({
    onSuccess: () => {
      toast.success("Piloto criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewPilot({ name: "", description: "", targetParticipants: 30, startDate: "", endDate: "" });
      utils.pilotSimulations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao criar piloto: ${error.message}`);
    },
  });

  const addParticipantsMutation = trpc.pilotSimulations.addParticipants.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.added} participante(s) adicionado(s)!`);
      setIsAddParticipantsOpen(false);
      setSelectedEmployees([]);
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar participantes: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.pilotSimulations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.pilotSimulations.list.invalidate();
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
    },
  });

  const updatePhaseMutation = trpc.pilotSimulations.updatePhase.useMutation({
    onSuccess: () => {
      toast.success("Fase atualizada!");
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
  });

  const updateParticipantMutation = trpc.pilotSimulations.updateParticipantStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do participante atualizado!");
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
  });

  const updateScheduleMutation = trpc.pilotSimulations.updateScheduleStep.useMutation({
    onSuccess: () => {
      toast.success("Etapa atualizada!");
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
  });

  // Mutations para dados de demonstração
  const seedDemoMutation = trpc.pilotSimulations.seedDemoData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.pilotSimulations.list.invalidate();
      if (data.pilotId) {
        setSelectedPilotId(data.pilotId);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao gerar dados demo: ${error.message}`);
    },
  });

  const clearDemoMutation = trpc.pilotSimulations.clearDemoData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedPilotId(null);
      utils.pilotSimulations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao limpar dados demo: ${error.message}`);
    },
  });

  const handleGenerateDemo = () => {
    seedDemoMutation.mutate({ pilotName: "Piloto de Demonstração AVD", participantCount: 25 });
  };

  const handleClearDemo = () => {
    if (selectedPilotId && pilotDetails?.pilot?.name?.includes("Demonstração")) {
      clearDemoMutation.mutate({ pilotId: selectedPilotId });
    }
  };

  const _updateScheduleSuccess = trpc.pilotSimulations.updateScheduleStep.useMutation({
    onSuccess: () => {
      toast.success("Etapa atualizada (backup)!");
      utils.pilotSimulations.getById.invalidate({ id: selectedPilotId! });
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
  });

  const recordMetricsMutation = trpc.pilotSimulations.recordMetrics.useMutation({
    onSuccess: () => {
      toast.success("Métricas registradas!");
      utils.pilotSimulations.getDashboard.invalidate({ pilotId: selectedPilotId! });
    },
  });

  const handleCreatePilot = () => {
    if (!newPilot.name || !newPilot.startDate || !newPilot.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate({
      name: newPilot.name,
      description: newPilot.description,
      targetParticipants: newPilot.targetParticipants,
      startDate: new Date(newPilot.startDate),
      endDate: new Date(newPilot.endDate),
    });
  };

  const handleAddParticipants = () => {
    if (selectedEmployees.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }
    addParticipantsMutation.mutate({
      pilotId: selectedPilotId!,
      employeeIds: selectedEmployees,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "default";
      case "draft":
        return "secondary";
      case "paused":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "in_progress":
        return "text-blue-600 bg-blue-50";
      case "ready":
        return "text-purple-600 bg-purple-50";
      case "in_training":
        return "text-yellow-600 bg-yellow-50";
      case "accepted":
        return "text-teal-600 bg-teal-50";
      case "invited":
        return "text-gray-600 bg-gray-50";
      case "declined":
      case "removed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Simulados do Piloto</h1>
            <p className="text-gray-500 mt-1">
              Gerencie pilotos de avaliação com 20-30 colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleGenerateDemo}
              disabled={seedDemoMutation.isPending}
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              {seedDemoMutation.isPending ? "Gerando..." : "Gerar Demo"}
            </Button>
            {selectedPilotId && pilotDetails?.pilot?.name?.includes("Demonstração") && (
              <Button 
                variant="outline" 
                onClick={handleClearDemo}
                disabled={clearDemoMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearDemoMutation.isPending ? "Limpando..." : "Limpar Demo"}
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Piloto
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Piloto</DialogTitle>
                <DialogDescription>
                  Configure um novo piloto de avaliação seguindo o cronograma do material de treinamento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Piloto *</Label>
                  <Input
                    id="name"
                    value={newPilot.name}
                    onChange={(e) => setNewPilot({ ...newPilot, name: e.target.value })}
                    placeholder="Ex: Piloto AVD Q1 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newPilot.description}
                    onChange={(e) => setNewPilot({ ...newPilot, description: e.target.value })}
                    placeholder="Descreva os objetivos do piloto..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Participantes Alvo</Label>
                  <Input
                    id="target"
                    type="number"
                    min={20}
                    max={50}
                    value={newPilot.targetParticipants}
                    onChange={(e) => setNewPilot({ ...newPilot, targetParticipants: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500">Recomendado: 20-30 colaboradores</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newPilot.startDate}
                      onChange={(e) => setNewPilot({ ...newPilot, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Fim *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newPilot.endDate}
                      onChange={(e) => setNewPilot({ ...newPilot, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePilot} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Piloto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pilotos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Pilotos</CardTitle>
              <CardDescription>Selecione um piloto para gerenciar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingPilots ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : pilotsData?.pilots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum piloto criado ainda
                </div>
              ) : (
                pilotsData?.pilots.map((pilot) => (
                  <div
                    key={pilot.id}
                    onClick={() => setSelectedPilotId(pilot.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPilotId === pilot.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{pilot.name}</h3>
                      <Badge variant={getStatusBadgeVariant(pilot.status)}>
                        {statusLabels[pilot.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {pilot.targetParticipants}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {pilot.completionRate || 0}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={pilot.completionRate || 0} className="h-1" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Detalhes do Piloto */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedPilotId ? (
              <Card>
                <CardContent className="py-16 text-center text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um piloto para ver os detalhes</p>
                </CardContent>
              </Card>
            ) : loadingDetails || loadingDashboard ? (
              <Card>
                <CardContent className="py-16 text-center text-gray-500">
                  Carregando detalhes...
                </CardContent>
              </Card>
            ) : pilotDetails && dashboard ? (
              <>
                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-gray-500">Participantes</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {dashboard.stats.totalParticipants}/{pilotDetails.targetParticipants}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-500">Concluídos</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {dashboard.stats.completedParticipants}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-gray-500">Taxa Conclusão</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {dashboard.stats.completionRate}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <span className="text-sm text-gray-500">Progresso</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {dashboard.schedule.progress}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Ações do Piloto */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{pilotDetails.name}</CardTitle>
                        <CardDescription>
                          Fase atual: <strong>{phaseLabels[pilotDetails.phase]}</strong>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {pilotDetails.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ pilotId: selectedPilotId, status: "active" })}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {pilotDetails.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ pilotId: selectedPilotId, status: "paused" })}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        {pilotDetails.status === "paused" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ pilotId: selectedPilotId, status: "active" })}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Retomar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => recordMetricsMutation.mutate({ pilotId: selectedPilotId })}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Atualizar Métricas
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="participants" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="participants">Participantes</TabsTrigger>
                    <TabsTrigger value="schedule">Cronograma</TabsTrigger>
                    <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  </TabsList>

                  {/* Participantes */}
                  <TabsContent value="participants">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Participantes do Piloto</CardTitle>
                          <Dialog open={isAddParticipantsOpen} onOpenChange={setIsAddParticipantsOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Adicionar Participantes</DialogTitle>
                                <DialogDescription>
                                  Selecione colaboradores para participar do piloto.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Input
                                  placeholder="Buscar por nome, email ou matrícula..."
                                  value={employeeSearch}
                                  onChange={(e) => setEmployeeSearch(e.target.value)}
                                />
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                  {availableEmployees?.map((emp) => (
                                    <label
                                      key={emp.id}
                                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(emp.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedEmployees([...selectedEmployees, emp.id]);
                                          } else {
                                            setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                                          }
                                        }}
                                        className="rounded"
                                      />
                                      <div>
                                        <p className="font-medium">{emp.name}</p>
                                        <p className="text-sm text-gray-500">{emp.email}</p>
                                      </div>
                                    </label>
                                  ))}
                                  {availableEmployees?.length === 0 && (
                                    <p className="text-center py-4 text-gray-500">
                                      Nenhum colaborador disponível
                                    </p>
                                  )}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddParticipantsOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleAddParticipants}
                                  disabled={addParticipantsMutation.isPending || selectedEmployees.length === 0}
                                >
                                  Adicionar ({selectedEmployees.length})
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Colaborador</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Progresso</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pilotDetails.participants.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                  Nenhum participante adicionado
                                </TableCell>
                              </TableRow>
                            ) : (
                              pilotDetails.participants.map(({ participant, employee }) => (
                                <TableRow key={participant.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{employee?.name || "—"}</p>
                                      <p className="text-sm text-gray-500">{employee?.email || "—"}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${getParticipantStatusColor(
                                        participant.status
                                      )}`}
                                    >
                                      {participantStatusLabels[participant.status]}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {participant.overallScore !== null ? (
                                      <span className="font-medium">{participant.overallScore}%</span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={participant.status}
                                      onValueChange={(value) =>
                                        updateParticipantMutation.mutate({
                                          participantId: participant.id,
                                          status: value as any,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(participantStatusLabels).map(([value, label]) => (
                                          <SelectItem key={value} value={value}>
                                            {label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Cronograma */}
                  <TabsContent value="schedule">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cronograma do Piloto</CardTitle>
                        <CardDescription>
                          Etapas baseadas no material de treinamento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {pilotDetails.schedule.map((step, index) => (
                            <div
                              key={step.id}
                              className={`p-4 rounded-lg border ${
                                step.status === "completed"
                                  ? "border-green-200 bg-green-50"
                                  : step.status === "in_progress"
                                  ? "border-blue-200 bg-blue-50"
                                  : step.status === "delayed"
                                  ? "border-red-200 bg-red-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      step.status === "completed"
                                        ? "bg-green-500 text-white"
                                        : step.status === "in_progress"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {step.status === "completed" ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      step.stepNumber
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{step.title}</h4>
                                    <p className="text-sm text-gray-500">{step.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                      <span>
                                        Planejado: {new Date(step.plannedStartDate).toLocaleDateString()} -{" "}
                                        {new Date(step.plannedEndDate).toLocaleDateString()}
                                      </span>
                                      {step.actualStartDate && (
                                        <span>
                                          Real: {new Date(step.actualStartDate).toLocaleDateString()}
                                          {step.actualEndDate && ` - ${new Date(step.actualEndDate).toLocaleDateString()}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Select
                                  value={step.status}
                                  onValueChange={(value) =>
                                    updateScheduleMutation.mutate({
                                      stepId: step.id,
                                      status: value as any,
                                      actualStartDate: value === "in_progress" ? new Date() : undefined,
                                      actualEndDate: value === "completed" ? new Date() : undefined,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(scheduleStatusLabels).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Métricas */}
                  <TabsContent value="metrics">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Histórico de Métricas</CardTitle>
                        <CardDescription>
                          Acompanhamento do progresso ao longo do tempo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dashboard.metricsHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma métrica registrada ainda</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4"
                              onClick={() => recordMetricsMutation.mutate({ pilotId: selectedPilotId })}
                            >
                              Registrar Primeira Métrica
                            </Button>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Ativos</TableHead>
                                <TableHead>Concluídos</TableHead>
                                <TableHead>Progresso</TableHead>
                                <TableHead>Score Médio</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dashboard.metricsHistory.map((metric) => (
                                <TableRow key={metric.id}>
                                  <TableCell>
                                    {new Date(metric.recordedAt).toLocaleString()}
                                  </TableCell>
                                  <TableCell>{metric.totalParticipants}</TableCell>
                                  <TableCell>{metric.activeParticipants}</TableCell>
                                  <TableCell>{metric.completedParticipants}</TableCell>
                                  <TableCell>{metric.averageProgress}%</TableCell>
                                  <TableCell>
                                    {metric.averageScore !== null ? `${metric.averageScore}%` : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
