import ExcelJS from "exceljs";

/**
 * Gera relatório Excel de Performance
 */
export async function generatePerformanceExcel(data: {
  employees: Array<{
    name: string;
    department: string;
    position: string;
    performanceScore: number;
    goalsCompleted: number;
    totalGoals: number;
    evaluationScore: number | null;
    pdiProgress: number;
  }>;
  summary: {
    avgPerformance: number;
    totalEmployees: number;
    highPerformers: number;
    lowPerformers: number;
  };
}) {
  const workbook = new ExcelJS.Workbook();

  // Metadados
  workbook.creator = "Sistema AVD UISA";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Aba 1: Resumo
  const summarySheet = workbook.addWorksheet("Resumo", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  // Título
  summarySheet.mergeCells("A1:D1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "Relatório de Performance";
  titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2980B9" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 30;

  // Data
  summarySheet.getCell("A2").value = `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`;
  summarySheet.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  // Resumo Executivo
  summarySheet.getCell("A4").value = "Resumo Executivo";
  summarySheet.getCell("A4").font = { size: 14, bold: true };

  const summaryData = [
    ["Métrica", "Valor"],
    ["Total de Colaboradores", data.summary.totalEmployees],
    ["Performance Média", `${data.summary.avgPerformance.toFixed(1)}%`],
    ["High Performers (≥80%)", data.summary.highPerformers],
    ["Low Performers (<60%)", data.summary.lowPerformers],
  ];

  summarySheet.addTable({
    name: "SummaryTable",
    ref: "A5",
    headerRow: true,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: [{ name: "Métrica" }, { name: "Valor" }],
    rows: summaryData.slice(1),
  });

  // Ajustar larguras
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 20;

  // Aba 2: Detalhamento
  const detailSheet = workbook.addWorksheet("Detalhamento", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  // Cabeçalhos
  const headers = [
    "Colaborador",
    "Departamento",
    "Cargo",
    "Score Performance",
    "Metas Concluídas",
    "Total Metas",
    "% Metas",
    "Avaliação 360°",
    "Progresso PDI",
  ];

  detailSheet.addRow(headers);

  // Estilizar cabeçalhos
  const headerRow = detailSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF34495E" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  // Dados
  data.employees.forEach((emp) => {
    const goalsPercent = emp.totalGoals > 0 ? (emp.goalsCompleted / emp.totalGoals) * 100 : 0;

    const row = detailSheet.addRow([
      emp.name,
      emp.department,
      emp.position,
      emp.performanceScore,
      emp.goalsCompleted,
      emp.totalGoals,
      goalsPercent,
      emp.evaluationScore || "N/A",
      emp.pdiProgress,
    ]);

    // Colorir baseado em performance
    if (emp.performanceScore >= 80) {
      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF27AE60" },
      };
      row.getCell(4).font = { color: { argb: "FFFFFFFF" }, bold: true };
    } else if (emp.performanceScore < 60) {
      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE74C3C" },
      };
      row.getCell(4).font = { color: { argb: "FFFFFFFF" }, bold: true };
    }
  });

  // Ajustar larguras
  detailSheet.getColumn(1).width = 30;
  detailSheet.getColumn(2).width = 20;
  detailSheet.getColumn(3).width = 25;
  detailSheet.getColumn(4).width = 18;
  detailSheet.getColumn(5).width = 16;
  detailSheet.getColumn(6).width = 12;
  detailSheet.getColumn(7).width = 12;
  detailSheet.getColumn(8).width = 16;
  detailSheet.getColumn(9).width = 15;

  // Formatar colunas numéricas
  detailSheet.getColumn(4).numFmt = "0.0";
  detailSheet.getColumn(7).numFmt = "0.0%";
  detailSheet.getColumn(9).numFmt = "0%";

  // Adicionar bordas
  detailSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 0) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  // Aba 3: Gráfico (dados para gráfico)
  const chartDataSheet = workbook.addWorksheet("Dados Gráfico");

  // Distribuição por faixa de performance
  const performanceBands = [
    { band: "Excelente (≥90%)", count: 0 },
    { band: "Bom (80-89%)", count: 0 },
    { band: "Regular (60-79%)", count: 0 },
    { band: "Baixo (<60%)", count: 0 },
  ];

  data.employees.forEach((emp) => {
    if (emp.performanceScore >= 90) performanceBands[0].count++;
    else if (emp.performanceScore >= 80) performanceBands[1].count++;
    else if (emp.performanceScore >= 60) performanceBands[2].count++;
    else performanceBands[3].count++;
  });

  chartDataSheet.addRow(["Faixa de Performance", "Quantidade"]);
  performanceBands.forEach((band) => {
    chartDataSheet.addRow([band.band, band.count]);
  });

  chartDataSheet.getColumn(1).width = 25;
  chartDataSheet.getColumn(2).width = 15;

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
