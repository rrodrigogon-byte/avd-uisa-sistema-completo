import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditPersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    departmentId: number | null;
    positionId: number | null;
    hireDate: Date | null;
  };
  onSuccess: () => void;
}

export default function EditPersonalInfoDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditPersonalInfoDialogProps) {
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email || "",
    phone: employee.phone || "",
    departmentId: employee.departmentId || 0,
    positionId: employee.positionId || 0,
    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split("T")[0] : "",
  });

  const { data: departments } = trpc.departments.list.useQuery();
  const { data: positions } = trpc.positionsManagement.list.useQuery();

  const updateMutation = trpc.employeeProfile.updatePersonalInfo.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados com sucesso!");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar dados");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      employeeId: employee.id,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      departmentId: formData.departmentId || undefined,
      positionId: formData.positionId || undefined,
      hireDate: formData.hireDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Dados Pessoais</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select
              value={formData.departmentId?.toString() || ""}
              onValueChange={(value) => setFormData({ ...formData, departmentId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o departamento" />
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
            <Label htmlFor="position">Cargo</Label>
            <Select
              value={formData.positionId?.toString() || ""}
              onValueChange={(value) => setFormData({ ...formData, positionId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
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

          <div className="space-y-2">
            <Label htmlFor="hireDate">Data de Admissão</Label>
            <Input
              id="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
