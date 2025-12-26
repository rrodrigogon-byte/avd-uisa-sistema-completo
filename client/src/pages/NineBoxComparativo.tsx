import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, Award, Download, Filter, FileDown, Star, Save, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { exportToPDF, generateSectionHTML, generateTableHTML, generateInfoGridHTML, generateBadgeHTML } from "@/lib/pdfExport";
import { Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

/**
 * Página de Nine Box Comparativo por Função/Cargo
 * Permite comparar distribuição Nine Box entre diferentes cargos
 */

export default function NineBoxComparativo() {
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [hierarchyLevel, setHierarchyLevel] = useState<string>("all");
  const [selectedLeaderId, setSelectedLeaderId] = useState<number | null>(null);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [selectedCostCenterIds, setSelectedCostCenterIds] = useState<number[]>([]);
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [potentialFilter, setPotentialFilter] = useState<string>("all");
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nineBoxFavoriteFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Salvar filtro favorito
  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error("Digite um nome para o filtro");
      return;
    }

    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: {
        hierarchyLevel,
        selectedLeaderId,
        selectedDepartmentIds,
        selectedCostCenterIds,
        performanceFilter,
        potentialFilter,
        selectedPositions,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('nineBoxFavoriteFilters', JSON.stringify(updated));
    setShowSaveDialog(false);
    setFilterName("");
    toast.success("Filtro salvo com sucesso!");
  };

  // Carregar filtro favorito
  const loadFilter = (filter: any) => {
    setHierarchyLevel(filter.filters.hierarchyLevel);
    setSelectedLeaderId(filter.filters.selectedLeaderId);
    setSelectedDepartmentIds(filter.filters.selectedDepartmentIds);
    setSelectedCostCenterIds(filter.filters.selectedCostCenterIds);
    setPerformanceFilter(filter.filters.performanceFilter);
    setPotentialFilter(filter.filters.potentialFilter);
    setSelectedPositions(filter.filters.selectedPositions);
    toast.success(`Filtro "${filter.name}" aplicado!`);
  };

  // Deletar filtro favorito
  const deleteFilter = (filterId: number) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('nineBoxFavoriteFilters', JSON.stringify(updated));
    toast.success("Filtro removido!");
  };

  // Queries
  const { data: positions, isLoading: loadingPositions } = trpc.nineBoxComparative.getAvailablePositions.useQuery({});
  const { data: leaders } = trpc.nineBoxComparative.getLeaders.useQuery({});
  const { data: departments } = trpc.employees.getDepartments.useQuery({});
  const { data: costCenters } = trpc.employees.getCostCenters.useQuery({});
  const { data: comparative, isLoading: loadingComparative } = trpc.nineBoxComparative.getComparative.useQuery(
    { 
      positionIds: selectedPositions.length > 0 ? selectedPositions : undefined,
      leaderId: selectedLeaderId || undefined,
      hierarchyLevel: hierarchyLevel as "all" | "diretoria" | "gerencia" | "coordenacao" | "supervisao" | "outros",
      departmentIds: selectedDepartmentIds.length > 0 ? selectedDepartmentIds : undefined,
      costCenterIds: selectedCostCenterIds.length > 0 ? selectedCostCenterIds : undefined,
      performanceFilter: performanceFilter !== "all" ? performanceFilter as "baixa" | "media" | "alta" : undefined,
      potentialFilter: potentialFilter !== "all" ? potentialFilter as "baixo" | "medio" | "alto" : undefined,
    },
    { enabled: true }
  );

  const togglePosition = (positionId: number) => {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    );
  };

  const selectAll = () => {
    if (positions) {
      setSelectedPositions(positions.map((p: any) => p.id));
    }
  };

  const clearAll = () => {
    setSelectedPositions([]);
  };

  const handleExportPDF = async () => {
    if (!comparative || comparative.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    // Calcular totais
    const totalEmployees = comparative.reduce((sum, c) => sum + c.totalEmployees, 0);
    const avgPerformance = (
      comparative.reduce((sum, c) => sum + c.avgPerformance * c.totalEmployees, 0) /
      totalEmployees
    ).toFixed(2);
    const avgPotential = (
      comparative.reduce((sum, c) => sum + c.avgPotential * c.totalEmployees, 0) /
      totalEmployees
    ).toFixed(2);
    const totalStars = comparative.reduce((sum, c) => sum + c.starsCount, 0);

    // Gerar conteúdo HTML
    const content = `
      ${generateSectionHTML(
        "Resumo Geral",
        generateInfoGridHTML([
          { label: "Total de Colaboradores", value: totalEmployees.toString() },
          { label: "Média de Performance", value: avgPerformance },
          { label: "Média de Potencial", value: avgPotential },
          { label: "Total de Stars", value: totalStars.toString() },
        ])
      )}

      ${generateSectionHTML(
        "Análise Detalhada por Cargo",
        generateTableHTML(
          ["Cargo", "Colaboradores", "Perf Média", "Pot Médio", "Alto Desemp.", "Alto Pot.", "Stars"],
          comparative.map((c: any) => [
            c.positionTitle,
            c.totalEmployees.toString(),
            c.avgPerformance.toFixed(2),
            c.avgPotential.toFixed(2),
            `${c.highPerformersPercent.toFixed(1)}%`,
            `${c.highPotentialPercent.toFixed(1)}%`,
            `${c.starsPercent.toFixed(1)}% (${c.starsCount})`,
          ])
        )
      )}

      ${generateSectionHTML(
        "Distribuição Nine Box por Cargo",
        comparative
          .map(
            (c) => `
          <div class="card">
            <div class="card-title">${c.positionTitle}</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Alto Desempenho</div>
                <div class="info-value">${c.highPerformersPercent.toFixed(1)}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Alto Potencial</div>
                <div class="info-value">${c.highPotentialPercent.toFixed(1)}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Stars</div>
                <div class="info-value">${c.starsPercent.toFixed(1)}% (${c.starsCount})</div>
              </div>
              <div class="info-item">
                <div class="info-label">Enigmas</div>
                <div class="info-value">${c.highPotentialPercent.toFixed(1)}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Solid Performers</div>
                <div class="info-value">${c.highPerformersPercent.toFixed(1)}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Dilemas</div>
                <div class="info-value">${c.starsPercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        `
          )
          .join("")
      )}
    `;

    try {
      await exportToPDF({
        title: "Nine Box Comparativo",
        subtitle: "Distribuição de Talentos por Cargo",
        content,
        filename: `nine-box-comparativo-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: "landscape",
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  // Preparar dados para gráfico de barras (Performance e Potencial médios)
  const barChartData = {
    labels: comparative?.map((c: any) => c.positionTitle) || [],
    datasets: [
      {
        label: "Performance Média",
        data: comparative?.map((c: any) => c.avgPerformance) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "Potencial Médio",
        data: comparative?.map((c: any) => c.avgPotential) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Performance e Potencial Médios por Cargo",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 3,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Preparar dados para gráfico radar (% Alto Desempenho, % Alto Potencial, % Stars)
  const radarChartData = {
    labels: comparative?.map((c: any) => c.positionTitle) || [],
    datasets: [
      {
        label: "% Alto Desempenho",
        data: comparative?.map((c: any) => c.highPerformersPercent) || [],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
      {
        label: "% Alto Potencial",
        data: comparative?.map((c: any) => c.highPotentialPercent) || [],
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
      },
      {
        label: "% Stars (Alto/Alto)",
        data: comparative?.map((c: any) => c.starsPercent) || [],
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderColor: "rgb(245, 158, 11)",
        borderWidth: 2,
      },
    ],
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Comparação de Talentos por Cargo (%)",
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  if (loadingPositions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nine Box Comparativo</h1>
            <p className="text-muted-foreground mt-1">
              Compare distribuição de talentos entre diferentes funções e cargos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => handleExportPDF()}
              disabled={!comparative || comparative.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (!comparative || comparative.length === 0) {
                  toast.error("Nenhum dado para exportar");
                return;
              }
              // Criar CSV
              const headers = ["Cargo", "Colaboradores", "Performance Média", "Potencial Médio", "% Alto Desempenho", "% Alto Potencial", "% Stars"];
              const rows = comparative.map(c => [
                c.positionTitle,
                c.totalEmployees,
                c.avgPerformance.toFixed(2),
                c.avgPotential.toFixed(2),
                c.highPerformersPercent.toFixed(1) + "%",
                c.highPotentialPercent.toFixed(1) + "%",
                c.starsPercent.toFixed(1) + "%"
              ]);
              const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `nine-box-comparativo-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              toast.success("Relatório exportado com sucesso!");
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          </div>
        </div>

        {/* Filtros Hierárquicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Hierárquicos
            </CardTitle>
            <CardDescription>
              Filtre a análise por nível hierárquico ou líder específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Filtro por Nível Hierárquico */}
              <div className="space-y-2">
                <Label>Nível Hierárquico</Label>
                <Select value={hierarchyLevel} onValueChange={setHierarchyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="diretoria">Diretoria</SelectItem>
                    <SelectItem value="gerencia">Gerência</SelectItem>
                    <SelectItem value="coordenacao">Coordenação</SelectItem>
                    <SelectItem value="supervisao">Supervisão</SelectItem>
                    <SelectItem value="outros">Outros (sem subordinados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Líder */}
              <div className="space-y-2">
                <Label>Filtrar por Líder</Label>
                <Select 
                  value={selectedLeaderId?.toString() || "todos"} 
                  onValueChange={(value) => setSelectedLeaderId(value === "todos" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os colaboradores</SelectItem>
                    {leaders?.filter(l => l?.id).map((leader: any) => (
                      <SelectItem key={leader.id} value={leader.id.toString()}>
                        {leader.name} - {leader.positionTitle} ({leader.subordinatesCount} subordinados)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Departamento */}
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select 
                  value={selectedDepartmentIds.length === 1 ? selectedDepartmentIds[0].toString() : "todos"}
                  onValueChange={(value) => {
                    if (value === "todos") {
                      setSelectedDepartmentIds([]);
                    } else {
                      setSelectedDepartmentIds([parseInt(value)]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os departamentos</SelectItem>
                    {departments?.filter((d: any) => d?.id).map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Centro de Custo */}
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select 
                  value={selectedCostCenterIds.length === 1 ? selectedCostCenterIds[0].toString() : "todos"}
                  onValueChange={(value) => {
                    if (value === "todos") {
                      setSelectedCostCenterIds([]);
                    } else {
                      setSelectedCostCenterIds([parseInt(value)]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os centros</SelectItem>
                    {costCenters?.filter((c: any) => c?.id).map((cc: any) => (
                      <SelectItem key={cc.id} value={cc.id.toString()}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Performance */}
              <div className="space-y-2">
                <Label>Performance</Label>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="baixa">Baixa (1)</SelectItem>
                    <SelectItem value="media">Média (2)</SelectItem>
                    <SelectItem value="alta">Alta (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Potencial */}
              <div className="space-y-2">
                <Label>Potencial</Label>
                <Select value={potentialFilter} onValueChange={setPotentialFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="baixo">Baixo (1)</SelectItem>
                    <SelectItem value="medio">Médio (2)</SelectItem>
                    <SelectItem value="alto">Alto (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões de Ação de Filtros */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Filtro Atual
              </Button>
              
              {savedFilters.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {savedFilters.map((filter: any) => (
                    <div key={filter.id} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadFilter(filter)}
                        className="h-auto p-1 hover:bg-blue-100"
                      >
                        <Star className="h-3 w-3 mr-1 text-blue-600" />
                        <span className="text-xs text-blue-900">{filter.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFilter(filter.id)}
                        className="h-auto p-1 hover:bg-red-100"
                      >
                        <Trash className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seletor de Cargos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Selecione os Cargos para Comparar</CardTitle>
                <CardDescription>
                  Escolha um ou mais cargos para visualizar a análise comparativa
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {positions?.map((position: any) => (
                <div
                  key={position.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPositions.includes(position.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => togglePosition(position.id)}
                >
                  <p className="font-medium text-sm">{position.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {position.employeeCount} colaboradores
                  </p>
                </div>
              ))}
            </div>

            {(!positions || positions.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cargo com colaboradores encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados da Comparação */}
        {loadingComparative ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comparative && comparative.length > 0 ? (
          <>
            {/* KPIs Resumidos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Colaboradores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {comparative.reduce((sum, c) => sum + c.totalEmployees, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Média de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      comparative.reduce((sum, c) => sum + c.avgPerformance * c.totalEmployees, 0) /
                      comparative.reduce((sum, c) => sum + c.totalEmployees, 0)
                    ).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Média de Potencial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      comparative.reduce((sum, c) => sum + c.avgPotential * c.totalEmployees, 0) /
                      comparative.reduce((sum, c) => sum + c.totalEmployees, 0)
                    ).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Stars
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {comparative.reduce((sum, c) => sum + c.starsCount, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance e Potencial por Cargo</CardTitle>
                  <CardDescription>Valores médios em escala de 1 a 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Talentos</CardTitle>
                  <CardDescription>Percentual de colaboradores em cada categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Radar data={radarChartData} options={radarChartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada por Cargo</CardTitle>
                <CardDescription>Métricas completas de cada função</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Cargo</th>
                        <th className="text-center py-3 px-4 font-medium">Total</th>
                        <th className="text-center py-3 px-4 font-medium">Perf Média</th>
                        <th className="text-center py-3 px-4 font-medium">Pot Médio</th>
                        <th className="text-center py-3 px-4 font-medium">Alto Desemp.</th>
                        <th className="text-center py-3 px-4 font-medium">Alto Potencial</th>
                        <th className="text-center py-3 px-4 font-medium">Stars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparative.map((item: any) => (
                        <tr key={item.positionTitle} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{item.positionTitle}</td>
                          <td className="text-center py-3 px-4">{item.totalEmployees}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{item.avgPerformance}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{item.avgPotential}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{item.highPerformersCount}</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.highPerformersPercent}%
                              </Badge>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{item.highPotentialCount}</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.highPotentialPercent}%
                              </Badge>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <Award className="h-4 w-4 text-amber-600" />
                              <span className="font-semibold text-amber-600">{item.starsCount}</span>
                              <Badge variant="outline" className="text-xs border-amber-600 text-amber-600">
                                {item.starsPercent}%
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-24">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecione cargos acima para visualizar a análise comparativa</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para Salvar Filtro */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro Favorito</DialogTitle>
            <DialogDescription>
              Dê um nome para este conjunto de filtros para facilitar o acesso futuro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Filtro</Label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ex: Gerência - Alto Desempenho"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveCurrentFilter();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCurrentFilter} className="bg-[#F39200] hover:bg-[#D68200]">
              <Save className="h-4 w-4 mr-2" />
              Salvar Filtro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
