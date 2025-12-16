import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Clock,
  Users,
  Download,
  RefreshCw,
  Eye,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Cores para gráficos
const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function ConfrontoAtividades() {
  const { user } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Mock employeeId - em produção viria do contexto de autenticação
  const employeeId = selectedEmployeeId || user?.id || 1;

  // Queries
  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: jobDescriptions } = trpc.jobDescriptions.list.useQuery({});

  const { data: activitySummary } = trpc.activityMapping.getDesktopActivitySummary.useQuery(
    {
      employeeId,
      startDate: periodStart,
      endDate: periodEnd,
    },
    { enabled: !!employeeId }
  );

  const { data: routines } = trpc.activityMapping.listRoutines.useQuery(
    {
      employeeId,
      includeInactive: false,
    },
    { enabled: !!employeeId }
  );

  const { data: matchReports, refetch: refetchReports } = trpc.activityMapping.listMatchReports.useQuery({
    employeeId,
    jobDescriptionId: selectedJobDescriptionId || undefined,
    limit: 20,
  });

  // Mutations
  const generateReportMutation = trpc.activityMapping.generateMatchReport.useMutation({
    onSuccess: (data) => {
      toast.success(`Relatório gerado! Aderência: ${data.summary.adherencePercentage}%`);
      refetchReports();
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    },
  });

  const handleGenerateReport = () => {
    if (!selectedJobDescriptionId) {
      toast.error("Selecione uma descrição de cargo");
      return;
    }

    generateReportMutation.mutate({
      employeeId,
      jobDescriptionId: selectedJobDescriptionId,
      periodStart,
      periodEnd,
    });
  };

  // Dados para gráficos
  const categoryData = activitySummary?.byCategory
    ? Object.entries(activitySummary.byCategory).map(([name, data]: [string, any]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(data.totalSeconds / 60),
        count: data.count,
      }))
    : [];

  const applicationData = activitySummary?.byApplication
    ? Object.entries(activitySummary.byApplication)
        .map(([name, data]: [string, any]) => ({
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          minutos: Math.round(data.totalSeconds / 60),
          count: data.count,
        }))
        .sort((a, b) => b.minutos - a.minutos)
        .slice(0, 10)
    : [];

  // Calcular métricas de aderência
  const linkedRoutines = routines?.filter((r) => r.isLinkedToJobDescription) || [];
  const unlinkedRoutines = routines?.filter((r) => !r.isLinkedToJobDescription) || [];
  const adherenceRate = routines?.length
    ? Math.round((linkedRoutines.length / routines.length) * 100)
    : 0;

  // Último relatório
  const latestReport = matchReports?.[0];

  const viewReportDetails = (report: any) => {
    setSelectedReport(report);
    setDetailsDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Confronto de Atividades</h1>
            <p className="text-muted-foreground">
              Compare atividades realizadas com a descrição de cargo e identifique gaps
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label>Funcionário</Label>
                <Select
                  value={selectedEmployeeId?.toString() || ""}
                  onValueChange={(val) => setSelectedEmployeeId(val ? Number(val) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição de Cargo</Label>
                <Select
                  value={selectedJobDescriptionId?.toString() || ""}
                  onValueChange={(val) => setSelectedJobDescriptionId(val ? Number(val) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions?.map((jd: any) => (
                      <SelectItem key={jd.id} value={jd.id.toString()}>
                        {jd.positionTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending || !selectedJobDescriptionId}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Análise
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Aderência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{adherenceRate}%</div>
              <Progress value={adherenceRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activitySummary?.totalActivities || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horas Registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {activitySummary?.totalSeconds
                  ? (activitySummary.totalSeconds / 3600).toFixed(1)
                  : 0}
                h
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{linkedRoutines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Não Vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{unlinkedRoutines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Rotinas Mapeadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{routines?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Último Relatório */}
        {latestReport && (
          <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Último Relatório de Confronto</CardTitle>
                  <CardDescription>
                    Período: {new Date(latestReport.periodStart).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(latestReport.periodEnd).toLocaleDateString("pt-BR")}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => viewReportDetails(latestReport)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {latestReport.adherencePercentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Aderência</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {latestReport.coveragePercentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Cobertura</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-600">
                    {latestReport.activitiesNotInJob}
                  </div>
                  <div className="text-sm text-muted-foreground">Atividades Extras</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">
                    {latestReport.responsibilitiesNotExecuted}
                  </div>
                  <div className="text-sm text-muted-foreground">Resp. Não Executadas</div>
                </div>
              </div>
              {latestReport.executiveSummary && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-line">{latestReport.executiveSummary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="distribution" className="space-y-4">
          <TabsList>
            <TabsTrigger value="distribution">Distribuição de Atividades</TabsTrigger>
            <TabsTrigger value="applications">Aplicativos Utilizados</TabsTrigger>
            <TabsTrigger value="gaps">Análise de Gaps</TabsTrigger>
            <TabsTrigger value="history">Histórico de Relatórios</TabsTrigger>
          </TabsList>

          {/* Tab: Distribuição */}
          <TabsContent value="distribution">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} min`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tempo por Categoria (minutos)</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${value} min`} />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Aplicativos */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Aplicativos por Tempo de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={applicationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Legend />
                      <Bar dataKey="minutos" fill="#8b5cf6" name="Minutos" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado de aplicativos disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gaps */}
          <TabsContent value="gaps">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Atividades Não Vinculadas ao Cargo
                  </CardTitle>
                  <CardDescription>
                    Rotinas que você realiza mas não estão na descrição de cargo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {unlinkedRoutines.length > 0 ? (
                    <div className="space-y-3">
                      {unlinkedRoutines.map((routine: any) => (
                        <div
                          key={routine.id}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                        >
                          <div>
                            <div className="font-medium">{routine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {routine.frequency} • {routine.estimatedMinutes} min
                            </div>
                          </div>
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Gap
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      Todas as rotinas estão vinculadas ao cargo
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    Sugestões de Ajuste
                  </CardTitle>
                  <CardDescription>
                    Recomendações baseadas na análise de confronto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unlinkedRoutines.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Atualizar Descrição de Cargo</div>
                          <div className="text-sm text-muted-foreground">
                            Considere adicionar {unlinkedRoutines.length} atividade(s) à descrição
                            de cargo
                          </div>
                        </div>
                      </div>
                    )}
                    {adherenceRate < 80 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Revisar Alocação de Tempo</div>
                          <div className="text-sm text-muted-foreground">
                            Aderência abaixo de 80% pode indicar desvio de função
                          </div>
                        </div>
                      </div>
                    )}
                    {adherenceRate >= 80 && unlinkedRoutines.length === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Excelente Aderência</div>
                          <div className="text-sm text-muted-foreground">
                            As atividades estão bem alinhadas com a descrição de cargo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Relatórios de Confronto</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Aderência</TableHead>
                      <TableHead>Cobertura</TableHead>
                      <TableHead>Atividades Extras</TableHead>
                      <TableHead>Resp. Não Exec.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchReports?.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {new Date(report.periodStart).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(report.periodEnd).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.adherencePercentage >= 80 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            {report.adherencePercentage}%
                          </div>
                        </TableCell>
                        <TableCell>{report.coveragePercentage}%</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.activitiesNotInJob}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.responsibilitiesNotExecuted}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              report.status === "reviewed"
                                ? "bg-green-500"
                                : report.status === "completed"
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                            }
                          >
                            {report.status === "reviewed"
                              ? "Revisado"
                              : report.status === "completed"
                              ? "Concluído"
                              : "Processando"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewReportDetails(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!matchReports || matchReports.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum relatório gerado ainda. Clique em "Gerar Análise" para criar um.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Detalhes do Relatório */}
        <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Relatório de Confronto</DialogTitle>
              <DialogDescription>
                {selectedReport && (
                  <>
                    Período: {new Date(selectedReport.periodStart).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(selectedReport.periodEnd).toLocaleDateString("pt-BR")}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-6">
                {/* Métricas */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {selectedReport.adherencePercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Aderência</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedReport.coveragePercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Cobertura</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-3xl font-bold text-amber-600">
                      {selectedReport.activitiesNotInJob}
                    </div>
                    <div className="text-sm text-muted-foreground">Atividades Extras</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {selectedReport.responsibilitiesNotExecuted}
                    </div>
                    <div className="text-sm text-muted-foreground">Resp. Não Executadas</div>
                  </div>
                </div>

                {/* Resumo Executivo */}
                {selectedReport.executiveSummary && (
                  <div>
                    <h4 className="font-semibold mb-2">Resumo Executivo</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-line">{selectedReport.executiveSummary}</p>
                    </div>
                  </div>
                )}

                {/* Gaps Identificados */}
                {selectedReport.gapsIdentified && (
                  <div>
                    <h4 className="font-semibold mb-2">Gaps Identificados</h4>
                    <div className="space-y-2">
                      {JSON.parse(selectedReport.gapsIdentified).map((gap: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            gap.severity === "high"
                              ? "bg-red-50 border-red-200"
                              : gap.severity === "medium"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                gap.severity === "high"
                                  ? "text-red-600 border-red-600"
                                  : gap.severity === "medium"
                                  ? "text-amber-600 border-amber-600"
                                  : "text-blue-600 border-blue-600"
                              }
                            >
                              {gap.type === "responsibility_not_executed"
                                ? "Responsabilidade não executada"
                                : "Atividade fora do cargo"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm">{gap.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestões */}
                {selectedReport.suggestedAdjustments && (
                  <div>
                    <h4 className="font-semibold mb-2">Sugestões de Ajuste</h4>
                    <div className="space-y-2">
                      {JSON.parse(selectedReport.suggestedAdjustments).map(
                        (suggestion: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                              <div className="font-medium">
                                {suggestion.type === "add_responsibilities"
                                  ? "Adicionar Responsabilidades"
                                  : "Revisar Responsabilidades"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {suggestion.description}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                Prioridade: {suggestion.priority}
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
