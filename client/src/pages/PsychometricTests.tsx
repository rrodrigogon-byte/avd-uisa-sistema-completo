import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, TrendingUp, Users, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

/**
 * Página de Testes Psicométricos
 * Exibe testes disponíveis e resultados anteriores
 */

const DISC_LABELS: Record<string, { name: string; color: string; description: string }> = {
  D: { name: "Dominância", color: "bg-red-500", description: "Direto, orientado a resultados, decisivo" },
  I: { name: "Influência", color: "bg-yellow-500", description: "Sociável, entusiasta, persuasivo" },
  S: { name: "Estabilidade", color: "bg-green-500", description: "Paciente, leal, colaborativo" },
  C: { name: "Conformidade", color: "bg-blue-500", description: "Analítico, preciso, sistemático" },
};

const BIG_FIVE_LABELS: Record<string, { name: string; description: string }> = {
  O: { name: "Abertura", description: "Criatividade e curiosidade intelectual" },
  C: { name: "Conscienciosidade", description: "Organização e responsabilidade" },
  E: { name: "Extroversão", description: "Sociabilidade e energia" },
  A: { name: "Amabilidade", description: "Empatia e cooperação" },
  N: { name: "Neuroticismo", description: "Estabilidade emocional" },
};

export default function PsychometricTests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar testes realizados
  const { data: tests, isLoading } = trpc.psychometric.getTests.useQuery();

  const discTests = tests?.filter(t => t.testType === "disc") || [];
  const bigFiveTests = tests?.filter(t => t.testType === "bigfive") || [];
  const mbtiTests = tests?.filter(t => t.testType === "mbti") || [];
  const ieTests = tests?.filter(t => t.testType === "ie") || [];
  const varkTests = tests?.filter(t => t.testType === "vark") || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Testes Psicométricos
          </h1>
          <p className="text-muted-foreground mt-2">
            Conheça seu perfil comportamental e de personalidade
          </p>
        </div>

        {/* Testes Disponíveis */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Teste DISC
              </CardTitle>
              <CardDescription>
                Avalia seu estilo comportamental em 4 dimensões: Dominância, Influência, Estabilidade e Conformidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">40 perguntas · 10 minutos</span>
                {discTests.length > 0 && (
                  <Badge variant="secondary">Realizado {discTests.length}x</Badge>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/teste-disc")}
              >
                {discTests.length > 0 ? "Refazer Teste" : "Iniciar Teste"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Teste Big Five (OCEAN)
              </CardTitle>
              <CardDescription>
                Avalia sua personalidade em 5 dimensões: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">50 perguntas · 12 minutos</span>
                {bigFiveTests.length > 0 && (
                  <Badge variant="secondary">Realizado {bigFiveTests.length}x</Badge>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/teste-bigfive")}
              >
                {bigFiveTests.length > 0 ? "Refazer Teste" : "Iniciar Teste"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teste MBTI
              </CardTitle>
              <CardDescription>
                Identifica seu tipo de personalidade entre os 16 tipos do Myers-Briggs Type Indicator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">20 perguntas · 8 minutos</span>
                {mbtiTests.length > 0 && (
                  <Badge variant="secondary">Realizado {mbtiTests.length}x</Badge>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/teste-mbti")}
              >
                {mbtiTests.length > 0 ? "Refazer Teste" : "Iniciar Teste"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Inteligência Emocional
              </CardTitle>
              <CardDescription>
                Avalia suas competências emocionais baseadas no modelo de Daniel Goleman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">25 perguntas · 10 minutos</span>
                {ieTests.length > 0 && (
                  <Badge variant="secondary">Realizado {ieTests.length}x</Badge>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/teste-ie")}
              >
                {ieTests.length > 0 ? "Refazer Teste" : "Iniciar Teste"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estilos de Aprendizagem (VARK)
              </CardTitle>
              <CardDescription>
                Identifica seu estilo preferido: Visual, Auditivo, Leitura/Escrita ou Cinestésico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">20 perguntas · 8 minutos</span>
                {varkTests.length > 0 && (
                  <Badge variant="secondary">Realizado {varkTests.length}x</Badge>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/teste-vark")}
              >
                {varkTests.length > 0 ? "Refazer Teste" : "Iniciar Teste"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados DISC */}
        {discTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado DISC Mais Recente</CardTitle>
              <CardDescription>
                Realizado em {new Date(discTests[0].completedAt).toLocaleDateString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Perfil Dominante</h3>
                    {discTests[0].discProfile && (
                      <div className="flex items-center gap-2">
                        <Badge className={DISC_LABELS[discTests[0].discProfile]?.color}>
                          {DISC_LABELS[discTests[0].discProfile]?.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {DISC_LABELS[discTests[0].discProfile]?.description}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Scores por Dimensão</h3>
                    {discTests[0].profile && Object.entries(discTests[0].profile).map(([key, value]) => {
                      if (key === "dominantProfile") return null;
                      const label = DISC_LABELS[key];
                      if (!label) return null;
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{label.name}</span>
                            <span className="font-semibold">{((value as number) * 20).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${label.color}`}
                              style={{ width: `${(value as number) * 20}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Gráfico Radar</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={[
                      { dimension: "D", value: discTests[0].discDominance || 0 },
                      { dimension: "I", value: discTests[0].discInfluence || 0 },
                      { dimension: "S", value: discTests[0].discSteadiness || 0 },
                      { dimension: "C", value: discTests[0].discCompliance || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="DISC"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados Big Five */}
        {bigFiveTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado Big Five Mais Recente</CardTitle>
              <CardDescription>
                Realizado em {new Date(bigFiveTests[0].completedAt).toLocaleDateString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Scores por Dimensão (OCEAN)</h3>
                  {bigFiveTests[0].profile && Object.entries(bigFiveTests[0].profile).map(([key, value]) => {
                    const label = BIG_FIVE_LABELS[key];
                    if (!label) return null;
                    
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{label.name}</span>
                          <span className="font-semibold">{((value as number) * 20).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(value as number) * 20}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{label.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Gráfico Radar</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { dimension: "Abertura", value: bigFiveTests[0].bigFiveOpenness || 0 },
                      { dimension: "Conscienciosidade", value: bigFiveTests[0].bigFiveConscientiousness || 0 },
                      { dimension: "Extroversão", value: bigFiveTests[0].bigFiveExtraversion || 0 },
                      { dimension: "Amabilidade", value: bigFiveTests[0].bigFiveAgreeableness || 0 },
                      { dimension: "Neuroticismo", value: bigFiveTests[0].bigFiveNeuroticism || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Big Five"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem se não houver testes */}
        {tests && tests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum teste realizado</h3>
              <p className="text-muted-foreground mb-4">
                Comece realizando um dos testes acima para conhecer seu perfil
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
