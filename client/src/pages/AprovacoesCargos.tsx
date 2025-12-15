import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  CheckSquare,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AprovacoesCargos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedForBatch, setSelectedForBatch] = useState<number[]>([]);

  // Queries
  const { data: pendingApprovals, isLoading, refetch } = trpc.jobDescriptionApprovals.getPendingApprovals.useQuery({
    level: levelFilter === "all" ? undefined : parseInt(levelFilter),
  });

  // Mutations
  const approveLevel = trpc.jobDescriptionApprovals.approveLevel.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo aprovada com sucesso!");
      setShowApproveDialog(false);
      setComments("");
      setSelectedApproval(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectLevel = trpc.jobDescriptionApprovals.rejectLevel.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo rejeitada");
      setShowRejectDialog(false);
      setComments("");
      setSelectedApproval(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const batchApprove = trpc.jobDescriptionApprovals.batchApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approvedCount} descrições aprovadas em lote!`);
      setSelectedForBatch([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na aprovação em lote: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!selectedApproval) return;
    
    approveLevel.mutate({
      approvalId: selectedApproval.approval.id,
      level: selectedApproval.approval.currentLevel,
      comments: comments || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedApproval || !comments.trim()) {
      toast.error("Comentários são obrigatórios para rejeição");
      return;
    }

    rejectLevel.mutate({
      approvalId: selectedApproval.approval.id,
      level: selectedApproval.approval.currentLevel,
      comments,
    });
  };

  const handleBatchApprove = () => {
    if (selectedForBatch.length === 0) {
      toast.error("Selecione pelo menos uma descrição");
      return;
    }

    if (levelFilter === "all") {
      toast.error("Selecione um nível específico para aprovação em lote");
      return;
    }

    batchApprove.mutate({
      approvalIds: selectedForBatch,
      level: parseInt(levelFilter),
      comments: comments || undefined,
    });
  };

  const toggleBatchSelection = (approvalId: number) => {
    setSelectedForBatch(prev =>
      prev.includes(approvalId)
        ? prev.filter(id => id !== approvalId)
        : [...prev, approvalId]
    );
  };

  const getLevelBadge = (level: number) => {
    const levels = {
      1: { label: "Nível 1: Líder Imediato", color: "bg-blue-100 text-blue-800" },
      2: { label: "Nível 2: RH C&S", color: "bg-purple-100 text-purple-800" },
      3: { label: "Nível 3: Gerente RH", color: "bg-orange-100 text-orange-800" },
      4: { label: "Nível 4: Diretor", color: "bg-red-100 text-red-800" },
    };
    const config = levels[level as keyof typeof levels];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { label: "Aprovado", className: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800", icon: XCircle },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderWorkflowTimeline = (approval: any) => {
    const levels = [
      { level: 1, name: approval.level1ApproverName, status: approval.level1Status, date: approval.level1ApprovedAt, comments: approval.level1Comments },
      { level: 2, name: approval.level2ApproverName, status: approval.level2Status, date: approval.level2ApprovedAt, comments: approval.level2Comments },
      { level: 3, name: approval.level3ApproverName, status: approval.level3Status, date: approval.level3ApprovedAt, comments: approval.level3Comments },
      { level: 4, name: approval.level4ApproverName, status: approval.level4Status, date: approval.level4ApprovedAt, comments: approval.level4Comments },
    ];

    return (
      <div className="space-y-4">
        {levels.map((lvl, idx) => {
          const isActive = approval.currentLevel === lvl.level;
          const isPast = lvl.level < approval.currentLevel;
          const isFuture = lvl.level > approval.currentLevel;

          return (
            <div key={lvl.level} className="relative">
              {idx < levels.length - 1 && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                    isPast ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
              <div className="flex items-start gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isPast
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isActive ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{getLevelBadge(lvl.level)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3 inline mr-1" />
                        {lvl.name || "Não definido"}
                      </div>
                    </div>
                    {lvl.status && getStatusBadge(lvl.status)}
                  </div>
                  {lvl.date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(lvl.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  )}
                  {lvl.comments && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {lvl.comments}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredApprovals = pendingApprovals?.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.jobDescription?.jobTitle?.toLowerCase().includes(searchLower) ||
      item.jobDescription?.department?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Aprovações de Descrições de Cargos
          </h1>
          <p className="text-muted-foreground mt-1">
            Workflow de aprovação em 4 níveis hierárquicos
          </p>
        </div>
        {selectedForBatch.length > 0 && (
          <Button onClick={handleBatchApprove} disabled={batchApprove.isPending}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Aprovar {selectedForBatch.length} em Lote
          </Button>
        )}
      </div>

      {/* Informações do Workflow */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Workflow de Aprovação</AlertTitle>
        <AlertDescription>
          Todas as descrições de cargo passam por 4 níveis obrigatórios de aprovação:
          <div className="mt-2 space-y-1 text-sm">
            <div>1. <strong>Líder Imediato</strong> - Ajusta e aprova descrições de sua equipe</div>
            <div>2. <strong>Alexsandra Oliveira</strong> - RH Cargos e Salários</div>
            <div>3. <strong>André</strong> - Gerente de RH</div>
            <div>4. <strong>Rodrigo Ribeiro Gonçalves</strong> - Diretor</div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cargo, departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nível de Aprovação</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="1">Nível 1: Líder Imediato</SelectItem>
                  <SelectItem value="2">Nível 2: RH C&S</SelectItem>
                  <SelectItem value="3">Nível 3: Gerente RH</SelectItem>
                  <SelectItem value="4">Nível 4: Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Aprovações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Aprovações Pendentes</CardTitle>
          <CardDescription>
            {filteredApprovals?.length || 0} descrição(ões) aguardando sua aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredApprovals && filteredApprovals.length > 0 ? (
            <div className="space-y-4">
              {filteredApprovals.map((item) => (
                <Card key={item.approval.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {levelFilter !== "all" && (
                        <input
                          type="checkbox"
                          checked={selectedForBatch.includes(item.approval.id)}
                          onChange={() => toggleBatchSelection(item.approval.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.jobDescription?.jobTitle || "Cargo não especificado"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.jobDescription?.department || "Departamento não especificado"}
                            </p>
                          </div>
                          {getLevelBadge(item.approval.currentLevel)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Criado: {format(new Date(item.approval.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedApproval(item)}
                              >
                                Ver Workflow Completo
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Workflow de Aprovação - {item.jobDescription?.jobTitle}
                                </DialogTitle>
                                <DialogDescription>
                                  Acompanhe o progresso da aprovação em todos os níveis
                                </DialogDescription>
                              </DialogHeader>
                              {renderWorkflowTimeline(item.approval)}
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedApproval(item);
                              setShowApproveDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedApproval(item);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma aprovação pendente no momento
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Descrição de Cargo</DialogTitle>
            <DialogDescription>
              Confirme a aprovação da descrição de cargo: {selectedApproval?.jobDescription?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approveComments">Comentários (opcional)</Label>
              <Textarea
                id="approveComments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveLevel.isPending}>
              {approveLevel.isPending ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Descrição de Cargo</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da descrição: {selectedApproval?.jobDescription?.jobTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Comentários são obrigatórios para rejeição. A descrição retornará ao criador para ajustes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejectComments">Motivo da Rejeição *</Label>
              <Textarea
                id="rejectComments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Descreva os ajustes necessários..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLevel.isPending || !comments.trim()}
            >
              {rejectLevel.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
