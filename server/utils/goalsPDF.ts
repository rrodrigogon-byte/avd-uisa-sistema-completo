import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Utilitário de Exportação PDF para Metas SMART
 * Gera relatórios individuais e consolidados de metas
 */

interface GoalData {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  status: string;
  progress: number;
  measurementUnit?: string;
  targetValue?: string;
  currentValue?: string;
  weight: number;
  startDate: Date;
  endDate: Date;
  bonusEligible: boolean;
  bonusPercentage?: string;
  bonusAmount?: string;
  isSpecific: boolean;
  isMeasurable: boolean;
  isAchievable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  employeeName?: string;
  cycleName?: string;
  milestones?: any[];
  comments?: any[];
}

/**
 * Gerar PDF de meta individual
 */
export function generateGoalPDF(goal: GoalData): Buffer {
  const doc = new jsPDF();
  let yPos = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0); // Laranja UISA
  doc.text("Sistema AVD UISA", 20, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Relatório de Meta SMART", 20, yPos);
  yPos += 15;

  // Informações Básicas
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Informações da Meta", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const basicInfo = [
    ["Título", goal.title],
    ["Categoria", getCategoryLabel(goal.category)],
    ["Tipo", getTypeLabel(goal.type)],
    ["Status", getStatusLabel(goal.status)],
    ["Progresso", `${goal.progress}%`],
    ["Peso", `${goal.weight}%`],
    ["Colaborador", goal.employeeName || "N/A"],
    ["Ciclo", goal.cycleName || "N/A"],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: basicInfo,
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 140 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Descrição
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Descrição", 20, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const splitDescription = doc.splitTextToSize(goal.description, 170);
  doc.text(splitDescription, 20, yPos);
  yPos += splitDescription.length * 5 + 10;

  // Métricas
  if (goal.measurementUnit && goal.targetValue) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Métricas", 20, yPos);
    yPos += 10;

    const metricsInfo = [
      ["Unidade de Medida", goal.measurementUnit],
      ["Valor Alvo", goal.targetValue],
      ["Valor Atual", goal.currentValue || "0"],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [],
      body: metricsInfo,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 120 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Nova página se necessário
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Datas
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Período", 20, yPos);
  yPos += 10;

  const datesInfo = [
    ["Data de Início", formatDate(goal.startDate)],
    ["Data de Término", formatDate(goal.endDate)],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: datesInfo,
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Critérios SMART
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Validação SMART", 20, yPos);
  yPos += 10;

  const smartScore =
    [
      goal.isSpecific,
      goal.isMeasurable,
      goal.isAchievable,
      goal.isRelevant,
      goal.isTimeBound,
    ].filter(Boolean).length * 20;

  const smartInfo = [
    ["S - Específica", goal.isSpecific ? "✓ Sim" : "✗ Não"],
    ["M - Mensurável", goal.isMeasurable ? "✓ Sim" : "✗ Não"],
    ["A - Atingível", goal.isAchievable ? "✓ Sim" : "✗ Não"],
    ["R - Relevante", goal.isRelevant ? "✓ Sim" : "✗ Não"],
    ["T - Temporal", goal.isTimeBound ? "✓ Sim" : "✗ Não"],
    ["Score Total", `${smartScore}/100`],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: smartInfo,
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Bônus
  if (goal.bonusEligible) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Informações de Bônus", 20, yPos);
    yPos += 10;

    const bonusInfo = [];
    if (goal.bonusPercentage) {
      bonusInfo.push(["Bônus Percentual", `${goal.bonusPercentage}%`]);
    }
    if (goal.bonusAmount) {
      bonusInfo.push(["Bônus Fixo", `R$ ${goal.bonusAmount}`]);
    }

    (doc as any).autoTable({
      startY: yPos,
      head: [],
      body: bonusInfo,
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 120 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Marcos
  if (goal.milestones && goal.milestones.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Marcos Intermediários (${goal.milestones.length})`, 20, yPos);
    yPos += 10;

    const milestonesData = goal.milestones.map((m) => [
      m.title,
      formatDate(m.dueDate),
      `${m.progress || 0}%`,
      getMilestoneStatusLabel(m.status),
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [["Marco", "Prazo", "Progresso", "Status"]],
      body: milestonesData,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 146, 0], textColor: 255 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      20,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 180, 285);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Gerar PDF consolidado de múltiplas metas
 */
export function generateGoalsConsolidatedPDF(
  goals: GoalData[],
  title: string = "Relatório Consolidado de Metas"
): Buffer {
  const doc = new jsPDF();
  let yPos = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0);
  doc.text("Sistema AVD UISA", 20, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, yPos);
  yPos += 15;

  // Resumo Executivo
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", 20, yPos);
  yPos += 10;

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "in_progress").length;
  const avgProgress = totalGoals > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
    : 0;
  const bonusGoals = goals.filter((g) => g.bonusEligible).length;

  const summaryInfo = [
    ["Total de Metas", totalGoals.toString()],
    ["Metas Concluídas", `${completedGoals} (${Math.round((completedGoals / totalGoals) * 100)}%)`],
    ["Metas em Andamento", inProgressGoals.toString()],
    ["Progresso Médio", `${avgProgress}%`],
    ["Metas com Bônus", bonusGoals.toString()],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: summaryInfo,
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Distribuição por Categoria
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Distribuição por Categoria", 20, yPos);
  yPos += 10;

  const categoryData = [
    ["Financeira", goals.filter((g) => g.category === "financial").length],
    ["Comportamental", goals.filter((g) => g.category === "behavioral").length],
    ["Corporativa", goals.filter((g) => g.category === "corporate").length],
    ["Desenvolvimento", goals.filter((g) => g.category === "development").length],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [["Categoria", "Quantidade"]],
    body: categoryData,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 146, 0], textColor: 255 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Lista de Metas
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento de Metas", 20, yPos);
  yPos += 10;

  const goalsData = goals.map((g) => [
    g.title.substring(0, 40) + (g.title.length > 40 ? "..." : ""),
    getCategoryLabel(g.category),
    getStatusLabel(g.status),
    `${g.progress}%`,
    g.employeeName || "N/A",
  ]);

  (doc as any).autoTable({
    startY: yPos,
    head: [["Meta", "Categoria", "Status", "Progresso", "Colaborador"]],
    body: goalsData,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [243, 146, 0], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
    },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      20,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 180, 285);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

// Helpers
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    financial: "Financeira",
    behavioral: "Comportamental",
    corporate: "Corporativa",
    development: "Desenvolvimento",
  };
  return labels[category] || category;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    individual: "Individual",
    team: "Equipe",
    organizational: "Organizacional",
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    pending_approval: "Aguardando Aprovação",
    approved: "Aprovada",
    rejected: "Rejeitada",
    in_progress: "Em Andamento",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  return labels[status] || status;
}

function getMilestoneStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em Andamento",
    completed: "Concluído",
    delayed: "Atrasado",
  };
  return labels[status] || status;
}
