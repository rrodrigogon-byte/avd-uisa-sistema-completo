import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";

/**
 * Formulário de Avaliação 360°
 * Interface interativa para responder avaliações
 */
export default function Feedback360Evaluation() {
  const params = useParams();
  const evaluatorId = parseInt(params.evaluatorId || "0");

  const [currentCompetencyIndex, setCurrentCompetencyIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, {
    rating: number;
    comment?: string;
    behavioralExamples?: string;
  }>>({});

  // Queries
  const { data: evaluator, isLoading: loadingEvaluator } = trpc.feedback360New.getMyPendingEvaluations.useQuery({});
  
  // TODO: Buscar competências do ciclo
  // Por enquanto, vamos usar competências mock
  const competencies = [
    { id: 1, name: "Comunicação", category: "Comportamental", description: "Capacidade de se comunicar de forma clara e efetiva" },
    { id: 2, name: "Trabalho em Equipe", category: "Comportamental", description: "Colaboração e cooperação com colegas" },
    { id: 3, name: "Liderança", category: "Comportamental", description: "Capacidade de liderar e inspirar outros" },
    { id: 4, name: "Resolução de Problemas", category: "Técnica", description: "Habilidade para identificar e resolver problemas" },
    { id: 5, name: "Inovação", category: "Técnica", description: "Capacidade de propor soluções criativas" },
  ];

  const currentCompetency = competencies[currentCompetencyIndex];
  const totalCompetencies = competencies.length;
  const progress = ((currentCompetencyIndex + 1) / totalCompetencies) * 100;

  // Mutations
  const submitResponsesMutation = trpc.feedback360New.submitResponses.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      window.location.href = "/feedback360";
    },
    onError: (error) => {
      toast.error(`Erro ao enviar avaliação: ${error.message}`);
    },
  });

  const handleRatingChange = (rating: number) => {
    setResponses({
      ...responses,
      [currentCompetency.id]: {
        ...responses[currentCompetency.id],
        rating,
      },
    });
  };

  const handleCommentChange = (field: "comment" | "behavioralExamples", value: string) => {
    setResponses({
      ...responses,
      [currentCompetency.id]: {
        ...responses[currentCompetency.id],
        [field]: value,
      },
    });
  };

  const handleNext = () => {
    if (!responses[currentCompetency.id]?.rating) {
      toast.error("Por favor, selecione uma avaliação antes de continuar");
      return;
    }

    if (currentCompetencyIndex < totalCompetencies - 1) {
      setCurrentCompetencyIndex(currentCompetencyIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCompetencyIndex > 0) {
      setCurrentCompetencyIndex(currentCompetencyIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Validar que todas as competências foram avaliadas
    const missingRatings = competencies.filter(c => !responses[c.id]?.rating);
    if (missingRatings.length > 0) {
      toast.error(`Você precisa avaliar todas as competências antes de enviar (${missingRatings.length} pendentes)`);
      return;
    }

    // Preparar dados para envio
    const responsesArray = Object.entries(responses).map(([competencyId, data]) => ({
      competencyId: parseInt(competencyId),
      rating: data.rating,
      comment: data.comment,
      behavioralExamples: data.behavioralExamples,
    }));

    submitResponsesMutation.mutate({
      evaluatorId,
      responses: responsesArray,
    });
  };

  const getRatingLabel = (rating: number) => {
    const labels = {
      1: "Muito Abaixo do Esperado",
      2: "Abaixo do Esperado",
      3: "Atende o Esperado",
      4: "Supera o Esperado",
      5: "Excepcional",
    };
    return labels[rating as keyof typeof labels];
  };

  const getRatingColor = (rating: number) => {
    const colors = {
      1: "text-red-600",
      2: "text-orange-600",
      3: "text-yellow-600",
      4: "text-blue-600",
      5: "text-green-600",
    };
    return colors[rating as keyof typeof colors];
  };

  if (loadingEvaluator) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Avaliação de Feedback 360°</h1>
          <p className="text-muted-foreground">
            Avalie as competências do colaborador de forma objetiva e construtiva
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progresso</span>
                <span className="text-muted-foreground">
                  {currentCompetencyIndex + 1} de {totalCompetencies} competências
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Competency Evaluation */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{currentCompetency.name}</CardTitle>
                <CardDescription className="mt-2">
                  {currentCompetency.description}
                </CardDescription>
              </div>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {currentCompetency.category}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating Scale */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Avaliação *</Label>
              <RadioGroup
                value={responses[currentCompetency.id]?.rating?.toString()}
                onValueChange={(value) => handleRatingChange(parseInt(value))}
                className="space-y-3"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div
                    key={rating}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label
                      htmlFor={`rating-${rating}`}
                      className={`flex-1 cursor-pointer ${
                        responses[currentCompetency.id]?.rating === rating ? getRatingColor(rating) : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{rating} - {getRatingLabel(rating)}</span>
                        {responses[currentCompetency.id]?.rating === rating && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Selecionado
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comentários (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Adicione comentários sobre esta competência..."
                value={responses[currentCompetency.id]?.comment || ""}
                onChange={(e) => handleCommentChange("comment", e.target.value)}
                rows={3}
              />
            </div>

            {/* Behavioral Examples */}
            <div className="space-y-2">
              <Label htmlFor="examples">Exemplos Comportamentais (opcional)</Label>
              <Textarea
                id="examples"
                placeholder="Descreva situações específicas que demonstram esta competência..."
                value={responses[currentCompetency.id]?.behavioralExamples || ""}
                onChange={(e) => handleCommentChange("behavioralExamples", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Exemplos concretos ajudam a fornecer feedback mais útil e acionável
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCompetencyIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentCompetencyIndex < totalCompetencies - 1 ? (
            <Button onClick={handleNext}>
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitResponsesMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitResponsesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo das Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {competencies.map((comp, index) => (
                <div
                  key={comp.id}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                    index === currentCompetencyIndex
                      ? "bg-primary text-primary-foreground"
                      : responses[comp.id]?.rating
                      ? "bg-green-50 border-green-200"
                      : "bg-muted"
                  }`}
                  onClick={() => setCurrentCompetencyIndex(index)}
                >
                  <div className="text-xs font-medium truncate">{comp.name}</div>
                  {responses[comp.id]?.rating && (
                    <div className="text-lg font-bold mt-1">{responses[comp.id].rating}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
