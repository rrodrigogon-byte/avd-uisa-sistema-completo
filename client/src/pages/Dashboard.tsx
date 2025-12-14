import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Target, FileText } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { PerformanceEvolutionChart } from "@/components/charts/PerformanceEvolutionChart";
import { CompetencyRadarChart } from "@/components/charts/CompetencyRadarChart";
import { DepartmentDistributionChart } from "@/components/charts/DepartmentDistributionChart";
import PieChart from "@/components/charts/PieChart";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useAuth();
  const { data: evaluations, isLoading: loadingEvaluations } = trpc.evaluation.list.useQuery();
  const { data: pirData, isLoading: loadingPirs } = trpc.pir.list.useQuery();
  const { data: performanceData, isLoading: loadingPerformance } = trpc.analytics.performanceEvolution.useQuery({});
  const { data: competencyData, isLoading: loadingCompetency } = trpc.analytics.competencyComparison.useQuery(
    { jobDescriptionId: 1 },
    { enabled: false }
  );
  const { data: departmentData, isLoading: loadingDepartment } = trpc.analytics.departmentDistribution.useQuery();

  const myEvaluations = evaluations?.asEvaluated || [];
  const myPirs = pirData?.asUser || [];

  // Dados para gráfico de avaliações por status
  const evaluationsByStatus = {
    labels: ['Rascunho', 'Enviada', 'Aprovada', 'Rejeitada'],
    datasets: [
      {
        label: 'Avaliações',
        data: [
          myEvaluations.filter((e: any) => e.status === 'draft').length,
          myEvaluations.filter((e: any) => e.status === 'submitted').length,
          myEvaluations.filter((e: any) => e.status === 'approved').length,
          myEvaluations.filter((e: any) => e.status === 'rejected').length,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(251, 191, 36, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de evolução de scores
  const approvedEvaluations = myEvaluations
    .filter((e: any) => e.status === 'approved' && e.score)
    .sort((a: any, b: any) => new Date(a.approvedAt).getTime() - new Date(b.approvedAt).getTime())
    .slice(-6);

  const scoresOverTime = {
    labels: approvedEvaluations.map((e: any) => e.period),
    datasets: [
      {
        label: 'Score de Desempenho',
        data: approvedEvaluations.map((e: any) => e.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Dados para gráfico de PIRs por status
  const pirsByStatus = {
    labels: ['Rascunho', 'Ativo', 'Concluído', 'Cancelado'],
    datasets: [
      {
        label: 'PIRs',
        data: [
          myPirs.filter((p: any) => p.status === 'draft').length,
          myPirs.filter((p: any) => p.status === 'active').length,
          myPirs.filter((p: any) => p.status === 'completed').length,
          myPirs.filter((p: any) => p.status === 'cancelled').length,
        ],
        backgroundColor: [
          'rgba(148, 163, 184, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
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
  };

  const lineOptions: ChartOptions<'line'> = {
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
        max: 100,
      },
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const avgScore = approvedEvaluations.length > 0
    ? (approvedEvaluations.reduce((sum: number, e: any) => sum + e.score, 0) / approvedEvaluations.length).toFixed(1)
    : 'N/A';

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="container max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Visão geral do seu desempenho e progresso</p>
        </div>

        {/* Cards de métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myEvaluations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {myEvaluations.filter((e: any) => e.status === 'approved').length} aprovadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimas 6 avaliações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">PIRs Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myPirs.filter((p: any) => p.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {myPirs.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">PIRs Concluídos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myPirs.filter((p: any) => p.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Metas alcançadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Analíticos Avançados */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Desempenho Geral</CardTitle>
              <CardDescription>Tendência de scores ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <Skeleton className="h-[300px] w-full" />
              ) : performanceData && Array.isArray(performanceData) && performanceData.length > 0 ? (
                <PerformanceEvolutionChart data={performanceData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparação de Competências</CardTitle>
              <CardDescription>Análise de competências técnicas vs comportamentais</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompetency ? (
                <Skeleton className="h-[300px] w-full" />
              ) : competencyData && (competencyData.technical.length > 0 || competencyData.behavioral.length > 0) ? (
                <CompetencyRadarChart data={competencyData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Departamento</CardTitle>
              <CardDescription>Estatísticas de avaliações por área</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDepartment ? (
                <Skeleton className="h-[300px] w-full" />
              ) : departmentData && Array.isArray(departmentData) && departmentData.length > 0 ? (
                <DepartmentDistributionChart data={departmentData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status das Avaliações</CardTitle>
              <CardDescription>Distribuição por estado de aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvaluations ? (
                <Skeleton className="h-[300px] w-full" />
              ) : myEvaluations && myEvaluations.length > 0 ? (
                <PieChart
                  title=""
                  labels={['Rascunho', 'Em Análise', 'Aprovado', 'Rejeitado']}
                  data={[
                    myEvaluations.filter((e: any) => e.status === 'rascunho').length,
                    myEvaluations.filter((e: any) => e.status === 'em_analise').length,
                    myEvaluations.filter((e: any) => e.status === 'aprovado').length,
                    myEvaluations.filter((e: any) => e.status === 'rejeitado').length,
                  ]}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Pessoais */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações por Status</CardTitle>
              <CardDescription>Distribuição das suas avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={evaluationsByStatus} options={barOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Desempenho</CardTitle>
              <CardDescription>Histórico dos últimos scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {approvedEvaluations.length > 0 ? (
                  <Line data={scoresOverTime} options={lineOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PIRs por Status</CardTitle>
              <CardDescription>Distribuição dos seus planos individuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {myPirs.length > 0 ? (
                  <Doughnut data={pirsByStatus} options={doughnutOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum PIR cadastrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Ações</CardTitle>
              <CardDescription>Tarefas pendentes e recomendações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myEvaluations.filter((e: any) => e.status === 'draft').length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Avaliações em rascunho</p>
                      <p className="text-sm text-muted-foreground">
                        Você tem {myEvaluations.filter((e: any) => e.status === 'draft').length} avaliação(ões) pendente(s)
                      </p>
                    </div>
                  </div>
                )}
                {myPirs.filter((p: any) => p.status === 'active').length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">PIRs ativos</p>
                      <p className="text-sm text-muted-foreground">
                        Acompanhe o progresso de {myPirs.filter((p: any) => p.status === 'active').length} PIR(s) ativo(s)
                      </p>
                    </div>
                  </div>
                )}
                {myEvaluations.length === 0 && myPirs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma ação pendente no momento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
