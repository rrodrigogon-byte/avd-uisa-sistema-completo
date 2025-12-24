import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart3, Download, Save, Play } from "lucide-react";
import { generatePDF, generateExcel } from "@/lib/reportGenerators";

export default function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartType, setChartType] = useState("bar");
  const [filters, setFilters] = useState<any>({});
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);

  const { data: availableMetrics, isLoading: metricsLoading, error: metricsError } = trpc.reportBuilder.getAvailableMetrics.useQuery();
  const { data: savedReports } = trpc.reportBuilder.list.useQuery();
  const { data: departments } = trpc.reportBuilder.getDepartments.useQuery();
  const { data: positions } = trpc.reportBuilder.getPositions.useQuery();
  
  const executeReport = trpc.reportBuilder.execute.useQuery(
    { metrics: selectedMetrics, filters },
    { enabled: false }
  );

  const trackAction = trpc.reportAnalytics.track.useMutation();

  const createReport = trpc.reportBuilder.create.useMutation({
    onSuccess: () => {
      toast.success("Relatório salvo com sucesso!");
      setReportName("");
      setReportDescription("");
    },
    onError: () => {
      toast.error("Erro ao salvar relatório");
    },
  });

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((m) => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handlePreview = async () => {
    if (selectedMetrics.length === 0) {
      toast.error("Selecione pelo menos uma métrica");
      return;
    }

    const startTime = Date.now();
    const result = await executeReport.refetch();
    const executionTime = Date.now() - startTime;

    if (result.data) {
      setPreviewData(result.data);
      toast.success("Preview gerado!");

      // Registrar tracking
      trackAction.mutate({
        reportName: reportName || "Relatório sem nome",
        action: "view",
        metrics: selectedMetrics,
        filters,
        executionTimeMs: executionTime,
      });
    }
  };

  const handleSave = () => {
    if (!reportName) {
      toast.error("Digite um nome para o relatório");
      return;
    }

    if (selectedMetrics.length === 0) {
      toast.error("Selecione pelo menos uma métrica");
      return;
    }

    createReport.mutate({
      name: reportName,
      description: reportDescription,
      metrics: selectedMetrics,
      filters,
      chartType,
      isTemplate: false,
      isPublic: false,
    });
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!previewData) {
      toast.error("Gere um preview antes de exportar");
      return;
    }

    // Construir objeto de filtros
    const appliedFilters: any = {};
    if (filterDepartment && filterDepartment !== "all") appliedFilters.departmentId = parseInt(filterDepartment);
    if (filterPosition && filterPosition !== "all") appliedFilters.positionId = parseInt(filterPosition);
    if (filterStartDate) appliedFilters.startDate = filterStartDate;
    if (filterEndDate) appliedFilters.endDate = filterEndDate;
    setFilters(appliedFilters);

    try {
      const reportData = {
        name: reportName || "Relatório Customizado",
        description: reportDescription,
        metrics: selectedMetrics,
        data: previewData.data,
        generatedAt: previewData.summary.generatedAt,
        chartType: chartType,
      };

      const startTime = Date.now();
      
      if (format === "pdf") {
        await generatePDF(reportData, availableMetrics || []);
        toast.success("PDF gerado com sucesso!");
        
        // Registrar tracking
        trackAction.mutate({
          reportName: reportName || "Relatório Customizado",
          action: "export_pdf",
          metrics: selectedMetrics,
          filters: appliedFilters,
          executionTimeMs: Date.now() - startTime,
        });
      } else {
        await generateExcel(reportData, availableMetrics || []);
        toast.success("Excel gerado com sucesso!");
        
        // Registrar tracking
        trackAction.mutate({
          reportName: reportName || "Relatório Customizado",
          action: "export_excel",
          metrics: selectedMetrics,
          filters: appliedFilters,
          executionTimeMs: Date.now() - startTime,
        });
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error(`Erro ao gerar ${format.toUpperCase()}`);
    }
  };

  // Agrupar métricas por categoria
  const metricsByCategory = availableMetrics?.reduce((acc: any, metric: any) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Report Builder</h1>
            <p className="text-muted-foreground">
              Crie relatórios customizados selecionando métricas e filtros
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Relatório</CardTitle>
                <CardDescription>
                  Defina nome, métricas e filtros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Nome do Relatório</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Ex: Relatório Mensal de Performance"
                  />
                </div>

                <div>
                  <Label htmlFor="reportDescription">Descrição</Label>
                  <Input
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Descrição opcional"
                  />
                </div>

                <div>
                  <Label htmlFor="chartType">Tipo de Gráfico</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Barras</SelectItem>
                      <SelectItem value="line">Linhas</SelectItem>
                      <SelectItem value="pie">Pizza</SelectItem>
                      <SelectItem value="table">Tabela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtros Dinâmicos */}
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Filtros</h3>
                  
                  <div>
                    <Label htmlFor="filterDepartment">Departamento</Label>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger id="filterDepartment">
                        <SelectValue placeholder="Todos os departamentos" />
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

                  <div>
                    <Label htmlFor="filterPosition">Cargo</Label>
                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                      <SelectTrigger id="filterPosition">
                        <SelectValue placeholder="Todos os cargos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {positions?.map((pos: any) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="filterStartDate">Data Início</Label>
                      <Input
                        id="filterStartDate"
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="filterEndDate">Data Fim</Label>
                      <Input
                        id="filterEndDate"
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button onClick={handlePreview} className="w-full" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Visualizar Preview
                  </Button>
                  <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Métricas Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Disponíveis</CardTitle>
                <CardDescription>
                  Selecione as métricas para incluir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metricsLoading && <p className="text-sm text-muted-foreground">Carregando métricas...</p>}
                {metricsError && <p className="text-sm text-destructive">Erro ao carregar métricas</p>}
                {!metricsLoading && !availableMetrics && <p className="text-sm text-muted-foreground">Nenhuma métrica disponível</p>}
                {metricsByCategory &&
                  Object.entries(metricsByCategory).map(([category, metrics]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-semibold text-sm capitalize">{category}</h4>
                      {metrics.map((metric: any) => (
                        <div key={metric.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={metric.id}
                            checked={selectedMetrics.includes(metric.id)}
                            onChange={() => handleMetricToggle(metric.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <Label
                            htmlFor={metric.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {metric.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Painel de Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Preview do Relatório
                </CardTitle>
                <CardDescription>
                  Visualização em tempo real dos dados selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!previewData ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Selecione métricas e clique em "Visualizar Preview"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(previewData.data).map(([key, value]: [string, any]) => {
                        if (Array.isArray(value)) return null; // Skip arrays for now
                        return (
                          <Card key={key}>
                            <CardHeader className="pb-2">
                              <CardDescription className="text-xs capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">
                                {typeof value === "number" ? value.toFixed(2) : value}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {previewData.data.departmentBreakdown && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Distribuição por Departamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {previewData.data.departmentBreakdown.map((dept: any) => (
                              <div key={dept.departmentName} className="flex justify-between items-center">
                                <span className="text-sm">{dept.departmentName}</span>
                                <span className="font-semibold">{dept.count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Gerado em: {new Date(previewData.summary.generatedAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Relatórios Salvos */}
        {savedReports && savedReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Salvos</CardTitle>
              <CardDescription>
                Seus relatórios customizados salvos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedReports.map((report: any) => (
                  <Card key={report.id} className="cursor-pointer hover:border-primary">
                    <CardHeader>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      {report.description && (
                        <CardDescription className="text-xs">{report.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        {report.metrics.length} métricas
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
