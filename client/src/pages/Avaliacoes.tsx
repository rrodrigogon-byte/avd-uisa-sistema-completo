import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { AlertCircle, CheckCircle2, Clock, Users, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Avaliacoes() {
  const [isCreateCycleDialogOpen, setIsCreateCycleDialogOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({
    name: "",
    year: new Date().getFullYear(),
    type: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const { data: evaluations } = trpc.evaluations.list.useQuery({});
  const { data: employee } = trpc.employees.getCurrent.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pendente: { variant: "outline", label: "Pendente", icon: Clock },
      em_andamento: { variant: "default", label: "Em Andamento", icon: AlertCircle },
      concluida: { variant: "default", label: "Concluída", icon: CheckCircle2 },
      cancelada: { variant: "destructive", label: "Cancelada", icon: AlertCircle },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateProgress = (evaluation: any) => {
    let completed = 0;
    let total = 0;

    if (evaluation.type === "360") {
      total = 4; // auto, gestor, pares, subordinados
      if (evaluation.selfEvaluationCompleted) completed++;
      if (evaluation.managerEvaluationCompleted) completed++;
      if (evaluation.peersEvaluationCompleted) completed++;
      if (evaluation.subordinatesEvaluationCompleted) completed++;
    } else {
      total = 1;
      if (evaluation.selfEvaluationCompleted || evaluation.managerEvaluationCompleted) completed = 1;
    }

    return Math.round((completed / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Avaliações de Desempenho
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe suas avaliações 360° e feedback de desempenho
            </p>
          </div>
          <Button onClick={() => setIsCreateCycleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Ciclo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliações Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations?.filter(e => e.status === "em_andamento").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations?.filter(e => e.status === "pendente").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations?.filter(e => e.status === "concluida").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evaluations List */}
        <div className="space-y-4">
          {evaluations?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação disponível</h3>
                <p className="text-muted-foreground text-center">
                  Aguarde o início do próximo ciclo de avaliação
                </p>
              </CardContent>
            </Card>
          ) : (
            evaluations?.map((evaluation) => {
              const progress = calculateProgress(evaluation);
              
              return (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          Avaliação {evaluation.type === "360" ? "360°" : "Tradicional"}
                          {getStatusBadge(evaluation.status)}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Ciclo {new Date().getFullYear()} - {evaluation.type === "360" ? "Feedback completo de múltiplas perspectivas" : "Avaliação de desempenho"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluation.type === "360" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          {evaluation.selfEvaluationCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Autoavaliação</p>
                            <p className="text-xs text-muted-foreground">
                              {evaluation.selfEvaluationCompleted ? "Concluída" : "Pendente"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {evaluation.managerEvaluationCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Gestor</p>
                            <p className="text-xs text-muted-foreground">
                              {evaluation.managerEvaluationCompleted ? "Concluída" : "Pendente"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {evaluation.peersEvaluationCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Pares</p>
                            <p className="text-xs text-muted-foreground">
                              {evaluation.peersEvaluationCompleted ? "Concluída" : "Pendente"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {evaluation.subordinatesEvaluationCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Equipe</p>
                            <p className="text-xs text-muted-foreground">
                              {evaluation.subordinatesEvaluationCompleted ? "Concluída" : "Pendente"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso geral</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {evaluation.status === "em_andamento" && (
                      <div className="flex gap-2 pt-2">
                        {!evaluation.selfEvaluationCompleted && (
                          <Button>
                            Iniciar Autoavaliação
                          </Button>
                        )}

                      </div>
                    )}

                    {evaluation.status === "concluida" && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Avaliação Concluída</p>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            Ver Relatório Completo
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Sobre a Avaliação 360°</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              A avaliação 360° coleta feedback de múltiplas perspectivas para fornecer uma visão completa do seu desempenho:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Autoavaliação:</strong> Sua própria percepção sobre seu desempenho</li>
              <li><strong>Gestor:</strong> Avaliação do seu líder direto</li>
              <li><strong>Pares:</strong> Feedback de colegas do mesmo nível</li>
              <li><strong>Equipe:</strong> Avaliação dos seus subordinados (se aplicável)</li>
            </ul>
            <p className="pt-2">
              O resultado consolidado ajuda a identificar pontos fortes e oportunidades de desenvolvimento.
            </p>
          </CardContent>
        </Card>

        {/* Dialog de Criação de Ciclo */}
        <Dialog open={isCreateCycleDialogOpen} onOpenChange={setIsCreateCycleDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Criar Novo Ciclo de Avaliação
              </DialogTitle>
              <DialogDescription>
                Configure um novo ciclo de avaliação de desempenho para sua organização
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nome do Ciclo */}
              <div className="space-y-2">
                <Label htmlFor="cycle-name">Nome do Ciclo *</Label>
                <Input
                  id="cycle-name"
                  placeholder="Ex: Ciclo de Avaliação 2025"
                  value={newCycle.name}
                  onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                />
              </div>

              {/* Ano e Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle-year">Ano *</Label>
                  <Input
                    id="cycle-year"
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 5}
                    value={newCycle.year}
                    onChange={(e) => setNewCycle({ ...newCycle, year: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-type">Tipo *</Label>
                  <Select
                    value={newCycle.type}
                    onValueChange={(value) => setNewCycle({ ...newCycle, type: value })}
                  >
                    <SelectTrigger id="cycle-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle-start">Data de Início *</Label>
                  <Input
                    id="cycle-start"
                    type="date"
                    value={newCycle.startDate}
                    onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-end">Data de Fim *</Label>
                  <Input
                    id="cycle-end"
                    type="date"
                    value={newCycle.endDate}
                    onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="cycle-description">Descrição</Label>
                <Textarea
                  id="cycle-description"
                  placeholder="Descreva os objetivos e escopo deste ciclo..."
                  value={newCycle.description}
                  onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Informação */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Importante:</strong> Após criar o ciclo, você poderá ativá-lo e iniciar as avaliações de desempenho.
                  Certifique-se de que as datas estão corretas antes de criar.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateCycleDialogOpen(false);
                  setNewCycle({
                    name: "",
                    year: new Date().getFullYear(),
                    type: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!newCycle.name || !newCycle.type || !newCycle.startDate || !newCycle.endDate) {
                    toast.error("Preencha todos os campos obrigatórios");
                    return;
                  }

                  if (new Date(newCycle.startDate) >= new Date(newCycle.endDate)) {
                    toast.error("A data de início deve ser anterior à data de fim");
                    return;
                  }

                  // TODO: Integrar com backend
                  toast.success(`Ciclo "${newCycle.name}" criado com sucesso!`);
                  setIsCreateCycleDialogOpen(false);
                  setNewCycle({
                    name: "",
                    year: new Date().getFullYear(),
                    type: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  });
                }}
                disabled={!newCycle.name || !newCycle.type || !newCycle.startDate || !newCycle.endDate}
              >
                Criar Ciclo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
