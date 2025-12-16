import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  Clock,
  Calendar,
  Link2,
  Unlink,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/_core/hooks/useAuth";

// Categorias de rotinas
const CATEGORIES = {
  processo: { label: "Processo", color: "bg-blue-500" },
  analise: { label: "Análise", color: "bg-purple-500" },
  planejamento: { label: "Planejamento", color: "bg-green-500" },
  comunicacao: { label: "Comunicação", color: "bg-yellow-500" },
  reuniao: { label: "Reunião", color: "bg-orange-500" },
  relatorio: { label: "Relatório", color: "bg-indigo-500" },
  suporte: { label: "Suporte", color: "bg-pink-500" },
  administrativo: { label: "Administrativo", color: "bg-gray-500" },
  outros: { label: "Outros", color: "bg-slate-500" },
};

const FREQUENCIES = {
  diaria: { label: "Diária", multiplier: 22 },
  semanal: { label: "Semanal", multiplier: 4 },
  quinzenal: { label: "Quinzenal", multiplier: 2 },
  mensal: { label: "Mensal", multiplier: 1 },
  trimestral: { label: "Trimestral", multiplier: 0.33 },
  eventual: { label: "Eventual", multiplier: 0.5 },
};

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export default function MapeamentoRotinas() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const [selectedRoutineForLink, setSelectedRoutineForLink] = useState<any>(null);
  const [reportDialog, setReportDialog] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<string>("diaria");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [category, setCategory] = useState<string>("processo");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Link form state
  const [selectedResponsibilityId, setSelectedResponsibilityId] = useState<number | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number>(100);
  const [matchNotes, setMatchNotes] = useState("");

  // Report form state
  const [reportPeriodStart, setReportPeriodStart] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [reportPeriodEnd, setReportPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState<number | null>(null);

  // Mock employeeId - em produção viria do contexto de autenticação
  const employeeId = user?.id || 1;

  // Queries
  const { data: routines, refetch: refetchRoutines } = trpc.activityMapping.listRoutines.useQuery({
    employeeId,
    includeInactive: false,
  });

  const { data: jobDescriptions } = trpc.jobDescriptions.list.useQuery({});

  const { data: responsibilities } = trpc.activityMapping.getJobResponsibilities.useQuery(
    { jobDescriptionId: selectedJobDescriptionId || 0 },
    { enabled: !!selectedJobDescriptionId }
  );

  const { data: matchReports } = trpc.activityMapping.listMatchReports.useQuery({
    employeeId,
    limit: 10,
  });

  // Mutations
  const createRoutineMutation = trpc.activityMapping.createRoutine.useMutation({
    onSuccess: () => {
      toast.success("Rotina criada com sucesso!");
      setDialogOpen(false);
      resetForm();
      refetchRoutines();
    },
    onError: (error) => {
      toast.error("Erro ao criar rotina: " + error.message);
    },
  });

  const updateRoutineMutation = trpc.activityMapping.updateRoutine.useMutation({
    onSuccess: () => {
      toast.success("Rotina atualizada com sucesso!");
      setDialogOpen(false);
      setEditingRoutine(null);
      resetForm();
      refetchRoutines();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar rotina: " + error.message);
    },
  });

  const deleteRoutineMutation = trpc.activityMapping.deleteRoutine.useMutation({
    onSuccess: () => {
      toast.success("Rotina excluída com sucesso!");
      refetchRoutines();
    },
    onError: (error) => {
      toast.error("Erro ao excluir rotina: " + error.message);
    },
  });

  const linkToJobMutation = trpc.activityMapping.linkToJobDescription.useMutation({
    onSuccess: () => {
      toast.success("Rotina vinculada à descrição de cargo!");
      setLinkDialog(false);
      setSelectedRoutineForLink(null);
      resetLinkForm();
      refetchRoutines();
    },
    onError: (error) => {
      toast.error("Erro ao vincular: " + error.message);
    },
  });

  const generateReportMutation = trpc.activityMapping.generateMatchReport.useMutation({
    onSuccess: (data) => {
      toast.success(`Relatório gerado! Aderência: ${data.summary.adherencePercentage}%`);
      setReportDialog(false);
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setFrequency("diaria");
    setEstimatedMinutes(30);
    setCategory("processo");
    setWeekDays([1, 2, 3, 4, 5]);
  };

  const resetLinkForm = () => {
    setSelectedResponsibilityId(null);
    setMatchPercentage(100);
    setMatchNotes("");
    setSelectedJobDescriptionId(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editingRoutine) {
      updateRoutineMutation.mutate({
        id: editingRoutine.id,
        name,
        description,
        frequency: frequency as any,
        estimatedMinutes,
        category: category as any,
        weekDays,
      });
    } else {
      createRoutineMutation.mutate({
        employeeId,
        name,
        description,
        frequency: frequency as any,
        estimatedMinutes,
        category: category as any,
        weekDays,
      });
    }
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine);
    setName(routine.name);
    setDescription(routine.description || "");
    setFrequency(routine.frequency);
    setEstimatedMinutes(routine.estimatedMinutes || 30);
    setCategory(routine.category);
    setWeekDays(routine.weekDays ? JSON.parse(routine.weekDays) : [1, 2, 3, 4, 5]);
    setDialogOpen(true);
  };

  const handleLink = (routine: any) => {
    setSelectedRoutineForLink(routine);
    setLinkDialog(true);
  };

  const handleLinkSubmit = () => {
    if (!selectedResponsibilityId) {
      toast.error("Selecione uma responsabilidade");
      return;
    }

    linkToJobMutation.mutate({
      routineId: selectedRoutineForLink.id,
      responsibilityId: selectedResponsibilityId,
      matchPercentage,
      matchNotes,
    });
  };

  const handleGenerateReport = () => {
    if (!selectedJobDescriptionId) {
      toast.error("Selecione uma descrição de cargo");
      return;
    }

    generateReportMutation.mutate({
      employeeId,
      jobDescriptionId: selectedJobDescriptionId,
      periodStart: reportPeriodStart,
      periodEnd: reportPeriodEnd,
    });
  };

  // Calcular estatísticas
  const totalMinutesPerMonth = routines?.reduce((sum, r) => {
    const freq = FREQUENCIES[r.frequency as keyof typeof FREQUENCIES];
    return sum + (r.estimatedMinutes || 0) * (freq?.multiplier || 1);
  }, 0) || 0;

  const linkedRoutines = routines?.filter((r) => r.isLinkedToJobDescription) || [];
  const unlinkedRoutines = routines?.filter((r) => !r.isLinkedToJobDescription) || [];

  const getCategoryBadge = (cat: string) => {
    const config = CATEGORIES[cat as keyof typeof CATEGORIES] || CATEGORIES.outros;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getFrequencyLabel = (freq: string) => {
    return FREQUENCIES[freq as keyof typeof FREQUENCIES]?.label || freq;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mapeamento de Rotinas</h1>
            <p className="text-muted-foreground">
              Registre suas atividades recorrentes e vincule à descrição de cargo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReportDialog(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Gerar Relatório
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rotina
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total de Rotinas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{routines?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horas/Mês Estimadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(totalMinutesPerMonth / 60).toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Vinculadas ao Cargo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{linkedRoutines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Unlink className="w-4 h-4" />
                Não Vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{unlinkedRoutines.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Indicador de Aderência */}
        {routines && routines.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Aderência ao Cargo</CardTitle>
              <CardDescription>
                Percentual de rotinas vinculadas à descrição de cargo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress
                  value={(linkedRoutines.length / routines.length) * 100}
                  className="flex-1"
                />
                <span className="text-2xl font-bold">
                  {Math.round((linkedRoutines.length / routines.length) * 100)}%
                </span>
              </div>
              {unlinkedRoutines.length > 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {unlinkedRoutines.length} rotina(s) ainda não vinculada(s) à descrição de cargo
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="routines" className="space-y-4">
          <TabsList>
            <TabsTrigger value="routines">Minhas Rotinas</TabsTrigger>
            <TabsTrigger value="reports">Relatórios de Confronto</TabsTrigger>
          </TabsList>

          {/* Tab: Rotinas */}
          <TabsContent value="routines">
            <Card>
              <CardHeader>
                <CardTitle>Rotinas Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Tempo Est.</TableHead>
                      <TableHead>Vinculada</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routines?.map((routine: any) => (
                      <TableRow key={routine.id}>
                        <TableCell className="font-medium">{routine.name}</TableCell>
                        <TableCell>{getCategoryBadge(routine.category)}</TableCell>
                        <TableCell>{getFrequencyLabel(routine.frequency)}</TableCell>
                        <TableCell>{routine.estimatedMinutes} min</TableCell>
                        <TableCell>
                          {routine.isLinkedToJobDescription ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Vinculada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <Unlink className="w-3 h-3 mr-1" />
                              Não Vinculada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(routine)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!routine.isLinkedToJobDescription && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600"
                                onClick={() => handleLink(routine)}
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600"
                              onClick={() => deleteRoutineMutation.mutate({ id: routine.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!routines || routines.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma rotina cadastrada. Clique em "Nova Rotina" para começar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Relatórios */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Confronto</CardTitle>
                <CardDescription>
                  Comparativo entre suas atividades e a descrição de cargo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Aderência</TableHead>
                      <TableHead>Cobertura</TableHead>
                      <TableHead>Gaps</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchReports?.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {new Date(report.periodStart).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(report.periodEnd).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={report.adherencePercentage} className="w-20" />
                            <span>{report.adherencePercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={report.coveragePercentage} className="w-20" />
                            <span>{report.coveragePercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.activitiesNotInJob + report.responsibilitiesNotExecuted}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              report.status === "reviewed"
                                ? "bg-green-500"
                                : report.status === "completed"
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                            }
                          >
                            {report.status === "reviewed"
                              ? "Revisado"
                              : report.status === "completed"
                              ? "Concluído"
                              : "Processando"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!matchReports || matchReports.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum relatório gerado. Clique em "Gerar Relatório" para criar um.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Nova/Editar Rotina */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDialogOpen(false);
              setEditingRoutine(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRoutine ? "Editar Rotina" : "Nova Rotina"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Rotina *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Análise de relatórios diários"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a rotina..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequência *</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCIES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tempo Estimado (min) *</Label>
                  <Input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
              {(frequency === "diaria" || frequency === "semanal") && (
                <div>
                  <Label>Dias da Semana</Label>
                  <div className="flex gap-2 mt-2">
                    {WEEK_DAYS.map((day) => (
                      <div key={day.value} className="flex items-center gap-1">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={weekDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setWeekDays([...weekDays, day.value]);
                            } else {
                              setWeekDays(weekDays.filter((d) => d !== day.value));
                            }
                          }}
                        />
                        <label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRoutineMutation.isPending || updateRoutineMutation.isPending}
              >
                {editingRoutine ? "Salvar" : "Criar Rotina"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Vincular à Descrição de Cargo */}
        <Dialog
          open={linkDialog}
          onOpenChange={(open) => {
            if (!open) {
              setLinkDialog(false);
              setSelectedRoutineForLink(null);
              resetLinkForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vincular Rotina à Descrição de Cargo</DialogTitle>
              <DialogDescription>
                {selectedRoutineForLink && (
                  <>
                    Rotina: <strong>{selectedRoutineForLink.name}</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição de Cargo *</Label>
                <Select
                  value={selectedJobDescriptionId?.toString() || ""}
                  onValueChange={(val) => setSelectedJobDescriptionId(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma descrição de cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions?.map((jd: any) => (
                      <SelectItem key={jd.id} value={jd.id.toString()}>
                        {jd.positionTitle} - {jd.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedJobDescriptionId && (
                <div>
                  <Label>Responsabilidade do Cargo *</Label>
                  <Select
                    value={selectedResponsibilityId?.toString() || ""}
                    onValueChange={(val) => setSelectedResponsibilityId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma responsabilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsibilities?.map((resp: any) => (
                        <SelectItem key={resp.id} value={resp.id.toString()}>
                          {resp.description?.substring(0, 80)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Percentual de Correspondência</Label>
                  <Input
                    type="number"
                    value={matchPercentage}
                    onChange={(e) => setMatchPercentage(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Observações sobre a correspondência..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLinkSubmit} disabled={linkToJobMutation.isPending}>
                <Link2 className="w-4 h-4 mr-2" />
                Vincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Gerar Relatório */}
        <Dialog open={reportDialog} onOpenChange={setReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Relatório de Confronto</DialogTitle>
              <DialogDescription>
                Compare suas atividades com a descrição de cargo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição de Cargo *</Label>
                <Select
                  value={selectedJobDescriptionId?.toString() || ""}
                  onValueChange={(val) => setSelectedJobDescriptionId(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma descrição de cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions?.map((jd: any) => (
                      <SelectItem key={jd.id} value={jd.id.toString()}>
                        {jd.positionTitle} - {jd.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início *</Label>
                  <Input
                    type="date"
                    value={reportPeriodStart}
                    onChange={(e) => setReportPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Fim *</Label>
                  <Input
                    type="date"
                    value={reportPeriodEnd}
                    onChange={(e) => setReportPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
