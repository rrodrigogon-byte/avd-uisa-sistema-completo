import { useState } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileSpreadsheet, FileText, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página de Exportação de Relatórios PIR
 * Permite exportar dados PIR em Excel e CSV com formatação profissional
 */
export default function PIRExportacao() {
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel');
  const [reportType, setReportType] = useState<'individual' | 'consolidated'>('consolidated');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');

  // Buscar avaliações disponíveis para exportação individual
  const { data: assessments, isLoading: loadingAssessments } = trpc.pir.getEmployeesWithAssessments.useQuery(undefined);

  // Mutations de exportação
  const exportIndividualExcel = trpc.pirExport.exportIndividualExcel.useMutation({
    onSuccess: (data) => {
      toast.success('Relatório gerado com sucesso!');
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
    }
  });

  const exportConsolidatedExcel = trpc.pirExport.exportConsolidatedExcel.useMutation({
    onSuccess: (data) => {
      toast.success(`Relatório consolidado gerado! ${data.totalRecords} registros exportados.`);
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
    }
  });

  const exportCSV = trpc.pirExport.exportCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`Arquivo CSV gerado! ${data.totalRecords} registros exportados.`);
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast.error(`Erro ao gerar CSV: ${error.message}`);
    }
  });

  const handleExport = () => {
    if (reportType === 'individual') {
      if (!selectedAssessmentId) {
        toast.error('Selecione uma avaliação para exportar');
        return;
      }
      exportIndividualExcel.mutate({ assessmentId: selectedAssessmentId });
    } else {
      // Exportação consolidada
      const filters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        department: department || undefined
      };

      if (exportType === 'excel') {
        exportConsolidatedExcel.mutate(filters);
      } else {
        exportCSV.mutate(filters);
      }
    }
  };

  const isExporting = exportIndividualExcel.isLoading || exportConsolidatedExcel.isLoading || exportCSV.isLoading;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exportação de Relatórios PIR</h1>
        <p className="text-muted-foreground mt-2">
          Exporte dados de avaliações PIR em Excel ou CSV com formatação profissional
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações de Exportação */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Exportação</CardTitle>
              <CardDescription>
                Selecione o tipo de relatório e formato desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Relatório */}
              <div className="space-y-2">
                <Label>Tipo de Relatório</Label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Relatório Individual</SelectItem>
                    <SelectItem value="consolidated">Relatório Consolidado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Exportação */}
              {reportType === 'consolidated' && (
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel (.xlsx)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>CSV (.csv)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Seleção de Avaliação Individual */}
              {reportType === 'individual' && (
                <div className="space-y-2">
                  <Label>Selecione a Avaliação</Label>
                  <Select
                    value={selectedAssessmentId?.toString()}
                    onValueChange={(value) => setSelectedAssessmentId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAssessments ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </SelectItem>
                      ) : assessments?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name} - {employee.assessmentCount} avaliações
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtros para Relatório Consolidado */}
              {reportType === 'consolidated' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Departamento (opcional)</Label>
                    <Input
                      placeholder="Filtrar por departamento"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
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
                    Gerando Relatório...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informações e Recursos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recursos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Formatação Profissional</p>
                    <p className="text-sm text-muted-foreground">
                      Relatórios com cabeçalhos estilizados e cores
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Dados Completos</p>
                    <p className="text-sm text-muted-foreground">
                      Todas as respostas e scores detalhados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Estatísticas Automáticas</p>
                    <p className="text-sm text-muted-foreground">
                      Médias, máximos e mínimos calculados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Múltiplos Formatos</p>
                    <p className="text-sm text-muted-foreground">
                      Excel para análise, CSV para integração
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Use relatórios individuais para análises detalhadas de um funcionário específico
              </p>
              <p>
                • Relatórios consolidados são ideais para visão geral da equipe
              </p>
              <p>
                • Exporte para Excel quando precisar de análises e gráficos
              </p>
              <p>
                • Use CSV para importar dados em outros sistemas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
