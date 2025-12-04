import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, XCircle, DollarSign, User, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AprovacaoBonus() {
  const { user } = useAuth();
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("calculado");

  // Buscar cálculos pendentes de aprovação
  const { data: calculations, isLoading, refetch } = trpc.bonus.listCalculations.useQuery(
    filterStatus !== "all" ? { status: filterStatus as any } : undefined
  );

  // Mutation para aprovar
  const approveMutation = trpc.bonus.approveCalculation.useMutation({
    onSuccess: () => {
      toast.success("Bônus aprovado com sucesso!");
      setIsApproveDialogOpen(false);
      setSelectedCalculation(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  // Mutation para marcar como pago
  const markAsPaidMutation = trpc.bonus.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Bônus marcado como pago!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao marcar como pago: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (selectedCalculation) {
      approveMutation.mutate({ calculationId: selectedCalculation.id, comments: undefined });
    }
  };

  const handleReject = () => {
    // Implementar lógica de rejeição se necessário
    toast.info("Funcionalidade de rejeição em desenvolvimento");
    setIsRejectDialogOpen(false);
  };

  const handleMarkAsPaid = (calculationId: number) => {
    markAsPaidMutation.mutate({ calculationId, paymentDate: new Date(), comments: "Pagamento realizado" });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      calculado: { label: "Calculado", variant: "secondary" },
      aprovado: { label: "Aprovado", variant: "default" },
      pago: { label: "Pago", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            Aprovações de Bônus
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie aprovações e pagamentos de bônus calculados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {calculations?.length || 0} cálculos
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Status:</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calculado">Calculado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cálculos */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Carregando cálculos...</p>
            </div>
          </CardContent>
        </Card>
      ) : calculations && calculations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {calculations.map((calc: any) => (
            <Card key={calc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {calc.employeeName || `Funcionário #${calc.employeeId}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {calc.policyName || "Política de Bônus"}
                        </p>
                      </div>
                      {getStatusBadge(calc.status)}
                    </div>

                    {/* Detalhes do Cálculo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Salário Base</p>
                        <p className="text-sm font-semibold">
                          R$ {Number(calc.baseSalary || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Multiplicador</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          {Number(calc.appliedMultiplier || 0).toFixed(1)}x
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valor do Bônus</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {Number(calc.bonusAmount || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Calculado em</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {calc.calculatedAt
                            ? new Date(calc.calculatedAt).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Justificativa */}
                    {calc.adjustmentReason && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Justificativa</p>
                          <p className="text-sm text-blue-700">{calc.adjustmentReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 ml-4">
                    {calc.status === "calculado" && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedCalculation(calc);
                            setIsApproveDialogOpen(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCalculation(calc);
                            setIsRejectDialogOpen(true);
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {calc.status === "aprovado" && (
                      <Button
                        onClick={() => handleMarkAsPaid(calc.id)}
                        disabled={markAsPaidMutation.isPending}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum cálculo encontrado
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Não há cálculos de bônus com o status "{filterStatus}" no momento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Aprovação */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aprovação de Bônus</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar o bônus para{" "}
              <strong>{selectedCalculation?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor do Bônus:</span>
                <span className="text-lg font-bold text-green-600">
                  R${" "}
                  {Number(selectedCalculation?.bonusAmount || 0).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Multiplicador:</span>
                <span className="text-sm font-semibold">
                  {Number(selectedCalculation?.appliedMultiplier || 0).toFixed(1)}x
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Bônus</DialogTitle>
            <DialogDescription>
              Você está prestes a rejeitar o bônus para{" "}
              <strong>{selectedCalculation?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Esta ação marcará o cálculo como rejeitado. Deseja continuar?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
