import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Users, TrendingUp, Award, Target, DollarSign, Briefcase, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { CostCenterFilter } from "@/components/CostCenterFilter";
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
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

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
  Legend,
  Filler
);

/**
 * Dashboard Executivo
 * Métricas estratégicas para tomada de decisão da diretoria
 */
export default function ExecutiveDashboard() {
  const { user, loading } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("all");

  // Queries - DEVEM estar antes dos returns condicionais (regra dos React Hooks)
  const { data: kpis, isLoading: loadingKPIs } = trpc.executive.getKPIs.useQuery({
    departmentId: selectedDepartment,
    costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
  }, { enabled: !loading && user?.role === 'admin' });

  const { data: headcountByDept, isLoading: loadingHeadcount } =
    trpc.executive.getHeadcountByDepartment.useQuery({
      costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
    }, { enabled: !loading && user?.role === 'admin' });

  const { data: headcountTrend, isLoading: loadingTrend } = trpc.executive.getHeadcountTrend.useQuery({
    costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
  }, { enabled: !loading && user?.role === 'admin' });

  const { data: salaryDistribution, isLoading: loadingSalary } =
    trpc.executive.getSalaryDistribution.useQuery({
      costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
    }, { enabled: !loading && user?.role === 'admin' });

  const { data: turnoverRate, isLoading: loadingTurnover } = trpc.executive.getTurnoverRate.useQuery({
    costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
  }, { enabled: !loading && user?.role === 'admin' });

  const { data: successionPipeline, isLoading: loadingSuccession } =
    trpc.executive.getSuccessionPipeline.useQuery({
      costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
    }, { enabled: !loading && user?.role === 'admin' });

  const { data: trainingROI, isLoading: loadingROI } = trpc.executive.getTrainingROI.useQuery({
    costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
  }, { enabled: !loading && user?.role === 'admin' });

  const { data: performanceDistribution, isLoading: loadingPerformance } =
    trpc.executive.getPerformanceDistribution.useQuery({
      costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
    }, { enabled: !loading && user?.role === 'admin' });

  const { data: engagement, isLoading: loadingEngagement } = trpc.executive.getEngagementMetrics.useQuery({
    costCenter: selectedCostCenter !== 'all' ? selectedCostCenter : undefined,
  }, { enabled: !loading && user?.role === 'admin' });

  // Verificar se usuário é admin
  if (!loading && (!user || user.role !== "admin")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Apenas administradores podem acessar o Dashboard Executivo.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Configurações dos gráficos
  const headcountTrendData = {
    labels: headcountTrend?.map((d) => d.month) || [],
    datasets: [
      {
        label: "Total de Colaboradores",
        data: headcountTrend?.map((d) => d.total) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const headcountByDeptData = {
    labels: headcountByDept?.slice(0, 10).map((d) => d.department) || [],
    datasets: [
      {
        label: "Colaboradores",
        data: headcountByDept?.slice(0, 10).map((d) => d.count) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(20, 184, 166, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
      },
    ],
  };

  const salaryDistributionData = {
    labels: salaryDistribution?.map((d) => d.range) || [],
    datasets: [
      {
        label: "Colaboradores",
        data: salaryDistribution?.map((d) => d.count) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
      },
    ],
  };

  const turnoverRateData = {
    labels: turnoverRate?.map((d) => d.month) || [],
    datasets: [
      {
        label: "Taxa de Turnover (%)",
        data: turnoverRate?.map((d) => d.rate) || [],
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">Métricas estratégicas para tomada de decisão</p>
        </div>

        {/* Filtro de Centro de Custos */}
        <CostCenterFilter
          value={selectedCostCenter}
          onChange={setSelectedCostCenter}
          showLabel={false}
        />
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.activeEmployees || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis?.avgPerformanceScore && typeof kpis.avgPerformanceScore === 'number' ? kpis.avgPerformanceScore.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Escala de 1 a 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Potencial</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.highPotentialCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.totalEmployees
                ? ((kpis.highPotentialCount / kpis.totalEmployees) * 100).toFixed(1)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Turnover</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.turnoverRate && typeof kpis.turnoverRate === 'number' ? kpis.turnoverRate.toFixed(2) : "0.00"}%</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI de Treinamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingROI?.estimatedROI || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {trainingROI?.totalTrainings || 0} treinamentos concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Sucessão</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.successionCoverage || 0}</div>
            <p className="text-xs text-muted-foreground">Posições críticas cobertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Evolução de Headcount */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Headcount</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingTrend ? (
                <div className="flex items-center justify-center h-full">Carregando...</div>
              ) : (
                <Line data={headcountTrendData} options={chartOptions} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Departamentos</CardTitle>
            <CardDescription>Por número de colaboradores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingHeadcount ? (
                <div className="flex items-center justify-center h-full">Carregando...</div>
              ) : (
                <Bar
                  data={headcountByDeptData}
                  options={{
                    ...chartOptions,
                    indexAxis: "y" as const,
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Turnover */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Turnover Mensal</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingTurnover ? (
                <div className="flex items-center justify-center h-full">Carregando...</div>
              ) : (
                <Line data={turnoverRateData} options={chartOptions} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição Salarial */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Salarial</CardTitle>
            <CardDescription>Por faixa de remuneração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingSalary ? (
                <div className="flex items-center justify-center h-full">Carregando...</div>
              ) : (
                <Bar data={salaryDistributionData} options={chartOptions} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline de Sucessão e Engajamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline de Sucessão Crítica */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Sucessão Crítica</CardTitle>
            <CardDescription>Posições críticas e nível de risco</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSuccession ? (
              <div className="text-center py-8">Carregando...</div>
            ) : successionPipeline && successionPipeline.length > 0 ? (
              <div className="space-y-4">
                {successionPipeline.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{item.position}</p>
                      <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.riskLevel === "critico"
                          ? "bg-red-100 text-red-800"
                          : item.riskLevel === "alto"
                          ? "bg-orange-100 text-orange-800"
                          : item.riskLevel === "medio"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.riskLevel.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum plano de sucessão crítico encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas de Engajamento */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Engajamento</CardTitle>
            <CardDescription>Participação em metas e PDI</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEngagement ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Colaboradores com Metas</span>
                    <span className="text-sm font-bold">{engagement?.goalsEngagement || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${engagement?.goalsEngagement || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Colaboradores com PDI</span>
                    <span className="text-sm font-bold">{engagement?.pdiEngagement || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${engagement?.pdiEngagement || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total de Colaboradores Ativos</p>
                  <p className="text-2xl font-bold">{engagement?.totalActive || 0}</p>
                </div>

                {trainingROI && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Impacto de Treinamentos</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Performance Antes</p>
                        <p className="font-bold">{typeof trainingROI.avgPerformanceBefore === 'number' ? trainingROI.avgPerformanceBefore.toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Performance Depois</p>
                        <p className="font-bold">{typeof trainingROI.avgPerformanceAfter === 'number' ? trainingROI.avgPerformanceAfter.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      +{typeof trainingROI.improvementPercent === 'number' ? trainingROI.improvementPercent.toFixed(1) : '0.0'}% de melhoria
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
