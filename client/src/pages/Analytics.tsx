import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { data: kpis, isLoading: loadingKPIs } = trpc.analytics.getKPIs.useQuery();
  const { data: trends, isLoading: loadingTrends } = trpc.analytics.getPerformanceTrends.useQuery();
  const { data: nineBox, isLoading: loadingNineBox } = trpc.analytics.getNineBoxDistribution.useQuery();
  const { data: completion, isLoading: loadingCompletion } = trpc.analytics.getCompletionRates.useQuery();

  // Dados do gráfico de tendências
  const trendsData = {
    labels: trends?.map(t => t.month) || [],
    datasets: [
      {
        label: "Média de Performance",
        data: trends?.map(t => t.average) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Dados do gráfico Nine Box
  const nineBoxData = {
    labels: nineBox?.map(n => `${n.performance}-${n.potential}`) || [],
    datasets: [
      {
        label: "Colaboradores",
        data: nineBox?.map(n => n.count) || [],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
      },
    ],
  };

  // Dados do gráfico de conclusão
  const completionData = {
    labels: ["Metas Concluídas", "Metas Pendentes", "PDIs Concluídos", "PDIs Pendentes"],
    datasets: [
      {
        data: [
          completion?.completedGoals || 0,
          (completion?.totalGoals || 0) - (completion?.completedGoals || 0),
          completion?.completedPDIs || 0,
          (completion?.totalPDIs || 0) - (completion?.completedPDIs || 0),
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(249, 115, 22, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics de Performance</h1>
        <p className="text-muted-foreground">
          Análises e tendências do sistema de avaliação de desempenho
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingKPIs ? "..." : kpis?.avgPerformance || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis?.totalEvaluations || 0} avaliações realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingKPIs ? "..." : kpis?.totalEmployees || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis?.employeesWithPDI || 0} com PDI ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCompletion ? "..." : `${completion?.goals || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Metas concluídas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDIs Concluídos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCompletion ? "..." : `${completion?.pdis || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de conclusão de PDIs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Performance</CardTitle>
            <CardDescription>Média mensal dos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : trends && trends.length > 0 ? (
              <div className="h-[300px]">
                <Line
                  data={trendsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição Nine Box</CardTitle>
            <CardDescription>Colaboradores por quadrante</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingNineBox ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : nineBox && nineBox.length > 0 ? (
              <div className="h-[300px]">
                <Bar
                  data={nineBoxData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conclusão</CardTitle>
            <CardDescription>Metas e PDIs concluídos vs pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompletion ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : completion ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-[250px] h-[250px]">
                  <Doughnut
                    data={completionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
            <CardDescription>Estatísticas consolidadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de Metas</span>
              <span className="font-bold">{completion?.totalGoals || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Metas Concluídas</span>
              <span className="font-bold text-green-600">{completion?.completedGoals || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de PDIs</span>
              <span className="font-bold">{completion?.totalPDIs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PDIs Concluídos</span>
              <span className="font-bold text-blue-600">{completion?.completedPDIs || 0}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">Colaboradores Ativos</span>
              <span className="font-bold">{kpis?.totalEmployees || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Com PDI Ativo</span>
              <span className="font-bold text-purple-600">{kpis?.employeesWithPDI || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
