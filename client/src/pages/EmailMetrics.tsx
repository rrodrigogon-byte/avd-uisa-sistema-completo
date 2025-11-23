import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2, XCircle, TrendingUp, ShieldAlert, BarChart3 } from "lucide-react";
import { Line, Pie, Bar } from "react-chartjs-2";
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
 * Dashboard de Métricas de E-mail
 * Visualização de estatísticas de envio de e-mails
 */

export default function EmailMetrics() {
  const { user } = useAuth();

  // Buscar estatísticas agregadas
  const { data: stats, isLoading } = trpc.admin.getEmailStats.useQuery();

  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Acesso negado: apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Nenhuma métrica de e-mail disponível ainda.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Preparar dados para gráfico de linha (histórico mensal)
  const lineChartData = {
    labels: stats.monthlyData.map((m: { month: string; sent: number; success: number; failed: number }) => {
      const [year, month] = m.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'E-mails Enviados',
        data: stats.monthlyData.map((m: { month: string; sent: number; success: number; failed: number }) => m.sent),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sucesso',
        data: stats.monthlyData.map((m: { month: string; sent: number; success: number; failed: number }) => m.success),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Falhas',
        data: stats.monthlyData.map((m: { month: string; sent: number; success: number; failed: number }) => m.failed),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Preparar dados para gráfico de pizza (sucesso vs falha)
  const pieChartData = {
    labels: ['Sucesso', 'Falha'],
    datasets: [
      {
        data: [stats.successful, stats.failed],
        backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  };

  // Preparar dados para gráfico de barras (tipos de e-mail)
  const typeLabels = Object.keys(stats.byType);
  const typeCounts = Object.values(stats.byType);
  
  const barChartData = {
    labels: typeLabels.map(type => {
      // Traduzir tipos de e-mail
      const translations: Record<string, string> = {
        'goal_reminder': 'Lembrete de Meta',
        'evaluation_pending': 'Avaliação Pendente',
        'action_overdue': 'Ação Vencida',
        'pdi_approved': 'PDI Aprovado',
        'welcome': 'Boas-vindas',
        'password_reset': 'Redefinição de Senha',
      };
      return translations[type] || type;
    }),
    datasets: [
      {
        label: 'Quantidade',
        data: typeCounts,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Histórico Mensal de Envios',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Taxa de Sucesso vs Falha',
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'E-mails por Tipo',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Métricas de E-mail
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe estatísticas de envio de e-mails automáticos
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enviado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.total.toLocaleString('pt-BR')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {stats.successful.toLocaleString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Falhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-2xl font-bold text-red-600">
                  {stats.failed.toLocaleString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{stats.successRate}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Linha - Histórico Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Mensal</CardTitle>
            <CardDescription>
              Envios de e-mails nos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráficos de Pizza e Barras */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Sucesso</CardTitle>
              <CardDescription>
                Proporção de e-mails entregues com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de E-mail</CardTitle>
              <CardDescription>
                Distribuição por tipo de notificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={barChartData} options={barOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
