import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Gerar PDF de Aprovação de Bônus para Assinatura
 * Documento oficial para assinatura do Diretor de Gente e envio ao Financeiro
 */

interface BonusApprovalData {
  approvalId: number;
  cycleName: string;
  employeeName: string;
  employeeId: number;
  positionName: string;
  departmentName: string;
  eligibleAmount: number;
  extraBonusPercentage: number;
  finalAmount: number;
  approvalHistory: Array<{
    level: number;
    approverName: string;
    approverRole: string;
    status: string;
    approvedAt: string;
    comments?: string;
  }>;
  generatedAt: string;
}

export async function generateBonusApprovalPDF(data: BonusApprovalData): Promise<Buffer> {
  const doc = new jsPDF() as any;

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // ==================== CABEÇALHO ====================
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AUTORIZAÇÃO DE PAGAMENTO DE BÔNUS", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Documento Nº ${String(data.approvalId).padStart(6, "0")}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // ==================== DADOS DO COLABORADOR ====================
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO COLABORADOR", margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const collaboratorData = [
    ["Nome:", data.employeeName],
    ["Matrícula:", String(data.employeeId)],
    ["Cargo:", data.positionName],
    ["Departamento:", data.departmentName],
    ["Ciclo de Avaliação:", data.cycleName],
  ];

  collaboratorData.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 50, yPos);
    yPos += 7;
  });

  yPos += 5;

  // ==================== CÁLCULO DO BÔNUS ====================
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CÁLCULO DO BÔNUS", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Descrição", "Valor"]],
    body: [
      ["Bônus Elegível (baseado em metas)", `R$ ${data.eligibleAmount.toFixed(2)}`],
      [
        `Bônus Extra (${data.extraBonusPercentage.toFixed(1)}%)`,
        `R$ ${(data.eligibleAmount * (data.extraBonusPercentage / 100)).toFixed(2)}`,
      ],
      ["", ""],
      [
        {
          content: "VALOR TOTAL A PAGAR",
          styles: { fontStyle: "bold", fontSize: 12 },
        },
        {
          content: `R$ ${data.finalAmount.toFixed(2)}`,
          styles: { fontStyle: "bold", fontSize: 12, fillColor: [243, 146, 0] },
        },
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ==================== HISTÓRICO DE APROVAÇÕES ====================
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("HISTÓRICO DE APROVAÇÕES", margin, yPos);
  yPos += 10;

  const approvalRows = data.approvalHistory.map((approval) => [
    `Nível ${approval.level}`,
    approval.approverName,
    approval.approverRole,
    approval.status === "approved" ? "Aprovado" : "Rejeitado",
    approval.approvedAt,
    approval.comments || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Nível", "Aprovador", "Função", "Status", "Data", "Comentários"]],
    body: approvalRows,
    theme: "grid",
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // ==================== SEÇÃO DE ASSINATURAS ====================
  // Verificar se precisa de nova página
  if (yPos > 220) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ASSINATURAS", margin, yPos);
  yPos += 15;

  // Diretor de Gente
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("_".repeat(60), margin, yPos);
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Diretor de Gente", margin, yPos);
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Autorização Final", margin, yPos);
  yPos += 20;

  // Departamento Financeiro
  doc.setFontSize(11);
  doc.text("_".repeat(60), margin, yPos);
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Departamento Financeiro", margin, yPos);
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Recebido e Processado", margin, yPos);
  yPos += 20;

  // ==================== RODAPÉ ====================
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Documento gerado automaticamente em ${data.generatedAt}`,
    pageWidth / 2,
    yPos + 10,
    { align: "center" }
  );
  doc.text(
    "Este documento possui validade jurídica e deve ser arquivado conforme legislação vigente.",
    pageWidth / 2,
    yPos + 15,
    { align: "center" }
  );

  // ==================== MARCA D'ÁGUA ====================
  doc.setFontSize(60);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENCIAL", pageWidth / 2, 150, {
    align: "center",
    angle: 45,
  });

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Gerar PDF consolidado de bônus por ciclo
 */
export async function generateConsolidatedBonusPDF(
  cycleName: string,
  approvals: Array<{
    employeeName: string;
    departmentName: string;
    eligibleAmount: number;
    finalAmount: number;
    status: string;
  }>
): Promise<Buffer> {
  const doc = new jsPDF() as any;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO CONSOLIDADO DE BÔNUS", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Ciclo: ${cycleName}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Estatísticas
  const totalEligible = approvals.reduce((sum, a) => sum + a.eligibleAmount, 0);
  const totalFinal = approvals.reduce((sum, a) => sum + a.finalAmount, 0);
  const approved = approvals.filter((a) => a.status === "approved").length;

  doc.setFontSize(11);
  doc.text(`Total de Colaboradores: ${approvals.length}`, margin, yPos);
  yPos += 7;
  doc.text(`Aprovados: ${approved}`, margin, yPos);
  yPos += 7;
  doc.text(`Bônus Elegível Total: R$ ${totalEligible.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Bônus Final Total: R$ ${totalFinal.toFixed(2)}`, margin, yPos);
  yPos += 15;

  // Tabela de aprovações
  const rows = approvals.map((approval) => [
    approval.employeeName,
    approval.departmentName,
    `R$ ${approval.eligibleAmount.toFixed(2)}`,
    `R$ ${approval.finalAmount.toFixed(2)}`,
    approval.status === "approved" ? "Aprovado" : approval.status === "pending" ? "Pendente" : "Rejeitado",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Colaborador", "Departamento", "Elegível", "Final", "Status"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 25 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const now = new Date().toLocaleString("pt-BR");
  doc.text(`Gerado em ${now}`, pageWidth / 2, yPos, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
