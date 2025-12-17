/**
 * Passo 2 do Processo AVD: Teste PIR (Perfil de Interesses e Reações)
 * Integrado ao fluxo de avaliação 360° com 5 passos
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Brain, ArrowLeft, ArrowRight, Save } from "lucide-react";
import AVDProgressBreadcrumbs from "@/components/AVDProgressBreadcrumbs";
import AVDStepGuard from "@/components/AVDStepGuard";

interface Question {
  id: number;
  questionNumber: number;
  questionText: string;
  dimension: string;
  reverse: boolean;
}

export default function Passo2PIR() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const processId = params.processId ? parseInt(params.processId) : undefined;

  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const questionsPerPage = 10;

  // Buscar processo AVD
  const { data: process, isLoading: loadingProcess } = trpc.avdUisa.getProcessById.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Buscar questões do PIR
  const { data: questions, isLoading: loadingQuestions } = trpc.psychometric.getQuestions.useQuery({
    testType: "pir",
  });

  // Buscar respostas existentes (se houver)
  const { data: existingAssessment } = trpc.avdUisa.getPirAssessmentByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Carregar respostas existentes
  useEffect(() => {
    if (existingAssessment?.answers) {
      const answersMap: Record<number, number> = {};
      existingAssessment.answers.forEach((answer: any) => {
        answersMap[answer.questionId] = answer.response;
      });
      setResponses(answersMap);
    }
  }, [existingAssessment]);

  // Mutation para salvar PIR
  const savePirMutation = trpc.avdUisa.savePirAssessment.useMutation({
    onSuccess: () => {
      toast.success("Respostas salvas com sucesso!");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Mutation para completar passo
  const completeStepMutation = trpc.avdUisa.completeStep.useMutation({
    onSuccess: () => {
      toast.success("Passo 2 concluído! Avançando para avaliação de competências...");
      navigate(`/avd/processo/passo3/${processId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao completar passo: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Calcular progresso
  const totalQuestions = questions?.length || 60;
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Questões da página atual
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = questions?.slice(startIndex, endIndex) || [];

  // Verificar se todas as questões da página atual foram respondidas
  const isCurrentPageComplete = currentQuestions.every(q => responses[q.id] !== undefined);

  // Verificar se todas as questões foram respondidas
  const isAllQuestionsAnswered = answeredCount === totalQuestions;

  const handleResponse = (questionId: number, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalQuestions / questionsPerPage) - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSave = async () => {
    if (!processId) {
      toast.error("ID do processo não encontrado");
      return;
    }

    setIsSaving(true);

    // Converter respostas para array
    const answersArray = Object.entries(responses).map(([questionId, response]) => ({
      questionId: parseInt(questionId),
      response,
    }));

    savePirMutation.mutate({
      processId,
      answers: answersArray,
    });
  };

  const handleComplete = async () => {
    if (!processId) {
      toast.error("ID do processo não encontrado");
      return;
    }

    if (!isAllQuestionsAnswered) {
      toast.error("Por favor, responda todas as questões antes de continuar");
      return;
    }

    setIsSaving(true);

    // Converter respostas para array
    const answersArray = Object.entries(responses).map(([questionId, response]) => ({
      questionId: parseInt(questionId),
      response,
    }));

    // Salvar respostas
    await savePirMutation.mutateAsync({
      processId,
      answers: answersArray,
    });

    // Completar passo
    completeStepMutation.mutate({
      processId,
      step: 2,
    });
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loadingProcess || loadingQuestions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!process) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Processo Não Encontrado</CardTitle>
              <CardDescription>O processo de avaliação não foi encontrado.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/avd/processo/dashboard")}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AVDStepGuard processId={processId!} currentStep={2} />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumbs */}
        <AVDProgressBreadcrumbs 
          processId={processId!} 
          currentStep={process?.currentStep || 2} 
          completedSteps={process?.step1CompletedAt ? [1] : []}
        />

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Passo 2: Teste PIR</h1>
            <p className="text-muted-foreground">
              Perfil de Interesses e Reações - 60 questões
            </p>
          </div>
        </div>

        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progresso do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {answeredCount} de {totalQuestions} questões respondidas
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Questões */}
        <Card>
          <CardHeader>
            <CardTitle>
              Questões {startIndex + 1} - {Math.min(endIndex, totalQuestions)}
            </CardTitle>
            <CardDescription>
              Responda cada questão de acordo com a escala de 1 (Discordo Totalmente) a 5 (Concordo Totalmente)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {startIndex + index + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium leading-relaxed">
                    {question.questionText}
                  </p>
                </div>

                <RadioGroup
                  value={responses[question.id]?.toString()}
                  onValueChange={(value) => handleResponse(question.id, parseInt(value))}
                  className="grid grid-cols-5 gap-2 mt-3"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center gap-2">
                      <RadioGroupItem
                        value={value.toString()}
                        id={`q${question.id}-${value}`}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`q${question.id}-${value}`}
                        className="text-xs text-center cursor-pointer"
                      >
                        {value === 1 && "Discordo Totalmente"}
                        {value === 2 && "Discordo"}
                        {value === 3 && "Neutro"}
                        {value === 4 && "Concordo"}
                        {value === 5 && "Concordo Totalmente"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Página Anterior
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || answeredCount === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Progresso
            </Button>

            {currentPage === Math.ceil(totalQuestions / questionsPerPage) - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!isAllQuestionsAnswered || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Concluir e Avançar
              </Button>
            ) : (
              <Button
                onClick={handleNextPage}
                disabled={currentPage >= Math.ceil(totalQuestions / questionsPerPage) - 1}
              >
                Próxima Página
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
