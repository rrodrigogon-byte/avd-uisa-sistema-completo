/**
 * Página de Resultados de Avaliação do Funcionário
 * 
 * Exibe:
 * - Nota final da avaliação
 * - Comparação autoavaliação vs avaliação gestor
 * - Gráfico de radar por competência
 * - Classificação por quartil
 * - PDI vinculado
 * - Histórico de avaliações
 */

import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  FileText, 
  Download,
  Target,
  Award,
  Calendar
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
} from "recharts";

export default function EmployeeEvaluationResults() {
  const { employeeId } = useParams();
  const id = parseInt(employeeId || "0");

  // Buscar avaliações do funcionário
  const { data: evaluations, isLoading: loadingEvaluations } = 
    trpc.evaluationCycle.getEmployeeEvaluations.useQuery({ employeeId: id });

  // Buscar detalhes da última avaliação
  const lastEvaluationId = evaluations?.[0]?.id;
  const { data: evaluationDetails, isLoading: loadingDetails } = 
    trpc.evaluationCycle.getEvaluationDetails.useQuery(
      { evaluationId: lastEvaluationId || 0 },
      { enabled: !!lastEvaluationId }
    );

  if (loadingEvaluations || loadingDetails) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-muted-foreground">
              Este funcionário ainda não possui avaliações registradas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastEvaluation = evaluations[0];
  const { evaluation, competencyScores } = evaluationDetails || {};

  // Preparar dados para o gráfico de radar
  const radarData = competencyScores?.map((comp) => ({
    category: comp.category,
    Autoavaliação: comp.selfAvg,
    Gestor: comp.managerAvg,
  })) || [];

  // Preparar dados para gráfico de barras (comparação)
  const comparisonData = competencyScores?.map((comp) => ({
    name: comp.category,
    self: comp.selfAvg,
    manager: comp.managerAvg,
    gap: comp.selfAvg - comp.managerAvg,
  })) || [];

  // Preparar dados para evolução histórica
  const evolutionData = evaluations.map((ev) => ({
    cycle: ev.cycleName,
    year: ev.cycleYear,
    score: ev.finalScore || 0,
  })).reverse();

  // Função para determinar cor do quartil
  const getQuartileColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Função para determinar badge de desempenho
  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { label: "Excepcional", variant: "default" as const };
    if (score >= 75) return { label: "Supera Expectativas", variant: "secondary" as const };
    if (score >= 60) return { label: "Atende Expectativas", variant: "outline" as const };
    return { label: "Abaixo das Expectativas", variant: "destructive" as const };
  };

  const performanceBadge = getPerformanceBadge(lastEvaluation.finalScore || 0);

  return (
    <div className="container py-8 space-y-6">
      {/* Header com resumo */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resultados da Avaliação</h1>
          <p className="text-muted-foreground">
            {lastEvaluation.cycleName} - {lastEvaluation.cycleYear}
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nota Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{lastEvaluation.finalScore}</div>
              <div className={`h-12 w-12 rounded-full ${getQuartileColor(lastEvaluation.finalScore || 0)}`} />
            </div>
            <Badge className="mt-2" variant={performanceBadge.variant}>
              {performanceBadge.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autoavaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lastEvaluation.selfScore}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Sua percepção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avaliação Gestor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lastEvaluation.managerScore}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Percepção do gestor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diferença
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">
                {Math.abs((lastEvaluation.selfScore || 0) - (lastEvaluation.managerScore || 0))}
              </div>
              {(lastEvaluation.selfScore || 0) > (lastEvaluation.managerScore || 0) ? (
                <TrendingUp className="h-5 w-5 text-blue-500" />
              ) : (lastEvaluation.selfScore || 0) < (lastEvaluation.managerScore || 0) ? (
                <TrendingDown className="h-5 w-5 text-orange-500" />
              ) : (
                <Minus className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Gap de percepção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="competencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="competencies">
            <Target className="h-4 w-4 mr-2" />
            Competências
          </TabsTrigger>
          <TabsTrigger value="evolution">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evolução
          </TabsTrigger>
          <TabsTrigger value="pdi">
            <Award className="h-4 w-4 mr-2" />
            PDI
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab: Competências */}
        <TabsContent value="competencies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Análise por Competência</CardTitle>
                <CardDescription>
                  Comparação entre autoavaliação e avaliação do gestor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name="Autoavaliação"
                      dataKey="Autoavaliação"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Gestor"
                      dataKey="Gestor"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Comparação */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação Detalhada</CardTitle>
                <CardDescription>
                  Gaps identificados por competência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 5]} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="self" name="Autoavaliação" fill="#3b82f6" />
                    <Bar dataKey="manager" name="Gestor" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de competências */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Competência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Competência</th>
                      <th className="text-center p-3">Autoavaliação</th>
                      <th className="text-center p-3">Gestor</th>
                      <th className="text-center p-3">Gap</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competencyScores?.map((comp, idx) => {
                      const gap = comp.selfAvg - comp.managerAvg;
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{comp.category}</td>
                          <td className="text-center p-3">{comp.selfAvg.toFixed(1)}</td>
                          <td className="text-center p-3">{comp.managerAvg.toFixed(1)}</td>
                          <td className="text-center p-3">
                            <span className={gap > 0 ? "text-blue-600" : gap < 0 ? "text-orange-600" : ""}>
                              {gap > 0 ? "+" : ""}{gap.toFixed(1)}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            {comp.managerAvg >= 4 ? (
                              <Badge variant="default">Forte</Badge>
                            ) : comp.managerAvg >= 3 ? (
                              <Badge variant="secondary">Adequado</Badge>
                            ) : (
                              <Badge variant="destructive">A Desenvolver</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Evolução */}
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Desempenho</CardTitle>
              <CardDescription>
                Histórico de notas ao longo dos ciclos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Nota Final"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: PDI */}
        <TabsContent value="pdi">
          <Card>
            <CardHeader>
              <CardTitle>Plano de Desenvolvimento Individual (PDI)</CardTitle>
              <CardDescription>
                Ações de desenvolvimento baseadas nos gaps identificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  PDI gerado automaticamente com base nos resultados da avaliação
                </p>
                <Button>Ver PDI Completo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <h4 className="font-semibold">{ev.cycleName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {ev.cycleYear} • {ev.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{ev.finalScore}</div>
                        <Badge variant={getPerformanceBadge(ev.finalScore || 0).variant}>
                          {getPerformanceBadge(ev.finalScore || 0).label}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
