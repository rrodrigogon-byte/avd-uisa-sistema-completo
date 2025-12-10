import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, FileText, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DescricaoCargosUISA() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);

  const { data: jobDescriptions, refetch } = trpc.jobDescriptions.list.useQuery({});

  const approveMutation = trpc.jobDescriptions.approve.useMutation({
    onSuccess: () => {
      toast.success("Descrição aprovada com sucesso!");
      setApprovalDialog(false);
      setComments("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao aprovar: " + error.message);
    },
  });

  const rejectMutation = trpc.jobDescriptions.reject.useMutation({
    onSuccess: () => {
      toast.success("Descrição rejeitada");
      setRejectDialog(false);
      setComments("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      pending_occupant: { label: "Aguardando Ocupante", variant: "default" },
      pending_manager: { label: "Aguardando Superior", variant: "default" },
      pending_hr: { label: "Aguardando RH", variant: "default" },
      approved: { label: "Aprovado", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: "secondary" };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleApprove = () => {
    if (selectedApprovalId) {
      approveMutation.mutate({ approvalId: selectedApprovalId, comments });
    }
  };

  const handleReject = () => {
    if (selectedApprovalId && comments.trim()) {
      rejectMutation.mutate({ approvalId: selectedApprovalId, comments });
    } else {
      toast.error("Comentário obrigatório para rejeição");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Descrição de Cargos - Template UISA</h1>
            <p className="text-muted-foreground">Gerencie descrições de cargo com workflow de aprovação</p>
          </div>
          <Button onClick={() => navigate("/descricao-cargos-uisa/criar")}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Descrição
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Descrições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{jobDescriptions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {jobDescriptions?.filter(j => j.status.includes("pending")).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {jobDescriptions?.filter(j => j.status === "approved").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {jobDescriptions?.filter(j => j.status === "draft").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Descrições */}
        <Card>
          <CardHeader>
            <CardTitle>Descrições de Cargo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Divisão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobDescriptions?.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.positionTitle}</TableCell>
                    <TableCell>{job.departmentName}</TableCell>
                    <TableCell>{job.division || "-"}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{new Date(job.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/descricao-cargos-uisa/${job.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!jobDescriptions || jobDescriptions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma descrição de cargo cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de Aprovação */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Descrição de Cargo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Comentários (opcional)</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Adicione comentários sobre a aprovação..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeição */}
        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Descrição de Cargo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Motivo da Rejeição *</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
