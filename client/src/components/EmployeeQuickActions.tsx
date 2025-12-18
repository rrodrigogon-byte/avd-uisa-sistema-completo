import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, Users, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActionType = "promote" | "transfer" | "terminate" | null;

interface EmployeeQuickActionsProps {
  employeeId: number | null;
  employeeName?: string;
  actionType: ActionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmployeeQuickActions({
  employeeId,
  employeeName,
  actionType,
  open,
  onOpenChange,
  onSuccess,
}: EmployeeQuickActionsProps) {
  // Form states
  const [promoteData, setPromoteData] = useState({
    newPositionId: "",
    newDepartmentId: "",
    newSalary: "",
    reason: "",
    notes: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const [transferData, setTransferData] = useState({
    newDepartmentId: "",
    newManagerId: "",
    newPositionId: "",
    reason: "",
    notes: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const [terminateData, setTerminateData] = useState({
    reason: "",
    notes: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  // Queries
  const { data: departmentsData } = trpc.departments.list.useQuery();
  const { data: positionsData } = trpc.positions.list.useQuery();
  const { data: employeesData } = trpc.employees.list.useQuery();

  const departments = departmentsData?.departments || [];
  const positions = positionsData?.positions || [];
  const employees = employeesData?.employees || [];

  // Mutations
  const promoteMutation = trpc.employeesAdvanced.promote.useMutation({
    onSuccess: () => {
      toast.success("Funcionário promovido com sucesso!");
      onOpenChange(false);
      onSuccess?.();
      resetForms();
    },
    onError: (error) => {
      toast.error(`Erro ao promover funcionário: ${error.message}`);
    },
  });

  const transferMutation = trpc.employeesAdvanced.transfer.useMutation({
    onSuccess: () => {
      toast.success("Funcionário transferido com sucesso!");
      onOpenChange(false);
      onSuccess?.();
      resetForms();
    },
    onError: (error) => {
      toast.error(`Erro ao transferir funcionário: ${error.message}`);
    },
  });

  const terminateMutation = trpc.employeesAdvanced.terminate.useMutation({
    onSuccess: () => {
      toast.success("Funcionário desligado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
      resetForms();
    },
    onError: (error) => {
      toast.error(`Erro ao desligar funcionário: ${error.message}`);
    },
  });

  const resetForms = () => {
    setPromoteData({
      newPositionId: "",
      newDepartmentId: "",
      newSalary: "",
      reason: "",
      notes: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
    setTransferData({
      newDepartmentId: "",
      newManagerId: "",
      newPositionId: "",
      reason: "",
      notes: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
    setTerminateData({
      reason: "",
      notes: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
  };

  const handlePromote = () => {
    if (!employeeId || !promoteData.newPositionId || !promoteData.reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    promoteMutation.mutate({
      employeeId,
      newPositionId: parseInt(promoteData.newPositionId),
      newDepartmentId: promoteData.newDepartmentId ? parseInt(promoteData.newDepartmentId) : undefined,
      newSalary: promoteData.newSalary ? Math.round(parseFloat(promoteData.newSalary) * 100) : undefined,
      reason: promoteData.reason,
      notes: promoteData.notes || undefined,
      effectiveDate: promoteData.effectiveDate,
    });
  };

  const handleTransfer = () => {
    if (!employeeId || !transferData.newDepartmentId || !transferData.reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    transferMutation.mutate({
      employeeId,
      newDepartmentId: parseInt(transferData.newDepartmentId),
      newManagerId: transferData.newManagerId ? parseInt(transferData.newManagerId) : undefined,
      newPositionId: transferData.newPositionId ? parseInt(transferData.newPositionId) : undefined,
      reason: transferData.reason,
      notes: transferData.notes || undefined,
      effectiveDate: transferData.effectiveDate,
    });
  };

  const handleTerminate = () => {
    if (!employeeId || !terminateData.reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    terminateMutation.mutate({
      employeeId,
      reason: terminateData.reason,
      notes: terminateData.notes || undefined,
      effectiveDate: terminateData.effectiveDate,
    });
  };

  const isLoading = promoteMutation.isPending || transferMutation.isPending || terminateMutation.isPending;

  if (!employeeId || !actionType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Promover Funcionário */}
        {actionType === "promote" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Promover Funcionário
              </DialogTitle>
              <DialogDescription>
                Promova {employeeName} para um novo cargo ou posição
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPosition">Novo Cargo *</Label>
                <Select
                  value={promoteData.newPositionId}
                  onValueChange={(value) => setPromoteData({ ...promoteData, newPositionId: value })}
                >
                  <SelectTrigger id="newPosition">
                    <SelectValue placeholder="Selecione o novo cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newDepartmentPromote">Novo Departamento (opcional)</Label>
                <Select
                  value={promoteData.newDepartmentId}
                  onValueChange={(value) => setPromoteData({ ...promoteData, newDepartmentId: value })}
                >
                  <SelectTrigger id="newDepartmentPromote">
                    <SelectValue placeholder="Manter departamento atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newSalary">Novo Salário (R$)</Label>
                  <Input
                    id="newSalary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={promoteData.newSalary}
                    onChange={(e) => setPromoteData({ ...promoteData, newSalary: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDatePromote">Data Efetiva *</Label>
                  <Input
                    id="effectiveDatePromote"
                    type="date"
                    value={promoteData.effectiveDate}
                    onChange={(e) => setPromoteData({ ...promoteData, effectiveDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonPromote">Motivo da Promoção *</Label>
                <Textarea
                  id="reasonPromote"
                  placeholder="Descreva o motivo da promoção..."
                  value={promoteData.reason}
                  onChange={(e) => setPromoteData({ ...promoteData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notesPromote">Observações</Label>
                <Textarea
                  id="notesPromote"
                  placeholder="Observações adicionais..."
                  value={promoteData.notes}
                  onChange={(e) => setPromoteData({ ...promoteData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handlePromote} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Promoção"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Transferir Funcionário */}
        {actionType === "transfer" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Transferir Funcionário
              </DialogTitle>
              <DialogDescription>
                Transfira {employeeName} para outro departamento ou gestor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDepartmentTransfer">Novo Departamento *</Label>
                <Select
                  value={transferData.newDepartmentId}
                  onValueChange={(value) => setTransferData({ ...transferData, newDepartmentId: value })}
                >
                  <SelectTrigger id="newDepartmentTransfer">
                    <SelectValue placeholder="Selecione o novo departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newManager">Novo Gestor (opcional)</Label>
                <Select
                  value={transferData.newManagerId}
                  onValueChange={(value) => setTransferData({ ...transferData, newManagerId: value })}
                >
                  <SelectTrigger id="newManager">
                    <SelectValue placeholder="Manter gestor atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPositionTransfer">Novo Cargo (opcional)</Label>
                <Select
                  value={transferData.newPositionId}
                  onValueChange={(value) => setTransferData({ ...transferData, newPositionId: value })}
                >
                  <SelectTrigger id="newPositionTransfer">
                    <SelectValue placeholder="Manter cargo atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDateTransfer">Data Efetiva *</Label>
                <Input
                  id="effectiveDateTransfer"
                  type="date"
                  value={transferData.effectiveDate}
                  onChange={(e) => setTransferData({ ...transferData, effectiveDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonTransfer">Motivo da Transferência *</Label>
                <Textarea
                  id="reasonTransfer"
                  placeholder="Descreva o motivo da transferência..."
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notesTransfer">Observações</Label>
                <Textarea
                  id="notesTransfer"
                  placeholder="Observações adicionais..."
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleTransfer} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Transferência"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Desligar Funcionário */}
        {actionType === "terminate" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Desligar Funcionário
              </DialogTitle>
              <DialogDescription>
                Registre o desligamento de {employeeName}
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta ação irá desativar o funcionário no sistema. Esta operação pode ser revertida posteriormente.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDateTerminate">Data Efetiva do Desligamento *</Label>
                <Input
                  id="effectiveDateTerminate"
                  type="date"
                  value={terminateData.effectiveDate}
                  onChange={(e) => setTerminateData({ ...terminateData, effectiveDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonTerminate">Motivo do Desligamento *</Label>
                <Textarea
                  id="reasonTerminate"
                  placeholder="Descreva o motivo do desligamento..."
                  value={terminateData.reason}
                  onChange={(e) => setTerminateData({ ...terminateData, reason: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notesTerminate">Observações</Label>
                <Textarea
                  id="notesTerminate"
                  placeholder="Observações adicionais..."
                  value={terminateData.notes}
                  onChange={(e) => setTerminateData({ ...terminateData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleTerminate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Desligamento"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
