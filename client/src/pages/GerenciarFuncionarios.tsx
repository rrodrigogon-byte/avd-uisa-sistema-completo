import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search,
  UserX,
  UserCheck,
  ArrowRightLeft,
  History,
  Filter,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Página de Gerenciamento de Funcionários
 * 
 * Funcionalidades:
 * - Busca e filtros avançados
 * - Movimentação individual e em lote
 * - Exclusão lógica (soft delete)
 * - Histórico de movimentações
 * - Ajustes de hierarquia
 */

export default function GerenciarFuncionarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  
  // Dialogs
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState<any>(null);
  
  // Form states
  const [moveForm, setMoveForm] = useState({
    departmentId: "",
    managerId: "",
    positionId: "",
    reason: "",
  });
  const [deactivateForm, setDeactivateForm] = useState({
    reason: "",
  });

  // Queries
  const { data: employees, isLoading, refetch } = trpc.employeeManagement.searchEmployees.useQuery({
    search: searchTerm || undefined,
    departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
    managerId: selectedManager ? parseInt(selectedManager) : undefined,
    includeInactive,
  });

  const { data: departments } = trpc.employeeManagement.listDepartments.useQuery();
  const { data: positions } = trpc.employeeManagement.listPositions.useQuery();
  const { data: managers } = trpc.employeeManagement.listManagers.useQuery();

  // Mutations
  const moveEmployee = trpc.employeeManagement.moveEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionário movimentado com sucesso!");
      setMoveDialogOpen(false);
      setMoveForm({ departmentId: "", managerId: "", positionId: "", reason: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao movimentar funcionário: ${error.message}`);
    },
  });

  const batchMoveEmployees = trpc.employeeManagement.batchMoveEmployees.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} funcionários movimentados com sucesso!`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} funcionários falharam: ${result.errors.join(", ")}`);
      }
      setSelectedEmployees([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na movimentação em lote: ${error.message}`);
    },
  });

  const deactivateEmployee = trpc.employeeManagement.deactivateEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionário desativado com sucesso!");
      setDeactivateDialogOpen(false);
      setDeactivateForm({ reason: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar funcionário: ${error.message}`);
    },
  });

  const reactivateEmployee = trpc.employeeManagement.reactivateEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionário reativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao reativar funcionário: ${error.message}`);
    },
  });

  const batchDeactivateEmployees = trpc.employeeManagement.batchDeactivateEmployees.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} funcionários desativados com sucesso!`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} funcionários falharam`);
      }
      setSelectedEmployees([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na desativação em lote: ${error.message}`);
    },
  });

  const { data: movementHistory } = trpc.employeeManagement.getEmployeeMovementHistory.useQuery(
    { employeeId: selectedEmployeeForAction?.id || 0 },
    { enabled: !!selectedEmployeeForAction && historyDialogOpen }
  );

  // Handlers
  const handleSelectEmployee = (employeeId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees?.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees?.map((e) => e.id) || []);
    }
  };

  const handleMoveEmployee = (employee: any) => {
    setSelectedEmployeeForAction(employee);
    setMoveForm({
      departmentId: employee.departmentId?.toString() || "",
      managerId: employee.managerId?.toString() || "",
      positionId: employee.positionId?.toString() || "",
      reason: "",
    });
    setMoveDialogOpen(true);
  };

  const handleDeactivateEmployee = (employee: any) => {
    setSelectedEmployeeForAction(employee);
    setDeactivateDialogOpen(true);
  };

  const handleViewHistory = (employee: any) => {
    setSelectedEmployeeForAction(employee);
    setHistoryDialogOpen(true);
  };

  const handleBatchMove = () => {
    if (selectedEmployees.length === 0) {
      toast.warning("Selecione pelo menos um funcionário");
      return;
    }

    const hasChanges = moveForm.departmentId || moveForm.managerId || moveForm.positionId;
    if (!hasChanges) {
      toast.warning("Especifique pelo menos uma alteração");
      return;
    }

    batchMoveEmployees.mutate({
      employeeIds: selectedEmployees,
      departmentId: moveForm.departmentId ? parseInt(moveForm.departmentId) : undefined,
      managerId: moveForm.managerId ? parseInt(moveForm.managerId) : undefined,
      positionId: moveForm.positionId ? parseInt(moveForm.positionId) : undefined,
      reason: moveForm.reason || undefined,
    });
  };

  const handleBatchDeactivate = () => {
    if (selectedEmployees.length === 0) {
      toast.warning("Selecione pelo menos um funcionário");
      return;
    }

    if (!confirm(`Desativar ${selectedEmployees.length} funcionários?`)) {
      return;
    }

    batchDeactivateEmployees.mutate({
      employeeIds: selectedEmployees,
      reason: deactivateForm.reason || undefined,
    });
  };

  const submitMoveEmployee = () => {
    if (!selectedEmployeeForAction) return;

    const hasChanges = moveForm.departmentId || moveForm.managerId || moveForm.positionId;
    if (!hasChanges) {
      toast.warning("Especifique pelo menos uma alteração");
      return;
    }

    moveEmployee.mutate({
      employeeId: selectedEmployeeForAction.id,
      departmentId: moveForm.departmentId ? parseInt(moveForm.departmentId) : undefined,
      managerId: moveForm.managerId ? parseInt(moveForm.managerId) : undefined,
      positionId: moveForm.positionId ? parseInt(moveForm.positionId) : undefined,
      reason: moveForm.reason || undefined,
    });
  };

  const submitDeactivateEmployee = () => {
    if (!selectedEmployeeForAction) return;

    deactivateEmployee.mutate({
      employeeId: selectedEmployeeForAction.id,
      reason: deactivateForm.reason || undefined,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Funcionários</h1>
          <p className="text-muted-foreground">
            Movimentação, exclusão e histórico de funcionários
          </p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Funcionários</TabsTrigger>
          <TabsTrigger value="batch">Ações em Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, email ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gestor</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {managers?.map((mgr) => (
                        <SelectItem key={mgr.id} value={mgr.id.toString()}>
                          {mgr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Opções</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="includeInactive"
                      checked={includeInactive}
                      onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
                    />
                    <label
                      htmlFor="includeInactive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Incluir inativos
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                {selectedEmployees.length > 0 && (
                  <Badge variant="secondary">
                    {selectedEmployees.length} selecionado(s)
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando funcionários...
                </div>
              ) : !employees || employees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum funcionário encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEmployees.length === employees.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gestor</TableHead>
                      <TableHead>Gerência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={() => handleSelectEmployee(employee.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email || "-"}</TableCell>
                        <TableCell>{employee.managerName || "-"}</TableCell>
                        <TableCell>{employee.gerencia || "-"}</TableCell>
                        <TableCell>
                          {employee.active ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveEmployee(employee)}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(employee)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          {employee.active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateEmployee(employee)}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                reactivateEmployee.mutate({
                                  employeeId: employee.id,
                                  reason: "Reativação via interface",
                                })
                              }
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
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

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações em Lote</CardTitle>
              <CardDescription>
                Selecione funcionários na aba "Lista" para realizar ações em lote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário selecionado. Volte para a aba "Lista" e selecione os
                  funcionários desejados.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">
                        Movimentação em Lote ({selectedEmployees.length} selecionados)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Novo Departamento</Label>
                          <Select
                            value={moveForm.departmentId}
                            onValueChange={(value) =>
                              setMoveForm({ ...moveForm, departmentId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Não alterar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Não alterar</SelectItem>
                              {departments?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Novo Gestor</Label>
                          <Select
                            value={moveForm.managerId}
                            onValueChange={(value) =>
                              setMoveForm({ ...moveForm, managerId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Não alterar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Não alterar</SelectItem>
                              {managers?.map((mgr) => (
                                <SelectItem key={mgr.id} value={mgr.id.toString()}>
                                  {mgr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Novo Cargo</Label>
                          <Select
                            value={moveForm.positionId}
                            onValueChange={(value) =>
                              setMoveForm({ ...moveForm, positionId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Não alterar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Não alterar</SelectItem>
                              {positions?.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id.toString()}>
                                  {pos.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Motivo da Movimentação</Label>
                        <Textarea
                          placeholder="Descreva o motivo da movimentação..."
                          value={moveForm.reason}
                          onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
                        />
                      </div>

                      <Button onClick={handleBatchMove} className="mt-4">
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Movimentar Selecionados
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2 text-destructive">
                        Desativação em Lote ({selectedEmployees.length} selecionados)
                      </h3>
                      <div className="space-y-2">
                        <Label>Motivo da Desativação</Label>
                        <Textarea
                          placeholder="Descreva o motivo da desativação..."
                          value={deactivateForm.reason}
                          onChange={(e) =>
                            setDeactivateForm({ ...deactivateForm, reason: e.target.value })
                          }
                        />
                      </div>

                      <Button
                        onClick={handleBatchDeactivate}
                        variant="destructive"
                        className="mt-4"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desativar Selecionados
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Movimentação Individual */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimentar Funcionário</DialogTitle>
            <DialogDescription>
              {selectedEmployeeForAction?.name} - {selectedEmployeeForAction?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={moveForm.departmentId}
                  onValueChange={(value) => setMoveForm({ ...moveForm, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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

              <div className="space-y-2">
                <Label>Gestor</Label>
                <Select
                  value={moveForm.managerId}
                  onValueChange={(value) => setMoveForm({ ...moveForm, managerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers?.map((mgr) => (
                      <SelectItem key={mgr.id} value={mgr.id.toString()}>
                        {mgr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Cargo</Label>
                <Select
                  value={moveForm.positionId}
                  onValueChange={(value) => setMoveForm({ ...moveForm, positionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Descreva o motivo da movimentação..."
                value={moveForm.reason}
                onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitMoveEmployee} disabled={moveEmployee.isPending}>
              {moveEmployee.isPending ? "Movimentando..." : "Confirmar Movimentação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Desativação */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Funcionário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar {selectedEmployeeForAction?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Descreva o motivo da desativação..."
                value={deactivateForm.reason}
                onChange={(e) => setDeactivateForm({ ...deactivateForm, reason: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={submitDeactivateEmployee}
              disabled={deactivateEmployee.isPending}
            >
              {deactivateEmployee.isPending ? "Desativando..." : "Confirmar Desativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>
              {selectedEmployeeForAction?.name} - {selectedEmployeeForAction?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!movementHistory || movementHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação registrada
              </div>
            ) : (
              <div className="space-y-3">
                {movementHistory.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm">{log.description}</p>
                          {log.changes && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <pre className="bg-muted p-2 rounded">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{log.userName}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
