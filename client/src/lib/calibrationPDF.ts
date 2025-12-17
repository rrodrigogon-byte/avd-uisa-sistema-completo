import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Interface para dados de calibração
 */
interface CalibrationData {
  session: {
    id: number;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
    status: string;
  };
  positions: Array<{
    id: number;
    employeeName: string;
    employeeCode: string;
    position: string;
    department: string;
    performanceBefore: number;
    potentialBefore: number;
    performanceAfter: number;
    potentialAfter: number;
    justification: string;
    evidences?: string | null;
    changedBy: string;
    changedAt: Date;
  }>;
}

/**
 * Gera PDF de relatório de calibração com evidências
 */
export async function generateCalibrationPDF(data: CalibrationData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // ========== CABEÇALHO ==========
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Calibração Nine Box", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // ========== INFORMAÇÕES DA SESSÃO ==========
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Informações da Sessão", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.session.name}`, 14, yPos);
  yPos += 6;

  if (data.session.description) {
    doc.text(`Descrição: ${data.session.description}`, 14, yPos);
    yPos += 6;
  }

  doc.text(`Data de Início: ${new Date(data.session.startDate).toLocaleDateString("pt-BR")}`, 14, yPos);
  yPos += 6;

  if (data.session.endDate) {
    doc.text(`Data de Término: ${new Date(data.session.endDate).toLocaleDateString("pt-BR")}`, 14, yPos);
    yPos += 6;
  }

  doc.text(`Status: ${data.session.status === "active" ? "Ativa" : data.session.status === "completed" ? "Concluída" : "Rascunho"}`, 14, yPos);
  yPos += 12;

  // ========== RESUMO GERAL ==========
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Colaboradores Calibrados: ${data.positions.length}`, 14, yPos);
  yPos += 6;

  const totalChanges = data.positions.filter(
    (p) => p.performanceBefore !== p.performanceAfter || p.potentialBefore !== p.potentialAfter
  ).length;
  doc.text(`Total de Alterações: ${totalChanges}`, 14, yPos);
  yPos += 12;

  // ========== TABELA DE CALIBRAÇÕES ==========
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes das Calibrações", 14, yPos);
  yPos += 8;

  // Tabela com autoTable
  autoTable(doc, {
    startY: yPos,
    head: [["Colaborador", "Chapa", "Cargo", "Perf. Antes", "Pot. Antes", "Perf. Depois", "Pot. Depois", "Alterado?"]],
    body: data.positions.map((p) => [
      p.employeeName,
      p.employeeCode,
      p.position,
      p.performanceBefore.toString(),
      p.potentialBefore.toString(),
      p.performanceAfter.toString(),
      p.potentialAfter.toString(),
      p.performanceBefore !== p.performanceAfter || p.potentialBefore !== p.potentialAfter ? "Sim" : "Não",
    ]),
    theme: "striped",
    headStyles: { fillColor: [243, 146, 0], textColor: 255, fontStyle: "bold" }, // Cor UISA
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 15 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 15, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== JUSTIFICATIVAS E EVIDÊNCIAS ==========
  const changedPositions = data.positions.filter(
    (p) => p.performanceBefore !== p.performanceAfter || p.potentialBefore !== p.potentialAfter
  );

  if (changedPositions.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Justificativas e Evidências", 14, yPos);
    yPos += 10;

    changedPositions.forEach((p, index) => {
      // Verificar se precisa de nova página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${p.employeeName} (${p.employeeCode})`, 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Cargo: ${p.position} | Departamento: ${p.department}`, 14, yPos);
      yPos += 6;

      doc.text(
        `Alteração: Performance ${p.performanceBefore} → ${p.performanceAfter} | Potencial ${p.potentialBefore} → ${p.potentialAfter}`,
        14,
        yPos
      );
      yPos += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Justificativa:", 14, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      const justificationLines = doc.splitTextToSize(p.justification, pageWidth - 28);
      doc.text(justificationLines, 14, yPos);
      yPos += justificationLines.length * 5 + 3;

      if (p.evidences) {
        doc.setFont("helvetica", "bold");
        doc.text("Evidências:", 14, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        const evidencesLines = doc.splitTextToSize(p.evidences, pageWidth - 28);
        doc.text(evidencesLines, 14, yPos);
        yPos += evidencesLines.length * 5 + 3;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Alterado por: ${p.changedBy} em ${new Date(p.changedAt).toLocaleString("pt-BR")}`,
        14,
        yPos
      );
      yPos += 10;
      doc.setTextColor(0);
    });
  }

  // ========== RODAPÉ ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Sistema AVD UISA - Relatório de Calibração | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Salvar PDF
  const fileName = `Calibracao_${data.session.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
