import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, CheckCircle2, Clock, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

export default function MinhasAvaliacoes() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.avdUisa.myPendingEvaluations.useQuery();

  const selfEvaluations = data?.selfEvaluations || [];
  const managerEvaluations = data?.managerEvaluations || [];

  const totalPending = selfEvaluations.length + managerEvaluations.length;

  const handleStartEvaluation = (evaluationId: number) => {
    setLocation(`/avd/avaliar/${evaluationId}`);
  };

  const isOverdue = (deadline: Date | null | undefined) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline: Date | null | undefined) => {
    if (!deadline) return "Sem prazo definido";
    const date = new Date(deadline);
    const overdue = isOverdue(deadline);
    return (
      <span className={overdue ? "text-destructive font-semibold" : ""}>
        {format(date, "dd/MM/yyyy", { locale: ptBR })}
        {overdue && " (Atrasado)"}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Avaliações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas autoavaliações e avaliações de subordinados
          </p>
        </div>

        {/* Alert de Pendências */}
        {totalPending > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem <strong>{totalPending}</strong> avaliação{totalPending !== 1 ? "ões" : ""} pendente{totalPending !== 1 ? "s" : ""}.
              {selfEvaluations.some((e) => isOverdue(e.cycle?.selfEvaluationDeadline)) && (
                <span className="text-destructive font-semibold"> Algumas estão atrasadas!</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando avaliações...</p>
          </div>
        ) : (
          <Tabs defaultValue="self" className="space-y-4">
            <TabsList>
              <TabsTrigger value="self" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Autoavaliações
                {selfEvaluations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selfEvaluations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="manager" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Avaliar Subordinados
                {managerEvaluations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {managerEvaluations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Autoavaliações */}
            <TabsContent value="self" className="space-y-4">
              {selfEvaluations.length > 0 ? (
                selfEvaluations.map((item: any) => {
                  const overdue = isOverdue(item.cycle?.selfEvaluationDeadline);
                  return (
                    <Card key={item.evaluation.id} className={overdue ? "border-destructive" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {item.cycle?.name || "Avaliação"}
                              {overdue && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Atrasado
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Ciclo: {item.cycle?.type} • Ano {item.cycle?.year}
                            </CardDescription>
                          </div>
                          <Button onClick={() => handleStartEvaluation(item.evaluation.id)}>
                            Iniciar Autoavaliação
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Período do Ciclo</span>
                            </div>
                            <p className="text-sm font-medium">
                              {item.cycle?.startDate && format(new Date(item.cycle.startDate), "dd/MM/yyyy", { locale: ptBR })} até{" "}
                              {item.cycle?.endDate && format(new Date(item.cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Prazo para Conclusão</span>
                            </div>
                            <p className="text-sm font-medium">
                              {formatDeadline(item.cycle?.selfEvaluationDeadline)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Seu Cargo</span>
                            </div>
                            <p className="text-sm font-medium">
                              {item.position?.name || "Não informado"}
                            </p>
                          </div>
                        </div>

                        {item.department && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Departamento:</strong> {item.department.name}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma autoavaliação pendente</h3>
                    <p className="text-muted-foreground">
                      Você está em dia com suas autoavaliações!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Avaliações de Subordinados */}
            <TabsContent value="manager" className="space-y-4">
              {managerEvaluations.length > 0 ? (
                managerEvaluations.map((item: any) => {
                  const overdue = isOverdue(item.cycle?.managerEvaluationDeadline);
                  return (
                    <Card key={item.evaluation.id} className={overdue ? "border-destructive" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              Avaliar: {item.employee?.name}
                              {overdue && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Atrasado
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {item.cycle?.name} • {item.position?.name}
                            </CardDescription>
                          </div>
                          <Button onClick={() => handleStartEvaluation(item.evaluation.id)}>
                            Avaliar Colaborador
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Autoavaliação</span>
                            </div>
                            <p className="text-sm font-medium">
                              Concluída em {item.evaluation.selfCompletedAt && format(new Date(item.evaluation.selfCompletedAt), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Prazo para Avaliação</span>
                            </div>
                            <p className="text-sm font-medium">
                              {formatDeadline(item.cycle?.managerEvaluationDeadline)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Departamento</span>
                            </div>
                            <p className="text-sm font-medium">
                              {item.department?.name || "Não informado"}
                            </p>
                          </div>
                        </div>

                        {item.evaluation.selfScore && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Nota da Autoavaliação:</strong>{" "}
                              <span className="text-foreground font-semibold">{item.evaluation.selfScore}/100</span>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação de subordinado pendente</h3>
                    <p className="text-muted-foreground">
                      Você está em dia com as avaliações da sua equipe!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
