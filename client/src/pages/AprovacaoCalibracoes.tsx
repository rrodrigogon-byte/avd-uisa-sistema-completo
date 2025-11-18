import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Página de Aprovação de Calibrações
 * Para Diretor de Gente e Diretor de Área
 */
export default function AprovacaoCalibracoes() {
  const { user } = useAuth();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [comments, setComments] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: pendingMovements, isLoading } =
    trpc.calibrationDiretoria.listPendingMovements.useQuery();

  // Mutations
  const approveMutation = trpc.calibrationDiretoria.approveMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação aprovada com sucesso!");
      setIsApproveDialogOpen(false);
      setSelectedApproval(null);
      setEvidence("");
      setComments("");
      utils.calibrationDiretoria.listPendingMovements.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const rejectMutation = trpc.calibrationDiretoria.rejectMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação rejeitada");
      setIsRejectDialogOpen(false);
      setSelectedApproval(null);
      setComments("");
      utils.calibrationDiretoria.listPendingMovements.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleApprove = (approval: any) => {
    setSelectedApproval(approval);
    setEvidence("");
    setComments("");
    setIsApproveDialogOpen(true);
  };

  const handleReject = (approval: any) => {
    setSelectedApproval(approval);
    setComments("");
    setIsRejectDialogOpen(true);
  };

  const handleSubmitApproval = () => {
    if (!selectedApproval) return;

    // Verificar se é Diretor de Área e exigir evidências
    if (selectedApproval.approverRole === "area_director" && !evidence) {
      toast.error("Evidências são obrigatórias para Diretor de Área");
      return;
    }

    approveMutation.mutate({
      approvalId: selectedApproval.id,
      evidence: evidence || undefined,
      comments: comments || undefined,
    });
  };

  const handleSubmitRejection = () => {
    if (!selectedApproval) return;

    if (comments.length < 10) {
      toast.error("Comentário deve ter no mínimo 10 caracteres");
      return;
    }

    rejectMutation.mutate({
      approvalId: selectedApproval.id,
      comments,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "hr":
        return "RH";
      case "people_director":
        return "Diretor de Gente";
      case "area_director":
        return "Diretor de Área";
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-[#F39200]" />
          Aprovação de Calibrações
        </h1>
        <p className="text-gray-600 mt-2">
          Aprove ou rejeite movimentações de colaboradores no Nine Box
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingMovements?.filter((m: any) => m.calibrationApprovals?.status === "pending")
                .length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Aprovadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rejeitadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Aprovações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Pendentes</CardTitle>
          <CardDescription>
            Revise e aprove as movimentações de colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : pendingMovements && pendingMovements.length > 0 ? (
            <div className="space-y-4">
              {pendingMovements.map((movement: any) => {
                const approval = movement.calibrationApprovals;
                const employee = movement.employees;

                return (
                  <div
                    key={movement.calibrationMovements.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{employee?.name || "Colaborador"}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Movimentação solicitada em{" "}
                          {new Date(movement.calibrationMovements.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {getStatusBadge(approval?.status || "pending")}
                    </div>

                    {/* Detalhes da Movimentação */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Posição Atual</p>
                        <p className="font-medium">
                          {movement.calibrationMovements.fromPerformance?.toUpperCase() || "N/A"}{" "}
                          Desempenho •{" "}
                          {movement.calibrationMovements.fromPotential?.toUpperCase() || "N/A"}{" "}
                          Potencial
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Nova Posição</p>
                        <p className="font-medium text-[#F39200]">
                          {movement.calibrationMovements.toPerformance?.toUpperCase()} Desempenho •{" "}
                          {movement.calibrationMovements.toPotential?.toUpperCase()} Potencial
                        </p>
                      </div>
                    </div>

                    {/* Justificativa */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Justificativa:</p>
                      <p className="text-sm text-gray-700 p-3 bg-blue-50 rounded border border-blue-200">
                        {movement.calibrationMovements.justification}
                      </p>
                    </div>

                    {/* Nível de Aprovação */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Nível de Aprovação:</p>
                      <Badge variant="secondary">{getRoleName(approval?.approverRole || "")}</Badge>
                    </div>

                    {/* Ações */}
                    {approval?.status === "pending" && (
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={() => handleApprove(approval)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleReject(approval)}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Nenhuma movimentação pendente de aprovação
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprovar Movimentação</DialogTitle>
            <DialogDescription>
              {selectedApproval?.approverRole === "area_director"
                ? "Como Diretor de Área, você deve obrigatoriamente inserir evidências"
                : "Confirme a aprovação da movimentação"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Evidências (obrigatório para Diretor de Área) */}
            {selectedApproval?.approverRole === "area_director" && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidências <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Descreva as evidências que justificam esta movimentação..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-700">
                    Evidências são obrigatórias para Diretor de Área
                  </p>
                </div>
              </div>
            )}

            {/* Comentários (opcional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentários (opcional)
              </label>
              <Textarea
                placeholder="Adicione comentários adicionais se necessário..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={
                approveMutation.isPending ||
                (selectedApproval?.approverRole === "area_director" && !evidence)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Movimentação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (obrigatório)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Descreva o motivo da rejeição (mínimo 10 caracteres)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{comments.length} caracteres</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitRejection}
              disabled={rejectMutation.isPending || comments.length < 10}
              variant="destructive"
            >
              {rejectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
