import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dashboard de RH para Gestão de Bônus
 * Visualização consolidada, cálculo de elegibilidade e aprovação de bônus
 */
export default function DashboardBonusRH() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [extraBonusPercentage, setExtraBonusPercentage] = useState("0");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: dashboard, refetch: refetchDashboard } = trpc.bonusWorkflow.getDashboard.useQuery({
    cycleId: selectedCycleId,
  });

  const { data: cycles = [] } = trpc.cyclesLegacy.list.useQuery(undefined);
  const { data: workflows = [] } = trpc.bonusWorkflow.listWorkflows.useQuery(undefined);
  const { data: pendingApprovals = [] } = trpc.bonusWorkflow.myPendingApprovals.useQuery(undefined);

  // Mutations
  const initiateMutation = trpc.bonusWorkflow.initiateApproval.useMutation({
    onSuccess: () => {
      toast.success("Processo de aprovação iniciado com sucesso!");
      refetchDashboard();
      setApprovalDialogOpen(false);
      setSelectedEmployee(null);
      setExtraBonusPercentage("0");
      setSelectedWorkflowId("");
    },
    onError: (error: any) => {
      toast.error("Erro ao iniciar aprovação", {
        description: error.message,
      });
    },
  });

  const approveMutation = trpc.bonusWorkflow.approveLevel.useMutation({
    onSuccess: () => {
      toast.success("Bônus aprovado com sucesso!");
      refetchDashboard();
    },
    onError: (error: any) => {
      toast.error("Erro ao aprovar bônus", {
        description: error.message,
      });
    },
  });

  const openApprovalDialog = async (employee: any) => {
    if (!selectedCycleId) {
      toast.error("Selecione um ciclo primeiro");
      return;
    }

    setSelectedEmployee(employee);
    setApprovalDialogOpen(true);
  };

  const handleInitiateApproval = () => {
    if (!selectedEmployee || !selectedWorkflowId || !selectedCycleId) {
      toast.error("Preencha todos os campos");
      return;
    }

    const eligibleAmount = parseFloat(selectedEmployee.eligibleAmount || "0");
    const extraPercentage = parseFloat(extraBonusPercentage);

    initiateMutation.mutate({
      employeeId: selectedEmployee.employeeId,
      cycleId: selectedCycleId,
      workflowId: Number(selectedWorkflowId),
      eligibleAmount,
      extraBonusPercentage: extraPercentage,
    });
  };

  const handleApprove = (approvalId: number, level: number) => {
    if (confirm("Confirma a aprovação deste bônus?")) {
      approveMutation.mutate({
        approvalId,
        level,
        action: "approved",
      });
    }
  };

  const handleReject = (approvalId: number, level: number) => {
    const comments = prompt("Motivo da rejeição:");
    if (comments) {
      approveMutation.mutate({
        approvalId,
        level,
        action: "rejected",
        comments,
      });
    }
  };

  const filteredApprovals = dashboard?.approvals?.filter((approval: any) =>
    approval.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Bônus - RH</h1>
          <p className="text-gray-600 mt-1">
            Gerencie aprovações de bônus e visualize estatísticas consolidadas
          </p>
        </div>

        <div className="w-64">
          <Label>Ciclo de Avaliação</Label>
          <Select
            value={selectedCycleId?.toString() || ""}
            onValueChange={(v) => setSelectedCycleId(v ? Number(v) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((cycle: any) => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aprovações</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalApprovals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Colaboradores no ciclo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bônus Elegível</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboard?.totalEligible?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Baseado em metas concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bônus Final</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboard?.totalFinal?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Com bônus extra aplicado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm">
              <Badge className="bg-yellow-500">{dashboard?.pendingCount || 0} Pendentes</Badge>
              <Badge className="bg-green-500">{dashboard?.approvedCount || 0} Aprovados</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({filteredApprovals.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({dashboard?.pendingCount || 0})
          </TabsTrigger>
          <TabsTrigger value="my-approvals">
            Minhas Aprovações ({pendingApprovals.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Todos */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Aprovações de Bônus</CardTitle>
                  <CardDescription>
                    Lista completa de colaboradores elegíveis para bônus
                  </CardDescription>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma aprovação encontrada
                  </h3>
                  <p className="text-gray-600">
                    Selecione um ciclo para visualizar as aprovações de bônus
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="text-right">Bônus Elegível</TableHead>
                      <TableHead className="text-right">Bônus Final</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApprovals.map((approval: any) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">
                          {approval.employeeName || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {parseFloat(approval.eligibleAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {parseFloat(approval.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {approval.status === "pending" && (
                            <Badge className="bg-yellow-500">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                          {approval.status === "approved" && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Aprovado
                            </Badge>
                          )}
                          {approval.status === "rejected" && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejeitado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {approval.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openApprovalDialog(approval)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Iniciar Aprovação
                            </Button>
                          )}
                          {approval.status === "approved" && (
                            <Button size="sm" variant="outline" disabled>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Concluído
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pendentes */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Aprovações Pendentes</CardTitle>
              <CardDescription>
                {dashboard?.pendingCount || 0} aprovações aguardando processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-right">Bônus Elegível</TableHead>
                    <TableHead className="text-right">Bônus Final</TableHead>
                    <TableHead className="text-center">Nível Atual</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals
                    .filter((a: any) => a.status === "pending")
                    .map((approval: any) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">
                          {approval.employeeName || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {parseFloat(approval.eligibleAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {parseFloat(approval.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">Nível {approval.currentLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openApprovalDialog(approval)}
                          >
                            Processar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Minhas Aprovações */}
        <TabsContent value="my-approvals">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Aprovações Pendentes</CardTitle>
              <CardDescription>
                {pendingApprovals.length} aprovações aguardando sua análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma aprovação pendente
                  </h3>
                  <p className="text-gray-600">
                    Você não possui aprovações pendentes no momento
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead className="text-right">Valor Final</TableHead>
                      <TableHead className="text-center">Nível</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval: any) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">
                          {approval.employeeName || "N/A"}
                        </TableCell>
                        <TableCell>{approval.cycleName || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          R$ {parseFloat(approval.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">Nível {approval.currentLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(approval.id, approval.currentLevel)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(approval.id, approval.currentLevel)}
                              disabled={approveMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Iniciação de Aprovação */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Iniciar Processo de Aprovação</DialogTitle>
            <DialogDescription>
              Configure o bônus extra e selecione o workflow de aprovação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Input value={selectedEmployee?.employeeName || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Bônus Elegível</Label>
              <Input
                value={`R$ ${parseFloat(selectedEmployee?.eligibleAmount || "0").toFixed(2)}`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-bonus">Bônus Extra (%)</Label>
              <Input
                id="extra-bonus"
                type="number"
                min="0"
                max="100"
                value={extraBonusPercentage}
                onChange={(e) => setExtraBonusPercentage(e.target.value)}
                placeholder="Ex: 10 (10% adicional)"
              />
              <p className="text-xs text-gray-500">
                Percentual adicional sobre o valor elegível
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow">Workflow de Aprovação</Label>
              <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows
                    .filter((w: any) => w.isActive)
                    .map((workflow: any) => (
                      <SelectItem key={workflow.id} value={workflow.id.toString()}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cálculo Final */}
            {selectedEmployee && extraBonusPercentage && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Cálculo Final:</p>
                  <p className="text-xs text-blue-700">
                    Bônus Elegível: R${" "}
                    {parseFloat(selectedEmployee.eligibleAmount || "0").toFixed(2)}
                    <br />
                    Bônus Extra ({extraBonusPercentage}%): R${" "}
                    {(
                      parseFloat(selectedEmployee.eligibleAmount || "0") *
                      (parseFloat(extraBonusPercentage) / 100)
                    ).toFixed(2)}
                    <br />
                    <strong>
                      Total: R${" "}
                      {(
                        parseFloat(selectedEmployee.eligibleAmount || "0") +
                        parseFloat(selectedEmployee.eligibleAmount || "0") *
                          (parseFloat(extraBonusPercentage) / 100)
                      ).toFixed(2)}
                    </strong>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInitiateApproval}
              disabled={initiateMutation.isPending}
              className="bg-[#F39200] hover:bg-[#d67e00]"
            >
              {initiateMutation.isPending ? "Iniciando..." : "Iniciar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
