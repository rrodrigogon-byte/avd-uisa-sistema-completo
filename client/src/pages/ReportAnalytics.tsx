import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, FileText, Download, TrendingUp } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportAnalytics() {
  const { data: stats, isLoading: statsLoading } = trpc.reportAnalytics.getUsageStats.useQuery();
  const { data: mostUsedMetrics, isLoading: metricsLoading } = trpc.reportAnalytics.getMostUsedMetrics.useQuery();
  const { data: exportHistory, isLoading: historyLoading } = trpc.reportAnalytics.getExportHistory.useQuery({ limit: 20 });
  const { data: trends, isLoading: trendsLoading } = trpc.reportAnalytics.getTrends.useQuery();

  // Dados para gráfico de métricas mais usadas
  const metricsChartData = {
    labels: mostUsedMetrics?.map((m) => m.metric) || [],
    datasets: [
      {
        label: "Número de Usos",
        data: mostUsedMetrics?.map((m) => m.count) || [],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  // Dados para gráfico de tendências
  const trendsChartData = {
    labels: trends?.map((t) => new Date(t.date).toLocaleDateString("pt-BR")) || [],
    datasets: [
      {
        label: "Relatórios Gerados",
        data: trends?.map((t) => t.count) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics do Report Builder</h1>
        <p className="text-muted-foreground">
          Estatísticas de uso e insights sobre relatórios customizados
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">Relatórios gerados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Exportações</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalExports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.exportsPdf || 0} PDF • {stats?.exportsExcel || 0} Excel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : Math.round(stats?.avgExecutionTimeMs || 0)}ms
            </div>
            <p className="text-xs text-muted-foreground">Tempo de execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métricas Únicas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : mostUsedMetrics?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Métricas diferentes usadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Métricas Mais Usadas */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas Mais Consultadas</CardTitle>
            <CardDescription>Top 10 métricas por número de usos</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : mostUsedMetrics && mostUsedMetrics.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={metricsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Tendências */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Uso (30 dias)</CardTitle>
            <CardDescription>Relatórios gerados ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : trends && trends.length > 0 ? (
              <div className="h-64">
                <Line
                  data={trendsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Exportações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Exportações</CardTitle>
          <CardDescription>Últimas 20 exportações de relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center text-muted-foreground py-8">Carregando...</div>
          ) : exportHistory && exportHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Relatório</th>
                    <th className="text-left p-2 font-medium">Tipo</th>
                    <th className="text-left p-2 font-medium">Data</th>
                    <th className="text-left p-2 font-medium">Tempo (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.reportName}</td>
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            item.action === "export_pdf"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.action === "export_pdf" ? "PDF" : "Excel"}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-2 text-sm">{item.executionTimeMs || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma exportação registrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
