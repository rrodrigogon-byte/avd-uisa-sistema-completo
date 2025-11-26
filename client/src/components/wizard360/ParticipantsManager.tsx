import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Trash2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

export interface Participant {
  employeeId: number;
  name: string;
  role: 'self' | 'peer' | 'subordinate' | 'manager';
}

export interface ParticipantsData {
  participants: Participant[];
}

interface ParticipantsManagerProps {
  data: ParticipantsData;
  onChange: (data: ParticipantsData) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const roleLabels = {
  self: 'Autoavaliação',
  peer: 'Par',
  subordinate: 'Subordinado',
  manager: 'Gestor'
};

const roleColors = {
  self: 'bg-blue-100 text-blue-800',
  peer: 'bg-green-100 text-green-800',
  subordinate: 'bg-purple-100 text-purple-800',
  manager: 'bg-orange-100 text-orange-800'
};

export default function ParticipantsManager({ 
  data, 
  onChange, 
  onBack, 
  onSubmit,
  isSubmitting 
}: ParticipantsManagerProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<Participant['role']>('peer');

  const {
    search,
    setSearch,
    employees,
    isLoading
  } = useEmployeeSearch();

  const availableEmployees = useMemo(() => {
    if (!employees) return [];
    const participantIds = new Set(data.participants.map(p => p.employeeId));
    return employees.filter((emp: { id: number }) => !participantIds.has(emp.id));
  }, [employees, data.participants]);

  const handleAddParticipant = () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }

    const employeeData = employees?.find((e: { id: number }) => e.id === parseInt(selectedEmployeeId));
    if (!employeeData) return;

    const newParticipant: Participant = {
      employeeId: employeeData.id,
      name: employeeData.name,
      role: selectedRole
    };

    onChange({
      participants: [...data.participants, newParticipant]
    });

    setSelectedEmployeeId("");
    toast.success(`${employeeData.name} adicionado como ${roleLabels[selectedRole]}`);
  };

  const handleRemoveParticipant = (employeeId: number) => {
    onChange({
      participants: data.participants.filter(p => p.employeeId !== employeeId)
    });
    toast.success("Participante removido");
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (data.participants.length === 0) {
      toast.error("Adicione pelo menos um participante");
      return;
    }

    const hasSelf = data.participants.some(p => p.role === 'self');
    if (!hasSelf) {
      toast.error("É necessário incluir pelo menos um participante com autoavaliação");
      return;
    }

    onSubmit();
  };

  const participantsByRole = useMemo(() => {
    return {
      self: data.participants.filter(p => p.role === 'self'),
      peer: data.participants.filter(p => p.role === 'peer'),
      subordinate: data.participants.filter(p => p.role === 'subordinate'),
      manager: data.participants.filter(p => p.role === 'manager')
    };
  }, [data.participants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Carregando colaboradores...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Participante
          </CardTitle>
          <CardDescription>
            Selecione colaboradores e defina seus papéis na avaliação 360°
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaboradores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Colaborador</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((emp: { id: number; name: string; positionTitle?: string | null }) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name} {emp.positionTitle && `- ${emp.positionTitle}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Papel na Avaliação</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as Participant['role'])}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Autoavaliação</SelectItem>
                  <SelectItem value="peer">Par (Colega)</SelectItem>
                  <SelectItem value="subordinate">Subordinado</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="button" 
            onClick={handleAddParticipant}
            className="w-full"
            disabled={!selectedEmployeeId}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Participante
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes Adicionados ({data.participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.participants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum participante adicionado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(participantsByRole).map(([role, participants]) => {
                if (participants.length === 0) return null;
                
                return (
                  <div key={role}>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge className={roleColors[role as Participant['role']]}>
                        {roleLabels[role as Participant['role']]}
                      </Badge>
                      <span className="text-muted-foreground">({participants.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {participants.map(participant => (
                        <div 
                          key={participant.employeeId}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <span className="font-medium">{participant.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParticipant(participant.employeeId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Voltar
        </Button>
        <Button type="submit" disabled={data.participants.length === 0 || isSubmitting}>
          {isSubmitting ? "Criando Ciclo..." : "Criar Ciclo 360°"}
        </Button>
      </div>
    </form>
  );
}
