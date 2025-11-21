import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, ArrowLeft, Check, Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

/**
 * Avaliação 360° - Etapa 3: Consenso do Líder
 * 
 * Fluxo:
 * 1. Autoavaliação (colaborador) ✓
 * 2. Avaliação do Gestor ✓
 * 3. Consenso do Líder ← ESTA PÁGINA (FINAL)
 */

export default function Avaliacao360Consenso() {
  const params = useParams();
  const [, navigate] = useLocation();
  const evaluationId = parseInt(params.id || "0");

  const [responses, setResponses] = useState<Record<number, number>>({});
  const [showComparison, setShowComparison] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Queries
  const { data: evaluation, isLoading } = trpc.evaluation360.getEvaluationWithWorkflow.useQuery({ evaluationId });
  const { data: questions } = trpc.evaluation360.getQuestions.useQuery({ evaluationId });

  // Mutation
  const submitMutation = trpc.evaluation360.submitConsensus.useMutation({
    onSuccess: () => {
      toast.success("Consenso final enviado com sucesso! Avaliação 360° concluída.");
      navigate("/avaliacoes");
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar consenso: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!questions || Object.keys(responses).length < questions.length) {
      toast.error("Por favor, defina o consenso para todas as perguntas antes de enviar.");
      return;
    }

    if (!password || password.trim() === "") {
      toast.error("Senha obrigatória", {
        description: "Digite sua senha para confirmar o consenso final",
      });
      return;
    }

    const answersArray = questions.map((q: any) => ({
      questionId: q.id,
      score: responses[q.id] || 0,
    }));

    // Calcular nota final (média das respostas)
    const finalScore = answersArray.reduce((sum, a) => sum + a.score, 0) / answersArray.length;

    submitMutation.mutate({
      evaluationId,
      finalScore,
      consensusNotes: "Consenso final do líder",
      password, // Validar senha do líder
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
  if (evaluation.workflowStatus !== "pending_consensus") {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {evaluation.workflowStatus === "completed"
                ? "Consenso já foi concluído"
                : "Aguardando etapas anteriores"}
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
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton fallbackPath="/avaliacoes" variant="ghost" label="" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Avaliação 360° - Consenso do Líder</h1>
            <p className="text-sm text-muted-foreground">
              Ciclo {evaluation.cycleId} • {evaluation.employeeName}
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
              <div className="flex items-center gap-2 opacity-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold">2. Avaliação Gestor</p>
                  <p className="text-xs text-green-600">Concluída</p>
                </div>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-green-600" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">3. Consenso Líder</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>
            </div>
            <Progress value={100} className="h-2" />
          </CardContent>
        </Card>

        {/* Progresso das Respostas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progresso do Consenso</p>
              <p className="text-sm text-muted-foreground">
                {Object.keys(responses).length} de {questions?.length || 0} perguntas
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Botão para Ver Comparação */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">Comparação de Avaliações</h3>
                <p className="text-sm text-purple-800">
                  Visualize as diferenças entre autoavaliação e avaliação do gestor
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showComparison ? "Ocultar" : "Ver Comparação"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-green-900">Instruções</h3>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Analise as diferenças entre a autoavaliação e a avaliação do gestor</li>
              <li>Defina a nota de consenso final para cada competência</li>
              <li>Use a escala de 1 (Insatisfatório) a 5 (Excepcional)</li>
              <li>Esta é a nota final que será registrada no sistema</li>
            </ul>
          </CardContent>
        </Card>

        {/* Perguntas com Comparação */}
        <div className="space-y-4">
          {questions?.map((question: any, index: number) => {
            const selfScore = question.selfScore || 0;
            const managerScore = question.managerScore || 0;
            const gap = Math.abs(selfScore - managerScore);
            const hasGap = gap >= 2;

            return (
              <Card key={question.id} className={hasGap ? "border-amber-300 bg-amber-50" : ""}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {question.questionText}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {question.category && (
                      <Badge variant="outline">{question.category}</Badge>
                    )}
                    {showComparison && (
                      <>
                        <Badge variant="secondary">
                          Autoavaliação: {selfScore}
                        </Badge>
                        <Badge variant="secondary">
                          Gestor: {managerScore}
                        </Badge>
                        {hasGap && (
                          <Badge variant="destructive">
                            Gap: {gap} pontos
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Comparação Visual */}
                    {showComparison && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-md">
                        <div>
                          <p className="text-xs font-medium mb-1">Autoavaliação</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <div
                                key={score}
                                className={`h-8 w-full rounded ${
                                  score <= selfScore ? "bg-blue-500" : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Avaliação Gestor</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <div
                                key={score}
                                className={`h-8 w-full rounded ${
                                  score <= managerScore ? "bg-purple-500" : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consenso */}
                    <div>
                      <p className="text-sm font-medium mb-2">Consenso Final</p>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Confirmação com Senha */}
        <Card className="bg-amber-50 border-amber-300">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-700 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Confirmação de Senha</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Para garantir a autenticidade do consenso final, digite sua senha de acesso ao sistema
                  </p>
                  <div className="max-w-md">
                    <Label htmlFor="password" className="text-amber-900">Senha do Líder *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Enviar */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Finalizar Avaliação 360°</p>
                <p className="text-sm text-green-800">
                  Você definiu o consenso para {Object.keys(responses).length} de {questions?.length || 0} perguntas
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || Object.keys(responses).length < (questions?.length || 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Finalizar Consenso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
