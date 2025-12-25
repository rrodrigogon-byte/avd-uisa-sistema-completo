import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

/**
 * Página de resultados detalhados do teste PIR Integridade
 * Mostra gráficos por dimensão e nível de desenvolvimento moral
 */
export default function ResultadosPIRIntegridade() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const token = params.token || "";

  // Buscar convite e resultados
  const { data: invitation, isLoading: loadingInvitation } =
    trpc.integrityPIR.getInvitationByToken.useQuery({ token });

  // Dimensões do PIR Integridade
  const dimensions = [
    { code: "HON", name: "Honestidade", color: "#3b82f6", description: "Transparência e verdade" },
    { code: "CON", name: "Confiabilidade", color: "#10b981", description: "Cumprimento de compromissos" },
    { code: "RES", name: "Responsabilidade", color: "#8b5cf6", description: "Assumir consequências" },
    { code: "RSP", name: "Respeito", color: "#f97316", description: "Valorização da dignidade" },
    { code: "JUS", name: "Justiça", color: "#ef4444", description: "Equidade e imparcialidade" },
    { code: "COR", name: "Coragem Moral", color: "#eab308", description: "Defender valores éticos" },
  ];

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Carregando resultados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || invitation.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Resultados Não Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Os resultados ainda não estão disponíveis. Complete o teste primeiro.
            </p>
            <Button onClick={() => navigate(`/integridade/pir/responder/${token}`)} className="w-full">
              Voltar ao Teste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parsear scores das dimensões
  let dimensionScores: Record<string, number> = {};
  let overallScore = 0;

  try {
    // Buscar do savedAnswers ou de outro campo
    if (invitation.savedAnswers) {
      const parsed = JSON.parse(invitation.savedAnswers as string);
      if (parsed.dimensionScores) {
        dimensionScores = parsed.dimensionScores;
      }
      if (parsed.overallScore) {
        overallScore = parsed.overallScore;
      }
    }
  } catch (e) {
    console.error("Erro ao parsear scores:", e);
  }

  // Preparar dados para gráfico radar
  const radarData = dimensions.map((dim) => ({
    dimension: dim.name,
    score: dimensionScores[dim.code] || 0,
    fullMark: 100,
  }));

  // Preparar dados para gráfico de barras
  const barData = dimensions.map((dim) => ({
    name: dim.code,
    score: dimensionScores[dim.code] || 0,
    color: dim.color,
  }));

  // Determinar nível de desenvolvimento moral
  const getMoralLevel = (score: number) => {
    if (score < 40) {
      return {
        level: "Pré-Convencional",
        description: "Decisões baseadas em consequências pessoais (punição/recompensa)",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
      };
    } else if (score < 70) {
      return {
        level: "Convencional",
        description: "Decisões baseadas em normas sociais e expectativas do grupo",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
      };
    } else {
      return {
        level: "Pós-Convencional",
        description: "Decisões baseadas em princípios éticos universais e valores internalizados",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-500",
      };
    }
  };

  const moralLevel = getMoralLevel(overallScore);

  // Identificar pontos fortes e áreas de desenvolvimento
  const sortedDimensions = [...dimensions]
    .map((dim) => ({
      ...dim,
      score: dimensionScores[dim.code] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const strengths = sortedDimensions.slice(0, 2);
  const improvements = sortedDimensions.slice(-2);

  const handleExportPDF = () => {
    // TODO: Implementar exportação para PDF
    alert("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Resultados do Teste PIR Integridade</CardTitle>
                  <CardDescription>
                    Análise detalhada do seu perfil de integridade
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Pontuação Geral */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Pontuação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {overallScore.toFixed(1)}
                </div>
                <p className="text-muted-foreground">de 100 pontos</p>
              </div>
              <Progress value={overallScore} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Nível de Desenvolvimento Moral */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nível de Desenvolvimento Moral (Kohlberg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`border-l-4 ${moralLevel.borderColor} ${moralLevel.bgColor} rounded-lg p-6`}>
              <div className="flex items-start gap-4">
                <CheckCircle className={`h-8 w-8 ${moralLevel.color} flex-shrink-0`} />
                <div className="space-y-2">
                  <h3 className={`text-2xl font-bold ${moralLevel.color}`}>
                    {moralLevel.level}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {moralLevel.description}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil por Dimensão</CardTitle>
              <CardDescription>Visão geral das 6 dimensões avaliadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Pontuação"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card>
            <CardHeader>
              <CardTitle>Pontuação por Dimensão</CardTitle>
              <CardDescription>Comparação detalhada entre dimensões</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes por Dimensão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes por Dimensão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dimensions.map((dim) => {
                const score = dimensionScores[dim.code] || 0;
                return (
                  <div key={dim.code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: dim.color }}
                        />
                        <div>
                          <h4 className="font-semibold">{dim.name}</h4>
                          <p className="text-xs text-muted-foreground">{dim.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{score.toFixed(1)}</span>
                        <Badge variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"}>
                          {score >= 70 ? "Alto" : score >= 40 ? "Médio" : "Baixo"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pontos Fortes e Áreas de Desenvolvimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pontos Fortes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strengths.map((dim) => (
                  <div key={dim.code} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: dim.color }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{dim.name}</h4>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {dim.score.toFixed(1)} pontos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Áreas de Desenvolvimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <TrendingDown className="h-5 w-5" />
                Áreas de Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvements.map((dim) => (
                  <div key={dim.code} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: dim.color }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{dim.name}</h4>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">
                        {dim.score.toFixed(1)} pontos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interpretação dos Resultados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Interpretação dos Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                O teste PIR Integridade avalia seu perfil ético e comportamental em seis dimensões fundamentais
                para o ambiente profissional. Os resultados são baseados na teoria de desenvolvimento moral de
                Lawrence Kohlberg, que identifica três níveis principais de raciocínio moral.
              </p>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm mb-2">Sobre sua pontuação:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>70-100 pontos:</strong> Alto nível de integridade e desenvolvimento moral</li>
                  <li><strong>40-69 pontos:</strong> Nível médio, com oportunidades de crescimento</li>
                  <li><strong>0-39 pontos:</strong> Áreas significativas para desenvolvimento</li>
                </ul>
              </div>

              <p className="text-muted-foreground leading-relaxed mt-4">
                Lembre-se: este teste não é uma avaliação definitiva de caráter, mas uma ferramenta para
                autoconhecimento e desenvolvimento profissional. Use os resultados como um ponto de partida
                para reflexão e crescimento pessoal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Resultados
          </Button>
        </div>
      </div>
    </div>
  );
}
