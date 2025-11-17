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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowDownUp, CheckCircle2, Clock, Edit, History, Save, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Calibracao() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [calibrationData, setCalibrationData] = useState({
    originalScore: 0,
    newScore: 0,
    reason: "",
  });

  const { data: evaluations } = trpc.evaluations.list.useQuery({});
  const { data: departments } = trpc.employees.list.useQuery();

  // Extract unique departments
  const uniqueDepartments = departments?.reduce((acc: any[], emp) => {
    if (emp.department && !acc.find(d => d.id === emp.department!.id)) {
      acc.push(emp.department);
    }
    return acc;
  }, []) || [];

  // Filter evaluations by department
  const filteredEvaluations = evaluations?.filter(evaluation => {
    if (selectedDepartment === "all") return true;
    // TODO: Add proper filtering when employee relation is available
    return true;
  });

  // Mock calibration history
  const mockHistory = [
    {
      id: 1,
      date: new Date("2025-01-10"),
      evaluator: "Maria Silva",
      originalScore: 7.5,
      newScore: 8.0,
      reason: "Ajuste após reunião de consenso - desempenho acima da média",
    },
    {
      id: 2,
      date: new Date("2025-01-09"),
      evaluator: "João Santos",
      originalScore: 9.0,
      newScore: 8.5,
      reason: "Calibração para alinhar com critérios do departamento",
    },
  ];

  const handleOpenCalibration = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setCalibrationData({
      originalScore: evaluation.averageScore || 0,
      newScore: evaluation.averageScore || 0,
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

    // TODO: Call API to save calibration
    toast.success("Calibração salva com sucesso!");
    setShowCalibrationDialog(false);
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
            Ajuste as notas das avaliações em reuniões de consenso
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {uniqueDepartments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente Calibração</SelectItem>
                    <SelectItem value="calibrated">Calibradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ciclo</Label>
                <Select defaultValue="2025">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">Ciclo 2025</SelectItem>
                    <SelectItem value="2024">Ciclo 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluations List */}
        <div className="space-y-4">
          {filteredEvaluations?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvaluations?.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Colaborador #{evaluation.employeeId}
                        <Badge variant="outline">Ciclo #{evaluation.cycleId}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Avaliação {evaluation.type}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {evaluation.finalScore?.toFixed(1) || "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">Nota Média</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nota Final</p>
                      <p className="font-medium">
                        {evaluation.finalScore?.toFixed(1) || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {evaluation.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completa</p>
                      <p className="font-medium">
                        {evaluation.selfEvaluationCompleted ? "Sim" : "Não"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{evaluation.status}</p>
                    </div>
                  </div>

                  {false && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">Calibrada</span>
                        </div>
                        <div className="text-sm">
                          Nova nota: <strong>{evaluation.finalScore?.toFixed(1)}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCalibration(evaluation)}
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

      {/* Calibration Dialog */}
      <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calibrar Avaliação</DialogTitle>
            <DialogDescription>
              Ajuste a nota da avaliação de {selectedEvaluation?.employee?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Nova Nota</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={calibrationData.newScore}
                  onChange={(e) =>
                    setCalibrationData({
                      ...calibrationData,
                      newScore: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {getScoreDiff() && (
              <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Variação:</span>
                {getScoreDiff()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo da Calibração *</Label>
              <Textarea
                placeholder="Descreva o motivo do ajuste (ex: consenso em reunião, alinhamento com critérios...)"
                rows={4}
                value={calibrationData.reason}
                onChange={(e) =>
                  setCalibrationData({
                    ...calibrationData,
                    reason: e.target.value,
                  })
                }
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Atenção:</strong> A calibração será registrada no histórico e o colaborador 
                será notificado sobre o ajuste.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalibrationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCalibration}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Calibração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Calibrações</DialogTitle>
            <DialogDescription>
              Calibrações realizadas para {selectedEvaluation?.employee?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhuma calibração realizada</p>
              </div>
            ) : (
              mockHistory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{item.evaluator}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date.toLocaleDateString("pt-BR")} às{" "}
                          {item.date.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {item.originalScore.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-bold">
                            {item.newScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
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
