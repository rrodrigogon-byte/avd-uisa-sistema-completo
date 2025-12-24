import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  subject?: string;
  data: Array<{
    section: string;
    content: string | Array<{ label: string; value: string }>;
  }>;
  footer?: string;
}

/**
 * Gera um PDF a partir de dados estruturados
 * @param options Opções de configuração do relatório
 * @returns Buffer contendo o PDF gerado
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
        info: {
          Title: options.title,
          Author: options.author || "Sistema AVD UISA",
          Subject: options.subject || options.title,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Cabeçalho
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(options.title, { align: "center" });

      if (options.subtitle) {
        doc
          .moveDown(0.5)
          .fontSize(12)
          .font("Helvetica")
          .text(options.subtitle, { align: "center" });
      }

      doc
        .moveDown(0.5)
        .fontSize(10)
        .font("Helvetica")
        .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, { align: "center" });

      doc.moveDown(2);

      // Conteúdo
      options.data.forEach((section, index) => {
        // Título da seção
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(section.section);

        doc.moveDown(0.5);

        // Conteúdo da seção
        if (typeof section.content === "string") {
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(section.content, { align: "justify" });
        } else {
          // Tabela de dados
          section.content.forEach((item) => {
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .text(`${item.label}: `, { continued: true })
              .font("Helvetica")
              .text(item.value);
          });
        }

        if (index < options.data.length - 1) {
          doc.moveDown(1.5);
        }
      });

      // Rodapé
      if (options.footer) {
        doc
          .moveDown(2)
          .fontSize(8)
          .font("Helvetica")
          .text(options.footer, { align: "center" });
      }

      // Numeração de páginas
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(
            `Página ${i + 1} de ${pages.count}`,
            50,
            doc.page.height - 30,
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
 * Gera um PDF de relatório de desempenho
 */
export async function generatePerformanceReportPDF(data: {
  employeeName: string;
  employeePosition: string;
  period: string;
  overallScore: number;
  competencies: Array<{ name: string; score: number; description: string }>;
  goals: Array<{ name: string; progress: number; status: string }>;
  feedback: string;
}): Promise<Buffer> {
  const pdfData: PDFReportOptions = {
    title: "Relatório de Desempenho",
    subtitle: `${data.employeeName} - ${data.employeePosition}`,
    subject: `Relatório de Desempenho - ${data.period}`,
    author: "Sistema AVD UISA",
    data: [
      {
        section: "Informações Gerais",
        content: [
          { label: "Funcionário", value: data.employeeName },
          { label: "Cargo", value: data.employeePosition },
          { label: "Período", value: data.period },
          { label: "Pontuação Geral", value: `${data.overallScore.toFixed(2)}%` },
        ],
      },
      {
        section: "Competências Avaliadas",
        content: data.competencies.map((comp) => ({
          label: comp.name,
          value: `${comp.score.toFixed(2)}% - ${comp.description}`,
        })),
      },
      {
        section: "Metas e Objetivos",
        content: data.goals.map((goal) => ({
          label: goal.name,
          value: `${goal.progress}% - ${goal.status}`,
        })),
      },
      {
        section: "Feedback e Observações",
        content: data.feedback || "Nenhum feedback registrado.",
      },
    ],
    footer: "Este documento é confidencial e destinado exclusivamente ao uso interno da organização.",
  };

  return generatePDFReport(pdfData);
}

/**
 * Gera um PDF de relatório de competências
 */
export async function generateCompetenciesReportPDF(data: {
  employeeName: string;
  employeePosition: string;
  department: string;
  competencies: Array<{
    name: string;
    category: string;
    selfAssessment: number;
    managerAssessment: number;
    gap: number;
  }>;
}): Promise<Buffer> {
  const pdfData: PDFReportOptions = {
    title: "Relatório de Competências",
    subtitle: `${data.employeeName} - ${data.employeePosition}`,
    subject: "Avaliação de Competências",
    author: "Sistema AVD UISA",
    data: [
      {
        section: "Informações do Funcionário",
        content: [
          { label: "Nome", value: data.employeeName },
          { label: "Cargo", value: data.employeePosition },
          { label: "Departamento", value: data.department },
        ],
      },
      {
        section: "Competências Avaliadas",
        content: data.competencies.map((comp) => ({
          label: `${comp.name} (${comp.category})`,
          value: `Autoavaliação: ${comp.selfAssessment}% | Gestor: ${comp.managerAssessment}% | Gap: ${comp.gap}%`,
        })),
      },
    ],
    footer: "Relatório gerado automaticamente pelo Sistema AVD UISA",
  };

  return generatePDFReport(pdfData);
}

/**
 * Gera um PDF de Plano de Desenvolvimento Individual (PDI)
 */
export async function generatePDIReportPDF(data: {
  employeeName: string;
  employeePosition: string;
  period: string;
  objectives: Array<{ title: string; description: string; deadline: string; status: string }>;
  developmentActions: Array<{ action: string; responsible: string; deadline: string }>;
  resources: string;
}): Promise<Buffer> {
  const pdfData: PDFReportOptions = {
    title: "Plano de Desenvolvimento Individual (PDI)",
    subtitle: `${data.employeeName} - ${data.employeePosition}`,
    subject: `PDI - ${data.period}`,
    author: "Sistema AVD UISA",
    data: [
      {
        section: "Informações Gerais",
        content: [
          { label: "Funcionário", value: data.employeeName },
          { label: "Cargo", value: data.employeePosition },
          { label: "Período", value: data.period },
        ],
      },
      {
        section: "Objetivos de Desenvolvimento",
        content: data.objectives.map((obj) => ({
          label: obj.title,
          value: `${obj.description} | Prazo: ${obj.deadline} | Status: ${obj.status}`,
        })),
      },
      {
        section: "Ações de Desenvolvimento",
        content: data.developmentActions.map((action) => ({
          label: action.action,
          value: `Responsável: ${action.responsible} | Prazo: ${action.deadline}`,
        })),
      },
      {
        section: "Recursos Necessários",
        content: data.resources || "Nenhum recurso específico identificado.",
      },
    ],
    footer: "Este PDI deve ser revisado periodicamente e atualizado conforme necessário.",
  };

  return generatePDFReport(pdfData);
}
