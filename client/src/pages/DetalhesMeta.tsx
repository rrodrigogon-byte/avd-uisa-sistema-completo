import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Edit,
  MessageSquare,
  FileText,
  Users,
  Award,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Detalhes da Meta Individual
 * Exibe informações completas, marcos, aprovações e comentários
 */
export default function DetalhesMeta() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [commentText, setCommentText] = useState("");
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  // Exportar PDF
  const exportPDFMutation = trpc.smartGoals.exportPDF.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exportado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao exportar PDF", {
        description: error.message,
      });
    },
  });

  const goalId = parseInt(id || "0");

  // Buscar meta completa
  const { data: goal, isLoading, refetch } = trpc.smartGoals.getById.useQuery({ goalId });

  // Adicionar comentário
  const addCommentMutation = trpc.smartGoals.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado com sucesso!");
      setCommentText("");
      setShowCommentDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar comentário", {
        description: error.message,
      });
    },
  });

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error("Digite um comentário");
      return;
    }

    await addCommentMutation.mutateAsync({
      goalId,
      comment: commentText,
    });
  };

  // Mutations de evidências
  const addEvidenceMutation = trpc.smartGoals.addEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidência adicionada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar evidência", {
        description: error.message,
      });
    },
  });

  const deleteEvidenceMutation = trpc.smartGoals.deleteEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidência excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir evidência", {
        description: error.message,
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 10MB",
      });
      return;
    }

    const description = prompt("Descreva esta evidência:");
    if (!description) return;

    // TODO: Implementar upload real para S3
    // Por enquanto, simular upload
    const fakeUrl = `https://storage.example.com/evidences/${file.name}`;

    await addEvidenceMutation.mutateAsync({
      goalId,
      description,
      attachmentUrl: fakeUrl,
      attachmentName: file.name,
      attachmentType: file.type,
      attachmentSize: file.size,
    });
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (confirm("Tem certeza que deseja excluir esta evidência?")) {
      await deleteEvidenceMutation.mutateAsync({ evidenceId });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      pending_approval: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      in_progress: "bg-blue-500",
      completed: "bg-emerald-500",
      cancelled: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      pending_approval: "Aguardando Aprovação",
      approved: "Aprovada",
      rejected: "Rejeitada",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      financial: "Financeira",
      behavioral: "Comportamental",
      corporate: "Corporativa",
      development: "Desenvolvimento",
    };
    return labels[category] || category;
  };

  const getApprovalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_submitted: "Não Enviada",
      pending_manager: "Aguardando Gestor",
      pending_hr: "Aguardando RH",
      approved: "Aprovada",
      rejected: "Rejeitada",
    };
    return labels[status] || status;
  };

  const getMilestoneStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-gray-600",
      in_progress: "text-blue-600",
      completed: "text-green-600",
      delayed: "text-red-600",
    };
    return colors[status] || "text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meta não encontrada</h3>
            <p className="text-gray-600 mb-4">A meta solicitada não existe ou foi removida</p>
            <Link href="/metas">
              <Button>Voltar para Metas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const smartScore =
    [goal.isSpecific, goal.isMeasurable, goal.isAchievable, goal.isRelevant, goal.isTimeBound].filter(
      Boolean
    ).length * 20;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Button variant="ghost" onClick={() => navigate("/metas")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
            <Badge className={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</Badge>
            {goal.bonusEligible && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <DollarSign className="w-3 h-3 mr-1" />
                Bônus
              </Badge>
            )}
          </div>
          <p className="text-gray-600">{getCategoryLabel(goal.category)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportPDFMutation.mutate({ goalId })}
            disabled={exportPDFMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportPDFMutation.isPending ? "Exportando..." : "Exportar PDF"}
          </Button>
          {goal.status === "draft" && (
            <Link href={`/metas/${goalId}/editar`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
          {["approved", "in_progress"].includes(goal.status) && (
            <Link href={`/metas/${goalId}/progresso`}>
              <Button className="bg-[#F39200] hover:bg-[#d67e00]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Atualizar Progresso
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goal.progress || 0}%</div>
            <Progress value={goal.progress || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validação SMART</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smartScore}/100</div>
            <p className="text-xs text-gray-500 mt-1">{smartScore / 20} de 5 critérios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status de Aprovação</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{getApprovalStatusLabel(goal.approvalStatus)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {goal.approvals?.length || 0} aprovações registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Descrição e Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição da Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 whitespace-pre-wrap">{goal.description}</p>

          <Separator />

          {/* Métricas */}
          {goal.measurementUnit && goal.targetValue && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Unidade de Medida</p>
                <p className="font-semibold">{goal.measurementUnit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Alvo</p>
                <p className="font-semibold">{goal.targetValue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Atual</p>
                <p className="font-semibold">{goal.currentValue || "0"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Peso</p>
                <p className="font-semibold">{goal.weight}%</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Datas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Início
              </p>
              <p className="font-semibold">
                {format(new Date(goal.startDate), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Término
              </p>
              <p className="font-semibold">
                {format(new Date(goal.endDate), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            {goal.completedAt && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluída em
                </p>
                <p className="font-semibold">
                  {format(new Date(goal.completedAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* Bônus */}
          {goal.bonusEligible && (
            <>
              <Separator />
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informações de Bônus
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {goal.bonusPercentage && (
                    <div>
                      <p className="text-sm text-green-700">Bônus Percentual</p>
                      <p className="font-semibold text-green-900">{goal.bonusPercentage}%</p>
                    </div>
                  )}
                  {goal.bonusAmount && (
                    <div>
                      <p className="text-sm text-green-700">Bônus Fixo</p>
                      <p className="font-semibold text-green-900">R$ {goal.bonusAmount}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Critérios SMART */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios SMART</CardTitle>
          <CardDescription>Validação dos 5 critérios para metas efetivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className={`p-4 border rounded-lg ${goal.isSpecific ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">S - Específica</span>
                {goal.isSpecific ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600">Clara e bem definida</p>
            </div>

            <div className={`p-4 border rounded-lg ${goal.isMeasurable ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">M - Mensurável</span>
                {goal.isMeasurable ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600">Possui métricas</p>
            </div>

            <div className={`p-4 border rounded-lg ${goal.isAchievable ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">A - Atingível</span>
                {goal.isAchievable ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600">Valor realista</p>
            </div>

            <div className={`p-4 border rounded-lg ${goal.isRelevant ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">R - Relevante</span>
                {goal.isRelevant ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600">Alinhada estrategicamente</p>
            </div>

            <div className={`p-4 border rounded-lg ${goal.isTimeBound ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">T - Temporal</span>
                {goal.isTimeBound ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600">Prazo definido</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marcos */}
      {goal.milestones && goal.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Marcos Intermediários ({goal.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.milestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{milestone.title}</h4>
                      <span className={`text-sm font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                        {milestone.status === "completed" && "✓ Concluído"}
                        {milestone.status === "in_progress" && "⏳ Em Andamento"}
                        {milestone.status === "pending" && "⏸ Pendente"}
                        {milestone.status === "delayed" && "⚠ Atrasado"}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Prazo: {format(new Date(milestone.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span>Progresso: {milestone.progress || 0}%</span>
                    </div>
                  </div>
                  <Progress value={milestone.progress || 0} className="w-24 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aprovações */}
      {goal.approvals && goal.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Histórico de Aprovações ({goal.approvals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.approvals.map((approval: any) => (
                <div key={approval.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{approval.approverName || "Aprovador"}</h4>
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
                      <span className="text-xs text-gray-500">
                        {approval.approverRole === "manager" && "Gestor"}
                        {approval.approverRole === "hr" && "RH"}
                        {approval.approverRole === "director" && "Diretor"}
                      </span>
                    </div>
                    {approval.comments && (
                      <p className="text-sm text-gray-600 mb-2">{approval.comments}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {approval.decidedAt
                        ? `Decidido em ${format(new Date(approval.decidedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        : `Solicitado em ${format(new Date(approval.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidências */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Evidências de Cumprimento ({goal.evidences?.length || 0})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('evidence-file-input')?.click()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Adicionar Evidência
            </Button>
            <input
              id="evidence-file-input"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
            />
          </div>
        </CardHeader>
        <CardContent>
          {goal.evidences && goal.evidences.length > 0 ? (
            <div className="space-y-3">
              {goal.evidences.map((evidence: any) => (
                <div key={evidence.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{evidence.attachmentName || "Evidência"}</span>
                        {evidence.isVerified && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{evidence.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Enviado em {format(new Date(evidence.uploadedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {evidence.attachmentSize && (
                          <span>{(evidence.attachmentSize / 1024).toFixed(2)} KB</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {evidence.attachmentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(evidence.attachmentUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvidence(evidence.id)}
                        disabled={deleteEvidenceMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma evidência adicionada ainda</p>
              <p className="text-xs mt-1">Adicione documentos, relatórios ou imagens que comprovem o cumprimento da meta</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentários ({goal.comments?.length || 0})
            </CardTitle>
            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Adicionar Comentário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Comentário</DialogTitle>
                  <DialogDescription>
                    Registre observações, atualizações ou feedback sobre esta meta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Digite seu comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending}
                      className="bg-[#F39200] hover:bg-[#d67e00]"
                    >
                      {addCommentMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {goal.comments && goal.comments.length > 0 ? (
            <div className="space-y-3">
              {goal.comments.map((comment: any) => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.authorName || "Usuário"}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum comentário ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
