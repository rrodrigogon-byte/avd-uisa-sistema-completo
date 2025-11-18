import { useState } from "react";
import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target, Users, Calendar, TrendingUp, Download, ArrowLeft, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * PDI Inteligente - Modelo Nadia
 * 
 * Estrutura:
 * 1. Desafio Estratégico (contexto, objetivos, 24 meses, 4 envolvidos)
 * 2. Pacto de Desenvolvimento (Sucessor, Gestor, Sponsors, DGC)
 * 3. Diagnóstico de Competências (gráfico radar: atual vs. alvo)
 * 4. Matriz de Gaps (competências + responsabilidades)
 * 5. Plano de Ação 70-20-10 (tabela com status, métricas, responsáveis)
 * 6. Progressão Estratégica (marcos 12 e 24 meses)
 */

export default function PDIInteligente() {
  const [, params] = useRoute("/pdi-inteligente/:id");
  const pdiId = params?.id ? parseInt(params.id) : null;

  // Queries
  const { data: pdi, isLoading } = trpc.pdiIntelligent.getById.useQuery(
    { id: pdiId! },
    { enabled: !!pdiId }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pdi) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">PDI não encontrado</h2>
          <Link href="/pdi">
            <Button>Voltar para PDIs</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Dados do gráfico radar
  const radarData = {
    labels: pdi.gaps.map((g) => g.competencyName || `Competência ${g.competencyId}`),
    datasets: [
      {
        label: "Perfil Atual",
        data: pdi.gaps.map((g) => g.currentLevel),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
      {
        label: "Perfil Alvo",
        data: pdi.gaps.map((g) => g.targetLevel),
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
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
        position: "bottom" as const,
      },
    },
  };

  // Calcular progresso geral
  const totalActions = 0; // TODO: implementar quando actions estiver disponível
  const completedActions = 0;
  const progressPercent = 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pdi">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">PDI Inteligente</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                PDI Inteligente - Desenvolvimento Estratégico
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={pdi.pdiPlans?.status === "concluido" ? "default" : "secondary"} className="text-sm">
              {pdi.pdiPlans?.status === "em_andamento"
                ? "Em Andamento"
                : pdi.pdiPlans?.status === "concluido"
                ? "Concluído"
                : "Rascunho"}
            </Badge>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Duração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24 meses</div>
              <p className="text-xs text-muted-foreground mt-1">Planejamento estratégico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Envolvidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground mt-1">Sucessor, Gestor, Sponsors, DGC</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gaps Identificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pdi.gaps.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Competências a desenvolver</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercent.toFixed(0)}%</div>
              <Progress value={progressPercent} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs defaultValue="diagnostico" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
            <TabsTrigger value="gaps">Matriz de Gaps</TabsTrigger>
            <TabsTrigger value="plano">Plano 70-20-10</TabsTrigger>
            <TabsTrigger value="progressao">Progressão</TabsTrigger>
            <TabsTrigger value="riscos">Riscos</TabsTrigger>
          </TabsList>

          {/* Tab: Diagnóstico de Competências */}
          <TabsContent value="diagnostico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico de Competências</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comparação entre perfil atual e perfil alvo da posição
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-w-2xl mx-auto">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desafio Estratégico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contexto</h4>
                  <p className="text-sm text-muted-foreground">
                    {pdi.details?.strategicContext || "Preparação para assumir posição estratégica na organização"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Objetivos</h4>
                  <p className="text-sm text-muted-foreground">
                    {pdi.details?.strategicContext ||
                      "Desenvolver competências técnicas e comportamentais necessárias para a posição-alvo"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacto de Desenvolvimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Sucessor</h4>
                      <p className="text-sm text-muted-foreground">{pdi.pdiPlans?.employeeId ? `Colaborador ID: ${pdi.pdiPlans.employeeId}` : "Colaborador"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Responsável por executar o plano
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Gestor Direto</h4>
                      <p className="text-sm text-muted-foreground">{pdi.details?.mentorId ? `Mentor ID: ${pdi.details.mentorId}` : "A definir"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Acompanhamento e feedback contínuo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Sponsors</h4>
                      <p className="text-sm text-muted-foreground">
                        {pdi.details?.sponsorId1 || pdi.details?.sponsorId2 ? "Sponsors definidos" : "Liderança executiva"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Apoio estratégico e recursos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">DGC (RH)</h4>
                      <p className="text-sm text-muted-foreground">Equipe de Desenvolvimento</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Coordenação e monitoramento
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Matriz de Gaps */}
          <TabsContent value="gaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Gaps de Competências</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Análise detalhada das competências a desenvolver
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pdi.gaps.map((gap, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{gap.competencyName || `Competência ${gap.competencyId}`}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Gap: {gap.gap} pontos | Status: {gap.status}
                          </p>
                        </div>
                        <Badge
                          variant={
                            gap.priority === "alta"
                              ? "destructive"
                              : gap.priority === "media"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {gap.priority === "alta"
                            ? "Alta"
                            : gap.priority === "media"
                            ? "Média"
                            : "Baixa"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nível Atual</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={gap.currentLevel * 20} className="flex-1" />
                            <span className="text-sm font-semibold">{gap.currentLevel}/5</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nível Alvo</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={gap.targetLevel * 20} className="flex-1" />
                            <span className="text-sm font-semibold">{gap.targetLevel}/5</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Gap</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={(gap.targetLevel - gap.currentLevel) * 20}
                              className="flex-1"
                            />
                            <span className="text-sm font-semibold text-orange-600">
                              {gap.targetLevel - gap.currentLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Ações:</span>
                        {gap.employeeActions && (
                          <Badge variant="outline" className="text-xs">
                            Colaborador
                          </Badge>
                        )}
                        {gap.managerActions && (
                          <Badge variant="outline" className="text-xs">
                            Gestor
                          </Badge>
                        )}
                        {gap.sponsorActions && (
                          <Badge variant="outline" className="text-xs">
                            Sponsor
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Plano de Ação 70-20-10 */}
          <TabsContent value="plano" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plano de Ação 70-20-10</CardTitle>
                <p className="text-sm text-muted-foreground">
                  70% experiência prática, 20% relacionamentos, 10% treinamentos formais
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* TODO: Implementar actions quando disponível no schema */}
                  {[].map((action: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{action.description}</h4>
                          <Badge
                            variant={
                              action.type === "70"
                                ? "default"
                                : action.type === "20"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {action.type}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Responsável: {action.responsible || "A definir"}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            action.status === "concluido"
                              ? "default"
                              : action.status === "em_andamento"
                              ? "secondary"
                              : "outline"
                          }
                          className="mt-1"
                        >
                          {action.status === "concluido"
                            ? "Concluído"
                            : action.status === "em_andamento"
                            ? "Em Andamento"
                            : "Pendente"}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Prazo</p>
                        <p className="text-sm font-semibold mt-1">
                          {action.deadline
                            ? new Date(action.deadline).toLocaleDateString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Progressão Estratégica */}
          <TabsContent value="progressao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progressão Estratégica</CardTitle>
                <p className="text-sm text-muted-foreground">Marcos de 12 e 24 meses</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative pl-8 pb-8 border-l-2 border-primary">
                    <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      12
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-2">Marco de 12 Meses</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Domínio de 60% das competências-alvo</li>
                        <li>• Conclusão de projetos práticos (70%)</li>
                        <li>• Participação em comitês estratégicos</li>
                        <li>• Avaliação intermediária com feedback 360°</li>
                      </ul>
                    </div>
                  </div>

                  <div className="relative pl-8 border-l-2 border-green-500">
                    <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                      24
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold mb-2">Marco de 24 Meses</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Domínio de 100% das competências-alvo</li>
                        <li>• Prontidão para assumir a posição</li>
                        <li>• Reconhecimento formal pela liderança</li>
                        <li>• Transição planejada para a nova função</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Riscos */}
          <TabsContent value="riscos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Riscos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Identificação e mitigação de riscos ao desenvolvimento
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pdi.risks?.map((risk, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{risk.description}</h4>
                        <Badge
                          variant={
                            risk.impact === "critico" || risk.impact === "alto"
                              ? "destructive"
                              : risk.impact === "medio"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {risk.impact === "critico"
                            ? "Crítico"
                            : risk.impact === "alto"
                            ? "Alto"
                            : risk.impact === "medio"
                            ? "Médio"
                            : "Baixo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Mitigação:</strong> {risk.mitigation}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Status: {risk.status === "mitigado" ? "Mitigado" : "Em Monitoramento"}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!pdi.risks || pdi.risks.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum risco identificado no momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
