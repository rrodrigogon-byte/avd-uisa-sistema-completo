import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Employees() {
  const { user, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Queries
  const { data: employees, isLoading, refetch } = trpc.employee.list.useQuery();
  const { data: departments } = trpc.department.list.useQuery();
  const { data: positions } = trpc.position.list.useQuery();

  // Mutations
  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar funcionário");
    },
  });

  const updateMutation = trpc.employee.update.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar funcionário");
    },
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success("Funcionário removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover funcionário");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      employeeId: formData.get("employeeId") as string,
      departmentId: parseInt(formData.get("departmentId") as string),
      positionId: parseInt(formData.get("positionId") as string),
      supervisorId: formData.get("supervisorId") ? parseInt(formData.get("supervisorId") as string) : undefined,
      hireDate: new Date(formData.get("hireDate") as string),
      phone: formData.get("phone") as string || undefined,
      location: formData.get("location") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: selectedEmployee.id,
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      employeeId: formData.get("employeeId") as string,
      departmentId: parseInt(formData.get("departmentId") as string),
      positionId: parseInt(formData.get("positionId") as string),
      supervisorId: formData.get("supervisorId") ? parseInt(formData.get("supervisorId") as string) : undefined,
      phone: formData.get("phone") as string || undefined,
      location: formData.get("location") as string || undefined,
      status: formData.get("status") as "active" | "on_leave" | "terminated",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este funcionário?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const getDepartmentName = (departmentId: number) => {
    return departments?.find(d => d.id === departmentId)?.name || "N/A";
  };

  const getPositionTitle = (positionId: number) => {
    return positions?.find(p => p.id === positionId)?.title || "N/A";
  };

  const getSupervisorName = (supervisorId: number | null) => {
    if (!supervisorId) return "Nenhum";
    return employees?.find(e => e.id === supervisorId)?.fullName || "N/A";
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Faça login para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionários da organização
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Funcionários
          </CardTitle>
          <CardDescription>
            {employees?.length || 0} funcionário(s) ativo(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === "admin" && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeId}</TableCell>
                    <TableCell>{employee.fullName}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {getDepartmentName(employee.departmentId)}
                      </div>
                    </TableCell>
                    <TableCell>{getPositionTitle(employee.positionId)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getSupervisorName(employee.supervisorId)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.status === "active"
                            ? "bg-green-100 text-green-800"
                            : employee.status === "on_leave"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {employee.status === "active" ? "Ativo" : employee.status === "on_leave" ? "Afastado" : "Desligado"}
                      </span>
                    </TableCell>
                    {user?.role === "admin" && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Matrícula *</Label>
                  <Input id="employeeId" name="employeeId" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Data de Admissão *</Label>
                  <Input id="hireDate" name="hireDate" type="date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Departamento *</Label>
                  <Select name="departmentId" required>
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
                  <Label htmlFor="positionId">Cargo *</Label>
                  <Select name="positionId" required>
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
                <Label htmlFor="supervisorId">Supervisor</Label>
                <Select name="supervisorId">
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.fullName} - {emp.employeeId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input id="location" name="location" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize os dados do funcionário
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Nome Completo *</Label>
                    <Input
                      id="edit-fullName"
                      name="fullName"
                      defaultValue={selectedEmployee.fullName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      defaultValue={selectedEmployee.email}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeId">Matrícula *</Label>
                    <Input
                      id="edit-employeeId"
                      name="employeeId"
                      defaultValue={selectedEmployee.employeeId}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select name="status" defaultValue={selectedEmployee.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="on_leave">Afastado</SelectItem>
                        <SelectItem value="terminated">Desligado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-departmentId">Departamento *</Label>
                    <Select
                      name="departmentId"
                      defaultValue={selectedEmployee.departmentId.toString()}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="edit-positionId">Cargo *</Label>
                    <Select
                      name="positionId"
                      defaultValue={selectedEmployee.positionId.toString()}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  <Label htmlFor="edit-supervisorId">Supervisor</Label>
                  <Select
                    name="supervisorId"
                    defaultValue={selectedEmployee.supervisorId?.toString() || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {employees
                        ?.filter((emp) => emp.id !== selectedEmployee.id)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.fullName} - {emp.employeeId}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      defaultValue={selectedEmployee.phone || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Localização</Label>
                    <Input
                      id="edit-location"
                      name="location"
                      defaultValue={selectedEmployee.location || ""}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedEmployee(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
