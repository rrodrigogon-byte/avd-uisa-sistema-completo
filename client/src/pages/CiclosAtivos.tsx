import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock, Send, FileDown, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Dashboard de Ciclos Ativos
 * 
 * Funcionalidades:
 * - Listar todos os ciclos em andamento
 * - Indicadores de progresso por ciclo (% de avaliações concluídas)
 * - Alertas para prazos próximos (7 dias, 3 dias, vencido)
 * - Filtros por tipo de ciclo e status
 * - Cards com estatísticas (total de participantes, concluídos, pendentes)
 * - Botão de ações rápidas (enviar lembretes, exportar relatório)
 */

export default function CiclosAtivos() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Queries
  const { data: activeCycles, isLoading, refetch } = trpc.evaluationCycles.getActiveCycles.useQuery();
  const { data: cycleStats } = trpc.evaluationCycles.getCycleStats.useQuery();

  // Mutations
  const sendReminders = trpc.evaluationCycles.sendReminders.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Lembretes enviados para ${data.count} pessoas!`);
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });

  const exportReport = trpc.evaluationCycles.exportCycleReport.useMutation({
    onSuccess: () => {
      toast.success("Relatório exportado com sucesso!");
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });

  // Helpers
  const getDeadlineAlert = (deadline: string | null) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { type: "vencido", label: "Vencido", variant: "destructive" as const, icon: AlertTriangle };
    } else if (diffDays <= 3) {
      return { type: "urgente", label: "3 dias", variant: "destructive" as const, icon: AlertTriangle };
    } else if (diffDays <= 7) {
      return { type: "atencao", label: "7 dias", variant: "default" as const, icon: Clock };
    }
    return null;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Filtrar ciclos
  const filteredCycles = activeCycles?.filter((cycle: any) => {
    const matchesType = typeFilter === "all" || cycle.type === typeFilter;
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
    return matchesType && matchesStatus;
  }) || [];

  // Verificar permissões
  if (!user || (user.role !== "admin" && user.role !== "rh")) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Dashboard de Ciclos Ativos
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o progresso dos ciclos de avaliação em andamento
            </p>
          </div>
        </div>

        {/* KPIs Gerais */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ciclos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cycleStats?.totalActive || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cycleStats?.totalParticipants || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de avaliações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {cycleStats?.totalCompleted || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cycleStats?.completionRate || 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {cycleStats?.totalPending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando resposta</p>
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Ciclo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="performance">Avaliação de Performance</SelectItem>
                    <SelectItem value="360">Avaliação 360°</SelectItem>
                    <SelectItem value="goals">Metas</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="proximo_prazo">Próximo do Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ciclos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredCycles || filteredCycles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum ciclo ativo encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCycles.map((cycle: any) => {
              const selfDeadlineAlert = getDeadlineAlert(cycle.selfEvaluationDeadline);
              const managerDeadlineAlert = getDeadlineAlert(cycle.managerEvaluationDeadline);
              const consensusDeadlineAlert = getDeadlineAlert(cycle.consensusDeadline);

              return (
                <Card key={cycle.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{cycle.name}</CardTitle>
                          <Badge>{cycle.type}</Badge>
                          {(selfDeadlineAlert || managerDeadlineAlert || consensusDeadlineAlert) && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Prazo Próximo
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2">
                          {cycle.description || "Sem descrição"}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            sendReminders.mutate({ cycleId: cycle.id });
                          }}
                          disabled={sendReminders.isPending}
                        >
                          {sendReminders.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Enviar Lembretes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            exportReport.mutate({ cycleId: cycle.id });
                          }}
                          disabled={exportReport.isPending}
                        >
                          {exportReport.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4 mr-2" />
                          )}
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Estatísticas do Ciclo */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Participantes</p>
                          <p className="text-lg font-bold">{cycle.totalParticipants || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Concluídas</p>
                          <p className="text-lg font-bold text-green-600">
                            {cycle.completedCount || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Pendentes</p>
                          <p className="text-lg font-bold text-orange-600">
                            {cycle.pendingCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progresso Geral */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progresso Geral</span>
                        <span className="font-bold">{cycle.progress || 0}%</span>
                      </div>
                      <Progress value={cycle.progress || 0} className="h-3" />
                    </div>

                    {/* Prazos */}
                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                      {cycle.selfEvaluationDeadline && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Autoavaliação</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {new Date(cycle.selfEvaluationDeadline).toLocaleDateString()}
                            </span>
                            {selfDeadlineAlert && (
                              <Badge variant={selfDeadlineAlert.variant} className="text-xs">
                                {selfDeadlineAlert.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {cycle.managerEvaluationDeadline && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Avaliação Gestor</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {new Date(cycle.managerEvaluationDeadline).toLocaleDateString()}
                            </span>
                            {managerDeadlineAlert && (
                              <Badge variant={managerDeadlineAlert.variant} className="text-xs">
                                {managerDeadlineAlert.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {cycle.consensusDeadline && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Consenso</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {new Date(cycle.consensusDeadline).toLocaleDateString()}
                            </span>
                            {consensusDeadlineAlert && (
                              <Badge variant={consensusDeadlineAlert.variant} className="text-xs">
                                {consensusDeadlineAlert.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
