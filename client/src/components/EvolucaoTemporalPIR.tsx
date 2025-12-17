import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { safeMap, safeReduce, safeLength, ensureArray } from "@/lib/arrayHelpers";
import { Loader2, TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EvolucaoTemporalPIRProps {
  employeeId: number;
}

export default function EvolucaoTemporalPIR({ employeeId }: EvolucaoTemporalPIRProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"3" | "6" | "12">("6");

  // Queries
  const { data: temporalHistory, isLoading: loadingHistory } = trpc.pirVideo.getTemporalHistory.useQuery({
    employeeId,
    months: selectedPeriod,
  });

  const { data: competencyEvolution, isLoading: loadingEvolution } = trpc.pirVideo.getCompetencyEvolution.useQuery({
    employeeId,
    months: selectedPeriod,
  });

  // Preparar dados para gráfico de linha (evolução geral)
  const lineChartData = safeMap(temporalHistory, (assessment) => ({
    date: new Date(assessment.completedAt!).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    }),
    score: assessment.overallScore || 0,
    assessmentId: assessment.id,
  }));

  // Preparar dados para gráfico radar (última avaliação por categoria)
  const latestEvolution = competencyEvolution?.[competencyEvolution.length - 1];
  const radarChartData = safeMap(latestEvolution?.categories, (cat) => ({
    category: cat.category,
    score: Math.round(cat.averageScore),
  }));

  // Calcular tendência
  const calculateTrend = () => {
    const historyArray = ensureArray(temporalHistory);
    if (historyArray.length < 2) return "stable";
    
    const scores = safeMap(historyArray, a => a.overallScore || 0);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const avgFirst = safeReduce(firstHalf, (a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = safeReduce(secondHalf, (a, b) => a + b, 0) / secondHalf.length;
    
    const diff = avgSecond - avgFirst;
    
    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "improving":
        return "Em Melhoria";
      case "declining":
        return "Em Declínio";
      default:
        return "Estável";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-50 border-green-200";
      case "declining":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loadingHistory || loadingEvolution) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </CardContent>
      </Card>
    );
  }

  if (!temporalHistory || temporalHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F39200]" />
            Evolução Temporal PIR
          </CardTitle>
          <CardDescription>
            Análise de tendências e evolução das avaliações PIR ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <LineChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma avaliação PIR encontrada no período selecionado</p>
            <p className="text-sm mt-2">Complete avaliações PIR para visualizar a evolução temporal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Resumo e Tendência */}
      <Card className="border-l-4 border-l-[#F39200]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#F39200]" />
                Evolução Temporal PIR
              </CardTitle>
              <CardDescription className="mt-2">
                Análise de tendências e evolução das avaliações PIR ao longo do tempo
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTrendColor()}>
                {getTrendIcon()}
                <span className="ml-2">{getTrendLabel()}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedPeriod === "3" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("3")}
              className={selectedPeriod === "3" ? "bg-[#F39200] hover:bg-[#d97f00]" : ""}
            >
              3 Meses
            </Button>
            <Button
              variant={selectedPeriod === "6" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("6")}
              className={selectedPeriod === "6" ? "bg-[#F39200] hover:bg-[#d97f00]" : ""}
            >
              6 Meses
            </Button>
            <Button
              variant={selectedPeriod === "12" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("12")}
              className={selectedPeriod === "12" ? "bg-[#F39200] hover:bg-[#d97f00]" : ""}
            >
              12 Meses
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Avaliações Realizadas</p>
                  <p className="text-3xl font-bold text-[#F39200]">{safeLength(temporalHistory)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Pontuação Média</p>
                  <p className="text-3xl font-bold text-[#F39200]">
                    {Math.round(
                      safeReduce(temporalHistory, (acc, a) => acc + (a.overallScore || 0), 0) / safeLength(temporalHistory)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Última Avaliação</p>
                  <p className="text-3xl font-bold text-[#F39200]">
                    {ensureArray(temporalHistory)[ensureArray(temporalHistory).length - 1]?.overallScore || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com Gráficos */}
      <Tabs defaultValue="line" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="line">Gráfico de Linha</TabsTrigger>
          <TabsTrigger value="radar">Gráfico Radar</TabsTrigger>
        </TabsList>

        {/* Gráfico de Linha - Evolução Temporal */}
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Pontuação Geral</CardTitle>
              <CardDescription>
                Acompanhe a evolução da pontuação geral das avaliações PIR ao longo dos últimos {selectedPeriod} meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#F39200"
                    strokeWidth={3}
                    name="Pontuação"
                    dot={{ fill: "#F39200", r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico Radar - Competências */}
        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Competências (Última Avaliação)</CardTitle>
              <CardDescription>
                Visualização das pontuações por categoria de competência na avaliação mais recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {radarChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Tooltip />
                    <Radar
                      name="Pontuação"
                      dataKey="score"
                      stroke="#F39200"
                      fill="#F39200"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Dados de competências não disponíveis</p>
                  <p className="text-sm mt-2">Complete avaliações PIR com categorias para visualizar este gráfico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Todas as avaliações PIR realizadas nos últimos {selectedPeriod} meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pontuação</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Respostas</th>
                </tr>
              </thead>
              <tbody>
                {safeMap(temporalHistory, (assessment) => (
                  <tr key={assessment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(assessment.completedAt!).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-[#F39200] text-white">
                        {assessment.overallScore || 0} pontos
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Concluída
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {safeLength(assessment.answers)} respostas
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
