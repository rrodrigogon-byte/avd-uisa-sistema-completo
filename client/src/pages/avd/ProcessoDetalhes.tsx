import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  User,
  Brain,
  Award,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Progress } from "@/components/ui/progress";
import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

/**
 * Página de Detalhes do Processo AVD
 * Visualização completa de um processo específico
 */
export default function ProcessoDetalhes() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/avd/processo/detalhes/:processId");
  const { user } = useAuth();

  const processId = params?.processId ? parseInt(params.processId) : 0;

  // Verificar permissão
  if (user?.role !== "admin" && user?.role !== "rh") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Acesso restrito a administradores e RH
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar detalhes do processo
  const { data: details, isLoading } = trpc.avd.getProcessDetails.useQuery(
    { processId },
    { enabled: processId > 0 }
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details || !details.process) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Processo não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { process, employee, competencyAssessment, performanceAssessment, developmentPlan } =
    details;

  const steps = [
    {
      id: 1,
      title: "Dados Pessoais",
      icon: User,
      completed: process.step1CompletedAt !== null,
      completedAt: process.step1CompletedAt,
    },
    {
      id: 2,
      title: "PIR",
      icon: Brain,
      completed: process.step2CompletedAt !== null,
      completedAt: process.step2CompletedAt,
    },
    {
      id: 3,
      title: "Competências",
      icon: Award,
      completed: process.step3CompletedAt !== null,
      completedAt: process.step3CompletedAt,
    },
    {
      id: 4,
      title: "Desempenho",
      icon: TrendingUp,
      completed: process.step4CompletedAt !== null,
      completedAt: process.step4CompletedAt,
    },
    {
      id: 5,
      title: "PDI",
      icon: Lightbulb,
      completed: process.step5CompletedAt !== null,
      completedAt: process.step5CompletedAt,
    },
  ];

  const completedSteps = safeFilter(steps, (s) => s.completed).length;
  const progressPercentage = (completedSteps / 5) * 100;

  const getStatusBadge = (status: string) => {
    const variants = {
      em_andamento: { variant: "default" as const, label: "Em Andamento" },
      concluido: { variant: "secondary" as const, label: "Concluído" },
      cancelado: { variant: "destructive" as const, label: "Cancelado" },
    };
    const config = variants[status as keyof typeof variants] || variants.em_andamento;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPerformanceRatingLabel = (rating: string) => {
    const labels: Record<string, string> = {
      insatisfatorio: "Insatisfatório",
      abaixo_expectativas: "Abaixo das Expectativas",
      atende_expectativas: "Atende Expectativas",
      supera_expectativas: "Supera Expectativas",
      excepcional: "Excepcional",
    };
    return labels[rating] || rating;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/avd/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Processo AVD</h1>
            <p className="text-muted-foreground mt-1">
              Processo #{process.id} - {employee?.nome || "N/A"}
            </p>
          </div>
        </div>
        {getStatusBadge(process.status)}
      </div>

      {/* Informações do Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Funcionário</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome</p>
            <p className="text-lg">{employee?.nome || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chapa</p>
            <p className="text-lg">{employee?.chapa || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cargo</p>
            <p className="text-lg">{employee?.cargo || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Departamento</p>
            <p className="text-lg">{employee?.departamento || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progresso do Processo */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Processo</CardTitle>
          <CardDescription>
            {completedSteps} de 5 passos concluídos ({Math.round(progressPercentage)}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progressPercentage} className="h-2" />

          <div className="grid gap-4 md:grid-cols-5">
            {safeMap(steps, (step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border ${
                    step.completed ? "bg-secondary" : "bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon
                      className={`h-5 w-5 ${
                        step.completed ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    {step.completed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm font-medium">{step.title}</p>
                  {step.completedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(step.completedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Avaliação de Competências */}
      {competencyAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Competências</CardTitle>
            <CardDescription>Passo 3 - Concluído</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontuação Geral</p>
                <p className="text-2xl font-bold">{competencyAssessment.overallScore}/100</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
                <p className="text-lg">
                  {competencyAssessment.completedAt
                    ? new Date(competencyAssessment.completedAt).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
            </div>
            {competencyAssessment.comments && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Comentários</p>
                <p className="text-sm">{competencyAssessment.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Avaliação de Desempenho */}
      {performanceAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Desempenho</CardTitle>
            <CardDescription>Passo 4 - Consolidação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontuação Final</p>
                <p className="text-2xl font-bold">{performanceAssessment.finalScore}/100</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Classificação</p>
                <p className="text-lg">
                  {getPerformanceRatingLabel(performanceAssessment.performanceRating)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
                <p className="text-lg">
                  {performanceAssessment.completedAt
                    ? new Date(performanceAssessment.completedAt).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perfil</p>
                <p className="text-lg">
                  {performanceAssessment.profileScore || 0} (
                  {performanceAssessment.profileWeight}%)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PIR</p>
                <p className="text-lg">
                  {performanceAssessment.pirScore || 0} ({performanceAssessment.pirWeight}%)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Competências</p>
                <p className="text-lg">
                  {performanceAssessment.competencyScore} (
                  {performanceAssessment.competencyWeight}%)
                </p>
              </div>
            </div>

            {performanceAssessment.strengthsAnalysis && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Pontos Fortes</p>
                <p className="text-sm">{performanceAssessment.strengthsAnalysis}</p>
              </div>
            )}

            {performanceAssessment.gapsAnalysis && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Gaps Identificados</p>
                <p className="text-sm">{performanceAssessment.gapsAnalysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plano de Desenvolvimento */}
      {developmentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Plano de Desenvolvimento Individual (PDI)</CardTitle>
            <CardDescription>Passo 5 - Plano de Ação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge>{developmentPlan.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                <p className="text-lg">
                  {new Date(developmentPlan.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {developmentPlan.developmentGoals && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Metas de Desenvolvimento
                </p>
                <p className="text-sm">{developmentPlan.developmentGoals}</p>
              </div>
            )}

            {developmentPlan.careerAspirations && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Aspirações de Carreira
                </p>
                <p className="text-sm">{developmentPlan.careerAspirations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Datas do Processo */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Processo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
            <p className="text-lg">{new Date(process.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p className="text-lg">{new Date(process.updatedAt).toLocaleDateString("pt-BR")}</p>
          </div>
          {process.completedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
              <p className="text-lg">
                {new Date(process.completedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
