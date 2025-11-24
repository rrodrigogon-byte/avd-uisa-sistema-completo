import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Search } from "lucide-react";

interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  managerId: number | null;
  parentId: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Departamentos() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
  });

  const utils = trpc.useUtils();
  const { data: departments, isLoading } = trpc.organization.departments.list.useQuery({ search });

  const createMutation = trpc.organization.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Departamento criado com sucesso!");
      utils.organization.departments.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao criar departamento: ${error.message}`);
    },
  });

  const updateMutation = trpc.organization.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Departamento atualizado com sucesso!");
      utils.organization.departments.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar departamento: ${error.message}`);
    },
  });

  const deleteMutation = trpc.organization.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Departamento excluído com sucesso!");
      utils.organization.departments.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir departamento: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      description: department.description || "",
      active: department.active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDepartment(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDepartment) {
      updateMutation.mutate({
        id: editingDepartment.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este departamento?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Departamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a estrutura organizacional da empresa
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Departamento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Departamentos Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os departamentos da organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando departamentos...
              </div>
            ) : !departments || departments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum departamento encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-mono">{dept.code}</TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.description || "-"}
                      </TableCell>
                      <TableCell>
                        {dept.active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(dept)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dept.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Editar Departamento" : "Novo Departamento"}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? "Atualize as informações do departamento"
                  : "Preencha os dados do novo departamento"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: TI, RH, FIN"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Tecnologia da Informação"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva as responsabilidades do departamento"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="active">Departamento ativo</Label>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingDepartment ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
