import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, FileText, Loader2, TrendingUp, User } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";

export default function ViewEvaluation() {
  const [, params] = useRoute("/avaliacoes/:id");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const evaluationId = params?.id ? parseInt(params.id) : null;

  const { data: evaluation, isLoading, error } = trpc.evaluations.getById.useQuery(
    { id: evaluationId! },
    { enabled: !!evaluationId }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !evaluation) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao Carregar Avaliação</CardTitle>
              <CardDescription>
                {error?.message || "Avaliação não encontrada"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/avaliacoes")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Avaliações
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excelente";
    if (score >= 70) return "Bom";
    if (score >= 50) return "Regular";
    return "Necessita Melhoria";
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => setLocation("/avaliacoes")}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Resultado da Avaliação</h1>
            <p className="text-muted-foreground">
              Visualize os detalhes e pontuações da avaliação
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontuação Final</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.finalScore)}`}>
                {evaluation.finalScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getScoreLabel(evaluation.finalScore)}
              </p>
              <Progress value={evaluation.finalScore} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliado</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluation.employeeName}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cargo: {evaluation.employeePosition}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Período</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluation.evaluationPeriod}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avaliador: {evaluation.evaluatorName}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhamento por Competência
            </CardTitle>
            <CardDescription>
              Pontuações individuais de cada competência avaliada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Produtividade</span>
                  <span className={`font-bold ${getScoreColor(evaluation.productivity)}`}>
                    {evaluation.productivity.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.productivity} />
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Qualidade</span>
                  <span className={`font-bold ${getScoreColor(evaluation.quality)}`}>
                    {evaluation.quality.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.quality} />
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Conhecimento do Trabalho</span>
                  <span className={`font-bold ${getScoreColor(evaluation.jobKnowledge)}`}>
                    {evaluation.jobKnowledge.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.jobKnowledge} />
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Confiabilidade</span>
                  <span className={`font-bold ${getScoreColor(evaluation.reliability)}`}>
                    {evaluation.reliability.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.reliability} />
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Disponibilidade</span>
                  <span className={`font-bold ${getScoreColor(evaluation.availability)}`}>
                    {evaluation.availability.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.availability} />
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Independência</span>
                  <span className={`font-bold ${getScoreColor(evaluation.independence)}`}>
                    {evaluation.independence.toFixed(1)}
                  </span>
                </div>
                <Progress value={evaluation.independence} />
              </div>
            </div>

            {evaluation.comments && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-semibold mb-2">Comentários do Avaliador</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {evaluation.comments}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button onClick={() => window.print()} variant="outline">
            Imprimir Avaliação
          </Button>
          <Button onClick={() => setLocation("/avaliacoes")}>
            Voltar para Lista
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
