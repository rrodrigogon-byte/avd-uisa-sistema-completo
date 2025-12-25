import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Target, User, Calendar, AlertCircle, TrendingUp, FileText } from "lucide-react";

export default function AprovacaoGeralCiclo() {
  const { user } = useAuth();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    performanceScore: "",
    comments: "",
  });

  const { data: cycles } = trpc.performanceEvaluationCycle.listCycles.useQuery({});
  const { data: participants, refetch } = trpc.performanceEvaluationCycle.listParticipants.useQuery(
    { cycleId: selectedCycleId || 0 },
    { enabled: !!selectedCycleId }
  );
  const { data: evidences } = trpc.performanceEvaluationCycle.listEvidences.useQuery(
    { participantId: selectedParticipant?.id || 0 },
    { enabled: !!selectedParticipant }
  );

  const finalApproveMutation = trpc.performanceEvaluationCycle.finalApproval.useMutation({
    onSuccess: () => {
      toast.success("Avaliação aprovada com sucesso!");
      setShowApprovalDialog(false);
      setApprovalForm({ performanceScore: "", comments: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const handleOpenApprovalDialog = (participant: any) => {
    setSelectedParticipant(participant);
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = () => {
    if (!approvalForm.performanceScore) {
      toast.error("Informe a nota de desempenho");
      return;
    }

    const score = parseFloat(approvalForm.performanceScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Nota deve estar entre 0 e 100");
      return;
    }

    finalApproveMutation.mutate({
      participantId: selectedParticipant.id,
      performanceScore: score,
      comments: approvalForm.comments,
    });
  };

  // Verificar permissão
  if (user?.role !== "admin" && !user?.email?.includes("rh")) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Acesso Negado</p>
            <p className="text-muted-foreground text-center">
              Apenas RH e Administradores podem realizar aprovação final.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCycles = cycles?.filter((c) => c.status === "em_andamento") || [];
  const pendingParticipants = participants?.filter((p) => p.status === "aprovado") || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Aprovação Final de Avaliações</h1>
        <p className="text-muted-foreground mt-1">
          Revise evidências e aprove as avaliações finais dos colaboradores
        </p>
      </div>

      {/* Seleção de Ciclo */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione o Ciclo</CardTitle>
          <CardDescription>Escolha um ciclo ativo para revisar as avaliações</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCycleId?.toString()}
            onValueChange={(value) => setSelectedCycleId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um ciclo..." />
            </SelectTrigger>
            <SelectContent>
              {activeCycles.map((cycle: any) => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name} ({new Date(cycle.startDate).toLocaleDateString("pt-BR")} - {new Date(cycle.endDate).toLocaleDateString("pt-BR")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* KPIs */}
      {selectedCycleId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Colaboradores no ciclo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingParticipants.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação final</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {participants?.filter((p) => p.status === "concluido").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Avaliações finalizadas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Participantes */}
      {selectedCycleId && pendingParticipants.length > 0 ? (
        <div className="space-y-4">
          {pendingParticipants.map((participant: any) => {
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
                            Aprovado pelo gestor em {new Date(participant.managerApprovedAt || "").toLocaleDateString("pt-BR")}
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

                  {/* Comentários do Gestor */}
                  {participant.managerComments && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Comentários do Gestor:</p>
                      <p className="text-sm">{participant.managerComments}</p>
                    </div>
                  )}

                  {/* Botão de Ação */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleOpenApprovalDialog(participant)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Realizar Aprovação Final
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : selectedCycleId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma aprovação pendente</p>
            <p className="text-muted-foreground text-center">
              Todas as avaliações deste ciclo já foram finalizadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Selecione um ciclo</p>
            <p className="text-muted-foreground text-center">
              Escolha um ciclo ativo acima para visualizar as avaliações pendentes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Aprovação Final */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprovação Final - {selectedParticipant?.employee?.name}</DialogTitle>
            <DialogDescription>
              Revise as evidências e atribua a nota final de desempenho
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Evidências */}
            {evidences && evidences.length > 0 && (
              <div>
                <p className="font-medium mb-2">Evidências Registradas ({evidences.length}):</p>
                <div className="space-y-2">
                  {evidences.map((evidence: any) => (
                    <Card key={evidence.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{evidence.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(evidence.submittedAt).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Valor: {evidence.currentValue}
                              </span>
                            </div>
                            {evidence.attachmentUrl && (
                              <a
                                href={evidence.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 inline-block"
                              >
                                Ver anexo
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário de Aprovação */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Nota de Desempenho (0-100) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Ex: 85"
                  value={approvalForm.performanceScore}
                  onChange={(e) => setApprovalForm({ ...approvalForm, performanceScore: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Comentários Finais</Label>
                <Textarea
                  placeholder="Adicione observações sobre o desempenho do colaborador..."
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitApproval} disabled={finalApproveMutation.isPending}>
              {finalApproveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Aprovação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
