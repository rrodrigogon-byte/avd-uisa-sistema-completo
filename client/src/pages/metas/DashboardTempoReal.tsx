import { safeMap, safeFilter, safeReduce, isEmpty } from "@/lib/arrayHelpers";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Target, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Dashboard de Acompanhamento de Metas Corporativas em Tempo Real
 * 
 * Funcionalidades:
 * - Atualização automática a cada 30 segundos
 * - Alertas visuais para metas críticas (< 30% progresso)
 * - Indicadores de tendência (progresso vs. tempo decorrido)
 * - Status colorido por criticidade
 */

interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  targetValue: string;
  currentValue: string;
  measurementUnit: string;
  weight: number;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function DashboardTempoReal() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Query com refetch automático
  const { data: goals, isLoading, refetch } = trpc.goals.listCorporateGoals.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? 30000 : false, // 30 segundos
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (goals) {
      setLastUpdate(new Date());
    }
  }, [goals]);

  // Calcular métricas gerais
  const metrics = goals
    ? {
        total: goals.length,
        critical: safeFilter(goals, (g) => g.progress < 30 && g.status !== "completed").length,
        onTrack: goals.filter((g) => g.progress >= 50 && g.status !== "completed").length,
        completed: goals.filter((g) => g.status === "completed").length,
        avgProgress: Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length),
      }
    : { total: 0, critical: 0, onTrack: 0, completed: 0, avgProgress: 0 };

  // Calcular tempo decorrido vs progresso
  const getHealthStatus = (goal: Goal) => {
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const timeProgress = (elapsedDays / totalDays) * 100;

    if (goal.status === "completed") return "completed";
    if (goal.progress >= timeProgress + 10) return "ahead";
    if (goal.progress < timeProgress - 10) return "behind";
    return "on-track";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "ahead":
        return "bg-blue-500";
      case "on-track":
        return "bg-yellow-500";
      case "behind":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "ahead":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case "on-track":
        return <Target className="h-5 w-5 text-yellow-600" />;
      case "behind":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída";
      case "ahead":
        return "Adiantada";
      case "on-track":
        return "No Prazo";
      case "behind":
        return "Atrasada";
      default:
        return "Indefinido";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Dashboard em Tempo Real</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhamento de metas corporativas com atualização automática
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Última atualização</p>
              <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString("pt-BR")}</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </button>
          </div>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Metas Críticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div className="text-3xl font-bold text-red-600">{metrics.critical}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">No Prazo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <div className="text-3xl font-bold text-green-600">{metrics.onTrack}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
                <div className="text-3xl font-bold text-blue-600">{metrics.completed}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.avgProgress}%</div>
              <Progress value={metrics.avgProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Metas Críticas */}
        {metrics.critical > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{metrics.critical} meta(s)</strong> com progresso abaixo de 30% requerem atenção imediata!
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Metas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Corporativas</h2>

          {goals && goals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal: any) => {
                const healthStatus = getHealthStatus(goal);
                const isCritical = goal.progress < 30 && goal.status !== "completed";

                return (
                  <Card
                    key={goal.id}
                    className={`transition-all ${isCritical ? "border-red-500 border-2 shadow-lg" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(healthStatus)}
                            <CardTitle className="text-lg">{goal.title}</CardTitle>
                            {isCritical && (
                              <Badge variant="destructive" className="animate-pulse">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                CRÍTICA
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{goal.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(healthStatus)}>{getStatusLabel(healthStatus)}</Badge>
                          <Badge variant="outline">{goal.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Barra de Progresso */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Progresso</span>
                          <span className="font-bold">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-3" />
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Meta</p>
                          <p className="font-semibold">
                            {goal.targetValue} {goal.measurementUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Atual</p>
                          <p className="font-semibold">
                            {goal.currentValue} {goal.measurementUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Peso</p>
                          <p className="font-semibold">{goal.weight}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Prazo</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(goal.endDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma meta corporativa encontrada.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
