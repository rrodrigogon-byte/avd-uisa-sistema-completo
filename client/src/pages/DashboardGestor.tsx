import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Award,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Dashboard Específico para Gestores
 * 
 * Visão consolidada da equipe direta do gestor logado:
 * - KPIs da equipe (performance média, metas, PDIs)
 * - Lista de subordinados diretos
 * - Metas da equipe com progresso
 * - Avaliações pendentes
 * - PDIs da equipe
 * - Gráficos de performance
 */

export default function DashboardGestor() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("visao-geral");

  // Queries
  const { data: teamData, isLoading: teamLoading } = trpc.employees.getTeamByManager.useQuery(
    { managerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: teamGoals, isLoading: goalsLoading } = trpc.goals.getTeamGoals.useQuery(
    { managerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: teamPDIs, isLoading: pdisLoading } = trpc.pdi.getTeamPDIs.useQuery(
    { managerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: pendingEvaluations, isLoading: evaluationsLoading } = trpc.evaluations.getPendingByManager.useQuery(
    { managerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Calcular KPIs
  const teamSize = teamData?.length || 0;
  const avgPerformance = 0; // TODO: Calcular com base em avaliações reais
  const completedGoals = teamGoals?.filter((g: any) => g.status === "concluida").length || 0;
  const totalGoals = teamGoals?.length || 0;
  const activePDIs = teamPDIs?.filter((p: any) => p.status === "em_andamento").length || 0;
  const pendingEvaluationsCount = pendingEvaluations?.length || 0;

  const isLoading = teamLoading || goalsLoading || pdisLoading || evaluationsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Minha Equipe</h1>
          <p className="text-muted-foreground">
            Visão consolidada da performance e desenvolvimento dos seus subordinados diretos
          </p>
        </div>

        {/* KPIs da Equipe */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho da Equipe</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSize}</div>
              <p className="text-xs text-muted-foreground">
                Subordinados diretos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                De 0 a 100 pontos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGoals}/{totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                {totalGoals > 0 ? `${Math.round((completedGoals / totalGoals) * 100)}%` : "0%"} de conclusão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEvaluationsCount + activePDIs}</div>
              <p className="text-xs text-muted-foreground">
                {pendingEvaluationsCount} avaliações + {activePDIs} PDIs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="metas">Metas da Equipe</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações Pendentes</TabsTrigger>
            <TabsTrigger value="pdis">PDIs da Equipe</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subordinados Diretos</CardTitle>
                <CardDescription>
                  Lista completa da sua equipe com status de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : teamSize === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum subordinado direto encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamData?.map((employee: any) => (
                      <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.position?.title || "Sem cargo"} - {employee.department?.name || "Sem departamento"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">Status</p>
                            <Badge variant="secondary">
                              Ativo
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Urgentes */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Urgentes</CardTitle>
                <CardDescription>
                  Itens que requerem sua atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingEvaluationsCount > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium">Avaliações Pendentes</p>
                        <p className="text-sm text-muted-foreground">
                          {pendingEvaluationsCount} avaliações aguardando sua análise
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedTab("avaliacoes")}>
                        Ver Avaliações
                      </Button>
                    </div>
                  )}

                  {activePDIs > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">PDIs Ativos</p>
                        <p className="text-sm text-muted-foreground">
                          {activePDIs} PDIs em andamento requerem acompanhamento
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedTab("pdis")}>
                        Ver PDIs
                      </Button>
                    </div>
                  )}

                  {pendingEvaluationsCount === 0 && activePDIs === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
                      <p>Nenhuma ação urgente no momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metas da Equipe */}
          <TabsContent value="metas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metas da Equipe</CardTitle>
                <CardDescription>
                  Acompanhamento de todas as metas dos seus subordinados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !teamGoals || teamGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma meta encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamGoals?.map((goal: any) => (
                      <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.employee?.name} - {goal.category}
                            </p>
                          </div>
                          <Badge variant={
                            goal.status === "concluida" ? "default" :
                            goal.status === "em_andamento" ? "secondary" : "outline"
                          }>
                            {goal.status === "concluida" ? "Concluída" :
                             goal.status === "em_andamento" ? "Em Andamento" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Prazo: {new Date(goal.endDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações Pendentes */}
          <TabsContent value="avaliacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Pendentes</CardTitle>
                <CardDescription>
                  Avaliações que aguardam sua análise e aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !pendingEvaluations || pendingEvaluations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
                    <p>Nenhuma avaliação pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvaluations?.map((evaluation: any) => (
                      <div key={evaluation.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{evaluation.employee?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Avaliação {evaluation.type} - Ciclo {evaluation.cycle?.name}
                            </p>
                          </div>
                          <Badge variant="outline">Pendente</Badge>
                        </div>
                        <Button size="sm" className="w-full">
                          Avaliar Agora
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDIs da Equipe */}
          <TabsContent value="pdis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PDIs da Equipe</CardTitle>
                <CardDescription>
                  Planos de Desenvolvimento Individual em andamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdisLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !teamPDIs || teamPDIs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum PDI encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamPDIs?.map((pdi: any) => (
                      <div key={pdi.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{pdi.employee?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Cargo Alvo: {pdi.targetPosition?.title || "Não definido"}
                            </p>
                          </div>
                          <Badge variant={
                            pdi.status === "concluido" ? "default" :
                            pdi.status === "em_andamento" ? "secondary" : "outline"
                          }>
                            {pdi.status === "concluido" ? "Concluído" :
                             pdi.status === "em_andamento" ? "Em Andamento" : pdi.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso Geral</span>
                            <span className="font-medium">{pdi.overallProgress}%</span>
                          </div>
                          <Progress value={pdi.overallProgress} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(pdi.startDate).toLocaleDateString("pt-BR")} - {new Date(pdi.endDate).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
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
