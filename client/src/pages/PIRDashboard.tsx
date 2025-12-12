/**
 * Dashboard Analítico do PIR (Plano Individual de Resultados)
 * 
 * Exibe análises consolidadas de um ciclo de avaliação:
 * - Distribuição de notas por competência
 * - Análise de quartis (Q1, Q2, Q3, Q4)
 * - Distribuição da equipe por faixa de desempenho
 * - Métricas de engajamento (taxa de resposta, tempo médio)
 * - Gráficos de evolução temporal
 * - Filtros por departamento, cargo, período
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

const COLORS = {
  excepcional: "#10b981",
  supera: "#3b82f6",
  atende: "#f59e0b",
  abaixo: "#ef4444",
};

const QUARTILE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

export default function PIRDashboard() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  // Buscar ciclos disponíveis
  const { data: cycles } = trpc.cycles.list.useQuery();

  // Buscar estatísticas do ciclo selecionado
  const { data: stats, isLoading } = trpc.evaluationCycle.getCycleStats.useQuery(
    { cycleId: selectedCycleId || 0 },
    { enabled: !!selectedCycleId }
  );

  // Buscar quartis
  const { data: quartiles } = trpc.evaluationCycle.calculateCycleQuartiles.useQuery(
    { cycleId: selectedCycleId || 0 },
    { enabled: !!selectedCycleId }
  );

  // Selecionar primeiro ciclo por padrão
  if (cycles && cycles.length > 0 && !selectedCycleId) {
    setSelectedCycleId(cycles[0].id);
  }

  if (isLoading || !stats) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para distribuição por faixa de desempenho
  const performanceDistribution = [
    {
      name: "Excepcional (90-100)",
      value: quartiles?.distribution.filter((d) => d.finalScore && d.finalScore >= 90).length || 0,
      color: COLORS.excepcional,
    },
    {
      name: "Supera (75-89)",
      value: quartiles?.distribution.filter((d) => d.finalScore && d.finalScore >= 75 && d.finalScore < 90).length || 0,
      color: COLORS.supera,
    },
    {
      name: "Atende (60-74)",
      value: quartiles?.distribution.filter((d) => d.finalScore && d.finalScore >= 60 && d.finalScore < 75).length || 0,
      color: COLORS.atende,
    },
    {
      name: "Abaixo (0-59)",
      value: quartiles?.distribution.filter((d) => d.finalScore && d.finalScore < 60).length || 0,
      color: COLORS.abaixo,
    },
  ];

  // Preparar dados para distribuição de quartis
  const quartileDistribution = [
    { name: "Q1", value: quartiles?.distribution.filter((d) => d.quartile === 1).length || 0 },
    { name: "Q2", value: quartiles?.distribution.filter((d) => d.quartile === 2).length || 0 },
    { name: "Q3", value: quartiles?.distribution.filter((d) => d.quartile === 3).length || 0 },
    { name: "Q4", value: quartiles?.distribution.filter((d) => d.quartile === 4).length || 0 },
  ];

  // Preparar dados para comparação self vs manager
  const comparisonData = [
    { name: "Autoavaliação", value: stats.avgSelfScore },
    { name: "Avaliação Gestor", value: stats.avgManagerScore },
    { name: "Nota Final", value: stats.avgFinalScore },
  ];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard PIR</h1>
          <p className="text-muted-foreground">
            Plano Individual de Resultados - Análise Consolidada
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedCycleId?.toString()}
            onValueChange={(value) => setSelectedCycleId(parseInt(value))}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles?.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name} - {cycle.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.completed} concluídas • {stats.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Nota Média Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgFinalScore}</div>
            <p className="text-sm text-muted-foreground mt-1">
              De 0 a 100 pontos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Gap Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.abs(stats.avgSelfScore - stats.avgManagerScore)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Auto vs Gestor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Faixa de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa de Desempenho</CardTitle>
            <CardDescription>
              Classificação dos colaboradores por nível de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Quartil */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Quartil</CardTitle>
            <CardDescription>
              Divisão da equipe em 4 grupos de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quartileDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" name="Colaboradores">
                  {quartileDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={QUARTILE_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-semibold">Q1</div>
                <div className="text-muted-foreground">0 - {quartiles?.q1}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Q2</div>
                <div className="text-muted-foreground">{quartiles?.q1} - {quartiles?.q2}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Q3</div>
                <div className="text-muted-foreground">{quartiles?.q2} - {quartiles?.q3}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Q4</div>
                <div className="text-muted-foreground">{quartiles?.q3} - 100</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparação Self vs Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Avaliações</CardTitle>
            <CardDescription>
              Médias de autoavaliação, avaliação do gestor e nota final
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scatter Plot - Distribuição Individual */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Individual de Notas</CardTitle>
            <CardDescription>
              Cada ponto representa um colaborador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="employeeId"
                  name="Colaborador"
                  domain={[0, "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="finalScore"
                  name="Nota Final"
                  domain={[0, 100]}
                />
                <ZAxis range={[100, 100]} />
                <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  name="Notas"
                  data={quartiles?.distribution || []}
                  fill="#3b82f6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.completionRate < 80 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">
                    Taxa de conclusão abaixo do esperado
                  </h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Apenas {stats.completionRate.toFixed(1)}% das avaliações foram concluídas. 
                    Considere enviar lembretes aos colaboradores pendentes.
                  </p>
                </div>
              </div>
            )}

            {Math.abs(stats.avgSelfScore - stats.avgManagerScore) > 15 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">
                    Gap significativo entre autoavaliação e avaliação do gestor
                  </h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Diferença média de {Math.abs(stats.avgSelfScore - stats.avgManagerScore)} pontos. 
                    Recomenda-se sessões de calibração para alinhar expectativas.
                  </p>
                </div>
              </div>
            )}

            {stats.avgFinalScore >= 80 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">
                    Desempenho excepcional da equipe
                  </h4>
                  <p className="text-sm text-green-800 mt-1">
                    Nota média de {stats.avgFinalScore} pontos indica alto nível de desempenho. 
                    Continue investindo em desenvolvimento e reconhecimento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
