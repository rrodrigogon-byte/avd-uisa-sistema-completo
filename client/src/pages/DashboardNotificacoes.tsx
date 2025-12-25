import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { DashboardExportButtons } from "@/components/DashboardExportButtons";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
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
 * Dashboard Analítico de Notificações
 * Visualizações gráficas e métricas de notificações do sistema
 */
export default function DashboardNotificacoes() {
  const [period, setPeriod] = useState<string>("30");
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const distributionChartRef = useRef<HTMLDivElement>(null);

  // Buscar estatísticas de notificações
  const { data: stats, isLoading: loadingStats } = trpc.notifications.getStats.useQuery({
    days: parseInt(period),
  });

  // Buscar tendências ao longo do tempo
  const { data: trends, isLoading: loadingTrends } = trpc.notifications.getTrends.useQuery({
    days: parseInt(period),
  });

  // Buscar distribuição por tipo
  const { data: distribution, isLoading: loadingDistribution } = trpc.notifications.getDistribution.useQuery({
    days: parseInt(period),
  });

  // Buscar taxa de leitura
  const { data: readRate, isLoading: loadingReadRate } = trpc.notifications.getReadRate.useQuery({
    days: parseInt(period),
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Notificações</h1>
            <p className="text-muted-foreground mt-1">
              Análise e métricas de notificações do sistema
            </p>
          </div>

          <div className="flex items-center gap-4">
            {stats && trends && (
              <DashboardExportButtons
                dashboardTitle="Dashboard de Notificações"
                data={trends}
                columns={[
                  { header: "Data", accessor: "date" },
                  { header: "Quantidade", accessor: "count" },
                ]}
                chartRefs={[trendsChartRef, distributionChartRef]}
              />
            )}
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
                  <Bell className="h-4 w-4" />
                  Total de Notificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalChange > 0 ? "+" : ""}{stats.totalChange}% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Taxa de Leitura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.readRatePercent}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.readCount} de {stats.total} lidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Médio de Leitura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgReadTimeMinutes}min</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Desde o envio até a leitura
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Notificações Mais Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mostFrequentType}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.mostFrequentCount} notificações
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Tendências ao Longo do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Notificações
            </CardTitle>
            <CardDescription>
              Volume de notificações enviadas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-80" />
            ) : trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    name="Total"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="read"
                    stroke="#10b981"
                    name="Lidas"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="unread"
                    stroke="#f59e0b"
                    name="Não Lidas"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribuição por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Tipo
              </CardTitle>
              <CardDescription>
                Quantidade de notificações por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDistribution ? (
                <Skeleton className="h-80" />
              ) : distribution && distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {distribution.map((entry, index) => (
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

          {/* Taxa de Leitura por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Taxa de Leitura por Tipo
              </CardTitle>
              <CardDescription>
                Percentual de leitura por tipo de notificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReadRate ? (
                <Skeleton className="h-80" />
              ) : readRate && readRate.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={readRate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="readRate" fill="#3b82f6" name="Taxa de Leitura (%)" />
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

        {/* Insights e Recomendações */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Insights e Recomendações</CardTitle>
              <CardDescription>
                Análise automática dos padrões de notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.readRatePercent < 50 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      ⚠️ Taxa de leitura baixa ({stats.readRatePercent}%)
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Considere revisar o conteúdo e a relevância das notificações enviadas.
                    </p>
                  </div>
                )}

                {stats.avgReadTimeMinutes > 60 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">
                      ⏰ Tempo médio de leitura alto ({stats.avgReadTimeMinutes} minutos)
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Usuários estão demorando para visualizar as notificações. Considere aumentar a urgência visual.
                    </p>
                  </div>
                )}

                {stats.totalChange > 50 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      📈 Aumento significativo de notificações (+{stats.totalChange}%)
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Verifique se há eventos ou processos gerando volume excessivo de notificações.
                    </p>
                  </div>
                )}

                {stats.readRatePercent >= 80 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      ✅ Excelente taxa de leitura ({stats.readRatePercent}%)
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      As notificações estão sendo bem recebidas e visualizadas pelos usuários.
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
