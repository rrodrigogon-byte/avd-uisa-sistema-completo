import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Utilitário de Exportação de Relatórios em PDF
 * 
 * Funções para exportar páginas do sistema em PDF com:
 * - Logo UISA
 * - Cabeçalho e rodapé
 * - Data de geração
 * - Gráficos (Recharts, Chart.js)
 */

interface ExportPDFOptions {
  filename: string;
  title: string;
  subtitle?: string;
  elementId: string;
  orientation?: "portrait" | "landscape";
}

/**
 * Exporta um elemento HTML para PDF
 */
export async function exportToPDF(options: ExportPDFOptions): Promise<void> {
  const {
    filename,
    title,
    subtitle,
    elementId,
    orientation = "portrait",
  } = options;

  try {
    // Buscar elemento
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento ${elementId} não encontrado`);
    }

    // Capturar elemento como imagem
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Criar PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Adicionar cabeçalho
    addHeader(pdf, title, subtitle);

    // Calcular dimensões da imagem
    const imgWidth = pageWidth - 20; // Margem de 10mm de cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Adicionar imagem (começando abaixo do cabeçalho)
    const startY = 35;
    let currentY = startY;

    // Se a imagem é maior que uma página, dividir em múltiplas páginas
    if (imgHeight > pageHeight - startY - 20) {
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const pageContentHeight = pageHeight - startY - 20;
        const sourceHeight = (canvas.height * pageContentHeight) / imgHeight;

        pdf.addImage(
          imgData,
          "PNG",
          10,
          currentY,
          imgWidth,
          Math.min(remainingHeight, pageContentHeight)
        );

        remainingHeight -= pageContentHeight;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          addHeader(pdf, title, subtitle);
          currentY = startY;
        }

        addFooter(pdf);
      }
    } else {
      // Imagem cabe em uma página
      pdf.addImage(imgData, "PNG", 10, currentY, imgWidth, imgHeight);
      addFooter(pdf);
    }

    // Salvar PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    throw error;
  }
}

/**
 * Adiciona cabeçalho ao PDF
 */
function addHeader(pdf: jsPDF, title: string, subtitle?: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Linha laranja UISA no topo
  pdf.setFillColor(243, 146, 0); // #F39200
  pdf.rect(0, 0, pageWidth, 8, "F");

  // Título
  pdf.setFontSize(16);
  pdf.setTextColor(30, 58, 95); // Azul escuro UISA
  pdf.setFont("helvetica", "bold");
  pdf.text(title, 10, 18);

  // Subtítulo (se fornecido)
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text(subtitle, 10, 24);
  }

  // Data de geração
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado em: ${dateStr}`, pageWidth - 60, 18);

  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, 30, pageWidth - 10, 30);
}

/**
 * Adiciona rodapé ao PDF
 */
function addFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

  // Texto do rodapé
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont("helvetica", "normal");
  pdf.text("Sistema AVD UISA - Avaliação de Desempenho", 10, pageHeight - 10);

  // Número da página
  const pageNumber = pdf.getCurrentPageInfo().pageNumber;
  pdf.text(`Página ${pageNumber}`, pageWidth - 30, pageHeight - 10);

  // Linha laranja UISA no rodapé
  pdf.setFillColor(243, 146, 0); // #F39200
  pdf.rect(0, pageHeight - 5, pageWidth, 5, "F");
}

/**
 * Exporta Dashboard Executivo para PDF
 */
export async function exportDashboardExecutivo(): Promise<void> {
  await exportToPDF({
    filename: `dashboard-executivo-${new Date().toISOString().split("T")[0]}.pdf`,
    title: "Dashboard Executivo",
    subtitle: "Visão consolidada de performance e talentos - UISA",
    elementId: "dashboard-executivo-content",
    orientation: "landscape",
  });
}

/**
 * Exporta Mapa de Sucessão para PDF
 */
export async function exportMapaSucessao(): Promise<void> {
  await exportToPDF({
    filename: `mapa-sucessao-${new Date().toISOString().split("T")[0]}.pdf`,
    title: "Mapa de Sucessão",
    subtitle: "Planejamento estratégico de sucessão - UISA",
    elementId: "mapa-sucessao-content",
    orientation: "portrait",
  });
}

/**
 * Exporta PDI Inteligente para PDF
 */
export async function exportPDIInteligente(pdiId: number): Promise<void> {
  await exportToPDF({
    filename: `pdi-inteligente-${pdiId}-${new Date().toISOString().split("T")[0]}.pdf`,
    title: "PDI Inteligente",
    subtitle: "Plano de Desenvolvimento Individual - UISA",
    elementId: "pdi-inteligente-content",
    orientation: "portrait",
  });
}
