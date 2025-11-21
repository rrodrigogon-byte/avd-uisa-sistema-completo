import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Send, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdesaoMetasCorporativas() {
  const [filters, setFilters] = useState({
    departmentId: undefined as number | undefined,
    goalId: undefined as number | undefined,
    startDate: "",
    endDate: "",
  });

  // Queries
  const { data: adherenceData, isLoading } = trpc.goals.getCorporateGoalsAdherence.useQuery(filters);
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: corporateGoals } = trpc.goals.listCorporateGoals.useQuery();

  // Função de exportação Excel
  const handleExportExcel = () => {
    if (!adherenceData) return;

    const rows = [
      ["Relatório de Adesão de Metas Corporativas"],
      [""],
      ["Estatísticas Gerais"],
      ["Total de Funcionários", adherenceData.stats.totalEmployees],
      ["Atualizaram Recentemente", adherenceData.stats.employeesWithRecentUpdate],
      ["Atrasados", adherenceData.stats.employeesDelayed],
      ["Taxa de Adesão", `${adherenceData.stats.adherenceRate}%`],
      [""],
      ["Funcionários Atrasados"],
      ["Nome", "Email", "Meta", "Dias sem Atualizar", "Progresso", "Última Atualização"],
      ...adherenceData.delayedEmployees.map((e) => [
        e.employeeName,
        e.employeeEmail,
        e.goalTitle,
        e.daysWithoutUpdate,
        `${e.progress}%`,
        new Date(e.lastUpdate).toLocaleDateString("pt-BR"),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `adesao-metas-corporativas-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  // Função de envio de lembrete em massa
  const handleSendReminders = () => {
    if (!adherenceData) return;

    toast.promise(
      fetch("/api/trpc/goals.sendBulkReminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: adherenceData.delayedEmployees.map((e) => e.employeeId),
        }),
      }),
      {
        loading: "Enviando lembretes...",
        success: `${adherenceData.delayedEmployees.length} lembretes enviados!`,
        error: "Erro ao enviar lembretes",
      }
    );
  };

  // Preparar dados do gráfico
  const chartData = adherenceData
    ? {
        labels: adherenceData.byDepartment.map((d: any) => `Dept ${d.departmentId}`),
        datasets: [
          {
            label: "Taxa de Adesão (%)",
            data: adherenceData.byDepartment.map((d: any) => d.adherenceRate),
            backgroundColor: "rgba(243, 146, 0, 0.6)",
            borderColor: "rgba(243, 146, 0, 1)",
            borderWidth: 1,
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
        display: true,
        text: "Taxa de Adesão por Departamento",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatório de Adesão</h1>
              <p className="text-gray-600">Metas Corporativas - Acompanhamento de Progresso</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            {adherenceData && adherenceData.delayedEmployees.length > 0 && (
              <Button onClick={handleSendReminders} className="bg-[#F39200] hover:bg-[#D68200]">
                <Send className="w-4 h-4 mr-2" />
                Enviar Lembretes ({adherenceData.delayedEmployees.length})
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Departamento</Label>
                <Select
                  value={filters.departmentId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      departmentId: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Meta Corporativa</Label>
                <Select
                  value={filters.goalId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      goalId: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {corporateGoals?.map((goal: any) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        {adherenceData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Funcionários
                </CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adherenceData.stats.totalEmployees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Atualizaram Progresso
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {adherenceData.stats.employeesWithRecentUpdate}
                </div>
                <p className="text-xs text-gray-500">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Atrasados
                </CardTitle>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {adherenceData.stats.employeesDelayed}
                </div>
                <p className="text-xs text-gray-500">Sem atualização há 7+ dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Taxa de Adesão
                </CardTitle>
                <Calendar className="w-4 h-4 text-[#F39200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F39200]">
                  {adherenceData.stats.adherenceRate}%
                </div>
                <p className="text-xs text-gray-500">Progresso regular</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Adesão por Departamento */}
        {chartData && (
          <Card>
            <CardHeader>
              <CardTitle>Adesão por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Funcionários Atrasados */}
        {adherenceData && adherenceData.delayedEmployees.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Funcionários Atrasados ({adherenceData.delayedEmployees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Dias sem Atualizar</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Última Atualização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adherenceData.delayedEmployees.map((employee: any) => (
                    <TableRow key={`${employee.employeeId}-${employee.goalId}`}>
                      <TableCell className="font-medium">{employee.employeeName}</TableCell>
                      <TableCell>{employee.employeeEmail}</TableCell>
                      <TableCell>{employee.goalTitle}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-semibold">
                          {employee.daysWithoutUpdate} dias
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#F39200] h-2 rounded-full"
                              style={{ width: `${employee.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{employee.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.lastUpdate).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          adherenceData && (
            <Alert>
              <AlertDescription>
                ✅ Excelente! Todos os funcionários estão atualizando suas metas corporativas regularmente.
              </AlertDescription>
            </Alert>
          )
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando relatório...</p>
          </div>
        )}
      </div>
    </div>
  );
}
