import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { AlertCircle, Award, Brain, CheckCircle, Download, TrendingUp, User, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PsychometricResults() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Buscar testes do usuário logado
  const { data: tests, isLoading } = trpc.psychometric.getTests.useQuery(undefined, {
    enabled: !!user,
  });

  // Se não houver testes, mostrar mensagem
  if (authLoading || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum teste encontrado</AlertTitle>
          <AlertDescription>
            Você ainda não completou nenhum teste psicométrico. Entre em contato com o RH para receber um convite.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Pegar o teste mais recente
  const latestTest = tests[0];
  const profile = latestTest.profile || {};

  // Preparar dados para gráficos DISC
  const discData = profile.disc
    ? [
        { trait: "Dominância", value: profile.disc.d || 0, fullMark: 100 },
        { trait: "Influência", value: profile.disc.i || 0, fullMark: 100 },
        { trait: "Estabilidade", value: profile.disc.s || 0, fullMark: 100 },
        { trait: "Conformidade", value: profile.disc.c || 0, fullMark: 100 },
      ]
    : [];

  // Preparar dados para gráficos Big Five
  const bigFiveData = profile.bigFive
    ? [
        { name: "Abertura", value: profile.bigFive.o || 0 },
        { name: "Conscienciosidade", value: profile.bigFive.c || 0 },
        { name: "Extroversão", value: profile.bigFive.e || 0 },
        { name: "Amabilidade", value: profile.bigFive.a || 0 },
        { name: "Neuroticismo", value: profile.bigFive.n || 0 },
      ]
    : [];

  // Preparar dados para gráficos PIR
  const pirData = profile.pir?.normalizedScores
    ? [
        { dimension: "Interesse em Pessoas", value: profile.pir.normalizedScores.IP || 0, fullMark: 100 },
        { dimension: "Interesse em Dados", value: profile.pir.normalizedScores.ID || 0, fullMark: 100 },
        { dimension: "Interesse em Coisas", value: profile.pir.normalizedScores.IC || 0, fullMark: 100 },
        { dimension: "Estabilidade", value: profile.pir.normalizedScores.ES || 0, fullMark: 100 },
        { dimension: "Flexibilidade", value: profile.pir.normalizedScores.FL || 0, fullMark: 100 },
        { dimension: "Autonomia", value: profile.pir.normalizedScores.AU || 0, fullMark: 100 },
      ]
    : [];

  // Determinar perfil DISC dominante
  const getDominantDISC = () => {
    if (!profile.disc) return null;
    const traits = [
      { name: "D - Dominância", value: profile.disc.d || 0, color: "bg-red-500" },
      { name: "I - Influência", value: profile.disc.i || 0, color: "bg-yellow-500" },
      { name: "S - Estabilidade", value: profile.disc.s || 0, color: "bg-green-500" },
      { name: "C - Conformidade", value: profile.disc.c || 0, color: "bg-blue-500" },
    ];
    return traits.reduce((max, trait) => (trait.value > max.value ? trait : max));
  };

  const dominantTrait = getDominantDISC();

  // Interpretações e recomendações
  const getInterpretation = () => {
    if (!profile.disc && !latestTest.profileType) return null;

    const interpretations: Record<string, { title: string; description: string; strengths: string[]; improvements: string[] }> = {
      D: {
        title: "Perfil Dominante",
        description: "Você é orientado para resultados, direto e decisivo. Gosta de desafios e assume riscos calculados.",
        strengths: [
          "Liderança natural e iniciativa",
          "Capacidade de tomar decisões rápidas",
          "Foco em resultados e metas",
          "Confiança e assertividade",
        ],
        improvements: [
          "Desenvolver paciência e empatia",
          "Ouvir mais antes de decidir",
          "Considerar o impacto emocional das decisões",
          "Delegar mais e confiar na equipe",
        ],
      },
      I: {
        title: "Perfil Influente",
        description: "Você é comunicativo, entusiasta e persuasivo. Gosta de trabalhar com pessoas e criar relacionamentos.",
        strengths: [
          "Excelente comunicação e networking",
          "Otimismo e energia contagiante",
          "Capacidade de motivar e inspirar",
          "Criatividade e inovação",
        ],
        improvements: [
          "Melhorar foco e organização",
          "Desenvolver atenção aos detalhes",
          "Gerenciar melhor o tempo",
          "Seguir processos e prazos",
        ],
      },
      S: {
        title: "Perfil Estável",
        description: "Você é cooperativo, paciente e leal. Valoriza harmonia e trabalho em equipe.",
        strengths: [
          "Confiabilidade e consistência",
          "Excelente ouvinte e mediador",
          "Paciência e persistência",
          "Trabalho em equipe e colaboração",
        ],
        improvements: [
          "Desenvolver assertividade",
          "Lidar melhor com mudanças",
          "Expressar opiniões mais claramente",
          "Tomar decisões mais rápidas",
        ],
      },
      C: {
        title: "Perfil Conforme",
        description: "Você é analítico, preciso e sistemático. Valoriza qualidade e exatidão.",
        strengths: [
          "Atenção aos detalhes e precisão",
          "Pensamento analítico e lógico",
          "Alta qualidade no trabalho",
          "Planejamento e organização",
        ],
        improvements: [
          "Desenvolver flexibilidade",
          "Aceitar imperfeições ocasionais",
          "Melhorar habilidades sociais",
          "Tomar decisões com informação limitada",
        ],
      },
    };

    const dominant = dominantTrait?.name.charAt(0) || latestTest.profileType?.charAt(0) || "D";
    return interpretations[dominant];
  };

  const interpretation = getInterpretation();

  // Função para exportar PDF
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil Psicométrico Completo</h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada do seu perfil comportamental e de personalidade
          </p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Status do Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Teste Completado
          </CardTitle>
          <CardDescription>
            Realizado em {new Date(latestTest.completedAt!).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="disc">DISC</TabsTrigger>
          <TabsTrigger value="bigfive">Big Five</TabsTrigger>
          <TabsTrigger value="pir">PIR</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Perfil Dominante */}
            {dominantTrait && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Perfil Dominante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${dominantTrait.color} flex items-center justify-center text-white text-2xl font-bold`}>
                      {dominantTrait.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{dominantTrait.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dominantTrait.value}% de intensidade
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tipo de Perfil */}
            {(profile.mbti || latestTest.profileType) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Tipo de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-2xl px-6 py-3">
                      {profile.mbti || latestTest.profileType}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {latestTest.profileDescription || "Tipo de personalidade identificado"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Interpretação */}
          {interpretation && (
            <Card>
              <CardHeader>
                <CardTitle>{interpretation.title}</CardTitle>
                <CardDescription>{interpretation.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Pontos Fortes
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {interpretation.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Áreas de Desenvolvimento
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {interpretation.improvements.map((improvement, idx) => (
                      <li key={idx}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Características Adicionais */}
          {latestTest.interpretation && (
            <Card>
              <CardHeader>
                <CardTitle>Interpretação Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.interpretation}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DISC */}
        <TabsContent value="disc" className="space-y-4">
          {profile.disc ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Perfil DISC</CardTitle>
                  <CardDescription>
                    Análise do seu comportamento em quatro dimensões principais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={discData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="trait" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Intensidade"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Dominância */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      Dominância (D)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intensidade</span>
                        <Badge variant="secondary">{profile.disc.d}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Orientação para resultados, competitividade e tomada de decisão rápida.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Influência */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      Influência (I)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intensidade</span>
                        <Badge variant="secondary">{profile.disc.i}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Habilidade de comunicação, persuasão e construção de relacionamentos.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Estabilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      Estabilidade (S)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intensidade</span>
                        <Badge variant="secondary">{profile.disc.s}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Paciência, cooperação e preferência por ambientes estáveis.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Conformidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      Conformidade (C)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intensidade</span>
                        <Badge variant="secondary">{profile.disc.c}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Atenção aos detalhes, precisão e seguimento de procedimentos.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dados DISC não disponíveis</AlertTitle>
              <AlertDescription>
                Os resultados do perfil DISC não foram encontrados para este teste.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Big Five */}
        <TabsContent value="bigfive" className="space-y-4">
          {profile.bigFive ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Modelo Big Five</CardTitle>
                  <CardDescription>
                    Os cinco grandes traços de personalidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={bigFiveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Pontuação" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Abertura */}
                <Card>
                  <CardHeader>
                    <CardTitle>Abertura (O)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.bigFive.o}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Curiosidade intelectual, criatividade e abertura para novas experiências.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Conscienciosidade */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conscienciosidade (C)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.bigFive.c}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Organização, responsabilidade e orientação para objetivos.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Extroversão */}
                <Card>
                  <CardHeader>
                    <CardTitle>Extroversão (E)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.bigFive.e}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sociabilidade, assertividade e busca por estimulação social.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Amabilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle>Amabilidade (A)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.bigFive.a}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Empatia, cooperação e preocupação com o bem-estar dos outros.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Neuroticismo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Neuroticismo (N)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.bigFive.n}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Estabilidade emocional e capacidade de lidar com estresse.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dados Big Five não disponíveis</AlertTitle>
              <AlertDescription>
                Os resultados do modelo Big Five não foram encontrados para este teste.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* PIR */}
        <TabsContent value="pir" className="space-y-4">
          {profile.pir?.normalizedScores ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Perfil PIR - Perfil de Interesses e Reações</CardTitle>
                  <CardDescription>
                    Análise do seu perfil de interesses, estilo de trabalho e preferências comportamentais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={pirData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Intensidade"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Interesse em Pessoas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Interesse em Pessoas (IP)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.IP}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por trabalhar com pessoas, ajudar, ensinar e colaborar.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Interesse em Dados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Interesse em Dados (ID)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.ID}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por análise, pesquisa, planejamento e trabalho com informações.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Interesse em Coisas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      Interesse em Coisas (IC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.IC}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por trabalho prático, manual, técnico e com resultados tangíveis.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Estabilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-cyan-500" />
                      Estabilidade (ES)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.ES}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por ambientes previsíveis, rotinas estabelecidas e processos claros.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Flexibilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Flexibilidade (FL)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.FL}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por mudanças, variedade, novos desafios e ambientes dinâmicos.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Autonomia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Autonomia (AU)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pontuação</span>
                        <Badge variant="secondary">{profile.pir.normalizedScores.AU}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferência por independência, liberdade de decisão e controle sobre o próprio trabalho.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dados PIR não disponíveis</AlertTitle>
              <AlertDescription>
                Os resultados do teste PIR não foram encontrados. Complete o teste PIR para ver seus resultados aqui.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Recomendações */}
        <TabsContent value="recommendations" className="space-y-4">
          {/* Estilo de Trabalho */}
          {latestTest.workStyle && (
            <Card>
              <CardHeader>
                <CardTitle>Estilo de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.workStyle}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estilo de Comunicação */}
          {latestTest.communicationStyle && (
            <Card>
              <CardHeader>
                <CardTitle>Estilo de Comunicação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.communicationStyle}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estilo de Liderança */}
          {latestTest.leadershipStyle && (
            <Card>
              <CardHeader>
                <CardTitle>Estilo de Liderança</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.leadershipStyle}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Motivadores */}
          {latestTest.motivators && (
            <Card>
              <CardHeader>
                <CardTitle>Motivadores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.motivators}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estressores */}
          {latestTest.stressors && (
            <Card>
              <CardHeader>
                <CardTitle>Estressores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.stressors}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contribuição para Equipe */}
          {latestTest.teamContribution && (
            <Card>
              <CardHeader>
                <CardTitle>Contribuição para Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.teamContribution}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recomendações de Carreira */}
          {latestTest.careerRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendações de Carreira</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.careerRecommendations}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pontos Fortes */}
          {latestTest.strengths && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.strengths}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Áreas de Desenvolvimento */}
          {latestTest.developmentAreas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  Áreas de Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestTest.developmentAreas}
                </p>
              </CardContent>
            </Card>
          )}

          {!latestTest.workStyle && !latestTest.communicationStyle && !latestTest.leadershipStyle && 
           !latestTest.motivators && !latestTest.stressors && !latestTest.teamContribution && 
           !latestTest.careerRecommendations && !latestTest.strengths && !latestTest.developmentAreas && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Recomendações não disponíveis</AlertTitle>
              <AlertDescription>
                As recomendações personalizadas não foram geradas para este teste.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
