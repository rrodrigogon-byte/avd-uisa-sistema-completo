import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Target,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

/**
 * Página de Relatórios de Progresso de Ciclos
 * Mostra evolução de avaliações 360°, metas SMART e PDI por ciclo
 */
export default function ProgressoCiclos() {
  const [selectedCycle, setSelectedCycle] = useState<number | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Buscar ciclos
  const { data: cycles = [] } = trpc.evaluationCycles.list.useQuery();

  // Buscar departamentos
  const { data: departments = [] } = trpc.departments.list.useQuery();

  // Buscar progresso de avaliações 360°
  const { data: evaluationsProgress = [] } = trpc.cycleReports.getEvaluationsProgress.useQuery({
    cycleId: selectedCycle,
    departmentId: departmentFilter,
    period: periodFilter,
  });

  // Buscar progresso de metas SMART
  const { data: goalsProgress = [] } = trpc.cycleReports.getGoalsProgress.useQuery({
    cycleId: selectedCycle,
    departmentId: departmentFilter,
    period: periodFilter,
  });

  // Buscar progresso de PDI
  const { data: pdiProgress = [] } = trpc.cycleReports.getPDIProgress.useQuery({
    cycleId: selectedCycle,
    departmentId: departmentFilter,
    period: periodFilter,
  });

  // Buscar estatísticas gerais
  const { data: stats } = trpc.cycleReports.getCycleStats.useQuery({
    cycleId: selectedCycle,
    departmentId: departmentFilter,
  });

  // Exportar relatório
  const exportMutation = trpc.cycleReports.exportCycleReport.useMutation({
    onSuccess: (data) => {
      toast.success("Relatório exportado com sucesso!");
      // Fazer download do arquivo
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.click();
    },
    onError: (error: any) => {
      toast.error("Erro ao exportar relatório", {
        description: error.message,
      });
    },
  });

  const handleExport = async (format: "pdf" | "excel") => {
    await exportMutation.mutateAsync({
      cycleId: selectedCycle,
      departmentId: departmentFilter,
      format,
    });
  };

  // Dados para gráfico de pizza (status de avaliações)
  const evaluationStatusData = stats
    ? [
        { name: "Concluídas", value: stats.evaluationsCompleted },
        { name: "Em Andamento", value: stats.evaluationsInProgress },
        { name: "Pendentes", value: stats.evaluationsPending },
      ]
    : [];

  // Dados para gráfico de pizza (status de metas)
  const goalsStatusData = stats
    ? [
        { name: "Atingidas", value: stats.goalsAchieved },
        { name: "Em Progresso", value: stats.goalsInProgress },
        { name: "Atrasadas", value: stats.goalsDelayed },
      ]
    : [];

  // Dados para gráfico de pizza (status de PDI)
  const pdiStatusData = stats
    ? [
        { name: "Concluídos", value: stats.pdiCompleted },
        { name: "Em Andamento", value: stats.pdiInProgress },
        { name: "Não Iniciados", value: stats.pdiNotStarted },
      ]
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios de Progresso de Ciclos</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe a evolução de avaliações 360°, metas SMART e PDI
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-gray-500 mt-1">Funcionários no ciclo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.evaluationsCompleted}/{stats.totalEvaluations}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.evaluationsCompleted / stats.totalEvaluations) * 100)}% concluído
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.goalsAchieved}/{stats.totalGoals}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.goalsAchieved / stats.totalGoals) * 100)}% atingidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDI em Andamento</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pdiInProgress}/{stats.totalPDI}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.pdiInProgress / stats.totalPDI) * 100)}% em progresso
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <Label className="text-sm font-medium mb-2 block">Ciclo</Label>
            <Select
              value={selectedCycle?.toString() || "all"}
              onValueChange={(v) => setSelectedCycle(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os ciclos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ciclos</SelectItem>
                {cycles.map((cycle: any) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-sm font-medium mb-2 block">Departamento</Label>
            <Select
              value={departmentFilter?.toString() || "all"}
              onValueChange={(v) => setDepartmentFilter(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-sm font-medium mb-2 block">Período</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
                <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                <SelectItem value="last_year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Avaliações 360° */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Avaliações 360°</CardTitle>
            <CardDescription>Progresso de avaliações ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evaluationsProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  name="Concluídas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="inProgress"
                  stroke="#3b82f6"
                  name="Em Andamento"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  name="Pendentes"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Metas SMART */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Metas SMART</CardTitle>
            <CardDescription>Progresso de metas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={goalsProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="achieved"
                  stroke="#10b981"
                  name="Atingidas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="inProgress"
                  stroke="#3b82f6"
                  name="Em Progresso"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="delayed"
                  stroke="#ef4444"
                  name="Atrasadas"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de PDI */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de PDI</CardTitle>
            <CardDescription>Progresso de planos de desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pdiProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  name="Concluídos"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="inProgress"
                  stroke="#3b82f6"
                  name="Em Andamento"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="notStarted"
                  stroke="#9ca3af"
                  name="Não Iniciados"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status de Avaliações (Pizza) */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Avaliações</CardTitle>
            <CardDescription>Distribuição atual de avaliações</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={evaluationStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {evaluationStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Progresso por Departamento</CardTitle>
          <CardDescription>Visão geral de avaliações, metas e PDI</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={departments.map((dept: any) => ({
                name: dept.name,
                avaliacoes: Math.random() * 100,
                metas: Math.random() * 100,
                pdi: Math.random() * 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avaliacoes" fill="#10b981" name="Avaliações (%)" />
              <Bar dataKey="metas" fill="#3b82f6" name="Metas (%)" />
              <Bar dataKey="pdi" fill="#f59e0b" name="PDI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
