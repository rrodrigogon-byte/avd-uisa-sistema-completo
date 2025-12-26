import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  RefreshCw,
  Building2,
  Users,
  Target,
  Shield,
  FileJson,
  FileSpreadsheet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

export default function ConsolidatedNpsReport() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("90");

  // Queries
  const { data: dashboardSummary, isLoading: loadingSummary } = trpc.consolidatedNpsReport.getDashboardSummary.useQuery(undefined);
  const { data: trends, isLoading: loadingTrends } = trpc.consolidatedNpsReport.getTrends.useQuery({ months: 6 });
  const { data: pirIntegrity, isLoading: loadingIntegrity } = trpc.consolidatedNpsReport.checkPirIntegrity.useQuery(undefined);
  
  // Mutations
  const exportCsv = trpc.consolidatedNpsReport.exportReport.useMutation({
    onSuccess: (data) => {
      if (data.format === "csv") {
        const blob = new Blob([data.content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Relatório CSV exportado com sucesso!");
      }
    },
    onError: () => toast.error("Erro ao exportar relatório"),
  });

  const exportJson = trpc.consolidatedNpsReport.exportReport.useMutation({
    onSuccess: (data) => {
      if (data.format === "json") {
        const blob = new Blob([data.content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Relatório JSON exportado com sucesso!");
      }
    },
    onError: () => toast.error("Erro ao exportar relatório"),
  });

  const handleExportCsv = () => {
    exportCsv.mutate({ format: "csv" });
  };

  const handleExportJson = () => {
    exportJson.mutate({ format: "json" });
  };

  const getNpsColor = (score: number) => {
    if (score >= 50) return "text-green-600";
    if (score >= 0) return "text-yellow-600";
    return "text-red-600";
  };

  const getNpsBadge = (score: number) => {
    if (score >= 50) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 0) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório Consolidado NPS + Avaliação</h1>
            <p className="text-gray-500 mt-1">
              Análise cruzada de NPS, performance e integridade do PIR
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportCsv}
              disabled={exportCsv.isPending}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportJson}
              disabled={exportJson.isPending}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingSummary ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : dashboardSummary ? (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Score NPS</p>
                      <p className={`text-3xl font-bold ${getNpsColor(dashboardSummary.npsScore)}`}>
                        {dashboardSummary.npsScore}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardSummary.npsResponses} respostas
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {getNpsBadge(dashboardSummary.npsScore)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Conclusão</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardSummary.completionRate}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardSummary.totalProcesses} processos
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <Progress value={dashboardSummary.completionRate} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Score Integridade PIR</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardSummary.avgIntegrityScore}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardSummary.pirAssessments} avaliações
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <Progress value={dashboardSummary.avgIntegrityScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Performance Média</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardSummary.avgPerformanceScore}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardSummary.performanceEvaluations} avaliações
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <Progress value={dashboardSummary.avgPerformanceScore} className="mt-3" />
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="integrity">Integridade PIR</TabsTrigger>
            <TabsTrigger value="alerts">Alertas de Risco</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências Temporais
                </CardTitle>
                <CardDescription>
                  Evolução dos indicadores nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTrends ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : trends && trends.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Mês</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">NPS</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Respostas</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Conclusão</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Processos</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Integridade</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Tendência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trends.map((trend, index) => (
                          <tr key={trend.month} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{trend.month}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={getNpsColor(trend.npsScore)}>
                                {trend.npsScore}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">{trend.npsResponses}</td>
                            <td className="py-3 px-4 text-center">{trend.completionRate}%</td>
                            <td className="py-3 px-4 text-center">{trend.totalProcesses}</td>
                            <td className="py-3 px-4 text-center">{trend.avgIntegrityScore}%</td>
                            <td className="py-3 px-4 text-center">
                              {index > 0 && getTrendIcon(trend.npsScore, trends[index - 1].npsScore)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum dado de tendência disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrity Tab */}
          <TabsContent value="integrity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status da Integridade PIR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingIntegrity ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : pirIntegrity ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Score de Integridade</span>
                        <span className={`text-2xl font-bold ${
                          pirIntegrity.integrityScore >= 80 ? "text-green-600" :
                          pirIntegrity.integrityScore >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {pirIntegrity.integrityScore}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600">Concluídas</p>
                          <p className="text-2xl font-bold text-green-700">
                            {pirIntegrity.summary.completedAssessments}
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-600">Pendentes</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {pirIntegrity.summary.pendingAssessments}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Cobertura por Dimensão</p>
                        {pirIntegrity.dimensionStatus.map((dim) => (
                          <div key={dim.dimension} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-8">{dim.dimension}</span>
                            <Progress value={dim.coverage} className="flex-1" />
                            <span className="text-sm text-gray-500 w-12 text-right">
                              {dim.coverage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Dados de integridade não disponíveis
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Problemas Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingIntegrity ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : pirIntegrity?.issues && pirIntegrity.issues.length > 0 ? (
                    <div className="space-y-3">
                      {pirIntegrity.issues.map((issue, index) => (
                        <Alert 
                          key={index}
                          variant={issue.severity === "high" ? "destructive" : "default"}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="capitalize">{issue.severity}</AlertTitle>
                          <AlertDescription>{issue.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                      <p className="text-green-600 font-medium">Nenhum problema identificado</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Os dados do PIR estão íntegros
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas de Risco
                </CardTitle>
                <CardDescription>
                  Indicadores que requerem atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardSummary && dashboardSummary.npsScore < 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>NPS Negativo</AlertTitle>
                      <AlertDescription>
                        O score NPS está em {dashboardSummary.npsScore}. Isso indica que há mais 
                        detratores do que promotores. Recomenda-se investigar as causas de insatisfação.
                      </AlertDescription>
                    </Alert>
                  )}

                  {dashboardSummary && dashboardSummary.completionRate < 50 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Taxa de Conclusão Baixa</AlertTitle>
                      <AlertDescription>
                        Apenas {dashboardSummary.completionRate}% dos processos foram concluídos. 
                        Considere enviar lembretes ou simplificar o processo.
                      </AlertDescription>
                    </Alert>
                  )}

                  {pirIntegrity && pirIntegrity.integrityScore < 50 && (
                    <Alert variant="destructive">
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Integridade PIR Comprometida</AlertTitle>
                      <AlertDescription>
                        O score de integridade do PIR está em {pirIntegrity.integrityScore}%. 
                        Verifique os dados faltantes e questões sem resposta.
                      </AlertDescription>
                    </Alert>
                  )}

                  {(!dashboardSummary || (dashboardSummary.npsScore >= 0 && dashboardSummary.completionRate >= 50)) && 
                   (!pirIntegrity || pirIntegrity.integrityScore >= 50) && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                      <p className="text-green-600 font-medium">Nenhum alerta crítico</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Todos os indicadores estão dentro dos parâmetros esperados
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
