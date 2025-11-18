import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface ReportData {
  name: string;
  description?: string;
  metrics: string[];
  data: any;
  generatedAt: string;
}

interface MetricInfo {
  id: string;
  name: string;
  category: string;
}

/**
 * Gera PDF do relatório com dados e gráficos
 */
export async function generatePDF(reportData: ReportData, availableMetrics: MetricInfo[]) {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(20);
  doc.text(reportData.name || "Relatório Customizado", 14, 20);
  
  // Descrição
  if (reportData.description) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(reportData.description, 14, 28);
  }
  
  // Data de geração
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}`, 14, 35);
  
  // Reset cor
  doc.setTextColor(0);
  
  // Preparar dados para tabela
  const tableData: any[] = [];
  
  reportData.metrics.forEach((metricId) => {
    const metric = availableMetrics.find((m) => m.id === metricId);
    if (!metric) return;
    
    const value = reportData.data[metricId];
    
    if (metricId === "departmentBreakdown" && Array.isArray(value)) {
      // Distribuição por departamento
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
  
  // Adicionar tabela
  autoTable(doc, {
    head: [["Métrica", "Valor"]],
    body: tableData,
    startY: 42,
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
