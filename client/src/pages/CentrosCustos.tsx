import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, Plus, Pencil, Trash2, Search, Filter } from "lucide-react";

interface CostCenter {
  id: number;
  code: string;
  name: string;
  description: string | null;
  departmentId: number | null;
  departmentName: string | null;
  budget: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CentrosCustos() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    departmentId: undefined as number | undefined,
    budget: "",
    active: true,
  });

  const utils = trpc.useUtils();
  const { data: costCenters, isLoading } = trpc.organization.costCenters.list.useQuery({
    search,
    departmentId: departmentFilter,
  });
  const { data: departments } = trpc.organization.departments.list.useQuery(undefined);

  const createMutation = trpc.organization.costCenters.create.useMutation({
    onSuccess: () => {
      toast.success("Centro de custos criado com sucesso!");
      utils.organization.costCenters.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao criar centro de custos: ${error.message}`);
    },
  });

  const updateMutation = trpc.organization.costCenters.update.useMutation({
    onSuccess: () => {
      toast.success("Centro de custos atualizado com sucesso!");
      utils.organization.costCenters.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar centro de custos: ${error.message}`);
    },
  });

  const deleteMutation = trpc.organization.costCenters.delete.useMutation({
    onSuccess: () => {
      toast.success("Centro de custos excluído com sucesso!");
      utils.organization.costCenters.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir centro de custos: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setEditingCostCenter(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      departmentId: undefined,
      budget: "",
      active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || "",
      departmentId: costCenter.departmentId || undefined,
      budget: costCenter.budget || "",
      active: costCenter.active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCostCenter(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      departmentId: undefined,
      budget: "",
      active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const budgetNumber = formData.budget ? parseFloat(formData.budget) : undefined;

    if (editingCostCenter) {
      updateMutation.mutate({
        id: editingCostCenter.id,
        ...formData,
        budget: budgetNumber,
      });
    } else {
      createMutation.mutate({
        ...formData,
        budget: budgetNumber,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este centro de custos?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    const num = parseFloat(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Centros de Custos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os centros de custos da organização
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Centro de Custos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Centros de Custos Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os centros de custos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={departmentFilter?.toString() || "all"}
                onValueChange={(value) =>
                  setDepartmentFilter(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger className="w-[250px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por departamento" />
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

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando centros de custos...
              </div>
            ) : !costCenters || costCenters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum centro de custos encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters.map((cc: any) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-mono">{cc.code}</TableCell>
                      <TableCell className="font-medium">{cc.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cc.departmentName || "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(cc.budget)}</TableCell>
                      <TableCell>
                        {cc.active ? (
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
                            onClick={() => openEditDialog(cc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cc.id)}
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
                {editingCostCenter ? "Editar Centro de Custos" : "Novo Centro de Custos"}
              </DialogTitle>
              <DialogDescription>
                {editingCostCenter
                  ? "Atualize as informações do centro de custos"
                  : "Preencha os dados do novo centro de custos"}
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
                    placeholder="Ex: CC001, CC-TI-01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Infraestrutura TI"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={formData.departmentId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value ? parseInt(value) : undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
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
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o propósito deste centro de custos"
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
                  <Label htmlFor="active">Centro de custos ativo</Label>
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
                  {editingCostCenter ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
