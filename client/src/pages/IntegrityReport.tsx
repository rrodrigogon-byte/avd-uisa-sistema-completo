import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { IntegrityRadarChart, IntegrityRadarMini } from "@/components/IntegrityRadarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  ArrowLeft,
  Shield,
  Target,
  Award,
  Clock,
} from "lucide-react";
import { Link } from "wouter";

const riskLevelConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  low: { label: "Baixo", color: "text-green-700", bgColor: "bg-green-100", icon: <CheckCircle className="h-4 w-4" /> },
  moderate: { label: "Moderado", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { label: "Alto", color: "text-orange-700", bgColor: "bg-orange-100", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Crítico", color: "text-red-700", bgColor: "bg-red-100", icon: <AlertTriangle className="h-4 w-4" /> },
};

const moralLevelConfig: Record<string, { label: string; description: string }> = {
  pre_conventional: { label: "Pré-Convencional", description: "Orientação por recompensas e punições" },
  conventional: { label: "Convencional", description: "Orientação por normas sociais e expectativas" },
  post_conventional: { label: "Pós-Convencional", description: "Orientação por princípios éticos universais" },
};

const dimensionDescriptions: Record<string, { name: string; description: string; tips: string[] }> = {
  IP: {
    name: "Integridade Pessoal",
    description: "Coerência entre valores pessoais e comportamentos no dia a dia.",
    tips: [
      "Pratique a autorreflexão regularmente",
      "Alinhe suas ações com seus valores declarados",
      "Seja transparente sobre suas motivações",
    ],
  },
  ID: {
    name: "Integridade nas Decisões",
    description: "Capacidade de tomar decisões éticas mesmo sob pressão.",
    tips: [
      "Considere as consequências de longo prazo",
      "Busque múltiplas perspectivas antes de decidir",
      "Mantenha-se fiel aos princípios éticos",
    ],
  },
  IC: {
    name: "Integridade nos Compromissos",
    description: "Cumprimento consistente de promessas e responsabilidades.",
    tips: [
      "Faça apenas promessas que pode cumprir",
      "Comunique proativamente sobre dificuldades",
      "Priorize a entrega de resultados acordados",
    ],
  },
  ES: {
    name: "Estabilidade Emocional",
    description: "Equilíbrio emocional em situações desafiadoras.",
    tips: [
      "Desenvolva técnicas de gestão do estresse",
      "Pratique mindfulness e autocontrole",
      "Busque apoio quando necessário",
    ],
  },
  FL: {
    name: "Flexibilidade",
    description: "Adaptabilidade a mudanças e novas situações.",
    tips: [
      "Esteja aberto a novas ideias e abordagens",
      "Veja mudanças como oportunidades",
      "Desenvolva resiliência diante de adversidades",
    ],
  },
  AU: {
    name: "Autonomia",
    description: "Capacidade de agir de forma independente e responsável.",
    tips: [
      "Tome iniciativa em situações apropriadas",
      "Assuma responsabilidade por suas ações",
      "Desenvolva pensamento crítico independente",
    ],
  },
};

export default function IntegrityReport() {
  const [, params] = useRoute("/relatorio-integridade/:assessmentId");
  const assessmentId = params?.assessmentId ? parseInt(params.assessmentId) : null;

  // Query para buscar dados da avaliação
  const { data: assessment, isLoading } = trpc.pirIntegrity.getAssessmentDetails.useQuery(
    { assessmentId: assessmentId! },
    { enabled: !!assessmentId }
  );

  // Dados de exemplo para demonstração (quando não há dados reais)
  const demoScores = useMemo(() => ({
    IP: 78,
    ID: 85,
    IC: 72,
    ES: 68,
    FL: 82,
    AU: 75,
  }), []);

  const demoBenchmark = useMemo(() => ({
    IP: 70,
    ID: 75,
    IC: 70,
    ES: 65,
    FL: 72,
    AU: 70,
  }), []);

  // Usar dados reais ou demo
  const scores = assessment?.dimensionScores || demoScores;
  const benchmarkScores = demoBenchmark;
  const riskLevel = (assessment?.riskLevel || "low") as "low" | "moderate" | "high" | "critical";
  const moralLevel = assessment?.moralLevel || "conventional";

  // Calcular score médio
  const averageScore = useMemo(() => {
    const values = Object.values(scores);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [scores]);

  // Identificar pontos fortes e áreas de melhoria
  const analysis = useMemo(() => {
    const entries = Object.entries(scores).map(([dim, score]) => ({
      dimension: dim,
      score,
      benchmark: benchmarkScores[dim] || 70,
      diff: score - (benchmarkScores[dim] || 70),
    }));

    const strengths = entries.filter((e) => e.score >= 75).sort((a, b) => b.score - a.score);
    const improvements = entries.filter((e) => e.score < 70).sort((a, b) => a.score - b.score);
    const aboveBenchmark = entries.filter((e) => e.diff > 0).length;

    return { strengths, improvements, aboveBenchmark, total: entries.length };
  }, [scores, benchmarkScores]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Carregando relatório...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pir-integridade">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-7 w-7 text-blue-600" />
                Relatório Individual de Integridade
              </h1>
              <p className="text-gray-500 mt-1">
                Análise detalhada do perfil de integridade
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Score Geral</p>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${riskLevelConfig[riskLevel].bgColor}`}>
                  {riskLevelConfig[riskLevel].icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nível de Risco</p>
                  <p className={`text-xl font-bold ${riskLevelConfig[riskLevel].color}`}>
                    {riskLevelConfig[riskLevel].label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nível Moral</p>
                  <p className="text-lg font-bold">{moralLevelConfig[moralLevel]?.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Acima do Benchmark</p>
                  <p className="text-2xl font-bold">
                    {analysis.aboveBenchmark}/{analysis.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Radar Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IntegrityRadarChart
              scores={scores}
              benchmarkScores={benchmarkScores}
              title="Perfil de Integridade"
              description="Comparação com benchmark organizacional"
              riskLevel={riskLevel}
              height={400}
            />
          </div>

          {/* Pontos Fortes e Melhorias */}
          <div className="space-y-6">
            {/* Pontos Fortes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.strengths.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum ponto forte identificado acima de 75%</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.strengths.slice(0, 3).map((item) => (
                      <div key={item.dimension} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dimensionDescriptions[item.dimension]?.name}</p>
                          <p className="text-xs text-gray-500">{item.dimension}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          {item.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Áreas de Melhoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <TrendingDown className="h-5 w-5" />
                  Áreas de Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.improvements.length === 0 ? (
                  <p className="text-sm text-gray-500">Todas as dimensões estão acima de 70%</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.improvements.slice(0, 3).map((item) => (
                      <div key={item.dimension} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dimensionDescriptions[item.dimension]?.name}</p>
                          <p className="text-xs text-gray-500">{item.dimension}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          {item.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Análise Detalhada por Dimensão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise Detalhada por Dimensão</CardTitle>
            <CardDescription>
              Scores, comparação com benchmark e recomendações de desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(scores).map(([dim, score]) => {
                const benchmark = benchmarkScores[dim] || 70;
                const diff = score - benchmark;
                const info = dimensionDescriptions[dim];

                return (
                  <div key={dim} className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-blue-600">{dim}</span>
                          <span className="text-gray-400">—</span>
                          <span>{info?.name}</span>
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{info?.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{score}%</p>
                        <p className={`text-sm flex items-center justify-end gap-1 ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {diff >= 0 ? "+" : ""}{diff}% vs benchmark
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progresso</span>
                        <span className="text-gray-500">Benchmark: {benchmark}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={score} className="h-3" />
                        <div
                          className="absolute top-0 h-3 w-0.5 bg-blue-600"
                          style={{ left: `${benchmark}%` }}
                          title={`Benchmark: ${benchmark}%`}
                        />
                      </div>
                    </div>

                    {info?.tips && score < 75 && (
                      <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-100">
                        <p className="text-sm font-medium text-blue-800 mb-2">Recomendações de Desenvolvimento:</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {info.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Nível Moral Kohlberg */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise do Nível Moral (Kohlberg)</CardTitle>
            <CardDescription>
              Estágio de desenvolvimento moral identificado na avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(moralLevelConfig).map(([level, config]) => (
                <div
                  key={level}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    moralLevel === level
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {moralLevel === level && (
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    )}
                    <h4 className="font-semibold">{config.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Avaliações
            </CardTitle>
            <CardDescription>
              Evolução do perfil de integridade ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Score Geral</TableHead>
                  <TableHead>Nível de Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{new Date().toLocaleDateString()}</TableCell>
                  <TableCell>Periódica</TableCell>
                  <TableCell>
                    <span className="font-medium">{averageScore}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${riskLevelConfig[riskLevel].bgColor} ${riskLevelConfig[riskLevel].color}`}>
                      {riskLevelConfig[riskLevel].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600">Concluída</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
