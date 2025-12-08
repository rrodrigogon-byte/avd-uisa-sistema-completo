import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

const scaleLabels = [
  "Discordo Totalmente",
  "Discordo",
  "Neutro",
  "Concordo",
  "Concordo Totalmente",
];

export default function TestResponse() {
  const [, params] = useRoute("/teste/:token");
  const token = params?.token || "";

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Query para buscar dados do convite
  const { data, isLoading, error } = trpc.psychometricTests.getInvitationByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  // Mutation para iniciar teste
  const startTest = trpc.psychometricTests.startTest.useMutation({
    onSuccess: () => {
      setTestStarted(true);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar teste: ${error.message}`);
    },
  });

  // Mutation para submeter teste
  const submitTest = trpc.psychometricTests.submitTest.useMutation({
    onSuccess: () => {
      setTestCompleted(true);
      toast.success("Teste concluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao submeter teste: ${error.message}`);
    },
  });

  const questions = data?.questions || [];
  const totalQuestions = questions.length;
  const progress = (Object.keys(responses).length / totalQuestions) * 100;

  const handleStart = () => {
    startTest.mutate({ token });
  };

  const handleAnswer = (questionId: number, answer: number) => {
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Avançar para próxima questão automaticamente
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setQuestionStartTime(Date.now());
      }, 300);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(responses).length < totalQuestions) {
      toast.error("Por favor, responda todas as questões antes de enviar");
      return;
    }

    const formattedResponses = questions.map((q) => ({
      questionId: q.id,
      answer: responses[q.id],
      responseTime: Math.floor((Date.now() - startTime) / 1000 / totalQuestions),
    }));

    submitTest.mutate({
      token,
      responses: formattedResponses,
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setQuestionStartTime(Date.now());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando teste...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erro ao Carregar Teste</h2>
            <p className="text-muted-foreground text-center">
              {error?.message || "Convite não encontrado ou expirado"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Teste Concluído!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Obrigado por completar o teste. Seus resultados foram salvos e serão
              analisados pela equipe de RH.
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testStarted) {
    const testTypeLabels: Record<string, string> = {
      disc: "DISC",
      bigfive: "Big Five",
      mbti: "MBTI",
      ie: "Inteligência Emocional",
      vark: "VARK",
      leadership: "Liderança",
      careeranchors: "Âncoras de Carreira",
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16" />
            </div>
            <CardTitle className="text-3xl">
              Teste Psicométrico: {testTypeLabels[data.invitation.testType]}
            </CardTitle>
            <CardDescription>
              Olá, <strong>{data.employee?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Informações do Teste</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Total de questões: {totalQuestions}</li>
                <li>• Tempo estimado: {Math.ceil(totalQuestions / 4)} minutos</li>
                <li>• Não existem respostas certas ou erradas</li>
                <li>• Responda de forma honesta e espontânea</li>
                <li>• Você pode navegar entre as questões</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Instruções</h3>
              <p className="text-sm text-muted-foreground">
                Leia cada afirmação cuidadosamente e indique o quanto você concorda ou
                discorda usando a escala de 1 a 5. Responda pensando em como você
                realmente é, não em como gostaria de ser.
              </p>
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              size="lg"
              disabled={startTest.isPending}
            >
              {startTest.isPending ? "Iniciando..." : "Iniciar Teste"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              Questão {currentQuestion + 1} de {totalQuestions}
            </h1>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% completo
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{currentQ?.questionText}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[currentQ?.id]?.toString()}
              onValueChange={(value) => handleAnswer(currentQ?.id, parseInt(value))}
            >
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div
                    key={value}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <RadioGroupItem value={value.toString()} id={`q${currentQ?.id}-${value}`} />
                    <Label
                      htmlFor={`q${currentQ?.id}-${value}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{value}</span> - {scaleLabels[value - 1]}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground"
                    : responses[questions[index]?.id]
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              if (currentQuestion < totalQuestions - 1) {
                goToQuestion(currentQuestion + 1);
              }
            }}
            disabled={currentQuestion === totalQuestions - 1}
          >
            Próxima
          </Button>
        </div>

        {/* Submit Button */}
        {Object.keys(responses).length === totalQuestions && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Todas as questões respondidas!</h3>
                  <p className="text-sm text-muted-foreground">
                    Revise suas respostas ou clique em "Enviar Teste" para finalizar.
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={submitTest.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitTest.isPending ? "Enviando..." : "Enviar Teste"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
