import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Minus, BarChart3, LineChart, Calendar } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Dashboard de Analytics Avançado
 * Análises históricas e tendências de performance
 */
export default function AnalyticsAvancado() {
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
  const [selectedMonths, setSelectedMonths] = useState(12);

  // Queries
  const { data: stats } = trpc.advancedAnalytics.getAdvancedStats.useQuery();
  const { data: goalsAdherence } = trpc.advancedAnalytics.getGoalsAdherenceTrend.useQuery({
    departmentId: selectedDepartment,
    months: selectedMonths,
  });
  const { data: performanceEvolution } = trpc.advancedAnalytics.getPerformanceEvolutionByDepartment.useQuery({
    months: selectedMonths,
  });
  const { data: cyclesComparison } = trpc.advancedAnalytics.getEvaluationCyclesComparison.useQuery();
  const { data: pdiTrend } = trpc.advancedAnalytics.getPDICompletionTrend.useQuery({
    months: selectedMonths,
    departmentId: selectedDepartment,
  });
  const { data: forecast } = trpc.advancedAnalytics.getPerformanceForecast.useQuery({
    departmentId: selectedDepartment,
  });
  const { data: heatmap } = trpc.advancedAnalytics.getEngagementHeatmap.useQuery({
    year: new Date().getFullYear(),
  });

  // Preparar dados para gráfico de adesão de metas
  const goalsAdherenceChartData = {
    labels: goalsAdherence?.map((d: any) => d.month) || [],
    datasets: [
      {
        label: "Taxa de Adesão (%)",
        data: goalsAdherence?.map((d: any) => d.adherenceRate) || [],
        borderColor: "#F39200",
        backgroundColor: "rgba(243, 146, 0, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Progresso Médio (%)",
        data: goalsAdherence?.map((d: any) => Number(d.avgProgress)) || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Preparar dados para gráfico de PDI
  const pdiChartData = {
    labels: pdiTrend?.map((d: any) => d.month) || [],
    datasets: [
      {
        label: "Concluídos",
        data: pdiTrend?.map((d: any) => d.completedItems) || [],
        backgroundColor: "#10b981",
      },
      {
        label: "Em Progresso",
        data: pdiTrend?.map((d: any) => d.inProgressItems) || [],
        backgroundColor: "#f59e0b",
      },
      {
        label: "Não Iniciados",
        data: pdiTrend?.map((d: any) => d.notStartedItems) || [],
        backgroundColor: "#ef4444",
      },
    ],
  };

  // Preparar dados para gráfico de previsão
  const forecastChartData = forecast?.historicalData
    ? {
        labels: [
          ...forecast.historicalData.map((d: any) => d.month),
          ...(forecast.forecast?.map((f: any) => f.month) || []),
        ],
        datasets: [
          {
            label: "Performance Histórica",
            data: [
              ...forecast.historicalData.map((d: any) => Number(d.avgPerformance)),
              ...new Array(forecast.forecast?.length || 0).fill(null),
            ],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Previsão",
            data: [
              ...new Array(forecast.historicalData.length - 1).fill(null),
              Number(forecast.historicalData[forecast.historicalData.length - 1].avgPerformance),
              ...(forecast.forecast?.map((f: any) => Number(f.predictedPerformance)) || []),
            ],
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderDash: [5, 5],
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-[#F39200]" />
              Analytics Avançado
            </h1>
            <p className="text-muted-foreground">
              Análises históricas e tendências de performance
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={selectedMonths.toString()} onValueChange={(v) => setSelectedMonths(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Gerais */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Funcionários</CardDescription>
                <CardTitle className="text-3xl">{stats.totalEmployees}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Metas</CardDescription>
                <CardTitle className="text-3xl">{stats.totalGoals}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Performance Média</CardDescription>
                <CardTitle className="text-3xl">{stats.avgPerformance}/100</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Progresso Médio de Metas</CardDescription>
                <CardTitle className="text-3xl">{stats.avgGoalProgress}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Tendência de Adesão de Metas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-[#F39200]" />
              Tendência de Adesão de Metas
            </CardTitle>
            <CardDescription>
              Acompanhamento de adesão e progresso de metas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goalsAdherence && goalsAdherence.length > 0 ? (
              <Line
                data={goalsAdherenceChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado disponível para o período selecionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evolução de Performance por Departamento */}
        {performanceEvolution && Object.keys(performanceEvolution).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Performance por Departamento</CardTitle>
              <CardDescription>
                Comparação de performance média entre departamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(performanceEvolution).map(([dept, data]) => (
                <div key={dept} className="space-y-2">
                  <h4 className="font-semibold">{dept}</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {data.map((d: any) => (
                      <div key={d.month} className="border rounded p-2">
                        <div className="text-muted-foreground">{d.month}</div>
                        <div className="font-semibold">Score: {d.avgFinalScore}/100</div>
                        <div className="text-xs text-muted-foreground">
                          {d.totalEvaluations} avaliações
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tendência de Conclusão de PDI */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Conclusão de PDI</CardTitle>
            <CardDescription>
              Status de itens de PDI ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pdiTrend && pdiTrend.length > 0 ? (
              <Bar
                data={pdiChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                  },
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true },
                  },
                }}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado de PDI disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Previsão de Performance */}
        {forecast && forecast.trend !== "insufficient_data" && forecastChartData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#F39200]" />
                Previsão de Performance
                {forecast.trend === "improving" && (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                )}
                {forecast.trend === "declining" && (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                {forecast.trend === "stable" && (
                  <Minus className="h-5 w-5 text-gray-600" />
                )}
              </CardTitle>
              <CardDescription>
                Tendência:{" "}
                <span
                  className={
                    forecast.trend === "improving"
                      ? "text-green-600 font-semibold"
                      : forecast.trend === "declining"
                      ? "text-red-600 font-semibold"
                      : "text-gray-600 font-semibold"
                  }
                >
                  {forecast.trend === "improving"
                    ? "Melhorando"
                    : forecast.trend === "declining"
                    ? "Declinando"
                    : "Estável"}
                </span>{" "}
                | Média Atual: {forecast.currentAvg}/100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Line
                data={forecastChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100 },
                  },
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Comparação de Ciclos de Avaliação */}
        {cyclesComparison && cyclesComparison.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Ciclos de Avaliação</CardTitle>
              <CardDescription>
                Análise ano a ano dos ciclos de avaliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cyclesComparison.map((cycle: any) => (
                  <div key={cycle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{cycle.name}</h4>
                        <p className="text-sm text-muted-foreground">Ano: {cycle.year}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{cycle.avgPerformance}/100</div>
                        <div className="text-xs text-muted-foreground">Performance Média</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total de Avaliações</div>
                        <div className="font-semibold">{cycle.totalEvaluations}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Concluídas</div>
                        <div className="font-semibold">{cycle.completedEvaluations}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa de Conclusão</div>
                        <div className="font-semibold">{cycle.completionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
