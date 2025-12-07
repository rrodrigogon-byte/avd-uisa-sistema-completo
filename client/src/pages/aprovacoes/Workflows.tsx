import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { GitBranch, Clock, CheckCircle, XCircle, ArrowRight, Plus, Trash2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Workflows
 * 
 * Features:
 * - Visualização de processos de aprovação
 * - Status de cada etapa do workflow
 * - Tempo médio por etapa
 * - Fluxos configuráveis
 */

// Tipo para alçada de aprovação
interface ApprovalLevel {
  order: number;
  name: string;
  approverIds: number[];
  approverNames: string[];
  slaInDays: number;
  isParallel: boolean;
}

export default function Workflows() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    type: "",
  });
  
  // Estados para configuração de alçadas
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [currentLevelName, setCurrentLevelName] = useState("");
  const [currentLevelSLA, setCurrentLevelSLA] = useState(3);
  const [currentLevelIsParallel, setCurrentLevelIsParallel] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // Buscar workflows do backend
  const { data: backendWorkflows, refetch } = trpc.workflows.list.useQuery();
  
  // Buscar funcionários para seleção de aprovadores
  const { data: employees } = trpc.employees.list.useQuery();
  
  // Mutation para atualizar workflow
  const updateWorkflowMutation = trpc.workflows.update.useMutation({
    onSuccess: () => {
      toast.success("Workflow configurado com sucesso!");
      setIsConfigDialogOpen(false);
      resetConfigForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao configurar workflow: ${error.message}`);
    },
  });

  // Mutation para criar workflow
  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success(`Workflow "${newWorkflow.name}" criado com sucesso!`);
      setIsCreateDialogOpen(false);
      setNewWorkflow({ name: "", description: "", type: "" });
      refetch(); // Atualizar listagem
    },
    onError: (error) => {
      toast.error(`Erro ao criar workflow: ${error.message}`);
    },
  });
  
  // Resetar formulário de configuração
  const resetConfigForm = () => {
    setApprovalLevels([]);
    setCurrentLevelName("");
    setCurrentLevelSLA(3);
    setCurrentLevelIsParallel(false);
    setSelectedApprovers([]);
    setEmployeeSearchTerm("");
  };
  
  // Carregar alçadas quando abrir o dialog de configuração
  useEffect(() => {
    if (isConfigDialogOpen && selectedWorkflow) {
      try {
        const steps = selectedWorkflow.steps || [];
        if (Array.isArray(steps) && steps.length > 0) {
          // Converter steps para approval levels
          const levels: ApprovalLevel[] = steps.map((step: any, index: number) => ({
            order: index + 1,
            name: step.name || `Alçada ${index + 1}`,
            approverIds: step.approverIds || [],
            approverNames: step.approverNames || [],
            slaInDays: step.slaInDays || 3,
            isParallel: step.isParallel || false,
          }));
          setApprovalLevels(levels);
        }
      } catch (error) {
        console.error("Erro ao carregar alçadas:", error);
      }
    }
  }, [isConfigDialogOpen, selectedWorkflow]);
  
  // Adicionar nova alçada
  const handleAddLevel = () => {
    if (approvalLevels.length >= 5) {
      toast.error("Máximo de 5 alçadas permitidas");
      return;
    }
    
    if (!currentLevelName.trim()) {
      toast.error("Digite um nome para a alçada");
      return;
    }
    
    if (selectedApprovers.length === 0) {
      toast.error("Selecione pelo menos um aprovador");
      return;
    }
    
    const approverNames = employees
      ?.filter(e => selectedApprovers.includes(e.id))
      .map(e => e.name) || [];
    
    const newLevel: ApprovalLevel = {
      order: approvalLevels.length + 1,
      name: currentLevelName,
      approverIds: selectedApprovers,
      approverNames,
      slaInDays: currentLevelSLA,
      isParallel: currentLevelIsParallel,
    };
    
    setApprovalLevels([...approvalLevels, newLevel]);
    setCurrentLevelName("");
    setCurrentLevelSLA(3);
    setCurrentLevelIsParallel(false);
    setSelectedApprovers([]);
    toast.success("Alçada adicionada com sucesso");
  };
  
  // Remover alçada
  const handleRemoveLevel = (order: number) => {
    const filtered = approvalLevels.filter(l => l.order !== order);
    // Reordenar
    const reordered = filtered.map((l, index) => ({ ...l, order: index + 1 }));
    setApprovalLevels(reordered);
    toast.success("Alçada removida");
  };
  
  // Salvar configuração do workflow
  const handleSaveWorkflowConfig = () => {
    if (approvalLevels.length < 2) {
      toast.error("Configure pelo menos 2 alçadas de aprovação");
      return;
    }
    
    if (approvalLevels.length > 5) {
      toast.error("Máximo de 5 alçadas permitidas");
      return;
    }
    
    // Converter approval levels para steps
    const steps = approvalLevels.map(level => ({
      order: level.order,
      name: level.name,
      approverIds: level.approverIds,
      approverNames: level.approverNames,
      slaInDays: level.slaInDays,
      isParallel: level.isParallel,
    }));
    
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      steps: JSON.stringify(steps),
    });
  };
  
  // Calcular tempo médio total
  const calculateTotalSLA = () => {
    if (approvalLevels.length === 0) return 0;
    return approvalLevels.reduce((sum, level) => sum + level.slaInDays, 0);
  };
  
  // Filtrar funcionários por busca
  const filteredEmployees = employees?.filter(e => 
    e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  ) || [];

  // Mock data para demonstração
  const mockWorkflows = [
    {
      id: 1,
      name: "Aprovação de Bônus",
      description: "Fluxo de aprovação para solicitações de bônus",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "1d" },
        { name: "RH", status: "in_progress", avgTime: "2d" },
        { name: "Diretoria", status: "pending", avgTime: "3d" },
        { name: "Finalizado", status: "pending", avgTime: "-" },
      ],
      activeRequests: 8,
      avgTotalTime: "6.5 dias",
    },
    {
      id: 2,
      name: "Aprovação de Férias",
      description: "Fluxo de aprovação para solicitações de férias",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "0.5d" },
        { name: "RH", status: "completed", avgTime: "1d" },
        { name: "Finalizado", status: "completed", avgTime: "-" },
      ],
      activeRequests: 15,
      avgTotalTime: "2 dias",
    },
    {
      id: 3,
      name: "Aprovação de Promoção",
      description: "Fluxo de aprovação para promoções e mudanças de cargo",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "2d" },
        { name: "Gerência", status: "in_progress", avgTime: "3d" },
        { name: "Diretoria", status: "pending", avgTime: "5d" },
        { name: "RH", status: "pending", avgTime: "2d" },
        { name: "Finalizado", status: "pending", avgTime: "-" },
      ],
      activeRequests: 3,
      avgTotalTime: "12 dias",
    },
  ];

  // Usar workflows do backend se disponíveis, senão usar mock
  const workflows = backendWorkflows && backendWorkflows.length > 0 
    ? backendWorkflows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || "Workflow customizado",
        steps: w.steps ? JSON.parse(w.steps as string) : [],
        activeRequests: 0,
        avgTotalTime: "-",
      }))
    : mockWorkflows;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500">Em Andamento</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflows de Aprovação</h1>
            <p className="text-muted-foreground">
              Visualização e gerenciamento de fluxos de aprovação
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Workflow
          </Button>
        </div>

        {/* Workflows */}
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                      <CardTitle>{workflow.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Solicitações Ativas</p>
                    <p className="text-2xl font-bold">{workflow.activeRequests}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Steps */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-4">
                  {workflow.steps.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="flex items-center justify-center mb-2">
                          {getStatusIcon(step.status)}
                        </div>
                        <p className="text-sm font-semibold text-center mb-1">{step.name}</p>
                        <p className="text-xs text-muted-foreground text-center mb-2">
                          Média: {step.avgTime}
                        </p>
                        {getStatusBadge(step.status)}
                      </div>
                      {idx < workflow.steps.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong>Tempo Médio Total:</strong> {workflow.avgTotalTime}
                    </span>
                    <span>
                      <strong>Etapas:</strong> {workflow.steps.length}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setWorkflowSteps(workflow.steps || []);
                      setIsConfigDialogOpen(true);
                    }}
                  >
                    Configurar Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog de Configuração de Workflow */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Workflow: {selectedWorkflow?.name}</DialogTitle>
              <DialogDescription>
                Configure as alçadas de aprovação (mínimo 2, máximo 5 alçadas)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Alçadas Configuradas */}
              {approvalLevels.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Alçadas Configuradas ({approvalLevels.length}/5)</Label>
                    <Badge variant="outline" className="text-sm">
                      Tempo Total: {calculateTotalSLA()} dias
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {approvalLevels.map((level, index) => (
                      <div key={level.order} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {level.order}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{level.name}</p>
                            {level.isParallel && (
                              <Badge variant="secondary" className="text-xs">Paralela</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Users className="inline h-3 w-3 mr-1" />
                            {level.approverNames.join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            SLA: {level.slaInDays} {level.slaInDays === 1 ? 'dia' : 'dias'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLevel(level.order)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        {index < approvalLevels.length - 1 && (
                          <ArrowRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Validação de alçadas */}
              {approvalLevels.length < 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure pelo menos 2 alçadas de aprovação para ativar o workflow.
                  </AlertDescription>
                </Alert>
              )}
              
              {approvalLevels.length >= 5 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Limite máximo de 5 alçadas atingido. Remova uma alçada para adicionar outra.
                  </AlertDescription>
                </Alert>
              )}
              
              <Separator />
              
              {/* Adicionar Nova Alçada */}
              {approvalLevels.length < 5 && (
                <div className="space-y-4 p-4 border rounded-lg bg-background">
                  <Label className="text-base font-semibold">
                    Adicionar Nova Alçada ({approvalLevels.length + 1}/5)
                  </Label>
                  
                  {/* Nome da Alçada */}
                  <div className="space-y-2">
                    <Label htmlFor="level-name">Nome da Alçada *</Label>
                    <Input
                      id="level-name"
                      placeholder="Ex: Aprovação do Gestor Direto"
                      value={currentLevelName}
                      onChange={(e) => setCurrentLevelName(e.target.value)}
                    />
                  </div>
                  
                  {/* Seleção de Aprovadores */}
                  <div className="space-y-2">
                    <Label>Aprovadores *</Label>
                    <Input
                      placeholder="Buscar funcionário..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filteredEmployees.slice(0, 10).map((employee) => (
                        <div
                          key={employee.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => {
                            if (selectedApprovers.includes(employee.id)) {
                              setSelectedApprovers(selectedApprovers.filter(id => id !== employee.id));
                            } else {
                              setSelectedApprovers([...selectedApprovers, employee.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedApprovers.includes(employee.id)}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum funcionário encontrado
                        </p>
                      )}
                    </div>
                    {selectedApprovers.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedApprovers.length} aprovador(es) selecionado(s)
                      </p>
                    )}
                  </div>
                  
                  {/* SLA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="level-sla">Prazo (SLA) em dias *</Label>
                      <Input
                        id="level-sla"
                        type="number"
                        min="1"
                        max="30"
                        value={currentLevelSLA}
                        onChange={(e) => setCurrentLevelSLA(parseInt(e.target.value) || 3)}
                      />
                    </div>
                    
                    {/* Tipo de Aprovação */}
                    <div className="space-y-2">
                      <Label htmlFor="level-type">Tipo de Aprovação</Label>
                      <Select
                        value={currentLevelIsParallel ? "parallel" : "sequential"}
                        onValueChange={(value) => setCurrentLevelIsParallel(value === "parallel")}
                      >
                        <SelectTrigger id="level-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">Sequencial (um por vez)</SelectItem>
                          <SelectItem value="parallel">Paralela (todos juntos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={handleAddLevel} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Alçada
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfigDialogOpen(false);
                  resetConfigForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveWorkflowConfig}
                disabled={approvalLevels.length < 2 || approvalLevels.length > 5 || updateWorkflowMutation.isPending}
              >
                Salvar Configuração
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog de Criação de Workflow */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Workflow</DialogTitle>
              <DialogDescription>
                Configure um novo fluxo de aprovação customizado para sua organização
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nome do Workflow */}
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Nome do Workflow *</Label>
                <Input
                  id="workflow-name"
                  placeholder="Ex: Aprovação de Horas Extras"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Descrição</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Descreva o propósito deste workflow..."
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Tipo de Workflow */}
              <div className="space-y-2">
                <Label htmlFor="workflow-type">Tipo de Workflow *</Label>
                <Select
                  value={newWorkflow.type}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, type: value })}
                >
                  <SelectTrigger id="workflow-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovacao_metas">Aprovação de Metas</SelectItem>
                    <SelectItem value="aprovacao_pdi">Aprovação de PDI</SelectItem>
                    <SelectItem value="aprovacao_avaliacao">Aprovação de Avaliação</SelectItem>
                    <SelectItem value="aprovacao_bonus">Aprovação de Bônus</SelectItem>
                    <SelectItem value="aprovacao_ferias">Aprovação de Férias</SelectItem>
                    <SelectItem value="aprovacao_promocao">Aprovação de Promoção</SelectItem>
                    <SelectItem value="aprovacao_horas_extras">Aprovação de Horas Extras</SelectItem>
                    <SelectItem value="aprovacao_despesas">Aprovação de Despesas</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Informação sobre Etapas */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Próximo passo:</strong> Após criar o workflow, você poderá configurar as etapas de aprovação,
                  definir aprovadores, ordem e condições para cada etapa.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewWorkflow({ name: "", description: "", type: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!newWorkflow.name || !newWorkflow.type) {
                    toast.error("Preencha todos os campos obrigatórios");
                    return;
                  }

                  // Criar workflow no backend
                  createWorkflowMutation.mutate({
                    name: newWorkflow.name,
                    description: newWorkflow.description || undefined,
                    type: newWorkflow.type as any, // Type assertion para aceitar valores do select
                    steps: JSON.stringify([]), // Etapas vazias inicialmente
                  });
                }}
                disabled={!newWorkflow.name || !newWorkflow.type || createWorkflowMutation.isPending}
              >
                Criar Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
