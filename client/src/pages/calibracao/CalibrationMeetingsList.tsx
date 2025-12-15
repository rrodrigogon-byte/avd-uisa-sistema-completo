import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Calendar, Users, Video, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalibrationMeetingsList() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<number>();
  const [selectedDepartment, setSelectedDepartment] = useState<number>();
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

  const { data: meetings, refetch } = trpc.calibrationMeeting.listMeetings.useQuery({});
  const { data: cycles } = trpc.evaluationCycles.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMeeting = trpc.calibrationMeeting.createMeeting.useMutation({
    onSuccess: (data) => {
      toast.success("Reunião criada com sucesso!");
      setIsCreating(false);
      refetch();
      navigate(`/calibracao/reuniao/${data.sessionId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar reunião: ${error.message}`);
    },
  });

  const handleCreateMeeting = () => {
    if (!selectedCycle || !scheduledDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMeeting.mutate({
      cycleId: selectedCycle,
      departmentId: selectedDepartment,
      scheduledDate,
      participantIds: selectedParticipants,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" }> = {
      agendada: { label: "Agendada", variant: "secondary" },
      em_andamento: { label: "Em Andamento", variant: "default" },
      concluida: { label: "Concluída", variant: "secondary" },
    };

    const config = variants[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Reuniões de Calibração</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie reuniões de calibração em tempo real
            </p>
          </div>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reunião
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Reunião de Calibração</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Ciclo de Avaliação *</Label>
                  <Select
                    value={selectedCycle?.toString()}
                    onValueChange={(v) => setSelectedCycle(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles?.map((cycle: any) => (
                        <SelectItem key={cycle.id} value={cycle.id.toString()}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Departamento (Opcional)</Label>
                  <Select
                    value={selectedDepartment?.toString()}
                    onValueChange={(v) => setSelectedDepartment(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os departamentos" />
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
                  <Label>Data e Hora *</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Participantes</Label>
                  <Select
                    onValueChange={(v) => {
                      const id = parseInt(v);
                      if (!selectedParticipants.includes(id)) {
                        setSelectedParticipants([...selectedParticipants, id]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar participante" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                          {emp.employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedParticipants.map((id: any) => {
                        const emp = employees?.find((e) => e.employee.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              setSelectedParticipants(
                                selectedParticipants.filter((p) => p !== id)
                              )
                            }
                          >
                            {emp?.employee.name} ×
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMeeting} disabled={createMeeting.isPending}>
                    {createMeeting.isPending ? "Criando..." : "Criar Reunião"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {meetings?.map((meeting: any) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Reunião #{meeting.id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {meeting.scheduledDate && format(new Date(meeting.scheduledDate), "PPP 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {getStatusBadge(meeting.status)}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ciclo #{meeting.cycleId}
                  </div>
                  {meeting.departmentId && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Departamento #{meeting.departmentId}
                    </div>
                  )}
                  {meeting.startedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Iniciada em {format(new Date(meeting.startedAt), "HH:mm")}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`/calibracao/reuniao/${meeting.id}`)}
                  variant={meeting.status === "em_andamento" ? "default" : "outline"}
                >
                  {meeting.status === "em_andamento" ? "Entrar na Reunião" : "Ver Detalhes"}
                </Button>
              </CardContent>
            </Card>
          ))}

          {meetings?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma reunião agendada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira reunião de calibração para começar
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Reunião
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
