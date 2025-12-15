import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Gera relatório PDF da Nine Box
 */
export async function generateNineBoxPDF(data: {
  positions: Array<{
    employeeName: string;
    performance: string;
    potential: string;
    position: string;
    department: string;
  }>;
  summary: {
    total: number;
    highPerformers: number;
    highPotential: number;
    criticalTalent: number;
  };
  includeCharts?: boolean;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFontSize(20);
  doc.text("Relatório Nine Box", pageWidth / 2, 20, { align: "center" });

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
  doc.text(`Total de Colaboradores: ${data.summary.total}`, 14, 48);
  doc.text(`High Performers: ${data.summary.highPerformers}`, 14, 54);
  doc.text(`Alto Potencial: ${data.summary.highPotential}`, 14, 60);
  doc.text(`Talentos Críticos: ${data.summary.criticalTalent}`, 14, 66);

  // Tabela de Posições
  doc.setFontSize(14);
  doc.text("Distribuição de Talentos", 14, 80);

  const tableData = data.positions.map((p) => [
    p.employeeName,
    p.department,
    p.performance,
    p.potential,
    p.position,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["Colaborador", "Departamento", "Performance", "Potencial", "Posição"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
  });

  // Gráfico da Nine Box (representação textual)
  if (data.includeCharts) {
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.addPage();

    doc.setFontSize(14);
    doc.text("Matriz Nine Box", 14, 20);

    // Desenhar grid 3x3
    const gridStartX = 40;
    const gridStartY = 40;
    const cellSize = 50;

    // Labels
    doc.setFontSize(8);
    doc.text("Baixo", gridStartX + cellSize * 0.5 - 5, gridStartY - 5);
    doc.text("Médio", gridStartX + cellSize * 1.5 - 5, gridStartY - 5);
    doc.text("Alto", gridStartX + cellSize * 2.5 - 5, gridStartY - 5);

    doc.text("Alto", gridStartX - 15, gridStartY + cellSize * 0.5);
    doc.text("Médio", gridStartX - 15, gridStartY + cellSize * 1.5);
    doc.text("Baixo", gridStartX - 15, gridStartY + cellSize * 2.5);

    // Desenhar grid
    for (let i = 0; i <= 3; i++) {
      doc.line(gridStartX + i * cellSize, gridStartY, gridStartX + i * cellSize, gridStartY + cellSize * 3);
      doc.line(gridStartX, gridStartY + i * cellSize, gridStartX + cellSize * 3, gridStartY + i * cellSize);
    }

    // Colorir células
    const colors: { [key: string]: [number, number, number] } = {
      "alto-alto": [39, 174, 96], // Verde
      "alto-medio": [52, 152, 219], // Azul
      "alto-baixo": [241, 196, 15], // Amarelo
      "medio-alto": [52, 152, 219],
      "medio-medio": [241, 196, 15],
      "medio-baixo": [230, 126, 34], // Laranja
      "baixo-alto": [241, 196, 15],
      "baixo-medio": [230, 126, 34],
      "baixo-baixo": [231, 76, 60], // Vermelho
    };

    // Contar colaboradores por posição
    const counts: { [key: string]: number } = {};
    data.positions.forEach((p) => {
      const key = `${p.potential.toLowerCase()}-${p.performance.toLowerCase()}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    // Desenhar contagens
    doc.setFontSize(16);
    doc.setTextColor(255);
    Object.entries(counts).forEach(([key, count]) => {
      const [potential, performance] = key.split("-");
      const potentialMap: { [key: string]: number } = { alto: 0, medio: 1, baixo: 2 };
      const performanceMap: { [key: string]: number } = { baixo: 0, medio: 1, alto: 2 };

      const x = gridStartX + performanceMap[performance] * cellSize;
      const y = gridStartY + potentialMap[potential] * cellSize;

      // Preencher célula
      const color = colors[key] || [200, 200, 200];
      doc.setFillColor(...color);
      doc.rect(x, y, cellSize, cellSize, "F");

      // Desenhar número
      doc.text(count.toString(), x + cellSize / 2 - 5, y + cellSize / 2 + 5);
    });

    doc.setTextColor(0);
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
