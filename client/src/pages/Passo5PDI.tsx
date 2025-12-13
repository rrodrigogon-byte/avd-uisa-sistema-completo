import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Target, ArrowLeft, Plus, Trash2, CheckCircle2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Passo 5: Plano de Desenvolvimento Individual (PDI)
 * Criação de plano de ações para desenvolvimento baseado nos gaps identificados
 */

interface DevelopmentAction {
  id: string;
  competencyId?: number;
  title: string;
  description: string;
  actionType: 'experiencia_pratica' | 'mentoria_feedback' | 'treinamento_formal';
  category: string;
  responsibleId?: number;
  dueDate: string;
  successMetrics: string;
  expectedOutcome: string;
}

export default function Passo5PDI() {
  const params = useParams();
  const [, navigate] = useLocation();
  const processId = params.processId ? parseInt(params.processId) : undefined;
  const employeeId = params.employeeId ? parseInt(params.employeeId) : undefined;

  const [title, setTitle] = useState("Plano de Desenvolvimento Individual");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [objectives, setObjectives] = useState("");
  const [actions, setActions] = useState<DevelopmentAction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar avaliação de desempenho (Passo 4)
  const { data: performanceAssessment, isLoading: loadingPerformance } = trpc.avd.getPerformanceAssessmentByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Buscar competências para vincular ações
  const { data: competencies } = trpc.avd.listCompetencies.useQuery();

  // Buscar PDI existente (se houver)
  const { data: existingPDI } = trpc.avd.getDevelopmentPlanByProcess.useQuery(
    { processId: processId! },
    { enabled: !!processId }
  );

  // Mutation para criar PDI
  const createDevelopmentPlan = trpc.avd.createDevelopmentPlan.useMutation({
    onSuccess: () => {
      toast.success("PDI criado com sucesso! Processo de avaliação concluído.");
      
      // Atualizar processo para finalizado
      updateProcessStep.mutate({
        processId: processId!,
        step: 5,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar PDI: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Mutation para atualizar passo do processo
  const updateProcessStep = trpc.avd.updateProcessStep.useMutation({
    onSuccess: () => {
      // Navegar para página de conclusão ou dashboard
      navigate('/');
      toast.success("Processo AVD concluído com sucesso!");
    },
  });

  // Carregar dados existentes
  useEffect(() => {
    if (existingPDI) {
      setTitle(existingPDI.title || "");
      setDescription(existingPDI.description || "");
      setStartDate(existingPDI.startDate ? new Date(existingPDI.startDate).toISOString().split('T')[0] : "");
      setEndDate(existingPDI.endDate ? new Date(existingPDI.endDate).toISOString().split('T')[0] : "");
      setObjectives(existingPDI.objectives || "");
      
      if (existingPDI.actions) {
        setActions(existingPDI.actions.map((action: any) => ({
          id: action.id.toString(),
          competencyId: action.competencyId,
          title: action.title,
          description: action.description || "",
          actionType: action.actionType,
          category: action.category || "",
          responsibleId: action.responsibleId,
          dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "",
          successMetrics: action.successMetrics || "",
          expectedOutcome: action.expectedOutcome || "",
        })));
      }
    }
  }, [existingPDI]);

  // Pré-popular objetivos baseado na análise de gaps
  useEffect(() => {
    if (performanceAssessment && !objectives) {
      const gapsText = performanceAssessment.gapsAnalysis || "";
      const recommendationsText = performanceAssessment.developmentRecommendations || "";
      
      if (gapsText || recommendationsText) {
        setObjectives(
          `Objetivos baseados na avaliação de desempenho:\n\n` +
          `Gaps identificados:\n${gapsText}\n\n` +
          `Recomendações:\n${recommendationsText}`
        );
      }
    }
  }, [performanceAssessment, objectives]);

  const addAction = () => {
    const newAction: DevelopmentAction = {
      id: Date.now().toString(),
      title: "",
      description: "",
      actionType: 'experiencia_pratica',
      category: "",
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      successMetrics: "",
      expectedOutcome: "",
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, field: keyof DevelopmentAction, value: any) => {
    setActions(actions.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSubmit = async () => {
    if (!processId || !employeeId) {
      toast.error("Dados do processo não encontrados");
      return;
    }

    if (!performanceAssessment) {
      toast.error("Avaliação de desempenho não encontrada. Complete o Passo 4 primeiro.");
      return;
    }

    if (!title.trim()) {
      toast.error("Por favor, insira um título para o PDI");
      return;
    }

    if (actions.length === 0) {
      toast.error("Por favor, adicione pelo menos uma ação de desenvolvimento");
      return;
    }

    // Validar ações
    for (const action of actions) {
      if (!action.title.trim()) {
        toast.error("Todas as ações devem ter um título");
        return;
      }
      if (!action.dueDate) {
        toast.error("Todas as ações devem ter uma data de conclusão");
        return;
      }
    }

    setIsSubmitting(true);

    createDevelopmentPlan.mutate({
      processId,
      employeeId,
      performanceAssessmentId: performanceAssessment.id,
      title,
      description,
      startDate,
      endDate,
      objectives,
      actions: actions.map(a => ({
        competencyId: a.competencyId,
        title: a.title,
        description: a.description,
        actionType: a.actionType,
        category: a.category,
        responsibleId: a.responsibleId,
        dueDate: a.dueDate,
        successMetrics: a.successMetrics,
        expectedOutcome: a.expectedOutcome,
      })),
    });
  };

  if (loadingPerformance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!performanceAssessment) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Desempenho Pendente</CardTitle>
            <CardDescription>
              Você precisa completar o Passo 4 (Avaliação de Desempenho) antes de criar o PDI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/avd/passo4/${processId}/${employeeId}`)}>
              Ir para Passo 4
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actionTypeLabels = {
    experiencia_pratica: '70% - Experiência Prática',
    mentoria_feedback: '20% - Mentoria e Feedback',
    treinamento_formal: '10% - Treinamento Formal',
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Passo 5: Plano de Desenvolvimento Individual (PDI)</h1>
            <p className="text-muted-foreground">
              Crie um plano de ações para desenvolvimento baseado nos gaps identificados
            </p>
          </div>
        </div>
      </div>

      {/* Informações Básicas do PDI */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do PDI</CardTitle>
          <CardDescription>
            Defina o título, período e objetivos do plano de desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título do PDI</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plano de Desenvolvimento 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição geral do plano de desenvolvimento..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="objectives">Objetivos do PDI</Label>
            <Textarea
              id="objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Objetivos específicos que este PDI visa alcançar..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações de Desenvolvimento */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ações de Desenvolvimento</CardTitle>
              <CardDescription>
                Defina ações específicas seguindo o modelo 70-20-10
              </CardDescription>
            </div>
            <Button onClick={addAction} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ação adicionada ainda.</p>
              <p className="text-sm">Clique em "Adicionar Ação" para começar.</p>
            </div>
          ) : (
            actions.map((action, index) => (
              <Card key={action.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Ação {index + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título da Ação *</Label>
                    <Input
                      value={action.title}
                      onChange={(e) => updateAction(action.id, 'title', e.target.value)}
                      placeholder="Ex: Participar de projeto de liderança"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Ação (Modelo 70-20-10)</Label>
                      <Select
                        value={action.actionType}
                        onValueChange={(value) => updateAction(action.id, 'actionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="experiencia_pratica">
                            {actionTypeLabels.experiencia_pratica}
                          </SelectItem>
                          <SelectItem value="mentoria_feedback">
                            {actionTypeLabels.mentoria_feedback}
                          </SelectItem>
                          <SelectItem value="treinamento_formal">
                            {actionTypeLabels.treinamento_formal}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data de Conclusão *</Label>
                      <Input
                        type="date"
                        value={action.dueDate}
                        onChange={(e) => updateAction(action.id, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={action.description}
                      onChange={(e) => updateAction(action.id, 'description', e.target.value)}
                      placeholder="Descreva detalhadamente a ação de desenvolvimento..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={action.category}
                      onChange={(e) => updateAction(action.id, 'category', e.target.value)}
                      placeholder="Ex: Liderança, Comunicação, Técnica..."
                    />
                  </div>

                  <div>
                    <Label>Métricas de Sucesso</Label>
                    <Textarea
                      value={action.successMetrics}
                      onChange={(e) => updateAction(action.id, 'successMetrics', e.target.value)}
                      placeholder="Como o sucesso desta ação será medido?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Resultado Esperado</Label>
                    <Textarea
                      value={action.expectedOutcome}
                      onChange={(e) => updateAction(action.id, 'expectedOutcome', e.target.value)}
                      placeholder="Qual o resultado esperado ao completar esta ação?"
                      rows={2}
                    />
                  </div>

                  {competencies && (
                    <div>
                      <Label>Competência Relacionada (Opcional)</Label>
                      <Select
                        value={action.competencyId?.toString() || ""}
                        onValueChange={(value) => updateAction(action.id, 'competencyId', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma competência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {competencies.map((comp: any) => (
                            <SelectItem key={comp.id} value={comp.id.toString()}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {actions.length > 0 && (
        <Card className="mb-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do PDI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{actions.length}</div>
                <div className="text-sm text-muted-foreground">Ações Totais</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {actions.filter(a => a.actionType === 'experiencia_pratica').length}
                </div>
                <div className="text-sm text-muted-foreground">Experiência Prática</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {actions.filter(a => a.actionType === 'mentoria_feedback').length}
                </div>
                <div className="text-sm text-muted-foreground">Mentoria</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => navigate(`/avd/passo4/${processId}/${employeeId}`)}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Passo 4
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || actions.length === 0}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando PDI...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizar Processo AVD
            </>
          )}
        </Button>
      </div>

      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Adicione pelo menos uma ação de desenvolvimento para concluir o PDI
        </p>
      )}
    </div>
  );
}
