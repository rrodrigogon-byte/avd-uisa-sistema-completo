// @ts-nocheck
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { CheckCircle2, Clock, Users, Loader2, TrendingUp, AlertCircle, BarChart3, Download, Plus } from "lucide-react";
import { export360PDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { useState } from "react";
import { Radar } from "react-chartjs-2";
import { useLocation } from "wouter";
import { DuplicateCycleDialog } from "@/components/DuplicateCycleDialog";
import { Copy } from "lucide-react";



/**
 * Página de Avaliação 360° Enhanced
 * Sistema completo de avaliação 360° com múltiplos avaliadores e gráficos comparativos
 */

// Tipo esperado do endpoint getDetails
type EvaluationDetails = {
  averages: {
    self: number;
    manager: number;
    peers: number;
    subordinates: number;
  };
  responses: {
    self: any[];
    manager: any[];
    peers: any[];
    subordinates: any[];
  };
  [key: string]: any;
};

export default function Avaliacao360Enhanced() {
  const [, setLocation] = useLocation();
  const [selectedEvaluation, setSelectedEvaluation] = useState<number | null>(null);

  // Buscar lista de avaliações 360°
  const { data: evaluations, isLoading } = trpc.evaluation360.list.useQuery({});

  // Buscar detalhes da avaliação selecionada
  const { data: detailsRaw } = trpc.evaluation360.getDetails.useQuery(
    { evaluationId: selectedEvaluation || 0 },
    { enabled: !!selectedEvaluation }
  );
  const details = detailsRaw as EvaluationDetails | null | undefined;

  const stages = [
    { 
      name: "Autoavaliação", 
      key: "selfEvaluationCompleted",
      icon: Users,
      color: "text-blue-600"
    },
    { 
      name: "Avaliação do Gestor", 
      key: "managerEvaluationCompleted",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    { 
      name: "Avaliação de Pares", 
      key: "peersEvaluationCompleted",
      icon: Users,
      color: "text-green-600"
    },
    { 
      name: "Avaliação de Subordinados", 
      key: "subordinatesEvaluationCompleted",
      icon: Users,
      color: "text-orange-600"
    },
  ];

  // Calcular progresso geral
  const calculateProgress = (evaluation: any) => {
    const completed = stages.filter(stage => evaluation[stage.key]).length;
    return (completed / stages.length) * 100;
  };

  // Preparar dados para gráfico radar
  const radarData = details ? {
    labels: ['Autoavaliação', 'Gestor', 'Pares', 'Subordinados'],
    datasets: [
      {
        label: 'Média de Notas',
        data: [
          details?.averages?.self ?? 0,
          details?.averages?.manager ?? 0,
          details?.averages?.peers ?? 0,
          details?.subordinates ?? 0,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
      },
    ],
  } : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Comparativo de Avaliações 360°',
      },
    },
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              360° Enhanced
            </h1>
            <p className="text-muted-foreground mt-2">
              Avaliação 360° aprimorada com múltiplos avaliadores e análise comparativa
            </p>
          </div>
          <Button onClick={() => setLocation("/ciclos/360-enhanced/criar")}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Ciclo 360°
          </Button>
        </div>

        {/* Estatísticas Gerais */}
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
                Taxa de Conclusão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations && evaluations.length > 0
                  ? Math.round((evaluations.filter(e => e.status === "concluida").length / evaluations.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Avaliações */}
        <div className="space-y-4">
          {!evaluations || evaluations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma avaliação 360° encontrada</p>
              </CardContent>
            </Card>
          ) : (
            evaluations.map((evaluation: any) => {
              const progress = calculateProgress(evaluation);
              const isSelected = selectedEvaluation === evaluation.id;

              return (
                <Card key={evaluation.id} className={isSelected ? "border-primary" : ""}>
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
                          Avaliação 360° - {progress.toFixed(0)}% completa
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {evaluation.finalScore !== null ? evaluation.finalScore.toFixed(1) : "N/A"}
                          </div>
                          <p className="text-xs text-muted-foreground">Nota Final</p>
                        </div>
                        {isSelected && details && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await export360PDF({
                                  employeeName: evaluation.employeeName || `Colaborador #${evaluation.employeeId}`,
                                  cycleName: `Ciclo #${evaluation.cycleId}`,
                                  type: '360',
                                  status: evaluation.status,
                                  mediaGeral: evaluation.finalScore,
                                  createdAt: evaluation.createdAt,
                                  respostas: [
                                    ...(details?.responses?.self || []).map((r: any) => ({ ...r, avaliadorNome: 'Autoavaliação' })),
                                    ...(details?.responses?.manager || []).map((r: any) => ({ ...r, avaliadorNome: 'Gestor' })),
                                    ...(details?.responses?.peers || []).map((r: any) => ({ ...r, avaliadorNome: 'Pares' })),
                                    ...(details?.responses?.subordinates || []).map((r: any) => ({ ...r, avaliadorNome: 'Subordinados' }))
                                  ],
                                  comentarios: [],
                                  planoAcao: evaluation.planoAcao
                                });
                                toast.success("Relatório PDF gerado com sucesso!");
                              } catch (error) {
                                console.error('Erro ao gerar PDF:', error);
                                toast.error("Erro ao gerar PDF");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Barra de Progresso */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso Geral</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Etapas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stages.map((stage: any) => {
                        const Icon = stage.icon;
                        const completed = (evaluation as any)[stage.key];
                        
                        return (
                          <div key={stage.name} className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">{stage.name}</p>
                              <p className="text-sm font-medium">
                                {completed ? (
                                  <span className="text-green-600">Completa</span>
                                ) : (
                                  <span className="text-muted-foreground">Pendente</span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedEvaluation(isSelected ? null : evaluation.id)}
                      >
                        {isSelected ? "Ocultar Detalhes" : "Ver Detalhes"}
                      </Button>
                      {evaluation.status === "concluida" && (
                        <DuplicateCycleDialog
                          cycle={{
                            id: evaluation.cycleId,
                            name: `Ciclo #${evaluation.cycleId}`,
                            startDate: new Date(),
                            endDate: new Date(),
                            description: `Duplicado do Ciclo #${evaluation.cycleId}`
                          }}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar Ciclo
                            </Button>
                          }
                        />
                      )}
                    </div>

                    {/* Detalhes Expandidos */}
                    {isSelected && details && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Gráfico Radar */}
                          <div>
                            <h4 className="font-medium mb-4">Análise Comparativa</h4>
                            {radarData && (
                              <div style={{ height: '300px' }}>
                                <Radar data={radarData} options={radarOptions} />
                              </div>
                            )}
                          </div>

                          {/* Médias por Tipo */}
                          <div>
                            <h4 className="font-medium mb-4">Médias por Avaliador</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                <span className="text-sm font-medium">Autoavaliação</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {(details?.averages?.self ?? 0).toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded">
                                <span className="text-sm font-medium">Gestor</span>
                                <span className="text-lg font-bold text-purple-600">
                                  {(details?.averages?.manager ?? 0).toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded">
                                <span className="text-sm font-medium">Pares</span>
                                <span className="text-lg font-bold text-green-600">
                                  {(details?.averages?.peers ?? 0).toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                <span className="text-sm font-medium">Subordinados</span>
                                <span className="text-lg font-bold text-orange-600">
                                  {(details?.averages?.subordinates ?? 0).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Estatísticas de Respostas */}
                        <div>
                          <h4 className="font-medium mb-4">Estatísticas de Respostas</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground">Autoavaliação</p>
                                <p className="text-2xl font-bold">{details?.responses?.self?.length ?? 0}</p>
                                <p className="text-xs text-muted-foreground">respostas</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground">Gestor</p>
                                <p className="text-2xl font-bold">{details?.responses?.manager?.length ?? 0}</p>
                                <p className="text-xs text-muted-foreground">respostas</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground">Pares</p>
                                <p className="text-2xl font-bold">{details?.responses?.peers?.length ?? 0}</p>
                                <p className="text-xs text-muted-foreground">respostas</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground">Subordinados</p>
                                <p className="text-2xl font-bold">{details?.responses?.subordinates?.length ?? 0}</p>
                                <p className="text-xs text-muted-foreground">respostas</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
