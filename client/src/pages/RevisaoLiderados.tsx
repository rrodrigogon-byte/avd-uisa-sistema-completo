import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Eye, CheckCircle2, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS = {
  approved: "Aprovada",
  rejected: "Reprovada",
  needs_revision: "Precisa Revisão",
};

const STATUS_COLORS = {
  approved: "default",
  rejected: "destructive",
  needs_revision: "secondary",
} as const;

export default function RevisaoLiderados() {
  const { user } = useAuth();
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewComments, setReviewComments] = useState("");

  const isManager = user?.role === 'gestor' || user?.role === 'admin';

  // Queries
  const { data: teamMembers = [], isLoading: loadingTeam } = trpc.managerReview.listMyTeam.useQuery(undefined);
  const { data: pendingReviews = [], isLoading: loadingReviews, refetch } = trpc.managerReview.listPendingReviews.useQuery(undefined);
  const { data: stats } = trpc.managerReview.teamStats.useQuery(undefined);

  // Mutations
  const reviewMutation = trpc.managerReview.reviewEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Revisão registrada com sucesso!");
      refetch();
      setShowDetailsDialog(false);
      setReviewComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao registrar revisão: ${error.message}`);
    },
  });

  const addCommentMutation = trpc.managerReview.addManagerComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    },
  });

  // Handlers
  const handleViewDetails = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setReviewStatus(evaluation.managerReviewStatus || "");
    setReviewComments(evaluation.managerComments || "");
    setShowDetailsDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedEvaluation || !reviewStatus) {
      toast.error("Selecione um status de revisão");
      return;
    }

    reviewMutation.mutate({
      evaluationId: selectedEvaluation.id,
      status: reviewStatus as any,
      comments: reviewComments,
    });
  };

  const handleAddComment = () => {
    if (!selectedEvaluation || !reviewComments) {
      toast.error("Digite um comentário");
      return;
    }

    addCommentMutation.mutate({
      evaluationId: selectedEvaluation.id,
      comment: reviewComments,
    });
  };

  if (!isManager) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas gestores podem revisar avaliações de liderados</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Revisão de Avaliações - Liderados
            </h1>
            <p className="text-muted-foreground mt-1">
              Revise e aprove avaliações de desempenho da sua equipe
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membros da Equipe</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                <p className="text-xs text-muted-foreground">Aguardando revisão</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedReviews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reprovadas</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejectedReviews}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Minha Equipe */}
        <Card>
          <CardHeader>
            <CardTitle>Minha Equipe</CardTitle>
            <CardDescription>
              Colaboradores sob sua liderança direta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTeam ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando equipe...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Você não possui liderados cadastrados no sistema
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.employeeCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avaliações Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Avaliações para Revisão</CardTitle>
            <CardDescription>
              Avaliações de desempenho aguardando sua revisão e aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReviews ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando avaliações...
              </div>
            ) : pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Não há avaliações pendentes de revisão
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead>Status Revisão</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviews.map((evaluation: any) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{evaluation.employeeCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {evaluation.overallScore ? (
                          <Badge variant="outline">{evaluation.overallScore}/100</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {evaluation.submittedAt ? (
                          format(new Date(evaluation.submittedAt), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {evaluation.managerReviewStatus ? (
                          <Badge variant={STATUS_COLORS[evaluation.managerReviewStatus as keyof typeof STATUS_COLORS]}>
                            {STATUS_LABELS[evaluation.managerReviewStatus as keyof typeof STATUS_LABELS]}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(evaluation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes e Revisão */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Avaliação</DialogTitle>
            <DialogDescription>
              {selectedEvaluation?.employeeName} - {selectedEvaluation?.employeeCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Informações da Avaliação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nota Geral</label>
                <p className="text-2xl font-bold">{selectedEvaluation?.overallScore || "N/A"}/100</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Submissão</label>
                <p className="text-lg">
                  {selectedEvaluation?.submittedAt
                    ? format(new Date(selectedEvaluation.submittedAt), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </p>
              </div>
            </div>

            {/* Status de Revisão */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Revisão</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Aprovar
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reprovar
                    </div>
                  </SelectItem>
                  <SelectItem value="needs_revision">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Precisa Revisão
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comentários */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentários do Gestor</label>
              <Textarea
                placeholder="Adicione seus comentários sobre a avaliação..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
              />
            </div>

            {/* Comentários Existentes */}
            {selectedEvaluation?.managerComments && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Comentários Anteriores</span>
                </div>
                <p className="text-sm">{selectedEvaluation.managerComments}</p>
                {selectedEvaluation.managerReviewedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Revisado em {format(new Date(selectedEvaluation.managerReviewedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddComment}
              disabled={!reviewComments || addCommentMutation.isPending}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Apenas Comentar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!reviewStatus || reviewMutation.isPending}
            >
              Salvar Revisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
