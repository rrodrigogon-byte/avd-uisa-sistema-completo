import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Award, Target, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const { user } = useAuth();
  
  const { data: employee } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const { data: evaluations = [], isLoading: loadingEvaluations } = trpc.history.evaluations.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee }
  );

  const { data: pdis = [], isLoading: loadingPdis } = trpc.history.pdis.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee }
  );

  const { data: nineBoxHistory = [], isLoading: loadingNineBox } = trpc.history.nineBox.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee }
  );

  const { data: competencies = [], isLoading: loadingCompetencies } = trpc.history.competenciesEvolution.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee }
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      concluida: "default",
      em_andamento: "secondary",
      pendente: "outline",
      cancelada: "destructive",
    };
    
    const labels: Record<string, string> = {
      concluida: "Concluída",
      em_andamento: "Em Andamento",
      pendente: "Pendente",
      cancelada: "Cancelada",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getBoxLabel = (box: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      alto_alto: { label: "Alto Desempenho × Alto Potencial", color: "text-green-600" },
      alto_medio: { label: "Alto Desempenho × Médio Potencial", color: "text-blue-600" },
      alto_baixo: { label: "Alto Desempenho × Baixo Potencial", color: "text-yellow-600" },
      medio_alto: { label: "Médio Desempenho × Alto Potencial", color: "text-purple-600" },
      medio_medio: { label: "Médio Desempenho × Médio Potencial", color: "text-gray-600" },
      medio_baixo: { label: "Médio Desempenho × Baixo Potencial", color: "text-orange-600" },
      baixo_alto: { label: "Baixo Desempenho × Alto Potencial", color: "text-indigo-600" },
      baixo_medio: { label: "Baixo Desempenho × Médio Potencial", color: "text-red-400" },
      baixo_baixo: { label: "Baixo Desempenho × Baixo Potencial", color: "text-red-600" },
    };

    return labels[box] || { label: box, color: "text-gray-600" };
  };

  if (!employee) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Você precisa estar vinculado a um colaborador para visualizar o histórico.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Meu Histórico
        </h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe sua evolução profissional ao longo do tempo
        </p>
      </div>

      <Tabs defaultValue="evaluations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Avaliações 360°
          </TabsTrigger>
          <TabsTrigger value="pdis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            PDIs
          </TabsTrigger>
          <TabsTrigger value="ninebox" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Matriz 9-Box
          </TabsTrigger>
          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Competências
          </TabsTrigger>
        </TabsList>

        {/* AVALIAÇÕES 360° */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações 360°</CardTitle>
              <CardDescription>
                Todas as suas avaliações de desempenho anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvaluations ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : evaluations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma avaliação encontrada
                </p>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <Card key={evaluation.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{evaluation.type}</Badge>
                              {getStatusBadge(evaluation.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {evaluation.createdAt && format(new Date(evaluation.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            {evaluation.completedAt && (
                              <p className="text-sm text-muted-foreground">
                                Concluída em: {format(new Date(evaluation.completedAt), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          {evaluation.finalScore !== null && (
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary">
                                {evaluation.finalScore}
                              </p>
                              <p className="text-sm text-muted-foreground">Nota Final</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Autoavaliação</p>
                            <p className="font-medium">
                              {evaluation.selfEvaluationCompleted ? "✓ Concluída" : "Pendente"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gestor</p>
                            <p className="font-medium">
                              {evaluation.managerEvaluationCompleted ? "✓ Concluída" : "Pendente"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pares</p>
                            <p className="font-medium">
                              {evaluation.peersEvaluationCompleted ? "✓ Concluída" : "Pendente"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Subordinados</p>
                            <p className="font-medium">
                              {evaluation.subordinatesEvaluationCompleted ? "✓ Concluída" : "Pendente"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDIs */}
        <TabsContent value="pdis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de PDIs</CardTitle>
              <CardDescription>
                Todos os seus Planos de Desenvolvimento Individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPdis ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : pdis.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum PDI encontrado
                </p>
              ) : (
                <div className="space-y-4">
                  {pdis.map((pdi) => (
                    <Card key={pdi.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">
                                PDI {pdi.startDate && format(new Date(pdi.startDate), "yyyy")}
                              </h3>
                              {getStatusBadge(pdi.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {pdi.startDate && pdi.endDate && (
                                <>
                                  {format(new Date(pdi.startDate), "dd/MM/yyyy")} até {format(new Date(pdi.endDate), "dd/MM/yyyy")}
                                </>
                              )}
                            </div>

                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary">
                              {pdi.overallProgress}%
                            </p>
                            <p className="text-sm text-muted-foreground">Progresso</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MATRIZ 9-BOX */}
        <TabsContent value="ninebox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Posicionamento 9-Box</CardTitle>
              <CardDescription>
                Sua evolução na Matriz de Desempenho × Potencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNineBox ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : nineBoxHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum posicionamento encontrado
                </p>
              ) : (
                <div className="space-y-4">
                  {nineBoxHistory.map((position) => {
                    const boxInfo = getBoxLabel(position.box);
                    return (
                      <Card key={position.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className={`font-semibold text-lg ${boxInfo.color}`}>
                                {boxInfo.label}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {position.createdAt && format(new Date(position.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </div>
                              {position.calibrated && (
                                <Badge variant="outline">Calibrado</Badge>
                              )}
                              {position.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{position.notes}</p>
                              )}
                            </div>
                            <div className="text-right space-y-2">
                              <div>
                                <p className="text-2xl font-bold text-primary">
                                  {position.performance}
                                </p>
                                <p className="text-xs text-muted-foreground">Desempenho</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-600">
                                  {position.potential}
                                </p>
                                <p className="text-xs text-muted-foreground">Potencial</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPETÊNCIAS */}
        <TabsContent value="competencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Competências</CardTitle>
              <CardDescription>
                Suas competências avaliadas e níveis atuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompetencies ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : competencies.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma competência avaliada
                </p>
              ) : (
                <div className="space-y-3">
                  {competencies.map((comp: any) => (
                    <div key={comp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{comp.competency?.name || "Competência"}</p>
                        <p className="text-sm text-muted-foreground">
                          {comp.competency?.category || ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          Nível {comp.currentLevel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {comp.evaluatedAt && format(new Date(comp.evaluatedAt), "dd/MM/yyyy")}
                        </p>
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
  );
}
