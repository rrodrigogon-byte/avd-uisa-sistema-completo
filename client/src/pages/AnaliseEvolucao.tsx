import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { TrendingUp, TrendingDown, Minus, Loader2, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnaliseEvolucao() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Buscar lista de funcionários
  const { data: employees } = trpc.employees.list.useQuery({});

  // Buscar evolução do funcionário selecionado
  const { data: evolution, isLoading } = trpc.performanceReports.getEmployeeEvolution.useQuery(
    {
      employeeId: selectedEmployeeId || 0,
      testType: selectedTestType,
      startDate: dateRange.start,
      endDate: dateRange.end,
    },
    { enabled: !!selectedEmployeeId }
  );

  // Preparar dados para o gráfico
  const chartData = evolution?.history
    ? {
        labels: evolution.history.map((h: any) =>
          format(new Date(h.completedAt), "dd/MM/yyyy", { locale: ptBR })
        ),
        datasets: [
          {
            label: "Pontuação",
            data: evolution.history.map((h: any) => h.score || 0),
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "rgb(99, 102, 241)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "improving":
        return "Em Melhoria";
      case "declining":
        return "Em Declínio";
      default:
        return "Estável";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-50 border-green-200";
      case "declining":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleExportPDF = () => {
    if (!evolution) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    toast.info("Exportação em desenvolvimento");
    // TODO: Implementar exportação PDF
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Evolução</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe a evolução das pontuações dos testes ao longo do tempo
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Selecione o funcionário e o período para visualizar a evolução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select
                  value={selectedEmployeeId?.toString()}
                  onValueChange={(value) => setSelectedEmployeeId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} ({emp.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Teste (Opcional)</Label>
                <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disc">DISC</SelectItem>
                    <SelectItem value="mbti">MBTI</SelectItem>
                    <SelectItem value="big5">Big Five</SelectItem>
                    <SelectItem value="valores">Valores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={dateRange.end || ""}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {evolution && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Testes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evolution.totalTests}</div>
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
                  {evolution.averageScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tendência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getTrendColor(evolution.trend)}`}>
                  {getTrendIcon(evolution.trend)}
                  <span className="font-semibold">{getTrendText(evolution.trend)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportPDF} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </CardContent>
          </Card>
        )}

        {!isLoading && !selectedEmployeeId && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Selecione um Funcionário
              </h3>
              <p className="text-gray-500">
                Escolha um funcionário nos filtros acima para visualizar sua evolução
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && selectedEmployeeId && evolution && evolution.totalTests === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum Teste Encontrado
              </h3>
              <p className="text-gray-500">
                Este funcionário ainda não possui testes registrados no período selecionado
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && evolution && evolution.totalTests > 0 && chartData && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Pontuações</CardTitle>
              <CardDescription>
                Gráfico de linha mostrando a evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Histórico */}
        {evolution && evolution.totalTests > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico Detalhado</CardTitle>
              <CardDescription>
                Lista completa de todos os testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tipo de Teste
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Pontuação
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Interpretação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolution.history.map((test: any, index: number) => (
                      <tr key={test.id || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {format(new Date(test.completedAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                            {test.testType?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {test.score || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {test.interpretation || "N/A"}
                        </td>
                      </tr>
                    ))}
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
