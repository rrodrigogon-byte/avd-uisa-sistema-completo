import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import { storagePut } from "../storage";

/**
 * Exportar relatório em PDF
 */
export async function exportToPDF(
  reportName: string,
  title: string,
  data: Record<string, any>
): Promise<{ url: string; key: string }> {
  const pdf = new jsPDF();
  
  // Adicionar título
  pdf.setFontSize(20);
  pdf.text(title, 20, 20);
  
  // Adicionar data
  pdf.setFontSize(10);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30);
  
  // Adicionar conteúdo
  let yPosition = 45;
  pdf.setFontSize(12);
  
  Object.entries(data).forEach(([key, value]) => {
    pdf.text(`${key}: ${JSON.stringify(value)}`, 20, yPosition);
    yPosition += 10;
    
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
  });
  
  // Converter para buffer
  const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
  
  // Upload para S3
  const timestamp = Date.now();
  const fileKey = `reports/${reportName}-${timestamp}.pdf`;
  
  return storagePut(fileKey, pdfBuffer, "application/pdf");
}

/**
 * Exportar relatório em Excel
 */
export async function exportToExcel(
  reportName: string,
  title: string,
  data: any[]
): Promise<{ url: string; key: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Relatório");
  
  // Adicionar título
  worksheet.mergeCells("A1:D1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" as any, vertical: "middle" as any };
  
  // Adicionar data
  worksheet.mergeCells("A2:D2");
  const dateCell = worksheet.getCell("A2");
  dateCell.value = `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`;
  dateCell.font = { italic: true, size: 10 };
  
  // Adicionar cabeçalhos
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(4, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
    });
    
    // Adicionar dados
    data.forEach((row, rowIndex) => {
      Object.values(row).forEach((value: any, colIndex) => {
        worksheet.getCell(5 + rowIndex, colIndex + 1).value = value as any;
      });
    });
  }
  
  // Auto-ajustar largura das colunas
  worksheet.columns.forEach((column: any) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell: any) => {
      const cellLength = cell.value?.toString().length || 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });
  
  // Converter para buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();
  
  // Upload para S3
  const timestamp = Date.now();
  const fileKey = `reports/${reportName}-${timestamp}.xlsx`;
  
  return storagePut(fileKey, Buffer.from(excelBuffer as any), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/**
 * Exportar relatório em CSV
 */
export async function exportToCSV(
  reportName: string,
  title: string,
  data: any[]
): Promise<{ url: string; key: string }> {
  let csv = `"${title}"\n`;
  csv += `"Gerado em: ${new Date().toLocaleDateString("pt-BR")}"\n\n`;
  
  if (data.length > 0) {
    // Cabeçalhos
    const headers = Object.keys(data[0]);
    csv += headers.map(h => `"${h}"`).join(",") + "\n";
    
    // Dados
    data.forEach((row) => {
      const values = Object.values(row).map(v => {
        const str = String(v || "");
        return `"${str.replace(/"/g, '""')}"`;
      });
      csv += values.join(",") + "\n";
    });
  }
  
  // Converter para buffer
  const csvBuffer = Buffer.from(csv, "utf-8");
  
  // Upload para S3
  const timestamp = Date.now();
  const fileKey = `reports/${reportName}-${timestamp}.csv`;
  
  return storagePut(fileKey, csvBuffer, "text/csv");
}

/**
 * Gerar dados de exemplo para relatório
 */
export function generateMockReportData(reportType: string) {
  switch (reportType) {
    case "goals":
      return [
        {
          "ID": 1,
          "Meta": "Aumentar Vendas",
          "Progresso": "75%",
          "Status": "Em Andamento",
          "Prazo": "31/12/2024",
        },
        {
          "ID": 2,
          "Meta": "Implementar Sistema",
          "Progresso": "45%",
          "Status": "Em Andamento",
          "Prazo": "30/11/2024",
        },
      ];
    
    case "alerts":
      return [
        {
          "ID": 1,
          "Meta": "Meta de Vendas Q4",
          "Severidade": "Crítica",
          "Progresso": "15%",
          "Data": new Date().toLocaleDateString("pt-BR"),
        },
      ];
    
    case "performance":
      return [
        {
          "Colaborador": "João Silva",
          "Departamento": "Vendas",
          "Avaliação": "8.5",
          "Metas Cumpridas": "3/4",
        },
      ];
    
    default:
      return [
        {
          "Métrica": "Total de Metas",
          "Valor": "10",
        },
        {
          "Métrica": "Metas Concluídas",
          "Valor": "7",
        },
      ];
  }
}
