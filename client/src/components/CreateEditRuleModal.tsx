import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CreateEditRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: any | null;
  onSuccess: () => void;
}

export default function CreateEditRuleModal({
  open,
  onOpenChange,
  editingRule,
  onSuccess,
}: CreateEditRuleModalProps) {
  const [ruleType, setRuleType] = useState<string>("departamento");
  const [approvalContext, setApprovalContext] = useState<string>("todos");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [costCenterId, setCostCenterId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [approverId, setApproverId] = useState<number | null>(null);
  const [approverLevel, setApproverLevel] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [searchApprover, setSearchApprover] = useState("");

  // Queries
  const { data: departments = [] } = trpc.approvalRules.getDepartments.useQuery();
  const { data: costCenters = [] } = trpc.approvalRules.getCostCenters.useQuery();
  const { data: employees = [] } = trpc.approvalRules.getEmployees.useQuery({
    search: searchEmployee,
  });
  const { data: approvers = [] } = trpc.approvalRules.getEmployees.useQuery({
    search: searchApprover,
  });

  // Validação de conflitos em tempo real
  const { data: conflicts = [], isFetching: isCheckingConflicts } =
    trpc.approvalRules.checkConflicts.useQuery(
      {
        ruleType: ruleType as any,
        approvalContext: approvalContext as any,
        departmentId: departmentId || undefined,
        costCenterId: costCenterId || undefined,
        employeeId: employeeId || undefined,
        excludeRuleId: editingRule?.id,
      },
      {
        enabled: open && !!approverId, // Só valida se modal aberto e aprovador selecionado
      }
    );

  // Mutations
  const createMutation = trpc.approvalRules.create.useMutation({
    onSuccess: () => {
      toast.success("Regra criada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const updateMutation = trpc.approvalRules.update.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar regra: ${error.message}`);
    },
  });

  // Preencher formulário ao editar
  useEffect(() => {
    if (editingRule && open) {
      setRuleType(editingRule.ruleType);
      setApprovalContext(editingRule.approvalContext);
      setDepartmentId(editingRule.departmentId);
      setCostCenterId(editingRule.costCenterId);
      setEmployeeId(editingRule.employeeId);
      setApproverId(editingRule.approverId);
      setApproverLevel(editingRule.approverLevel);
      setIsActive(editingRule.isActive);
    } else if (!open) {
      resetForm();
    }
  }, [editingRule, open]);

  const resetForm = () => {
    setRuleType("departamento");
    setApprovalContext("todos");
    setDepartmentId(null);
    setCostCenterId(null);
    setEmployeeId(null);
    setApproverId(null);
    setApproverLevel(1);
    setIsActive(true);
    setSearchEmployee("");
    setSearchApprover("");
  };

  const handleSubmit = () => {
    // Validações básicas
    if (!approverId) {
      toast.error("Selecione um aprovador");
      return;
    }

    if (ruleType === "departamento" && !departmentId) {
      toast.error("Selecione um departamento");
      return;
    }

    if (ruleType === "centro_custo" && !costCenterId) {
      toast.error("Selecione um centro de custo");
      return;
    }

    if (ruleType === "individual" && !employeeId) {
      toast.error("Selecione um funcionário");
      return;
    }

    // Verificar conflitos
    if (conflicts.length > 0) {
      toast.error(
        "Existem conflitos com regras existentes. Resolva os conflitos antes de salvar."
      );
      return;
    }

    const data = {
      ruleType: ruleType as any,
      approvalContext: approvalContext as any,
      departmentId: ruleType === "departamento" ? departmentId : null,
      costCenterId: ruleType === "centro_custo" ? costCenterId : null,
      employeeId: ruleType === "individual" ? employeeId : null,
      approverId: approverId!,
      approverLevel,
      isActive,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getContextLabel = (context: string) => {
    const labels: Record<string, string> = {
      metas: "Metas",
      avaliacoes: "Avaliações",
      pdi: "PDI",
      descricao_cargo: "Descrição de Cargo",
      ciclo_360: "Ciclo 360°",
      bonus: "Bônus",
      promocao: "Promoção",
      todos: "Todos",
    };
    return labels[context] || context;
  };

  const hasConflicts = conflicts.length > 0;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Editar Regra de Aprovação" : "Nova Regra de Aprovação"}
          </DialogTitle>
          <DialogDescription>
            Configure quem será o aprovador para determinado contexto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Regra */}
          <div className="space-y-2">
            <Label>Tipo de Regra *</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departamento">Por Departamento</SelectItem>
                <SelectItem value="centro_custo">Por Centro de Custo</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contexto de Aprovação */}
          <div className="space-y-2">
            <Label>Contexto de Aprovação *</Label>
            <Select value={approvalContext} onValueChange={setApprovalContext}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Contextos</SelectItem>
                <SelectItem value="metas">Metas</SelectItem>
                <SelectItem value="avaliacoes">Avaliações</SelectItem>
                <SelectItem value="pdi">PDI</SelectItem>
                <SelectItem value="descricao_cargo">Descrição de Cargo</SelectItem>
                <SelectItem value="ciclo_360">Ciclo 360°</SelectItem>
                <SelectItem value="bonus">Bônus</SelectItem>
                <SelectItem value="promocao">Promoção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vinculação por Departamento */}
          {ruleType === "departamento" && (
            <div className="space-y-2">
              <Label>Departamento *</Label>
              <Select
                value={departmentId?.toString() || ""}
                onValueChange={(v) => setDepartmentId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vinculação por Centro de Custo */}
          {ruleType === "centro_custo" && (
            <div className="space-y-2">
              <Label>Centro de Custo *</Label>
              <Select
                value={costCenterId?.toString() || ""}
                onValueChange={(v) => setCostCenterId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc: any) => (
                    <SelectItem key={cc.id} value={cc.id.toString()}>
                      {cc.code} - {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vinculação Individual */}
          {ruleType === "individual" && (
            <div className="space-y-2">
              <Label>Funcionário *</Label>
              <Input
                placeholder="Buscar funcionário..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
              />
              <Select
                value={employeeId?.toString() || ""}
                onValueChange={(v) => setEmployeeId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Aprovador */}
          <div className="space-y-2">
            <Label>Aprovador *</Label>
            <Input
              placeholder="Buscar aprovador..."
              value={searchApprover}
              onChange={(e) => setSearchApprover(e.target.value)}
            />
            <Select
              value={approverId?.toString() || ""}
              onValueChange={(v) => setApproverId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aprovador" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nível de Aprovação */}
          <div className="space-y-2">
            <Label>Nível de Aprovação</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={approverLevel}
              onChange={(e) => setApproverLevel(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Ordem de aprovação (1 = primeira aprovação, 2 = segunda, etc.)
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Regra Ativa</Label>
              <p className="text-xs text-muted-foreground">
                Desative temporariamente sem excluir a regra
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Validação de Conflitos em Tempo Real */}
          {isCheckingConflicts && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando conflitos...</AlertTitle>
              <AlertDescription>Aguarde enquanto validamos a regra</AlertDescription>
            </Alert>
          )}

          {!isCheckingConflicts && hasConflicts && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Conflitos Detectados</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p>
                    Foram encontradas {conflicts.length} regra(s) ativa(s) que conflitam com
                    esta configuração:
                  </p>
                  <div className="space-y-1">
                    {conflicts.map((conflict: any) => (
                      <div
                        key={conflict.id}
                        className="text-sm bg-destructive/10 p-2 rounded"
                      >
                        • <strong>{conflict.approverName}</strong> já é aprovador de{" "}
                        <Badge variant="outline" className="mx-1">
                          {getContextLabel(conflict.approvalContext)}
                        </Badge>
                        {conflict.departmentName && (
                          <span>no departamento {conflict.departmentName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2">
                    <strong>Sugestões:</strong>
                  </p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    <li>Desative a(s) regra(s) conflitante(s) antes de criar esta</li>
                    <li>Escolha um contexto mais específico (ao invés de "Todos")</li>
                    <li>Selecione outro aprovador ou vinculação</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!isCheckingConflicts && !hasConflicts && approverId && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Nenhum conflito detectado</AlertTitle>
              <AlertDescription>
                Esta regra pode ser salva sem problemas
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || hasConflicts}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : editingRule ? (
              "Atualizar Regra"
            ) : (
              "Criar Regra"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
