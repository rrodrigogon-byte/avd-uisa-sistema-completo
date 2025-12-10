import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowDownUp, CheckCircle2, Edit, Filter, History, Loader2, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Página de Calibração de Avaliações
 * Permite ajustar notas de avaliações em reuniões de consenso
 */

export default function Calibracao() {
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [calibrationData, setCalibrationData] = useState({
    originalScore: 0,
    newScore: 0,
    reason: "",
  });

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    department: "all",
    cycle: "all",
    status: "all",
  });

  // Buscar avaliações
  const { data: evaluations, isLoading, refetch } = trpc.calibration.getEvaluations.useQuery({});

  // Buscar departamentos e ciclos para filtros
  const { data: departments } = trpc.employees.getDepartments.useQuery();
  const { data: cycles } = trpc.evaluationCycles.list.useQuery();

  // Filtrar avaliações
  const filteredEvaluations = evaluations?.filter((evaluation) => {
    const matchSearch = filters.search === "" || 
      evaluation.employeeName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      evaluation.employeeCode?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchDepartment = filters.department === "all" || 
      evaluation.departmentId?.toString() === filters.department;
    
    const matchCycle = filters.cycle === "all" || 
      evaluation.cycleId?.toString() === filters.cycle;
    
    const matchStatus = filters.status === "all" || 
      evaluation.status === filters.status;
    
    return matchSearch && matchDepartment && matchCycle && matchStatus;
  }) || [];

  // Buscar histórico de calibração
  const { data: history } = trpc.calibration.getHistory.useQuery(
    { evaluationId: selectedEvaluation?.id || 0 },
    { enabled: !!selectedEvaluation && showHistoryDialog }
  );

  // Mutation para salvar calibração
  const saveCalibrationMutation = trpc.calibration.saveCalibration.useMutation({
    onSuccess: () => {
      toast.success("Calibração salva com sucesso!");
      setShowCalibrationDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar calibração: ${error.message}`);
    },
  });

  const handleOpenCalibration = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setCalibrationData({
      originalScore: evaluation.finalScore || 0,
      newScore: evaluation.finalScore || 0,
      reason: "",
    });
    setShowCalibrationDialog(true);
  };

  const handleSaveCalibration = () => {
    if (!calibrationData.reason.trim()) {
      toast.error("Por favor, informe o motivo da calibração");
      return;
    }

    if (calibrationData.newScore === calibrationData.originalScore) {
      toast.error("A nova nota deve ser diferente da nota original");
      return;
    }

    if (calibrationData.newScore < 0 || calibrationData.newScore > 100) {
      toast.error("A nota deve estar entre 0 e 100");
      return;
    }

    // Criar sessão temporária (em produção, criar sessão antes)
    saveCalibrationMutation.mutate({
      sessionId: 1, // TODO: Criar sessão real
      evaluationId: selectedEvaluation.id,
      originalScore: calibrationData.originalScore,
      calibratedScore: calibrationData.newScore,
      reason: calibrationData.reason,
    });
  };

  const getScoreDiff = () => {
    const diff = calibrationData.newScore - calibrationData.originalScore;
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span>+{diff.toFixed(1)}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" />
          <span>{diff.toFixed(1)}</span>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowDownUp className="h-8 w-8" />
            Calibração de Avaliações
          </h1>
          <p className="text-muted-foreground mt-2">
            Ajuste as notas das avaliações em reuniões de consenso para garantir consistência
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluations?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {evaluations?.filter(e => e.status === "concluida").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {evaluations?.filter(e => e.status === "em_andamento").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations && evaluations.length > 0
                  ? (evaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / evaluations.length).toFixed(1)
                  : "0.0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="space-y-2">
                <Label>Buscar Colaborador</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou chapa..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments?.filter(dept => dept.id).map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id!.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ciclo */}
              <div className="space-y-2">
                <Label>Ciclo de Avaliação</Label>
                <Select
                  value={filters.cycle}
                  onValueChange={(value) => setFilters({ ...filters, cycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cycles?.filter(cycle => cycle.id).map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id!.toString()}>
                        {cycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 text-sm text-muted-foreground">
              Exibindo {filteredEvaluations.length} de {evaluations?.length || 0} avaliações
            </div>
          </CardContent>
        </Card>

        {/* Lista de Avaliações */}
        <div className="space-y-4">
          {!filteredEvaluations || filteredEvaluations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {evaluations && evaluations.length > 0 
                    ? "Nenhuma avaliação encontrada com os filtros selecionados" 
                    : "Nenhuma avaliação encontrada"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvaluations.map((evaluation: any) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {evaluation.employeeName || `Colaborador #${evaluation.employeeId}`}
                        <Badge variant="outline">Ciclo #{evaluation.cycleId}</Badge>
                        <Badge variant={
                          evaluation.status === "concluida" ? "default" :
                          evaluation.status === "em_andamento" ? "secondary" : "outline"
                        }>
                          {evaluation.status === "concluida" ? "Concluída" :
                           evaluation.status === "em_andamento" ? "Em Andamento" : "Pendente"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Avaliação {evaluation.type}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {evaluation.finalScore !== null ? evaluation.finalScore.toFixed(1) : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">Nota Final</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Autoavaliação</p>
                      <p className="font-medium flex items-center gap-1">
                        {evaluation.selfEvaluationCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Completa
                          </>
                        ) : (
                          "Pendente"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gestor</p>
                      <p className="font-medium flex items-center gap-1">
                        {evaluation.managerEvaluationCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Completa
                          </>
                        ) : (
                          "Pendente"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pares</p>
                      <p className="font-medium flex items-center gap-1">
                        {evaluation.peersEvaluationCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Completa
                          </>
                        ) : (
                          "Pendente"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Subordinados</p>
                      <p className="font-medium flex items-center gap-1">
                        {evaluation.subordinatesEvaluationCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Completa
                          </>
                        ) : (
                          "Pendente"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCalibration(evaluation)}
                      disabled={!evaluation.finalScore}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Calibrar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvaluation(evaluation);
                        setShowHistoryDialog(true);
                      }}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog de Calibração */}
      <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calibrar Avaliação</DialogTitle>
            <DialogDescription>
              Ajuste a nota final da avaliação e informe o motivo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nota Original</Label>
              <Input
                type="number"
                value={calibrationData.originalScore}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Nova Nota (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={calibrationData.newScore}
                onChange={(e) => setCalibrationData({
                  ...calibrationData,
                  newScore: parseFloat(e.target.value) || 0
                })}
              />
            </div>

            {getScoreDiff() && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Diferença:</span>
                {getScoreDiff()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo da Calibração *</Label>
              <Textarea
                placeholder="Descreva o motivo do ajuste (ex: alinhamento com critérios do departamento, consenso da equipe...)"
                value={calibrationData.reason}
                onChange={(e) => setCalibrationData({
                  ...calibrationData,
                  reason: e.target.value
                })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalibrationDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCalibration}
              disabled={saveCalibrationMutation.isPending}
            >
              {saveCalibrationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Calibração"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Calibrações</DialogTitle>
            <DialogDescription>
              Todas as calibrações realizadas para esta avaliação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {!history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma calibração realizada ainda
              </div>
            ) : (
              history.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {item.originalScore} → {item.calibratedScore}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Revisado por #{item.reviewedBy}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <p className="text-sm mt-2 p-3 bg-muted rounded">
                      {item.reason}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
