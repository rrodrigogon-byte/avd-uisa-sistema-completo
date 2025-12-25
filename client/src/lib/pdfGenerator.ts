import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APP_TITLE, APP_LOGO } from '@/const';

/**
 * Utilitário para geração de PDFs profissionais
 * Suporta diferentes tipos de relatórios do sistema AVD UISA
 */

interface PDFOptions {
  title: string;
  subtitle?: string;
  author?: string;
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
}

/**
 * Gera PDF a partir de um elemento HTML
 */
export async function generatePDFFromElement(
  elementId: string,
  filename: string,
  options: PDFOptions = { title: 'Relatório', includeHeader: true, includeFooter: true }
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento com ID "${elementId}" não encontrado`);
  }

  try {
    // Captura o elemento como imagem
    const canvas = await html2canvas(element, {
      scale: 2, // Maior qualidade
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // Margem de 10mm de cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;

    // Adiciona cabeçalho
    if (options.includeHeader) {
      yPosition = addHeader(pdf, options.title, options.subtitle);
    }

    // Adiciona a imagem
    if (imgHeight > pageHeight - yPosition - 20) {
      // Se a imagem for maior que uma página, divide em múltiplas páginas
      let remainingHeight = imgHeight;
      let sourceY = 0;
      
      while (remainingHeight > 0) {
        const availableHeight = pageHeight - yPosition - 20;
        const heightToPrint = Math.min(remainingHeight, availableHeight);
        
        pdf.addImage(
          imgData,
          'PNG',
          10,
          yPosition,
          imgWidth,
          heightToPrint,
          undefined,
          'FAST',
          0
        );

        remainingHeight -= heightToPrint;
        sourceY += heightToPrint;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 10;
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    }

    // Adiciona rodapé
    if (options.includeFooter) {
      addFooter(pdf);
    }

    // Salva o PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF. Por favor, tente novamente.');
  }
}

/**
 * Gera PDF com conteúdo personalizado
 */
export function generateCustomPDF(
  content: PDFContent,
  filename: string,
  options: PDFOptions = { title: 'Relatório', includeHeader: true, includeFooter: true }
): void {
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPosition = 10;

  // Adiciona cabeçalho
  if (options.includeHeader) {
    yPosition = addHeader(pdf, options.title, options.subtitle);
  }

  // Adiciona conteúdo
  content.sections.forEach((section) => {
    yPosition = addSection(pdf, section, yPosition);
  });

  // Adiciona rodapé
  if (options.includeFooter) {
    addFooter(pdf);
  }

  pdf.save(filename);
}

/**
 * Adiciona cabeçalho ao PDF
 */
function addHeader(pdf: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 15;

  // Logo (se disponível)
  // TODO: Adicionar logo quando disponível
  // pdf.addImage(APP_LOGO, 'PNG', 10, 10, 30, 10);

  // Título
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Subtítulo
  if (subtitle) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  }

  // Linha separadora
  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 8;

  return yPosition;
}

/**
 * Adiciona rodapé ao PDF
 */
function addFooter(pdf: jsPDF): void {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Linha separadora
    pdf.setLineWidth(0.5);
    pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

    // Informações do rodapé
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Data de geração
    const date = new Date().toLocaleDateString('pt-BR');
    pdf.text(`Gerado em: ${date}`, 10, pageHeight - 10);
    
    // Número da página
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    
    // Nome do sistema
    pdf.text(APP_TITLE, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

/**
 * Adiciona uma seção ao PDF
 */
function addSection(pdf: jsPDF, section: PDFSection, yPosition: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginBottom = 20;

  // Verifica se precisa adicionar nova página
  if (yPosition > pageHeight - marginBottom) {
    pdf.addPage();
    yPosition = 10;
  }

  // Título da seção
  if (section.title) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.title, 10, yPosition);
    yPosition += 8;
  }

  // Conteúdo da seção
  if (section.content) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lines = pdf.splitTextToSize(section.content, pageWidth - 20);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - marginBottom) {
        pdf.addPage();
        yPosition = 10;
      }
      pdf.text(line, 10, yPosition);
      yPosition += 5;
    });
  }

  // Tabela
  if (section.table) {
    yPosition = addTable(pdf, section.table, yPosition);
  }

  yPosition += 5; // Espaço entre seções

  return yPosition;
}

/**
 * Adiciona uma tabela ao PDF
 */
function addTable(pdf: jsPDF, table: PDFTable, yPosition: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginBottom = 20;
  const tableWidth = pageWidth - 20;
  const columnWidth = tableWidth / table.headers.length;

  // Cabeçalho da tabela
  pdf.setFillColor(41, 128, 185);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');

  if (yPosition > pageHeight - marginBottom) {
    pdf.addPage();
    yPosition = 10;
  }

  pdf.rect(10, yPosition - 5, tableWidth, 8, 'F');
  
  table.headers.forEach((header, index) => {
    pdf.text(header, 10 + (index * columnWidth) + 2, yPosition);
  });
  
  yPosition += 8;

  // Linhas da tabela
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  table.rows.forEach((row, rowIndex) => {
    if (yPosition > pageHeight - marginBottom) {
      pdf.addPage();
      yPosition = 10;
    }

    // Cor alternada para linhas
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, tableWidth, 8, 'F');
    }

    row.forEach((cell, cellIndex) => {
      pdf.text(String(cell), 10 + (cellIndex * columnWidth) + 2, yPosition);
    });

    yPosition += 8;
  });

  return yPosition + 5;
}

// Tipos auxiliares
export interface PDFContent {
  sections: PDFSection[];
}

export interface PDFSection {
  title?: string;
  content?: string;
  table?: PDFTable;
}

export interface PDFTable {
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Gera PDF de resultado PIR
 */
export async function generatePIRResultPDF(
  employeeName: string,
  dimensions: { dimension: string; score: number; description: string }[],
  totalScore: number,
  date: string
): Promise<void> {
  const content: PDFContent = {
    sections: [
      {
        title: 'Informações do Avaliado',
        content: `Nome: ${employeeName}\nData da Avaliação: ${date}\nPontuação Total: ${totalScore.toFixed(1)}`
      },
      {
        title: 'Resultados por Dimensão',
        table: {
          headers: ['Dimensão', 'Pontuação', 'Descrição'],
          rows: dimensions.map(d => [d.dimension, d.score.toFixed(1), d.description])
        }
      }
    ]
  };

  generateCustomPDF(content, `PIR_${employeeName}_${date}.pdf`, {
    title: 'Relatório PIR - Perfil Individual de Referência',
    subtitle: employeeName,
    includeHeader: true,
    includeFooter: true
  });
}

/**
 * Gera PDF de resultado de Competências
 */
export async function generateCompetencyResultPDF(
  employeeName: string,
  competencies: { category: string; competency: string; score: number }[],
  averageScore: number,
  date: string
): Promise<void> {
  const content: PDFContent = {
    sections: [
      {
        title: 'Informações do Avaliado',
        content: `Nome: ${employeeName}\nData da Avaliação: ${date}\nPontuação Média: ${averageScore.toFixed(1)}`
      },
      {
        title: 'Avaliação de Competências',
        table: {
          headers: ['Categoria', 'Competência', 'Pontuação'],
          rows: competencies.map(c => [c.category, c.competency, c.score.toFixed(1)])
        }
      }
    ]
  };

  generateCustomPDF(content, `Competencias_${employeeName}_${date}.pdf`, {
    title: 'Relatório de Avaliação de Competências',
    subtitle: employeeName,
    includeHeader: true,
    includeFooter: true
  });
}

/**
 * Gera PDF de PDI (Plano de Desenvolvimento Individual)
 */
export async function generatePDIPDF(
  employeeName: string,
  goals: { goal: string; actions: string[]; deadline: string; status: string }[],
  date: string
): Promise<void> {
  const sections: PDFSection[] = [
    {
      title: 'Informações do Colaborador',
      content: `Nome: ${employeeName}\nData de Criação do PDI: ${date}`
    }
  ];

  goals.forEach((goal, index) => {
    sections.push({
      title: `Meta ${index + 1}: ${goal.goal}`,
      content: `Prazo: ${goal.deadline}\nStatus: ${goal.status}\n\nAções:\n${goal.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    });
  });

  const content: PDFContent = { sections };

  generateCustomPDF(content, `PDI_${employeeName}_${date}.pdf`, {
    title: 'Plano de Desenvolvimento Individual (PDI)',
    subtitle: employeeName,
    includeHeader: true,
    includeFooter: true
  });
}
