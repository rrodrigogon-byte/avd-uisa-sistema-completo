import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, FileText, Save, Send, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ResponseData = {
  [questionId: number]: {
    score?: number;
    textResponse?: string;
  };
};

export default function FormularioAvaliacao() {
  const [, params] = useRoute("/avd/avaliar/:id");
  const [, setLocation] = useLocation();
  const evaluationId = params?.id ? parseInt(params.id) : null;

  const [responses, setResponses] = useState<ResponseData>({});
  const [managerComments, setManagerComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: evaluation, isLoading } = trpc.avdUisa.getEvaluation.useQuery(
    { evaluationId: evaluationId! },
    { enabled: !!evaluationId }
  );

  const saveMutation = trpc.avdUisa.saveEvaluationResponses.useMutation({
    onSuccess: (data) => {
      if (data.submitted) {
        toast.success("Avaliação enviada com sucesso!");
        setLocation("/avd/minhas-avaliacoes");
      } else {
        toast.success("Rascunho salvo com sucesso!");
      }
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar avaliação");
      setIsSaving(false);
    },
  });

  // Carregar respostas existentes
  useEffect(() => {
    if (evaluation?.responses) {
      const loadedResponses: ResponseData = {};
      evaluation.responses.forEach((r) => {
        loadedResponses[r.questionId] = {
          score: r.score || undefined,
          textResponse: r.textResponse || undefined,
        };
      });
      setResponses(loadedResponses);
    }

    if (evaluation?.evaluation?.managerComments) {
      setManagerComments(evaluation.evaluation.managerComments);
    }
  }, [evaluation]);

  if (!evaluationId) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ID de avaliação inválido</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando avaliação...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!evaluation) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Avaliação não encontrada</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { evaluation: evalData, cycle, employee, department, position, questions, permissions } = evaluation;

  const isSelfEvaluation = permissions.canEditSelf;
  const isManagerEvaluation = permissions.canEditManager;
  const evaluatorType = isSelfEvaluation ? "self" : "manager";

  if (!isSelfEvaluation && !isManagerEvaluation && !permissions.isAdmin) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Você não tem permissão para editar esta avaliação</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const handleResponseChange = (questionId: number, field: "score" | "textResponse", value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    const responseArray = Object.entries(responses).map(([questionId, data]) => ({
      questionId: parseInt(questionId),
      score: data.score,
      textResponse: data.textResponse,
    }));

    saveMutation.mutate({
      evaluationId: evaluationId!,
      evaluatorType,
      responses: responseArray,
      submit: false,
      managerComments: isManagerEvaluation ? managerComments : undefined,
    });
  };

  const handleSubmit = () => {
    // Validar questões obrigatórias
    const unansweredQuestions = questions.filter((q) => {
      const response = responses[q.id];
      if (q.type === "escala") {
        return !response?.score;
      }
      return false;
    });

    if (unansweredQuestions.length > 0) {
      toast.error(`Por favor, responda todas as questões obrigatórias (${unansweredQuestions.length} pendentes)`);
      return;
    }

    if (
      !confirm(
        isSelfEvaluation
          ? "Tem certeza que deseja enviar sua autoavaliação? Após o envio, não será possível editar."
          : "Tem certeza que deseja enviar a avaliação do colaborador? Após o envio, não será possível editar."
      )
    ) {
      return;
    }

    setIsSaving(true);
    const responseArray = Object.entries(responses).map(([questionId, data]) => ({
      questionId: parseInt(questionId),
      score: data.score,
      textResponse: data.textResponse,
    }));

    saveMutation.mutate({
      evaluationId: evaluationId!,
      evaluatorType,
      responses: responseArray,
      submit: true,
      managerComments: isManagerEvaluation ? managerComments : undefined,
    });
  };

  // Calcular progresso
  const totalQuestions = questions.filter((q) => q.type === "escala").length;
  const answeredQuestions = questions.filter((q) => responses[q.id]?.score).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Agrupar questões por categoria
  const questionsByCategory = questions.reduce((acc, q) => {
    const category = q.category || "Geral";
    if (!acc[category]) acc[category] = [];
    acc[category].push(q);
    return acc;
  }, {} as Record<string, typeof questions>);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/avd/minhas-avaliacoes")}>
              ← Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSelfEvaluation ? "Autoavaliação" : `Avaliar: ${employee?.name}`}
          </h1>
          <p className="text-muted-foreground mt-1">{cycle?.name}</p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Avaliado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{employee?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{position?.name || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{department?.name || "Não informado"}</p>
              </div>
            </div>

            {evalData.selfScore && isManagerEvaluation && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota da Autoavaliação:</strong>{" "}
                  <span className="text-foreground font-semibold text-lg">{evalData.selfScore}/100</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">
                  {answeredQuestions} de {totalQuestions} questões respondidas
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Questões */}
        <div className="space-y-6">
          {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>{categoryQuestions.length} questões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryQuestions.map((question: any, index: number) => (
                  <div key={question.id}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">
                          {index + 1}. {question.question}
                        </Label>
                        {question.type === "escala" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Avalie de 1 (Insatisfatório) a 5 (Excepcional)
                          </p>
                        )}
                      </div>

                      {question.type === "escala" && (
                        <RadioGroup
                          value={responses[question.id]?.score?.toString() || ""}
                          onValueChange={(value) => handleResponseChange(question.id, "score", parseInt(value))}
                        >
                          <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map((score: any) => (
                              <div key={score} className="flex items-center space-x-2">
                                <RadioGroupItem value={score.toString()} id={`q${question.id}-${score}`} />
                                <Label htmlFor={`q${question.id}-${score}`} className="font-normal cursor-pointer">
                                  {score}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      )}

                      {question.type === "texto" && (
                        <Textarea
                          value={responses[question.id]?.textResponse || ""}
                          onChange={(e) => handleResponseChange(question.id, "textResponse", e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={4}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comentários do Gestor */}
        {isManagerEvaluation && (
          <Card>
            <CardHeader>
              <CardTitle>Comentários e Feedback</CardTitle>
              <CardDescription>
                Adicione comentários sobre o desempenho do colaborador, pontos fortes e áreas de melhoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                placeholder="Digite seus comentários..."
                rows={6}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || progress < 100}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </Button>
            </div>
            {progress < 100 && (
              <p className="text-sm text-muted-foreground text-right mt-2">
                Complete todas as questões para enviar a avaliação
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
