import ExcelJS from 'exceljs';
import type { Employee, AvdAssessmentProcess, AvdCompetencyAssessment } from '../../drizzle/schema';

/**
 * Módulo de Exportação de Relatórios em Excel
 * Gera relatórios formatados com dados reais do sistema AVD UISA
 */

export interface EmployeeReportData {
  employee: Employee;
  process?: AvdAssessmentProcess;
  competencyAssessment?: AvdCompetencyAssessment;
  pirResults?: {
    IP: number;
    ID: number;
    IC: number;
    ES: number;
    FL: number;
    AU: number;
    dominantDimension: string;
  };
  performanceScore?: number;
  competencyScores?: Array<{
    competencyName: string;
    category: string;
    score: number;
  }>;
}

/**
 * Exporta relatório individual de funcionário em Excel
 */
export async function exportEmployeeReportToExcel(data: EmployeeReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Configurações do workbook
  workbook.creator = 'Sistema AVD UISA';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Aba 1: Dados Pessoais
  const personalSheet = workbook.addWorksheet('Dados Pessoais');
  personalSheet.columns = [
    { header: 'Campo', key: 'field', width: 25 },
    { header: 'Valor', key: 'value', width: 40 }
  ];
  
  // Estilo do cabeçalho
  personalSheet.getRow(1).font = { bold: true, size: 12 };
  personalSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  personalSheet.getRow(1).font = { ...personalSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
  
  personalSheet.addRows([
    { field: 'Nome', value: data.employee.name },
    { field: 'Código', value: data.employee.employeeCode },
    { field: 'Email', value: data.employee.email || 'N/A' },
    { field: 'CPF', value: data.employee.cpf || 'N/A' },
    { field: 'Data de Admissão', value: data.employee.hireDate ? new Date(data.employee.hireDate).toLocaleDateString('pt-BR') : 'N/A' },
    { field: 'Cargo', value: data.employee.cargo || 'N/A' },
    { field: 'Departamento', value: data.employee.secao || 'N/A' },
    { field: 'Status', value: data.employee.status },
  ]);
  
  // Aba 2: Resultados PIR
  if (data.pirResults) {
    const pirSheet = workbook.addWorksheet('Resultados PIR');
    pirSheet.columns = [
      { header: 'Dimensão', key: 'dimension', width: 30 },
      { header: 'Pontuação', key: 'score', width: 15 },
      { header: 'Percentual', key: 'percentage', width: 15 }
    ];
    
    // Estilo do cabeçalho
    pirSheet.getRow(1).font = { bold: true, size: 12 };
    pirSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    pirSheet.getRow(1).font = { ...pirSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    const totalScore = data.pirResults.IP + data.pirResults.ID + data.pirResults.IC + 
                       data.pirResults.ES + data.pirResults.FL + data.pirResults.AU;
    
    pirSheet.addRows([
      { 
        dimension: 'Influência Pessoal (IP)', 
        score: data.pirResults.IP,
        percentage: `${((data.pirResults.IP / totalScore) * 100).toFixed(1)}%`
      },
      { 
        dimension: 'Influência Direta (ID)', 
        score: data.pirResults.ID,
        percentage: `${((data.pirResults.ID / totalScore) * 100).toFixed(1)}%`
      },
      { 
        dimension: 'Influência Consultiva (IC)', 
        score: data.pirResults.IC,
        percentage: `${((data.pirResults.IC / totalScore) * 100).toFixed(1)}%`
      },
      { 
        dimension: 'Estabilidade (ES)', 
        score: data.pirResults.ES,
        percentage: `${((data.pirResults.ES / totalScore) * 100).toFixed(1)}%`
      },
      { 
        dimension: 'Flexibilidade (FL)', 
        score: data.pirResults.FL,
        percentage: `${((data.pirResults.FL / totalScore) * 100).toFixed(1)}%`
      },
      { 
        dimension: 'Autonomia (AU)', 
        score: data.pirResults.AU,
        percentage: `${((data.pirResults.AU / totalScore) * 100).toFixed(1)}%`
      },
    ]);
    
    // Adicionar linha de dimensão dominante
    pirSheet.addRow({});
    const dominantRow = pirSheet.addRow({ 
      dimension: 'Dimensão Dominante', 
      score: data.pirResults.dominantDimension 
    });
    dominantRow.font = { bold: true };
    dominantRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };
  }
  
  // Aba 3: Avaliação de Competências
  if (data.competencyScores && data.competencyScores.length > 0) {
    const compSheet = workbook.addWorksheet('Competências');
    compSheet.columns = [
      { header: 'Competência', key: 'competency', width: 35 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Pontuação', key: 'score', width: 15 }
    ];
    
    // Estilo do cabeçalho
    compSheet.getRow(1).font = { bold: true, size: 12 };
    compSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    compSheet.getRow(1).font = { ...compSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    data.competencyScores.forEach(comp => {
      compSheet.addRow({
        competency: comp.competencyName,
        category: comp.category,
        score: comp.score
      });
    });
    
    // Adicionar média
    compSheet.addRow({});
    const avgScore = data.competencyScores.reduce((sum, c) => sum + c.score, 0) / data.competencyScores.length;
    const avgRow = compSheet.addRow({
      competency: 'Média Geral',
      score: avgScore.toFixed(2)
    });
    avgRow.font = { bold: true };
    avgRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };
  }
  
  // Aba 4: Resumo Geral
  const summarySheet = workbook.addWorksheet('Resumo');
  summarySheet.columns = [
    { header: 'Indicador', key: 'indicator', width: 30 },
    { header: 'Valor', key: 'value', width: 20 }
  ];
  
  // Estilo do cabeçalho
  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF5B9BD5' }
  };
  summarySheet.getRow(1).font = { ...summarySheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
  
  summarySheet.addRows([
    { indicator: 'Status do Processo', value: data.process?.status || 'N/A' },
    { indicator: 'Passo Atual', value: data.process?.currentStep ? `Passo ${data.process.currentStep}` : 'N/A' },
    { indicator: 'Pontuação de Desempenho', value: data.performanceScore ? `${data.performanceScore.toFixed(2)}` : 'N/A' },
    { indicator: 'Data de Início', value: data.process?.createdAt ? new Date(data.process.createdAt).toLocaleDateString('pt-BR') : 'N/A' },
  ]);
  
  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Exporta relatório consolidado de múltiplos funcionários
 */
export async function exportConsolidatedReportToExcel(
  employees: Array<EmployeeReportData>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Sistema AVD UISA';
  workbook.created = new Date();
  
  // Aba consolidada
  const consolidatedSheet = workbook.addWorksheet('Relatório Consolidado');
  consolidatedSheet.columns = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Cargo', key: 'position', width: 25 },
    { header: 'Departamento', key: 'department', width: 25 },
    { header: 'Status Processo', key: 'processStatus', width: 20 },
    { header: 'Passo Atual', key: 'currentStep', width: 15 },
    { header: 'Pontuação Desempenho', key: 'performanceScore', width: 20 },
    { header: 'Dimensão PIR Dominante', key: 'pirDominant', width: 25 },
  ];
  
  // Estilo do cabeçalho
  consolidatedSheet.getRow(1).font = { bold: true, size: 12 };
  consolidatedSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  consolidatedSheet.getRow(1).font = { ...consolidatedSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
  
  // Adicionar dados
  employees.forEach(emp => {
    consolidatedSheet.addRow({
      name: emp.employee.name,
      code: emp.employee.employeeCode,
      position: emp.employee.cargo || 'N/A',
      department: emp.employee.secao || 'N/A',
      processStatus: emp.process?.status || 'N/A',
      currentStep: emp.process?.currentStep || 'N/A',
      performanceScore: emp.performanceScore ? emp.performanceScore.toFixed(2) : 'N/A',
      pirDominant: emp.pirResults?.dominantDimension || 'N/A',
    });
  });
  
  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
