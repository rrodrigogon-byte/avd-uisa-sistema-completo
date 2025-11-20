import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { DollarSign, Download, TrendingUp, Users, Calendar, Filter, LineChart as LineChartIcon, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RelatorioBonus() {
  const [filterStatus, setFilterStatus] = useState<string>("pago");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar dados de bônus
  const { data: calculations, isLoading } = trpc.bonus.listCalculations.useQuery({
    status: filterStatus as any,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.bonus.getStats.useQuery();

  // Buscar tendências mensais
  const { data: monthlyTrends } = trpc.bonus.getMonthlyTrends.useQuery({ months: 6 });

  // Buscar distribuição por departamento
  const { data: deptDistribution } = trpc.bonus.getDepartmentDistribution.useQuery();

  // Filtrar por termo de busca
  const filteredCalculations = calculations?.filter((calc: any) => {
    const matchesSearch = searchTerm === "" || 
      calc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === "" || 
      calc.referenceMonth === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const handleExportToExcel = async () => {
    try {
      if (!filteredCalculations || filteredCalculations.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório de Bônus");

      // Definir colunas
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Colaborador", key: "employeeName", width: 30 },
        { header: "Política", key: "policyName", width: 25 },
        { header: "Salário Base", key: "baseSalary", width: 15 },
        { header: "Multiplicador", key: "multiplier", width: 15 },
        { header: "Valor Bônus", key: "bonusAmount", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Mês Referência", key: "referenceMonth", width: 15 },
        { header: "Data Cálculo", key: "calculatedAt", width: 20 },
        { header: "Data Pagamento", key: "paidAt", width: 20 },
      ];

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      // Adicionar dados
      filteredCalculations.forEach((calc: any) => {
        worksheet.addRow({
          id: calc.id,
          employeeName: calc.employeeName || "N/A",
          policyName: calc.policyName || "N/A",
          baseSalary: Number(calc.baseSalary || 0) / 100,
          multiplier: calc.multiplier || 0,
          bonusAmount: Number(calc.bonusAmount || 0) / 100,
          status: calc.status === "pago" ? "Pago" : calc.status === "aprovado" ? "Aprovado" : "Calculado",
          referenceMonth: calc.referenceMonth || "N/A",
          calculatedAt: calc.calculatedAt ? new Date(calc.calculatedAt).toLocaleDateString("pt-BR") : "N/A",
          paidAt: calc.paidAt ? new Date(calc.paidAt).toLocaleDateString("pt-BR") : "N/A",
        });
      });

      // Formatar colunas de valores monetários
      worksheet.getColumn("baseSalary").numFmt = 'R$ #,##0.00';
      worksheet.getColumn("bonusAmount").numFmt = 'R$ #,##0.00';

      // Adicionar bordas
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Adicionar linha de totais
      const totalRow = worksheet.addRow({
        id: "",
        employeeName: "TOTAL",
        policyName: "",
        baseSalary: "",
        multiplier: "",
        bonusAmount: totalPaid / 100,
        status: "",
        referenceMonth: "",
        calculatedAt: "",
        paidAt: "",
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };

      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-bonus-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const totalPaid = filteredCalculations?.reduce(
    (sum: number, calc: any) => sum + Number(calc.bonusAmount || 0),
    0
  ) || 0;

  const avgBonus = filteredCalculations && filteredCalculations.length > 0
    ? totalPaid / filteredCalculations.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            Relatório de Bônus
          </h1>
          <p className="text-gray-500 mt-1">
            Histórico completo de bônus calculados, aprovados e pagos
          </p>
        </div>
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar para Excel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Média por Colaborador</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {avgBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Colaboradores Beneficiados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredCalculations?.length || 0}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Políticas Ativas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.activePolicies || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculado">Calculado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mês de Referência</label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="Selecione o mês"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar Colaborador</label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do colaborador..."
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterStatus("pago");
                  setFilterMonth("");
                  setSearchTerm("");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-blue-600" />
              Evolução Mensal de Bônus
            </CardTitle>
            <CardDescription>
              Tendência dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrends && monthlyTrends.length > 0 ? (
              <Line
                data={{
                  labels: monthlyTrends.map((t) => t.month),
                  datasets: [
                    {
                      label: "Total de Bônus (R$)",
                      data: monthlyTrends.map((t) => Number(t.totalAmount) / 100),
                      borderColor: "rgb(59, 130, 246)",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      tension: 0.4,
                    },
                    {
                      label: "Bônus Pagos (R$)",
                      data: monthlyTrends.map((t) => Number(t.paidAmount) / 100),
                      borderColor: "rgb(34, 197, 94)",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(context.parsed.y);
                          }
                          return label;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(value as number);
                        },
                      },
                    },
                  },
                }}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Distribuição por Departamento
            </CardTitle>
            <CardDescription>
              Comparação de bônus entre departamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deptDistribution && deptDistribution.length > 0 ? (
              <Bar
                data={{
                  labels: deptDistribution.map((d) => `Dept. ${d.departmentId}`),
                  datasets: [
                    {
                      label: "Total de Bônus (R$)",
                      data: deptDistribution.map((d) => Number(d.totalAmount) / 100),
                      backgroundColor: "rgba(147, 51, 234, 0.7)",
                      borderColor: "rgb(147, 51, 234)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(context.parsed.y);
                          }
                          return label;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(value as number);
                        },
                      },
                    },
                  },
                }}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Bônus */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Bônus</CardTitle>
          <CardDescription>
            {filteredCalculations?.length || 0} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCalculations && filteredCalculations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Política</TableHead>
                    <TableHead className="text-right">Salário Base</TableHead>
                    <TableHead className="text-center">Multiplicador</TableHead>
                    <TableHead className="text-right">Valor do Bônus</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calculado em</TableHead>
                    <TableHead>Aprovado em</TableHead>
                    <TableHead>Pago em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.map((calc: any) => (
                    <TableRow key={calc.id}>
                      <TableCell className="font-medium">
                        {calc.employeeName || `Funcionário #${calc.employeeId}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.policyName || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {Number(calc.baseSalary || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {Number(calc.appliedMultiplier || 0).toFixed(1)}x
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        R$ {Number(calc.bonusAmount || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{calc.referenceMonth || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            calc.status === "pago"
                              ? "outline"
                              : calc.status === "aprovado"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {calc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.calculatedAt
                          ? new Date(calc.calculatedAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.approvedAt
                          ? new Date(calc.approvedAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.paidAt
                          ? new Date(calc.paidAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Não há bônus com os filtros selecionados. Tente ajustar os critérios de busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
