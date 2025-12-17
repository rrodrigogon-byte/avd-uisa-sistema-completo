import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle, XCircle, Clock, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ValidacaoLider() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  const { data: jobDescriptions, refetch } = trpc.jobDescriptions.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const filteredDescriptions = jobDescriptions?.filter((desc) => {
    const matchesSearch = desc.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         desc.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any; icon: any }> = {
      draft: { label: "Rascunho", variant: "secondary", icon: FileText },
      pending_occupant: { label: "Pendente Ocupante", variant: "default", icon: Clock },
      pending_manager: { label: "Pendente Superior", variant: "default", icon: Clock },
      pending_hr: { label: "Pendente RH", variant: "default", icon: Clock },
      approved: { label: "Aprovado", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma descrição");
      return;
    }
    setApprovalDialog(true);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma descrição");
      return;
    }
    setRejectDialog(true);
  };

  const confirmApprove = () => {
    toast.success(`${selectedIds.length} descrição(ões) aprovada(s)!`);
    setSelectedIds([]);
    setApprovalDialog(false);
    refetch();
  };

  const confirmReject = () => {
    if (!comments.trim()) {
      toast.error("Comentário é obrigatório para rejeição");
      return;
    }
    toast.success(`${selectedIds.length} descrição(ões) rejeitada(s)!`);
    setSelectedIds([]);
    setRejectDialog(false);
    setComments("");
    refetch();
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalDescriptions = filteredDescriptions?.length || 0;
  const pendingCount = filteredDescriptions?.filter(d => d.status.includes('pending')).length || 0;
  const approvedCount = filteredDescriptions?.filter(d => d.status === 'approved').length || 0;
  const rejectedCount = filteredDescriptions?.filter(d => d.status === 'rejected').length || 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Validação de Descrições de Cargo</h1>
          <p className="text-muted-foreground">Aprove ou rejeite descrições de cargo de sua equipe</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDescriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cargo ou departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-64">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending_occupant">Pendente Ocupante</SelectItem>
                    <SelectItem value="pending_manager">Pendente Superior</SelectItem>
                    <SelectItem value="pending_hr">Pendente RH</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBulkApprove}
                  disabled={selectedIds.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar ({selectedIds.length})
                </Button>
                <Button
                  onClick={handleBulkReject}
                  disabled={selectedIds.length === 0}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar ({selectedIds.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="grid grid-cols-1 gap-4">
          {filteredDescriptions?.map((desc: any) => (
            <Card key={desc.id} className={selectedIds.includes(desc.id) ? "border-primary" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(desc.id)}
                    onChange={() => toggleSelection(desc.id)}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{desc.positionTitle}</h3>
                        <p className="text-sm text-muted-foreground">{desc.departmentName}</p>
                      </div>
                      {getStatusBadge(desc.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {desc.mainObjective?.substring(0, 150)}...
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/descricao-cargos-uisa/${desc.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!filteredDescriptions || filteredDescriptions.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma descrição de cargo encontrada
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Descrições Selecionadas</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Você está prestes a aprovar {selectedIds.length} descrição(ões) de cargo.</p>
              <Textarea
                placeholder="Comentários (opcional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-4"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmApprove}>
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Descrições Selecionadas</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">Você está prestes a rejeitar {selectedIds.length} descrição(ões) de cargo.</p>
              <label className="text-sm font-medium mb-2 block">Motivo da Rejeição *</label>
              <Textarea
                placeholder="Descreva o motivo da rejeição..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmReject}>
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
