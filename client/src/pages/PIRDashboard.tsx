/**
 * Dashboard Analítico do PIR (Perfil de Identidade de Relacionamento)
 * 
 * Exibe análises consolidadas das avaliações PIR:
 * - Distribuição de notas por dimensão (IP, ID, IC, ES, FL, AU)
 * - Análise de faixas de desempenho
 * - Evolução temporal das avaliações
 * - Filtros por ciclo, departamento, cargo, período
 */

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
} from "lucide-react";

const COLORS = {
  excepcional: "#10b981",
  supera: "#3b82f6",
  atende: "#f59e0b",
  abaixo: "#ef4444",
};

const DIMENSION_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function PIRDashboard() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [selectedPositionId, setSelectedPositionId] = useState<number | undefined>(undefined);

  // Buscar ciclos disponíveis
  const { data: cycles, isLoading: loadingCycles } = trpc.pirDashboard.listCycles.useQuery();

  // Buscar departamentos
  const { data: departments } = trpc.pirDashboard.listDepartments.useQuery();

  // Buscar cargos
  const { data: positions } = trpc.pirDashboard.listPositions.useQuery();

  // Criar filtros estáveis
  const statsFilters = useMemo(() => ({
    cycleId: selectedCycleId,
    departmentId: selectedDepartmentId,
    positionId: selectedPositionId,
  }), [selectedCycleId, selectedDepartmentId, selectedPositionId]);

  // Buscar estatísticas gerais
  const { data: stats, isLoading: loadingStats } = trpc.pirDashboard.getStats.useQuery(
    statsFilters,
    { enabled: true }
  );

  // Buscar distribuição por dimensão
  const { data: dimensionDistribution } = trpc.pirDashboard.getDimensionDistribution.useQuery(
    statsFilters,
    { enabled: true }
  );

  // Buscar evolução temporal
  const { data: temporalEvolution } = trpc.pirDashboard.getTemporalEvolution.useQuery(
    {
      departmentId: selectedDepartmentId,
      months: 12,
    },
    { enabled: true }
  );

  // Loading state
  if (loadingCycles || loadingStats) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no data
  if (!stats || stats.totalAssessments === 0) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma avaliação PIR encontrada</h2>
            <p className="text-muted-foreground mb-6">
              Não há avaliações PIR concluídas para exibir no dashboard. Complete algumas avaliações para visualizar as estatísticas.
            </p>
            <Button onClick={() => window.location.href = '/avd/processo/passo2'}>
              Iniciar Avaliação PIR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para gráfico de distribuição por faixa
  const performanceDistribution = [
    {
      name: "Excepcional (90-100)",
      value: stats.scoreRanges.excepcional,
      color: COLORS.excepcional,
    },
    {
      name: "Supera (75-89)",
      value: stats.scoreRanges.supera,
      color: COLORS.supera,
    },
    {
      name: "Atende (60-74)",
      value: stats.scoreRanges.atende,
      color: COLORS.atende,
    },
    {
      name: "Abaixo (0-59)",
      value: stats.scoreRanges.abaixo,
      color: COLORS.abaixo,
    },
  ];

  // Preparar dados para gráfico de dimensões
  const dimensionData = dimensionDistribution
    ? [
        { dimension: "Influência Pessoal (IP)", value: dimensionDistribution.IP || 0 },
        { dimension: "Iniciativa e Decisão (ID)", value: dimensionDistribution.ID || 0 },
        { dimension: "Inovação e Criatividade (IC)", value: dimensionDistribution.IC || 0 },
        { dimension: "Estabilidade (ES)", value: dimensionDistribution.ES || 0 },
        { dimension: "Flexibilidade (FL)", value: dimensionDistribution.FL || 0 },
        { dimension: "Autonomia (AU)", value: dimensionDistribution.AU || 0 },
      ]
    : [];

  // Preparar dados para radar chart
  const radarData = dimensionDistribution
    ? [
        { dimension: "IP", value: dimensionDistribution.IP || 0, fullMark: 5 },
        { dimension: "ID", value: dimensionDistribution.ID || 0, fullMark: 5 },
        { dimension: "IC", value: dimensionDistribution.IC || 0, fullMark: 5 },
        { dimension: "ES", value: dimensionDistribution.ES || 0, fullMark: 5 },
        { dimension: "FL", value: dimensionDistribution.FL || 0, fullMark: 5 },
        { dimension: "AU", value: dimensionDistribution.AU || 0, fullMark: 5 },
      ]
    : [];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard PIR</h1>
          <p className="text-muted-foreground mt-1">
            Análise consolidada das avaliações de Perfil de Identidade de Relacionamento
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Filtro de Ciclo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo</label>
              <Select
                value={selectedCycleId?.toString() || "all"}
                onValueChange={(value) => setSelectedCycleId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
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
            </div>

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

            {/* Filtro de Cargo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo</label>
              <Select
                value={selectedPositionId?.toString() || "all"}
                onValueChange={(value) => setSelectedPositionId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id.toString()}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">Avaliações concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Média de todas as avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desempenho Excepcional</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scoreRanges.excepcional}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssessments > 0
                ? `${((stats.scoreRanges.excepcional / stats.totalAssessments) * 100).toFixed(1)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abaixo do Esperado</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scoreRanges.abaixo}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssessments > 0
                ? `${((stats.scoreRanges.abaixo / stats.totalAssessments) * 100).toFixed(1)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Faixa de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa de Desempenho</CardTitle>
            <CardDescription>Quantidade de avaliações em cada faixa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Dimensão PIR */}
        <Card>
          <CardHeader>
            <CardTitle>Média por Dimensão PIR</CardTitle>
            <CardDescription>Pontuação média em cada dimensão avaliada</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dimensionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dimension" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 5]} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart das Dimensões */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Dimensões PIR</CardTitle>
            <CardDescription>Visualização consolidada das dimensões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                <Radar
                  name="Média"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Temporal */}
        {temporalEvolution && temporalEvolution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal</CardTitle>
              <CardDescription>Média de notas ao longo dos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temporalEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Nota Média"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detalhamento das Dimensões */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Dimensões PIR</CardTitle>
          <CardDescription>Descrição e pontuação de cada dimensão avaliada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Influência Pessoal (IP)</p>
                  <p className="text-sm text-muted-foreground">
                    Capacidade de influenciar e persuadir outras pessoas
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.IP?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Iniciativa e Decisão (ID)</p>
                  <p className="text-sm text-muted-foreground">
                    Proatividade e capacidade de tomar decisões
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.ID?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Inovação e Criatividade (IC)</p>
                  <p className="text-sm text-muted-foreground">
                    Capacidade de gerar ideias novas e soluções criativas
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.IC?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Estabilidade (ES)</p>
                  <p className="text-sm text-muted-foreground">
                    Controle emocional e estabilidade em situações de pressão
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.ES?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Flexibilidade (FL)</p>
                  <p className="text-sm text-muted-foreground">
                    Adaptabilidade e abertura para mudanças
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.FL?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Autonomia (AU)</p>
                  <p className="text-sm text-muted-foreground">
                    Independência e capacidade de trabalhar sem supervisão
                  </p>
                </div>
                <Badge variant="secondary">{dimensionDistribution?.AU?.toFixed(1) || "0.0"}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
