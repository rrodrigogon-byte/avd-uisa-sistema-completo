import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle, 
  Download,
  Loader2,
  Calendar
} from "lucide-react";
import { safeMap } from "@/lib/arrayHelpers";
import { toast } from "sonner";

/**
 * Dashboard Consolidado - Visão executiva de todas as avaliações
 */
export default function DashboardConsolidado() {
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // Últimos 3 meses por padrão
    return date.toISOString().split('T')[0];
  });
  
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Queries
  const { data: metricsData, isLoading: loadingMetrics } = trpc.consolidatedDashboard.getConsolidatedMetrics.useQuery({
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
  });

  const { data: departmentsData, isLoading: loadingDepartments } = trpc.consolidatedDashboard.getDepartmentAnalytics.useQuery({
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
  });

  const { data: competenciesData } = trpc.consolidatedDashboard.getCompetencyBreakdown.useQuery({
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
  });

  const { data: performersData } = trpc.consolidatedDashboard.getTopPerformers.useQuery({
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
    limit: 10,
  });

  const { data: trendData } = trpc.consolidatedDashboard.getTrendAnalytics.useQuery({
    trendType: "performance_evolution",
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
  });

  const exportReport = trpc.consolidatedDashboard.exportConsolidatedReport.useQuery({
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
    format: "json",
  }, { enabled: false });

  const handleExport = async () => {
    try {
      const result = await exportReport.refetch();
      if (result.data?.data) {
        const blob = new Blob([JSON.stringify(result.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-consolidado-${periodStart}-${periodEnd}.json`;
        a.click();
        toast.success("Relatório exportado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    }
  };

  const metrics = metricsData?.metrics;
  const departments = departmentsData?.departments || [];
  const competencies = competenciesData?.competencies || [];
  const performers = performersData?.performers || [];
  const trend = trendData?.trend;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Dashboard Consolidado
            </h1>
            <p className="text-gray-600 mt-1">Visão executiva de todas as avaliações e métricas</p>
          </div>
          <Button onClick={handleExport} disabled={exportReport.isFetching}>
            {exportReport.isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período Inicial</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Período Final</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Departamentos</SelectItem>
                    {safeMap(departments, dept => (
                      <SelectItem key={dept.departmentId} value={dept.departmentId.toString()}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        {loadingMetrics ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conclusão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{metrics?.completionRate}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics?.completedProcesses} de {metrics?.totalProcesses} processos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Média de Competências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{metrics?.avgCompetencyScore}</div>
                  <p className="text-xs text-gray-500 mt-1">Score médio geral</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Média PIR Integridade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{metrics?.avgPirScore}</div>
                  <p className="text-xs text-gray-500 mt-1">Score médio de integridade</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Gaps Críticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{metrics?.criticalGaps}</div>
                  <p className="text-xs text-gray-500 mt-1">Requerem atenção imediata</p>
                </CardContent>
              </Card>
            </div>

            {/* Análise por Departamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Análise por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDepartments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeMap(departments, dept => (
                      <div key={dept.departmentId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{dept.departmentName}</h3>
                          <Badge variant={dept.completionRate >= 80 ? "default" : dept.completionRate >= 50 ? "secondary" : "destructive"}>
                            {dept.completionRate}% conclusão
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Colaboradores</p>
                            <p className="font-semibold text-lg">{dept.totalEmployees}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Avaliações Concluídas</p>
                            <p className="font-semibold text-lg">{dept.completedAssessments}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Média Competências</p>
                            <p className="font-semibold text-lg">{dept.avgCompetencyScore}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">PDIs Ativos</p>
                            <p className="font-semibold text-lg">{dept.activePdisCount}</p>
                          </div>
                        </div>
                        {/* Barra de progresso */}
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${dept.completionRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competências com Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Competências com Maiores Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeMap(competencies.slice(0, 10), comp => (
                      <div key={comp.competencyId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{comp.competencyName}</p>
                          <p className="text-xs text-gray-500">{comp.competencyCategory}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={comp.avgScore < 50 ? "destructive" : comp.avgScore < 70 ? "secondary" : "default"}>
                            {comp.avgScore}
                          </Badge>
                          <span className="text-xs text-gray-500">({comp.assessmentCount} avaliações)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeMap(performers, (performer, idx) => (
                      <div key={performer.employeeId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.employeeName}</p>
                            <p className="text-xs text-gray-500">{performer.departmentName}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {performer.avgScore}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Evolução Temporal */}
            {trend && trend.timeSeriesData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Evolução de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant={trend.trend === "increasing" ? "default" : trend.trend === "decreasing" ? "destructive" : "secondary"}>
                        {trend.trend === "increasing" ? "Crescente" : trend.trend === "decreasing" ? "Decrescente" : "Estável"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Força da tendência: {trend.trendStrength}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {safeMap(trend.timeSeriesData, point => (
                        <div key={point.period} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-24">{point.period}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                              style={{ width: `${point.value}%` }}
                            >
                              <span className="text-xs text-white font-medium">{point.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
