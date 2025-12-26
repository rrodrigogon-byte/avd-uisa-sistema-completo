import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Scale, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Globe,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  History,
  Loader2,
  PieChart
} from "lucide-react";

const scopeLabels: Record<string, string> = {
  global: "Global",
  departamento: "Departamento",
  cargo: "Cargo",
};

const scopeIcons: Record<string, React.ReactNode> = {
  global: <Globe className="h-4 w-4" />,
  departamento: <Building2 className="h-4 w-4" />,
  cargo: <Briefcase className="h-4 w-4" />,
};

interface WeightFormData {
  name: string;
  description: string;
  scope: string;
  departmentId: string;
  positionId: string;
  competenciesWeight: number;
  individualGoalsWeight: number;
  departmentGoalsWeight: number;
  pirWeight: number;
  feedbackWeight: number;
  behaviorWeight: number;
  validFrom: string;
  validUntil: string;
}

const initialFormData: WeightFormData = {
  name: "",
  description: "",
  scope: "global",
  departmentId: "",
  positionId: "",
  competenciesWeight: 40,
  individualGoalsWeight: 30,
  departmentGoalsWeight: 15,
  pirWeight: 15,
  feedbackWeight: 0,
  behaviorWeight: 0,
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: "",
};

export default function PesosAvaliacao() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [formData, setFormData] = useState<WeightFormData>(initialFormData);
  const [scopeFilter, setScopeFilter] = useState<string>("all");

  // Queries
  const { data: departments } = trpc.departments.list.useQuery({});
  const { data: positions } = trpc.positions.list.useQuery({ activeOnly: true });
  const { data: configs, isLoading: loadingConfigs, refetch: refetchConfigs } = trpc.evaluationWeights.list.useQuery({
    scope: scopeFilter !== "all" ? scopeFilter as any : undefined,
  });
  const { data: history } = trpc.evaluationWeights.getHistory.useQuery(
    { configId: selectedConfigId! },
    { enabled: !!selectedConfigId && isHistoryDialogOpen }
  );

  // Mutations
  const createMutation = trpc.evaluationWeights.create.useMutation({
    onSuccess: () => {
      toast.success("Configuração criada com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      refetchConfigs();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const updateMutation = trpc.evaluationWeights.update.useMutation({
    onSuccess: () => {
      toast.success("Configuração atualizada!");
      refetchConfigs();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deactivateMutation = trpc.evaluationWeights.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Configuração desativada!");
      refetchConfigs();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteMutation = trpc.evaluationWeights.delete.useMutation({
    onSuccess: () => {
      toast.success("Configuração excluída!");
      refetchConfigs();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  // Calcular total dos pesos
  const totalWeight = formData.competenciesWeight + formData.individualGoalsWeight + 
                     formData.departmentGoalsWeight + formData.pirWeight + 
                     formData.feedbackWeight + formData.behaviorWeight;

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Informe o nome da configuração");
      return;
    }

    if (totalWeight !== 100) {
      toast.error(`A soma dos pesos deve ser 100%. Atual: ${totalWeight}%`);
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      scope: formData.scope as any,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
      competenciesWeight: formData.competenciesWeight,
      individualGoalsWeight: formData.individualGoalsWeight,
      departmentGoalsWeight: formData.departmentGoalsWeight,
      pirWeight: formData.pirWeight,
      feedbackWeight: formData.feedbackWeight,
      behaviorWeight: formData.behaviorWeight,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil || undefined,
    });
  };

  const openHistoryDialog = (configId: number) => {
    setSelectedConfigId(configId);
    setIsHistoryDialogOpen(true);
  };

  // Componente de visualização de peso
  const WeightBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pesos de Avaliação</h1>
            <p className="text-muted-foreground">
              Configure os pesos de cada componente no cálculo da avaliação de desempenho
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Configuração
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Configuração de Pesos</DialogTitle>
                <DialogDescription>
                  Defina os pesos de cada componente da avaliação de desempenho
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Configuração *</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Configuração Padrão 2025"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descreva o propósito desta configuração..."
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Escopo</Label>
                      <Select 
                        value={formData.scope} 
                        onValueChange={(v) => setFormData({...formData, scope: v, departmentId: "", positionId: ""})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global (Toda Organização)</SelectItem>
                          <SelectItem value="departamento">Por Departamento</SelectItem>
                          <SelectItem value="cargo">Por Cargo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.scope === "departamento" && (
                      <div className="space-y-2">
                        <Label>Departamento</Label>
                        <Select 
                          value={formData.departmentId} 
                          onValueChange={(v) => setFormData({...formData, departmentId: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
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
                    )}
                    
                    {formData.scope === "cargo" && (
                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Select 
                          value={formData.positionId} 
                          onValueChange={(v) => setFormData({...formData, positionId: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
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
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Válido a partir de</Label>
                      <Input 
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Válido até (opcional)</Label>
                      <Input 
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Configuração de Pesos */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Distribuição de Pesos</h4>
                    <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
                      Total: {totalWeight}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Competências</Label>
                        <span className="text-sm font-medium">{formData.competenciesWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.competenciesWeight]}
                        onValueChange={([v]) => setFormData({...formData, competenciesWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Metas Individuais</Label>
                        <span className="text-sm font-medium">{formData.individualGoalsWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.individualGoalsWeight]}
                        onValueChange={([v]) => setFormData({...formData, individualGoalsWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Metas Departamentais</Label>
                        <span className="text-sm font-medium">{formData.departmentGoalsWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.departmentGoalsWeight]}
                        onValueChange={([v]) => setFormData({...formData, departmentGoalsWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>PIR (Plano Individual de Resultados)</Label>
                        <span className="text-sm font-medium">{formData.pirWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.pirWeight]}
                        onValueChange={([v]) => setFormData({...formData, pirWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Feedback Contínuo</Label>
                        <span className="text-sm font-medium">{formData.feedbackWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.feedbackWeight]}
                        onValueChange={([v]) => setFormData({...formData, feedbackWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Comportamento/Valores</Label>
                        <span className="text-sm font-medium">{formData.behaviorWeight}%</span>
                      </div>
                      <Slider
                        value={[formData.behaviorWeight]}
                        onValueChange={([v]) => setFormData({...formData, behaviorWeight: v})}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                  
                  {totalWeight !== 100 && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">A soma dos pesos deve ser exatamente 100%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || totalWeight !== 100}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Configuração
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Filtrar por escopo:</Label>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="cargo">Cargo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Configurações */}
        <div className="grid gap-4 md:grid-cols-2">
          {loadingConfigs ? (
            <Card className="md:col-span-2">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : configs?.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Scale className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma configuração encontrada</h3>
                <p className="text-muted-foreground mt-1">
                  Crie uma nova configuração de pesos para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            configs?.map((config) => (
              <Card key={config.id} className={`${!config.isActive ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {scopeIcons[config.scope]}
                        {config.name}
                      </CardTitle>
                      <CardDescription>
                        {scopeLabels[config.scope]}
                        {config.departmentName && ` - ${config.departmentName}`}
                        {config.positionTitle && ` - ${config.positionTitle}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.description && (
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <WeightBar label="Competências" value={config.competenciesWeight} color="bg-blue-500" />
                    <WeightBar label="Metas Individuais" value={config.individualGoalsWeight} color="bg-green-500" />
                    <WeightBar label="Metas Departamentais" value={config.departmentGoalsWeight} color="bg-purple-500" />
                    <WeightBar label="PIR" value={config.pirWeight} color="bg-orange-500" />
                    {config.feedbackWeight > 0 && (
                      <WeightBar label="Feedback" value={config.feedbackWeight} color="bg-pink-500" />
                    )}
                    {config.behaviorWeight > 0 && (
                      <WeightBar label="Comportamento" value={config.behaviorWeight} color="bg-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Válido: {new Date(config.validFrom).toLocaleDateString('pt-BR')}
                      {config.validUntil && ` até ${new Date(config.validUntil).toLocaleDateString('pt-BR')}`}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openHistoryDialog(config.id)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      
                      {config.isActive && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Desativar esta configuração?")) {
                              deactivateMutation.mutate({ id: config.id });
                            }
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Excluir esta configuração?")) {
                            deleteMutation.mutate({ id: config.id });
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

        {/* Dialog de Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Alterações</DialogTitle>
              <DialogDescription>
                Veja as alterações feitas nesta configuração
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {history?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma alteração registrada
                </p>
              ) : (
                history?.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Alteração #{history.length - index}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.changedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {item.changeReason && (
                      <p className="text-sm text-muted-foreground">{item.changeReason}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Anterior:</span>
                        <pre className="bg-muted p-2 rounded mt-1">
                          {JSON.stringify(item.previousWeights, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Novo:</span>
                        <pre className="bg-muted p-2 rounded mt-1">
                          {JSON.stringify(item.newWeights, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
