import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Chart, ChartConfiguration, registerables } from "chart.js";

// Registrar todos os componentes do Chart.js
Chart.register(...registerables);

interface ReportData {
  name: string;
  description?: string;
  metrics: string[];
  data: any;
  generatedAt: string;
  chartType?: string;
}

interface MetricInfo {
  id: string;
  name: string;
  category: string;
}

/**
 * Gera um gráfico Chart.js e retorna como imagem base64
 */
async function generateChartImage(
  type: "bar" | "line" | "pie",
  labels: string[],
  data: number[],
  label: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    
    const config: ChartConfiguration = {
      type,
      data: {
        labels,
        datasets: [{
          label,
          data,
          backgroundColor: type === "pie" 
            ? [
                "rgba(59, 130, 246, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(139, 92, 246, 0.8)",
                "rgba(236, 72, 153, 0.8)",
                "rgba(20, 184, 166, 0.8)",
              ]
            : "rgba(59, 130, 246, 0.8)",
          borderColor: type === "pie"
            ? [
                "rgb(59, 130, 246)",
                "rgb(16, 185, 129)",
                "rgb(245, 158, 11)",
                "rgb(239, 68, 68)",
                "rgb(139, 92, 246)",
                "rgb(236, 72, 153)",
                "rgb(20, 184, 166)",
              ]
            : "rgb(59, 130, 246)",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: type === "pie",
            position: "right",
          },
          title: {
            display: true,
            text: label,
            font: {
              size: 16,
              weight: "bold",
            },
          },
        },
        scales: type !== "pie" ? {
          y: {
            beginAtZero: true,
          },
        } : undefined,
      },
    };
    
    const chart = new Chart(canvas, config);
    
    // Aguardar renderização e converter para imagem
    setTimeout(() => {
      const imageData = canvas.toDataURL("image/png");
      chart.destroy();
      resolve(imageData);
    }, 100);
  });
}

/**
 * Gera PDF do relatório com dados e gráficos
 */
export async function generatePDF(reportData: ReportData, availableMetrics: MetricInfo[]) {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Título
  doc.setFontSize(20);
  doc.text(reportData.name || "Relatório Customizado", 14, yPosition);
  yPosition += 8;
  
  // Descrição
  if (reportData.description) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(reportData.description, 14, yPosition);
    yPosition += 5;
  }
  
  // Data de geração
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}`, 14, yPosition);
  yPosition += 10;
  
  // Reset cor
  doc.setTextColor(0);
  
  // Preparar dados para tabela e gráficos
  const tableData: any[] = [];
  let departmentData: { labels: string[]; values: number[] } | null = null;
  
  reportData.metrics.forEach((metricId) => {
    const metric = availableMetrics.find((m) => m.id === metricId);
    if (!metric) return;
    
    const value = reportData.data[metricId];
    
    if (metricId === "departmentBreakdown" && Array.isArray(value)) {
      // Distribuição por departamento
      departmentData = {
        labels: value.map((dept: any) => dept.departmentName),
        values: value.map((dept: any) => dept.count),
      };
      value.forEach((dept: any) => {
        tableData.push([
          `${metric.name} - ${dept.departmentName}`,
          dept.count.toString(),
        ]);
      });
    } else if (value !== null && value !== undefined) {
      // Métricas simples
      const formattedValue = typeof value === "number" 
        ? value.toFixed(2) 
        : value.toString();
      tableData.push([metric.name, formattedValue]);
    }
  });
  
  // Adicionar gráfico de distribuição por departamento se existir
  if (departmentData && reportData.chartType) {
    const chartType = reportData.chartType === "pie" ? "pie" : reportData.chartType === "line" ? "line" : "bar";
    const deptData = departmentData as { labels: string[]; values: number[] };
    const chartImage = await generateChartImage(
      chartType,
      deptData.labels,
      deptData.values,
      "Distribuição por Departamento"
    );
    
    doc.addImage(chartImage, "PNG", 14, yPosition, 180, 120);
    yPosition += 130;
    
    // Adicionar nova página se necessário
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  }
  
  // Adicionar tabela
  autoTable(doc, {
    head: [["Métrica", "Valor"]],
    body: tableData,
    startY: yPosition,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
  });
  
  // Salvar PDF
  doc.save(`${reportData.name || "relatorio"}.pdf`);
}

/**
 * Gera Excel do relatório com dados tabulados
 */
export async function generateExcel(reportData: ReportData, availableMetrics: MetricInfo[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Relatório");
  
  // Título
  worksheet.mergeCells("A1:B1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = reportData.name || "Relatório Customizado";
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  
  // Descrição
  if (reportData.description) {
    worksheet.mergeCells("A2:B2");
    const descCell = worksheet.getCell("A2");
    descCell.value = reportData.description;
    descCell.font = { size: 10, italic: true };
    descCell.alignment = { horizontal: "center" };
  }
  
  // Data de geração
  const startRow = reportData.description ? 3 : 2;
  worksheet.mergeCells(`A${startRow}:B${startRow}`);
  const dateCell = worksheet.getCell(`A${startRow}`);
  dateCell.value = `Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}`;
  dateCell.font = { size: 8, color: { argb: "FF808080" } };
  dateCell.alignment = { horizontal: "center" };
  
  // Cabeçalho da tabela
  const headerRow = startRow + 2;
  worksheet.getCell(`A${headerRow}`).value = "Métrica";
  worksheet.getCell(`B${headerRow}`).value = "Valor";
  
  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF3B82F6" } },
    alignment: { horizontal: "center" as const, vertical: "middle" as const },
  };
  
  worksheet.getCell(`A${headerRow}`).style = headerStyle;
  worksheet.getCell(`B${headerRow}`).style = headerStyle;
  
  // Dados
  let currentRow = headerRow + 1;
  
  reportData.metrics.forEach((metricId) => {
    const metric = availableMetrics.find((m) => m.id === metricId);
    if (!metric) return;
    
    const value = reportData.data[metricId];
    
    if (metricId === "departmentBreakdown" && Array.isArray(value)) {
      // Distribuição por departamento
      value.forEach((dept: any) => {
        worksheet.getCell(`A${currentRow}`).value = `${metric.name} - ${dept.departmentName}`;
        worksheet.getCell(`B${currentRow}`).value = dept.count;
        currentRow++;
      });
    } else if (value !== null && value !== undefined) {
      // Métricas simples
      worksheet.getCell(`A${currentRow}`).value = metric.name;
      worksheet.getCell(`B${currentRow}`).value = typeof value === "number" 
        ? parseFloat(value.toFixed(2)) 
        : value;
      currentRow++;
    }
  });
  
  // Ajustar largura das colunas
  worksheet.getColumn("A").width = 40;
  worksheet.getColumn("B").width = 20;
  
  // Adicionar bordas
  for (let row = headerRow; row < currentRow; row++) {
    ["A", "B"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${row}`);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  
  // Gerar e baixar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportData.name || "relatorio"}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
