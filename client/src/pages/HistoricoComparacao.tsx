/**
 * Página de Histórico e Comparação Temporal de Resultados
 * Permite visualizar evolução e comparar resultados ao longo do tempo
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  LineChart,
  Download,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";
import { generatePDFFromElement } from "@/lib/pdfGenerator";

type AssessmentType = "pir" | "pir_integrity" | "competency" | "performance";
type Period = "last_month" | "last_quarter" | "last_year" | "all_time";

export default function HistoricoComparacao() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("pir");
  const [period, setPeriod] = useState<Period>("last_year");
  const [compareIds, setCompareIds] = useState<[number | null, number | null]>([null, null]);

  // Buscar lista de colaboradores
  const { data: employees } = trpc.employees.list.useQuery(undefined);

  // Buscar estatísticas de evolução
  const { data: evolutionStats, isLoading: loadingStats } = trpc.historicalComparison.getEvolutionStats.useQuery(
    {
      employeeId: selectedEmployee!,
      assessmentType,
      period,
    },
    {
      enabled: selectedEmployee !== null,
    }
  );

  // Buscar histórico baseado no tipo de avaliação
  const { data: history, isLoading: loadingHistory } = (() => {
    if (!selectedEmployee) return { data: undefined, isLoading: false };

    switch (assessmentType) {
      case "pir":
        return trpc.historicalComparison.getPIRHistory.useQuery({
          employeeId: selectedEmployee,
        });
      case "pir_integrity":
        return trpc.historicalComparison.getPIRIntegrityHistory.useQuery({
          employeeId: selectedEmployee,
        });
      case "competency":
        return trpc.historicalComparison.getCompetencyHistory.useQuery({
          employeeId: selectedEmployee,
        });
      case "performance":
        return trpc.historicalComparison.getPerformanceHistory.useQuery({
          employeeId: selectedEmployee,
        });
      default:
        return { data: undefined, isLoading: false };
    }
  })();

  // Buscar comparação de dois resultados
  const { data: comparison, isLoading: loadingComparison } = trpc.historicalComparison.comparePIRResults.useQuery(
    {
      assessmentId1: compareIds[0]!,
      assessmentId2: compareIds[1]!,
    },
    {
      enabled: compareIds[0] !== null && compareIds[1] !== null && assessmentType === "pir",
    }
  );

  const handleExportPDF = async () => {
    try {
      toast.info("Gerando PDF do histórico...");
      
      await generatePDFFromElement(
        'historico-content',
        `Historico_${assessmentType}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        {
          title: 'Histórico e Evolução de Resultados',
          subtitle: `Tipo: ${getAssessmentTypeLabel(assessmentType)} - Período: ${getPeriodLabel(period)}`,
          orientation: 'portrait',
          includeHeader: true,
          includeFooter: true
        }
      );
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const getAssessmentTypeLabel = (type: AssessmentType) => {
    const labels = {
      pir: "PIR - Perfil Individual de Referência",
      pir_integrity: "PIR Integridade",
      competency: "Avaliação de Competências",
      performance: "Avaliação de Desempenho",
    };
    return labels[type];
  };

  const getPeriodLabel = (p: Period) => {
    const labels = {
      last_month: "Último Mês",
      last_quarter: "Último Trimestre",
      last_year: "Último Ano",
      all_time: "Todo o Período",
    };
    return labels[p];
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === "declining") return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getTrendBadge = (trend: string) => {
    const variants = {
      improving: { variant: "default" as const, label: "Melhorando", color: "bg-green-100 text-green-800" },
      declining: { variant: "destructive" as const, label: "Declinando", color: "bg-red-100 text-red-800" },
      stable: { variant: "secondary" as const, label: "Estável", color: "bg-gray-100 text-gray-800" },
    };
    const config = variants[trend as keyof typeof variants] || variants.stable;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Preparar dados para o gráfico de linha
  const chartData = safeMap(evolutionStats?.assessments || [], (assessment: any) => {
    const date = new Date(
      assessment.assessmentDate || assessment.evaluationDate || assessment.createdAt
    ).toLocaleDateString('pt-BR');
    
    const score = assessment.overallScore || assessment.averageScore || 0;
    
    return {
      date,
      pontuacao: score,
    };
  });

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Histórico e Comparação Temporal</h1>
            <p className="text-muted-foreground">
              Visualize a evolução e compare resultados ao longo do tempo
            </p>
          </div>
          <Button variant="outline" onClick={handleExportPDF} disabled={!selectedEmployee}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o colaborador e o tipo de avaliação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Colaborador</label>
              <Select
                value={selectedEmployee?.toString() || ""}
                onValueChange={(value) => setSelectedEmployee(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {safeMap(employees || [], (emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Avaliação</label>
              <Select
                value={assessmentType}
                onValueChange={(value) => setAssessmentType(value as AssessmentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pir">PIR</SelectItem>
                  <SelectItem value="pir_integrity">PIR Integridade</SelectItem>
                  <SelectItem value="competency">Competências</SelectItem>
                  <SelectItem value="performance">Desempenho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as Period)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">Último Mês</SelectItem>
                  <SelectItem value="last_quarter">Último Trimestre</SelectItem>
                  <SelectItem value="last_year">Último Ano</SelectItem>
                  <SelectItem value="all_time">Todo o Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      <div id="historico-content">
        {!selectedEmployee ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Colaborador</h3>
                <p className="text-gray-600">
                  Escolha um colaborador acima para visualizar o histórico de avaliações
                </p>
              </div>
            </CardContent>
          </Card>
        ) : loadingStats || loadingHistory ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-[#F39200]" />
              </div>
            </CardContent>
          </Card>
        ) : isEmpty(evolutionStats?.assessments) ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma Avaliação Encontrada</h3>
                <p className="text-gray-600">
                  Não há avaliações registradas para este colaborador no período selecionado
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{evolutionStats?.totalAssessments || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pontuação Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{evolutionStats?.averageScore || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tendência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(evolutionStats?.trend || "stable")}
                    {getTrendBadge(evolutionStats?.trend || "stable")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Melhoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {evolutionStats?.improvement && evolutionStats.improvement > 0 ? "+" : ""}
                    {evolutionStats?.improvement || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Evolução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Evolução ao Longo do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pontuacao"
                      stroke="#F39200"
                      strokeWidth={2}
                      dot={{ fill: "#F39200", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Pontuação"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Histórico de Avaliações */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  Todas as avaliações registradas no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {safeMap(history || [], (assessment: any) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          Avaliação #{assessment.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(
                            assessment.assessmentDate ||
                              assessment.evaluationDate ||
                              assessment.createdAt
                          ).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Pontuação</div>
                          <div className="text-2xl font-bold">
                            {assessment.overallScore || assessment.averageScore || 0}
                          </div>
                        </div>
                        <Badge variant={assessment.status === "concluida" || assessment.status === "completed" ? "default" : "secondary"}>
                          {assessment.status || "Concluída"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
