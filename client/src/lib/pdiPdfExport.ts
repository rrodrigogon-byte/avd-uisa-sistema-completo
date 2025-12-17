import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utilitário para exportação de PDI para PDF usando jsPDF
 * Gera PDF profissional com formatação similar ao HTML
 */

interface PDIData {
  employee?: {
    name?: string;
    cargo?: string;
  };
  plan: {
    status: string;
    overallProgress?: number;
    createdAt: Date;
  };
  kpis?: {
    currentPosition?: string;
    reframing?: string;
    newPosition?: string;
    performancePlanMonths?: number;
  };
  competencies?: Array<{
    competency: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
  }>;
  actionPlan?: {
    practice70Title?: string;
    practice70Items?: string[];
    social20Title?: string;
    social20Items?: string[];
    formal10Title?: string;
    formal10Items?: string[];
  };
  remunerationStrategy?: {
    title?: string;
    description?: string;
    midpoint?: string;
  };
  remunerationMovements?: Array<{
    level: string;
    deadline: string;
    trigger: string;
    mechanism?: string;
    projectedSalary: string;
    positionInRange: string;
  }>;
  responsibilities?: {
    employeeItems?: string[];
    leadershipItems?: string[];
    dhoItems?: string[];
  };
}

const COLORS = {
  primary: '#002D62',    // UISA Blue
  secondary: '#65B32E',  // UISA Green
  accent: '#00A6ED',     // UISA Light Blue
  orange: '#F58220',     // UISA Orange
  gray: '#6B7280',
  lightGray: '#F3F4F6',
};

export async function exportPDIToPDF(pdi: PDIData) {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Função auxiliar para adicionar título de seção
  const addSectionTitle = (title: string, color: string = COLORS.primary) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color);
    doc.text(title, margin, yPosition);
    yPosition += 10;
  };

  // Função auxiliar para adicionar texto normal
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    checkPageBreak(8);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(COLORS.gray);
    
    // Quebra de linha automática
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak(8);
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
  };

  // Função auxiliar para adicionar lista
  const addList = (items: string[], bulletColor: string = COLORS.primary) => {
    items.forEach(item => {
      checkPageBreak(10);
      doc.setFillColor(bulletColor);
      doc.circle(margin + 2, yPosition - 2, 1.5, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.gray);
      
      const lines = doc.splitTextToSize(item, contentWidth - 10);
      lines.forEach((line: string, index: number) => {
        if (index > 0) checkPageBreak(6);
        doc.text(line, margin + 8, yPosition);
        yPosition += 6;
      });
      yPosition += 2;
    });
  };

  // === CABEÇALHO ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('Plano de Desenvolvimento Individual', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(14);
  doc.setTextColor(COLORS.orange);
  doc.text(pdi.employee?.name || 'Colaborador', margin, yPosition);
  yPosition += 12;

  // === INFORMAÇÕES DO COLABORADOR ===
  addSectionTitle('Informações do Colaborador');
  
  const employeeInfo = [
    ['Nome', pdi.employee?.name || 'N/A'],
    ['Cargo Atual', pdi.employee?.cargo || 'N/A'],
    ['Status', getStatusLabel(pdi.plan.status)],
    ['Progresso Geral', `${pdi.plan.overallProgress || 0}%`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: employeeInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.gray, cellWidth: 50 },
      1: { textColor: COLORS.gray },
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === KPIs ===
  if (pdi.kpis) {
    checkPageBreak(30);
    addSectionTitle('Indicadores de Performance (KPIs)', COLORS.secondary);

    const kpiData = [];
    if (pdi.kpis.currentPosition) kpiData.push(['Posição Atual', pdi.kpis.currentPosition]);
    if (pdi.kpis.reframing) kpiData.push(['Reenquadramento', pdi.kpis.reframing]);
    if (pdi.kpis.newPosition) kpiData.push(['Nova Posição', pdi.kpis.newPosition]);
    if (pdi.kpis.performancePlanMonths) kpiData.push(['Plano de Performance', `${pdi.kpis.performancePlanMonths} meses`]);

    if (kpiData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        body: kpiData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: COLORS.lightGray },
          1: { fontStyle: 'bold', textColor: COLORS.primary },
        },
        margin: { left: margin, right: margin },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // === COMPETÊNCIAS ===
  if (pdi.competencies && pdi.competencies.length > 0) {
    checkPageBreak(30);
    addSectionTitle('Desenvolvimento de Competências', COLORS.accent);

    const competencyData = pdi.competencies.map(comp => [
      comp.competency,
      comp.currentLevel.toString(),
      comp.targetLevel.toString(),
      comp.gap.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Competência', 'Nível Atual', 'Nível Alvo', 'Gap']],
      body: competencyData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.accent, textColor: '#FFFFFF' },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // === PLANO DE AÇÃO 70-20-10 ===
  if (pdi.actionPlan) {
    checkPageBreak(20);
    addSectionTitle('Plano de Ação 70-20-10', COLORS.orange);

    // 70% - Prática
    if (pdi.actionPlan.practice70Items && pdi.actionPlan.practice70Items.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.orange);
      doc.text(pdi.actionPlan.practice70Title || '70% - Aprendizado na Prática', margin, yPosition);
      yPosition += 8;
      addList(pdi.actionPlan.practice70Items, COLORS.orange);
      yPosition += 5;
    }

    // 20% - Social
    if (pdi.actionPlan.social20Items && pdi.actionPlan.social20Items.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.accent);
      doc.text(pdi.actionPlan.social20Title || '20% - Aprendizado com Outros', margin, yPosition);
      yPosition += 8;
      addList(pdi.actionPlan.social20Items, COLORS.accent);
      yPosition += 5;
    }

    // 10% - Formal
    if (pdi.actionPlan.formal10Items && pdi.actionPlan.formal10Items.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.secondary);
      doc.text(pdi.actionPlan.formal10Title || '10% - Aprendizado Formal', margin, yPosition);
      yPosition += 8;
      addList(pdi.actionPlan.formal10Items, COLORS.secondary);
      yPosition += 5;
    }
  }

  // === ESTRATÉGIA DE REMUNERAÇÃO ===
  if (pdi.remunerationStrategy) {
    checkPageBreak(20);
    addSectionTitle(pdi.remunerationStrategy.title || 'Estratégia de Remuneração', COLORS.primary);

    if (pdi.remunerationStrategy.description) {
      addText(pdi.remunerationStrategy.description);
      yPosition += 3;
    }

    if (pdi.remunerationStrategy.midpoint) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.gray);
      doc.text(`Ponto Médio: ${pdi.remunerationStrategy.midpoint}`, margin, yPosition);
      yPosition += 8;
    }

    if (pdi.remunerationMovements && pdi.remunerationMovements.length > 0) {
      checkPageBreak(40);
      const movementData = pdi.remunerationMovements.map(mov => [
        mov.level,
        mov.deadline,
        mov.trigger,
        mov.projectedSalary,
        mov.positionInRange,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Nível', 'Prazo', 'Gatilho/Meta', 'Salário Projetado', 'Posição']],
        body: movementData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary, textColor: '#FFFFFF' },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // === RESPONSABILIDADES ===
  if (pdi.responsibilities) {
    checkPageBreak(20);
    addSectionTitle('Pacto de Performance e Responsabilidades', COLORS.secondary);

    if (pdi.responsibilities.employeeItems && pdi.responsibilities.employeeItems.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.orange);
      doc.text('Responsabilidades do Colaborador', margin, yPosition);
      yPosition += 8;
      addList(pdi.responsibilities.employeeItems, COLORS.orange);
      yPosition += 5;
    }

    if (pdi.responsibilities.leadershipItems && pdi.responsibilities.leadershipItems.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary);
      doc.text('Responsabilidades da Liderança', margin, yPosition);
      yPosition += 8;
      addList(pdi.responsibilities.leadershipItems, COLORS.primary);
      yPosition += 5;
    }

    if (pdi.responsibilities.dhoItems && pdi.responsibilities.dhoItems.length > 0) {
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.secondary);
      doc.text('Responsabilidades do DHO', margin, yPosition);
      yPosition += 8;
      addList(pdi.responsibilities.dhoItems, COLORS.secondary);
      yPosition += 5;
    }
  }

  // === RODAPÉ ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gray);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  const fileName = `PDI_${pdi.employee?.name?.replace(/\s+/g, '_') || 'Colaborador'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    rascunho: 'Rascunho',
    pendente_aprovacao: 'Pendente Aprovação',
    aprovado: 'Aprovado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };
  return labels[status] || status;
}
