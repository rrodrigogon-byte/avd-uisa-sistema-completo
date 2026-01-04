import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Goal, Target, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: employee } = trpc.employees.getCurrent.useQuery(undefined);
  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: goals, error: goalsError } = trpc.goals.list.useQuery(undefined, {
    enabled: !!employee,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: pdis, error: pdisError } = trpc.pdi.list.useQuery(undefined, {
    enabled: !!employee,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeGoals = goals?.filter(g => g.status === "em_andamento") || [];
  const activePDIs = pdis?.filter(p => p.status === "em_andamento" || p.status === "aprovado") || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {employee?.name || "Colaborador"}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seu desempenho e desenvolvimento profissional
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.goalsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {activeGoals.length} em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.evaluationsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ciclo {stats?.cycle?.year || new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDI Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pdisCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {activePDIs.length} em desenvolvimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ciclo Atual</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.cycle?.year ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.cycle?.name ?? "Nenhum ciclo ativo"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Metas em Andamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="h-5 w-5" />
                Metas em Andamento
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso das suas metas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma meta em andamento</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/metas">Ver todas as metas</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGoals.slice(0, 3).map((goal: any) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{goal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={goal.linkedToPLR ? "default" : "secondary"} className="text-xs">
                              {goal.linkedToPLR ? "PLR" : goal.linkedToBonus ? "Bônus" : "Regular"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(goal.endDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                  {activeGoals.length > 3 && (
                    <Button variant="link" asChild className="w-full">
                      <Link href="/metas">Ver todas ({activeGoals.length})</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDI em Desenvolvimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Plano de Desenvolvimento
              </CardTitle>
              <CardDescription>
                Seu progresso no desenvolvimento profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePDIs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum PDI ativo</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/pdi">Criar PDI</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePDIs.slice(0, 2).map((pdi: any) => (
                    <div key={pdi.id} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            PDI {new Date(pdi.startDate).getFullYear()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(pdi.startDate).toLocaleDateString("pt-BR")} até{" "}
                            {new Date(pdi.endDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge variant={pdi.status === "aprovado" ? "default" : "secondary"}>
                          {pdi.status === "aprovado" ? "Aprovado" : "Em andamento"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso geral</span>
                          <span className="font-semibold">{pdi.overallProgress}%</span>
                        </div>
                        <Progress value={pdi.overallProgress} className="h-2" />
                      </div>
                    </div>
                  ))}
                  <Button variant="link" asChild className="w-full">
                    <Link href="/pdi">Ver detalhes</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" asChild className="justify-start h-auto py-4">
                <Link href="/metas">
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-semibold">Metas</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Gerenciar metas
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" asChild className="justify-start h-auto py-4">
                <Link href="/avaliacoes">
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">Avaliações</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Avaliação 360°
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" asChild className="justify-start h-auto py-4">
                <Link href="/pdi">
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-semibold">PDI</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Desenvolvimento
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" asChild className="justify-start h-auto py-4">
                <Link href="/nine-box">
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-semibold">9-Box</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Matriz de talentos
                    </span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
