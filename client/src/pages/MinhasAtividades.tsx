import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Clock, Calendar, BarChart3 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function MinhasAtividades() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"reuniao" | "analise" | "planejamento" | "execucao" | "suporte" | "outros">("execucao");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Mock employeeId - em produção viria do contexto de autenticação
  const employeeId = 1;

  const { data: activities, refetch } = trpc.jobDescriptions.getActivities.useQuery({ employeeId });

  const addActivityMutation = trpc.jobDescriptions.addActivity.useMutation({
    onSuccess: () => {
      toast.success("Atividade registrada com sucesso!");
      setDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao registrar atividade: " + error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("execucao");
    setActivityDate(new Date().toISOString().split("T")[0]);
    setStartTime("09:00");
    setEndTime("10:00");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    addActivityMutation.mutate({
      employeeId,
      title,
      description,
      category,
      activityDate,
      startTime,
      endTime,
    });
  };

  const getCategoryBadge = (cat: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      reuniao: { label: "Reunião", color: "bg-blue-500" },
      analise: { label: "Análise", color: "bg-purple-500" },
      planejamento: { label: "Planejamento", color: "bg-green-500" },
      execucao: { label: "Execução", color: "bg-orange-500" },
      suporte: { label: "Suporte", color: "bg-yellow-500" },
      outros: { label: "Outros", color: "bg-gray-500" },
    };
    const { label, color } = categoryMap[cat] || { label: cat, color: "bg-gray-500" };
    return <Badge className={color}>{label}</Badge>;
  };

  const calculateTotalHours = () => {
    if (!activities) return 0;
    const total = activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
    return (total / 60).toFixed(1);
  };

  const getCategoryDistribution = () => {
    if (!activities) return [];
    const distribution: Record<string, number> = {};
    activities.forEach((act) => {
      distribution[act.category] = (distribution[act.category] || 0) + (act.durationMinutes || 0);
    });
    return Object.entries(distribution).map(([category, minutes]) => ({
      category,
      hours: (minutes / 60).toFixed(1),
    }));
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minhas Atividades</h1>
            <p className="text-muted-foreground">Registre suas tarefas e atividades diárias</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Total de Horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{calculateTotalHours()}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Atividades Registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activities?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Categoria Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {getCategoryDistribution()[0]?.category || "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição por Categoria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribuição de Tempo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {getCategoryDistribution().map((item) => (
                <div key={item.category} className="flex justify-between items-center border p-3 rounded">
                  {getCategoryBadge(item.category)}
                  <span className="font-bold">{item.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Atividades */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{new Date(activity.activityDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{getCategoryBadge(activity.category)}</TableCell>
                    <TableCell>
                      {activity.startTime} - {activity.endTime}
                    </TableCell>
                    <TableCell>{((activity.durationMinutes || 0) / 60).toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
                {(!activities || activities.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma atividade registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de Nova Atividade */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nova Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da Atividade *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião de planejamento mensal"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a atividade realizada..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="analise">Análise</SelectItem>
                      <SelectItem value="planejamento">Planejamento</SelectItem>
                      <SelectItem value="execucao">Execução</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Início *</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hora Fim *</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={addActivityMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Atividade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
