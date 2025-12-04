import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Calendar, Target, TrendingUp, Plus, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function AcompanharCicloAvaliacao() {
  const { user } = useAuth();
  const [, params] = useRoute("/ciclos-avaliacao/:id/acompanhar");
  const cycleId = params?.id ? parseInt(params.id) : 0;

  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);
  const [evidenceForm, setEvidenceForm] = useState({
    description: "",
    attachmentUrl: "",
    currentValue: "",
  });

  const { data: participation, isLoading, refetch } = trpc.performanceEvaluationCycle.getParticipation.useQuery({ cycleId });
  const { data: evidences } = trpc.performanceEvaluationCycle.getEvidences.useQuery({ cycleId });

  const submitEvidenceMutation = trpc.performanceEvaluationCycle.submitEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidência enviada com sucesso!");
      setShowEvidenceDialog(false);
      setEvidenceForm({ description: "", attachmentUrl: "", currentValue: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar evidência: ${error.message}`);
    },
  });

  const handleOpenEvidenceDialog = (goalIndex: number) => {
    setSelectedGoalIndex(goalIndex);
    setShowEvidenceDialog(true);
  };

  const handleSubmitEvidence = () => {
    if (!evidenceForm.description || !evidenceForm.currentValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (selectedGoalIndex === null) return;

    submitEvidenceMutation.mutate({
      cycleId,
      goalId: selectedGoalIndex,
      description: evidenceForm.description,
      attachmentUrl: evidenceForm.attachmentUrl || undefined,
      currentValueCents: evidenceForm.currentValue ? Math.round(parseFloat(evidenceForm.currentValue) * 100) : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando participação...</p>
        </div>
      </div>
    );
  }

  if (!participation) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Você ainda não aderiu a este ciclo</p>
            <Link href={`/ciclos-avaliacao/${cycleId}/aderir`}>
              <Button>Aderir Agora</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const individualGoals = participation.individualGoals ? JSON.parse(participation.individualGoals) : [];
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "outline" },
      aprovado: { label: "Aprovado", variant: "default" },
      rejeitado: { label: "Rejeitado", variant: "destructive" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluido: { label: "Concluído", variant: "default" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ciclos-avaliacao">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Acompanhar Minhas Metas</h1>
          <p className="text-muted-foreground mt-1">
            Registre evidências e acompanhe o progresso das suas metas
          </p>
        </div>
      </div>

      {/* Status da Participação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status da Participação</CardTitle>
            {getStatusBadge(participation.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Enviado em: {new Date(participation.adhesionDate || "").toLocaleDateString("pt-BR")}</span>
          </div>
          {participation.managerApprovalDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Aprovado em: {new Date(participation.managerApprovalDate).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
          {participation.managerComments && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Comentários do Gestor:</p>
              <p className="text-sm">{participation.managerComments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metas Individuais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Minhas Metas</h2>
          <Badge variant="outline">{individualGoals.length} metas</Badge>
        </div>

        {individualGoals.map((goal: any, idx: number) => {
          const goalEvidences = evidences?.filter((e) => e.goalIndex === idx) || [];
          const latestEvidence = goalEvidences[0];
          const progress = latestEvidence?.currentValue
            ? (parseFloat(latestEvidence.currentValue) / parseFloat(goal.targetValue)) * 100
            : 0;

          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    Alvo: {goal.targetValue} {goal.unit}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progresso</span>
                    <span className="text-muted-foreground">
                      {latestEvidence?.currentValue || 0} / {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
                </div>

                {/* Evidências */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Evidências ({goalEvidences.length})</p>
                    <Button size="sm" onClick={() => handleOpenEvidenceDialog(idx)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Evidência
                    </Button>
                  </div>

                  {goalEvidences.length > 0 ? (
                    <div className="space-y-2">
                      {goalEvidences.map((evidence) => (
                        <Card key={evidence.id} className="border-2">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm">{evidence.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {evidence.createdAt ? new Date(evidence.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Valor: {evidence.currentValue}
                                  </span>
                                </div>
                                {(evidence.linkUrl || evidence.fileUrl) && (
                                  <a
                                    href={(evidence.linkUrl || evidence.fileUrl) || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                  >
                                    Ver anexo <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma evidência registrada ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Adicionar Evidência */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evidência</DialogTitle>
            <DialogDescription>
              Registre o progresso e anexe documentos comprobatórios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição da Evidência *</Label>
              <Textarea
                placeholder="Descreva o que foi realizado..."
                value={evidenceForm.description}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Atual *</Label>
              <Input
                type="number"
                placeholder="Ex: 15"
                value={evidenceForm.currentValue}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, currentValue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Anexo (opcional)</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={evidenceForm.attachmentUrl}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, attachmentUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Cole o link de um documento, imagem ou arquivo compartilhado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEvidence} disabled={submitEvidenceMutation.isPending}>
              {submitEvidenceMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Evidência
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
