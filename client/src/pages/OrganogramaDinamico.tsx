import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  Info,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import OrganogramaVisual from "@/components/OrganogramaVisual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Página de Organograma Dinâmico
 * Visualização interativa com drag-and-drop para movimentações
 */
export default function OrganogramaDinamico() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementData, setMovementData] = useState({
    movementType: "transferencia" as const,
    reason: "",
    notes: "",
  });

  const { data: structure, isLoading, refetch } = trpc.orgChart.getStructure.useQuery({});

  const generateMutation = trpc.orgChart.generateFromDepartments.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao gerar organograma: ${error.message}`);
    },
  });

  const moveEmployeeMutation = trpc.orgChart.moveEmployee.useMutation({
    onSuccess: () => {
      toast.success("Colaborador movimentado com sucesso!");
      setMovementDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao movimentar colaborador: ${error.message}`);
    },
  });

  const handleNodeMove = (nodeId: number, parentId: number | null) => {
    console.log("Node moved:", nodeId, "to parent:", parentId);
    // Aqui você pode implementar a lógica de movimentação de nós
    toast.info("Movimentação de nós ainda não implementada");
  };

  const handleEmployeeMove = (
    employeeId: number,
    newDepartmentId?: number,
    newPositionId?: number
  ) => {
    // Buscar dados do colaborador
    const employee = structure?.nodes
      .flatMap((node) => node.employees || [])
      .find((emp) => emp.id === employeeId);

    if (!employee) {
      toast.error("Colaborador não encontrado");
      return;
    }

    setSelectedEmployee({
      id: employeeId,
      name: employee.name,
      currentDepartmentId: newDepartmentId,
      currentPositionId: newPositionId,
    });
    setMovementDialogOpen(true);
  };

  const handleConfirmMovement = () => {
    if (!selectedEmployee) return;

    moveEmployeeMutation.mutate({
      employeeId: selectedEmployee.id,
      newDepartmentId: selectedEmployee.currentDepartmentId,
      newPositionId: selectedEmployee.currentPositionId,
      movementType: movementData.movementType,
      reason: movementData.reason,
      notes: movementData.notes,
    });
  };

  const handleGenerateStructure = () => {
    if (confirm("Isso irá gerar a estrutura do organograma a partir dos departamentos cadastrados. Continuar?")) {
      generateMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Organograma Dinâmico</h1>
            <p className="text-muted-foreground mt-2">
              Visualize e gerencie a estrutura organizacional com drag-and-drop
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={handleGenerateStructure} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Gerar Estrutura
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Nós</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {structure?.totalNodes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Departamentos e cargos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {structure?.nodes.reduce((acc, node) => acc + (node.employeeCount || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Distribuídos na estrutura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Níveis Hierárquicos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {structure?.nodes
                  ? Math.max(...structure.nodes.map((n) => n.level || 0)) + 1
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Profundidade da hierarquia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Como usar:</strong> Arraste colaboradores ou departamentos para reorganizar a
            estrutura. As mudanças serão registradas automaticamente no histórico de movimentações.
          </AlertDescription>
        </Alert>

        {/* Organograma Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              Visualização hierárquica interativa com drag-and-drop
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !structure || structure.nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                <Building2 className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma estrutura encontrada</p>
                <p className="text-sm mt-2">
                  Clique em "Gerar Estrutura" para criar o organograma automaticamente
                </p>
              </div>
            ) : (
              <OrganogramaVisual
                structure={structure.nodes}
                onNodeMove={handleNodeMove}
                onEmployeeMove={handleEmployeeMove}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Movimentação */}
        <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Movimentação</DialogTitle>
              <DialogDescription>
                Registre os detalhes da movimentação de{" "}
                <strong>{selectedEmployee?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <Select
                  value={movementData.movementType}
                  onValueChange={(value: any) =>
                    setMovementData({ ...movementData, movementType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promocao">Promoção</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="mudanca_gestor">Mudança de Gestor</SelectItem>
                    <SelectItem value="reorganizacao">Reorganização</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Descreva o motivo da movimentação..."
                  value={movementData.reason}
                  onChange={(e) =>
                    setMovementData({ ...movementData, reason: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Adicione observações adicionais..."
                  value={movementData.notes}
                  onChange={(e) =>
                    setMovementData({ ...movementData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMovementDialogOpen(false)}
                disabled={moveEmployeeMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmMovement}
                disabled={moveEmployeeMutation.isPending}
              >
                {moveEmployeeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar Movimentação"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
