import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Brain, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Página de Teste DISC
 * Questionário interativo com 40 perguntas
 */

export default function TestDISC() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar perguntas DISC
  const { data: questions, isLoading } = trpc.psychometric.getQuestions.useQuery({ testType: "disc" });

  // Mutation para submeter teste
  const submitMutation = trpc.psychometric.submitTest.useMutation({
    onSuccess: (data) => {
      toast.success("Teste DISC concluído com sucesso!");
      setLocation("/testes-psicometricos");
    },
    onError: (error) => {
      toast.error(`Erro ao submeter teste: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleResponseChange = (questionId: number, score: number) => {
    setResponses({ ...responses, [questionId]: score });
  };

  const handleNext = () => {
    if (!questions) return;
    
    const currentQuestionId = questions[currentQuestion].id;
    if (!responses[currentQuestionId]) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (!questions) return;

    // Verificar se todas as perguntas foram respondidas
    const unanswered = questions.filter(q => !responses[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Ainda faltam ${unanswered.length} pergunta(s) para responder`);
      return;
    }

    setIsSubmitting(true);
    const formattedResponses = Object.entries(responses).map(([questionId, score]) => ({
      questionId: parseInt(questionId),
      score,
    }));

    submitMutation.mutate({
      testType: "disc",
      responses: formattedResponses,
    });
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

  if (!questions || questions.length === 0) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Teste DISC</CardTitle>
            <CardDescription>Nenhuma pergunta encontrada</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  const progress = (Object.keys(responses).length / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Teste DISC
          </h1>
          <p className="text-muted-foreground mt-2">
            Avalie cada afirmação de acordo com o quanto você concorda
          </p>
        </div>

        {/* Barra de Progresso */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Object.keys(responses).length} de {questions.length} perguntas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Pergunta Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pergunta {currentQuestion + 1} de {questions.length}
            </CardTitle>
            <CardDescription className="text-base mt-4">
              {currentQ.questionText}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[currentQ.id]?.toString()}
              onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="1" id={`q${currentQ.id}-1`} />
                  <Label htmlFor={`q${currentQ.id}-1`} className="flex-1 cursor-pointer">
                    1 - Discordo totalmente
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="2" id={`q${currentQ.id}-2`} />
                  <Label htmlFor={`q${currentQ.id}-2`} className="flex-1 cursor-pointer">
                    2 - Discordo parcialmente
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="3" id={`q${currentQ.id}-3`} />
                  <Label htmlFor={`q${currentQ.id}-3`} className="flex-1 cursor-pointer">
                    3 - Neutro
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="4" id={`q${currentQ.id}-4`} />
                  <Label htmlFor={`q${currentQ.id}-4`} className="flex-1 cursor-pointer">
                    4 - Concordo parcialmente
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="5" id={`q${currentQ.id}-5`} />
                  <Label htmlFor={`q${currentQ.id}-5`} className="flex-1 cursor-pointer">
                    5 - Concordo totalmente
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Próxima
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(responses).length < questions.length}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar Teste
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
