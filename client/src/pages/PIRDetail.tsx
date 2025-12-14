import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Target, TrendingUp, Edit, Loader2, CheckCircle, XCircle, RotateCcw, Send } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import ApprovalDialog from "@/components/ApprovalDialog";
import ApprovalHistory from "@/components/ApprovalHistory";

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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');

  const utils = trpc.useUtils();

  const { data: pir, isLoading } = trpc.pir.getById.useQuery(
    { id: pirId! },
    { enabled: !!pirId }
  );

  // Remover query de employee pois não existe no router
  const employee = { name: 'Colaborador' };

  const { data: approvalHistory } = trpc.pir.getApprovalHistory.useQuery(
    { id: pirId! },
    { enabled: !!pirId }
  );

  const submitForApprovalMutation = trpc.pir.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success('PIR enviado para análise com sucesso!');
      utils.pir.getById.invalidate({ id: pirId! });
      utils.pir.getApprovalHistory.invalidate({ id: pirId! });
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao enviar PIR para análise');
    },
  });

  const approveMutation = trpc.pir.approve.useMutation({
    onSuccess: () => {
      toast.success('PIR aprovado com sucesso!');
      utils.pir.getById.invalidate({ id: pirId! });
      utils.pir.getApprovalHistory.invalidate({ id: pirId! });
      setApprovalDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao aprovar PIR');
    },
  });

  const rejectMutation = trpc.pir.reject.useMutation({
    onSuccess: () => {
      toast.success('PIR rejeitado');
      utils.pir.getById.invalidate({ id: pirId! });
      utils.pir.getApprovalHistory.invalidate({ id: pirId! });
      setApprovalDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao rejeitar PIR');
    },
  });

  const reopenMutation = trpc.pir.reopen.useMutation({
    onSuccess: () => {
      toast.success('PIR reaberto para edição');
      utils.pir.getById.invalidate({ id: pirId! });
      utils.pir.getApprovalHistory.invalidate({ id: pirId! });
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao reabrir PIR');
    },
  });

  const handleApprovalAction = (type: 'approve' | 'reject') => {
    setApprovalType(type);
    setApprovalDialogOpen(true);
  };

  const handleApprovalConfirm = (comments?: string) => {
    if (approvalType === 'approve') {
      approveMutation.mutate({ id: pirId!, comments });
    } else {
      rejectMutation.mutate({ id: pirId!, comments: comments || '' });
    }
  };

  const isAdmin = user?.role === 'admin';
  const canApprove = isAdmin && pir?.status === 'em_analise';
  const canSubmit = pir?.status === 'rascunho';
  const canReopen = isAdmin && pir?.status === 'rejeitado';

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
        <div className="flex gap-2">
          {canSubmit && (
            <Button
              onClick={() => submitForApprovalMutation.mutate({ id: pirId! })}
              disabled={submitForApprovalMutation.isPending}
              variant="default"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar para Análise
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                onClick={() => handleApprovalAction('approve')}
                disabled={approveMutation.isPending}
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={() => handleApprovalAction('reject')}
                disabled={rejectMutation.isPending}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          )}
          {canReopen && (
            <Button
              onClick={() => reopenMutation.mutate({ id: pirId! })}
              disabled={reopenMutation.isPending}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reabrir
            </Button>
          )}
          {pir.status === 'rascunho' && (
            <Button onClick={() => navigate(`/pir/edit/${pir.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar PIR
            </Button>
          )}
        </div>
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
              <div className="flex flex-col gap-2 items-end">
                <StatusBadge status={pir.status as any} />
                {getStatusBadge(overallProgress)}
              </div>
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

        {approvalHistory && approvalHistory.length > 0 && (
          <ApprovalHistory history={approvalHistory} />
        )}
      </div>

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        type={approvalType}
        title={approvalType === 'approve' ? 'Aprovar PIR' : 'Rejeitar PIR'}
        description={
          approvalType === 'approve'
            ? 'Tem certeza que deseja aprovar este PIR? Esta ação não pode ser desfeita.'
            : 'Por favor, descreva o motivo da rejeição para que o colaborador possa fazer as correções necessárias.'
        }
        onConfirm={handleApprovalConfirm}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}
