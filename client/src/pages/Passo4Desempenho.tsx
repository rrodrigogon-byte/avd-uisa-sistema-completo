import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, TrendingUp, ArrowLeft, ArrowRight, Award, Target, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import AVDStepGuard from "@/components/AVDStepGuard";
import AVDProgressBreadcrumbs from "@/components/AVDProgressBreadcrumbs";

/**
 * Passo 4: Avaliação de Desempenho Consolidada
 * Consolida dados dos passos anteriores e gera análise final
 */

export default function Passo4Desempenho() {
  const params = useParams();
  const [, navigate] = useLocation();
  const processId = params.processId ? parseInt(params.processId) : undefined;
  const employeeId = params.employeeId ? parseInt(params.employeeId) : undefined;

  const [strengthsAnalysis, setStrengthsAnalysis] = useState("");
  const [gapsAnalysis, setGapsAnalysis] = useState("");
  const [developmentRecommendations, setDevelopmentRecommendations] = useState("");
  const [careerRecommendations, setCareerRecommendations] = useState("");
  const [evaluatorComments, setEvaluatorComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados do processo
  const { data: process, isLoading: loadingProcess } = trpc.avd.getProcessByEmployee.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  // Buscar avaliação de competências (Passo 3)
  const { data: competencyAssessment, isLoading: loadingCompetency } = trpc.avd.getCompetencyAssessmentByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Buscar avaliação de desempenho existente (se houver)
  const { data: existingPerformance } = trpc.avd.getPerformanceAssessmentByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Mutation para criar avaliação de desempenho
  const createPerformanceAssessment = trpc.avd.createPerformanceAssessment.useMutation({
    onSuccess: (data) => {
      toast.success("Avaliação de desempenho concluída com sucesso!");
      
      // Atualizar processo para próximo passo
      updateProcessStep.mutate({
        processId: processId!,
        step: 4,
        stepId: data.id,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar avaliação: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Mutation para atualizar passo do processo
  const updateProcessStep = trpc.avd.updateProcessStep.useMutation({
    onSuccess: () => {
      // Navegar para próximo passo (PDI)
      navigate(`/avd/passo5/${processId}/${employeeId}`);
    },
  });

  // Carregar dados existentes
  useEffect(() => {
    if (existingPerformance) {
      setStrengthsAnalysis(existingPerformance.strengthsAnalysis || "");
      setGapsAnalysis(existingPerformance.gapsAnalysis || "");
      setDevelopmentRecommendations(existingPerformance.developmentRecommendations || "");
      setCareerRecommendations(existingPerformance.careerRecommendations || "");
      setEvaluatorComments(existingPerformance.evaluatorComments || "");
    }
  }, [existingPerformance]);

  const handleSubmit = async () => {
    if (!processId || !employeeId) {
      toast.error("Dados do processo não encontrados");
      return;
    }

    if (!competencyAssessment) {
      toast.error("Avaliação de competências não encontrada. Complete o Passo 3 primeiro.");
      return;
    }

    setIsSubmitting(true);

    // Calcular pontuações
    const competencyScore = competencyAssessment.overallScore || 0;
    const profileScore = 0; // Passo 1 não implementado ainda
    const pirScore = 0; // Score do PIR (Passo 2) - pode ser buscado se disponível

    createPerformanceAssessment.mutate({
      processId,
      employeeId,
      profileScore,
      pirScore,
      competencyScore,
      profileWeight: 20,
      pirWeight: 20,
      competencyWeight: 60,
      strengthsAnalysis,
      gapsAnalysis,
      developmentRecommendations,
      careerRecommendations,
      evaluatorComments,
    });
  };

  if (loadingProcess || loadingCompetency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!competencyAssessment) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Competências Pendente</CardTitle>
            <CardDescription>
              Você precisa completar o Passo 3 (Avaliação de Competências) antes de prosseguir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/avd/passo3/${processId}/${employeeId}`)}>
              Ir para Passo 3
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular pontuação final
  const competencyScore = competencyAssessment.overallScore || 0;
  const profileScore = 0;
  const pirScore = 0;
  
  const profileWeight = 20;
  const pirWeight = 20;
  const competencyWeight = 60;
  
  const finalScore = Math.round(
    (profileScore * profileWeight / 100) +
    (pirScore * pirWeight / 100) +
    (competencyScore * competencyWeight / 100)
  );

  // Determinar classificação
  let performanceRating = "";
  let ratingColor = "";
  if (finalScore < 40) {
    performanceRating = "Insatisfatório";
    ratingColor = "destructive";
  } else if (finalScore < 60) {
    performanceRating = "Abaixo das Expectativas";
    ratingColor = "secondary";
  } else if (finalScore < 75) {
    performanceRating = "Atende Expectativas";
    ratingColor = "default";
  } else if (finalScore < 90) {
    performanceRating = "Supera Expectativas";
    ratingColor = "default";
  } else {
    performanceRating = "Excepcional";
    ratingColor = "default";
  }

  const completedSteps = [1, 2, 3];

  return (
    <AVDStepGuard currentStep={4} processId={processId || 0}>
      <AVDProgressBreadcrumbs 
        currentStep={4} 
        completedSteps={completedSteps} 
        processId={processId || 0}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Passo 4: Avaliação de Desempenho</h1>
            <p className="text-muted-foreground">
              Consolidação e análise dos resultados dos passos anteriores
            </p>
          </div>
        </div>
      </div>

      {/* Resumo de Pontuações */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Resumo de Pontuações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Perfil Comportamental */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Perfil Comportamental</span>
                <Badge variant="outline">{profileWeight}%</Badge>
              </div>
              <div className="space-y-1">
                <Progress value={profileScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Pontuação: {profileScore}/100
                </p>
              </div>
            </div>

            {/* PIR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PIR (Interesses)</span>
                <Badge variant="outline">{pirWeight}%</Badge>
              </div>
              <div className="space-y-1">
                <Progress value={pirScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Pontuação: {pirScore}/100
                </p>
              </div>
            </div>

            {/* Competências */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Competências</span>
                <Badge variant="outline">{competencyWeight}%</Badge>
              </div>
              <div className="space-y-1">
                <Progress value={competencyScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Pontuação: {competencyScore}/100
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pontuação Final */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-semibold text-lg">Pontuação Final</h3>
              <p className="text-sm text-muted-foreground">
                Média ponderada dos três componentes
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{finalScore}</div>
              <Badge variant={ratingColor as any} className="mt-1">
                {performanceRating}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Pontos Fortes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Análise de Pontos Fortes</CardTitle>
          <CardDescription>
            Identifique as principais competências e características positivas demonstradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva os principais pontos fortes identificados na avaliação..."
            value={strengthsAnalysis}
            onChange={(e) => setStrengthsAnalysis(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Análise de Gaps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Análise de Gaps e Oportunidades de Melhoria</CardTitle>
          <CardDescription>
            Identifique áreas que necessitam desenvolvimento e aprimoramento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva os principais gaps e oportunidades de desenvolvimento..."
            value={gapsAnalysis}
            onChange={(e) => setGapsAnalysis(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Recomendações de Desenvolvimento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recomendações de Desenvolvimento</CardTitle>
          <CardDescription>
            Sugestões de ações e iniciativas para desenvolvimento profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Sugira ações de desenvolvimento, treinamentos, mentorias, etc..."
            value={developmentRecommendations}
            onChange={(e) => setDevelopmentRecommendations(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Recomendações de Carreira */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recomendações de Carreira</CardTitle>
          <CardDescription>
            Orientações sobre possíveis caminhos de carreira e progressão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Sugira possíveis caminhos de carreira, promoções, movimentações laterais..."
            value={careerRecommendations}
            onChange={(e) => setCareerRecommendations(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Comentários do Avaliador */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Comentários Gerais do Avaliador</CardTitle>
          <CardDescription>
            Observações adicionais sobre o desempenho e potencial do colaborador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Comentários gerais, contexto adicional, observações importantes..."
            value={evaluatorComments}
            onChange={(e) => setEvaluatorComments(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => navigate(`/avd/passo3/${processId}/${employeeId}`)}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Passo 3
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Concluir e Avançar para PDI
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
        </div>
      </div>
    </AVDStepGuard>
  );
}
