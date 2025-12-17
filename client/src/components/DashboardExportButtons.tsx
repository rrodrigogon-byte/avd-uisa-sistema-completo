import { Button } from "@/components/ui/button";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
// @ts-ignore - jspdf-autotable não tem tipos oficiais
import autoTable from "jspdf-autotable";

interface DashboardExportButtonsProps {
  dashboardTitle: string;
  data: any[];
  columns: { header: string; accessor: string }[];
  chartRefs?: React.RefObject<HTMLDivElement>[];
}

export function DashboardExportButtons({
  dashboardTitle,
  data,
  columns,
  chartRefs = [],
}: DashboardExportButtonsProps) {
  
  /**
   * Exportar dados para Excel
   */
  const handleExportExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = data.map((item) => {
        const row: any = {};
        columns.forEach((col) => {
          row[col.header] = item[col.accessor] || "";
        });
        return row;
      });

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Dados");

      // Gerar arquivo
      const fileName = `${dashboardTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  /**
   * Exportar dashboard para PDF
   */
  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Título
      doc.setFontSize(18);
      doc.text(dashboardTitle, 14, yPosition);
      yPosition += 10;

      // Data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, yPosition);
      yPosition += 15;

      // Adicionar tabela de dados
      if (data.length > 0) {
        const tableHeaders = columns.map((col) => col.header);
        const tableData = data.map((item) =>
          columns.map((col) => String(item[col.accessor] || ""))
        );

        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Adicionar gráficos como imagens (se houver)
      if (chartRefs.length > 0) {
        for (const chartRef of chartRefs) {
          if (chartRef.current) {
            try {
              const canvas = await import("html2canvas").then((mod) =>
                mod.default(chartRef.current!, {
                  backgroundColor: "#ffffff",
                  scale: 2,
                })
              );

              const imgData = canvas.toDataURL("image/png");
              const imgWidth = 180;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;

              // Adicionar nova página se necessário
              if (yPosition + imgHeight > 280) {
                doc.addPage();
                yPosition = 20;
              }

              doc.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 10;
            } catch (error) {
              console.error("Erro ao capturar gráfico:", error);
            }
          }
        }
      }

      // Salvar PDF
      const fileName = `${dashboardTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportExcel} variant="outline" size="sm">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
      <Button onClick={handleExportPDF} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  );
}
