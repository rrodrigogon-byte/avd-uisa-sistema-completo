import { useState } from "react";
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
import { GitBranch, Clock, CheckCircle, XCircle, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Workflows
 * 
 * Features:
 * - Visualização de processos de aprovação
 * - Status de cada etapa do workflow
 * - Tempo médio por etapa
 * - Fluxos configuráveis
 */

export default function Workflows() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    type: "",
  });

  // Buscar workflows do backend
  const { data: backendWorkflows, refetch } = trpc.workflows.list.useQuery();

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
                    onClick={() => toast.info(`Configuração de workflow "${workflow.name}" em desenvolvimento`)}
                  >
                    Configurar Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
