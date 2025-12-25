import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GoalData {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  startDate: string;
  endDate: string;
  smartScore: number;
  bonusPercentage?: number;
  bonusAmount?: number;
  milestones?: Array<{
    title: string;
    description: string;
    dueDate: string;
    status: string;
    progress: number;
  }>;
  comments?: Array<{
    employeeName: string;
    comment: string;
    createdAt: string;
  }>;
}

export function exportGoalToPDF(goal: GoalData, employeeName: string) {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0); // Laranja UISA
  doc.text('Sistema AVD UISA', 105, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Relatório de Meta SMART', 105, 25, { align: 'center' });
  
  // Linha separadora
  doc.setDrawColor(243, 146, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);
  
  // Informações básicas
  doc.setFontSize(12);
  doc.text(`Colaborador: ${employeeName}`, 20, 40);
  doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 47);
  
  // Título da meta
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(goal.title, 20, 57);
  doc.setFont('helvetica', 'normal');
  
  // Categoria e Status
  doc.setFontSize(10);
  doc.text(`Categoria: ${goal.category}`, 20, 64);
  doc.text(`Status: ${goal.status}`, 20, 70);
  doc.text(`Progresso: ${goal.progress}%`, 20, 76);
  
  // Descrição
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição:', 20, 86);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(goal.description, 170);
  doc.text(descLines, 20, 92);
  
  let yPos = 92 + (descLines.length * 5) + 5;
  
  // Tabela de Métricas
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Unidade de Medida', goal.unit],
      ['Valor Alvo', goal.targetValue.toString()],
      ['Valor Atual', goal.currentValue.toString()],
      ['Peso', `${goal.weight}%`],
      ['Data de Início', new Date(goal.startDate).toLocaleDateString('pt-BR')],
      ['Data de Término', new Date(goal.endDate).toLocaleDateString('pt-BR')],
      ['Validação SMART', `${goal.smartScore}/100`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [243, 146, 0] },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Informações de Bônus
  if (goal.bonusPercentage || goal.bonusAmount) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações de Bônus:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 7;
    
    if (goal.bonusPercentage) {
      doc.text(`Bônus Percentual: ${goal.bonusPercentage}%`, 20, yPos);
      yPos += 6;
    }
    if (goal.bonusAmount) {
      doc.text(`Bônus Fixo: R$ ${(goal.bonusAmount / 100).toFixed(2)}`, 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }
  
  // Marcos Intermediários
  if (goal.milestones && goal.milestones.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Marcos Intermediários:', 20, yPos);
    yPos += 7;
    
    const milestoneData = goal.milestones.map(m => [
      m.title,
      m.status,
      `${m.progress}%`,
      new Date(m.dueDate).toLocaleDateString('pt-BR'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Marco', 'Status', 'Progresso', 'Prazo']],
      body: milestoneData,
      theme: 'grid',
      headStyles: { fillColor: [243, 146, 0] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Comentários
  if (goal.comments && goal.comments.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Comentários:', 20, yPos);
    yPos += 7;
    
    const commentData = goal.comments.map(c => [
      c.employeeName,
      c.comment,
      new Date(c.createdAt).toLocaleDateString('pt-BR'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Colaborador', 'Comentário', 'Data']],
      body: commentData,
      theme: 'grid',
      headStyles: { fillColor: [243, 146, 0] },
      columnStyles: {
        1: { cellWidth: 100 },
      },
    });
  }
  
  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Sistema AVD UISA - Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  // Salvar PDF
  const fileName = `Meta_${goal.id}_${goal.title.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
