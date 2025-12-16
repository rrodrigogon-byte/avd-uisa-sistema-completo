import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Clock,
  Users,
  FileText,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mapeamento de níveis
const LEVEL_NAMES: Record<number, string> = {
  1: "Líder Imediato",
  2: "Especialista C&S",
  3: "Gerente RH",
  4: "Diretor GAI",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-500" },
  pending_leader: { label: "Aguardando Líder", color: "bg-yellow-500" },
  pending_cs_specialist: { label: "Aguardando C&S", color: "bg-blue-500" },
  pending_hr_manager: { label: "Aguardando RH", color: "bg-purple-500" },
  pending_gai_director: { label: "Aguardando Diretor", color: "bg-orange-500" },
  approved: { label: "Aprovado", color: "bg-green-500" },
  rejected: { label: "Rejeitado", color: "bg-red-500" },
  returned: { label: "Devolvido", color: "bg-amber-500" },
};

export default function AprovacaoDescricoes() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "return" | null>(null);
  const [comments, setComments] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Queries
  const { data: pendingApprovals, refetch: refetchPending } = trpc.approvalFlow.getPendingApprovals.useQuery();
  const { data: stats } = trpc.approvalFlow.getStats.useQuery();
  const { data: allFlows, refetch: refetchAll } = trpc.approvalFlow.listAll.useQuery({
    status: filterStatus !== "all" ? filterStatus : undefined,
    limit: 100,
  });

  // Mutations
  const approveMutation = trpc.approvalFlow.approve.useMutation({
    onSuccess: () => {
      toast.success("Descrição aprovada com sucesso!");
      setActionDialog(null);
      setComments("");
      setSelectedFlow(null);
      refetchPending();
      refetchAll();
    },
    onError: (error) => {
      toast.error("Erro ao aprovar: " + error.message);
    },
  });

  const rejectMutation = trpc.approvalFlow.reject.useMutation({
    onSuccess: () => {
      toast.success("Descrição rejeitada");
      setActionDialog(null);
      setComments("");
      setSelectedFlow(null);
      refetchPending();
      refetchAll();
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar: " + error.message);
    },
  });

  const returnMutation = trpc.approvalFlow.return.useMutation({
    onSuccess: () => {
      toast.success("Descrição devolvida para ajustes");
      setActionDialog(null);
      setComments("");
      setSelectedFlow(null);
      refetchPending();
      refetchAll();
    },
    onError: (error) => {
      toast.error("Erro ao devolver: " + error.message);
    },
  });

  const handleAction = () => {
    if (!selectedFlow) return;

    const level = selectedFlow.currentLevel;

    if (actionDialog === "approve") {
      approveMutation.mutate({
        flowId: selectedFlow.id,
        level,
        comments: comments || undefined,
      });
    } else if (actionDialog === "reject") {
      if (comments.length < 10) {
        toast.error("Comentário deve ter pelo menos 10 caracteres");
        return;
      }
      rejectMutation.mutate({
        flowId: selectedFlow.id,
        level,
        comments,
      });
    } else if (actionDialog === "return") {
      if (comments.length < 10) {
        toast.error("Comentário deve ter pelo menos 10 caracteres");
        return;
      }
      returnMutation.mutate({
        flowId: selectedFlow.id,
        level,
        comments,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_LABELS[status] || { label: status, color: "bg-gray-500" };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getLevelBadge = (level: number) => {
    return (
      <Badge variant="outline" className="font-normal">
        Nível {level}: {LEVEL_NAMES[level] || "Desconhecido"}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Aprovação de Descrições de Cargos</h1>
          <p className="text-muted-foreground">
            Gerencie o fluxo de aprovação de descrições de cargos em 4 níveis hierárquicos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Minhas Pendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.pendingForUser || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Em Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(stats?.byStatus?.pending_leader || 0) +
                  (stats?.byStatus?.pending_cs_specialist || 0) +
                  (stats?.byStatus?.pending_hr_manager || 0) +
                  (stats?.byStatus?.pending_gai_director || 0)}
              </div>
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
              <div className="text-3xl font-bold text-green-600">{stats?.byStatus?.approved || 0}</div>
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
              <div className="text-3xl font-bold text-red-600">{stats?.byStatus?.rejected || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Devolvidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats?.byStatus?.returned || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Fluxo de Aprovação Visual */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fluxo de Aprovação - 4 Níveis</CardTitle>
            <CardDescription>
              Cada descrição de cargo passa por 4 níveis de aprovação obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {Object.entries(LEVEL_NAMES).map(([level, name], index) => (
                <div key={level} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-blue-500"
                          : index === 2
                          ? "bg-purple-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {level}
                    </div>
                    <span className="mt-2 text-sm font-medium text-center max-w-[100px]">{name}</span>
                  </div>
                  {index < 3 && <ChevronRight className="w-8 h-8 text-muted-foreground mx-4" />}
                </div>
              ))}
              <ChevronRight className="w-8 h-8 text-muted-foreground mx-4" />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 text-white font-bold text-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <span className="mt-2 text-sm font-medium">Aprovado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Minhas Pendências ({pendingApprovals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Todas as Aprovações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Minhas Pendências */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Descrições Aguardando Minha Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Nível Atual</TableHead>
                      <TableHead>Submetido em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals?.map((flow: any) => (
                      <TableRow key={flow.id}>
                        <TableCell className="font-medium">
                          {flow.jobDescription?.positionTitle || "N/A"}
                        </TableCell>
                        <TableCell>{flow.jobDescription?.departmentName || "N/A"}</TableCell>
                        <TableCell>{getLevelBadge(flow.currentLevel)}</TableCell>
                        <TableCell>
                          {flow.submittedAt
                            ? new Date(flow.submittedAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/descricao-cargos-uisa/${flow.jobDescriptionId}`)
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedFlow(flow);
                                setActionDialog("approve");
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 border-amber-600 hover:bg-amber-50"
                              onClick={() => {
                                setSelectedFlow(flow);
                                setActionDialog("return");
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Devolver
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedFlow(flow);
                                setActionDialog("reject");
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!pendingApprovals || pendingApprovals.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                          Nenhuma descrição pendente de sua aprovação
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Todas as Aprovações */}
          <TabsContent value="all">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico de Aprovações</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="pending_leader">Aguardando Líder</SelectItem>
                      <SelectItem value="pending_cs_specialist">Aguardando C&S</SelectItem>
                      <SelectItem value="pending_hr_manager">Aguardando RH</SelectItem>
                      <SelectItem value="pending_gai_director">Aguardando Diretor</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                      <SelectItem value="returned">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nível Atual</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFlows?.map((flow: any) => (
                      <TableRow key={flow.id}>
                        <TableCell className="font-medium">
                          {flow.jobDescription?.positionTitle || "N/A"}
                        </TableCell>
                        <TableCell>{flow.jobDescription?.departmentName || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(flow.status)}</TableCell>
                        <TableCell>
                          {flow.currentLevel > 0 && flow.currentLevel <= 4
                            ? getLevelBadge(flow.currentLevel)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(flow.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/descricao-cargos-uisa/${flow.jobDescriptionId}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!allFlows || allFlows.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum fluxo de aprovação encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Ação */}
        <Dialog
          open={actionDialog !== null}
          onOpenChange={(open) => {
            if (!open) {
              setActionDialog(null);
              setComments("");
              setSelectedFlow(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog === "approve" && "Aprovar Descrição de Cargo"}
                {actionDialog === "reject" && "Rejeitar Descrição de Cargo"}
                {actionDialog === "return" && "Devolver para Ajustes"}
              </DialogTitle>
              <DialogDescription>
                {selectedFlow && (
                  <>
                    Cargo: <strong>{selectedFlow.jobDescription?.positionTitle}</strong>
                    <br />
                    Nível atual: <strong>{LEVEL_NAMES[selectedFlow.currentLevel]}</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>
                  Comentários {actionDialog !== "approve" && "*"}
                  {actionDialog === "approve" && " (opcional)"}
                </Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionDialog === "approve"
                      ? "Adicione comentários sobre a aprovação..."
                      : actionDialog === "reject"
                      ? "Descreva o motivo da rejeição (mínimo 10 caracteres)..."
                      : "Descreva os ajustes necessários (mínimo 10 caracteres)..."
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setActionDialog(null);
                  setComments("");
                  setSelectedFlow(null);
                }}
              >
                Cancelar
              </Button>
              {actionDialog === "approve" && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAction}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              )}
              {actionDialog === "return" && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleAction}
                  disabled={returnMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Devolver
                </Button>
              )}
              {actionDialog === "reject" && (
                <Button variant="destructive" onClick={handleAction} disabled={rejectMutation.isPending}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
