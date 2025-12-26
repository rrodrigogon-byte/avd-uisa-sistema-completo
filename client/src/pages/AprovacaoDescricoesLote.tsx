import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  Filter,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Página de Aprovação em Lote de Descrições de Cargo
 * 
 * Funcionalidades:
 * - Visualização de descrições pendentes
 * - Aprovação/rejeição em lote
 * - Solicitação de revisão
 * - Histórico de aprovações
 * - Estatísticas
 */

export default function AprovacaoDescricoesLote() {
  const [selectedStatus, setSelectedStatus] = useState<"pendente" | "aprovado" | "rejeitado">("pendente");
  const [selectedDescriptions, setSelectedDescriptions] = useState<number[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<any>(null);
  
  const [rejectForm, setRejectForm] = useState({ reason: "" });
  const [revisionForm, setRevisionForm] = useState({ feedback: "" });
  const [commentForm, setCommentForm] = useState({ comment: "" });

  // Queries
  const { data: pendingApprovals, isLoading, refetch } = trpc.jobDescriptionBatchApproval.getPendingApprovals.useQuery({
    status: selectedStatus,
  });

  const { data: stats } = trpc.jobDescriptionBatchApproval.getApprovalStats.useQuery(undefined);

  const { data: history } = trpc.jobDescriptionBatchApproval.getApprovalHistory.useQuery(
    { descriptionId: selectedDescription?.id || 0 },
    { enabled: !!selectedDescription && historyDialogOpen }
  );

  // Mutations
  const batchApprove = trpc.jobDescriptionBatchApproval.batchApprove.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} descrições aprovadas com sucesso!`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} descrições falharam`);
      }
      setSelectedDescriptions([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na aprovação em lote: ${error.message}`);
    },
  });

  const batchReject = trpc.jobDescriptionBatchApproval.batchReject.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} descrições rejeitadas!`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} descrições falharam`);
      }
      setSelectedDescriptions([]);
      setRejectDialogOpen(false);
      setRejectForm({ reason: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na rejeição em lote: ${error.message}`);
    },
  });

  const batchRequestRevision = trpc.jobDescriptionBatchApproval.batchRequestRevision.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} revisões solicitadas!`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} solicitações falharam`);
      }
      setSelectedDescriptions([]);
      setRevisionDialogOpen(false);
      setRevisionForm({ feedback: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao solicitar revisão: ${error.message}`);
    },
  });

  const addComment = trpc.jobDescriptionBatchApproval.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setCommentForm({ comment: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    },
  });

  // Handlers
  const handleSelectDescription = (descId: number) => {
    setSelectedDescriptions((prev) =>
      prev.includes(descId) ? prev.filter((id) => id !== descId) : [...prev, descId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDescriptions.length === pendingApprovals?.length) {
      setSelectedDescriptions([]);
    } else {
      setSelectedDescriptions(pendingApprovals?.map((d) => d.id) || []);
    }
  };

  const handleBatchApprove = () => {
    if (selectedDescriptions.length === 0) {
      toast.warning("Selecione pelo menos uma descrição");
      return;
    }

    if (!confirm(`Aprovar ${selectedDescriptions.length} descrições?`)) {
      return;
    }

    batchApprove.mutate({
      descriptionIds: selectedDescriptions,
      notifyEmployees: true,
    });
  };

  const handleBatchReject = () => {
    if (selectedDescriptions.length === 0) {
      toast.warning("Selecione pelo menos uma descrição");
      return;
    }

    setRejectDialogOpen(true);
  };

  const handleBatchRequestRevision = () => {
    if (selectedDescriptions.length === 0) {
      toast.warning("Selecione pelo menos uma descrição");
      return;
    }

    setRevisionDialogOpen(true);
  };

  const submitReject = () => {
    if (!rejectForm.reason.trim()) {
      toast.warning("Informe o motivo da rejeição");
      return;
    }

    batchReject.mutate({
      descriptionIds: selectedDescriptions,
      reason: rejectForm.reason,
      notifyEmployees: true,
    });
  };

  const submitRevision = () => {
    if (!revisionForm.feedback.trim()) {
      toast.warning("Informe o feedback para revisão");
      return;
    }

    batchRequestRevision.mutate({
      descriptionIds: selectedDescriptions,
      feedback: revisionForm.feedback,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-50">Pendente</Badge>;
      case "aprovado":
        return <Badge variant="default" className="bg-green-50 text-green-700">Aprovado</Badge>;
      case "rejeitado":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "em_revisao":
        return <Badge variant="secondary">Em Revisão</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aprovação de Descrições de Cargo</h1>
          <p className="text-muted-foreground">
            Aprove, rejeite ou solicite revisão de descrições em lote
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendente}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprovado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejeitado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Revisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.em_revisao}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Descrições de Cargo</CardTitle>
              <CardDescription>
                {selectedDescriptions.length > 0 && (
                  <span>{selectedDescriptions.length} selecionada(s)</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDescriptions.length > 0 && selectedStatus === "pendente" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ações em Lote</AlertTitle>
              <AlertDescription className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleBatchApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Selecionadas
                </Button>
                <Button size="sm" variant="outline" onClick={handleBatchRequestRevision}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Solicitar Revisão
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBatchReject}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Selecionadas
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando descrições...
            </div>
          ) : !pendingApprovals || pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma descrição encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedStatus === "pendente" && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDescriptions.length === pendingApprovals.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Submetido em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((desc) => (
                  <TableRow key={desc.id}>
                    {selectedStatus === "pendente" && (
                      <TableCell>
                        <Checkbox
                          checked={selectedDescriptions.includes(desc.id)}
                          onCheckedChange={() => handleSelectDescription(desc.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{desc.employeeName}</TableCell>
                    <TableCell>{desc.title}</TableCell>
                    <TableCell>
                      {desc.submittedAt
                        ? new Date(desc.submittedAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(desc.approvalStatus)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDescription(desc);
                          setViewDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDescription(desc);
                          setHistoryDialogOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDescription?.title}</DialogTitle>
            <DialogDescription>
              {selectedDescription?.employeeName} - {selectedDescription?.employeeEmail}
            </DialogDescription>
          </DialogHeader>

          {selectedDescription && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Descrição</Label>
                <p className="text-sm mt-1">{selectedDescription.description}</p>
              </div>

              <div>
                <Label className="font-semibold">Responsabilidades</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {selectedDescription.responsibilities &&
                    JSON.parse(selectedDescription.responsibilities).map((resp: string, i: number) => (
                      <li key={i}>{resp}</li>
                    ))}
                </ul>
              </div>

              <div>
                <Label className="font-semibold">Requisitos</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {selectedDescription.requirements &&
                    JSON.parse(selectedDescription.requirements).map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                </ul>
              </div>

              <div>
                <Label className="font-semibold">Competências</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {selectedDescription.competencies &&
                    JSON.parse(selectedDescription.competencies).map((comp: string, i: number) => (
                      <li key={i}>{comp}</li>
                    ))}
                </ul>
              </div>

              {selectedStatus === "pendente" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      batchApprove.mutate({
                        descriptionIds: [selectedDescription.id],
                        notifyEmployees: true,
                      });
                      setViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedDescriptions([selectedDescription.id]);
                      setRevisionDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Solicitar Revisão
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedDescriptions([selectedDescription.id]);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Descrições</DialogTitle>
            <DialogDescription>
              Rejeitar {selectedDescriptions.length} descrição(ões) selecionada(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                placeholder="Descreva o motivo da rejeição..."
                value={rejectForm.reason}
                onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={submitReject} disabled={batchReject.isPending}>
              {batchReject.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Revisão */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Revisão</DialogTitle>
            <DialogDescription>
              Solicitar revisão de {selectedDescriptions.length} descrição(ões)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feedback para Revisão *</Label>
              <Textarea
                placeholder="Descreva o que precisa ser revisado..."
                value={revisionForm.feedback}
                onChange={(e) => setRevisionForm({ ...revisionForm, feedback: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitRevision} disabled={batchRequestRevision.isPending}>
              {batchRequestRevision.isPending ? "Enviando..." : "Solicitar Revisão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Aprovações</DialogTitle>
            <DialogDescription>
              {selectedDescription?.title} - {selectedDescription?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {!history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum histórico registrado
              </div>
            ) : (
              history.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.action}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.approvedAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{item.approverName}</p>
                        {item.comment && (
                          <p className="text-sm text-muted-foreground">{item.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
