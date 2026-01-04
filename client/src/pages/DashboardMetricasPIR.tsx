import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Dashboard de Métricas e Analytics de Engajamento PIR Integridade
 * 
 * Visualiza:
 * - Tempo médio de conclusão
 * - Taxa de resposta por departamento
 * - Taxa de conclusão geral
 * - Evolução temporal
 * - Distribuição de tempo de conclusão
 */
export default function DashboardMetricasPIR() {
  const { user } = useAuth();

  const metricsQuery = trpc.pirIntegrity.getEngagementMetrics.useQuery(undefined, {
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  if (metricsQuery.isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Métricas - PIR Integridade</h1>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (metricsQuery.error || !metricsQuery.data) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Métricas - PIR Integridade</h1>
          <p className="text-red-600">Erro ao carregar métricas: {metricsQuery.error?.message}</p>
        </div>
      </div>
    );
  }

  const { overview, byDepartment, byMonth, completionTimeDistribution } = metricsQuery.data;

  // Cores para gráficos
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Métricas - PIR Integridade</h1>
        <p className="text-muted-foreground">
          Analytics de engajamento e desempenho dos testes de integridade
        </p>
      </div>

      <div className="space-y-6">
        {/* Cards de Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Testes"
            value={overview.totalTests}
            icon={Activity}
            color="blue"
            subtitle="Enviados"
          />
          <MetricCard
            title="Taxa de Conclusão"
            value={`${overview.completionRate}%`}
            icon={CheckCircle2}
            color="green"
            subtitle={`${overview.completedTests} concluídos`}
          />
          <MetricCard
            title="Tempo Médio"
            value={`${overview.averageCompletionTime} min`}
            icon={Clock}
            color="orange"
            subtitle="De conclusão"
          />
          <MetricCard
            title="Pendentes"
            value={overview.pendingTests}
            icon={AlertCircle}
            color="yellow"
            subtitle={`${overview.expiredTests} expirados`}
          />
        </div>

        {/* Gráfico de Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Temporal (Últimos 12 Meses)
            </CardTitle>
            <CardDescription>Testes enviados e concluídos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalSent" stroke="#3b82f6" name="Enviados" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Concluídos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráficos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Taxa de Resposta por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Taxa de Resposta por Departamento
              </CardTitle>
              <CardDescription>Desempenho de conclusão por área</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#10b981" name="Taxa de Conclusão (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Tempo de Conclusão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Distribuição de Tempo de Conclusão
              </CardTitle>
              <CardDescription>Faixas de tempo para completar o teste</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={completionTimeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percentage }) => `${range}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {completionTimeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas Detalhadas por Departamento
            </CardTitle>
            <CardDescription>Análise completa de engajamento por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Departamento</th>
                    <th className="text-right p-3 font-medium">Total Enviados</th>
                    <th className="text-right p-3 font-medium">Concluídos</th>
                    <th className="text-right p-3 font-medium">Taxa de Conclusão</th>
                    <th className="text-right p-3 font-medium">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {byDepartment.map((dept, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{dept.department}</td>
                      <td className="text-right p-3">{dept.totalSent}</td>
                      <td className="text-right p-3">{dept.completed}</td>
                      <td className="text-right p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            dept.completionRate >= 80
                              ? "bg-green-100 text-green-700"
                              : dept.completionRate >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dept.completionRate}%
                        </span>
                      </td>
                      <td className="text-right p-3">{dept.averageTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights e Recomendações
            </CardTitle>
            <CardDescription>Análise automática baseada nas métricas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.completionRate < 50 && (
              <InsightCard
                type="warning"
                title="Taxa de Conclusão Baixa"
                description={`Apenas ${overview.completionRate}% dos testes foram concluídos. Considere enviar lembretes ou revisar o processo.`}
              />
            )}

            {overview.averageCompletionTime > 60 && (
              <InsightCard
                type="info"
                title="Tempo de Conclusão Elevado"
                description={`O tempo médio de ${overview.averageCompletionTime} minutos pode indicar que o teste é muito longo. Considere revisar as questões.`}
              />
            )}

            {overview.pendingTests > overview.completedTests && (
              <InsightCard
                type="alert"
                title="Muitos Testes Pendentes"
                description={`Há ${overview.pendingTests} testes pendentes. Considere enviar lembretes automáticos para aumentar o engajamento.`}
              />
            )}

            {byDepartment.some((d) => d.completionRate < 30) && (
              <InsightCard
                type="warning"
                title="Departamentos com Baixo Engajamento"
                description="Alguns departamentos têm taxa de conclusão abaixo de 30%. Considere ações específicas para essas áreas."
              />
            )}

            {overview.completionRate >= 80 && (
              <InsightCard
                type="success"
                title="Excelente Taxa de Conclusão!"
                description={`Com ${overview.completionRate}% de conclusão, o engajamento está ótimo. Continue monitorando para manter o padrão.`}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "orange" | "yellow" | "red";
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  type: "success" | "info" | "warning" | "alert";
  title: string;
  description: string;
}

function InsightCard({ type, title, description }: InsightCardProps) {
  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      descColor: "text-green-700",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: Activity,
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      descColor: "text-blue-700",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      descColor: "text-yellow-700",
    },
    alert: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      descColor: "text-red-700",
    },
  };

  const { bg, border, icon: Icon, iconColor, titleColor, descColor } = config[type];

  return (
    <div className={`${bg} border ${border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="space-y-1">
          <p className={`font-medium ${titleColor}`}>{title}</p>
          <p className={`text-sm ${descColor}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}
