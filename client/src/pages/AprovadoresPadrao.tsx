import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  UserCheck,
  Settings,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AprovadoresPadrao() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<any>(null);

  // Form states
  const [level, setLevel] = useState("2");
  const [levelName, setLevelName] = useState("");
  const [approverId, setApproverId] = useState("");
  const [approverName, setApproverName] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [approverRole, setApproverRole] = useState("");
  const [workflowType, setWorkflowType] = useState("all");
  const [isActive, setIsActive] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const [isRequired, setIsRequired] = useState(true);

  // Queries
  const { data: approvers, isLoading, refetch } = trpc.defaultApprovers.list.useQuery({});
  const { data: employees } = trpc.employees.list.useQuery();

  // Mutations
  const createApprover = trpc.defaultApprovers.create.useMutation({
    onSuccess: () => {
      toast.success("Aprovador padrão criado com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar aprovador: ${error.message}`);
    },
  });

  const updateApprover = trpc.defaultApprovers.update.useMutation({
    onSuccess: () => {
      toast.success("Aprovador atualizado com sucesso!");
      setShowEditDialog(false);
      setSelectedApprover(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar aprovador: ${error.message}`);
    },
  });

  const deleteApprover = trpc.defaultApprovers.delete.useMutation({
    onSuccess: () => {
      toast.success("Aprovador removido com sucesso!");
      setShowDeleteDialog(false);
      setSelectedApprover(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao remover aprovador: ${error.message}`);
    },
  });

  const toggleActive = trpc.defaultApprovers.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const initializeApprovers = trpc.defaultApprovers.initializeDefaultApprovers.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.message} (${data.count} aprovadores)`);
      } else {
        toast.info(data.message);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao inicializar aprovadores: ${error.message}`);
    },
  });

  const resetForm = () => {
    setLevel("2");
    setLevelName("");
    setApproverId("");
    setApproverName("");
    setApproverEmail("");
    setApproverRole("");
    setWorkflowType("all");
    setIsActive(true);
    setCanSkip(false);
    setIsRequired(true);
  };

  const handleCreate = () => {
    if (!approverId || !approverName || !levelName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createApprover.mutate({
      level: parseInt(level),
      levelName,
      approverId: parseInt(approverId),
      approverName,
      approverEmail: approverEmail || undefined,
      approverRole: approverRole || undefined,
      workflowType: workflowType as any,
      isActive,
      canSkip,
      isRequired,
      notifyOnSubmission: true,
      notifyOnApproval: true,
      notifyOnRejection: true,
    });
  };

  const handleEdit = (approver: any) => {
    setSelectedApprover(approver);
    setLevel(approver.level.toString());
    setLevelName(approver.levelName);
    setApproverId(approver.approverId.toString());
    setApproverName(approver.approverName);
    setApproverEmail(approver.approverEmail || "");
    setApproverRole(approver.approverRole || "");
    setWorkflowType(approver.workflowType);
    setIsActive(approver.isActive);
    setCanSkip(approver.canSkip);
    setIsRequired(approver.isRequired);
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedApprover) return;

    updateApprover.mutate({
      id: selectedApprover.id,
      level: parseInt(level),
      levelName,
      approverId: parseInt(approverId),
      approverName,
      approverEmail: approverEmail || undefined,
      approverRole: approverRole || undefined,
      workflowType: workflowType as any,
      isActive,
      canSkip,
      isRequired,
    });
  };

  const handleDelete = (approver: any) => {
    setSelectedApprover(approver);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedApprover) return;
    deleteApprover.mutate({ id: selectedApprover.id });
  };

  const handleToggleActive = (approverId: number, currentStatus: boolean) => {
    toggleActive.mutate({
      id: approverId,
      isActive: !currentStatus,
    });
  };

  const getLevelBadge = (level: number) => {
    const colors = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-green-100 text-green-800",
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[level as keyof typeof colors] || ""}>{`Nível ${level}`}</Badge>;
  };

  const getWorkflowTypeBadge = (type: string) => {
    const labels = {
      job_description: "Descrição de Cargos",
      pdi: "PDI",
      bonus: "Bônus",
      evaluation: "Avaliações",
      all: "Todos",
    };
    return <Badge variant="outline">{labels[type as keyof typeof labels] || type}</Badge>;
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-primary" />
            Aprovadores Padrão
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os aprovadores padrão para cada nível do workflow de aprovações
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => initializeApprovers.mutate()}
            disabled={initializeApprovers.isPending}
          >
            <Settings className="h-4 w-4 mr-2" />
            {initializeApprovers.isPending ? "Inicializando..." : "Inicializar UISA"}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aprovador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Aprovador Padrão</DialogTitle>
                <DialogDescription>
                  Configure um novo aprovador padrão para o workflow
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Nível */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Nível *</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nível 1 - Líder Imediato</SelectItem>
                        <SelectItem value="2">Nível 2 - RH C&S</SelectItem>
                        <SelectItem value="3">Nível 3 - Gerente RH</SelectItem>
                        <SelectItem value="4">Nível 4 - Diretor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="levelName">Nome do Nível *</Label>
                    <Input
                      id="levelName"
                      value={levelName}
                      onChange={(e) => setLevelName(e.target.value)}
                      placeholder="Ex: RH Cargos e Salários"
                    />
                  </div>
                </div>

                {/* Funcionário */}
                <div className="space-y-2">
                  <Label htmlFor="employee">Funcionário Aprovador *</Label>
                  <Select
                    value={approverId}
                    onValueChange={(value) => {
                      setApproverId(value);
                      const emp = employees?.find((e) => e.id.toString() === value);
                      if (emp) {
                        setApproverName(emp.name || "");
                        setApproverEmail(emp.email || "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.chapa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cargo/Função */}
                <div className="space-y-2">
                  <Label htmlFor="approverRole">Cargo/Função</Label>
                  <Input
                    id="approverRole"
                    value={approverRole}
                    onChange={(e) => setApproverRole(e.target.value)}
                    placeholder="Ex: Analista de RH"
                  />
                </div>

                {/* Tipo de Workflow */}
                <div className="space-y-2">
                  <Label htmlFor="workflowType">Tipo de Workflow</Label>
                  <Select value={workflowType} onValueChange={setWorkflowType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Workflows</SelectItem>
                      <SelectItem value="job_description">Descrição de Cargos</SelectItem>
                      <SelectItem value="pdi">PDI</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="evaluation">Avaliações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Configurações */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Ativo</Label>
                    <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isRequired">Obrigatório</Label>
                    <Switch id="isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canSkip">Pode Pular</Label>
                    <Switch id="canSkip" checked={canSkip} onCheckedChange={setCanSkip} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createApprover.isPending}>
                  {createApprover.isPending ? "Criando..." : "Criar Aprovador"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Workflow de Aprovações - 4 Níveis
          </CardTitle>
          <CardDescription>
            Configure os aprovadores padrão para cada nível. O sistema utilizará estes aprovadores
            automaticamente ao criar novos processos de aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-1">Nível 1</div>
              <div className="text-sm text-muted-foreground">Líder Imediato</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-1">Nível 2</div>
              <div className="text-sm text-muted-foreground">RH Cargos e Salários</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-1">Nível 3</div>
              <div className="text-sm text-muted-foreground">Gerente de RH</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-1">Nível 4</div>
              <div className="text-sm text-muted-foreground">Diretor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Aprovadores */}
      <Card>
        <CardHeader>
          <CardTitle>Aprovadores Configurados</CardTitle>
          <CardDescription>
            {approvers?.length || 0} aprovador(es) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !approvers || approvers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aprovador configurado. Clique em "Inicializar UISA" para criar os aprovadores
              padrão.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nível</TableHead>
                  <TableHead>Nome do Nível</TableHead>
                  <TableHead>Aprovador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvers.map((approver) => (
                  <TableRow key={approver.id}>
                    <TableCell>{getLevelBadge(approver.level)}</TableCell>
                    <TableCell className="font-medium">{approver.levelName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{approver.approverName}</div>
                        <div className="text-sm text-muted-foreground">{approver.approverEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{approver.approverRole || "-"}</TableCell>
                    <TableCell>{getWorkflowTypeBadge(approver.workflowType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {approver.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(approver.id, approver.isActive)}
                        >
                          {approver.isActive ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(approver)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(approver)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Aprovador Padrão</DialogTitle>
            <DialogDescription>Atualize as informações do aprovador</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mesmo formulário do criar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">Nível *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nível 1 - Líder Imediato</SelectItem>
                    <SelectItem value="2">Nível 2 - RH C&S</SelectItem>
                    <SelectItem value="3">Nível 3 - Gerente RH</SelectItem>
                    <SelectItem value="4">Nível 4 - Diretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-levelName">Nome do Nível *</Label>
                <Input
                  id="edit-levelName"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  placeholder="Ex: RH Cargos e Salários"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-employee">Funcionário Aprovador *</Label>
              <Select
                value={approverId}
                onValueChange={(value) => {
                  setApproverId(value);
                  const emp = employees?.find((e) => e.id.toString() === value);
                  if (emp) {
                    setApproverName(emp.name || "");
                    setApproverEmail(emp.email || "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name} - {emp.chapa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-approverRole">Cargo/Função</Label>
              <Input
                id="edit-approverRole"
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value)}
                placeholder="Ex: Analista de RH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-workflowType">Tipo de Workflow</Label>
              <Select value={workflowType} onValueChange={setWorkflowType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Workflows</SelectItem>
                  <SelectItem value="job_description">Descrição de Cargos</SelectItem>
                  <SelectItem value="pdi">PDI</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="evaluation">Avaliações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">Ativo</Label>
                <Switch id="edit-isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isRequired">Obrigatório</Label>
                <Switch id="edit-isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-canSkip">Pode Pular</Label>
                <Switch id="edit-canSkip" checked={canSkip} onCheckedChange={setCanSkip} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedApprover(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateApprover.isPending}>
              {updateApprover.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o aprovador "{selectedApprover?.approverName}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedApprover(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteApprover.isPending}
            >
              {deleteApprover.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
