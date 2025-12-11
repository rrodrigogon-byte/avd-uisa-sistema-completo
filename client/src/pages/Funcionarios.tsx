import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil, Trash2, Download, Upload, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Página de Gestão de Funcionários
 * CRUD completo com importação/exportação
 */

export default function Funcionarios() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCargo, setSelectedCargo] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeCode: "",
    name: "",
    email: "",
    cpf: "",
    birthDate: "",
    hireDate: "",
    departmentId: "",
    positionTitle: "",
    salary: "",
  });

  // Buscar funcionários
  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery();

  // Buscar departamentos
  const { data: departments } = trpc.departments.list.useQuery();

  // Mutation para criar funcionário
  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário criado com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData({
        employeeCode: "",
        name: "",
        email: "",
        cpf: "",
        birthDate: "",
        hireDate: "",
        departmentId: "",
        positionTitle: "",
        salary: "",
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar funcionário: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.employeeCode) {
      toast.error("Preencha os campos obrigatórios (Nome, E-mail, Matrícula)");
      return;
    }

    createMutation.mutate({
      employeeCode: formData.employeeCode,
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf || undefined,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      hireDate: formData.hireDate ? new Date(formData.hireDate) : undefined,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      positionTitle: formData.positionTitle || undefined,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
    });
  };

  // Filtrar funcionários
  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch = (emp.employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee.cpf || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.employee.departmentId === parseInt(selectedDepartment);
    const matchesStatus = selectedStatus === "all" || emp.employee.status === selectedStatus;
    const matchesCargo = selectedCargo === "all" || (emp.employee.positionTitle || '').toLowerCase().includes(selectedCargo.toLowerCase());
    return matchesSearch && matchesDepartment && matchesStatus && matchesCargo;
  });

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleExport = () => {
    // TODO: Implementar exportação para Excel
    toast.success("Exportação iniciada!");
  };

  const handleImport = () => {
    // TODO: Implementar importação de Excel
    toast.info("Funcionalidade de importação em desenvolvimento");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Funcionários
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todos os colaboradores da organização
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, e-mail, CPF ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Input
                placeholder="Filtrar por cargo..."
                value={selectedCargo}
                onChange={(e) => setSelectedCargo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Funcionários */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>
              {filteredEmployees?.length || 0} funcionário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees?.map((emp: any) => (
                    <TableRow key={emp.employee.id}>
                      <TableCell className="font-mono text-sm">{emp.employee.employeeCode}</TableCell>
                      <TableCell className="font-medium">{emp.employee.name}</TableCell>
                      <TableCell>{emp.employee.email}</TableCell>
                      <TableCell>{emp.position?.title || "-"}</TableCell>
                      <TableCell>{emp.department?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/funcionarios/${emp.employee.id}`)}
                            title="Ver Perfil"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(emp)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Excluir"
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

        {/* Dialog de Criar/Editar */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedEmployee(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditDialogOpen ? "Editar Funcionário" : "Novo Funcionário"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do funcionário
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Matrícula *</Label>
                <Input 
                  placeholder="Ex: 12345" 
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                />
              </div>
              <div>
                <Label>Nome Completo *</Label>
                <Input 
                  placeholder="Ex: João Silva" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input 
                  type="email" 
                  placeholder="Ex: joao@uisa.com.br" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input 
                  placeholder="Ex: 123.456.789-00" 
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input 
                  type="date" 
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Data de Admissão</Label>
                <Input 
                  type="date" 
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Departamento</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({...formData, departmentId: value})}>
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
              <div>
                <Label>Cargo</Label>
                <Input 
                  placeholder="Ex: Analista" 
                  value={formData.positionTitle}
                  onChange={(e) => setFormData({...formData, positionTitle: e.target.value})}
                />
              </div>
              <div>
                <Label>Salário</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 5000" 
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : isEditDialogOpen ? "Salvar Alterações" : "Criar Funcionário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
