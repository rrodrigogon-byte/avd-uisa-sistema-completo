import ExcelJS from "exceljs";

/**
 * Utilitário de Exportação Excel para Bônus
 * Gera planilhas para RH/Financeiro com cálculo de bônus por colaborador
 */

interface BonusData {
  employeeId: number;
  employeeName: string;
  department: string;
  totalBonusAmount: number;
  totalBonusPercentage: number;
  goalsCount: number;
  goals: Array<{
    title: string;
    bonusAmount: number;
    bonusPercentage: number;
  }>;
}

/**
 * Gerar planilha Excel de bônus
 */
export async function generateBonusExcel(
  bonusData: BonusData[],
  cycleId: number
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema AVD UISA";
  workbook.created = new Date();

  // Aba 1: Resumo por Colaborador
  const summarySheet = workbook.addWorksheet("Resumo de Bônus");

  // Cabeçalho
  summarySheet.mergeCells("A1:G1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `Relatório de Bônus - Ciclo ${cycleId}`;
  titleCell.font = { size: 16, bold: true, color: { argb: "FFF39200" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF3E8" },
  };

  summarySheet.getRow(2).values = [
    "ID",
    "Colaborador",
    "Departamento",
    "Metas Concluídas",
    "Bônus Fixo (R$)",
    "Bônus Percentual (%)",
    "Total Estimado (R$)",
  ];

  const headerRow = summarySheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF39200" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  // Dados
  let totalBonusAmount = 0;
  let totalBonusPercentage = 0;
  let totalGoals = 0;

  bonusData.forEach((emp, index) => {
    const row = summarySheet.addRow([
      emp.employeeId,
      emp.employeeName,
      emp.department,
      emp.goalsCount,
      emp.totalBonusAmount,
      emp.totalBonusPercentage,
      emp.totalBonusAmount, // Pode ser ajustado com salário base se disponível
    ]);

    // Formatação de valores
    row.getCell(5).numFmt = 'R$ #,##0.00';
    row.getCell(6).numFmt = '0.00"%"';
    row.getCell(7).numFmt = 'R$ #,##0.00';

    // Zebra striping
    if (index % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9F9F9" },
      };
    }

    totalBonusAmount += emp.totalBonusAmount;
    totalBonusPercentage += emp.totalBonusPercentage;
    totalGoals += emp.goalsCount;
  });

  // Linha de totais
  const totalRow = summarySheet.addRow([
    "",
    "TOTAL",
    "",
    totalGoals,
    totalBonusAmount,
    totalBonusPercentage,
    totalBonusAmount,
  ]);
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFE0B2" },
  };
  totalRow.getCell(5).numFmt = 'R$ #,##0.00';
  totalRow.getCell(6).numFmt = '0.00"%"';
  totalRow.getCell(7).numFmt = 'R$ #,##0.00';

  // Ajustar largura das colunas
  summarySheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 25 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    { width: 20 },
  ];

  // Bordas
  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
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

  // Aba 2: Detalhamento por Meta
  const detailSheet = workbook.addWorksheet("Detalhamento");

  detailSheet.mergeCells("A1:F1");
  const detailTitleCell = detailSheet.getCell("A1");
  detailTitleCell.value = "Detalhamento de Bônus por Meta";
  detailTitleCell.font = { size: 16, bold: true, color: { argb: "FFF39200" } };
  detailTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  detailTitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF3E8" },
  };

  detailSheet.getRow(2).values = [
    "Colaborador",
    "Departamento",
    "Meta",
    "Bônus Fixo (R$)",
    "Bônus Percentual (%)",
    "Observações",
  ];

  const detailHeaderRow = detailSheet.getRow(2);
  detailHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  detailHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF39200" },
  };
  detailHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
  detailHeaderRow.height = 25;

  // Dados detalhados
  let detailIndex = 0;
  bonusData.forEach((emp) => {
    emp.goals.forEach((goal) => {
      const row = detailSheet.addRow([
        emp.employeeName,
        emp.department,
        goal.title,
        goal.bonusAmount,
        goal.bonusPercentage,
        "",
      ]);

      row.getCell(4).numFmt = 'R$ #,##0.00';
      row.getCell(5).numFmt = '0.00"%"';

      if (detailIndex % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9F9F9" },
        };
      }
      detailIndex++;
    });
  });

  detailSheet.columns = [
    { width: 30 },
    { width: 25 },
    { width: 40 },
    { width: 18 },
    { width: 20 },
    { width: 30 },
  ];

  detailSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
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

  // Aba 3: Instruções
  const instructionsSheet = workbook.addWorksheet("Instruções");

  instructionsSheet.mergeCells("A1:D1");
  const instructionsTitleCell = instructionsSheet.getCell("A1");
  instructionsTitleCell.value = "Instruções de Uso";
  instructionsTitleCell.font = { size: 16, bold: true, color: { argb: "FFF39200" } };
  instructionsTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  instructionsTitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF3E8" },
  };

  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["📊 Sobre este Relatório"]);
  instructionsSheet.addRow([
    "Este relatório contém o cálculo de bônus baseado em metas SMART concluídas.",
  ]);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["📋 Abas Disponíveis"]);
  instructionsSheet.addRow([
    "• Resumo de Bônus: Totais por colaborador",
  ]);
  instructionsSheet.addRow([
    "• Detalhamento: Bônus por meta individual",
  ]);
  instructionsSheet.addRow([
    "• Instruções: Esta aba",
  ]);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["💰 Tipos de Bônus"]);
  instructionsSheet.addRow([
    "• Bônus Fixo: Valor em reais definido na meta",
  ]);
  instructionsSheet.addRow([
    "• Bônus Percentual: Percentual sobre salário base (a ser calculado pelo RH)",
  ]);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["⚠️ Observações Importantes"]);
  instructionsSheet.addRow([
    "• Apenas metas concluídas (100%) e elegíveis são incluídas",
  ]);
  instructionsSheet.addRow([
    "• O cálculo final deve considerar políticas internas de RH",
  ]);
  instructionsSheet.addRow([
    "• Valores de bônus percentual devem ser aplicados sobre o salário base",
  ]);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow([
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
  ]);

  instructionsSheet.columns = [{ width: 80 }];

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
