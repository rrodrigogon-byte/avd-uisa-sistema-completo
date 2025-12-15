import { useState } from "react";
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
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

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
  Legend,
  Filler
);

export default function DashboardProdutividade() {
  const [periodo, setPeriodo] = useState<"semanal" | "mensal">("semanal");
  const [departamento, setDepartamento] = useState<string>("todos");

  // Mock data - substituir por dados reais do backend
  const dadosSemanais = {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      {
        label: "Produtividade (%)",
        data: [75, 82, 78, 85, 90, 88, 80],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const dadosMensais = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    datasets: [
      {
        label: "Produtividade Média (%)",
        data: [72, 75, 78, 80, 82, 85, 87, 86, 88, 90, 89, 91],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
    ],
  };

  const dadosCategoria = {
    labels: ["Tarefas Concluídas", "Reuniões", "Desenvolvimento", "Revisões", "Planejamento"],
    datasets: [
      {
        label: "Distribuição de Tempo (%)",
        data: [35, 20, 25, 10, 10],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(34, 197, 94)",
          "rgb(251, 146, 60)",
          "rgb(168, 85, 247)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const optionsLinha = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  const optionsBarra = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  const optionsPizza = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(20);
    doc.text("Dashboard de Produtividade", 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${periodo === "semanal" ? "Semanal" : "Mensal"}`, 14, 28);
    doc.text(`Departamento: ${departamento === "todos" ? "Todos" : departamento.toUpperCase()}`, 14, 34);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 40);

    // Estatísticas Resumidas
    doc.setFontSize(14);
    doc.text("Estatísticas Resumidas", 14, 50);

    const estatisticas = [
      ["Produtividade Média", "84%", "+5% vs. mês anterior"],
      ["Tarefas Concluídas", "127", "+12 vs. semana anterior"],
      ["Horas Trabalhadas", "168h", "Média de 8h/dia"],
      ["Taxa de Conclusão", "92%", "+3% vs. mês anterior"],
    ];

    autoTable(doc, {
      startY: 55,
      head: [["Métrica", "Valor", "Comparação"]],
      body: estatisticas,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Dados de Evolução
    const yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Evolução de Produtividade", 14, yPos);

    const dadosEvolucao = periodo === "semanal"
      ? dadosSemanais.labels.map((label: any, i: number) => [label, `${dadosSemanais.datasets[0].data[i]}%`])
      : dadosMensais.labels.map((label: any, i: number) => [label, `${dadosMensais.datasets[0].data[i]}%`]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Período", "Produtividade"]],
      body: dadosEvolucao,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] },
    });

    // Distribuição por Categoria
    const yPos2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Distribuição por Categoria", 14, yPos2);

    const dadosDistribuicao = dadosCategoria.labels.map((label: any, i: number) => [
      label,
      `${dadosCategoria.datasets[0].data[i]}%`,
    ]);

    autoTable(doc, {
      startY: yPos2 + 5,
      head: [["Categoria", "Percentual"]],
      body: dadosDistribuicao,
      theme: "grid",
      headStyles: { fillColor: [251, 146, 60] },
    });

    // Salvar PDF
    doc.save(`dashboard-produtividade-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema AVD UISA";
    workbook.created = new Date();

    // Planilha 1: Estatísticas Resumidas
    const sheet1 = workbook.addWorksheet("Estatísticas");
    sheet1.columns = [
      { header: "Métrica", key: "metrica", width: 25 },
      { header: "Valor", key: "valor", width: 15 },
      { header: "Comparação", key: "comparacao", width: 25 },
    ];

    sheet1.addRows([
      { metrica: "Produtividade Média", valor: "84%", comparacao: "+5% vs. mês anterior" },
      { metrica: "Tarefas Concluídas", valor: "127", comparacao: "+12 vs. semana anterior" },
      { metrica: "Horas Trabalhadas", valor: "168h", comparacao: "Média de 8h/dia" },
      { metrica: "Taxa de Conclusão", valor: "92%", comparacao: "+3% vs. mês anterior" },
    ]);

    // Estilizar cabeçalho
    sheet1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet1.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };

    // Planilha 2: Evolução
    const sheet2 = workbook.addWorksheet("Evolução");
    sheet2.columns = [
      { header: "Período", key: "periodo", width: 15 },
      { header: "Produtividade (%)", key: "produtividade", width: 20 },
    ];

    const dadosEvolucao = periodo === "semanal"
      ? dadosSemanais.labels.map((label: any, i: number) => ({
          periodo: label,
          produtividade: dadosSemanais.datasets[0].data[i],
        }))
      : dadosMensais.labels.map((label: any, i: number) => ({
          periodo: label,
          produtividade: dadosMensais.datasets[0].data[i],
        }));

    sheet2.addRows(dadosEvolucao);

    sheet2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet2.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF22C55E" },
    };

    // Planilha 3: Distribuição por Categoria
    const sheet3 = workbook.addWorksheet("Categorias");
    sheet3.columns = [
      { header: "Categoria", key: "categoria", width: 25 },
      { header: "Percentual (%)", key: "percentual", width: 20 },
    ];

    const dadosDistribuicao = dadosCategoria.labels.map((label: any, i: number) => ({
      categoria: label,
      percentual: dadosCategoria.datasets[0].data[i],
    }));

    sheet3.addRows(dadosDistribuicao);

    sheet3.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet3.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFB923C" },
    };

    // Gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-produtividade-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Produtividade</h1>
            <p className="text-gray-600 mt-1">Visualize e analise métricas de desempenho</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportarPDF} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportarExcel} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Personalize a visualização dos dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Departamento</label>
                <Select value={departamento} onValueChange={setDepartamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ti">TI</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <CardTitle>Evolução {periodo === "semanal" ? "Semanal" : "Mensal"}</CardTitle>
              </div>
              <CardDescription>
                Acompanhe a evolução da produtividade ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {periodo === "semanal" ? (
                  <Line data={dadosSemanais} options={optionsLinha} />
                ) : (
                  <Bar data={dadosMensais} options={optionsBarra} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Categoria */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                <CardTitle>Distribuição por Categoria</CardTitle>
              </div>
              <CardDescription>Como o tempo está sendo distribuído</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Pie data={dadosCategoria} options={optionsPizza} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Produtividade Média</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">84%</div>
              <p className="text-sm text-gray-600 mt-1">+5% vs. mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tarefas Concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">127</div>
              <p className="text-sm text-gray-600 mt-1">+12 vs. semana anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Horas Trabalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">168h</div>
              <p className="text-sm text-gray-600 mt-1">Média de 8h/dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Taxa de Conclusão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">92%</div>
              <p className="text-sm text-gray-600 mt-1">+3% vs. mês anterior</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
