import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TestIE() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<Record<number, number>>({});

  const { data: questions, isLoading } = trpc.psychometric.getQuestions.useQuery({ testType: "ie" });
  const submitMutation = trpc.psychometric.submitTest.useMutation();

  if (isLoading) {
    return <div className="container py-8">Carregando perguntas...</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="container py-8">Nenhuma pergunta encontrada.</div>;
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      toast.error(`Por favor, responda todas as ${totalQuestions} perguntas`);
      return;
    }

    try {
      await submitMutation.mutateAsync({
        testType: "ie",
        responses: Object.entries(responses).map(([questionId, score]) => ({
          questionId: parseInt(questionId),
          score,
        })),
      });

      toast.success("Teste de Inteligência Emocional enviado com sucesso!");
      setLocation("/testes-psicometricos");
    } catch (error) {
      toast.error("Erro ao enviar teste");
    }
  };

  // Agrupar perguntas por dimensão
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.dimension]) acc[q.dimension] = [];
    acc[q.dimension].push(q);
    return acc;
  }, {} as Record<string, typeof questions>);

  const dimensionDescriptions: Record<string, string> = {
    "Autoconsciência": "Capacidade de reconhecer e compreender suas próprias emoções",
    "Autorregulação": "Habilidade de controlar impulsos e adaptar-se a mudanças",
    "Motivação": "Impulso interno para alcançar objetivos e superar obstáculos",
    "Empatia": "Capacidade de compreender e se conectar com as emoções dos outros",
    "Habilidades Sociais": "Competência em construir relacionamentos e influenciar positivamente",
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/testes-psicometricos")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Teste de Inteligência Emocional</CardTitle>
          <CardDescription>
            Avalie suas competências emocionais baseadas no modelo de Daniel Goleman.
            Responda com sinceridade sobre como você geralmente se comporta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {answeredCount} de {totalQuestions} perguntas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([dimension, qs]) => (
          <Card key={dimension}>
            <CardHeader>
              <CardTitle className="text-lg">{dimension}</CardTitle>
              <CardDescription>{dimensionDescriptions[dimension]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {qs.map((q) => {
                const isAnswered = responses[q.id] !== undefined;
                
                return (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-start gap-2">
                      {isAnswered && <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />}
                      <Label className="text-base font-normal leading-relaxed">
                        {q.questionText}
                      </Label>
                    </div>
                    <RadioGroup
                      value={responses[q.id]?.toString()}
                      onValueChange={(value) =>
                        setResponses({ ...responses, [q.id]: parseInt(value) })
                      }
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <div key={score} className="flex flex-col items-center gap-2">
                            <RadioGroupItem value={score.toString()} id={`q${q.id}-${score}`} />
                            <Label
                              htmlFor={`q${q.id}-${score}`}
                              className="text-xs text-center cursor-pointer"
                            >
                              {score === 1 && "Nunca"}
                              {score === 2 && "Raramente"}
                              {score === 3 && "Às vezes"}
                              {score === 4 && "Frequentemente"}
                              {score === 5 && "Sempre"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={answeredCount < totalQuestions || submitMutation.isPending}
        >
          {submitMutation.isPending ? "Enviando..." : "Enviar Teste de IE"}
        </Button>
      </div>
    </div>
  );
}
