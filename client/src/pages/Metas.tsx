import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { downloadICS } from "@/lib/generateICS";
import { AlertCircle, Calendar, CalendarPlus, CheckCircle2, Clock, Plus, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Metas() {
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  
  const { data: goals, refetch } = trpc.goals.list.useQuery({});
  const { data: employee } = trpc.employees.getCurrent.useQuery();
  const createGoal = trpc.goals.create.useMutation();
  const updateProgress = trpc.goals.updateProgress.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "individual" as "individual" | "equipe" | "organizacional",
    category: "quantitativa" as "quantitativa" | "qualitativa",
    targetValue: "",
    unit: "",
    weight: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    linkedToPLR: false,
    linkedToBonus: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee?.id) {
      toast.error("Colaborador não encontrado");
      return;
    }

    try {
      await createGoal.mutateAsync({
        ...formData,
        employeeId: employee.id,
        cycleId: 1, // TODO: pegar ciclo ativo
        weight: Number(formData.weight),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });

      toast.success("Meta criada com sucesso!");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "individual",
        category: "quantitativa",
        targetValue: "",
        unit: "",
        weight: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        linkedToPLR: false,
        linkedToBonus: false,
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao criar meta");
      console.error(error);
    }
  };

  const handleUpdateProgress = async (goalId: number, currentValue: string, progress: number) => {
    try {
      await updateProgress.mutateAsync({
        id: goalId,
        currentValue,
        progress,
      });
      toast.success("Progresso atualizado!");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar progresso");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      rascunho: { variant: "secondary", label: "Rascunho", icon: Clock },
      pendente_aprovacao: { variant: "outline", label: "Pendente", icon: AlertCircle },
      em_andamento: { variant: "default", label: "Em Andamento", icon: TrendingUp },
      concluida: { variant: "default", label: "Concluída", icon: CheckCircle2 },
      cancelada: { variant: "destructive", label: "Cancelada", icon: AlertCircle },
    };

    const config = variants[status] || variants.rascunho;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const activeGoals = goals?.filter(g => g.status === "em_andamento") || [];
  const draftGoals = goals?.filter(g => g.status === "rascunho") || [];
  const completedGoals = goals?.filter(g => g.status === "concluida") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8" />
              Minhas Metas
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe suas metas de desempenho
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Defina uma nova meta de desempenho para acompanhar seu progresso
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Meta *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Aumentar vendas em 20%"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva os detalhes da meta..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as "individual" | "equipe" | "organizacional" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="equipe">Equipe</SelectItem>
                        <SelectItem value="departamento">Departamento</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as "quantitativa" | "qualitativa" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quantitativa">Quantitativa</SelectItem>
                        <SelectItem value="qualitativa">Qualitativa</SelectItem>
                        <SelectItem value="projeto">Projeto</SelectItem>
                        <SelectItem value="comportamental">Comportamental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Valor Alvo *</Label>
                    <Input
                      id="targetValue"
                      required
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade *</Label>
                    <Input
                      id="unit"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="vendas, %, projetos..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (1-5)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Fim *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Vinculações</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.linkedToPLR}
                        onChange={(e) => setFormData({ ...formData, linkedToPLR: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Vinculada a PLR</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.linkedToBonus}
                        onChange={(e) => setFormData({ ...formData, linkedToBonus: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Vinculada a Bônus</span>
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createGoal.isPending}>
                    {createGoal.isPending ? "Criando..." : "Criar Meta"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGoals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rascunhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftGoals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGoals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma meta cadastrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando sua primeira meta de desempenho
                </p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals?.map((goal: any) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {goal.title}
                        {getStatusBadge(goal.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {goal.linkedToPLR && (
                        <Badge variant="default">PLR</Badge>
                      )}
                      {goal.linkedToBonus && (
                        <Badge variant="secondary">Bônus</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium capitalize">{goal.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Categoria</p>
                      <p className="font-medium capitalize">{goal.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meta</p>
                      <p className="font-medium">
                        {goal.targetValue} {goal.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Atual</p>
                      <p className="font-medium">
                        {goal.currentValue || "0"} {goal.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(goal.startDate).toLocaleDateString("pt-BR")}
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(goal.endDate).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="ml-auto">
                      Peso: <span className="font-semibold">{goal.weight}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        downloadICS(
                          {
                            title: `Meta: ${goal.title}`,
                            description: `Tipo: ${goal.type}\nValor Alvo: ${goal.targetValue} ${goal.unit}\nPeso: ${goal.weight}`,
                            startDate: new Date(goal.startDate),
                            endDate: new Date(goal.endDate),
                          },
                          `meta-${goal.id}-${goal.title.replace(/\s+/g, "-").toLowerCase()}`
                        );
                        toast.success("Evento adicionado ao calendário!");
                      }}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Adicionar ao Calendário
                    </Button>
                  </div>

                  {goal.status === "em_andamento" && (
                    <div className="flex gap-2 pt-2">
                      <Input
                        type="text"
                        placeholder="Valor atual"
                        className="max-w-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value;
                            if (value) {
                              const newProgress = Math.round((Number(value) / Number(goal.targetValue)) * 100);
                              handleUpdateProgress(goal.id, value, newProgress);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                      <Button variant="outline" size="sm">
                        Atualizar Progresso
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
