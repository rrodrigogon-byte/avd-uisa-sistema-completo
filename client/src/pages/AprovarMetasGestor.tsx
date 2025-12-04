import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Target, User, Calendar, AlertCircle } from "lucide-react";

export default function AprovarMetasGestor() {
  const { user } = useAuth();
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState<"approve" | "reject">("approve");
  const [comments, setComments] = useState("");

  const { data: pendingApprovals, isLoading, refetch } = trpc.performanceEvaluationCycle.listParticipants.useQuery({ cycleId: 0, status: "aguardando_aprovacao_gestor" });

  const approveMutation = trpc.performanceEvaluationCycle.approveGoals.useMutation({
    onSuccess: () => {
      toast.success("Metas aprovadas com sucesso!");
      setShowApprovalDialog(false);
      setComments("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.performanceEvaluationCycle.approveGoals.useMutation({
    onSuccess: () => {
      toast.success("Metas rejeitadas. Funcionário será notificado.");
      setShowApprovalDialog(false);
      setComments("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const handleApprove = (participant: any) => {
    setSelectedParticipant(participant);
    setApprovalType("approve");
    setShowApprovalDialog(true);
  };

  const handleReject = (participant: any) => {
    setSelectedParticipant(participant);
    setApprovalType("reject");
    setShowApprovalDialog(true);
  };

  const handleConfirmAction = () => {
    if (!selectedParticipant) return;

    if (approvalType === "approve") {
      approveMutation.mutate({
        participantId: selectedParticipant.id,
        action: "aprovado",
        comments,
      });
    } else {
      if (!comments.trim()) {
        toast.error("Justificativa é obrigatória para rejeição");
        return;
      }
      rejectMutation.mutate({
        participantId: selectedParticipant.id,
        action: "rejeitado",
        comments: comments,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aprovações pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Aprovar Metas dos Colaboradores</h1>
        <p className="text-muted-foreground mt-1">
          Revise e aprove as metas individuais definidas pelos seus colaboradores
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando sua análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Aprovações realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Necessitam revisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Aprovações Pendentes */}
      {pendingApprovals && pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          {pendingApprovals.map((participant) => {
            const individualGoals = participant.individualGoals ? JSON.parse(participant.individualGoals) : [];
            
            return (
              <Card key={participant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {participant.employee?.name || "Colaborador"}
                        </CardTitle>
                        <Badge variant="outline">{participant.status}</Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {participant.employee?.position || "Cargo não informado"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Enviado em {new Date(participant.submittedAt || "").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metas Individuais */}
                  <div>
                    <p className="font-medium mb-2">Metas Individuais ({individualGoals.length}):</p>
                    <div className="space-y-2">
                      {individualGoals.map((goal: any, idx: number) => (
                        <Card key={idx} className="border-2">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                              <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">{goal.title}</p>
                                {goal.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    Alvo: {goal.targetValue} {goal.unit}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      onClick={() => handleApprove(participant)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(participant)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma aprovação pendente</p>
            <p className="text-muted-foreground text-center">
              Todas as metas dos seus colaboradores já foram analisadas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalType === "approve" ? "Aprovar Metas" : "Rejeitar Metas"}
            </DialogTitle>
            <DialogDescription>
              {approvalType === "approve"
                ? "Confirme a aprovação das metas deste colaborador."
                : "Informe o motivo da rejeição. O colaborador será notificado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {approvalType === "approve" ? "Comentários (opcional)" : "Justificativa *"}
              </Label>
              <Textarea
                placeholder={
                  approvalType === "approve"
                    ? "Adicione comentários ou sugestões..."
                    : "Explique o motivo da rejeição..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required={approvalType === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={approvalType === "approve" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approvalType === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
