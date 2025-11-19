import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface GoalApprovalSectionProps {
  goalId: number;
  currentStatus: string;
  approvalStatus: string;
}

/**
 * Componente de Aprovação de Metas
 * 
 * Exibe:
 * - Status atual de aprovação
 * - Botões de Aprovar/Rejeitar (apenas para gestores)
 * - Histórico de aprovações
 */
export default function GoalApprovalSection({
  goalId,
  currentStatus,
  approvalStatus,
}: GoalApprovalSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: approvals = [], isLoading } = trpc.goalApprovals.list.useQuery({ goalId });

  // Mutations
  const approveMutation = trpc.goalApprovals.approve.useMutation({
    onSuccess: () => {
      toast.success("Meta aprovada com sucesso!");
      utils.goalApprovals.list.invalidate({ goalId });
      utils.smartGoals.getById.invalidate({ goalId });
      setComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar meta: ${error.message}`);
    },
  });

  const rejectMutation = trpc.goalApprovals.reject.useMutation({
    onSuccess: () => {
      toast.success("Meta rejeitada");
      utils.goalApprovals.list.invalidate({ goalId });
      utils.smartGoals.getById.invalidate({ goalId });
      setComments("");
      setShowRejectForm(false);
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar meta: ${error.message}`);
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ goalId, comments: comments || undefined });
  };

  const handleReject = () => {
    if (comments.length < 10) {
      toast.error("Comentário obrigatório ao rejeitar (mínimo 10 caracteres)");
      return;
    }
    rejectMutation.mutate({ goalId, comments });
  };

  // Verificar se usuário pode aprovar/rejeitar
  const canApprove = user && ["admin", "rh", "gestor"].includes(user.role);
  const isPending = approvalStatus === "pending_manager" || approvalStatus === "pending_hr";
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Aprovada
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-4 h-4 mr-1" />
          Rejeitada
        </Badge>
      );
    }
    if (isPending) {
      return (
        <Badge variant="secondary">
          <Clock className="w-4 h-4 mr-1" />
          Pendente de Aprovação
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="w-4 h-4 mr-1" />
        Não Submetida
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Aprovação da Meta</CardTitle>
            <CardDescription>Status e histórico de aprovações</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de Aprovação (apenas para gestores) */}
        {canApprove && (isPending || currentStatus === "draft") && !isApproved && !isRejected && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {approveMutation.isPending ? "Aprovando..." : "Aprovar Meta"}
              </Button>
              <Button
                onClick={() => setShowRejectForm(!showRejectForm)}
                variant="destructive"
                disabled={rejectMutation.isPending}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar Meta
              </Button>
            </div>

            {/* Formulário de Rejeição */}
            {showRejectForm && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Motivo da Rejeição (obrigatório)
                </label>
                <Textarea
                  placeholder="Descreva o motivo da rejeição (mínimo 10 caracteres)..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  disabled={rejectMutation.isPending || comments.length < 10}
                  className="w-full"
                >
                  {rejectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
              </div>
            )}

            {/* Campo de Comentários para Aprovação */}
            {!showRejectForm && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comentários (opcional)
                </label>
                <Textarea
                  placeholder="Adicione comentários sobre a aprovação..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>
        )}

        {/* Histórico de Aprovações */}
        {approvals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Histórico de Aprovações
            </h4>
            <div className="space-y-2">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-3 border rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{approval.approverName}</span>
                    <Badge
                      variant={
                        approval.status === "approved"
                          ? "default"
                          : approval.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {approval.status === "approved" && "Aprovado"}
                      {approval.status === "rejected" && "Rejeitado"}
                      {approval.status === "pending" && "Pendente"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {approval.approverRole === "manager" && "Gestor"}
                    {approval.approverRole === "hr" && "RH"}
                    {approval.approverRole === "director" && "Diretor"}
                    {" • "}
                    {approval.decidedAt
                      ? new Date(approval.decidedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Pendente"}
                  </div>
                  {approval.comments && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                      {approval.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há aprovações */}
        {approvals.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma aprovação registrada ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
}
