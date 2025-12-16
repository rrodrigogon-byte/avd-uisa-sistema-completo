import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Activity, Users, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
 * Dashboard Analítico de Auditoria
 * Visualizações gráficas e métricas de logs de auditoria do sistema
 */
export default function DashboardAuditoria() {
  const [period, setPeriod] = useState<string>("30");

  // Buscar estatísticas de auditoria
  const { data: stats, isLoading: loadingStats } = trpc.audit.getStats.useQuery({
    days: parseInt(period),
  });

  // Buscar atividades por usuário
  const { data: userActivity, isLoading: loadingUserActivity } = trpc.audit.getUserActivity.useQuery({
    days: parseInt(period),
    limit: 10,
  });

  // Buscar distribuição por módulo
  const { data: moduleDistribution, isLoading: loadingModules } = trpc.audit.getModuleDistribution.useQuery({
    days: parseInt(period),
  });

  // Buscar horários de pico
  const { data: peakHours, isLoading: loadingPeakHours } = trpc.audit.getPeakHours.useQuery({
    days: parseInt(period),
  });

  // Buscar ações mais frequentes
  const { data: topActions, isLoading: loadingTopActions } = trpc.audit.getTopActions.useQuery({
    days: parseInt(period),
    limit: 10,
  });

  // Buscar padrões suspeitos
  const { data: suspiciousPatterns, isLoading: loadingSuspicious } = trpc.audit.getSuspiciousPatterns.useQuery({
    days: parseInt(period),
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Auditoria</h1>
            <p className="text-muted-foreground mt-1">
              Análise de atividades e padrões de uso do sistema
            </p>
          </div>

          <div className="w-48">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total de Ações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.actionsChange > 0 ? "+" : ""}{stats.actionsChange}% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Usuários únicos no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.peakHour}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maior volume de atividades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.securityAlerts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Padrões suspeitos detectados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Padrões Suspeitos */}
        {suspiciousPatterns && suspiciousPatterns.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Padrões Suspeitos Detectados
              </CardTitle>
              <CardDescription className="text-red-700">
                Atividades que requerem atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suspiciousPatterns.map((pattern: any, index: number) => (
                  <div key={index} className="p-3 bg-white border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-900">{pattern.description}</p>
                        <p className="text-sm text-red-700 mt-1">{pattern.details}</p>
                      </div>
                      <Badge variant="destructive">{pattern.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Atividades por Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top 10 Usuários Mais Ativos
              </CardTitle>
              <CardDescription>
                Usuários com maior volume de atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUserActivity ? (
                <Skeleton className="h-80" />
              ) : userActivity && userActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userActivity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="userName" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="actionCount" fill="#3b82f6" name="Ações" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Módulo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Módulo
              </CardTitle>
              <CardDescription>
                Atividades por módulo do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingModules ? (
                <Skeleton className="h-80" />
              ) : moduleDistribution && moduleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moduleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {moduleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horários de Pico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários de Pico de Uso
              </CardTitle>
              <CardDescription>
                Distribuição de atividades por hora do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPeakHours ? (
                <Skeleton className="h-80" />
              ) : peakHours && peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="Atividades"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Mais Frequentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Ações Mais Frequentes
              </CardTitle>
              <CardDescription>
                Top 10 ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopActions ? (
                <Skeleton className="h-80" />
              ) : topActions && topActions.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topActions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Insights e Análises</CardTitle>
              <CardDescription>
                Análise automática dos padrões de uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.securityAlerts > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      🚨 {stats.securityAlerts} alerta(s) de segurança detectado(s)
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Revise os padrões suspeitos e tome as ações necessárias.
                    </p>
                  </div>
                )}

                {stats.actionsChange > 100 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      📈 Aumento significativo de atividades (+{stats.actionsChange}%)
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Verifique se há processos ou eventos gerando volume incomum de ações.
                    </p>
                  </div>
                )}

                {stats.activeUsers > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      👥 {stats.activeUsers} usuários ativos no período
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Média de {Math.round(stats.totalActions / stats.activeUsers)} ações por usuário.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
