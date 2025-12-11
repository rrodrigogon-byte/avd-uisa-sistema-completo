import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  BarChart3,
  FileText,
  Upload,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

export default function PDIComparativeReport() {
  const [, setLocation] = useLocation();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDFMutation = trpc.pdiReportExport.exportComparativePDF.useMutation({
    onSuccess: (data) => {
      // Download do PDF
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success('Relatório PDF exportado com sucesso!');
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao exportar PDF');
      setIsExporting(false);
    },
  });

  const exportExcelMutation = trpc.pdiReportExport.exportComparativeExcel.useMutation({
    onSuccess: (data) => {
      // Download do Excel
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success('Relatório Excel exportado com sucesso!');
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao exportar Excel');
      setIsExporting(false);
    },
  });

  // Buscar ciclos para filtro
  const { data: cycles } = trpc.evaluationCycles.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Buscar dados comparativos
  const { data: comparison, isLoading } = trpc.pdi.getComparison.useQuery({
    cycleId: selectedCycleId || undefined,
  });

  const getQualityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-600">Excelente</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-blue-600">Bom</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-yellow-600">Regular</Badge>;
    } else {
      return <Badge variant="destructive">Baixo</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/pdi')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para PDI
          </Button>
          <h1 className="text-3xl font-bold">Relatório Comparativo de PDIs</h1>
          <p className="text-muted-foreground">
            Compare PDIs criados manualmente vs. importados de HTML
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsExporting(true);
              exportPDFMutation.mutate({
                cycleId: selectedCycleId || undefined,
              });
            }}
            disabled={!comparison || isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting && exportPDFMutation.isPending ? 'Exportando...' : 'Exportar PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsExporting(true);
              exportExcelMutation.mutate({
                cycleId: selectedCycleId || undefined,
              });
            }}
            disabled={!comparison || isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isExporting && exportExcelMutation.isPending ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* Filtro de Ciclo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por Ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCycleId?.toString() || 'all'}
            onValueChange={(value) => 
              setSelectedCycleId(value === 'all' ? null : parseInt(value))
            }
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Todos os ciclos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ciclos</SelectItem>
              {cycles?.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando dados comparativos...
        </div>
      ) : !comparison ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de PDIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{comparison.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.manual} manuais + {comparison.imported} importados
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  PDIs Manuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{comparison.manual}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.total > 0 
                        ? `${((comparison.manual / comparison.total) * 100).toFixed(1)}%`
                        : '0%'} do total
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  PDIs Importados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{comparison.imported}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.total > 0 
                        ? `${((comparison.imported / comparison.total) * 100).toFixed(1)}%`
                        : '0%'} do total
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio de Criação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{comparison.avgCreationTimeMinutes}min</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Importados: ~2min
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Qualidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDIs Manuais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  PDIs Manuais - Métricas de Qualidade
                </CardTitle>
                <CardDescription>
                  Análise de completude e detalhamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Completude Geral</p>
                    <p className="text-xs text-muted-foreground">
                      Campos obrigatórios preenchidos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {comparison.manualQuality.completeness}%
                    </span>
                    {getQualityBadge(comparison.manualQuality.completeness)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ações por PDI</p>
                    <p className="text-xs text-muted-foreground">
                      Média de ações de desenvolvimento
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {comparison.manualQuality.avgActions}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Detalhamento</p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho médio das descrições
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {comparison.manualQuality.avgDescriptionLength}
                    </span>
                    <span className="text-sm text-muted-foreground">chars</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">PDIs Concluídos</p>
                    <p className="text-xs text-muted-foreground">
                      Taxa de conclusão
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {comparison.manualQuality.completionRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDIs Importados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  PDIs Importados - Métricas de Qualidade
                </CardTitle>
                <CardDescription>
                  Análise de completude e detalhamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Completude Geral</p>
                    <p className="text-xs text-muted-foreground">
                      Campos obrigatórios preenchidos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {comparison.importedQuality.completeness}%
                    </span>
                    {getQualityBadge(comparison.importedQuality.completeness)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ações por PDI</p>
                    <p className="text-xs text-muted-foreground">
                      Média de ações de desenvolvimento
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {comparison.importedQuality.avgActions}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Detalhamento</p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho médio das descrições
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {comparison.importedQuality.avgDescriptionLength}
                    </span>
                    <span className="text-sm text-muted-foreground">chars</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">PDIs Concluídos</p>
                    <p className="text-xs text-muted-foreground">
                      Taxa de conclusão
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {comparison.importedQuality.completionRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparação Visual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comparação Visual
              </CardTitle>
              <CardDescription>
                Comparação lado a lado das principais métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Completude */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completude</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">Manual: {comparison.manualQuality.completeness}%</span>
                      <span className="text-green-600">Importado: {comparison.importedQuality.completeness}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="h-8 bg-blue-600 rounded"
                      style={{ width: `${comparison.manualQuality.completeness}%` }}
                    />
                    <div 
                      className="h-8 bg-green-600 rounded"
                      style={{ width: `${comparison.importedQuality.completeness}%` }}
                    />
                  </div>
                </div>

                {/* Ações por PDI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ações por PDI</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">Manual: {comparison.manualQuality.avgActions}</span>
                      <span className="text-green-600">Importado: {comparison.importedQuality.avgActions}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ width: `${(comparison.manualQuality.avgActions / 10) * 100}%`, minWidth: '60px' }}
                    >
                      {comparison.manualQuality.avgActions}
                    </div>
                    <div 
                      className="h-8 bg-green-600 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ width: `${(comparison.importedQuality.avgActions / 10) * 100}%`, minWidth: '60px' }}
                    >
                      {comparison.importedQuality.avgActions}
                    </div>
                  </div>
                </div>

                {/* Taxa de Conclusão */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taxa de Conclusão</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">Manual: {comparison.manualQuality.completionRate}%</span>
                      <span className="text-green-600">Importado: {comparison.importedQuality.completionRate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="h-8 bg-blue-600 rounded"
                      style={{ width: `${comparison.manualQuality.completionRate}%` }}
                    />
                    <div 
                      className="h-8 bg-green-600 rounded"
                      style={{ width: `${comparison.importedQuality.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
