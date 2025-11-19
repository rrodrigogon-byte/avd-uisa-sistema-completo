import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Circle, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Avaliação 360° - Etapa 2: Avaliação do Gestor
 * 
 * Fluxo:
 * 1. Autoavaliação (colaborador) ✓
 * 2. Avaliação do Gestor ← ESTA PÁGINA
 * 3. Consenso do Líder
 */

export default function Avaliacao360Gestor() {
  const params = useParams();
  const [, navigate] = useLocation();
  const evaluationId = parseInt(params.id || "0");

  const [responses, setResponses] = useState<Record<number, number>>({});
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);

  // Queries
  const { data: evaluation, isLoading } = trpc.evaluation360.getEvaluationWithWorkflow.useQuery({ id: evaluationId });
  const { data: questions } = trpc.performanceEvaluations.getQuestions.useQuery({ evaluationId });

  // Mutation
  const submitMutation = trpc.evaluation360.submitManagerAssessment.useMutation({
    onSuccess: () => {
      toast.success("Avaliação do gestor enviada com sucesso! O líder foi notificado por email.");
      navigate("/avaliacoes");
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar avaliação: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!questions || Object.keys(responses).length < questions.length) {
      toast.error("Por favor, responda todas as perguntas antes de enviar.");
      return;
    }

    const answersArray = questions.map((q: any) => ({
      questionId: q.id,
      score: responses[q.id] || 0,
    }));

    submitMutation.mutate({
      evaluationId,
      answers: answersArray,
    });
  };

  const progress = questions ? (Object.keys(responses).length / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!evaluation) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Avaliação não encontrada</h3>
            <Button onClick={() => navigate("/avaliacoes")}>Voltar</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Verificar se a etapa está correta
  if (evaluation.workflowStatus !== "pending_manager") {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {evaluation.workflowStatus === "pending_self"
                ? "Aguardando autoavaliação do colaborador"
                : "Avaliação do gestor já foi concluída"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Status atual: {evaluation.workflowStatus}
            </p>
            <Button onClick={() => navigate("/avaliacoes")}>Voltar</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/avaliacoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Avaliação 360° - Avaliação do Gestor</h1>
            <p className="text-sm text-muted-foreground">
              Ciclo {evaluation.cycleYear} • {evaluation.employeeName}
            </p>
          </div>
        </div>

        {/* Stepper - Indicador de Progresso */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 opacity-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold">1. Autoavaliação</p>
                  <p className="text-xs text-green-600">Concluída</p>
                </div>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-green-600" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">2. Avaliação Gestor</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-gray-200" />
              <div className="flex items-center gap-2 opacity-50">
                <Circle className="h-6 w-6" />
                <div>
                  <p className="font-semibold">3. Consenso Líder</p>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                </div>
              </div>
            </div>
            <Progress value={66} className="h-2" />
          </CardContent>
        </Card>

        {/* Progresso das Respostas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progresso das Respostas</p>
              <p className="text-sm text-muted-foreground">
                {Object.keys(responses).length} de {questions?.length || 0} perguntas
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Botão para Ver Autoavaliação */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Autoavaliação do Colaborador</h3>
                <p className="text-sm text-blue-800">
                  Você pode visualizar as respostas da autoavaliação para comparação
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSelfAssessment(!showSelfAssessment)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showSelfAssessment ? "Ocultar" : "Ver Autoavaliação"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-amber-900">Instruções</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Avalie o desempenho do colaborador de forma objetiva e construtiva</li>
              <li>Use a escala de 1 (Insatisfatório) a 5 (Excepcional)</li>
              <li>Compare com a autoavaliação para identificar gaps de percepção</li>
              <li>Após enviar, o líder será notificado para fazer o consenso final</li>
            </ul>
          </CardContent>
        </Card>

        {/* Perguntas */}
        <div className="space-y-4">
          {questions?.map((question: any, index: number) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {question.questionText}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {question.category && (
                    <Badge variant="outline">{question.category}</Badge>
                  )}
                  {showSelfAssessment && (
                    <Badge variant="secondary">
                      Autoavaliação: {question.selfScore || "N/A"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      variant={responses[question.id] === score ? "default" : "outline"}
                      size="lg"
                      className="flex-1"
                      onClick={() => setResponses({ ...responses, [question.id]: score })}
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>1 - Insatisfatório</span>
                  <span>3 - Adequado</span>
                  <span>5 - Excepcional</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão de Enviar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Pronto para enviar?</p>
                <p className="text-sm text-muted-foreground">
                  Você respondeu {Object.keys(responses).length} de {questions?.length || 0} perguntas
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || Object.keys(responses).length < (questions?.length || 0)}
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar Avaliação
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
