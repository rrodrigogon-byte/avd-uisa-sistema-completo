import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmployeeReportData } from './excelExport';

/**
 * Módulo de Exportação de Relatórios em PDF
 * Gera relatórios formatados com dados reais do sistema AVD UISA
 */

/**
 * Exporta relatório individual de funcionário em PDF
 */
export async function exportEmployeeReportToPDF(data: EmployeeReportData): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 20;
  
  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Avaliação de Desempenho', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema AVD UISA', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // Seção 1: Dados Pessoais
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Dados Pessoais', margin, yPosition);
  yPosition += 8;
  
  const personalData = [
    ['Nome', data.employee.name],
    ['Código', data.employee.employeeCode],
    ['Email', data.employee.email || 'N/A'],
    ['CPF', data.employee.cpf || 'N/A'],
    ['Data de Admissão', data.employee.hireDate ? new Date(data.employee.hireDate).toLocaleDateString('pt-BR') : 'N/A'],
    ['Cargo', data.employee.cargo || 'N/A'],
    ['Departamento', data.employee.secao || 'N/A'],
    ['Status', data.employee.status],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Campo', 'Valor']],
    body: personalData,
    theme: 'grid',
    headStyles: { fillColor: [68, 114, 196], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Seção 2: Resultados PIR
  if (data.pirResults) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Resultados PIR (Perfil de Identidade de Relacionamento)', margin, yPosition);
    yPosition += 8;
    
    const totalScore = data.pirResults.IP + data.pirResults.ID + data.pirResults.IC + 
                       data.pirResults.ES + data.pirResults.FL + data.pirResults.AU;
    
    const pirData = [
      ['Influência Pessoal (IP)', data.pirResults.IP.toString(), `${((data.pirResults.IP / totalScore) * 100).toFixed(1)}%`],
      ['Influência Direta (ID)', data.pirResults.ID.toString(), `${((data.pirResults.ID / totalScore) * 100).toFixed(1)}%`],
      ['Influência Consultiva (IC)', data.pirResults.IC.toString(), `${((data.pirResults.IC / totalScore) * 100).toFixed(1)}%`],
      ['Estabilidade (ES)', data.pirResults.ES.toString(), `${((data.pirResults.ES / totalScore) * 100).toFixed(1)}%`],
      ['Flexibilidade (FL)', data.pirResults.FL.toString(), `${((data.pirResults.FL / totalScore) * 100).toFixed(1)}%`],
      ['Autonomia (AU)', data.pirResults.AU.toString(), `${((data.pirResults.AU / totalScore) * 100).toFixed(1)}%`],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Dimensão', 'Pontuação', 'Percentual']],
      body: pirData,
      theme: 'grid',
      headStyles: { fillColor: [112, 173, 71], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
    
    // Dimensão dominante
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dimensão Dominante: ${data.pirResults.dominantDimension}`, margin, yPosition);
    yPosition += 15;
  }
  
  // Seção 3: Avaliação de Competências
  if (data.competencyScores && data.competencyScores.length > 0) {
    // Nova página se necessário
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Avaliação de Competências', margin, yPosition);
    yPosition += 8;
    
    const competencyData = data.competencyScores.map(comp => [
      comp.competencyName,
      comp.category,
      comp.score.toString()
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Competência', 'Categoria', 'Pontuação']],
      body: competencyData,
      theme: 'grid',
      headStyles: { fillColor: [255, 192, 0], textColor: 0, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
    
    // Média
    const avgScore = data.competencyScores.reduce((sum, c) => sum + c.score, 0) / data.competencyScores.length;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Média Geral: ${avgScore.toFixed(2)}`, margin, yPosition);
    yPosition += 15;
  }
  
  // Seção 4: Resumo Geral
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Resumo Geral', margin, yPosition);
  yPosition += 8;
  
  const summaryData = [
    ['Status do Processo', data.process?.status || 'N/A'],
    ['Passo Atual', data.process?.currentStep ? `Passo ${data.process.currentStep}` : 'N/A'],
    ['Pontuação de Desempenho', data.performanceScore ? `${data.performanceScore.toFixed(2)}` : 'N/A'],
    ['Data de Início', data.process?.createdAt ? new Date(data.process.createdAt).toLocaleDateString('pt-BR') : 'N/A'],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [91, 155, 213], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // Gerar buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Exporta relatório consolidado de múltiplos funcionários em PDF
 */
export async function exportConsolidatedReportToPDF(
  employees: Array<EmployeeReportData>
): Promise<Buffer> {
  const doc = new jsPDF('landscape'); // Paisagem para mais colunas
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 20;
  
  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Consolidado de Avaliações', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema AVD UISA', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // Tabela consolidada
  const consolidatedData = employees.map(emp => [
    emp.employee.name,
    emp.employee.employeeCode,
    emp.employee.cargo || 'N/A',
    emp.employee.secao || 'N/A',
    emp.process?.status || 'N/A',
    emp.process?.currentStep?.toString() || 'N/A',
    emp.performanceScore ? emp.performanceScore.toFixed(2) : 'N/A',
    emp.pirResults?.dominantDimension || 'N/A',
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Nome', 'Código', 'Cargo', 'Departamento', 'Status', 'Passo', 'Desempenho', 'PIR Dominante']],
    body: consolidatedData,
    theme: 'grid',
    headStyles: { fillColor: [68, 114, 196], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });
  
  // Estatísticas
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Estatísticas Gerais', margin, yPosition);
  yPosition += 8;
  
  const totalEmployees = employees.length;
  const completedProcesses = employees.filter(e => e.process?.status === 'concluido').length;
  const avgPerformance = employees
    .filter(e => e.performanceScore)
    .reduce((sum, e) => sum + (e.performanceScore || 0), 0) / 
    (employees.filter(e => e.performanceScore).length || 1);
  
  const statsData = [
    ['Total de Funcionários', totalEmployees.toString()],
    ['Processos Concluídos', completedProcesses.toString()],
    ['Taxa de Conclusão', `${((completedProcesses / totalEmployees) * 100).toFixed(1)}%`],
    ['Média de Desempenho', avgPerformance.toFixed(2)],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [91, 155, 213], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
    tableWidth: 100,
  });
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // Gerar buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
