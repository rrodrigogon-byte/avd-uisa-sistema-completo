import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Target, TrendingUp, Edit, Loader2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  description: string;
  indicator: string;
  target: string;
  deadline: string;
  weight: number;
  progress: number;
}

export default function PIRDetail() {
  const [, params] = useRoute("/pir/:id");
  const pirId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: pir, isLoading } = trpc.pir.getById.useQuery(
    { id: pirId! },
    { enabled: !!pirId }
  );

  const { data: employee } = trpc.employee.getById.useQuery(
    { id: pir?.employeeId || 0 },
    { enabled: !!pir?.employeeId }
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para visualizar PIRs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!pir) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>PIR não encontrado</CardTitle>
            <CardDescription>
              O PIR que você está tentando visualizar não existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  let goals: Goal[] = [];
  if (pir.goals && typeof pir.goals === 'string') {
    try {
      const parsed = JSON.parse(pir.goals);
      if (Array.isArray(parsed)) {
        goals = parsed;
      }
    } catch (e) {
      console.error("Erro ao parsear metas:", e);
    }
  }

  const calculateOverallProgress = () => {
    if (goals.length === 0) return 0;
    
    const totalWeight = goals.reduce((sum, goal) => sum + goal.weight, 0);
    const weightedProgress = goals.reduce(
      (sum, goal) => sum + (goal.progress * goal.weight),
      0
    );
    
    return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
  };

  const overallProgress = calculateOverallProgress();

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) {
      return <Badge className="bg-green-500">Concluída</Badge>;
    } else if (progress >= 70) {
      return <Badge className="bg-blue-500">Em Andamento</Badge>;
    } else if (progress >= 40) {
      return <Badge className="bg-yellow-500">Atenção</Badge>;
    } else {
      return <Badge variant="destructive">Atrasada</Badge>;
    }
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/pir")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => navigate(`/pir/edit/${pir.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar PIR
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  PIR - Plano Individual de Resultados
                </CardTitle>
                <CardDescription className="mt-2">
                  {employee?.name || "Carregando..."}
                </CardDescription>
              </div>
              {getStatusBadge(overallProgress)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{pir.period}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Metas</p>
                  <p className="font-medium">{goals.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Progresso Geral</p>
                  <p className="font-medium">{overallProgress}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Metas e Indicadores</h3>
          
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma meta cadastrada neste PIR.
              </CardContent>
            </Card>
          ) : (
            goals.map((goal, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">Meta {idx + 1}</CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(goal.progress)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Indicador</p>
                      <p className="font-medium">{goal.indicator}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Meta</p>
                      <p className="font-medium">{goal.target}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {format(new Date(goal.deadline), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                        {isDeadlineNear(goal.deadline) && (
                          <Badge variant="destructive" className="text-xs">
                            Prazo próximo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Peso</p>
                      <p className="font-medium">{goal.weight}/10</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {format(new Date(pir.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {format(new Date(pir.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
