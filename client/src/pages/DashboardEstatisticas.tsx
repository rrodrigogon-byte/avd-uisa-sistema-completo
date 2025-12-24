import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, Building2, Briefcase, Clock, TrendingUp, UserCheck } from "lucide-react";

/**
 * Dashboard de Estatísticas de Funcionários
 * Exibe gráficos e métricas sobre distribuição de funcionários
 */
export default function DashboardEstatisticas() {
  const { data: generalStats, isLoading: loadingGeneral } = trpc.dashboardStats.getGeneralStats.useQuery();
  const { data: byDepartment, isLoading: loadingDepartment } = trpc.dashboardStats.getByDepartment.useQuery();
  const { data: byPosition, isLoading: loadingPosition } = trpc.dashboardStats.getByPosition.useQuery();
  const { data: byTenure, isLoading: loadingTenure } = trpc.dashboardStats.getByTenure.useQuery();
  const { data: averageTenure, isLoading: loadingAverage } = trpc.dashboardStats.getAverageTenure.useQuery();
  const { data: topDepartments, isLoading: loadingTop } = trpc.dashboardStats.getTopDepartments.useQuery({ limit: 10 });

  // Cores para os gráficos
  const COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // green-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#14b8a6", // teal-500
    "#6366f1", // indigo-500
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-8 space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard de Estatísticas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visualize métricas e distribuições de funcionários em tempo real
          </p>
        </div>

        {/* Cards de Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingGeneral ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                    <Users className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{generalStats?.total || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
                    <UserCheck className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{generalStats?.active || 0}</div>
                  <p className="text-xs opacity-80 mt-1">
                    {generalStats?.total ? Math.round((generalStats.active / generalStats.total) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Com Gestor Definido</CardTitle>
                    <TrendingUp className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{generalStats?.withManager || 0}</div>
                  <p className="text-xs opacity-80 mt-1">
                    {generalStats?.total ? Math.round((generalStats.withManager / generalStats.total) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Tempo Médio de Empresa</CardTitle>
                    <Clock className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loadingAverage ? "..." : `${averageTenure?.averageYears || 0}a`}
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    {averageTenure?.averageMonths || 0} meses adicionais
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Distribuição por Departamento
              </CardTitle>
              <CardDescription>
                Quantidade de funcionários por departamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDepartment ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : byDepartment && byDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={byDepartment}
                      dataKey="count"
                      nameKey="departmentName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.departmentName}: ${entry.count}`}
                    >
                      {byDepartment.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Cargo (Top 10) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-500" />
                Top 10 Cargos
              </CardTitle>
              <CardDescription>
                Cargos com maior número de funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosition ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : byPosition && byPosition.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byPosition.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="positionName" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Funcionários" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Tempo de Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Tempo de Empresa
              </CardTitle>
              <CardDescription>
                Distribuição de funcionários por tempo de casa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTenure ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : byTenure && byTenure.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={byTenure}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tenure" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#f59e0b" 
                      fill="#fbbf24" 
                      name="Funcionários"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Departamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                Maiores Departamentos
              </CardTitle>
              <CardDescription>
                Departamentos com mais funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTop ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : topDepartments && topDepartments.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topDepartments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" stackId="a" fill="#10b981" name="Ativos" />
                    <Bar dataKey="inactive" stackId="a" fill="#ef4444" name="Inativos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
