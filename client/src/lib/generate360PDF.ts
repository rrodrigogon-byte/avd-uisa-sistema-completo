import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Evaluation360Data {
  evaluation: {
    id: number;
    employeeId: number;
    cycleId: number;
    finalScore: number | null;
  };
  averages: {
    self: number;
    manager: number;
    peers: number;
    subordinates: number;
  };
  responses: {
    self: any[];
    manager: any[];
    peers: any[];
    subordinates: any[];
  };
}

export async function generate360PDF(data: Evaluation360Data, employeeName: string = "Colaborador") {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Título
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório de Avaliação 360°', margin, yPosition);
  yPosition += 15;

  // Informações Básicas
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Colaborador: ${employeeName}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`ID da Avaliação: #${data.evaluation.id}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Ciclo: ${data.evaluation.cycleId}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
  yPosition += 15;

  // Linha divisória
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Nota Final
  if (data.evaluation.finalScore !== null) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nota Final', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(24);
    pdf.setTextColor(99, 102, 241); // Primary color
    pdf.text(data.evaluation.finalScore.toFixed(1), margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;
  }

  // Médias por Tipo de Avaliador
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Médias por Tipo de Avaliador', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const evaluatorTypes = [
    { label: 'Autoavaliação', value: data.averages.self, color: [59, 130, 246] },
    { label: 'Gestor', value: data.averages.manager, color: [168, 85, 247] },
    { label: 'Pares', value: data.averages.peers, color: [34, 197, 94] },
    { label: 'Subordinados', value: data.averages.subordinates, color: [249, 115, 22] },
  ];

  evaluatorTypes.forEach(({ label, value, color }) => {
    pdf.setTextColor(0, 0, 0);
    pdf.text(label, margin, yPosition);
    
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value.toFixed(1), margin + 60, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    yPosition += 7;
  });

  pdf.setTextColor(0, 0, 0);
  yPosition += 10;

  // Estatísticas de Respostas
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estatísticas de Respostas', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const stats = [
    { label: 'Autoavaliação', count: data.responses.self.length },
    { label: 'Gestor', count: data.responses.manager.length },
    { label: 'Pares', count: data.responses.peers.length },
    { label: 'Subordinados', count: data.responses.subordinates.length },
  ];

  stats.forEach(({ label, count }) => {
    pdf.text(`${label}: ${count} respostas`, margin, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Análise Comparativa
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Análise Comparativa', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const avgAll = (data.averages.self + data.averages.manager + data.averages.peers + data.averages.subordinates) / 4;
  pdf.text(`Média Geral: ${avgAll.toFixed(2)}`, margin, yPosition);
  yPosition += 7;

  const maxAvg = Math.max(data.averages.self, data.averages.manager, data.averages.peers, data.averages.subordinates);
  const minAvg = Math.min(data.averages.self, data.averages.manager, data.averages.peers, data.averages.subordinates);
  const variance = maxAvg - minAvg;

  pdf.text(`Variação entre avaliadores: ${variance.toFixed(2)}`, margin, yPosition);
  yPosition += 7;

  if (variance < 0.5) {
    pdf.text('✓ Avaliações consistentes (baixa variação)', margin, yPosition);
  } else if (variance < 1.0) {
    pdf.text('⚠ Avaliações moderadamente variadas', margin, yPosition);
  } else {
    pdf.text('⚠ Avaliações significativamente divergentes', margin, yPosition);
  }
  yPosition += 15;

  // Recomendações
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recomendações de Desenvolvimento', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const recommendations = [];

  if (data.averages.self > data.averages.manager + 0.5) {
    recommendations.push('• Considere alinhar autopercepção com a visão do gestor');
  }

  if (data.averages.peers < avgAll - 0.5) {
    recommendations.push('• Foco em melhorar relacionamento e colaboração com pares');
  }

  if (data.averages.subordinates < avgAll - 0.5) {
    recommendations.push('• Desenvolver habilidades de liderança e gestão de equipe');
  }

  if (variance > 1.0) {
    recommendations.push('• Buscar feedback adicional para entender divergências nas avaliações');
  }

  if (avgAll >= 4.0) {
    recommendations.push('• Desempenho excelente! Considere assumir projetos de maior complexidade');
  } else if (avgAll < 3.0) {
    recommendations.push('• Elaborar Plano de Desenvolvimento Individual (PDI) focado nas áreas de melhoria');
  }

  if (recommendations.length === 0) {
    recommendations.push('• Manter o bom desempenho e buscar oportunidades de crescimento contínuo');
  }

  recommendations.forEach(rec => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }
    const lines = pdf.splitTextToSize(rec, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
  });

  // Rodapé
  const footerY = pageHeight - 10;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Sistema AVD UISA - Avaliação de Desempenho', margin, footerY);
  pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin - 50, footerY);

  // Salvar PDF
  pdf.save(`Relatorio_360_${data.evaluation.id}_${Date.now()}.pdf`);
}

export async function generate360PDFWithChart(
  data: Evaluation360Data,
  employeeName: string = "Colaborador",
  chartElement?: HTMLElement
) {
  // Se houver elemento de gráfico, capturar como imagem
  if (chartElement) {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Adicionar informações básicas
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relatório de Avaliação 360°', margin, margin);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Colaborador: ${employeeName}`, margin, margin + 15);
    pdf.text(`ID: #${data.evaluation.id} | Ciclo: ${data.evaluation.cycleId}`, margin, margin + 22);

    // Adicionar gráfico
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin + 30, imgWidth, imgHeight);

    // Continuar com o restante do relatório
    pdf.addPage();
    let yPosition = margin;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Médias Detalhadas', margin, yPosition);
    yPosition += 10;

    // ... (resto do conteúdo do PDF)

    pdf.save(`Relatorio_360_${data.evaluation.id}_${Date.now()}.pdf`);
  } else {
    // Fallback para versão sem gráfico
    await generate360PDF(data, employeeName);
  }
}
