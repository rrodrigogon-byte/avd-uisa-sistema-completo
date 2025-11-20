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
import { DollarSign, Download, TrendingUp, Users, Calendar, Filter, LineChart as LineChartIcon, BarChart3, FileText, PieChart, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function RelatorioBonus() {
  const [filterStatus, setFilterStatus] = useState<string>("pago");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtros para gráficos
  const [chartPeriod, setChartPeriod] = useState<number>(6);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

  // Buscar dados de bônus
  const { data: calculations, isLoading } = trpc.bonus.listCalculations.useQuery({
    status: filterStatus as any,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.bonus.getStats.useQuery();

  // Buscar tendências mensais (com filtro de período)
  const { data: monthlyTrends } = trpc.bonus.getMonthlyTrends.useQuery({ months: chartPeriod });

  // Buscar distribuição por departamento
  const { data: deptDistribution } = trpc.bonus.getDepartmentDistribution.useQuery();
  
  // Filtrar distribuição por departamento selecionado
  const filteredDeptDistribution = selectedDepartment
    ? deptDistribution?.filter(d => d.departmentId === selectedDepartment)
    : deptDistribution;
  
  // Buscar lista de departamentos para o filtro
  const { data: departments } = trpc.organization.departments.list.useQuery();

  // Filtrar por termo de busca
  const filteredCalculations = calculations?.filter((calc: any) => {
    const matchesSearch = searchTerm === "" || 
      calc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === "" || 
      calc.referenceMonth === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const handleExportToPDF = async () => {
    try {
      if (!filteredCalculations || filteredCalculations.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      toast.info("Gerando PDF... Aguarde");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setTextColor(31, 41, 55);
      pdf.text("Relatório de Bônus", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 15;

      // KPIs
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      pdf.text("Indicadores Principais", 15, yPosition);
      yPosition += 10;

      const kpis = [
        { label: "Total Pago", value: `R$ ${(totalPaid / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
        { label: "Média por Colaborador", value: `R$ ${(avgBonus / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
        { label: "Colaboradores Beneficiados", value: filteredCalculations.length.toString() },
        { label: "Políticas Ativas", value: (stats?.activePolicies || 0).toString() },
      ];

      pdf.setFontSize(10);
      kpis.forEach((kpi, index) => {
        const xPos = 15 + (index % 2) * 90;
        const yPos = yPosition + Math.floor(index / 2) * 12;
        pdf.setTextColor(107, 114, 128);
        pdf.text(kpi.label, xPos, yPos);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text(kpi.value, xPos, yPos + 5);
        pdf.setFont(undefined, "normal");
      });
      yPosition += 30;

      // Capturar gráficos
      const chartElements = document.querySelectorAll("canvas");
      if (chartElements.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text("Gráficos de Análise", 15, yPosition);
        yPosition += 10;

        for (let i = 0; i < Math.min(2, chartElements.length); i++) {
          const canvas = chartElements[i] as HTMLCanvasElement;
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.addImage(imgData, "PNG", 15, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      }

      // Tabela de dados (primeiros 10 registros)
      if (yPosition + 60 > pageHeight) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      pdf.text("Detalhamento de Bônus (Top 10)", 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text("Colaborador", 15, yPosition);
      pdf.text("Política", 70, yPosition);
      pdf.text("Valor", 120, yPosition, { align: "right" });
      pdf.text("Status", 150, yPosition);
      pdf.text("Mês Ref.", 180, yPosition);
      yPosition += 5;

      pdf.setDrawColor(229, 231, 235);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 5;

      const topCalculations = filteredCalculations.slice(0, 10);
      pdf.setTextColor(31, 41, 55);
      topCalculations.forEach((calc: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(calc.employeeName || `Func. #${calc.employeeId}`, 15, yPosition);
        pdf.text((calc.policyName || "N/A").substring(0, 20), 70, yPosition);
        pdf.text(
          `R$ ${(Number(calc.bonusAmount) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          120,
          yPosition,
          { align: "right" }
        );
        pdf.text(calc.status || "N/A", 150, yPosition);
        pdf.text(calc.referenceMonth || "N/A", 180, yPosition);
        yPosition += 7;
      });

      // Rodapé
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
          `Página ${i} de ${totalPages} | Sistema AVD UISA`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Salvar PDF
      pdf.save(`relatorio-bonus-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

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
        <div className="flex gap-2">
          <Button onClick={handleExportToPDF} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
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

      {/* Filtros dos Gráficos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros dos Gráficos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={chartPeriod.toString()} onValueChange={(v) => setChartPeriod(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <Select 
                value={selectedDepartment?.toString() || "all"} 
                onValueChange={(v) => setSelectedDepartment(v === "all" ? null : Number(v))}
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setChartPeriod(6);
                  setSelectedDepartment(null);
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
              Tendência dos últimos {chartPeriod} meses
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
            {filteredDeptDistribution && filteredDeptDistribution.length > 0 ? (
              <Bar
                data={{
                  labels: filteredDeptDistribution.map((d) => {
                    const dept = departments?.find((dep: any) => dep.id === d.departmentId);
                    return dept?.name || `Dept. ${d.departmentId}`;
                  }),
                  datasets: [
                    {
                      label: "Total de Bônus (R$)",
                      data: filteredDeptDistribution.map((d) => Number(d.totalAmount) / 100),
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

      {/* Gráfico de Pizza - Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-600" />
            Distribuição por Status
          </CardTitle>
          <CardDescription>
            Proporção de bônus por status atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculations && calculations.length > 0 ? (
            <div className="flex items-center justify-center">
              <Pie
                data={{
                  labels: ["Pago", "Aprovado", "Calculado"],
                  datasets: [
                    {
                      data: [
                        calculations.filter((c: any) => c.status === "pago").length,
                        calculations.filter((c: any) => c.status === "aprovado").length,
                        calculations.filter((c: any) => c.status === "calculado").length,
                      ],
                      backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(59, 130, 246, 0.8)",
                        "rgba(251, 191, 36, 0.8)",
                      ],
                      borderColor: [
                        "rgb(34, 197, 94)",
                        "rgb(59, 130, 246)",
                        "rgb(251, 191, 36)",
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right" as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicadores de Tendência */}
      {monthlyTrends && monthlyTrends.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Indicadores de Tendência
            </CardTitle>
            <CardDescription>
              Comparação com o mês anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const lastMonth = monthlyTrends[monthlyTrends.length - 1];
                const previousMonth = monthlyTrends[monthlyTrends.length - 2];
                
                const totalChange = ((Number(lastMonth.totalAmount) - Number(previousMonth.totalAmount)) / Number(previousMonth.totalAmount)) * 100;
                const countChange = ((lastMonth.count - previousMonth.count) / previousMonth.count) * 100;
                const avgChange = ((Number(lastMonth.averageBonus) - Number(previousMonth.averageBonus)) / Number(previousMonth.averageBonus)) * 100;

                const getTrendIcon = (change: number) => {
                  if (change > 5) return <ArrowUp className="w-5 h-5 text-green-600" />;
                  if (change < -5) return <ArrowDown className="w-5 h-5 text-red-600" />;
                  return <Minus className="w-5 h-5 text-gray-600" />;
                };

                const getTrendColor = (change: number) => {
                  if (change > 5) return "text-green-600";
                  if (change < -5) return "text-red-600";
                  return "text-gray-600";
                };

                return (
                  <>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-blue-700 font-medium">Total de Bônus</p>
                          {getTrendIcon(totalChange)}
                        </div>
                        <p className={`text-2xl font-bold ${getTrendColor(totalChange)}`}>
                          {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          vs. mês anterior
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-purple-700 font-medium">Quantidade</p>
                          {getTrendIcon(countChange)}
                        </div>
                        <p className={`text-2xl font-bold ${getTrendColor(countChange)}`}>
                          {countChange > 0 ? "+" : ""}{countChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          vs. mês anterior
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-orange-700 font-medium">Média por Pessoa</p>
                          {getTrendIcon(avgChange)}
                        </div>
                        <p className={`text-2xl font-bold ${getTrendColor(avgChange)}`}>
                          {avgChange > 0 ? "+" : ""}{avgChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          vs. mês anterior
                        </p>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

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
