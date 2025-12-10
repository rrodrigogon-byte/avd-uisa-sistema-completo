import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { MoveRight, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Performance = "baixo" | "médio" | "alto";
type Potential = "baixo" | "médio" | "alto";

interface EmployeePosition {
  employeeId: number;
  employeeName: string;
  currentPerformance?: Performance;
  currentPotential?: Potential;
}

/**
 * Página de Movimentação de Colaboradores no Nine Box
 * Permite ao RH movimentar colaboradores com justificativa obrigatória
 */
export default function MovimentacaoNineBox() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePosition | null>(null);
  const [toPerformance, setToPerformance] = useState<Performance>("médio");
  const [toPotential, setToPotential] = useState<Potential>("médio");
  const [justification, setJustification] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { employees } = useEmployeeSearch();
  // TODO: Implementar endpoint getMatrix no nineBoxRouter
  const { data: nineBoxData } = trpc.nineBox.getByCycle.useQuery({ cycleId: 1 });

  // Mutations
  const createMovement = trpc.calibrationDiretoria.createMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação criada e enviada para aprovação!");
      setIsDialogOpen(false);
      setSelectedEmployee(null);
      setJustification("");
      utils.calibrationDiretoria.listPendingMovements.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleOpenDialog = (employee: EmployeePosition) => {
    setSelectedEmployee(employee);
    setToPerformance(employee.currentPerformance || "médio");
    setToPotential(employee.currentPotential || "médio");
    setJustification("");
    setIsDialogOpen(true);
  };

  const handleSubmitMovement = () => {
    if (!selectedEmployee) return;

    if (justification.length < 10) {
      toast.error("Justificativa deve ter no mínimo 10 caracteres");
      return;
    }

    createMovement.mutate({
      employeeId: selectedEmployee.employeeId,
      fromPerformance: selectedEmployee.currentPerformance,
      fromPotential: selectedEmployee.currentPotential,
      toPerformance,
      toPotential,
      justification,
    });
  };

  // Organizar colaboradores por quadrante
  const employeesByQuadrant: Record<string, EmployeePosition[]> = {};

  employees?.forEach((emp) => {
    const position = nineBoxData?.find((item: any) => item.nineBox.employeeId === emp.employee.id)?.nineBox;
    
    const performance: Performance = position
      ? position.performance === 3
        ? "alto"
        : position.performance === 2
          ? "médio"
          : "baixo"
      : "médio";

    const potential: Potential = position
      ? position.potential === 3
        ? "alto"
        : position.potential === 2
          ? "médio"
          : "baixo"
      : "médio";

    const key = `${performance}_${potential}`;

    if (!employeesByQuadrant[key]) {
      employeesByQuadrant[key] = [];
    }

    employeesByQuadrant[key].push({
      employeeId: emp.employee.id,
      employeeName: emp.employee.name,
      currentPerformance: performance,
      currentPotential: potential,
    });
  });

  const getQuadrantColor = (performance: Performance, potential: Potential) => {
    if (performance === "alto" && potential === "alto") return "bg-green-100 border-green-500";
    if (performance === "alto" || potential === "alto") return "bg-blue-100 border-blue-500";
    if (performance === "baixo" && potential === "baixo") return "bg-red-100 border-red-500";
    return "bg-yellow-100 border-yellow-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MoveRight className="w-8 h-8 text-[#F39200]" />
            Movimentação de Colaboradores - Nine Box
          </h1>
          <p className="text-gray-600 mt-2">
            Clique em um colaborador para movimentá-lo no Nine Box
          </p>
        </div>
      </div>

      {/* Alerta */}
      <Card className="border-[#F39200]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F39200] mt-0.5" />
            <div>
              <p className="font-semibold">Workflow de Aprovação</p>
              <p className="text-sm text-gray-600 mt-1">
                Todas as movimentações passarão por aprovação do <strong>Diretor de Gente</strong> e{" "}
                <strong>Diretor de Área</strong>. O Diretor de Área deverá obrigatoriamente inserir
                evidências ao aprovar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz Nine Box */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz Nine Box - Clique para Movimentar</CardTitle>
          <CardDescription>
            Visualize a distribuição atual e clique em um colaborador para movimentá-lo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(["alto", "médio", "baixo"] as Potential[]).map((potential: any) =>
              (["baixo", "médio", "alto"] as Performance[]).map((performance: any) => {
                const key = `${performance}_${potential}`;
                const employeesInQuadrant = employeesByQuadrant[key] || [];

                return (
                  <div
                    key={key}
                    className={`p-4 border-2 rounded-lg ${getQuadrantColor(performance, potential)} min-h-[200px]`}
                  >
                    <div className="text-xs font-semibold text-gray-700 mb-3 text-center">
                      {performance.toUpperCase()} Desempenho
                      <br />
                      {potential.toUpperCase()} Potencial
                    </div>

                    <div className="space-y-2">
                      {employeesInQuadrant.map((emp: any) => (
                        <button
                          key={emp.employeeId}
                          onClick={() => handleOpenDialog(emp)}
                          className="w-full p-2 bg-white rounded border hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium truncate">{emp.employeeName}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 text-center">
                      <Badge variant="secondary">{employeesInQuadrant.length} colaboradores</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Movimentação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimentar Colaborador</DialogTitle>
            <DialogDescription>
              Defina a nova posição no Nine Box e justifique a movimentação
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Colaborador */}
              <div>
                <label className="text-sm font-medium">Colaborador</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedEmployee.employeeName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Posição atual: {selectedEmployee.currentPerformance?.toUpperCase() || "Não definido"}{" "}
                    Desempenho • {selectedEmployee.currentPotential?.toUpperCase() || "Não definido"}{" "}
                    Potencial
                  </p>
                </div>
              </div>

              {/* Nova Posição */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Novo Desempenho <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={toPerformance}
                    onValueChange={(value) => setToPerformance(value as Performance)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="médio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Novo Potencial <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={toPotential}
                    onValueChange={(value) => setToPotential(value as Potential)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="médio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Justificativa da Movimentação <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Descreva os motivos da movimentação (mínimo 10 caracteres)..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{justification.length} caracteres</p>
              </div>

              {/* Alerta de Workflow */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Workflow de Aprovação:</strong> Esta movimentação será enviada para aprovação
                  do Diretor de Gente e depois para o Diretor de Área, que deverá inserir evidências
                  obrigatoriamente.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitMovement}
              disabled={createMovement.isPending || justification.length < 10}
              className="bg-[#F39200] hover:bg-[#d67f00]"
            >
              {createMovement.isPending ? "Enviando..." : "Enviar para Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
