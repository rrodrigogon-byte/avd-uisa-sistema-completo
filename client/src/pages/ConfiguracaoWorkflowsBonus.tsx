import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Workflow,
  Plus,
  Trash2,
  Edit,
  Users,
  CheckCircle2,
  ArrowRight,
  Settings,
} from "lucide-react";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

/**
 * Página de Configuração de Workflows de Bônus
 * Interface para criar e gerenciar workflows personalizados de aprovação
 */
export default function ConfiguracaoWorkflowsBonus() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [selectedApprovers, setSelectedApprovers] = useState<
    Array<{ level: number; approverId: number; approverName: string; role: string }>
  >([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("manager");

  // Buscar workflows existentes
  const { data: workflows, refetch } = trpc.bonus.listWorkflows.useQuery(undefined);

  // Buscar funcionários para seleção de aprovadores
  const {
    searchTerm: employeeSearch,
    setSearchTerm: setEmployeeSearch,
    employees,
    isLoading: loadingEmployees
  } = useEmployeeSearch();

  // Mutations
  const createWorkflowMutation = trpc.bonus.createWorkflow.useMutation({
    onSuccess: () => {
      toast.success("Workflow criado com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar workflow", {
        description: error.message,
      });
    },
  });

  const deleteWorkflowMutation = trpc.bonus.deleteWorkflow.useMutation({
    onSuccess: () => {
      toast.success("Workflow excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir workflow", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setWorkflowName("");
    setSelectedApprovers([]);
    setCurrentLevel(1);
    setSelectedEmployee(null);
    setSelectedRole("manager");
  };

  const handleAddApprover = () => {
    if (!selectedEmployee) {
      toast.error("Selecione um aprovador");
      return;
    }

    const employee = employees?.find((e) => e.id === selectedEmployee);
    if (!employee) return;

    setSelectedApprovers([
      ...selectedApprovers,
      {
        level: currentLevel,
        approverId: selectedEmployee,
        approverName: employee.name,
        role: selectedRole,
      },
    ]);

    setCurrentLevel(currentLevel + 1);
    setSelectedEmployee(null);
  };

  const handleRemoveApprover = (level: number) => {
    setSelectedApprovers(selectedApprovers.filter((a) => a.level !== level));
    // Reordenar níveis
    const reordered = selectedApprovers
      .filter((a) => a.level !== level)
      .map((a: any, index: number) => ({ ...a, level: index + 1 }));
    setSelectedApprovers(reordered);
    setCurrentLevel(reordered.length + 1);
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Digite um nome para o workflow");
      return;
    }

    if (selectedApprovers.length === 0) {
      toast.error("Adicione pelo menos um aprovador");
      return;
    }

    await createWorkflowMutation.mutateAsync({
      name: workflowName,
      approvers: selectedApprovers.map(a => ({
        employeeId: a.approverId,
        role: a.role,
      })),
    });
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (confirm("Tem certeza que deseja excluir este workflow?")) {
      await deleteWorkflowMutation.mutateAsync({ id: workflowId });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      manager: "Gestor",
      hr: "RH",
      hr_manager: "Gerente RH",
      director: "Diretor de Gente",
      finance: "Financeiro",
    };
    return labels[role] || role;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Workflow className="w-8 h-8 text-[#F39200]" />
            Workflows de Aprovação de Bônus
          </h1>
          <p className="text-gray-600 mt-2">
            Configure workflows personalizados com até 5 níveis de aprovação
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#F39200] hover:bg-[#d67e00]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Workflow</DialogTitle>
              <DialogDescription>
                Configure um workflow personalizado de aprovação de bônus
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Nome do Workflow */}
              <div>
                <Label>Nome do Workflow</Label>
                <Input
                  placeholder="Ex: Workflow Padrão de Bônus"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>

              {/* Adicionar Aprovador */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Aprovador - Nível {currentLevel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Buscar Aprovador</Label>
                    <Input
                      placeholder="Digite o nome do funcionário..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Aprovador</Label>
                      <Select
                        value={selectedEmployee?.toString()}
                        onValueChange={(value) => setSelectedEmployee(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingEmployees ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : (
                            employees?.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Função</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Gestor</SelectItem>
                          <SelectItem value="hr">RH</SelectItem>
                          <SelectItem value="hr_manager">Gerente RH</SelectItem>
                          <SelectItem value="director">Diretor de Gente</SelectItem>
                          <SelectItem value="finance">Financeiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddApprover}
                    variant="outline"
                    className="w-full"
                    disabled={currentLevel > 5}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Nível {currentLevel}
                  </Button>

                  {currentLevel > 5 && (
                    <p className="text-sm text-red-600">Máximo de 5 níveis de aprovação</p>
                  )}
                </CardContent>
              </Card>

              {/* Visualização do Workflow */}
              {selectedApprovers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fluxo de Aprovação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedApprovers.map((approver: any, index: number) => (
                        <div key={approver.level}>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F39200] text-white font-bold">
                              {approver.level}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{approver.approverName}</p>
                              <p className="text-sm text-gray-600">{getRoleLabel(approver.role)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveApprover(approver.level)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                          {index < selectedApprovers.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={createWorkflowMutation.isPending}
                  className="bg-[#F39200] hover:bg-[#d67e00]"
                >
                  {createWorkflowMutation.isPending ? "Criando..." : "Criar Workflow"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Workflows */}
      <div className="grid gap-6">
        {workflows && workflows.length > 0 ? (
          workflows.map((workflow: any) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-[#F39200]" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription>
                      {workflow.approvers?.length || 0} níveis de aprovação
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {workflow.isActive && (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      disabled={deleteWorkflowMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {workflow.approvers?.map((approver: any, index: number) => (
                    <div key={approver.level} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F39200] text-white text-xs font-bold">
                          {approver.level}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{approver.approverName}</p>
                          <p className="text-xs text-gray-600">{getRoleLabel(approver.role)}</p>
                        </div>
                      </div>
                      {index < (workflow.approvers?.length || 0) - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">Nenhum workflow configurado</p>
              <p className="text-sm text-gray-500">
                Crie seu primeiro workflow de aprovação de bônus
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
