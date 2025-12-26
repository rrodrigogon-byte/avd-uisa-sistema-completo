import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Calendar,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dashboard de Acompanhamento de PDIs
 * Visualização consolidada com métricas, gráficos e alertas
 */
export default function DashboardPDI() {
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<'30' | '60' | '90' | 'year' | 'all'>('all');

  // Calcular datas baseado no range selecionado
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date | undefined;

    if (dateRange === '30') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else if (dateRange === '60') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);
    } else if (dateRange === '90') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
    } else if (dateRange === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    return { startDate, endDate: dateRange !== 'all' ? endDate : undefined };
  };

  const { startDate, endDate } = getDateRange();

  // Buscar estatísticas
  const { data: stats, isLoading } = trpc.pdi.getDashboardStats.useQuery({
    departmentId: selectedDepartment,
    startDate,
    endDate,
  });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery(undefined);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const general = stats?.general || {
    total: 0,
    concluidos: 0,
    emAndamento: 0,
    atrasados: 0,
    progressoMedio: 0,
  };

  const taxaConclusao = general.total > 0 
    ? Math.round((general.concluidos / general.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de PDIs</h1>
          <p className="text-gray-600 mt-1">
            Acompanhamento consolidado de Planos de Desenvolvimento Individual
          </p>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
              <SelectItem value="all">Todos os períodos</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={selectedDepartment?.toString() || "all"} 
            onValueChange={(v) => setSelectedDepartment(v === "all" ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[200px]">
              <Users className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PDIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{general.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              PDIs cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{general.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de conclusão: {taxaConclusao}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{general.emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Progresso médio: {Math.round(general.progressoMedio || 0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{general.atrasados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Progresso por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso por Departamento
          </CardTitle>
          <CardDescription>
            Distribuição e progresso médio dos PDIs por departamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.byDepartment && stats.byDepartment.length > 0 ? (
            <div className="space-y-4">
              {stats.byDepartment.map((dept) => {
                const progressPercent = Math.round(dept.progressoMedio || 0);
                const conclusionRate = dept.total > 0 
                  ? Math.round((dept.concluidos / dept.total) * 100) 
                  : 0;

                return (
                  <div key={dept.departmentId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{dept.departmentName}</span>
                        <Badge variant="outline" className="text-xs">
                          {dept.total} PDIs
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{dept.concluidos} concluídos ({conclusionRate}%)</span>
                        <span className="font-semibold text-blue-600">
                          {progressPercent}% progresso
                        </span>
                      </div>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDIs Atrasados */}
      {stats?.atrasados && stats.atrasados.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              PDIs Atrasados - Atenção Necessária
            </CardTitle>
            <CardDescription>
              Planos que ultrapassaram o prazo previsto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.atrasados.map((pdi) => {
                const diasAtraso = pdi.endDate 
                  ? Math.floor((new Date().getTime() - new Date(pdi.endDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <div 
                    key={pdi.id} 
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{pdi.employeeName}</div>
                      <div className="text-sm text-gray-600">
                        {pdi.employeePosition} • {pdi.departmentName}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-600">
                          {diasAtraso} dias de atraso
                        </div>
                        <div className="text-xs text-gray-500">
                          Prazo: {pdi.endDate ? format(new Date(pdi.endDate), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                        </div>
                      </div>
                      <Progress value={pdi.overallProgress || 0} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                        {pdi.overallProgress || 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competências Mais Trabalhadas */}
      {stats?.topCompetencies && stats.topCompetencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Competências Mais Desenvolvidas
            </CardTitle>
            <CardDescription>
              Top 10 competências em foco nos PDIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCompetencies.map((comp, index) => (
                <div key={comp.competencyId} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Competência #{comp.competencyId}</span>
                      <Badge variant="secondary">{comp.count} PDIs</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
