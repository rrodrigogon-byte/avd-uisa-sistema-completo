import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Utilitário de Exportação PDF de Calibração
 * Gera relatórios consolidados de movimentações e aprovações
 */

interface CalibrationData {
  employee: {
    name: string;
    employeeCode: string;
    department: string;
    position: string;
  };
  movement: {
    fromPerformance: string;
    fromPotential: string;
    toPerformance: string;
    toPotential: string;
    justification: string;
    createdAt: Date;
  };
  approvals: Array<{
    approverName: string;
    approverRole: string;
    status: string;
    evidence?: string;
    comments?: string;
    approvedAt?: Date;
  }>;
}

/**
 * Gerar PDF de relatório de calibração individual
 */
export async function generateCalibrationPDF(data: CalibrationData): Promise<Buffer> {
  const doc = new jsPDF() as any;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0); // #F39200
  doc.text("Relatório de Calibração", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 28, { align: "center" });

  // Linha divisória
  doc.setDrawColor(243, 146, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Informações do Colaborador
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Informações do Colaborador", 20, 42);

  const employeeInfo = [
    ["Nome", data.employee.name],
    ["Matrícula", data.employee.employeeCode],
    ["Departamento", data.employee.department],
    ["Cargo", data.employee.position],
  ];

  autoTable(doc, {
    startY: 46,
    head: [],
    body: employeeInfo,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 140 },
    },
  });

  // Movimentação
  const finalY1 = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text("Movimentação no Nine Box", 20, finalY1);

  const movementInfo = [
    [
      "Posição Anterior",
      `${data.movement.fromPerformance.toUpperCase()} Desempenho • ${data.movement.fromPotential.toUpperCase()} Potencial`,
    ],
    [
      "Nova Posição",
      `${data.movement.toPerformance.toUpperCase()} Desempenho • ${data.movement.toPotential.toUpperCase()} Potencial`,
    ],
    ["Data da Movimentação", new Date(data.movement.createdAt).toLocaleDateString("pt-BR")],
  ];

  autoTable(doc, {
    startY: finalY1 + 4,
    head: [],
    body: movementInfo,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 140 },
    },
  });

  // Justificativa
  const finalY2 = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Justificativa:", 20, finalY2);

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  const justificationLines = doc.splitTextToSize(data.movement.justification, 170);
  doc.text(justificationLines, 20, finalY2 + 6);

  // Workflow de Aprovação
  const finalY3 = finalY2 + 6 + justificationLines.length * 5 + 10;
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Workflow de Aprovação", 20, finalY3);

  const approvalRows = data.approvals.map((approval) => [
    approval.approverName,
    getRoleName(approval.approverRole),
    getStatusName(approval.status),
    approval.approvedAt ? new Date(approval.approvedAt).toLocaleDateString("pt-BR") : "-",
  ]);

  autoTable(doc, {
    startY: finalY3 + 4,
    head: [["Aprovador", "Nível", "Status", "Data"]],
    body: approvalRows,
    theme: "striped",
    headStyles: { fillColor: [243, 146, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
  });

  // Evidências e Comentários
  const finalY4 = doc.lastAutoTable.finalY + 10;
  let currentY = finalY4;

  for (const approval of data.approvals) {
    if (approval.evidence || approval.comments) {
      // Verificar se precisa de nova página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`${approval.approverName} (${getRoleName(approval.approverRole)})`, 20, currentY);

      currentY += 6;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      if (approval.evidence) {
        doc.setFont(undefined, "bold");
        doc.text("Evidências:", 20, currentY);
        currentY += 5;
        doc.setFont(undefined, "normal");
        const evidenceLines = doc.splitTextToSize(approval.evidence, 170);
        doc.text(evidenceLines, 20, currentY);
        currentY += evidenceLines.length * 5 + 5;
      }

      if (approval.comments) {
        doc.setFont(undefined, "bold");
        doc.text("Comentários:", 20, currentY);
        currentY += 5;
        doc.setFont(undefined, "normal");
        const commentLines = doc.splitTextToSize(approval.comments, 170);
        doc.text(commentLines, 20, currentY);
        currentY += commentLines.length * 5 + 10;
      }
    }
  }

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Sistema AVD UISA - Página ${i} de ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Gerar PDF consolidado de calibrações
 */
export async function generateConsolidatedCalibrationPDF(
  calibrations: CalibrationData[]
): Promise<Buffer> {
  const doc = new jsPDF() as any;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0);
  doc.text("Relatório Consolidado de Calibrações", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 28, { align: "center" });
  doc.text(`Total de Calibrações: ${calibrations.length}`, 105, 34, { align: "center" });

  // Linha divisória
  doc.setDrawColor(243, 146, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // Tabela consolidada
  const rows = calibrations.map((cal) => [
    cal.employee.name,
    cal.employee.department,
    `${cal.movement.fromPerformance}/${cal.movement.fromPotential}`,
    `${cal.movement.toPerformance}/${cal.movement.toPotential}`,
    cal.approvals.every((a) => a.status === "approved") ? "Aprovado" : "Pendente",
    new Date(cal.movement.createdAt).toLocaleDateString("pt-BR"),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [["Colaborador", "Departamento", "De", "Para", "Status", "Data"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [243, 146, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
  });

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Sistema AVD UISA - Página ${i} de ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function getRoleName(role: string): string {
  switch (role) {
    case "hr":
      return "RH";
    case "people_director":
      return "Diretor de Gente";
    case "area_director":
      return "Diretor de Área";
    default:
      return role;
  }
}

function getStatusName(status: string): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "approved":
      return "Aprovado";
    case "rejected":
      return "Rejeitado";
    default:
      return status;
  }
}
