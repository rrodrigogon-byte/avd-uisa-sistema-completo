import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil, Trash2, Download, Upload, Users, UserPlus, Filter, RefreshCw } from "lucide-react";

/**
 * Página de Gestão Completa de Funcionários
 * CRUD completo com filtros, busca e validações
 */

export default function FuncionariosGerenciar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("ativo");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    employeeCode: "",
    name: "",
    email: "",
    cpf: "",
    birthDate: "",
    hireDate: "",
    departmentId: "",
    positionId: "",
    managerId: "",
    salary: "",
    phone: "",
    address: "",
  });

  // Queries
  const { data: employees, isLoading: loadingEmployees, refetch } = trpc.employees.list.useQuery({
    search: searchTerm,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
  });

  const { data: departments } = trpc.employees.getDepartments.useQuery();
  const { data: positions } = trpc.positions.list.useQuery();

  // Mutations
  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("Funcionário deletado com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const toggleStatusMutation = trpc.employees.toggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Funcionário ${data.newStatus === "ativo" ? "ativado" : "desativado"} com sucesso!`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      employeeCode: "",
      name: "",
      email: "",
      cpf: "",
      birthDate: "",
      hireDate: "",
      departmentId: "",
      positionId: "",
      managerId: "",
      salary: "",
      phone: "",
      address: "",
    });
    setSelectedEmployee(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.employeeCode || !formData.hireDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.departmentId || !formData.positionId) {
      toast.error("Selecione departamento e cargo");
      return;
    }

    // Validar que positionId é um número válido
    const positionIdNum = parseInt(formData.positionId);
    if (isNaN(positionIdNum) || positionIdNum <= 0) {
      toast.error("Selecione um cargo válido");
      return;
    }

    // Validar departmentId
    const departmentIdNum = parseInt(formData.departmentId);
    if (isNaN(departmentIdNum) || departmentIdNum <= 0) {
      toast.error("Selecione um departamento válido");
      return;
    }

    // Validar e formatar datas como strings ISO (YYYY-MM-DD)
    const birthDateStr = formData.birthDate && formData.birthDate.trim() !== "" 
      ? formData.birthDate.split('T')[0] // Garantir formato YYYY-MM-DD
      : undefined;
    
    const hireDateStr = formData.hireDate.split('T')[0]; // Garantir formato YYYY-MM-DD

    createMutation.mutate({
      employeeCode: formData.employeeCode,
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf && formData.cpf.trim() !== "" ? formData.cpf : undefined,
      birthDate: birthDateStr,
      hireDate: hireDateStr,
      departmentId: departmentIdNum,
      positionId: positionIdNum,
      managerId: formData.managerId && formData.managerId.trim() !== "" ? parseInt(formData.managerId) : undefined,
      salary: formData.salary && formData.salary.trim() !== "" ? Math.round(parseFloat(formData.salary) * 100) : undefined,
      phone: formData.phone && formData.phone.trim() !== "" ? formData.phone : undefined,
      address: formData.address && formData.address.trim() !== "" ? formData.address : undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedEmployee) return;

    if (!formData.name || !formData.email) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    updateMutation.mutate({
      id: selectedEmployee.employee.id,
      name: formData.name,
      email: formData.email,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
      managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
      salary: formData.salary ? Math.round(parseFloat(formData.salary) * 100) : undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
    });
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeCode: employee.employee.employeeCode || employee.employee.chapa || "",
      name: employee.employee.name || "",
      email: employee.employee.email || "",
      cpf: employee.employee.cpf || "",
      birthDate: employee.employee.birthDate ? new Date(employee.employee.birthDate).toISOString().split('T')[0] : "",
      hireDate: employee.employee.hireDate ? new Date(employee.employee.hireDate).toISOString().split('T')[0] : "",
      departmentId: employee.employee.departmentId?.toString() || employee.departmentId?.toString() || "",
      positionId: employee.employee.positionId?.toString() || employee.positionId?.toString() || "",
      managerId: employee.employee.managerId?.toString() || "",
      salary: employee.employee.salary ? (employee.employee.salary / 100).toFixed(2) : "",
      phone: employee.employee.phone || "",
      address: employee.employee.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (employee: any) => {
    toggleStatusMutation.mutate({ id: employee.employee.id });
  };

  const handleDelete = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteMutation.mutate({ id: selectedEmployee.employee.id });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ativo: { variant: "default", label: "Ativo" },
      afastado: { variant: "secondary", label: "Afastado" },
      desligado: { variant: "destructive", label: "Desligado" },
    };
    const config = variants[status] || variants.ativo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(salary / 100);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Funcionários</h1>
            <p className="text-muted-foreground mt-1">
              Cadastro, edição e controle completo de colaboradores
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, email, CPF..."
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
                    <SelectItem value="all">Todos</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={() => refetch()} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Funcionários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários ({employees?.length || 0})
            </CardTitle>
            <CardDescription>
              Lista completa de colaboradores cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i: any) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : employees && employees.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp: any) => (
                      <TableRow key={emp.employee.id}>
                        <TableCell className="font-mono text-sm">
                          {emp.employee.employeeCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.employee.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.employee.email}
                        </TableCell>
                        <TableCell>
                          {emp.department?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {emp.position?.title || "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(emp.employee.hireDate)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatSalary(emp.employee.salary)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(emp)}
                            className={emp.employee.status === "ativo" ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}
                          >
                            {emp.employee.status === "ativo" ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-400">Inativo</Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(emp)}
                              title="Editar funcionário"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(emp)}
                              title="Deletar funcionário permanentemente"
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
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum funcionário encontrado</h3>
                <p className="text-muted-foreground mt-2">
                  Ajuste os filtros ou cadastre um novo funcionário
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criação */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
              <DialogDescription>
                Preencha os dados do colaborador. Campos com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Matrícula *</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  placeholder="Ex: 001234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Departamento *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionId">Cargo *</Label>
                <Select value={formData.positionId} onValueChange={(value) => setFormData({ ...formData, positionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((pos: any) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Funcionário</DialogTitle>
              <DialogDescription>
                Atualize os dados do colaborador
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label>Matrícula</Label>
                <Input value={formData.employeeCode} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Departamento</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-positionId">Cargo</Label>
                <Select value={formData.positionId} onValueChange={(value) => setFormData({ ...formData, positionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((pos: any) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salário (R$)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar o funcionário <strong>{selectedEmployee?.employee.name}</strong>?
                <br /><br />
                Esta ação irá alterar o status para "Desligado" e o colaborador não poderá mais acessar o sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedEmployee(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Desativação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
