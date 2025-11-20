import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, User, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AvaliacoesAprovacao() {
  const [selectedTab, setSelectedTab] = useState<"pendentes" | "concluidas">("pendentes");
  
  const { data: pendingEvaluations, isLoading, refetch } = trpc.evaluations.listPending.useQuery({
    status: selectedTab === "pendentes" ? "pendente" : "concluida",
  });

  const approveEvaluation = trpc.evaluation360.submitConsensus.useMutation({
    onSuccess: () => {
      toast.success("Avaliação aprovada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const handleApprove = (evaluationId: number, finalScore: number) => {
    approveEvaluation.mutate({
      evaluationId,
      finalScore,
      comments: "Aprovado via painel de aprovações",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando avaliações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Aprovações de Avaliações</h1>
        <p className="text-muted-foreground">
          Gerencie e aprove avaliações de desempenho pendentes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingEvaluations?.filter(e => e.status === "pendente").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingEvaluations?.filter(e => e.status === "concluida").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingEvaluations && pendingEvaluations.length > 0
                ? Math.round((pendingEvaluations.filter(e => e.status === "concluida").length / pendingEvaluations.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Avaliações aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "pendentes" | "concluidas")}>
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes ({pendingEvaluations?.filter(e => e.status === "pendente").length || 0})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({pendingEvaluations?.filter(e => e.status === "concluida").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4 mt-6">
          {pendingEvaluations?.filter(e => e.status === "pendente").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma avaliação pendente</p>
                <p className="text-sm text-muted-foreground">
                  Todas as avaliações foram processadas
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingEvaluations?.filter(e => e.status === "pendente").map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {evaluation.employeeName || "Colaborador"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {evaluation.createdAt ? format(new Date(evaluation.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </span>
                        <Badge variant={evaluation.evaluatorType === "manager" ? "default" : "secondary"}>
                          {evaluation.evaluatorType === "self" && "Autoavaliação"}
                          {evaluation.evaluatorType === "manager" && "Avaliação Gestor"}
                          {evaluation.evaluatorType === "peer" && "Avaliação Par"}
                          {evaluation.evaluatorType === "subordinate" && "Avaliação Subordinado"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evaluation.finalScore && (
                      <div>
                        <p className="text-sm font-medium mb-1">Score Final</p>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold">{evaluation.finalScore.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">/ 5.0</div>
                        </div>
                      </div>
                    )}

                    {evaluation.comments && (
                      <div>
                        <p className="text-sm font-medium mb-1">Comentários</p>
                        <p className="text-sm text-muted-foreground">{evaluation.comments}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(evaluation.id, evaluation.finalScore || 0)}
                        disabled={approveEvaluation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar Avaliação
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-4 mt-6">
          {pendingEvaluations?.filter(e => e.status === "concluida").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma avaliação concluída</p>
                <p className="text-sm text-muted-foreground">
                  As avaliações aprovadas aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingEvaluations?.filter(e => e.status === "concluida").map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {evaluation.employeeName || "Colaborador"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {evaluation.completedAt ? format(new Date(evaluation.completedAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </span>
                        <Badge variant="secondary">
                          {evaluation.evaluatorType === "self" && "Autoavaliação"}
                          {evaluation.evaluatorType === "manager" && "Avaliação Gestor"}
                          {evaluation.evaluatorType === "peer" && "Avaliação Par"}
                          {evaluation.evaluatorType === "subordinate" && "Avaliação Subordinado"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Concluída
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evaluation.finalScore && (
                      <div>
                        <p className="text-sm font-medium mb-1">Score Final</p>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold">{evaluation.finalScore.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">/ 5.0</div>
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Detalhes Completos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
