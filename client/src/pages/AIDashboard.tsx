import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Users,
  Activity,
  BarChart3,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Dashboard de Inteligência Artificial
 * Exibe insights, predições e recomendações geradas por IA
 */
export default function AIDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboard, isLoading, error, refetch } = trpc.aiAnalytics.getAIDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
    await refetch();
    toast.success("Insights atualizados com sucesso!");
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar insights</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Inteligência Artificial
          </h1>
          <p className="text-muted-foreground mt-1">
            Insights preditivos e recomendações geradas por IA
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.summary.totalInsights || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Gerados por IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Insights Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard?.summary.criticalInsights || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alto Impacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dashboard?.summary.highImpactInsights || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Impacto significativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(dashboard?.summary.categories || {}).length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <BarChart3 className="h-3 w-3 inline mr-1" />
                Áreas analisadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="critico">Críticos</TabsTrigger>
          <TabsTrigger value="alto">Alto Impacto</TabsTrigger>
          <TabsTrigger value="tendencia">Tendências</TabsTrigger>
          <TabsTrigger value="risco">Riscos</TabsTrigger>
          <TabsTrigger value="oportunidade">Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dashboard?.insights && dashboard.insights.length > 0 ? (
            <div className="space-y-4">
              {dashboard.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum insight disponível no momento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Atualizar" para gerar novos insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="critico" className="space-y-4 mt-4">
          {dashboard?.insights
            ?.filter((i) => i.impactLevel === "critico")
            .map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </TabsContent>

        <TabsContent value="alto" className="space-y-4 mt-4">
          {dashboard?.insights
            ?.filter((i) => i.impactLevel === "alto")
            .map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </TabsContent>

        <TabsContent value="tendencia" className="space-y-4 mt-4">
          {dashboard?.insights
            ?.filter((i) => i.type === "tendencia")
            .map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </TabsContent>

        <TabsContent value="risco" className="space-y-4 mt-4">
          {dashboard?.insights
            ?.filter((i) => i.type === "risco")
            .map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </TabsContent>

        <TabsContent value="oportunidade" className="space-y-4 mt-4">
          {dashboard?.insights
            ?.filter((i) => i.type === "oportunidade")
            .map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InsightCardProps {
  insight: {
    id: string;
    type: "tendencia" | "correlacao" | "anomalia" | "oportunidade" | "risco" | "recomendacao";
    category: "desempenho" | "engajamento" | "turnover" | "desenvolvimento" | "sucessao";
    title: string;
    description: string;
    impactLevel: "baixo" | "medio" | "alto" | "critico";
    affectedEmployees: number;
    recommendedActions: Array<{
      action: string;
      priority: string;
      expectedOutcome: string;
    }>;
    confidenceScore: number;
    relevanceScore: number;
  };
}

function InsightCard({ insight }: InsightCardProps) {
  const getTypeIcon = () => {
    switch (insight.type) {
      case "tendencia":
        return <TrendingUp className="h-5 w-5" />;
      case "risco":
        return <AlertTriangle className="h-5 w-5" />;
      case "oportunidade":
        return <Lightbulb className="h-5 w-5" />;
      case "recomendacao":
        return <Target className="h-5 w-5" />;
      case "correlacao":
        return <Activity className="h-5 w-5" />;
      case "anomalia":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getImpactColor = () => {
    switch (insight.impactLevel) {
      case "critico":
        return "destructive";
      case "alto":
        return "default";
      case "medio":
        return "secondary";
      case "baixo":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTypeColor = () => {
    switch (insight.type) {
      case "risco":
        return "text-red-600";
      case "oportunidade":
        return "text-green-600";
      case "tendencia":
        return "text-blue-600";
      case "recomendacao":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${getTypeColor()}`}>{getTypeIcon()}</div>
            <div>
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              <CardDescription className="mt-1">{insight.description}</CardDescription>
            </div>
          </div>
          <Badge variant={getImpactColor() as any}>{insight.impactLevel.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {insight.affectedEmployees} colaboradores afetados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {insight.confidenceScore}% confiança
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {insight.category}
            </Badge>
          </div>
        </div>

        {/* Ações Recomendadas */}
        {insight.recommendedActions && insight.recommendedActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Ações Recomendadas
            </h4>
            <div className="space-y-2">
              {insight.recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{action.expectedOutcome}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {action.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
