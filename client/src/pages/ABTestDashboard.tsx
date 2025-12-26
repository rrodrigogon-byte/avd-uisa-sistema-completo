import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FlaskConical, Plus, Play, Pause, BarChart3, Users, CheckCircle2, TrendingUp, Trophy, Target } from "lucide-react";

export default function ABTestDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(null);
  
  const { data: experiments, refetch } = trpc.abTest.listAll.useQuery(undefined);
  const { data: analytics } = trpc.abTest.getAnalytics.useQuery(
    { experimentId: selectedExperiment! },
    { enabled: !!selectedExperiment }
  );
  
  const createExperiment = trpc.abTest.createExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experimento criado com sucesso!");
      setShowCreateDialog(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const updateStatus = trpc.abTest.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    targetModule: "pir" as "pir" | "competencias" | "desempenho" | "pdi",
    trafficPercentage: 100,
  });

  const handleCreateExperiment = () => {
    createExperiment.mutate({
      ...newExperiment,
      startDate: new Date(),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary", active: "default", paused: "outline", completed: "default", archived: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho", active: "Ativo", paused: "Pausado", completed: "Concluido", archived: "Arquivado",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = { pir: "PIR", competencias: "Competencias", desempenho: "Desempenho", pdi: "PDI" };
    return labels[module] || module;
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical className="h-8 w-8 text-primary" />
              Testes A/B
            </h1>
            <p className="text-muted-foreground mt-1">Compare diferentes versoes de questoes para otimizacao</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Experimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Experimento A/B</DialogTitle>
                <DialogDescription>Configure um novo teste para comparar variantes de questoes</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Experimento</Label>
                  <Input value={newExperiment.name} onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })} placeholder="Ex: Teste de reformulacao PIR" />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Textarea value={newExperiment.description} onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })} placeholder="Descreva o objetivo do experimento..." />
                </div>
                <div className="space-y-2">
                  <Label>Modulo Alvo</Label>
                  <Select value={newExperiment.targetModule} onValueChange={(value) => setNewExperiment({ ...newExperiment, targetModule: value as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pir">PIR</SelectItem>
                      <SelectItem value="competencias">Competencias</SelectItem>
                      <SelectItem value="desempenho">Desempenho</SelectItem>
                      <SelectItem value="pdi">PDI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Porcentagem de Trafego (%)</Label>
                  <Input type="number" min={1} max={100} value={newExperiment.trafficPercentage} onChange={(e) => setNewExperiment({ ...newExperiment, trafficPercentage: parseInt(e.target.value) })} />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateExperiment} disabled={!newExperiment.name}>Criar Experimento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Experimentos</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{experiments?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{experiments?.filter(e => e.status === "active").length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluidos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{experiments?.filter(e => e.status === "completed").length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Vencedor</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{experiments?.filter(e => e.status === "completed").length || 0}</div></CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Experimentos</CardTitle>
              <CardDescription>Selecione um experimento para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {experiments?.map((experiment) => (
                  <div key={experiment.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedExperiment === experiment.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => setSelectedExperiment(experiment.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{experiment.name}</h3>
                        <p className="text-sm text-muted-foreground">{getModuleLabel(experiment.targetModule)} - {experiment.trafficPercentage}% trafego</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(experiment.status)}
                        {experiment.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ experimentId: experiment.id, status: "active" }); }}>
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {experiment.status === "active" && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ experimentId: experiment.id, status: "paused" }); }}>
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!experiments || experiments.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum experimento criado</p>
                    <p className="text-sm">Crie seu primeiro teste A/B</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Analytics</CardTitle>
              <CardDescription>{selectedExperiment ? "Metricas do experimento selecionado" : "Selecione um experimento"}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />Participantes</div>
                      <div className="text-2xl font-bold">{analytics.totalSampleSize}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Conversao Geral</div>
                      <div className="text-2xl font-bold">{analytics.overallConversionRate}%</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Variantes</h4>
                    {analytics.variants.map((variant) => (
                      <div key={variant.variantId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variant.variantName}</span>
                            {variant.isControl && <Badge variant="outline" className="text-xs">Controle</Badge>}
                            {analytics.winner?.variantId === variant.variantId && <Badge className="bg-yellow-500 text-xs"><Trophy className="h-3 w-3 mr-1" />Vencedor</Badge>}
                          </div>
                          <span className="text-sm text-muted-foreground">{variant.sampleSize} participantes</span>
                        </div>
                        <Progress value={variant.conversionRate} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Conversao: {variant.conversionRate}%</span>
                          <span>Tempo medio: {variant.avgResponseTimeSeconds}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-4 rounded-lg ${analytics.isStatisticallySignificant ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                    <div className="flex items-center gap-2">
                      <Target className={`h-5 w-5 ${analytics.isStatisticallySignificant ? "text-green-600" : "text-yellow-600"}`} />
                      <span className={`font-medium ${analytics.isStatisticallySignificant ? "text-green-700" : "text-yellow-700"}`}>
                        {analytics.isStatisticallySignificant ? "Resultados estatisticamente significativos" : "Aguardando mais dados para significancia estatistica"}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {analytics.isStatisticallySignificant ? "Os resultados sao confiaveis para tomada de decisao." : `Necessario pelo menos 100 participantes (atual: ${analytics.totalSampleSize})`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione um experimento para ver as metricas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
