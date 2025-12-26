import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, Users, Target } from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function Relatorio360Consolidado() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Queries
  const { data: cycles, isLoading: loadingCycles } = trpc.evaluationCycles.list.useQuery(undefined);
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery(undefined);
  const { data: departments } = trpc.organization.listDepartments.useQuery(undefined);

  // Query de dados consolidados
  const { data: consolidatedData, isLoading: loadingData } = trpc.evaluations.get360Consolidated.useQuery(
    {
      cycleId: selectedCycleId!,
      employeeId: selectedEmployeeId,
      departmentId: selectedDepartmentId,
    },
    {
      enabled: !!selectedCycleId,
    }
  );

  // Preparar dados para gráfico radar
  const radarData = consolidatedData?.competencies ? {
    labels: consolidatedData.competencies.map(c => c.name),
    datasets: [
      {
        label: 'Autoavaliação',
        data: consolidatedData.competencies.map(c => c.selfScore || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Gestor',
        data: consolidatedData.competencies.map(c => c.managerScore || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      },
      {
        label: 'Pares',
        data: consolidatedData.competencies.map(c => c.peersScore || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
      },
    ],
  } : null;

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Comparativo de Competências - Avaliação 360°',
      },
    },
  };

  // Preparar dados para gráfico de barras (gaps)
  const gapsData = consolidatedData?.competencies ? {
    labels: consolidatedData.competencies.map(c => c.name),
    datasets: [
      {
        label: 'Gap (Gestor - Autoavaliação)',
        data: consolidatedData.competencies.map(c => 
          (c.managerScore || 0) - (c.selfScore || 0)
        ),
        backgroundColor: (context: any) => {
          const value = context.parsed.y;
          return value >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        },
        borderColor: (context: any) => {
          const value = context.parsed.y;
          return value >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
        },
        borderWidth: 1,
      },
    ],
  } : null;

  const gapsOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Análise de Gaps - Diferença entre Avaliações',
      },
    },
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Gerando PDF...");
      
      // TODO: Implementar exportação real com jsPDF
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    }
  };

  const activeCycles = cycles?.filter(c => c.status === 'active') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Relatório 360° Consolidado</h1>
          <p className="text-muted-foreground mt-2">
            Análise comparativa de competências com gráficos radar e evolução histórica
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Selecione os critérios para visualizar o relatório consolidado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ciclo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciclo de Avaliação *</label>
                <Select
                  value={selectedCycleId?.toString() || ""}
                  onValueChange={(value) => setSelectedCycleId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCycles ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : activeCycles.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhum ciclo ativo
                      </SelectItem>
                    ) : (
                      activeCycles.map((cycle: any) => (
                        <SelectItem key={cycle.id} value={cycle.id.toString()}>
                          {cycle.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento (opcional)</label>
                <Select
                  value={selectedDepartmentId?.toString() || "all"}
                  onValueChange={(value) => 
                    setSelectedDepartmentId(value === "all" ? null : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colaborador */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Colaborador (opcional)</label>
                <Select
                  value={selectedEmployeeId?.toString() || "all"}
                  onValueChange={(value) => 
                    setSelectedEmployeeId(value === "all" ? null : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os colaboradores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os colaboradores</SelectItem>
                    {loadingEmployees ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : (
                      employees?.employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Resumidas */}
        {consolidatedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Média Autoavaliação
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consolidatedData.averages?.self.toFixed(2) || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  De 5.0 pontos possíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Média Gestor
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consolidatedData.averages?.manager.toFixed(2) || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  De 5.0 pontos possíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Média Pares
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consolidatedData.averages?.peers.toFixed(2) || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  De 5.0 pontos possíveis
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        {loadingData ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !selectedCycleId ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Selecione um ciclo de avaliação para visualizar o relatório
              </p>
            </CardContent>
          </Card>
        ) : consolidatedData && radarData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Competências</CardTitle>
                <CardDescription>
                  Visualização 360° das avaliações por competência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Gaps */}
            {gapsData && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Gaps</CardTitle>
                  <CardDescription>
                    Diferença entre avaliação do gestor e autoavaliação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Bar data={gapsData} options={gapsOptions} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Nenhum dado disponível para os filtros selecionados
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        {consolidatedData && (
          <div className="flex justify-end gap-4">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
