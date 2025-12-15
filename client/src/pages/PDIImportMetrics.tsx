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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PDIImportMetrics() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Buscar métricas de importação
  const { data: metrics, isLoading } = trpc.pdi.getImportMetrics.useQuery({
    period,
  });

  // Buscar histórico de importações
  const { data: history } = trpc.pdi.listImportHistory.useQuery({
    limit: 20,
    offset: 0,
  });

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      processando: { variant: "outline", label: "Processando", icon: Clock },
      concluido: { variant: "default", label: "Concluído", icon: CheckCircle2 },
      erro: { variant: "destructive", label: "Erro", icon: AlertCircle },
      parcial: { variant: "secondary", label: "Parcial", icon: AlertCircle },
    };

    const config = variants[status] || variants.processando;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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
          <h1 className="text-3xl font-bold">Métricas de Importação de PDI</h1>
          <p className="text-muted-foreground">
            Acompanhe a taxa de sucesso e padrões de erro nas importações
          </p>
        </div>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={period}
            onValueChange={(value: any) => setPeriod(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando métricas...
        </div>
      ) : !metrics ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma métrica disponível
        </div>
      ) : (
        <>
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Importações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{metrics.totalImports || 0}</div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.successRate ? `${metrics.successRate.toFixed(1)}%` : '0%'}
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Importações com Erro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-red-600">
                    {metrics.errorCount || 0}
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
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
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics.totalPDIsImported || 0}
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Taxa de Sucesso ao Longo do Tempo */}
          {metrics.timeline && metrics.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Taxa de Sucesso ao Longo do Tempo
                </CardTitle>
                <CardDescription>
                  Evolução da taxa de sucesso nas importações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.timeline.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {item.date}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {item.successCount} / {item.total} importações
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {item.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${item.successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análise de Padrões de Erro */}
          {metrics.errorPatterns && metrics.errorPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Padrões de Erro Mais Comuns
                </CardTitle>
                <CardDescription>
                  Identifique os erros mais frequentes para melhorar o processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.errorPatterns.map((error: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{error.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Campo: {error.field}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-4">
                        {error.count} ocorrências
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Histórico de Importações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações Recentes</CardTitle>
          <CardDescription>
            Últimas 20 importações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma importação encontrada
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Sucesso</TableHead>
                    <TableHead className="text-center">Erros</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{item.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.totalRecords || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-600">{item.successCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">{item.errorCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
