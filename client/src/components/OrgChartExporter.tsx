import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface OrgChartExporterProps {
  /**
   * ID do elemento HTML que contém o organograma a ser exportado
   */
  targetElementId: string;
  
  /**
   * Título padrão para o arquivo exportado
   */
  defaultFilename?: string;
}

type ExportFormat = "png" | "pdf";
type PageOrientation = "portrait" | "landscape";
type PageSize = "a4" | "a3" | "letter";

export function OrgChartExporter({ 
  targetElementId, 
  defaultFilename = "organograma" 
}: OrgChartExporterProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [orientation, setOrientation] = useState<PageOrientation>("landscape");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Buscar elemento do organograma
      const element = document.getElementById(targetElementId);
      
      if (!element) {
        throw new Error(`Elemento com ID "${targetElementId}" não encontrado`);
      }

      // Capturar elemento como canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Maior qualidade
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      if (format === "png") {
        // Exportar como PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Erro ao gerar imagem");
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${defaultFilename}_${new Date().toISOString().split("T")[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);

          toast.success("Organograma exportado como PNG!");
        });
      } else {
        // Exportar como PDF
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Configurar dimensões do PDF
        const pdf = new jsPDF({
          orientation,
          unit: "px",
          format: pageSize,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calcular escala para caber na página
        const scale = Math.min(
          pdfWidth / imgWidth,
          pdfHeight / imgHeight
        );

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        // Centralizar imagem
        const x = (pdfWidth - scaledWidth) / 2;
        const y = (pdfHeight - scaledHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
        pdf.save(`${defaultFilename}_${new Date().toISOString().split("T")[0]}.pdf`);

        toast.success("Organograma exportado como PDF!");
      }
    } catch (error) {
      console.error("Erro ao exportar organograma:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao exportar organograma"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Organograma Visual
        </CardTitle>
        <CardDescription>
          Exporte o organograma como imagem PNG ou documento PDF
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formato de Exportação */}
        <div className="space-y-3">
          <Label>Formato de Exportação</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="format-png" />
              <Label htmlFor="format-png" className="flex items-center gap-2 cursor-pointer">
                <FileImage className="h-4 w-4" />
                PNG (Imagem)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="format-pdf" />
              <Label htmlFor="format-pdf" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                PDF (Documento)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Configurações de PDF */}
        {format === "pdf" && (
          <>
            <div className="space-y-3">
              <Label htmlFor="orientation">Orientação da Página</Label>
              <Select value={orientation} onValueChange={(v) => setOrientation(v as PageOrientation)}>
                <SelectTrigger id="orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato (Vertical)</SelectItem>
                  <SelectItem value="landscape">Paisagem (Horizontal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="pageSize">Tamanho da Página</Label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
                <SelectTrigger id="pageSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="letter">Letter (216 × 279 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Botão de Exportação */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar como {format.toUpperCase()}
            </>
          )}
        </Button>

        {/* Informações */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• A exportação captura o organograma visível na tela</p>
          <p>• Certifique-se de que todo o conteúdo está visível antes de exportar</p>
          <p>• Para organogramas grandes, recomendamos usar formato PDF com página A3</p>
        </div>
      </CardContent>
    </Card>
  );
}
