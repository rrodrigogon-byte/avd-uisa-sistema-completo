import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Target, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AVDStepGuard from "@/components/AVDStepGuard";
import AVDProgressBreadcrumbs from "@/components/AVDProgressBreadcrumbs";

/**
 * Passo 3: Avaliação de Competências
 * Interface para avaliar competências comportamentais e técnicas
 */

interface CompetencyItem {
  competencyId: number;
  score: number;
  comments: string;
  behaviorExamples: string;
}

export default function Passo3Competencias() {
  const params = useParams();
  const [, navigate] = useLocation();
  const processId = params.processId ? parseInt(params.processId) : undefined;
  const employeeId = params.employeeId ? parseInt(params.employeeId) : undefined;

  const [items, setItems] = useState<Record<number, CompetencyItem>>({});
  const [generalComments, setGeneralComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar competências disponíveis
  const { data: competencies, isLoading: loadingCompetencies } = trpc.avd.listCompetencies.useQuery({});

  // Buscar avaliação existente (se houver)
  const { data: existingAssessment } = trpc.avd.getCompetencyAssessmentByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Mutation para criar avaliação
  const createAssessment = trpc.avd.createCompetencyAssessment.useMutation({
    onSuccess: (data) => {
      toast.success("Avaliação de competências concluída com sucesso!");
      
      // Atualizar processo para próximo passo
      updateProcessStep.mutate({
        processId: processId!,
        step: 3,
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
      // Navegar para próximo passo
      navigate(`/avd/passo4/${processId}/${employeeId}`);
    },
  });

  // Carregar dados existentes
  useEffect(() => {
    if (existingAssessment?.items) {
      const loadedItems: Record<number, CompetencyItem> = {};
      existingAssessment.items.forEach((item: any) => {
        loadedItems[item.competencyId] = {
          competencyId: item.competencyId,
          score: item.score,
          comments: item.comments || "",
          behaviorExamples: item.behaviorExamples || "",
        };
      });
      setItems(loadedItems);
      setGeneralComments(existingAssessment.comments || "");
    }
  }, [existingAssessment]);

  const handleScoreChange = (competencyId: number, score: number) => {
    setItems(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competencyId,
        score,
        comments: prev[competencyId]?.comments || "",
        behaviorExamples: prev[competencyId]?.behaviorExamples || "",
      },
    }));
  };

  const handleFieldChange = (competencyId: number, field: 'comments' | 'behaviorExamples', value: string) => {
    setItems(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competencyId,
        score: prev[competencyId]?.score || 0,
        comments: field === 'comments' ? value : prev[competencyId]?.comments || "",
        behaviorExamples: field === 'behaviorExamples' ? value : prev[competencyId]?.behaviorExamples || "",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!processId || !employeeId) {
      toast.error("Informações do processo incompletas");
      return;
    }

    // Validar que todas as competências foram avaliadas
    const totalCompetencies = competencies?.length || 0;
    const evaluatedCount = Object.keys(items).length;

    if (evaluatedCount < totalCompetencies) {
      toast.error("Por favor, avalie todas as competências antes de continuar");
      return;
    }

    setIsSubmitting(true);

    // Converter items para array
    const itemsArray = Object.values(items);

    await createAssessment.mutateAsync({
      processId,
      employeeId,
      assessmentType: 'autoavaliacao',
      items: itemsArray,
      comments: generalComments,
    });
  };

  // Calcular progresso
  const totalCompetencies = competencies?.length || 0;
  const evaluatedCount = Object.keys(items).length;
  const progress = totalCompetencies > 0 ? (evaluatedCount / totalCompetencies) * 100 : 0;

  // Calcular pontuação média
  const averageScore = evaluatedCount > 0
    ? Object.values(items).reduce((sum, item) => sum + item.score, 0) / evaluatedCount
    : 0;

  if (loadingCompetencies) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedSteps = existingAssessment ? [1, 2] : [1];

  // Agrupar competências por categoria
  const competenciesByCategory = competencies?.reduce((acc: Record<string, any[]>, comp: any) => {
    const category = comp.category || "Geral";
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {}) || {};

  return (
    <AVDStepGuard currentStep={3} processId={processId || 0}>
      <AVDProgressBreadcrumbs 
        currentStep={3} 
        completedSteps={completedSteps} 
        processId={processId || 0}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Passo 3: Avaliação de Competências</h1>
                <p className="text-muted-foreground">
                  Avalie suas competências comportamentais e técnicas
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progresso da Avaliação</span>
                    <span className="text-muted-foreground">
                      {evaluatedCount} de {totalCompetencies} competências avaliadas
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {averageScore > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">Pontuação Média:</span>
                      <Badge variant={averageScore >= 4 ? "default" : averageScore >= 3 ? "secondary" : "destructive"}>
                        {averageScore.toFixed(1)} / 5.0
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competências por Categoria */}
          <div className="space-y-6">
            {Object.entries(competenciesByCategory).map(([category, comps]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-xl">{category}</CardTitle>
                  <CardDescription>
                    {comps.length} competência{comps.length !== 1 ? 's' : ''} nesta categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {comps.map((competency: any) => (
                      <div key={competency.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{competency.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {competency.description}
                              </p>
                            </div>
                            {items[competency.id]?.score > 0 && (
                              <CheckCircle2 className="h-5 w-5 text-green-600 ml-4 flex-shrink-0" />
                            )}
                          </div>

                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>1 - Iniciante</span>
                              <span>2 - Básico</span>
                              <span>3 - Intermediário</span>
                              <span>4 - Avançado</span>
                              <span>5 - Especialista</span>
                            </div>
                            <Slider
                              value={[items[competency.id]?.score || 0]}
                              onValueChange={(value) => handleScoreChange(competency.id, value[0])}
                              min={0}
                              max={5}
                              step={1}
                              className="py-4"
                            />
                            <div className="flex justify-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                                    items[competency.id]?.score === level
                                      ? "bg-primary text-primary-foreground scale-110"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {level}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Campos de comentários */}
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`comments-${competency.id}`} className="text-sm font-medium">
                              Comentários sobre esta competência
                            </Label>
                            <Textarea
                              id={`comments-${competency.id}`}
                              value={items[competency.id]?.comments || ""}
                              onChange={(e) => handleFieldChange(competency.id, 'comments', e.target.value)}
                              placeholder="Descreva como você demonstra esta competência no dia a dia..."
                              className="mt-2"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`examples-${competency.id}`} className="text-sm font-medium">
                              Exemplos de comportamentos observados
                            </Label>
                            <Textarea
                              id={`examples-${competency.id}`}
                              value={items[competency.id]?.behaviorExamples || ""}
                              onChange={(e) => handleFieldChange(competency.id, 'behaviorExamples', e.target.value)}
                              placeholder="Cite exemplos específicos de situações onde você demonstrou esta competência..."
                              className="mt-2"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comentários Gerais */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Comentários Gerais</CardTitle>
              <CardDescription>
                Adicione observações gerais sobre suas competências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                placeholder="Compartilhe suas reflexões sobre o conjunto de competências avaliadas..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => navigate(`/avd/passo2/${processId}/${employeeId}`)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Passo 2
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || progress < 100}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Concluir e Avançar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {progress < 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Avalie todas as competências para prosseguir para o próximo passo
            </p>
          )}
        </div>
      </div>
    </AVDStepGuard>
  );
}
