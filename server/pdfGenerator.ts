/**
 * PDF Generator
 * Helper para geração de relatórios PDF de análise temporal
 */

import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface TemporalAnalysisData {
  title: string;
  period: string;
  generatedAt: Date;
  totalEmployees: number;
  averagePirScore: number | null;
  improvementRate: number;
  declineRate: number;
  stableRate: number;
  topPerformers: Array<{
    employeeId: number;
    name: string;
    score: number;
    improvement: number;
  }>;
  needsAttention: Array<{
    employeeId: number;
    name: string;
    score: number;
    decline: number;
  }>;
  trends?: Array<{
    period: string;
    avgScore: number;
    goalCompletion: number;
  }>;
}

/**
 * Gerar PDF de análise temporal
 */
export async function generateTemporalAnalysisPDF(
  data: TemporalAnalysisData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Cabeçalho
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Relatório de Análise Temporal", { align: "center" });

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(data.title, { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Período: ${data.period}`, { align: "center" })
        .text(`Gerado em: ${data.generatedAt.toLocaleString("pt-BR")}`, {
          align: "center",
        })
        .moveDown(2);

      // Linha divisória
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Resumo Executivo
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Resumo Executivo")
        .moveDown(0.5);

      doc.fontSize(11).font("Helvetica");

      const summaryData = [
        ["Funcionários Analisados", data.totalEmployees.toString()],
        [
          "Score PIR Médio",
          data.averagePirScore ? `${data.averagePirScore}%` : "N/A",
        ],
        ["Taxa de Melhoria", `${data.improvementRate}%`],
        ["Taxa de Declínio", `${data.declineRate}%`],
        ["Taxa Estável", `${data.stableRate}%`],
      ];

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 350;

      summaryData.forEach((row, i) => {
        const y = tableTop + i * 25;
        doc.text(row[0], col1X, y);
        doc.font("Helvetica-Bold").text(row[1], col2X, y);
        doc.font("Helvetica");
      });

      doc.moveDown(3);

      // Linha divisória
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Top Performers
      if (data.topPerformers && data.topPerformers.length > 0) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Top Performers")
          .moveDown(0.5);

        doc.fontSize(10).font("Helvetica");

        data.topPerformers.slice(0, 10).forEach((performer, idx) => {
          doc
            .font("Helvetica-Bold")
            .text(`${idx + 1}. ${performer.name}`, { continued: true })
            .font("Helvetica")
            .text(` - Score: ${performer.score}% (${performer.improvement > 0 ? "+" : ""}${performer.improvement}%)`);
        });

        doc.moveDown(2);
      }

      // Linha divisória
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Funcionários que Requerem Atenção
      if (data.needsAttention && data.needsAttention.length > 0) {
        // Verificar se precisa de nova página
        if (doc.y > 650) {
          doc.addPage();
        }

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#DC2626")
          .text("Funcionários que Requerem Atenção")
          .fillColor("#000000")
          .moveDown(0.5);

        doc.fontSize(10).font("Helvetica");

        data.needsAttention.slice(0, 10).forEach((employee, idx) => {
          doc
            .font("Helvetica-Bold")
            .text(`${idx + 1}. ${employee.name}`, { continued: true })
            .font("Helvetica")
            .text(` - Score: ${employee.score}% (${employee.decline}%)`);
        });

        doc.moveDown(2);
      }

      // Tendências (se disponível)
      if (data.trends && data.trends.length > 0) {
        // Nova página para gráficos
        doc.addPage();

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Evolução Temporal")
          .moveDown(1);

        doc.fontSize(10).font("Helvetica");

        // Tabela de tendências
        const trendsTableTop = doc.y;
        const colPeriod = 50;
        const colScore = 200;
        const colGoals = 350;

        // Cabeçalho
        doc
          .font("Helvetica-Bold")
          .text("Período", colPeriod, trendsTableTop)
          .text("Score Médio", colScore, trendsTableTop)
          .text("Conclusão Metas", colGoals, trendsTableTop);

        doc.moveDown(0.5);

        // Dados
        doc.font("Helvetica");
        data.trends.forEach((trend, i) => {
          const y = trendsTableTop + 20 + i * 20;
          doc
            .text(trend.period, colPeriod, y)
            .text(`${trend.avgScore}%`, colScore, y)
            .text(`${trend.goalCompletion}%`, colGoals, y);
        });
      }

      // Rodapé
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        doc
          .fontSize(8)
          .font("Helvetica")
          .text(
            `Página ${i + 1} de ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: "center" }
          );

        doc.text(
          "Sistema AVD UISA - Análise de Desempenho",
          50,
          doc.page.height - 35,
          { align: "center" }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gerar PDF de comparação de funcionários
 */
export async function generateEmployeeComparisonPDF(
  employees: Array<{
    name: string;
    chapa: string;
    department: string;
    currentScore: number;
    previousScore: number;
    change: number;
    trends: Array<{ period: string; score: number }>;
  }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Cabeçalho
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Comparação de Funcionários", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, {
          align: "center",
        })
        .moveDown(2);

      // Tabela comparativa
      const tableTop = doc.y;
      const colName = 50;
      const colChapa = 200;
      const colDept = 300;
      const colCurrent = 450;
      const colPrevious = 550;
      const colChange = 650;

      // Cabeçalhos
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Nome", colName, tableTop)
        .text("Chapa", colChapa, tableTop)
        .text("Departamento", colDept, tableTop)
        .text("Atual", colCurrent, tableTop)
        .text("Anterior", colPrevious, tableTop)
        .text("Mudança", colChange, tableTop);

      doc.moveDown(0.5);

      // Linha
      doc
        .moveTo(50, doc.y)
        .lineTo(750, doc.y)
        .stroke()
        .moveDown(0.5);

      // Dados
      doc.fontSize(9).font("Helvetica");

      employees.forEach((emp, i) => {
        const y = doc.y;

        doc
          .text(emp.name, colName, y, { width: 140 })
          .text(emp.chapa, colChapa, y)
          .text(emp.department, colDept, y, { width: 140 })
          .text(`${emp.currentScore}%`, colCurrent, y)
          .text(`${emp.previousScore}%`, colPrevious, y);

        // Mudança com cor
        const changeText = `${emp.change > 0 ? "+" : ""}${emp.change}%`;
        if (emp.change > 0) {
          doc.fillColor("#16A34A");
        } else if (emp.change < 0) {
          doc.fillColor("#DC2626");
        }
        doc.text(changeText, colChange, y);
        doc.fillColor("#000000");

        doc.moveDown(0.8);

        // Nova página se necessário
        if (doc.y > 500 && i < employees.length - 1) {
          doc.addPage();
        }
      });

      // Rodapé
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        doc
          .fontSize(8)
          .font("Helvetica")
          .text(
            `Página ${i + 1} de ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
