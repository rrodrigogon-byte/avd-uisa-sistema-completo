import ExcelJS from 'exceljs';

interface GoalSummary {
  id: number;
  title: string;
  category: string;
  status: string;
  progress: number;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  employeeName: string;
  department: string;
}

export async function exportGoalsToExcel(goals: GoalSummary[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Metas SMART');
  
  // Configurar colunas
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Título', key: 'title', width: 40 },
    { header: 'Colaborador', key: 'employeeName', width: 25 },
    { header: 'Departamento', key: 'department', width: 20 },
    { header: 'Categoria', key: 'category', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Progresso (%)', key: 'progress', width: 15 },
    { header: 'Valor Alvo', key: 'targetValue', width: 15 },
    { header: 'Valor Atual', key: 'currentValue', width: 15 },
    { header: 'Data Início', key: 'startDate', width: 15 },
    { header: 'Data Término', key: 'endDate', width: 15 },
  ];
  
  // Estilizar cabeçalho
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF39200' }, // Laranja UISA
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;
  
  // Adicionar dados
  goals.forEach(goal => {
    worksheet.addRow({
      id: goal.id,
      title: goal.title,
      employeeName: goal.employeeName,
      department: goal.department,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      startDate: new Date(goal.startDate).toLocaleDateString('pt-BR'),
      endDate: new Date(goal.endDate).toLocaleDateString('pt-BR'),
    });
  });
  
  // Estilizar células de dados
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      
      // Colorir progresso
      const progressCell = row.getCell('progress');
      const progress = progressCell.value as number;
      if (progress >= 80) {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }, // Verde claro
        };
      } else if (progress >= 50) {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }, // Amarelo
        };
      } else {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA07A' }, // Vermelho claro
        };
      }
    }
  });
  
  // Adicionar filtros
  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1',
  };
  
  // Gerar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_Metas_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

interface Evaluation360Summary {
  id: number;
  employeeName: string;
  department: string;
  cycleYear: number;
  status: string;
  selfScore?: number;
  managerScore?: number;
  peersScore?: number;
  subordinatesScore?: number;
  finalScore?: number;
  createdAt: string;
}

export async function exportEvaluations360ToExcel(evaluations: Evaluation360Summary[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Avaliações 360°');
  
  // Configurar colunas
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Colaborador', key: 'employeeName', width: 25 },
    { header: 'Departamento', key: 'department', width: 20 },
    { header: 'Ciclo', key: 'cycleYear', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Autoavaliação', key: 'selfScore', width: 15 },
    { header: 'Gestor', key: 'managerScore', width: 15 },
    { header: 'Pares', key: 'peersScore', width: 15 },
    { header: 'Subordinados', key: 'subordinatesScore', width: 15 },
    { header: 'Nota Final', key: 'finalScore', width: 15 },
    { header: 'Data Criação', key: 'createdAt', width: 15 },
  ];
  
  // Estilizar cabeçalho
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF39200' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;
  
  // Adicionar dados
  evaluations.forEach(evaluation => {
    worksheet.addRow({
      id: evaluation.id,
      employeeName: evaluation.employeeName,
      department: evaluation.department,
      cycleYear: evaluation.cycleYear,
      status: evaluation.status,
      selfScore: evaluation.selfScore?.toFixed(2) || '-',
      managerScore: evaluation.managerScore?.toFixed(2) || '-',
      peersScore: evaluation.peersScore?.toFixed(2) || '-',
      subordinatesScore: evaluation.subordinatesScore?.toFixed(2) || '-',
      finalScore: evaluation.finalScore?.toFixed(2) || '-',
      createdAt: new Date(evaluation.createdAt).toLocaleDateString('pt-BR'),
    });
  });
  
  // Estilizar células
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });
  
  // Adicionar filtros
  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1',
  };
  
  // Gerar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_Avaliacoes360_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
