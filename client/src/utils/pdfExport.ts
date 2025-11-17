import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export dashboard statistics to PDF
 */
export function exportDashboardPDF(data: {
  userName: string;
  activeGoals: number;
  evaluations: number;
  activePDIs: number;
  currentCycle: string;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Sistema AVD UISA", 20, 20);

  doc.setFontSize(16);
  doc.text("Dashboard - Resumo Executivo", 20, 30);

  // User info
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Colaborador: ${data.userName}`, 20, 40);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 47);

  // Statistics
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Estatísticas", 20, 60);

  const stats = [
    ["Métrica", "Valor"],
    ["Metas Ativas", data.activeGoals.toString()],
    ["Avaliações", data.evaluations.toString()],
    ["PDIs Ativos", data.activePDIs.toString()],
    ["Ciclo Atual", data.currentCycle || "Nenhum"],
  ];

  autoTable(doc, {
    startY: 65,
    head: [stats[0]],
    body: stats.slice(1),
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  doc.save(`dashboard-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export 9-Box matrix to PDF
 */
export function exportNineBoxPDF(data: {
  employees: Array<{
    name: string;
    performance: number;
    potential: number;
    position: string;
    department: string;
  }>;
  department?: string;
}) {
  const doc = new jsPDF("landscape");

  // Header
  doc.setFontSize(20);
  doc.text("Matriz 9-Box - Gestão de Talentos", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  if (data.department) {
    doc.text(`Departamento: ${data.department}`, 20, 30);
  }
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 37);

  // Employee table
  const tableData = data.employees.map((emp) => [
    emp.name,
    emp.department,
    emp.position,
    emp.performance.toFixed(1),
    emp.potential.toFixed(1),
    getBoxPosition(emp.performance, emp.potential),
  ]);

  autoTable(doc, {
    startY: 45,
    head: [["Nome", "Departamento", "Cargo", "Desempenho", "Potencial", "Posição"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
    },
  });

  // Legend
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.setFontSize(12);
  doc.text("Legenda:", 20, finalY + 15);

  const legend = [
    ["Posição", "Descrição"],
    ["Alto Potencial", "Desempenho e potencial altos (>7)"],
    ["Talento Chave", "Desempenho alto, potencial médio"],
    ["Desempenho Sólido", "Desempenho médio, potencial variável"],
    ["Em Desenvolvimento", "Desempenho ou potencial baixos (<5)"],
  ];

  autoTable(doc, {
    startY: finalY + 20,
    head: [legend[0]],
    body: legend.slice(1),
    theme: "plain",
    styles: { fontSize: 10 },
  });

  doc.save(`9box-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export goals report to PDF
 */
export function exportGoalsPDF(data: {
  goals: Array<{
    title: string;
    category: string;
    weight: number;
    progress: number;
    status: string;
    deadline: Date;
  }>;
  employeeName: string;
  cycle: string;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Relatório de Metas", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Colaborador: ${data.employeeName}`, 20, 30);
  doc.text(`Ciclo: ${data.cycle}`, 20, 37);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 44);

  // Goals table
  const tableData = data.goals.map((goal) => [
    goal.title,
    goal.category,
    `${goal.weight}%`,
    `${goal.progress}%`,
    goal.status,
    new Date(goal.deadline).toLocaleDateString("pt-BR"),
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Meta", "Categoria", "Peso", "Progresso", "Status", "Prazo"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  const totalWeight = data.goals.reduce((sum, g) => sum + g.weight, 0);
  const avgProgress =
    data.goals.reduce((sum, g) => sum + g.progress, 0) / data.goals.length;

  doc.setFontSize(12);
  doc.text("Resumo:", 20, finalY + 15);

  const summary = [
    ["Métrica", "Valor"],
    ["Total de Metas", data.goals.length.toString()],
    ["Peso Total", `${totalWeight}%`],
    ["Progresso Médio", `${avgProgress.toFixed(1)}%`],
    [
      "Metas Concluídas",
      data.goals.filter((g) => g.status === "concluida").length.toString(),
    ],
    [
      "Metas Em Andamento",
      data.goals.filter((g) => g.status === "em_andamento").length.toString(),
    ],
  ];

  autoTable(doc, {
    startY: finalY + 20,
    head: [summary[0]],
    body: summary.slice(1),
    theme: "plain",
    styles: { fontSize: 10 },
  });

  doc.save(`metas-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export evaluations report to PDF
 */
export function exportEvaluationsPDF(data: {
  evaluations: Array<{
    employeeName: string;
    type: string;
    finalScore: number;
    status: string;
    completedAt: Date | null;
  }>;
  cycle: string;
  department?: string;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Relatório de Avaliações 360°", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Ciclo: ${data.cycle}`, 20, 30);
  if (data.department) {
    doc.text(`Departamento: ${data.department}`, 20, 37);
  }
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 44);

  // Evaluations table
  const tableData = data.evaluations.map((ev) => [
    ev.employeeName,
    ev.type,
    ev.finalScore?.toFixed(1) || "-",
    ev.status,
    ev.completedAt ? new Date(ev.completedAt).toLocaleDateString("pt-BR") : "-",
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Colaborador", "Tipo", "Nota Final", "Status", "Concluída em"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  const completedEvals = data.evaluations.filter((e) => e.status === "concluida");
  const avgScore =
    completedEvals.reduce((sum, e) => sum + (e.finalScore || 0), 0) /
    (completedEvals.length || 1);

  doc.setFontSize(12);
  doc.text("Resumo:", 20, finalY + 15);

  const summary = [
    ["Métrica", "Valor"],
    ["Total de Avaliações", data.evaluations.length.toString()],
    ["Concluídas", completedEvals.length.toString()],
    ["Nota Média", avgScore.toFixed(1)],
    [
      "Taxa de Conclusão",
      `${((completedEvals.length / data.evaluations.length) * 100).toFixed(1)}%`,
    ],
  ];

  autoTable(doc, {
    startY: finalY + 20,
    head: [summary[0]],
    body: summary.slice(1),
    theme: "plain",
    styles: { fontSize: 10 },
  });

  doc.save(`avaliacoes-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Helper function to determine 9-box position
 */
function getBoxPosition(performance: number, potential: number): string {
  if (performance >= 7 && potential >= 7) return "Alto Potencial";
  if (performance >= 7 && potential >= 4) return "Talento Chave";
  if (performance >= 4 && potential >= 4) return "Desempenho Sólido";
  return "Em Desenvolvimento";
}
