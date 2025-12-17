import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  Target,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Meh
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ConsolidatedNpsReport() {
  const [period, setPeriod] = useState("90");

  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(period));
    return date;
  }, [period]);

  const { data: report, isLoading, refetch } = trpc.consolidatedNpsReport.generateReport.useQuery({
    startDate,
    endDate: new Date(),
  });

  const { data: summary } = trpc.consolidatedNpsReport.getDashboardSummary.useQuery();
  const { data: pirIntegrity } = trpc.consolidatedNpsReport.checkPirIntegrity.useQuery();
  const { data: trends } = trpc.consolidatedNpsReport.getTrends.useQuery({ months: 6 });

  const exportReport = trpc.consolidatedNpsReport.exportReport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: data.format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso!");
    },
    onError: () => toast.error("Erro ao exportar relatório"),
  });

  const getNpsColor = (score: number) => {
    if (score >= 50) return "text-green-500";
    if (score >= 0) return "text-yellow-500";
    return "text-red-500";
  };

  const getNpsBadge = (score: number) => {
    if (score >= 50) return <Badge className="bg-green-500">Excelente</Badge>;
    if (score >= 0) return <Badge className="bg-yellow-500">Bom</Badge>;
    return <Badge className="bg-red-500">Precisa Melhorar</Badge>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatório Consolidado</h1>
            <p className="text-muted-foreground">
              Cruzamento de dados NPS, Avaliação de Desempenho e Integridade PIR
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportReport.mutate({ format: "csv" })}
              disabled={exportReport.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score NPS</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getNpsColor(summary.npsScore)}`}>
                  {summary.npsScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.npsResponses} respostas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalProcesses} processos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Integridade</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgIntegrityScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.pirAssessments} avaliações PIR
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgPerformanceScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.performanceEvaluations} avaliações
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="nps" className="space-y-4">
          <TabsList>
            <TabsTrigger value="nps">Análise NPS</TabsTrigger>
            <TabsTrigger value="correlation">Correlação Performance</TabsTrigger>
            <TabsTrigger value="pir">Integridade PIR</TabsTrigger>
            <TabsTrigger value="departments">Por Departamento</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* NPS Analysis Tab */}
          <TabsContent value="nps" className="space-y-4">
            {report?.npsAnalysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        Promotores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">
                        {report.npsAnalysis.promoterPercent}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.npsAnalysis.promoters} de {report.npsAnalysis.totalResponses}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Meh className="h-4 w-4 text-yellow-500" />
                        Neutros
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-500">
                        {report.npsAnalysis.passivePercent}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.npsAnalysis.passives} de {report.npsAnalysis.totalResponses}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        Detratores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-500">
                        {report.npsAnalysis.detractorPercent}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.npsAnalysis.detractors} de {report.npsAnalysis.totalResponses}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Score NPS</CardTitle>
                    <CardDescription>
                      Calculado como % Promotores - % Detratores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className={`text-5xl font-bold ${getNpsColor(report.npsAnalysis.npsScore)}`}>
                        {report.npsAnalysis.npsScore}
                      </div>
                      {getNpsBadge(report.npsAnalysis.npsScore)}
                    </div>
                    <div className="mt-4 h-4 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${report.npsAnalysis.promoterPercent}%` }}
                      />
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${report.npsAnalysis.passivePercent}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${report.npsAnalysis.detractorPercent}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {report.npsAnalysis.topComments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Comentários Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {report.npsAnalysis.topComments.map((c, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            {c.category === "promoter" && <ThumbsUp className="h-5 w-5 text-green-500 mt-0.5" />}
                            {c.category === "passive" && <Meh className="h-5 w-5 text-yellow-500 mt-0.5" />}
                            {c.category === "detractor" && <ThumbsDown className="h-5 w-5 text-red-500 mt-0.5" />}
                            <div className="flex-1">
                              <p className="text-sm">{c.comment}</p>
                              <p className="text-xs text-muted-foreground mt-1">Nota: {c.score}/10</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Correlation Tab */}
          <TabsContent value="correlation" className="space-y-4">
            {report?.performanceCorrelation && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>NPS por Nível de Performance</CardTitle>
                    <CardDescription>
                      Comparação do NPS entre funcionários de diferentes níveis de performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Alta Performance</div>
                        <div className={`text-3xl font-bold ${getNpsColor(report.performanceCorrelation.highPerformersNps)}`}>
                          {report.performanceCorrelation.highPerformersNps}
                        </div>
                        <div className="text-xs text-muted-foreground">Score NPS</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Média Performance</div>
                        <div className={`text-3xl font-bold ${getNpsColor(report.performanceCorrelation.mediumPerformersNps)}`}>
                          {report.performanceCorrelation.mediumPerformersNps}
                        </div>
                        <div className="text-xs text-muted-foreground">Score NPS</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Baixa Performance</div>
                        <div className={`text-3xl font-bold ${getNpsColor(report.performanceCorrelation.lowPerformersNps)}`}>
                          {report.performanceCorrelation.lowPerformersNps}
                        </div>
                        <div className="text-xs text-muted-foreground">Score NPS</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Insight</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{report.performanceCorrelation.insight}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm">Coeficiente de Correlação:</span>
                      <Badge variant="outline">
                        {report.performanceCorrelation.correlationCoefficient}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* PIR Integrity Tab */}
          <TabsContent value="pir" className="space-y-4">
            {pirIntegrity && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Avaliações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{pirIntegrity.summary.totalAssessments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Concluídas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">
                        {pirIntegrity.summary.completedAssessments}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-500">
                        {pirIntegrity.summary.pendingAssessments}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Score Integridade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${pirIntegrity.integrityScore >= 80 ? 'text-green-500' : pirIntegrity.integrityScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {pirIntegrity.integrityScore}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Status por Dimensão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pirIntegrity.dimensionStatus.map((ds) => (
                        <div key={ds.dimension} className="flex items-center gap-4">
                          <div className="w-8 font-mono text-sm">{ds.dimension}</div>
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${ds.coverage >= 80 ? 'bg-green-500' : ds.coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${ds.coverage}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm">{ds.coverage}%</div>
                          <div className="w-24 text-right text-xs text-muted-foreground">
                            {ds.answeredQuestions}/{ds.totalQuestions} questões
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {pirIntegrity.issues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Problemas Identificados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pirIntegrity.issues.map((issue, i) => (
                          <div 
                            key={i} 
                            className={`p-3 rounded-lg flex items-start gap-3 ${
                              issue.severity === 'high' ? 'bg-red-50 dark:bg-red-950' :
                              issue.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950' :
                              'bg-blue-50 dark:bg-blue-950'
                            }`}
                          >
                            <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                              issue.severity === 'high' ? 'text-red-500' :
                              issue.severity === 'medium' ? 'text-yellow-500' :
                              'text-blue-500'
                            }`} />
                            <div>
                              <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                                {issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                              <p className="mt-1 text-sm">{issue.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-4">
            {report?.departmentBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Métricas por Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Departamento</th>
                          <th className="text-center py-3 px-2">Processos</th>
                          <th className="text-center py-3 px-2">Conclusão</th>
                          <th className="text-center py-3 px-2">NPS</th>
                          <th className="text-center py-3 px-2">Performance</th>
                          <th className="text-center py-3 px-2">Integridade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.departmentBreakdown.map((dept) => (
                          <tr key={dept.departmentId} className="border-b">
                            <td className="py-3 px-2 font-medium">{dept.departmentName}</td>
                            <td className="text-center py-3 px-2">{dept.processCount}</td>
                            <td className="text-center py-3 px-2">
                              <Badge variant={dept.completionRate >= 80 ? 'default' : 'secondary'}>
                                {dept.completionRate}%
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={getNpsColor(dept.avgNpsScore * 10)}>
                                {dept.avgNpsScore}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">{dept.avgPerformanceScore}%</td>
                            <td className="text-center py-3 px-2">{dept.avgIntegrityScore}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {report?.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle>Recomendações</CardTitle>
                  <CardDescription>
                    Sugestões baseadas na análise dos dados consolidados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg">
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Trends */}
        {trends && trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tendências (Últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Mês</th>
                      <th className="text-center py-3 px-2">NPS</th>
                      <th className="text-center py-3 px-2">Respostas</th>
                      <th className="text-center py-3 px-2">Conclusão</th>
                      <th className="text-center py-3 px-2">Processos</th>
                      <th className="text-center py-3 px-2">Integridade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, i) => {
                      const prevNps = i > 0 ? trends[i - 1].npsScore : t.npsScore;
                      const npsChange = t.npsScore - prevNps;
                      
                      return (
                        <tr key={t.month} className="border-b">
                          <td className="py-3 px-2 font-medium">{t.month}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className={getNpsColor(t.npsScore)}>{t.npsScore}</span>
                              {npsChange > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {npsChange < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                              {npsChange === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">{t.npsResponses}</td>
                          <td className="text-center py-3 px-2">{t.completionRate}%</td>
                          <td className="text-center py-3 px-2">{t.totalProcesses}</td>
                          <td className="text-center py-3 px-2">{t.avgIntegrityScore}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
