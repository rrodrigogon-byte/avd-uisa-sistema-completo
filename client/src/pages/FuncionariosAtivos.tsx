import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil, Trash2, Download, Upload, Users } from "lucide-react";
import ListSkeleton from "@/components/ListSkeleton";

/**
 * Página de Gestão de Funcionários Ativos UISA
 * Formulário completo com todos os campos necessários
 */

export default function FuncionariosAtivos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form state
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
    hierarchyLevel: "",
    phone: "",
    address: "",
  });

  // Queries
  const utils = trpc.useUtils();
  const { data: employees, isLoading } = trpc.employees.list.useQuery(undefined);
  const { data: departments } = trpc.departments.list.useQuery(undefined);
  const { data: positions } = trpc.positions.list.useQuery(undefined);

  // Mutations
  const updateEmployeeMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      utils.employees.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Filtrar funcionários
  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch =
      (emp.employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || emp.employee.departmentId === parseInt(selectedDepartment);
    return matchesSearch && matchesDepartment && emp.employee.status === "ativo";
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
      hierarchyLevel: "",
      phone: "",
      address: "",
    });
    setSelectedEmployee(null);
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeCode: employee.employee.employeeCode || "",
      name: employee.employee.name || "",
      email: employee.employee.email || "",
      cpf: employee.employee.cpf || "",
      birthDate: employee.employee.birthDate ? employee.employee.birthDate.toString().split("T")[0] : "",
      hireDate: employee.employee.hireDate ? employee.employee.hireDate.toString().split("T")[0] : "",
      departmentId: employee.employee.departmentId?.toString() || "",
      positionId: employee.employee.positionId?.toString() || "",
      managerId: employee.employee.managerId?.toString() || "",
      salary: employee.employee.salary ? (employee.employee.salary / 100).toFixed(2) : "",
      hierarchyLevel: employee.employee.hierarchyLevel || "",
      phone: employee.employee.phone || "",
      address: employee.employee.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedEmployee) return;

    updateEmployeeMutation.mutate({
      id: selectedEmployee.employee.id,
      employeeCode: formData.employeeCode,
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf || undefined,
      birthDate: formData.birthDate || undefined,
      hireDate: formData.hireDate,
      departmentId: parseInt(formData.departmentId),
      positionId: parseInt(formData.positionId),
      managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
      salary: formData.salary ? Math.round(parseFloat(formData.salary) * 100) : undefined,
      hierarchyLevel: (formData.hierarchyLevel as "diretoria" | "gerencia" | "coordenacao" | "supervisao" | "operacional" | undefined) || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
    });
  };

  const getHierarchyBadge = (level: string | null) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      diretoria: { label: "Diretoria", variant: "default" },
      gerencia: { label: "Gerência", variant: "default" },
      coordenacao: { label: "Coordenação", variant: "secondary" },
      supervisao: { label: "Supervisão", variant: "secondary" },
      operacional: { label: "Operacional", variant: "outline" },
    };
    const config = level ? badges[level] : null;
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : <span className="text-muted-foreground">N/A</span>;
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(salary / 100);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Funcionários Ativos UISA
            </h1>
            <p className="text-muted-foreground mt-2">Base completa de colaboradores ativos do Grupo UISA</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredEmployees?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Idade Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">0 anos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio de Casa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">0 anos</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por Nome ou Chapa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-64">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
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
              </div>
              <div className="w-48">
                <Select defaultValue="nome">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome (A-Z)</SelectItem>
                    <SelectItem value="admissao">Data de Admissão</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>
              {filteredEmployees?.length || 0} funcionários encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chapa</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees?.map((emp: any) => (
                      <TableRow key={emp.employee.id}>
                        <TableCell className="font-medium">{emp.employee.employeeCode || "N/A"}</TableCell>
                        <TableCell>{emp.employee.name}</TableCell>
                        <TableCell>{emp.position?.title || "N/A"}</TableCell>
                        <TableCell>{emp.department?.name || "N/A"}</TableCell>
                        <TableCell>{getHierarchyBadge(emp.employee.hierarchyLevel)}</TableCell>
                        <TableCell>{formatSalary(emp.employee.salary)}</TableCell>
                        <TableCell>{formatDate(emp.employee.hireDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>✏️ Editar Funcionário</DialogTitle>
              <DialogDescription>Atualize as informações do colaborador</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              {/* Nome Completo */}
              <div className="col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ABNER PEREIRA DE CARVALHO NETO"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="abner.neto@uisa.com.br"
                />
              </div>

              {/* Chapa */}
              <div>
                <Label htmlFor="employeeCode">Chapa</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  placeholder="Ex: 12345"
                />
              </div>

              {/* Cargo */}
              <div>
                <Label htmlFor="positionId">Cargo *</Label>
                <Select value={formData.positionId} onValueChange={(value) => setFormData({ ...formData, positionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
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

              {/* Departamento */}
              <div>
                <Label htmlFor="departmentId">Departamento *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
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

              {/* Data de Admissão */}
              <div>
                <Label htmlFor="hireDate">Data de Admissão *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>

              {/* Salário */}
              <div>
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="5000.00"
                />
              </div>

              {/* Nível Hierárquico */}
              <div>
                <Label htmlFor="hierarchyLevel">Nível</Label>
                <Select value={formData.hierarchyLevel} onValueChange={(value) => setFormData({ ...formData, hierarchyLevel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diretoria">Diretoria</SelectItem>
                    <SelectItem value="gerencia">Gerência</SelectItem>
                    <SelectItem value="coordenacao">Coordenação</SelectItem>
                    <SelectItem value="supervisao">Supervisão</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                {updateEmployeeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                💾 Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
