import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Award, Brain, CheckCircle, Download, TrendingUp, User } from "lucide-react";
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
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Buscar testes do usuário logado ou de um funcionário específico
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
  const profile = latestTest.profile;

  // Preparar dados para gráficos
  const discData = profile.disc
    ? [
        { trait: "Dominância", value: profile.disc.d, fullMark: 100 },
        { trait: "Influência", value: profile.disc.i, fullMark: 100 },
        { trait: "Estabilidade", value: profile.disc.s, fullMark: 100 },
        { trait: "Conformidade", value: profile.disc.c, fullMark: 100 },
      ]
    : [];

  const bigFiveData = profile.bigFive
    ? [
        { name: "Abertura", value: profile.bigFive.o },
        { name: "Conscienciosidade", value: profile.bigFive.c },
        { name: "Extroversão", value: profile.bigFive.e },
        { name: "Amabilidade", value: profile.bigFive.a },
        { name: "Neuroticismo", value: profile.bigFive.n },
      ]
    : [];

  // Determinar perfil DISC dominante
  const getDominantDISC = () => {
    if (!profile.disc) return null;
    const traits = [
      { name: "D - Dominância", value: profile.disc.d, color: "bg-red-500" },
      { name: "I - Influência", value: profile.disc.i, color: "bg-yellow-500" },
      { name: "S - Estabilidade", value: profile.disc.s, color: "bg-green-500" },
      { name: "C - Conformidade", value: profile.disc.c, color: "bg-blue-500" },
    ];
    return traits.reduce((max, trait) => (trait.value > max.value ? trait : max));
  };

  const dominantTrait = getDominantDISC();

  // Interpretações e recomendações
  const getInterpretation = () => {
    if (!profile.disc) return null;

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

    const dominant = dominantTrait?.name.charAt(0) || "D";
    return interpretations[dominant];
  };

  const interpretation = getInterpretation();

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
        <Button variant="outline" onClick={() => window.print()}>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="disc">DISC</TabsTrigger>
          <TabsTrigger value="bigfive">Big Five</TabsTrigger>
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

            {/* MBTI */}
            {profile.mbti && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Tipo MBTI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-2xl px-6 py-3">
                      {profile.mbti}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Tipo de personalidade Myers-Briggs
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
                  <ul className="space-y-1">
                    {interpretation.strengths.map((strength, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Áreas de Desenvolvimento
                  </h4>
                  <ul className="space-y-1">
                    {interpretation.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DISC */}
        <TabsContent value="disc" className="space-y-4">
          {profile.disc ? (
            <Card>
              <CardHeader>
                <CardTitle>Análise DISC</CardTitle>
                <CardDescription>
                  Perfil comportamental baseado em Dominância, Influência, Estabilidade e Conformidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={discData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Perfil DISC"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-red-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                      D
                    </div>
                    <p className="font-semibold">Dominância</p>
                    <p className="text-2xl font-bold text-primary">{profile.disc.d}%</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                      I
                    </div>
                    <p className="font-semibold">Influência</p>
                    <p className="text-2xl font-bold text-primary">{profile.disc.i}%</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-green-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                      S
                    </div>
                    <p className="font-semibold">Estabilidade</p>
                    <p className="text-2xl font-bold text-primary">{profile.disc.s}%</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                      C
                    </div>
                    <p className="font-semibold">Conformidade</p>
                    <p className="text-2xl font-bold text-primary">{profile.disc.c}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Teste DISC não realizado</AlertTitle>
              <AlertDescription>
                Complete o teste DISC para ver sua análise comportamental.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Big Five */}
        <TabsContent value="bigfive" className="space-y-4">
          {profile.bigFive ? (
            <Card>
              <CardHeader>
                <CardTitle>Análise Big Five</CardTitle>
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
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Pontuação" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Abertura ({profile.bigFive.o}%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Curiosidade intelectual, criatividade e preferência por novidades
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Conscienciosidade ({profile.bigFive.c}%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Organização, responsabilidade e orientação para objetivos
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Extroversão ({profile.bigFive.e}%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Sociabilidade, assertividade e busca por estimulação
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Amabilidade ({profile.bigFive.a}%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Cooperação, empatia e consideração pelos outros
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg col-span-1 md:col-span-2">
                    <h4 className="font-semibold mb-2">Neuroticismo ({profile.bigFive.n}%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Estabilidade emocional e tendência a experienciar emoções negativas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Teste Big Five não realizado</AlertTitle>
              <AlertDescription>
                Complete o teste Big Five para ver sua análise de personalidade.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Recomendações */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de Desenvolvimento</CardTitle>
              <CardDescription>
                Sugestões personalizadas baseadas no seu perfil psicométrico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {interpretation && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Ações Recomendadas</h3>
                    <div className="space-y-3">
                      {interpretation.improvements.map((improvement, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium">{improvement}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Trabalhe nesta área para maximizar seu potencial
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Aproveite Seus Pontos Fortes</h3>
                    <div className="space-y-2">
                      {interpretation.strengths.map((strength, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Próximos Passos:</strong> Converse com seu gestor ou RH para criar um Plano de Desenvolvimento Individual (PDI) 
                  personalizado baseado nestes resultados.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
