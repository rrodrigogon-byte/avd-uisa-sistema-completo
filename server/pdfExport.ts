/**
 * Helper para exportação de resultados de avaliação em PDF
 * Usa jsPDF para gerar PDFs com identidade visual UISA
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface EvaluationData {
  employee: {
    name: string;
    employeeCode: string;
    department: string;
    position: string;
  };
  cycle: {
    name: string;
    year: number;
  };
  scores: {
    selfScore: number;
    managerScore: number;
    finalScore: number;
  };
  competencies: Array<{
    category: string;
    selfAvg: number;
    managerAvg: number;
  }>;
  performanceLevel: string;
  quartile: number;
}

export async function generateEvaluationPDF(data: EvaluationData): Promise<Buffer> {
  const doc = new jsPDF();

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Cores UISA
  const primaryColor = [37, 99, 235]; // #2563eb
  const secondaryColor = [100, 116, 139]; // #64748b
  const accentColor = [16, 185, 129]; // #10b981

  // ============================================================================
  // CABEÇALHO
  // ============================================================================
  
  // Retângulo de cabeçalho
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo e título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AVD UISA", margin, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Avaliação de Desempenho", margin, 30);

  // Data de geração
  doc.setFontSize(9);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - margin - 40,
    30
  );

  // ============================================================================
  // INFORMAÇÕES DO FUNCIONÁRIO
  // ============================================================================

  let yPos = 55;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Resultados da Avaliação de Desempenho", margin, yPos);

  yPos += 15;

  // Card de informações
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...secondaryColor);

  doc.text("Colaborador:", margin + 5, yPos + 8);
  doc.text("Matrícula:", margin + 5, yPos + 16);
  doc.text("Departamento:", margin + 5, yPos + 24);
  doc.text("Cargo:", margin + 5, yPos + 32);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  doc.text(data.employee.name, margin + 35, yPos + 8);
  doc.text(data.employee.employeeCode, margin + 35, yPos + 16);
  doc.text(data.employee.department, margin + 35, yPos + 24);
  doc.text(data.employee.position, margin + 35, yPos + 32);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...secondaryColor);

  doc.text("Ciclo:", pageWidth / 2 + 10, yPos + 8);
  doc.text("Ano:", pageWidth / 2 + 10, yPos + 16);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  doc.text(data.cycle.name, pageWidth / 2 + 25, yPos + 8);
  doc.text(data.cycle.year.toString(), pageWidth / 2 + 25, yPos + 16);

  yPos += 45;

  // ============================================================================
  // RESUMO DE NOTAS
  // ============================================================================

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Resumo de Notas", margin, yPos);

  yPos += 10;

  // Cards de notas
  const cardWidth = (pageWidth - 2 * margin - 20) / 3;
  const cardHeight = 30;

  // Autoavaliação
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Autoavaliação", margin + cardWidth / 2, yPos + 10, { align: "center" });
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.scores.selfScore.toString(), margin + cardWidth / 2, yPos + 24, {
    align: "center",
  });

  // Avaliação Gestor
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + cardWidth + 10, yPos, cardWidth, cardHeight, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Avaliação Gestor", margin + cardWidth + 10 + cardWidth / 2, yPos + 10, {
    align: "center",
  });
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(
    data.scores.managerScore.toString(),
    margin + cardWidth + 10 + cardWidth / 2,
    yPos + 24,
    { align: "center" }
  );

  // Nota Final
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin + 2 * (cardWidth + 10), yPos, cardWidth, cardHeight, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Nota Final", margin + 2 * (cardWidth + 10) + cardWidth / 2, yPos + 10, {
    align: "center",
  });
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(
    data.scores.finalScore.toString(),
    margin + 2 * (cardWidth + 10) + cardWidth / 2,
    yPos + 24,
    { align: "center" }
  );

  yPos += 45;

  // Classificação de desempenho
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Classificação: ", margin, yPos);

  doc.setFont("helvetica", "normal");
  doc.text(data.performanceLevel, margin + 35, yPos);

  doc.text(`Quartil: Q${data.quartile}`, pageWidth / 2 + 10, yPos);

  yPos += 15;

  // ============================================================================
  // DETALHAMENTO POR COMPETÊNCIA
  // ============================================================================

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Detalhamento por Competência", margin, yPos);

  yPos += 5;

  // Tabela de competências
  const tableData = data.competencies.map((comp) => [
    comp.category,
    comp.selfAvg.toFixed(1),
    comp.managerAvg.toFixed(1),
    (comp.selfAvg - comp.managerAvg).toFixed(1),
    comp.managerAvg >= 4 ? "Forte" : comp.managerAvg >= 3 ? "Adequado" : "A Desenvolver",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Competência", "Auto", "Gestor", "Gap", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "center", cellWidth: 20 },
      4: { halign: "center", cellWidth: 40 },
    },
  });

  // ============================================================================
  // RODAPÉ
  // ============================================================================

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  if (finalY < pageHeight - 30) {
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Este documento é confidencial e destinado exclusivamente ao colaborador avaliado.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text("AVD UISA © 2025 - Todos os direitos reservados", pageWidth / 2, pageHeight - 6, {
      align: "center",
    });
  }

  // Converter para buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
