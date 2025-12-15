import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  FlaskConical, 
  Play, 
  Pause, 
  CheckCircle2, 
  Users, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  Award,
  Layers,
  ArrowRight,
  Percent
} from "lucide-react";

export default function AbTestExperiments() {
  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<"pir" | "competencias" | "desempenho" | "pdi">("pir");

  // Queries
  const { data: experiments, isLoading: loadingExperiments, refetch: refetchExperiments } = 
    trpc.abTestLayout.listLayoutExperiments.useQuery();
  
  const { data: comparison, isLoading: loadingComparison } = 
    trpc.abTestMetrics.getComparison.useQuery(
      { experimentId: selectedExperiment! },
      { enabled: !!selectedExperiment }
    );

  const { data: stepRates, isLoading: loadingStepRates } = 
    trpc.abTestMetrics.getStepCompletionRates.useQuery(
      { experimentId: selectedExperiment! },
      { enabled: !!selectedExperiment }
    );

  const { data: funnel, isLoading: loadingFunnel } = 
    trpc.abTestMetrics.getConversionFunnel.useQuery(
      { experimentId: selectedExperiment! },
      { enabled: !!selectedExperiment }
    );

  // Mutations
  const createExperiment = trpc.abTestLayout.createFirstExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experimento criado com sucesso!");
      refetchExperiments();
      setShowCreateDialog(false);
    },
    onError: () => toast.error("Erro ao criar experimento"),
  });

  const activateExperiment = trpc.abTestLayout.activateExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experimento ativado!");
      refetchExperiments();
    },
    onError: () => toast.error("Erro ao ativar experimento"),
  });

  const pauseExperiment = trpc.abTestLayout.pauseExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experimento pausado!");
      refetchExperiments();
    },
    onError: () => toast.error("Erro ao pausar experimento"),
  });

  const completeExperiment = trpc.abTestLayout.completeExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experimento finalizado!");
      refetchExperiments();
    },
    onError: () => toast.error("Erro ao finalizar experimento"),
  });

  const saveResults = trpc.abTestMetrics.saveResults.useMutation({
    onSuccess: () => {
      toast.success("Resultados salvos!");
    },
    onError: () => toast.error("Erro ao salvar resultados"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Rascunho</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWinnerBadge = (winner: string) => {
    switch (winner) {
      case "A":
        return <Badge className="bg-blue-100 text-blue-800">Variante A Vence</Badge>;
      case "B":
        return <Badge className="bg-green-100 text-green-800">Variante B Vence</Badge>;
      case "tie":
        return <Badge className="bg-gray-100 text-gray-800">Empate</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Dados Insuficientes</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Experimentos A/B de Layout</h1>
            <p className="text-gray-500 mt-1">
              Teste variações de layout no processo de avaliação
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Novo Experimento
          </Button>
        </div>

        {/* Experiments List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Experiments Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Experimentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingExperiments ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </>
                ) : experiments && experiments.length > 0 ? (
                  experiments.map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedExperiment === exp.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedExperiment(exp.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{exp.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {exp.targetModule?.toUpperCase() || "—"}
                          </p>
                        </div>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {exp.totalParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {exp.conversionRate}%
                        </span>
                      </div>
                      {exp.status === "draft" && (
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            activateExperiment.mutate({ experimentId: exp.id });
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Ativar
                        </Button>
                      )}
                      {exp.status === "active" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseExperiment.mutate({ experimentId: exp.id });
                            }}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeExperiment.mutate({ experimentId: exp.id });
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum experimento criado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-2">
            {selectedExperiment ? (
              <Tabs defaultValue="comparison" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="comparison">Comparação</TabsTrigger>
                  <TabsTrigger value="funnel">Funil</TabsTrigger>
                  <TabsTrigger value="steps">Por Etapa</TabsTrigger>
                </TabsList>

                {/* Comparison Tab */}
                <TabsContent value="comparison">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Comparação de Variantes</span>
                        {comparison && getWinnerBadge(comparison.comparison.winner)}
                      </CardTitle>
                      <CardDescription>
                        Métricas comparativas entre Variante A (controle) e Variante B
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingComparison ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : comparison ? (
                        <div className="space-y-6">
                          {/* Recommendation */}
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-blue-800">
                              <strong>Recomendação:</strong> {comparison.comparison.recommendation}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              Confiança estatística: {comparison.comparison.confidenceLevel}%
                            </p>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Variant A */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-center">
                                Variante A (Controle)
                              </h4>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Participantes</p>
                                <p className="text-2xl font-bold">{comparison.variantA.sampleSize}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Taxa de Conversão</p>
                                <p className="text-2xl font-bold">{comparison.variantA.conversionRate}%</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Tempo Médio</p>
                                <p className="text-2xl font-bold">{comparison.variantA.avgCompletionTime}s</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Satisfação</p>
                                <p className="text-2xl font-bold">{comparison.variantA.avgSatisfactionRating}/5</p>
                              </div>
                            </div>

                            {/* Variant B */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-center">
                                Variante B (Moderno)
                              </h4>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Participantes</p>
                                <p className="text-2xl font-bold">{comparison.variantB.sampleSize}</p>
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Taxa de Conversão</p>
                                <p className="text-2xl font-bold">{comparison.variantB.conversionRate}%</p>
                                {comparison.comparison.conversionLift !== 0 && (
                                  <p className={`text-sm ${comparison.comparison.conversionLift > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {comparison.comparison.conversionLift > 0 ? "+" : ""}{comparison.comparison.conversionLift}%
                                  </p>
                                )}
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Tempo Médio</p>
                                <p className="text-2xl font-bold">{comparison.variantB.avgCompletionTime}s</p>
                                {comparison.comparison.timeLift !== 0 && (
                                  <p className={`text-sm ${comparison.comparison.timeLift > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {comparison.comparison.timeLift > 0 ? "-" : "+"}{Math.abs(comparison.comparison.timeLift)}%
                                  </p>
                                )}
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-gray-500">Satisfação</p>
                                <p className="text-2xl font-bold">{comparison.variantB.avgSatisfactionRating}/5</p>
                                {comparison.comparison.satisfactionLift !== 0 && (
                                  <p className={`text-sm ${comparison.comparison.satisfactionLift > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {comparison.comparison.satisfactionLift > 0 ? "+" : ""}{comparison.comparison.satisfactionLift}%
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button 
                            className="w-full"
                            onClick={() => saveResults.mutate({ experimentId: selectedExperiment })}
                            disabled={saveResults.isPending}
                          >
                            Salvar Resultados
                          </Button>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          Selecione um experimento para ver a comparação
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Funnel Tab */}
                <TabsContent value="funnel">
                  <Card>
                    <CardHeader>
                      <CardTitle>Funil de Conversão</CardTitle>
                      <CardDescription>
                        Visualize onde os usuários abandonam o processo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingFunnel ? (
                        <Skeleton className="h-64 w-full" />
                      ) : funnel && funnel.length > 0 ? (
                        <div className="space-y-6">
                          {funnel.map((variant) => (
                            <div key={variant.variantId} className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                {variant.variantName}
                                {variant.isControl && (
                                  <Badge variant="outline">Controle</Badge>
                                )}
                              </h4>
                              <div className="space-y-2">
                                {variant.funnel.map((step, index) => (
                                  <div key={step.step} className="flex items-center gap-3">
                                    <div className="w-24 text-sm text-gray-600">{step.step}</div>
                                    <div className="flex-1">
                                      <Progress value={step.rate} />
                                    </div>
                                    <div className="w-16 text-right text-sm">
                                      {step.count} ({step.rate}%)
                                    </div>
                                    {step.dropoff > 0 && (
                                      <div className="w-16 text-right text-sm text-red-500">
                                        -{step.dropoff}%
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          Dados de funil não disponíveis
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Steps Tab */}
                <TabsContent value="steps">
                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Conclusão por Etapa</CardTitle>
                      <CardDescription>
                        Compare o desempenho em cada etapa do processo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingStepRates ? (
                        <Skeleton className="h-64 w-full" />
                      ) : stepRates ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Variante</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Etapa 1</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Etapa 2</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Etapa 3</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Etapa 4</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Etapa 5</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stepRates).map(([variantId, data]) => (
                                <tr key={variantId} className="border-b">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      {data.variantName}
                                      {data.isControl && (
                                        <Badge variant="outline" className="text-xs">Controle</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">{data.totalUsers} usuários</p>
                                  </td>
                                  {[1, 2, 3, 4, 5].map((step) => (
                                    <td key={step} className="py-3 px-4 text-center">
                                      <span className={`font-medium ${
                                        (data.stepRates[step] || 0) >= 80 ? "text-green-600" :
                                        (data.stepRates[step] || 0) >= 50 ? "text-yellow-600" : "text-red-600"
                                      }`}>
                                        {data.stepRates[step] || 0}%
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          Dados de etapas não disponíveis
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FlaskConical className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Selecione um experimento</h3>
                  <p className="text-gray-500 mt-1">
                    Clique em um experimento na lista para ver os detalhes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Experiment Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Experimento A/B</DialogTitle>
              <DialogDescription>
                Selecione o módulo onde deseja testar variações de layout
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Módulo Alvo</Label>
                <Select value={selectedModule} onValueChange={(v) => setSelectedModule(v as typeof selectedModule)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pir">PIR - Perfil de Integridade</SelectItem>
                    <SelectItem value="competencias">Avaliação de Competências</SelectItem>
                    <SelectItem value="desempenho">Avaliação de Desempenho</SelectItem>
                    <SelectItem value="pdi">PDI - Plano de Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Variantes do Experimento</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Variante A (Controle):</strong> Layout atual do sistema</p>
                  <p><strong>Variante B:</strong> Layout moderno com cards expandidos e grade de questões</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createExperiment.mutate({ targetModule: selectedModule })}
                disabled={createExperiment.isPending}
              >
                Criar Experimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
