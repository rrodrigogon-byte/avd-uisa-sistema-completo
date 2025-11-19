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

/**
 * Export relatório executivo de RH to PDF
 */
export function exportRelatorioExecutivoPDF(data: {
  discDistribution: Array<{ name: string; value: number }>;
  profilesByDept: Array<{ name: string; profile: string; count: number }>;
  totalDepartments: number;
  totalTests: number;
  totalPositions: number;
  coverage: number;
  insights: Array<{
    title: string;
    description: string;
    recommendation: string;
    priority: string;
  }>;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Relatório Executivo de RH", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Sistema AVD UISA - Análise Psicométrica Organizacional`, 20, 30);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 37);

  // Métricas Rápidas
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Métricas Organizacionais", 20, 50);

  const metrics = [
    ["Métrica", "Valor"],
    ["Departamentos Analisados", data.totalDepartments.toString()],
    ["Testes Realizados", data.totalTests.toString()],
    ["Cargos Mapeados", data.totalPositions.toString()],
    ["Cobertura de Testes", `${data.coverage.toFixed(0)}%`],
  ];

  autoTable(doc, {
    startY: 55,
    head: [metrics[0]],
    body: metrics.slice(1),
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Distribuição DISC
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Distribuição DISC Organizacional", 20, currentY);

  const discData = data.discDistribution.map((item) => [
    item.name,
    item.value.toFixed(1),
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Dimensão", "Pontuação Média"]],
    body: discData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      1: { halign: "center" },
    },
  });

  // Perfis por Departamento
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Perfis Predominantes por Departamento", 20, currentY);

  const profilesData = data.profilesByDept.slice(0, 10).map((dept) => [
    dept.name,
    `Perfil ${dept.profile}`,
    `${dept.count} teste(s)`,
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Departamento", "Perfil", "Testes"]],
    body: profilesData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      2: { halign: "center" },
    },
  });

  // Nova página para insights
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Insights Estratégicos", 20, 20);

  currentY = 30;
  data.insights.forEach((insight, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${insight.title}`, 20, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const descLines = doc.splitTextToSize(insight.description, 170);
    doc.text(descLines, 25, currentY + 7);
    
    currentY += 7 + descLines.length * 5;

    doc.setTextColor(59, 130, 246);
    doc.text("Recomendação:", 25, currentY + 3);
    doc.setTextColor(40, 40, 40);
    
    const recLines = doc.splitTextToSize(insight.recommendation, 165);
    doc.text(recLines, 25, currentY + 9);

    currentY += 15 + recLines.length * 5;
  });

  // Recomendações Estratégicas
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Ações Estratégicas Recomendadas", 20, 20);

  const recommendations = [
    {
      title: "1. Expandir Cobertura de Testes",
      desc: "Priorizar departamentos sem dados psicométricos para obter visão completa da organização.",
    },
    {
      title: "2. Criar Equipes Multidisciplinares",
      desc: "Formar projetos com perfis complementares (D+S, I+C) para maximizar sinergia.",
    },
    {
      title: "3. Programas de Desenvolvimento Direcionados",
      desc: "Criar trilhas de capacitação baseadas nos gaps identificados por departamento.",
    },
    {
      title: "4. Monitoramento Contínuo",
      desc: "Reaplicar testes anualmente para acompanhar evolução dos perfis e eficácia das ações.",
    },
    {
      title: "5. Integração com Sucessão e Recrutamento",
      desc: "Utilizar perfis psicométricos para identificar sucessores e definir perfis ideais para vagas.",
    },
  ];

  currentY = 30;
  recommendations.forEach((rec) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(rec.title, 20, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(rec.desc, 170);
    doc.text(lines, 25, currentY + 6);

    currentY += 12 + lines.length * 5;
  });

  // Footer em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Sistema AVD UISA - Relatório Executivo de RH - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio-executivo-rh-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export dashboard comparativo to PDF
 */
export function exportDashboardComparativoPDF(data: {
  testType: string;
  groupBy: string;
  results: Array<{
    groupName: string;
    count: number;
    averages: any;
  }>;
}) {
  const doc = new jsPDF("landscape");

  // Header
  doc.setFontSize(20);
  doc.text("Dashboard Comparativo de Testes Psicométricos", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tipo de Teste: ${data.testType.toUpperCase()}`, 20, 30);
  doc.text(`Agrupamento: ${data.groupBy}`, 20, 37);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 44);

  // Preparar dados da tabela baseado no tipo de teste
  let tableData: any[] = [];
  let headers: string[] = [];

  if (data.testType === "disc") {
    headers = ["Grupo", "Testes", "Dominância", "Influência", "Estabilidade", "Conformidade"];
    tableData = data.results.map((r) => [
      r.groupName,
      r.count.toString(),
      r.averages?.disc?.D?.toFixed(1) || "-",
      r.averages?.disc?.I?.toFixed(1) || "-",
      r.averages?.disc?.S?.toFixed(1) || "-",
      r.averages?.disc?.C?.toFixed(1) || "-",
    ]);
  } else if (data.testType === "bigfive") {
    headers = ["Grupo", "Testes", "Abertura", "Conscienciosidade", "Extroversão", "Amabilidade", "Neuroticismo"];
    tableData = data.results.map((r) => [
      r.groupName,
      r.count.toString(),
      r.averages?.bigfive?.O?.toFixed(1) || "-",
      r.averages?.bigfive?.C?.toFixed(1) || "-",
      r.averages?.bigfive?.E?.toFixed(1) || "-",
      r.averages?.bigfive?.A?.toFixed(1) || "-",
      r.averages?.bigfive?.N?.toFixed(1) || "-",
    ]);
  }

  autoTable(doc, {
    startY: 50,
    head: [headers],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
    },
  });

  // Análise
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Análise Comparativa", 20, finalY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const analysisText = `Este relatório apresenta a comparação de perfis psicométricos ${data.testType.toUpperCase()} agrupados por ${data.groupBy}. ` +
    `Os dados permitem identificar padrões comportamentais predominantes em cada grupo e orientar decisões estratégicas de RH.`;
  
  const lines = doc.splitTextToSize(analysisText, 260);
  doc.text(lines, 20, finalY + 7);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Sistema AVD UISA - Dashboard Comparativo - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`dashboard-comparativo-${data.testType}-${new Date().toISOString().split("T")[0]}.pdf`);
}
