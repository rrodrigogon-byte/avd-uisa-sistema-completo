/**
 * Dashboard de Métricas de Integridade
 * 
 * Exibe análises consolidadas dos testes de integridade PIR:
 * - Histórico de testes
 * - Taxa de conclusão
 * - Tendências por período
 * - Distribuição de scores
 * - Top performers
 * - Estatísticas por departamento
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Download,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import * as XLSX from 'xlsx';

const COLORS = {
  excellent: "#10b981",
  good: "#3b82f6",
  average: "#f59e0b",
  poor: "#ef4444",
};

export default function DashboardMetricasIntegridade() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Criar filtros estáveis
  const filters = useMemo(() => ({
    departmentId: selectedDepartmentId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [selectedDepartmentId, startDate, endDate]);

  // Buscar departamentos
  const { data: departments } = trpc.pirDashboard.listDepartments.useQuery(undefined);

  // Buscar taxa de conclusão
  const { data: completionRate, isLoading: loadingCompletionRate } = trpc.integrityMetrics.getCompletionRate.useQuery(
    filters,
    { enabled: true }
  );

  // Buscar tendências
  const { data: trends } = trpc.integrityMetrics.getTrends.useQuery(
    { departmentId: selectedDepartmentId, months: 6 },
    { enabled: true }
  );

  // Buscar distribuição de scores
  const { data: scoreDistribution } = trpc.integrityMetrics.getScoreDistribution.useQuery(
    filters,
    { enabled: true }
  );

  // Buscar top performers
  const { data: topPerformers } = trpc.integrityMetrics.getTopPerformers.useQuery(
    { departmentId: selectedDepartmentId, limit: 10 },
    { enabled: true }
  );

  // Buscar estatísticas por departamento
  const { data: departmentStats } = trpc.integrityMetrics.getDepartmentStats.useQuery(
    { startDate: startDate || undefined, endDate: endDate || undefined },
    { enabled: true }
  );

  // Buscar histórico
  const { data: history } = trpc.integrityMetrics.getHistory.useQuery(
    { ...filters, limit: 50 },
    { enabled: true }
  );

  // Loading state
  if (loadingCompletionRate) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para gráfico de distribuição
  const distributionData = scoreDistribution ? [
    { name: "Excelente (90-100)", value: scoreDistribution.distribution.excellent, color: COLORS.excellent },
    { name: "Bom (75-89)", value: scoreDistribution.distribution.good, color: COLORS.good },
    { name: "Médio (60-74)", value: scoreDistribution.distribution.average, color: COLORS.average },
    { name: "Baixo (0-59)", value: scoreDistribution.distribution.poor, color: COLORS.poor },
  ] : [];

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (!completionRate || !scoreDistribution || !history) {
      alert('Não há dados para exportar');
      return;
    }

    // Preparar dados para exportação
    const worksheetData = [
      ['Dashboard de Métricas de Integridade'],
      ['Data de Geração:', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['ESTATÍSTICAS GERAIS'],
      ['Total de Testes', completionRate.total],
      ['Testes Completados', completionRate.completed],
      ['Testes Pendentes', completionRate.pending],
      ['Testes Expirados', completionRate.expired],
      ['Taxa de Conclusão', `${completionRate.completionRate}%`],
      [''],
      ['DISTRIBUIÇÃO DE SCORES'],
      ['Faixa', 'Quantidade'],
      ['Excelente (90-100)', scoreDistribution.distribution.excellent],
      ['Bom (75-89)', scoreDistribution.distribution.good],
      ['Médio (60-74)', scoreDistribution.distribution.average],
      ['Baixo (0-59)', scoreDistribution.distribution.poor],
      ['Score Médio', scoreDistribution.averageScore],
      [''],
      ['HISTÓRICO DE TESTES'],
      ['Colaborador', 'Departamento', 'Data Criação', 'Data Conclusão', 'Score', 'Status'],
      ...safeMap(history, (test) => [
        test.employeeName || 'N/A',
        test.departmentName || 'N/A',
        test.createdAt ? new Date(test.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        test.completedAt ? new Date(test.completedAt).toLocaleDateString('pt-BR') : 'Pendente',
        test.score || 'N/A',
        test.status || 'N/A',
      ]),
      [''],
      ['FILTROS APLICADOS'],
      ['Departamento', selectedDepartmentId ? departments?.find(d => d.id === selectedDepartmentId)?.name || 'N/A' : 'Todos'],
      ['Período', startDate && endDate ? `${startDate} a ${endDate}` : startDate ? `A partir de ${startDate}` : endDate ? `Até ${endDate}` : 'Todos os períodos'],
    ];

    // Criar workbook e worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Métricas Integridade');

    // Gerar nome do arquivo com data
    const fileName = `metricas-integridade-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Métricas de Integridade</h1>
          <p className="text-muted-foreground mt-1">
            Análise consolidada dos testes de integridade PIR
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Filtro de Departamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Select
                value={selectedDepartmentId?.toString() || "all"}
                onValueChange={(value) => setSelectedDepartmentId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
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

            {/* Filtro de Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Filtro de Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Limpar Filtros de Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Testes criados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {completionRate?.completed || 0} de {completionRate?.total || 0} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando conclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Expirados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{completionRate?.expired || 0}</div>
            <p className="text-xs text-muted-foreground">Prazo vencido</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Tendências */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências (Últimos 6 meses)</CardTitle>
            <CardDescription>Evolução de testes criados e completados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completados" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pendentes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Scores</CardTitle>
            <CardDescription>Faixas de desempenho nos testes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Score Médio</p>
              <p className="text-2xl font-bold">{scoreDistribution?.averageScore || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top 10 Performers
          </CardTitle>
          <CardDescription>Colaboradores com melhores scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isEmpty(topPerformers) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum teste completado ainda
              </p>
            ) : (
              safeMap(topPerformers, (performer, index) => (
                <div
                  key={performer.employeeId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{performer.departmentName}</p>
                    </div>
                  </div>
                  <Badge variant={performer.score && performer.score >= 90 ? "default" : "secondary"}>
                    Score: {performer.score}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Departamento</CardTitle>
          <CardDescription>Desempenho comparativo entre departamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departmentName" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="total" fill="#8b5cf6" name="Total de Testes" />
              <Bar dataKey="completed" fill="#10b981" name="Completados" />
              <Bar dataKey="completionRate" fill="#3b82f6" name="Taxa de Conclusão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
