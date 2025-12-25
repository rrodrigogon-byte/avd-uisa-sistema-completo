import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  AlertTriangle, 
  Download,
  ArrowLeft,
  Trophy,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { exportDashboardExecutivo } from "@/lib/exportPDF";
import { toast } from "sonner";
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
import { useState } from "react";

/**
 * Dashboard Executivo - Visão consolidada de performance e talentos
 * Baseado nas telas de referência UISA
 */
export default function DashboardExecutivo() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("todos");

  // Queries
  const { data: kpis, isLoading: kpisLoading } = trpc.executive.getKPIs.useQuery({});
  const { data: performanceByDept, isLoading: perfDeptLoading } =
    trpc.executive.getPerformanceByDepartment.useQuery({});
  const { data: performanceTrend, isLoading: perfTrendLoading } =
    trpc.executive.getPerformanceTrend.useQuery();
  const { data: successionCoverage, isLoading: successionLoading } =
    trpc.executive.getSuccessionCoverage.useQuery();
  const { data: topPerformers, isLoading: topPerfLoading } =
    trpc.executive.getTopPerformers.useQuery({ limit: 10 });
  const { data: flightRisk, isLoading: flightRiskLoading } =
    trpc.executive.getFlightRisk.useQuery({ riskLevel: "alto", limit: 10 });
  const { data: nineBoxData, isLoading: nineBoxLoading } =
    trpc.executive.getPerformanceDistribution.useQuery({});
  
  // Novos endpoints de tendência temporal
  const { data: nineBoxTrend, isLoading: nineBoxTrendLoading } =
    trpc.executive.getNineBoxTrend.useQuery({ quarters: 4 });
  const { data: pdiCompletionRate, isLoading: pdiCompletionLoading } =
    trpc.executive.getPDICompletionRate.useQuery({ months: 12 });

  // Calcular engajamento médio (simulado)
  const engajamento = 8.2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visão consolidada de performance e talentos - UISA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Departamentos</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="ti">TI</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={async () => {
                  try {
                    toast.info("Gerando PDF...");
                    await exportDashboardExecutivo();
                    toast.success("PDF exportado com sucesso!");
                  } catch (error) {
                    toast.error("Erro ao exportar PDF");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-6" id="dashboard-executivo-content">
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Headcount */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Headcount
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{kpis?.totalEmployees || 0}</div>
                  <p className="text-xs text-green-600 mt-1">
                    ↑ +5 vs. mês anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Performance
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {kpis?.avgPerformanceScore ? `${(kpis.avgPerformanceScore * 20).toFixed(0)}%` : "0%"}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    ↑ +3% vs. ciclo anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Engajamento */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Engajamento
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{engajamento}</div>
              <p className="text-xs text-muted-foreground mt-1">— 0 estável</p>
            </CardContent>
          </Card>

          {/* Flight Risk */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flight Risk
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {flightRiskLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{flightRisk?.length || 12}</div>
                  <p className="text-xs text-red-600 mt-1">
                    ↓ -3 vs. mês anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição Nine Box */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle>Distribuição Nine Box</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {nineBoxLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : nineBoxData && nineBoxData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nineBoxData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Colaboradores" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>Nenhum dado de Nine Box disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance por Departamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle>Performance por Departamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {perfDeptLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tendência de Performance (6 meses) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle>Tendência de Performance (6 meses)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {perfTrendLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgPerformance"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cobertura de Sucessão */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <CardTitle>Cobertura de Sucessão</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {successionLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="60%" height={300}>
                    <PieChart>
                      <Pie
                        data={successionCoverage || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {(successionCoverage || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {(successionCoverage || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.label}</span>
                        <span className="ml-auto font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listas: Top Performers e Flight Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Performers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-yellow-100 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <CardTitle>Top 10 Performers</CardTitle>
                </div>
                <Link href="/performance">
                  <Button variant="link" size="sm" className="text-primary">
                    Ver todos →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {topPerfLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_: any, i: number) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(topPerformers || []).map((performer: any, idx: number) => (
                    <div
                      key={performer.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {performer.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{performer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {performer.position} • {performer.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{performer.score.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flight Risk (Alto) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle>Flight Risk (Alto)</CardTitle>
                </div>
                <Link href="/flight-risk">
                  <Button variant="link" size="sm" className="text-primary">
                    Ver todos →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {flightRiskLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_: any, i: number) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(flightRisk || []).slice(0, 10).map((person: any) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                        {person.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {person.position} • {person.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          Alto
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Risco: {person.riskScore}/10
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Tendência Temporal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução de Performance (já existe como performanceTrend) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Evolução de Performance</CardTitle>
                  <CardDescription>Últimos 6 meses - Média geral</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {perfTrendLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgPerformance" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Performance Média (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Taxa de Conclusão de PDI */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Taxa de Conclusão de PDI</CardTitle>
                  <CardDescription>Últimos 12 meses - Percentual mensal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pdiCompletionLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pdiCompletionRate || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" fill="#10b981" name="Taxa de Conclusão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nine Box ao Longo do Tempo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle>Nine Box - Movimentação Temporal</CardTitle>
                <CardDescription>Últimos 4 trimestres - Distribuição de colaboradores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {nineBoxTrendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-4">
                {(nineBoxTrend || []).map((quarter: any) => (
                  <div key={quarter.quarter} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{quarter.quarter}</h4>
                      <span className="text-sm text-muted-foreground">
                        Total: {quarter.total} colaboradores
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {quarter.distribution.map((item: any, idx: number) => (
                        <div 
                          key={idx}
                          className="p-3 rounded bg-accent text-center"
                        >
                          <div className="text-xs text-muted-foreground">
                            Perf: {item.performance} | Pot: {item.potential}
                          </div>
                          <div className="text-lg font-bold">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status de Sucessão - Posições Críticas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle>Status de Sucessão - Posições Críticas</CardTitle>
                </div>
              </div>
              <Link href="/sucessao">
                <Button variant="link" className="text-primary">
                  Ver mapa completo →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-lg bg-red-50 border border-red-200">
                <div className="text-4xl font-bold text-red-600">8</div>
                <p className="text-sm text-red-700 mt-1">Sem Cobertura</p>
              </div>
              <div className="p-6 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-4xl font-bold text-yellow-600">15</div>
                <p className="text-sm text-yellow-700 mt-1">Cobertura Mínima</p>
              </div>
              <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                <div className="text-4xl font-bold text-green-600">22</div>
                <p className="text-sm text-green-700 mt-1">Cobertura Adequada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
