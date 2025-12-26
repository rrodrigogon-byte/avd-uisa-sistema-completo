import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckSquare, XSquare, Filter, DollarSign, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AprovacaoBonusLote() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<number | null>(null);
  const [filterMinValue, setFilterMinValue] = useState<string>("");
  const [filterMaxValue, setFilterMaxValue] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Queries
  const { data: calculations, refetch } = trpc.bonus.listCalculations.useQuery({
    status: "calculado",
  });

  const { data: departments } = trpc.organization.departments.list.useQuery(undefined);

  // Mutations
  const approveBatch = trpc.bonus.approveBatch.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.length} bônus aprovados com sucesso!`);
      setSelectedIds([]);
      setComment("");
      setShowApproveDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectBatch = trpc.bonus.rejectBatch.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.length} bônus rejeitados`);
      setSelectedIds([]);
      setRejectReason("");
      setShowRejectDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  // Filtrar cálculos
  const filteredCalculations = calculations?.filter((calc: any) => {
    const matchesDept = !filterDepartment || calc.departmentId === filterDepartment;
    const matchesMonth = !filterMonth || calc.referenceMonth === filterMonth;
    
    const bonusValue = Number(calc.bonusAmount) / 100;
    const matchesMin = !filterMinValue || bonusValue >= Number(filterMinValue);
    const matchesMax = !filterMaxValue || bonusValue <= Number(filterMaxValue);

    return matchesDept && matchesMonth && matchesMin && matchesMax;
  });

  // Estatísticas
  const totalSelected = selectedIds.length;
  const totalValue = filteredCalculations
    ?.filter((c: any) => selectedIds.includes(c.id))
    .reduce((sum: number, c: any) => sum + Number(c.bonusAmount), 0) || 0;

  const handleToggleAll = () => {
    if (selectedIds.length === filteredCalculations?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCalculations?.map((c: any) => c.id) || []);
    }
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApprove = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um bônus");
      return;
    }
    setShowApproveDialog(true);
  };

  const handleReject = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um bônus");
      return;
    }
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    approveBatch.mutate({
      calculationIds: selectedIds,
      comment: comment || undefined,
    });
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    rejectBatch.mutate({
      calculationIds: selectedIds,
      reason: rejectReason,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-8 h-8 text-green-600" />
          Aprovação em Lote de Bônus
        </h1>
        <p className="text-gray-500 mt-1">
          Aprove ou rejeite múltiplos bônus simultaneamente
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bônus Selecionados</p>
                <p className="text-3xl font-bold text-blue-600">{totalSelected}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total Selecionado</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {(totalValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponíveis para Aprovação</p>
                <p className="text-3xl font-bold text-purple-600">
                  {filteredCalculations?.length || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <Select
                value={filterDepartment?.toString() || "all"}
                onValueChange={(v) => setFilterDepartment(v === "all" ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mês de Referência</label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Mínimo (R$)</label>
              <Input
                type="number"
                value={filterMinValue}
                onChange={(e) => setFilterMinValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Máximo (R$)</label>
              <Input
                type="number"
                value={filterMaxValue}
                onChange={(e) => setFilterMaxValue(e.target.value)}
                placeholder="999999.00"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilterDepartment(null);
                setFilterMonth("");
                setFilterMinValue("");
                setFilterMaxValue("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={selectedIds.length === 0}
          className="gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Aprovar Selecionados ({selectedIds.length})
        </Button>
        <Button
          onClick={handleReject}
          disabled={selectedIds.length === 0}
          variant="destructive"
          className="gap-2"
        >
          <XSquare className="w-4 h-4" />
          Rejeitar Selecionados ({selectedIds.length})
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Bônus Pendentes de Aprovação</CardTitle>
          <CardDescription>
            {filteredCalculations?.length || 0} bônus encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      (filteredCalculations?.length ?? 0) > 0 &&
                      selectedIds.length === (filteredCalculations?.length ?? 0)
                    }
                    onCheckedChange={handleToggleAll}
                  />
                </TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Política</TableHead>
                <TableHead>Mês Ref.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Multiplicador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalculations && filteredCalculations.length > 0 ? (
                filteredCalculations.map((calc: any) => (
                  <TableRow key={calc.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(calc.id)}
                        onCheckedChange={() => handleToggle(calc.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {calc.employeeName || `Func. #${calc.employeeId}`}
                    </TableCell>
                    <TableCell>{calc.policyName || "N/A"}</TableCell>
                    <TableCell>{calc.referenceMonth}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      R${" "}
                      {(Number(calc.bonusAmount) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{Number(calc.multiplier).toFixed(2)}x</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum bônus pendente de aprovação
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aprovação em Lote</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar {selectedIds.length} bônus totalizando R${" "}
              {(totalValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentário (opcional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione um comentário sobre esta aprovação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmApprove} disabled={approveBatch.isPending}>
              {approveBatch.isPending ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Rejeição em Lote</DialogTitle>
            <DialogDescription>
              Você está prestes a rejeitar {selectedIds.length} bônus. Esta ação pode ser
              revertida posteriormente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Motivo da Rejeição *
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectBatch.isPending}
            >
              {rejectBatch.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
