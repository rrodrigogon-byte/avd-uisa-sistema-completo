import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Filter, Building2, DollarSign, User } from "lucide-react";

const RULE_TYPE_LABELS = {
  departamento: "Departamento",
  centro_custo: "Centro de Custo",
  individual: "Individual",
};

const APPROVAL_CONTEXT_LABELS = {
  metas: "Metas",
  avaliacoes: "Avaliações",
  pdi: "PDI",
  descricao_cargo: "Descrição de Cargo",
  ciclo_360: "Ciclo 360°",
  bonus: "Bônus",
  promocao: "Promoção",
  todos: "Todos",
};

export default function Aprovadores() {
  const { user, loading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterContext, setFilterContext] = useState<string>("todos");

  // Form state
  const [ruleType, setRuleType] = useState<"departamento" | "centro_custo" | "individual">("departamento");
  const [approvalContext, setApprovalContext] = useState<string>("todos");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [costCenterId, setCostCenterId] = useState<number | undefined>();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [approverId, setApproverId] = useState<number | undefined>();
  const [approverLevel, setApproverLevel] = useState<number>(1);
  const [searchApprover, setSearchApprover] = useState("");

  // Queries
  const { data: rules, isLoading, refetch } = trpc.approvalRules.list.useQuery({
    ruleType: filterType as any,
    approvalContext: filterContext as any,
    isActive: true,
  });

  const { data: departments } = trpc.approvalRules.getDepartments.useQuery();
  const { data: costCenters } = trpc.approvalRules.getCostCenters.useQuery();
  const { data: employees } = trpc.approvalRules.getEmployees.useQuery({ search: searchApprover });

  // Mutations
  const createMutation = trpc.approvalRules.create.useMutation({
    onSuccess: () => {
      toast.success("Regra de aprovação criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const deleteMutation = trpc.approvalRules.delete.useMutation({
    onSuccess: () => {
      toast.success("Regra excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir regra: ${error.message}`);
    },
  });

  const resetForm = () => {
    setRuleType("departamento");
    setApprovalContext("todos");
    setDepartmentId(undefined);
    setCostCenterId(undefined);
    setEmployeeId(undefined);
    setApproverId(undefined);
    setApproverLevel(1);
    setSearchApprover("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    createMutation.mutate({
      ruleType,
      approvalContext: approvalContext as any,
      departmentId,
      costCenterId,
      employeeId,
      approverId,
      approverLevel,
      requiresSequentialApproval: false,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta regra?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Aprovadores</h1>
            <p className="text-muted-foreground mt-2">
              Configure quem aprova o quê por departamento, centro de custo ou funcionário individual
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Regra de Aprovação</DialogTitle>
                <DialogDescription>
                  Defina quem será o aprovador para um departamento, centro de custo ou funcionário específico
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Regra *</Label>
                    <Select value={ruleType} onValueChange={(v: any) => setRuleType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="departamento">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Departamento
                          </div>
                        </SelectItem>
                        <SelectItem value="centro_custo">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Centro de Custo
                          </div>
                        </SelectItem>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Individual
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contexto de Aprovação *</Label>
                    <Select value={approvalContext} onValueChange={setApprovalContext}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(APPROVAL_CONTEXT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {ruleType === "departamento" && (
                  <div className="space-y-2">
                    <Label>Departamento *</Label>
                    <Select value={departmentId?.toString()} onValueChange={(v) => setDepartmentId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {ruleType === "centro_custo" && (
                  <div className="space-y-2">
                    <Label>Centro de Custo *</Label>
                    <Select value={costCenterId?.toString()} onValueChange={(v) => setCostCenterId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters?.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id.toString()}>
                            {cc.name} ({cc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {ruleType === "individual" && (
                  <div className="space-y-2">
                    <Label>Funcionário *</Label>
                    <Input
                      placeholder="Buscar por nome, e-mail ou código..."
                      value={searchApprover}
                      onChange={(e) => setSearchApprover(e.target.value)}
                      className="mb-2"
                    />
                    <Select value={employeeId?.toString()} onValueChange={(v) => setEmployeeId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name} ({emp.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Aprovador *</Label>
                  <Input
                    placeholder="Buscar aprovador por nome, e-mail ou código..."
                    value={searchApprover}
                    onChange={(e) => setSearchApprover(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={approverId?.toString()} onValueChange={(v) => setApproverId(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aprovador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.department?.name || "Sem departamento"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nível Hierárquico</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={approverLevel}
                    onChange={(e) => setApproverLevel(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nível 1 = primeiro aprovador, Nível 2 = segundo aprovador, etc.
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Regra
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Regra</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="centro_custo">Centro de Custo</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contexto</Label>
                <Select value={filterContext} onValueChange={setFilterContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(APPROVAL_CONTEXT_LABELS)
                      .filter(([k]) => k !== "todos")
                      .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Regras */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Cadastradas</CardTitle>
            <CardDescription>
              {rules?.length || 0} regra(s) de aprovação ativa(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rules && rules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vinculação</TableHead>
                    <TableHead>Contexto</TableHead>
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline">{RULE_TYPE_LABELS[rule.ruleType]}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.departmentName || rule.costCenterName || "Individual"}
                      </TableCell>
                      <TableCell>
                        <Badge>{APPROVAL_CONTEXT_LABELS[rule.approvalContext]}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{rule.approverName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Nível {rule.approverLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
