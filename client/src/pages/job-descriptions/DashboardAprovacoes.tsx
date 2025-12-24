import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  FileCheck,
} from "lucide-react";

/**
 * Dashboard de Aprovações de Descrições de Cargo
 * Interface para gestores aprovarem descrições individualmente ou em lote
 */
export default function DashboardAprovacoes() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | "bulk";
    jobId?: number;
  }>({ open: false, type: "approve" });
  const [comments, setComments] = useState("");

  // Query para listar descrições de cargo
  const { data: jobDescriptions, isLoading, refetch } = trpc.jobDescriptionsApprovals.list.useQuery({
    status: statusFilter || undefined,
    level: levelFilter || undefined,
    search: searchTerm || undefined,
  });

  // Mutations
  const approveMutation = trpc.jobDescriptionsApprovals.approve.useMutation({
    onSuccess: () => {
      toast.success("Descrição aprovada com sucesso!");
      refetch();
      setApprovalDialog({ open: false, type: "approve" });
      setComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.jobDescriptionsApprovals.reject.useMutation({
    onSuccess: () => {
      toast.success("Descrição rejeitada com sucesso!");
      refetch();
      setApprovalDialog({ open: false, type: "reject" });
      setComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const bulkApproveMutation = trpc.jobDescriptionsApprovals.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} descrições aprovadas com sucesso!`);
      refetch();
      setApprovalDialog({ open: false, type: "bulk" });
      setSelectedIds([]);
      setComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar em lote: ${error.message}`);
    },
  });

  const handleApprove = (jobId: number) => {
    setApprovalDialog({ open: true, type: "approve", jobId });
  };

  const handleReject = (jobId: number) => {
    setApprovalDialog({ open: true, type: "reject", jobId });
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma descrição para aprovar");
      return;
    }
    setApprovalDialog({ open: true, type: "bulk" });
  };

  const handleConfirmAction = () => {
    if (approvalDialog.type === "approve" && approvalDialog.jobId) {
      approveMutation.mutate({
        jobDescriptionId: approvalDialog.jobId,
        comments: comments || undefined,
      });
    } else if (approvalDialog.type === "reject" && approvalDialog.jobId) {
      if (!comments.trim()) {
        toast.error("Comentário é obrigatório para rejeição");
        return;
      }
      rejectMutation.mutate({
        jobDescriptionId: approvalDialog.jobId,
        comments,
      });
    } else if (approvalDialog.type === "bulk") {
      bulkApproveMutation.mutate({
        jobDescriptionIds: selectedIds,
        comments: comments || undefined,
      });
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!jobDescriptions) return;
    const pendingIds = jobDescriptions
      .filter((job) => job.status === "pendente_aprovacao")
      .map((job) => job.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      rascunho: { label: "Rascunho", variant: "secondary" as const, icon: Clock },
      pendente_aprovacao: { label: "Pendente", variant: "default" as const, icon: Clock },
      aprovado: { label: "Aprovado", variant: "success" as const, icon: CheckCircle2 },
      rejeitado: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
      arquivado: { label: "Arquivado", variant: "outline" as const, icon: FileCheck },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.rascunho;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelMap = {
      operacional: { label: "Operacional", color: "bg-blue-100 text-blue-800" },
      tatico: { label: "Tático", color: "bg-purple-100 text-purple-800" },
      estrategico: { label: "Estratégico", color: "bg-orange-100 text-orange-800" },
    };

    const config = levelMap[level as keyof typeof levelMap] || levelMap.operacional;

    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Aprovações</h1>
          <p className="text-muted-foreground">
            Gerencie aprovações de descrições de cargo
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button onClick={handleBulkApprove} size="lg">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Aprovar Selecionadas ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre descrições por status, nível ou termo de busca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pendente_aprovacao">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nível</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="tatico">Tático</SelectItem>
                  <SelectItem value="estrategico">Estratégico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Título ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Descrições */}
      <Card>
        <CardHeader>
          <CardTitle>Descrições de Cargo</CardTitle>
          <CardDescription>
            {jobDescriptions?.length || 0} descrições encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : !jobDescriptions || jobDescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma descrição encontrada
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length ===
                            jobDescriptions.filter(
                              (j) => j.status === "pendente_aprovacao"
                            ).length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobDescriptions.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        {job.status === "pendente_aprovacao" && (
                          <Checkbox
                            checked={selectedIds.includes(job.id)}
                            onCheckedChange={() => toggleSelection(job.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {job.code}
                      </TableCell>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{getLevelBadge(job.level)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {job.status === "pendente_aprovacao" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(job.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(job.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) =>
          setApprovalDialog({ ...approvalDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.type === "approve"
                ? "Aprovar Descrição"
                : approvalDialog.type === "reject"
                ? "Rejeitar Descrição"
                : `Aprovar ${selectedIds.length} Descrições`}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.type === "approve"
                ? "Confirme a aprovação desta descrição de cargo."
                : approvalDialog.type === "reject"
                ? "Informe o motivo da rejeição (obrigatório)."
                : "Confirme a aprovação em lote das descrições selecionadas."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comentários {approvalDialog.type === "reject" && "(obrigatório)"}
              </label>
              <Textarea
                placeholder="Adicione comentários sobre a decisão..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setApprovalDialog({ ...approvalDialog, open: false })
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant={
                approvalDialog.type === "reject" ? "destructive" : "default"
              }
              disabled={
                approvalDialog.type === "reject" && !comments.trim()
              }
            >
              {approvalDialog.type === "approve"
                ? "Aprovar"
                : approvalDialog.type === "reject"
                ? "Rejeitar"
                : "Aprovar Todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
