import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clipboard, Loader2, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

/**
 * Página de Formulário de Avaliação 360° Interativo
 * Permite responder avaliações 360° com perguntas organizadas por categoria
 */

interface Question {
  id: number;
  category: string;
  text: string;
}

export default function Avaliar360() {
  const params = useParams();
  const evaluationId = params.evaluationId ? parseInt(params.evaluationId) : null;

  const [evaluatorType, setEvaluatorType] = useState<"self" | "manager" | "peer" | "subordinate">("self");
  const [currentCategory, setCurrentCategory] = useState(0);
  const [responses, setResponses] = useState<Record<number, { score?: number; text?: string }>>({});

  // Buscar perguntas
  const { data: questions, isLoading } = trpc.evaluation360.getQuestions.useQuery({ evaluationId: evaluationId || 0 });

  // Mutation para submeter feedback
  const submitFeedbackMutation = trpc.evaluation360.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Resposta salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar resposta: ${error.message}`);
    },
  });

  // Agrupar perguntas por categoria
  const categorizedQuestions = useMemo(() => {
    if (!questions) return [];
    
    const categories: Record<string, typeof questions> = {};
    questions.forEach((q: Question) => {
      const cat = q.category || "Sem Categoria";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(q);
    });

    return Object.entries(categories).map(([category, qs]) => ({
      category,
      questions: qs,
    }));
  }, [questions]);

  const currentCategoryData = categorizedQuestions[currentCategory];

  // Calcular progresso
  const totalQuestions = questions?.length || 0;
  const answeredQuestions = Object.keys(responses).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleScoreChange = (questionId: number, score: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], score },
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  const handleSubmitAll = async () => {
    if (!evaluationId) {
      toast.error("ID de avaliação inválido");
      return;
    }

    const unanswered = questions?.filter((q: Question) => 
      !responses[q.id]?.score
    );

    if (unanswered && unanswered.length > 0) {
      toast.error(`Existem ${unanswered.length} perguntas não respondidas`);
      return;
    }

    try {
      // Consolidar todas as respostas em um feedback textual
      const feedbackText = Object.entries(responses)
        .map(([questionIdStr, response]) => {
          const question = questions?.find(q => q.id === parseInt(questionIdStr));
          return `${question?.text}: Nota ${response.score}/5${response.text ? ` - ${response.text}` : ''}`;
        })
        .join('\n\n');

      await submitFeedbackMutation.mutateAsync({
        evaluationId,
        feedback: feedbackText,
      });
      toast.success("Avaliação enviada com sucesso!");
      setResponses({});
    } catch (error) {
      toast.error("Erro ao enviar avaliação");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!evaluationId) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground">ID de avaliação não fornecido</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clipboard className="h-8 w-8" />
            Avaliação 360°
          </h1>
          <p className="text-muted-foreground mt-2">
            Responda as perguntas de forma honesta e construtiva
          </p>
        </div>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações da Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Avaliador</Label>
                <Select value={evaluatorType} onValueChange={(v: any) => setEvaluatorType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Autoavaliação</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="peer">Par/Colega</SelectItem>
                    <SelectItem value="subordinate">Subordinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Avaliação ID</Label>
                <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">#{evaluationId}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progresso */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="font-medium">
                  {answeredQuestions} / {totalQuestions} perguntas ({progress.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação de Categorias */}
        {categorizedQuestions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categorizedQuestions.map((cat: any, idx: number) => (
              <Button
                key={idx}
                variant={currentCategory === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentCategory(idx)}
              >
                {cat.category}
              </Button>
            ))}
          </div>
        )}

        {/* Perguntas da Categoria Atual */}
        {currentCategoryData && (
          <Card>
            <CardHeader>
              <CardTitle>{currentCategoryData.category}</CardTitle>
              <CardDescription>
                {currentCategoryData.questions.length} perguntas nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentCategoryData.questions.map((question: Question, idx: number) => (
                <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{idx + 1}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">{question.text}</p>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Escala de 1 (Discordo Totalmente) a 5 (Concordo Totalmente)
                        </Label>
                        <RadioGroup
                          value={responses[question.id]?.score?.toString() || ""}
                          onValueChange={(v) => handleScoreChange(question.id, parseInt(v))}
                        >
                          <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(score => (
                              <div key={score} className="flex items-center space-x-2">
                                <RadioGroupItem value={score.toString()} id={`q${question.id}-${score}`} />
                                <Label htmlFor={`q${question.id}-${score}`} className="cursor-pointer">
                                  {score}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {responses[question.id] && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Respondida</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navegação e Envio */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
            disabled={currentCategory === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Categoria Anterior
          </Button>

          {currentCategory === categorizedQuestions.length - 1 ? (
            <Button
              onClick={handleSubmitAll}
              disabled={submitFeedbackMutation.isPending}
              size="lg"
            >
              {submitFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentCategory(Math.min(categorizedQuestions.length - 1, currentCategory + 1))}
            >
              Próxima Categoria
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
