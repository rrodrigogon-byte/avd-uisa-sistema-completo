import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Users,
  Target,
  Scale,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Página de Detalhes do Ciclo 360°
 * Exibe informações completas de um ciclo específico
 */

export default function Ciclos360Detalhes() {
  const [, params] = useRoute("/ciclos-360/detalhes/:id");
  const [, setLocation] = useLocation();
  const cycleId = params?.id ? parseInt(params.id) : 0;

  // Buscar detalhes do ciclo
  const { data: details, isLoading } = trpc.cycles360Overview.getCycleDetails.useQuery(
    { cycleId },
    { enabled: cycleId > 0 }
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      planejado: { variant: "secondary", icon: Clock, label: "Planejado" },
      ativo: { variant: "default", icon: TrendingUp, label: "Ativo" },
      concluido: { variant: "success", icon: CheckCircle2, label: "Concluído" },
      cancelado: { variant: "destructive", icon: XCircle, label: "Cancelado" },
    };

    const config = variants[status] || variants.planejado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getParticipantStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      in_progress: { variant: "default", label: "Em Progresso" },
      completed: { variant: "success", label: "Concluído" },
    };

    const config = variants[status] || variants.pending;

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Ciclo não encontrado</h3>
          <Button variant="outline" onClick={() => setLocation("/ciclos-360/visao-geral")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { cycle, config, weights, competencies, participants } = details;

  // Preparar dados para gráfico de pesos
  const weightsData = weights
    ? {
        labels: ["Autoavaliação", "Gestor", "Pares", "Subordinados"],
        datasets: [
          {
            label: "Pesos (%)",
            data: [weights.selfWeight, weights.managerWeight, weights.peersWeight, weights.subordinatesWeight],
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 2,
          },
        ],
      }
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/ciclos-360/visao-geral")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{cycle.name}</h1>
                {getStatusBadge(cycle.status)}
              </div>
              {cycle.description && (
                <p className="text-muted-foreground mt-2">{cycle.description}</p>
              )}
            </div>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-foreground">
                {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Ano: {cycle.year} • Tipo: {cycle.type}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{participants.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total de colaboradores</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Competências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{competencies.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Competências avaliadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {participants.length > 0
                  ? Math.round(
                      (participants.filter((p) => p.status === "completed").length / participants.length) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-xs text-muted-foreground mt-1">Taxa de conclusão</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="weights" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weights">
              <Scale className="h-4 w-4 mr-2" />
              Pesos
            </TabsTrigger>
            <TabsTrigger value="competencies">
              <Target className="h-4 w-4 mr-2" />
              Competências
            </TabsTrigger>
            <TabsTrigger value="participants">
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </TabsTrigger>
            <TabsTrigger value="config">
              <Calendar className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
          </TabsList>

          {/* Tab: Pesos */}
          <TabsContent value="weights">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pesos</CardTitle>
                <CardDescription>Pesos atribuídos a cada dimensão de avaliação</CardDescription>
              </CardHeader>
              <CardContent>
                {weights ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Autoavaliação</span>
                            <span className="text-sm font-bold text-foreground">{weights.selfWeight}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${weights.selfWeight}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Gestor</span>
                            <span className="text-sm font-bold text-foreground">{weights.managerWeight}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${weights.managerWeight}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Pares</span>
                            <span className="text-sm font-bold text-foreground">{weights.peersWeight}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${weights.peersWeight}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Subordinados</span>
                            <span className="text-sm font-bold text-foreground">{weights.subordinatesWeight}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${weights.subordinatesWeight}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {weightsData && (
                        <div className="flex items-center justify-center">
                          <div className="w-full max-w-md">
                            <Radar data={weightsData} options={{ responsive: true, maintainAspectRatio: true }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prazos */}
                    {(weights.selfEvaluationDeadline ||
                      weights.managerEvaluationDeadline ||
                      weights.peersEvaluationDeadline ||
                      weights.subordinatesEvaluationDeadline) && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Prazos de Avaliação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {weights.selfEvaluationDeadline && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Autoavaliação:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(weights.selfEvaluationDeadline)}
                              </span>
                            </div>
                          )}
                          {weights.managerEvaluationDeadline && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Gestor:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(weights.managerEvaluationDeadline)}
                              </span>
                            </div>
                          )}
                          {weights.peersEvaluationDeadline && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Pares:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(weights.peersEvaluationDeadline)}
                              </span>
                            </div>
                          )}
                          {weights.subordinatesEvaluationDeadline && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Subordinados:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(weights.subordinatesEvaluationDeadline)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Pesos não configurados para este ciclo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Competências */}
          <TabsContent value="competencies">
            <Card>
              <CardHeader>
                <CardTitle>Competências Avaliadas</CardTitle>
                <CardDescription>{competencies.length} competência(s) configurada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {competencies.length > 0 ? (
                  <div className="space-y-4">
                    {competencies.map((comp, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-2">
                                Competência ID: {comp.competencyId}
                              </h4>
                              {comp.description && (
                                <p className="text-sm text-muted-foreground mb-3">{comp.description}</p>
                              )}
                              <div className="flex gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Peso:</span>
                                  <span className="font-medium text-foreground ml-1">{comp.weight}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Nível Mínimo:</span>
                                  <span className="font-medium text-foreground ml-1">{comp.minLevel}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Nível Máximo:</span>
                                  <span className="font-medium text-foreground ml-1">{comp.maxLevel}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma competência configurada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Participantes */}
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Participantes do Ciclo</CardTitle>
                <CardDescription>{participants.length} colaborador(es) participando</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {participant.employeeData?.name || `Colaborador #${participant.employeeId}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Tipo: {participant.participationType}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getParticipantStatusBadge(participant.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum participante cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configuração */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Ciclo</CardTitle>
                <CardDescription>Status do wizard de configuração</CardDescription>
              </CardHeader>
              <CardContent>
                {config ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Etapa Atual</div>
                        <div className="text-sm text-muted-foreground">Etapa {config.currentStep} de 4</div>
                      </div>
                      <Badge variant={config.isCompleted ? "success" : "default"}>
                        {config.isCompleted ? "Completo" : "Em Configuração"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            config.currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          1
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Dados Básicos</div>
                          <div className="text-sm text-muted-foreground">Nome, período e tipo do ciclo</div>
                        </div>
                        {config.currentStep >= 1 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            config.currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          2
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Pesos</div>
                          <div className="text-sm text-muted-foreground">Distribuição de pesos das avaliações</div>
                        </div>
                        {config.currentStep >= 2 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            config.currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          3
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Competências</div>
                          <div className="text-sm text-muted-foreground">Seleção de competências a avaliar</div>
                        </div>
                        {config.currentStep >= 3 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            config.currentStep >= 4 ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          4
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Participantes</div>
                          <div className="text-sm text-muted-foreground">Definição de participantes e avaliadores</div>
                        </div>
                        {config.isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Configuração não disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
