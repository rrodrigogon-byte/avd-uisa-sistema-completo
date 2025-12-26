import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, BarChart3, Target, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard Consolidado - Visão Geral do Sistema
 * Apresenta métricas consolidadas de OKRs, Feedback 360° e Clima Organizacional
 */
export default function DashboardConsolidado() {
  const { user, loading: authLoading } = useAuth();
  const { data: dashboardData, isLoading } = trpc.dashboards.getConsolidatedDashboard.useQuery({});

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Consolidado</h1>
            <p className="text-muted-foreground">Visão geral do sistema de gestão de desempenho</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { okrs, feedback360, climate, recentActivity } = dashboardData || {
    okrs: { total: 0, completed: 0, averageProgress: 0 },
    feedback360: { totalCycles: 0, completionRate: 0, averageScore: 0 },
    climate: { totalSurveys: 0, engagementScore: 0, participationRate: 0 },
    recentActivity: [],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Consolidado</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão de desempenho</p>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* OKRs */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos (OKRs)</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{okrs.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={okrs.averageProgress} className="flex-1" />
                <span className="text-xs text-muted-foreground">{okrs.averageProgress}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {okrs.completed} concluídos
              </p>
            </CardContent>
          </Card>

          {/* Feedback 360° */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback 360°</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedback360.totalCycles}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={feedback360.completionRate} className="flex-1" />
                <span className="text-xs text-muted-foreground">{feedback360.completionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Score médio: {feedback360.averageScore}/100
              </p>
            </CardContent>
          </Card>

          {/* Clima Organizacional */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clima Organizacional</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{climate.totalSurveys}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={climate.engagementScore} className="flex-1" />
                <span className="text-xs text-muted-foreground">{climate.engagementScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Participação: {climate.participationRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Detalhes */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Progresso de OKRs */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso de OKRs</CardTitle>
              <CardDescription>Distribuição de objetivos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">No Prazo</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((okrs.completed / Math.max(okrs.total, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(okrs.completed / Math.max(okrs.total, 1)) * 100} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Em Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((okrs.total - okrs.completed) / Math.max(okrs.total, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((okrs.total - okrs.completed) / Math.max(okrs.total, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas atualizações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade recente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Insights */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{climate.engagementScore}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Índice de engajamento organizacional
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Qualidade do Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{feedback360.averageScore}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Score médio de avaliações 360°
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Execução de Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{okrs.averageProgress}</div>
                <div className="text-xs text-muted-foreground">%</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Progresso médio dos objetivos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Navegue para os principais módulos do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4">
              <a 
                href="/okrs" 
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">OKRs</span>
              </a>
              <a 
                href="/feedback360" 
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Feedback 360°</span>
              </a>
              <a 
                href="/clima" 
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Clima</span>
              </a>
              <a 
                href="/organograma" 
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">Organograma</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
