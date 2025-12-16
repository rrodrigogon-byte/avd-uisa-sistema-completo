import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportExportButtonsProps {
  employeeId?: number;
  employeeIds?: number[];
  departmentId?: number;
  variant?: 'individual' | 'consolidated';
}

/**
 * Componente de Botões de Exportação de Relatórios
 * Permite exportar relatórios AVD em Excel e PDF
 */
export function ReportExportButtons({
  employeeId,
  employeeIds,
  departmentId,
  variant = 'individual',
}: ReportExportButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportEmployeeExcel = trpc.avdExport.exportEmployeeExcel.useMutation();
  const exportEmployeePDF = trpc.avdExport.exportEmployeePDF.useMutation();
  const exportConsolidatedExcel = trpc.avdExport.exportConsolidatedExcel.useMutation();
  const exportConsolidatedPDF = trpc.avdExport.exportConsolidatedPDF.useMutation();

  const downloadFile = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = async () => {
    if (variant === 'individual' && !employeeId) {
      toast.error('ID do funcionário não fornecido');
      return;
    }

    setIsExportingExcel(true);

    try {
      if (variant === 'individual' && employeeId) {
        const result = await exportEmployeeExcel.mutateAsync({ employeeId });
        downloadFile(result.data, result.filename);
        toast.success('Relatório Excel exportado com sucesso!');
      } else {
        const result = await exportConsolidatedExcel.mutateAsync({
          employeeIds,
          departmentId,
        });
        downloadFile(result.data, result.filename);
        toast.success('Relatório consolidado Excel exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (variant === 'individual' && !employeeId) {
      toast.error('ID do funcionário não fornecido');
      return;
    }

    setIsExportingPDF(true);

    try {
      if (variant === 'individual' && employeeId) {
        const result = await exportEmployeePDF.mutateAsync({ employeeId });
        downloadFile(result.data, result.filename);
        toast.success('Relatório PDF exportado com sucesso!');
      } else {
        const result = await exportConsolidatedPDF.mutateAsync({
          employeeIds,
          departmentId,
        });
        downloadFile(result.data, result.filename);
        toast.success('Relatório consolidado PDF exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Exportar Excel
      </Button>

      <Button
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Exportar PDF
      </Button>
    </div>
  );
}
