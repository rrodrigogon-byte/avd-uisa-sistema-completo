import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Award,
  Filter,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

/**
 * Dashboard Avançado para Gestores
 * 
 * Funcionalidades:
 * - KPIs consolidados da equipe
 * - Gráficos de performance por período
 * - Gráficos de performance por departamento
 * - Filtros avançados (período, departamento, status)
 * - Lista de avaliações pendentes com ações rápidas
 * - Indicadores de tendências (melhoria/piora)
 * - Comparativo de performance entre colaboradores
 * - Heatmap de performance por área
 */

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function DashboardGestor() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("visao-geral");
  
  // Filtros
  const [periodFilter, setPeriodFilter] = useState<string>("last-3-months");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'quarter'>('month');

  // Calcular datas baseado no filtro de período - usando useState para evitar reload infinito
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    
    switch (periodFilter) {
      case 'last-month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'last-3-months':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last-6-months':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'last-year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'ytd':
        start.setMonth(0, 1);
        break;
      default:
        start.setMonth(start.getMonth() - 3);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [periodFilter]);

  // Queries
  const { data: teamStats, isLoading: statsLoading } = trpc.dashboardGestor.getTeamStats.useQuery({
    managerId: user?.id,
    startDate,
    endDate,
    departmentId: departmentFilter === 'all' ? undefined : parseInt(departmentFilter),
  }, { enabled: !!user?.id });

  const { data: performanceByPeriod, isLoading: periodLoading } = trpc.dashboardGestor.getPerformanceByPeriod.useQuery({
    managerId: user?.id,
    startDate,
    endDate,
    groupBy,
    departmentId: departmentFilter === 'all' ? undefined : parseInt(departmentFilter),
  }, { enabled: !!user?.id });

  const { data: performanceByDepartment, isLoading: deptLoading } = trpc.dashboardGestor.getPerformanceByDepartment.useQuery({
    managerId: user?.id,
    startDate,
    endDate,
  }, { enabled: !!user?.id });

  const { data: pendingEvaluationsData, isLoading: evaluationsLoading } = trpc.dashboardGestor.getPendingEvaluationsDetailed.useQuery({
    managerId: user?.id,
    limit: 10,
    offset: 0,
  }, { enabled: !!user?.id });

  const { data: teamComparison, isLoading: comparisonLoading } = trpc.dashboardGestor.getTeamPerformanceComparison.useQuery({
    managerId: user?.id,
    startDate,
    endDate,
    limit: 20,
  }, { enabled: !!user?.id });

  const { data: trendIndicators, isLoading: trendsLoading } = trpc.dashboardGestor.getTrendIndicators.useQuery({
    managerId: user?.id,
    months: 6,
  }, { enabled: !!user?.id });

  const { data: performanceHeatmap, isLoading: heatmapLoading } = trpc.dashboardGestor.getPerformanceHeatmap.useQuery({
    managerId: user?.id,
    startDate,
    endDate,
  }, { enabled: !!user?.id });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.organization.getDepartments.useQuery();

  const isLoading = statsLoading || periodLoading || deptLoading || evaluationsLoading;

  // Formatar dados para gráficos
  const performanceChartData = useMemo(() => {
    if (!performanceByPeriod) return [];
    return performanceByPeriod.map((item: any) => ({
      period: item.period,
      score: item.avgScore?.toFixed(1) || 0,
      count: item.count,
    }));
  }, [performanceByPeriod]);

  const departmentChartData = useMemo(() => {
    if (!performanceByDepartment) return [];
    return performanceByDepartment.map((item: any) => ({
      name: item.departmentName || 'Sem departamento',
      score: item.avgScore?.toFixed(1) || 0,
      employees: item.count,
    }));
  }, [performanceByDepartment]);

  // Calcular distribuição de performance
  const performanceDistribution = useMemo(() => {
    if (!teamComparison) return [];
    
    const ranges = [
      { name: 'Excelente (90-100)', min: 90, max: 100, count: 0 },
      { name: 'Bom (75-89)', min: 75, max: 89, count: 0 },
      { name: 'Regular (60-74)', min: 60, max: 74, count: 0 },
      { name: 'Abaixo (0-59)', min: 0, max: 59, count: 0 },
    ];

    teamComparison.forEach((emp: any) => {
      const score = emp.avgScore || 0;
      const range = ranges.find(r => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges.filter(r => r.count > 0);
  }, [teamComparison]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard do Gestor</h1>
            <p className="text-muted-foreground">
              Visão consolidada da performance e desenvolvimento da sua equipe
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Último mês</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                <SelectItem value="last-year">Último ano</SelectItem>
                <SelectItem value="ytd">Ano atual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs da Equipe */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho da Equipe</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Subordinados diretos
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
                {teamStats?.avgPerformance?.toFixed(1) || '0.0'}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {teamStats?.performanceTrend !== undefined && (
                  <>
                    {teamStats.performanceTrend > 0 ? (
                      <span className="flex items-center text-green-600">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        {teamStats.performanceTrend.toFixed(1)}%
                      </span>
                    ) : teamStats.performanceTrend < 0 ? (
                      <span className="flex items-center text-red-600">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        {Math.abs(teamStats.performanceTrend).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="flex items-center text-muted-foreground">
                        <Minus className="h-3 w-3 mr-1" />
                        Estável
                      </span>
                    )}
                    <span className="text-muted-foreground">vs período anterior</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamStats?.completedGoals || 0}/{teamStats?.totalGoals || 0}
              </div>
              <Progress 
                value={teamStats?.totalGoals ? (teamStats.completedGoals / teamStats.totalGoals) * 100 : 0} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {teamStats?.inProgressGoals || 0} em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(teamStats?.pendingEvaluations || 0) + (teamStats?.activePDIs || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {teamStats?.pendingEvaluations || 0} avaliações + {teamStats?.activePDIs || 0} PDIs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
            <TabsTrigger value="tendencias">Tendências</TabsTrigger>
            <TabsTrigger value="acoes">Ações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gráfico de Performance por Período */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Performance ao Longo do Tempo</CardTitle>
                      <CardDescription>
                        Evolução da performance média da equipe
                      </CardDescription>
                    </div>
                    <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Dia</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                        <SelectItem value="quarter">Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {periodLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : performanceChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Sem dados para o período selecionado</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name="Performance Média"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Performance por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Departamento</CardTitle>
                  <CardDescription>
                    Comparação entre departamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deptLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : departmentChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Sem dados de departamentos</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={departmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" fill="#82ca9d" name="Performance Média" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Distribuição de Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Performance</CardTitle>
                <CardDescription>
                  Quantidade de colaboradores por faixa de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : performanceDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Sem dados de performance</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {performanceDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Detalhada */}
          <TabsContent value="performance" className="space-y-4">
            {/* Heatmap de Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Heatmap de Performance</CardTitle>
                <CardDescription>
                  Performance média por departamento e cargo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapLoading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !performanceHeatmap || performanceHeatmap.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Sem dados para o heatmap</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performanceHeatmap.map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.department || 'Sem departamento'}</p>
                            <p className="text-sm text-muted-foreground">{item.position || 'Sem cargo'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{item.avgScore?.toFixed(1) || '0.0'}</p>
                            <p className="text-xs text-muted-foreground">{item.count} colaboradores</p>
                          </div>
                        </div>
                        <Progress 
                          value={item.avgScore || 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparativo de Equipe */}
          <TabsContent value="comparativo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Performance</CardTitle>
                <CardDescription>
                  Top performers da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !teamComparison || teamComparison.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sem dados de comparação</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamComparison.map((emp: any, index: number) => (
                      <div key={emp.employeeId} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{emp.employeeName}</p>
                            {index < 3 && (
                              <Award className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {emp.employeePosition || 'Sem cargo'} - {emp.departmentName || 'Sem departamento'}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-2xl font-bold">
                            {emp.avgScore?.toFixed(1) || '0.0'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {emp.completedGoals || 0}/{emp.totalGoals || 0} metas
                          </div>
                          {emp.nineBoxPerformance && emp.nineBoxPotential && (
                            <Badge variant="outline" className="text-xs">
                              P{emp.nineBoxPerformance} / P{emp.nineBoxPotential}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tendências */}
          <TabsContent value="tendencias" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Melhorando */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    Melhorando
                  </CardTitle>
                  <CardDescription>
                    Colaboradores com tendência de melhoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !trendIndicators?.improving || trendIndicators.improving.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhum colaborador identificado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trendIndicators.improving.map((emp: any) => (
                        <div key={emp.employeeId} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">Tendência positiva</p>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <ArrowUp className="h-4 w-4" />
                            <span className="text-sm font-bold">+{emp.trend.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estável */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Minus className="h-5 w-5" />
                    Estável
                  </CardTitle>
                  <CardDescription>
                    Colaboradores com performance estável
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !trendIndicators?.stable || trendIndicators.stable.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhum colaborador identificado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trendIndicators.stable.slice(0, 5).map((emp: any) => (
                        <div key={emp.employeeId} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">Performance consistente</p>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Minus className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Declinando */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="h-5 w-5" />
                    Requer Atenção
                  </CardTitle>
                  <CardDescription>
                    Colaboradores com tendência de queda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !trendIndicators?.declining || trendIndicators.declining.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhum colaborador identificado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trendIndicators.declining.map((emp: any) => (
                        <div key={emp.employeeId} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">Necessita suporte</p>
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <ArrowDown className="h-4 w-4" />
                            <span className="text-sm font-bold">{emp.trend.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ações Pendentes */}
          <TabsContent value="acoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Pendentes</CardTitle>
                <CardDescription>
                  Avaliações que requerem sua atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !pendingEvaluationsData?.evaluations || pendingEvaluationsData.evaluations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
                    <p>Nenhuma avaliação pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvaluationsData.evaluations.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{evaluation.employeeName}</p>
                            <Badge variant="outline">{evaluation.cycleName || 'Sem ciclo'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {evaluation.employeePosition || 'Sem cargo'}
                          </p>
                          {evaluation.dueDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              Prazo: {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm">
                            Avaliar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
