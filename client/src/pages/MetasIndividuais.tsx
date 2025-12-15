import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  Loader2,
  ArrowRight,
  BarChart3
} from "lucide-react";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  pendente_aprovacao: "Pendente Aprovação",
  aprovada: "Aprovada",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
  atrasada: "Atrasada",
};

const statusColors: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente_aprovacao: "bg-yellow-100 text-yellow-800",
  aprovada: "bg-blue-100 text-blue-800",
  em_andamento: "bg-purple-100 text-purple-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  atrasada: "bg-orange-100 text-orange-800",
};

const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800",
};

interface GoalFormData {
  title: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  targetValue: string;
  unit: string;
  weight: string;
  priority: string;
  startDate: string;
  dueDate: string;
  employeeId: string;
  departmentGoalId: string;
}

const initialFormData: GoalFormData = {
  title: "",
  description: "",
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timeBound: "",
  targetValue: "",
  unit: "",
  weight: "10",
  priority: "media",
  startDate: "",
  dueDate: "",
  employeeId: "",
  departmentGoalId: "",
};

export default function MetasIndividuais() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(initialFormData);
  const [progressValue, setProgressValue] = useState("");
  const [progressComment, setProgressComment] = useState("");

  // Queries
  const { data: employees } = trpc.employees.list.useQuery({ activeOnly: true, limit: 500 });
  const { data: departmentGoals } = trpc.departmentGoals.list.useQuery({ limit: 100 });
  const { data: goals, isLoading: loadingGoals, refetch: refetchGoals } = trpc.individualGoals.list.useQuery({
    employeeId: selectedEmployeeId || undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 100,
  });
  const { data: stats } = trpc.individualGoals.getStats.useQuery({
    employeeId: selectedEmployeeId || undefined,
  });

  // Mutations
  const createMutation = trpc.individualGoals.create.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      refetchGoals();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const updateProgressMutation = trpc.individualGoals.updateProgress.useMutation({
    onSuccess: (data) => {
      toast.success(`Progresso atualizado! Novo percentual: ${data.newPercent}%`);
      setIsProgressDialogOpen(false);
      setProgressValue("");
      setProgressComment("");
      refetchGoals();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const approveMutation = trpc.individualGoals.approve.useMutation({
    onSuccess: () => {
      toast.success("Meta aprovada!");
      refetchGoals();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteMutation = trpc.individualGoals.delete.useMutation({
    onSuccess: () => {
      toast.success("Meta excluída!");
      refetchGoals();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const handleCreate = () => {
    if (!formData.title || !formData.employeeId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      employeeId: parseInt(formData.employeeId),
      departmentGoalId: formData.departmentGoalId ? parseInt(formData.departmentGoalId) : undefined,
      title: formData.title,
      description: formData.description,
      specific: formData.specific,
      measurable: formData.measurable,
      achievable: formData.achievable,
      relevant: formData.relevant,
      timeBound: formData.timeBound,
      targetValue: formData.targetValue ? parseInt(formData.targetValue) : undefined,
      unit: formData.unit,
      weight: parseInt(formData.weight),
      priority: formData.priority as any,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
    });
  };

  const handleUpdateProgress = () => {
    if (!selectedGoalId || !progressValue) {
      toast.error("Informe o valor atual");
      return;
    }

    updateProgressMutation.mutate({
      goalId: selectedGoalId,
      newValue: parseInt(progressValue),
      comment: progressComment,
    });
  };

  const openProgressDialog = (goalId: number) => {
    setSelectedGoalId(goalId);
    setIsProgressDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Metas Individuais</h1>
            <p className="text-muted-foreground">
              Gerencie metas individuais dos colaboradores com critérios SMART
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta Individual</DialogTitle>
                <DialogDescription>
                  Defina uma meta SMART para o colaborador
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="smart">Critérios SMART</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basico" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Colaborador *</Label>
                      <Select 
                        value={formData.employeeId} 
                        onValueChange={(v) => setFormData({...formData, employeeId: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Meta Departamental (opcional)</Label>
                      <Select 
                        value={formData.departmentGoalId} 
                        onValueChange={(v) => setFormData({...formData, departmentGoalId: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular a meta departamental..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {departmentGoals?.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id.toString()}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Título da Meta *</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Aumentar vendas em 20%"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descreva a meta em detalhes..."
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Valor Alvo</Label>
                      <Input 
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                        placeholder="100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input 
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        placeholder="%, R$, unidades..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Peso</Label>
                      <Input 
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(v) => setFormData({...formData, priority: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input 
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input 
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="smart" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="font-bold text-primary">S</span> - Específico
                      </Label>
                      <Textarea 
                        value={formData.specific}
                        onChange={(e) => setFormData({...formData, specific: e.target.value})}
                        placeholder="O que exatamente será alcançado? Seja específico e claro."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="font-bold text-primary">M</span> - Mensurável
                      </Label>
                      <Textarea 
                        value={formData.measurable}
                        onChange={(e) => setFormData({...formData, measurable: e.target.value})}
                        placeholder="Como o progresso será medido? Quais indicadores serão usados?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="font-bold text-primary">A</span> - Alcançável
                      </Label>
                      <Textarea 
                        value={formData.achievable}
                        onChange={(e) => setFormData({...formData, achievable: e.target.value})}
                        placeholder="A meta é realista? Quais recursos estão disponíveis?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="font-bold text-primary">R</span> - Relevante
                      </Label>
                      <Textarea 
                        value={formData.relevant}
                        onChange={(e) => setFormData({...formData, relevant: e.target.value})}
                        placeholder="Por que esta meta é importante? Como se alinha aos objetivos?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="font-bold text-primary">T</span> - Temporal
                      </Label>
                      <Textarea 
                        value={formData.timeBound}
                        onChange={(e) => setFormData({...formData, timeBound: e.target.value})}
                        placeholder="Qual é o prazo? Existem marcos intermediários?"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Meta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <Select 
                  value={selectedEmployeeId?.toString() || "all"} 
                  onValueChange={(v) => setSelectedEmployeeId(v === "all" ? null : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os colaboradores</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                    <p className="text-2xl font-bold">{stats.concluidas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                    <p className="text-2xl font-bold">{stats.emAndamento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasadas</p>
                    <p className="text-2xl font-bold">{stats.atrasadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Progresso Médio</p>
                    <p className="text-2xl font-bold">{stats.progressoMedioPonderado}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Metas */}
        <div className="space-y-4">
          {loadingGoals ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : goals?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma meta encontrada</h3>
                <p className="text-muted-foreground mt-1">
                  Crie uma nova meta para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            goals?.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <Badge className={statusColors[goal.status]}>
                          {statusLabels[goal.status]}
                        </Badge>
                        <Badge className={priorityColors[goal.priority]}>
                          {priorityLabels[goal.priority]}
                        </Badge>
                      </div>
                      
                      {goal.description && (
                        <p className="text-muted-foreground">{goal.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {goal.employeeName}
                        </span>
                        {goal.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(goal.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          Peso: {goal.weight}
                        </span>
                      </div>
                      
                      {goal.targetValue && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso: {goal.currentValue || 0} / {goal.targetValue} {goal.unit}</span>
                            <span className="font-medium">{goal.progressPercent}%</span>
                          </div>
                          <Progress value={goal.progressPercent} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {goal.status === "pendente_aprovacao" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveMutation.mutate({ id: goal.id })}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Aprovar
                        </Button>
                      )}
                      
                      {(goal.status === "aprovada" || goal.status === "em_andamento") && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openProgressDialog(goal.id)}
                        >
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Atualizar
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta meta?")) {
                            deleteMutation.mutate({ id: goal.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Atualização de Progresso */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Progresso</DialogTitle>
              <DialogDescription>
                Informe o valor atual da meta
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Valor Atual</Label>
                <Input 
                  type="number"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  placeholder="Ex: 75"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Comentário (opcional)</Label>
                <Textarea 
                  value={progressComment}
                  onChange={(e) => setProgressComment(e.target.value)}
                  placeholder="Descreva o progresso realizado..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateProgress} disabled={updateProgressMutation.isPending}>
                {updateProgressMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
