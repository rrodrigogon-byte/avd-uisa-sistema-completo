import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

interface PactSectionProps {
  pdiId: number | null;
  details: any;
}

export default function PactSection({ pdiId, details }: PactSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pactForm, setPactForm] = useState({
    mentorId: details?.mentorId || undefined,
    sponsorId1: details?.sponsorId1 || undefined,
    sponsorId2: details?.sponsorId2 || undefined,
    guardianId: details?.guardianId || undefined,
  });

  const utils = trpc.useUtils();
  const { data: employees } = trpc.employees.list.useQuery();
  
  const updatePactMutation = trpc.pdiIntelligent.updatePact.useMutation({
    onSuccess: () => {
      toast.success("Pacto de Desenvolvimento atualizado!");
      utils.pdiIntelligent.getById.invalidate({ id: pdiId! });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pacto: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!pdiId) return;
    updatePactMutation.mutate({
      planId: pdiId,
      ...pactForm,
    });
  };

  const handleCancel = () => {
    setPactForm({
      mentorId: details?.mentorId || undefined,
      sponsorId1: details?.sponsorId1 || undefined,
      sponsorId2: details?.sponsorId2 || undefined,
      guardianId: details?.guardianId || undefined,
    });
    setIsEditing(false);
  };

  const getEmployeeName = (id: number | undefined) => {
    if (!id) return "Não definido";
    const employee = employees?.find((e) => e.employee.id === id);
    return employee?.employee.name || `Funcionário #${id}`;
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Editar Pacto
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Mentor/Gestor Direto</p>
            <p className="text-base font-semibold">{getEmployeeName(details?.mentorId)}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Sponsor 1</p>
            <p className="text-base font-semibold">{getEmployeeName(details?.sponsorId1)}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Sponsor 2</p>
            <p className="text-base font-semibold">{getEmployeeName(details?.sponsorId2)}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Guardião (DGC)</p>
            <p className="text-base font-semibold">{getEmployeeName(details?.guardianId)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleCancel} size="sm" variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} size="sm" disabled={updatePactMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updatePactMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mentorId">Mentor/Gestor Direto</Label>
          <Select
            value={pactForm.mentorId?.toString() || ""}
            onValueChange={(value) => setPactForm({ ...pactForm, mentorId: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger id="mentorId">
              <SelectValue placeholder="Selecione o mentor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                  {emp.employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sponsorId1">Sponsor 1</Label>
          <Select
            value={pactForm.sponsorId1?.toString() || ""}
            onValueChange={(value) => setPactForm({ ...pactForm, sponsorId1: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger id="sponsorId1">
              <SelectValue placeholder="Selecione o sponsor 1" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                  {emp.employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sponsorId2">Sponsor 2</Label>
          <Select
            value={pactForm.sponsorId2?.toString() || ""}
            onValueChange={(value) => setPactForm({ ...pactForm, sponsorId2: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger id="sponsorId2">
              <SelectValue placeholder="Selecione o sponsor 2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                  {emp.employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="guardianId">Guardião (DGC)</Label>
          <Select
            value={pactForm.guardianId?.toString() || ""}
            onValueChange={(value) => setPactForm({ ...pactForm, guardianId: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger id="guardianId">
              <SelectValue placeholder="Selecione o guardião" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                  {emp.employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
