import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Página pública para responder ao teste de integridade PIR via link de convite
 * Não requer autenticação - acesso via token único
 */
export default function ResponderPIRIntegridade() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const token = params.token || "";

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: invitation, isLoading: loadingInvitation, error: invitationError } =
    trpc.integrityPIR.getInvitationByToken.useQuery({ token });

  const { data: questionsData, isLoading: loadingQuestions } =
    trpc.pirIntegrity.listQuestions.useQuery(
      { active: true, limit: 100 },
      { enabled: !!invitation && invitation.status !== "expired" }
    );

  // Mutations
  const startInvitation = trpc.integrityPIR.startInvitation.useMutation();
  const submitPIR = trpc.integrityPIR.submitPIRPublic.useMutation({
    onSuccess: () => {
      toast.success("Teste concluído com sucesso!");
      navigate("/integridade/obrigado");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar teste: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Marcar convite como iniciado ao carregar
  useEffect(() => {
    if (invitation && (invitation.status === "pending" || invitation.status === "sent")) {
      startInvitation.mutate({ token });
    }
  }, [invitation?.id]);

  const questions = questionsData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = answers[currentQuestion?.id] !== undefined;

  // Estados de carregamento e erro
  if (loadingInvitation || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Carregando teste...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <CardTitle>Convite Não Encontrado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              O link que você acessou não é válido ou não existe.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="h-6 w-6" />
              <CardTitle>Convite Expirado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Este convite expirou em{" "}
              {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}. Entre em contato com
              o responsável para solicitar um novo convite.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <CardTitle>Teste Já Concluído</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Você já completou este teste em{" "}
              {invitation.completedAt
                ? new Date(invitation.completedAt).toLocaleDateString("pt-BR")
                : "uma data anterior"}
              . Obrigado pela participação!
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: parseInt(value) }));
  };

  const handleNext = () => {
    if (!canProceed) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScores = () => {
    const dimensionScores: Record<string, number[]> = {};

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer !== undefined && q.dimension) {
        if (!dimensionScores[q.dimension]) {
          dimensionScores[q.dimension] = [];
        }
        dimensionScores[q.dimension].push(answer);
      }
    });

    const dimensionAverages: Record<string, number> = {};
    Object.entries(dimensionScores).forEach(([dimension, scores]) => {
      dimensionAverages[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    const overallScore =
      Object.values(dimensionAverages).reduce((a, b) => a + b, 0) /
      Object.values(dimensionAverages).length;

    return { dimensionScores: dimensionAverages, overallScore };
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      toast.error(`Você ainda tem ${questions.length - answeredCount} questões sem resposta`);
      return;
    }

    setIsSubmitting(true);
    const { dimensionScores, overallScore } = calculateScores();
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    try {
      await submitPIR.mutateAsync({
        token,
        answers,
        dimensionScores,
        overallScore,
        notes: `Tempo total: ${Math.floor(totalTime / 60)}min ${totalTime % 60}s`,
      });
    } catch (error) {
      console.error("Erro ao submeter:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Teste de Integridade PIR</CardTitle>
                  <CardDescription>
                    Convite de: {invitation.createdByName || "Sistema"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                Expira: {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Informações */}
        {currentQuestionIndex === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instruções</AlertTitle>
            <AlertDescription>
              Este teste contém {questions.length} questões. Responda com sinceridade - não há
              respostas certas ou erradas. O teste leva aproximadamente 15-20 minutos.
            </AlertDescription>
          </Alert>
        )}

        {/* Progresso */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Questão {currentQuestionIndex + 1} de {questions.length}
                </span>
                <span>
                  {answeredCount} de {questions.length} respondidas
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Questão Atual */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.questionText}</CardTitle>
              {currentQuestion.dimension && (
                <Badge variant="secondary" className="w-fit">
                  Dimensão: {currentQuestion.dimension}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id]?.toString()}
                onValueChange={handleAnswerChange}
              >
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div
                      key={value}
                      className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <RadioGroupItem value={value.toString()} id={`option-${value}`} />
                      <Label
                        htmlFor={`option-${value}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {value === 1 && "Discordo Totalmente"}
                            {value === 2 && "Discordo"}
                            {value === 3 && "Neutro"}
                            {value === 4 && "Concordo"}
                            {value === 5 && "Concordo Totalmente"}
                          </span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Navegação */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Teste
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed} className="ml-auto">
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
