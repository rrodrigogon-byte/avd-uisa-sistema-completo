import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
  const { data: competencies, isLoading: loadingCompetencies } = trpc.avd.listCompetencies.useQuery();

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

  const handleCommentsChange = (competencyId: number, field: 'comments' | 'behaviorExamples', value: string) => {
    setItems(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competencyId,
        score: prev[competencyId]?.score || 3,
        [field]: value,
        [field === 'comments' ? 'behaviorExamples' : 'comments']: prev[competencyId]?.[field === 'comments' ? 'behaviorExamples' : 'comments'] || "",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!processId || !employeeId) {
      toast.error("Dados do processo não encontrados");
      return;
    }

    const itemsArray = Object.values(items);
    
    if (itemsArray.length === 0) {
      toast.error("Por favor, avalie pelo menos uma competência");
      return;
    }

    // Verificar se todas as competências foram avaliadas
    const unevaluatedCompetencies = competencies?.filter(c => !items[c.id]);
    if (unevaluatedCompetencies && unevaluatedCompetencies.length > 0) {
      toast.error(`Por favor, avalie todas as competências (${unevaluatedCompetencies.length} pendentes)`);
      return;
    }

    setIsSubmitting(true);

    createAssessment.mutate({
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

  // Agrupar competências por categoria
  const competenciesByCategory = competencies?.reduce((acc: Record<string, any[]>, comp: any) => {
    const category = comp.category || "Geral";
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {}) || {};

  return (
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
            <CardContent className="space-y-6">
              {comps.map((competency: any) => {
                const item = items[competency.id];
                const score = item?.score || 3;

                return (
                  <div key={competency.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{competency.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {competency.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {score.toFixed(1)}
                        </Badge>
                      </div>

                      {/* Slider de Pontuação */}
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1 - Iniciante</span>
                          <span>2 - Básico</span>
                          <span>3 - Intermediário</span>
                          <span>4 - Avançado</span>
                          <span>5 - Especialista</span>
                        </div>
                        <Slider
                          value={[score]}
                          onValueChange={(values) => handleScoreChange(competency.id, values[0])}
                          min={1}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Star
                              key={level}
                              className={`h-5 w-5 ${
                                level <= Math.floor(score)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : level - 0.5 <= score
                                  ? "fill-yellow-200 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Comentários */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`comments-${competency.id}`} className="text-sm">
                          Comentários sobre esta competência
                        </Label>
                        <Textarea
                          id={`comments-${competency.id}`}
                          placeholder="Descreva seu nível de domínio e experiências relevantes..."
                          value={item?.comments || ""}
                          onChange={(e) => handleCommentsChange(competency.id, 'comments', e.target.value)}
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`examples-${competency.id}`} className="text-sm">
                          Exemplos de comportamentos demonstrados
                        </Label>
                        <Textarea
                          id={`examples-${competency.id}`}
                          placeholder="Cite situações específicas onde demonstrou esta competência..."
                          value={item?.behaviorExamples || ""}
                          onChange={(e) => handleCommentsChange(competency.id, 'behaviorExamples', e.target.value)}
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Comentários Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Comentários Gerais</CardTitle>
            <CardDescription>
              Adicione observações gerais sobre sua avaliação de competências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Comentários adicionais, contexto ou observações gerais..."
              value={generalComments}
              onChange={(e) => setGeneralComments(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

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
  );
}
