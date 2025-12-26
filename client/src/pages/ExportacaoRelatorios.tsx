import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { FileDown, FileSpreadsheet, Loader2, Filter, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ExportacaoRelatorios() {
  const [filters, setFilters] = useState({
    employeeIds: [] as number[],
    departmentIds: [] as number[],
    startDate: "",
    endDate: "",
    testTypes: [] as string[],
  });

  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState<Set<number>>(new Set());
  const [selectedTestTypes, setSelectedTestTypes] = useState<Set<string>>(new Set());

  // Buscar dados
  const { data: employees } = trpc.employees.list.useQuery({});
  const { data: departments } = trpc.departments.list.useQuery({});

  const { data: exportData, isLoading } = trpc.performanceReports.getExportData.useQuery(
    {
      employeeIds: Array.from(selectedEmployees),
      departmentIds: Array.from(selectedDepartments),
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      testTypes: Array.from(selectedTestTypes),
    },
    { enabled: selectedEmployees.size > 0 || selectedDepartments.size > 0 }
  );

  const toggleEmployee = (id: number) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEmployees(newSet);
  };

  const toggleDepartment = (id: number) => {
    const newSet = new Set(selectedDepartments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDepartments(newSet);
  };

  const toggleTestType = (type: string) => {
    const newSet = new Set(selectedTestTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTestTypes(newSet);
  };

  // Preparar dados para gráfico de barras (por tipo de teste)
  const barChartData = exportData?.stats
    ? {
        labels: Object.keys(exportData.stats.byTestType),
        datasets: [
          {
            label: "Pontuação Média",
            data: Object.values(exportData.stats.byTestType).map((t: any) => t.avgScore),
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Preparar dados para gráfico de pizza (por departamento)
  const pieChartData = exportData?.stats
    ? {
        labels: Object.keys(exportData.stats.byDepartment),
        datasets: [
          {
            label: "Testes por Departamento",
            data: Object.values(exportData.stats.byDepartment).map((d: any) => d.count),
            backgroundColor: [
              "rgba(99, 102, 241, 0.8)",
              "rgba(244, 63, 94, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(251, 146, 60, 0.8)",
              "rgba(168, 85, 247, 0.8)",
              "rgba(14, 165, 233, 0.8)",
            ],
            borderColor: [
              "rgb(99, 102, 241)",
              "rgb(244, 63, 94)",
              "rgb(34, 197, 94)",
              "rgb(251, 146, 60)",
              "rgb(168, 85, 247)",
              "rgb(14, 165, 233)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
  };

  const handleExportExcel = () => {
    if (!exportData || exportData.results.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    try {
      // Preparar dados para Excel
      const excelData = exportData.results.map((r: any) => ({
        "Código Funcionário": r.employeeCode,
        "Nome Funcionário": r.employeeName,
        Departamento: r.departmentName || "N/A",
        Cargo: r.positionName || "N/A",
        "Tipo de Teste": r.testType,
        "Pontuação": r.score,
        "Data de Conclusão": new Date(r.completedAt).toLocaleDateString("pt-BR"),
        Interpretação: r.interpretation || "N/A",
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");

      // Adicionar sheet de estatísticas
      const statsData = [
        { Métrica: "Total de Testes", Valor: exportData.stats.totalTests },
        { Métrica: "Pontuação Média Geral", Valor: exportData.stats.averageScore.toFixed(2) },
        { Métrica: "", Valor: "" },
        { Métrica: "Por Tipo de Teste", Valor: "" },
        ...Object.entries(exportData.stats.byTestType).map(([type, data]: [string, any]) => ({
          Métrica: `  ${type}`,
          Valor: `${data.avgScore.toFixed(2)} (${data.count} testes)`,
        })),
        { Métrica: "", Valor: "" },
        { Métrica: "Por Departamento", Valor: "" },
        ...Object.entries(exportData.stats.byDepartment).map(([dept, data]: [string, any]) => ({
          Métrica: `  ${dept}`,
          Valor: `${data.avgScore.toFixed(2)} (${data.count} testes)`,
        })),
      ];

      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, "Estatísticas");

      // Salvar arquivo
      XLSX.writeFile(wb, `relatorio-desempenho-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const handleExportPDF = () => {
    toast.info("Exportação PDF em desenvolvimento");
    // TODO: Implementar exportação PDF com gráficos
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exportação de Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Exporte resultados filtrados com gráficos comparativos de desempenho
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Selecione os critérios para filtrar os dados do relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Tipos de Teste */}
            <div className="space-y-2">
              <Label>Tipos de Teste</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["disc", "mbti", "big5", "valores"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`test-${type}`}
                      checked={selectedTestTypes.has(type)}
                      onCheckedChange={() => toggleTestType(type)}
                    />
                    <label
                      htmlFor={`test-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.toUpperCase()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Departamentos */}
            <div className="space-y-2">
              <Label>Departamentos</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto p-2 border rounded-md">
                {departments?.map((dept: any) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept.id}`}
                      checked={selectedDepartments.has(dept.id)}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                    />
                    <label
                      htmlFor={`dept-${dept.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {dept.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Funcionários */}
            <div className="space-y-2">
              <Label>Funcionários</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
                {employees?.map((emp: any) => (
                  <div key={emp.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`emp-${emp.id}`}
                      checked={selectedEmployees.has(emp.id)}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                    />
                    <label
                      htmlFor={`emp-${emp.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {emp.name} ({emp.employeeCode})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {exportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Testes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{exportData.stats.totalTests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pontuação Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {exportData.stats.averageScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ações</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={handleExportExcel} className="flex-1" variant="default">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={handleExportPDF} className="flex-1" variant="outline">
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </CardContent>
          </Card>
        )}

        {!isLoading && selectedEmployees.size === 0 && selectedDepartments.size === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Selecione Funcionários ou Departamentos
              </h3>
              <p className="text-gray-500">
                Escolha pelo menos um funcionário ou departamento para visualizar os dados
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && exportData && exportData.stats.totalTests > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              {barChartData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pontuação Média por Tipo de Teste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: "300px" }}>
                      <Bar data={barChartData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Pizza */}
              {pieChartData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: "300px" }}>
                      <Pie data={pieChartData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabela de Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados Detalhados</CardTitle>
                <CardDescription>
                  Lista completa de todos os testes filtrados ({exportData.results.length} registros)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Funcionário
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Departamento
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Teste</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Pontuação
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.results.slice(0, 50).map((result: any, index: number) => (
                        <tr key={result.resultId || index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{result.employeeName}</div>
                              <div className="text-sm text-gray-500">{result.employeeCode}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {result.departmentName || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                              {result.testType?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-lg font-bold text-indigo-600">
                              {result.score || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportData.results.length > 50 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Mostrando 50 de {exportData.results.length} resultados. Exporte para ver todos.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
