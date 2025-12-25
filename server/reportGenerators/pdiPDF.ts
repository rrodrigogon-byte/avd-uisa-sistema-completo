import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Gera relatório PDF de PDI (Plano de Desenvolvimento Individual)
 */
export async function generatePDIPDF(data: {
  pdis: Array<{
    employeeName: string;
    department: string;
    status: string;
    startDate: string;
    endDate: string;
    progress: number;
    actionsCount: number;
    completedActions: number;
  }>;
  summary: {
    total: number;
    inProgress: number;
    completed: number;
    avgProgress: number;
  };
  includeCharts?: boolean;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFontSize(20);
  doc.text("Relatório de PDI", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 28, {
    align: "center",
  });

  // Resumo Executivo
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Resumo Executivo", 14, 40);

  doc.setFontSize(10);
  doc.text(`Total de PDIs: ${data.summary.total}`, 14, 48);
  doc.text(`Em Andamento: ${data.summary.inProgress}`, 14, 54);
  doc.text(`Concluídos: ${data.summary.completed}`, 14, 60);
  doc.text(`Progresso Médio: ${data.summary.avgProgress.toFixed(1)}%`, 14, 66);

  // Tabela de PDIs
  doc.setFontSize(14);
  doc.text("Detalhamento de PDIs", 14, 80);

  const tableData = data.pdis.map((p) => [
    p.employeeName,
    p.department,
    p.status,
    `${p.progress}%`,
    `${p.completedActions}/${p.actionsCount}`,
    new Date(p.endDate).toLocaleDateString("pt-BR"),
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["Colaborador", "Departamento", "Status", "Progresso", "Ações", "Prazo"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [142, 68, 173],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
    didParseCell: function (data) {
      // Colorir status
      if (data.column.index === 2 && data.cell.section === "body") {
        const status = data.cell.raw as string;
        if (status === "concluido") {
          data.cell.styles.fillColor = [39, 174, 96];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === "em_andamento") {
          data.cell.styles.fillColor = [52, 152, 219];
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
    },
  });

  // Gráfico de distribuição de status
  if (data.includeCharts) {
    const finalY = (doc as any).lastAutoTable.finalY || 85;

    if (finalY > 200) {
      doc.addPage();
    }

    const chartY = finalY > 200 ? 20 : finalY + 20;

    doc.setFontSize(14);
    doc.text("Distribuição de Status", 14, chartY);

    // Contar por status
    const statusCounts: { [key: string]: number } = {
      em_andamento: 0,
      concluido: 0,
      pendente: 0,
    };

    data.pdis.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    // Desenhar gráfico de barras simples
    const barStartY = chartY + 10;
    const barHeight = 20;
    const maxBarWidth = 120;
    const maxCount = Math.max(...Object.values(statusCounts));

    let currentY = barStartY;

    Object.entries(statusCounts).forEach(([status, count]) => {
      const barWidth = (count / maxCount) * maxBarWidth;

      // Cor da barra
      let color: [number, number, number] = [200, 200, 200];
      if (status === "concluido") color = [39, 174, 96];
      else if (status === "em_andamento") color = [52, 152, 219];
      else if (status === "pendente") color = [241, 196, 15];

      // Desenhar barra
      doc.setFillColor(...color);
      doc.rect(70, currentY, barWidth, barHeight, "F");

      // Label
      doc.setFontSize(10);
      doc.setTextColor(0);
      const statusLabel =
        status === "em_andamento"
          ? "Em Andamento"
          : status === "concluido"
            ? "Concluído"
            : "Pendente";
      doc.text(statusLabel, 14, currentY + 13);

      // Valor
      doc.text(`${count}`, 70 + barWidth + 5, currentY + 13);

      currentY += barHeight + 5;
    });

    // Distribuição de progresso
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Distribuição de Progresso", 14, 20);

    const progressBands = [
      { label: "0-25%", count: 0 },
      { label: "26-50%", count: 0 },
      { label: "51-75%", count: 0 },
      { label: "76-100%", count: 0 },
    ];

    data.pdis.forEach((p) => {
      if (p.progress <= 25) progressBands[0].count++;
      else if (p.progress <= 50) progressBands[1].count++;
      else if (p.progress <= 75) progressBands[2].count++;
      else progressBands[3].count++;
    });

    currentY = 30;
    const maxProgressCount = Math.max(...progressBands.map((b) => b.count));

    progressBands.forEach((band) => {
      const barWidth = (band.count / maxProgressCount) * maxBarWidth;

      // Cor gradiente
      const intensity = Math.floor((band.count / maxProgressCount) * 100);
      doc.setFillColor(52, 152, 219);
      doc.rect(70, currentY, barWidth, barHeight, "F");

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(band.label, 14, currentY + 13);
      doc.text(`${band.count}`, 70 + barWidth + 5, currentY + 13);

      currentY += barHeight + 5;
    });
  }

  // Rodapé
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}
