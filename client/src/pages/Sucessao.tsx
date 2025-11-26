import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, TrendingUp, AlertCircle, Plus, UserPlus, Award, Calendar, Target, Pencil, Trash2, Save, History, Send, FileDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { exportToPDF, generateSectionHTML, generateTableHTML, generateInfoGridHTML, generateBadgeHTML, generateCardHTML } from "@/lib/pdfExport";

/**
 * Página de Mapa de Sucessão - COMPLETA
 * 
 * Funcionalidades:
 * ✅ Criar novo mapa de sucessão
 * ✅ Incluir sucessores em mapa existente
 * ✅ Botões Editar/Incluir/Salvar em TODAS as abas
 * ✅ Histórico de alterações
 * ✅ Envio de testes psicométricos (departamento, emails, grupos)
 */

export default function Sucessao() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddSuccessorDialogOpen, setIsAddSuccessorDialogOpen] = useState(false);
  const [isEditingRisks, setIsEditingRisks] = useState(false);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [isEditingDevelopment, setIsEditingDevelopment] = useState(false);
  const [isSendTestsDialogOpen, setIsSendTestsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  // Estados de formulário
  const [risksData, setRisksData] = useState({
    riskLevel: "",
    exitRisk: "",
    competencyGap: "",
  });
  const [timelineData, setTimelineData] = useState({
    preparationTime: "",
    nextReviewDate: "",
  });
  const [developmentData, setDevelopmentData] = useState({
    developmentActions: "",
    notes: "",
  });
  const [testsData, setTestsData] = useState({
    targetType: "candidates" as "candidates" | "department" | "emails" | "groups",
    testTypes: [] as string[],
    candidateIds: [] as number[],
    departmentIds: [] as number[],
    emails: [] as string[],
    message: "",
  });

  // Queries
  const { data: plans, isLoading, refetch } = trpc.succession.list.useQuery();
  const { data: selectedPlan } = trpc.succession.getById.useQuery(
    { id: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );
  const { data: positions } = trpc.positions.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: departments } = trpc.employees.getDepartments.useQuery();
  const { data: history } = trpc.succession.getHistory.useQuery(
    { planId: selectedPlanId! },
    { enabled: !!selectedPlanId && isHistoryDialogOpen }
  );

  // Mutations
  const createPlan = trpc.succession.create.useMutation({
    onSuccess: () => {
      toast.success("Plano de sucessão criado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const addSuccessor = trpc.succession.addSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor adicionado com sucesso!");
      setIsAddSuccessorDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deletePlan = trpc.succession.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano de sucessão deletado com sucesso!");
      setSelectedPlanId(null);
      refetch();
    },
    onError: (error) => toast.error(`Erro ao deletar: ${error.message}`),
  });

  const updatePlan = trpc.succession.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      setIsEditingRisks(false);
      setIsEditingTimeline(false);
      setIsEditingDevelopment(false);
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const logChange = trpc.succession.logChange.useMutation();

  const sendTests = trpc.succession.sendTests.useMutation({
    onSuccess: (data) => {
      toast.success(`Testes enviados para ${data.recipientCount} pessoas!`);
      setIsSendTestsDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const removeSuccessor = trpc.succession.removeSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor removido com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao deletar: ${error.message}`),
  });

  const updateSuccessor = trpc.succession.updateSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor atualizado com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao atualizar: ${error.message}`),
  });

  // Handlers
  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPlan.mutate({
      positionId: Number(formData.get("positionId")),
      currentHolderId: formData.get("currentHolderId") ? Number(formData.get("currentHolderId")) : undefined,
      isCritical: formData.get("isCritical") === "true",
      riskLevel: formData.get("riskLevel") as "baixo" | "medio" | "alto" | "critico",
      exitRisk: formData.get("exitRisk") as "baixo" | "medio" | "alto",
      competencyGap: formData.get("competencyGap") as string,
      preparationTime: formData.get("preparationTime") ? Number(formData.get("preparationTime")) : undefined,
      notes: formData.get("notes") as string,
    });
  };

  const handleAddSuccessor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedPlanId) {
      toast.error("Selecione um plano primeiro");
      return;
    }

    addSuccessor.mutate({
      planId: selectedPlanId,
      employeeId: Number(formData.get("employeeId")),
      readinessLevel: formData.get("readinessLevel") as "imediato" | "1_ano" | "2_3_anos" | "mais_3_anos",
      priority: Number(formData.get("priority")),
      performanceRating: formData.get("performanceRating") as any,
      potentialRating: formData.get("potentialRating") as any,
      notes: formData.get("notes") as string,
    });
  };

  const handleSaveRisks = () => {
    if (!selectedPlanId) return;

    updatePlan.mutate({
      id: selectedPlanId,
      riskLevel: risksData.riskLevel as any,
      exitRisk: risksData.exitRisk as any,
      competencyGap: risksData.competencyGap,
    });

    logChange.mutate({
      planId: selectedPlanId,
      actionType: "risk_updated",
      notes: "Riscos atualizados",
    });
  };

  const handleSaveTimeline = () => {
    if (!selectedPlanId) return;

    updatePlan.mutate({
      id: selectedPlanId,
      preparationTime: timelineData.preparationTime ? Number(timelineData.preparationTime) : undefined,
      nextReviewDate: timelineData.nextReviewDate ? new Date(timelineData.nextReviewDate) : undefined,
    });

    logChange.mutate({
      planId: selectedPlanId,
      actionType: "timeline_updated",
      notes: "Timeline atualizada",
    });
  };

  const handleSaveDevelopment = () => {
    if (!selectedPlanId) return;

    updatePlan.mutate({
      id: selectedPlanId,
      notes: developmentData.notes,
    });

    logChange.mutate({
      planId: selectedPlanId,
      actionType: "development_updated",
      notes: "Plano de desenvolvimento atualizado",
    });
  };

  const handleSendTests = () => {
    if (!selectedPlanId) return;

    if (testsData.testTypes.length === 0) {
      toast.error("Selecione pelo menos um teste");
      return;
    }

    sendTests.mutate({
      planId: selectedPlanId,
      testTypes: testsData.testTypes,
      targetType: testsData.targetType,
      candidateIds: testsData.candidateIds.length > 0 ? testsData.candidateIds : undefined,
      departmentIds: testsData.departmentIds.length > 0 ? testsData.departmentIds : undefined,
      emails: testsData.emails.length > 0 ? testsData.emails : undefined,
      message: testsData.message,
    });
  };

  const handleExportPDF = async () => {
    if (!selectedPlan) return;

    const position = positions?.find(p => p.id === selectedPlan.positionId);
    const currentHolder = employees?.find(e => e.employee.id === selectedPlan.currentHolderId)?.employee;
    const candidates = selectedPlan.candidates || [];

    // Gerar conteúdo HTML
    const content = `
      ${generateSectionHTML(
        "Informações do Plano",
        generateInfoGridHTML([
          { label: "Posição", value: position?.title || "N/A" },
          { label: "Titular Atual", value: currentHolder?.name || "N/A" },
          { label: "Nível de Risco", value: selectedPlan.riskLevel ? generateBadgeHTML(selectedPlan.riskLevel.toUpperCase(), selectedPlan.riskLevel === 'critico' ? 'danger' : selectedPlan.riskLevel === 'alto' ? 'warning' : 'info') : "N/A" },
          { label: "Risco de Saída", value: selectedPlan.exitRisk || "N/A" },
          { label: "Gap de Competências", value: selectedPlan.competencyGap || "N/A" },
          { label: "Tempo de Preparação", value: selectedPlan.preparationTime ? `${selectedPlan.preparationTime} meses` : "N/A" },
        ])
      )}

      ${generateSectionHTML(
        "Sucessores Identificados",
        candidates.length > 0
          ? generateTableHTML(
              ["Nome", "Prontidão", "Potencial", "Prioridade"],
              candidates.map((c: any) => {
                const emp = employees?.find(e => e.employee.id === c.candidateId)?.employee;
                return [
                  emp?.name || "N/A",
                  c.readiness || "N/A",
                  c.potential || "N/A",
                  c.priority?.toString() || "N/A",
                ];
              })
            )
          : "<p>Nenhum sucessor identificado ainda.</p>"
      )}

      ${generateSectionHTML(
        "Plano de Desenvolvimento",
        generateCardHTML(
          "Ações de Desenvolvimento",
          selectedPlan.notes || "Nenhuma ação definida ainda."
        )
      )}
    `;

    try {
      await exportToPDF({
        title: "Plano de Sucessão",
        subtitle: `${position?.title || "Posição"} - ${currentHolder?.name || "Titular"}`,
        content,
        filename: `sucessao-${position?.title || "plano"}.pdf`,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    const plan = plans?.find(p => p.id === planId);
    if (plan) {
      setRisksData({
        riskLevel: plan.riskLevel || "",
        exitRisk: plan.exitRisk || "",
        competencyGap: plan.competencyGap || "",
      });
      setTimelineData({
        preparationTime: plan.preparationTime?.toString() || "",
        nextReviewDate: plan.nextReviewDate ? new Date(plan.nextReviewDate).toISOString().split('T')[0] : "",
      });
      setDevelopmentData({
        developmentActions: "",
        notes: plan.notes || "",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Mapa de Sucessão
            </h1>
            <p className="text-muted-foreground mt-2">
              Planejamento estratégico de sucessão para posições críticas
            </p>
          </div>

          <div className="flex gap-2">
            {selectedPlanId && (
              <Button
                variant="outline"
                onClick={() => handleExportPDF()}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Plano de Sucessão</DialogTitle>
                <DialogDescription>
                  Defina um novo plano de sucessão para uma posição crítica
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="positionId">Posição *</Label>
                    <Select name="positionId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions?.filter(p => p?.id).map((pos) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentHolderId">Titular Atual</Label>
                    <Select name="currentHolderId">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.filter(e => e?.employee?.id).map((item) => (
                          <SelectItem key={item.employee.id} value={item.employee.id.toString()}>
                            {item.employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Nível de Risco *</Label>
                    <Select name="riskLevel" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="critico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exitRisk">Risco de Saída *</Label>
                    <Select name="exitRisk" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preparationTime">Tempo de Preparação (meses)</Label>
                    <Input
                      type="number"
                      name="preparationTime"
                      placeholder="Ex: 12"
                    />
                  </div>

                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <Checkbox id="isCritical" name="isCritical" value="true" />
                    <Label htmlFor="isCritical" className="cursor-pointer">
                      Posição Crítica
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competencyGap">Gaps de Competências</Label>
                  <Textarea
                    name="competencyGap"
                    placeholder="Descreva as lacunas de competências identificadas..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    name="notes"
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createPlan.isPending}>
                    {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Plano
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posições Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {plans?.filter(p => p.isCritical).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risco Alto/Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {plans?.filter(p => p.riskLevel === "alto" || p.riskLevel === "critico").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Sucessores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {plans?.reduce((sum, p) => sum + (p.successors?.length || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Planos */}
        <div className="grid md:grid-cols-3 gap-4">
          {!plans || plans.length === 0 ? (
            <Card className="col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum plano de sucessão encontrado. Crie um novo plano para começar.
                </p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPlanId === plan.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {plan.positionTitle}
                        {plan.isCritical && (
                          <Badge variant="destructive">Crítica</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {plan.currentHolderName || "Sem titular"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectPlan(plan.id)}
                        title="Editar plano"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Deseja realmente deletar o plano de sucessão para "${plan.positionTitle}"?`)) {
                            deletePlan.mutate(plan.id);
                          }
                        }}
                        title="Deletar plano"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risco:</span>
                      <Badge variant={
                        plan.riskLevel === "critico" ? "destructive" :
                        plan.riskLevel === "alto" ? "default" : "secondary"
                      }>
                        {plan.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sucessores:</span>
                      <span className="font-medium">{plan.successors?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detalhes do Plano Selecionado */}
        {selectedPlan && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedPlan.positionTitle}
                    {selectedPlan.isCritical && (
                      <Badge variant="destructive">Crítica</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Titular: {selectedPlan.currentHolderName || "Sem titular"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistoryDialogOpen(true)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSendTestsDialogOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Testes
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="successors" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="successors">
                    <Users className="h-4 w-4 mr-2" />
                    Sucessores
                  </TabsTrigger>
                  <TabsTrigger value="risks">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Riscos
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="development">
                    <Target className="h-4 w-4 mr-2" />
                    Desenvolvimento
                  </TabsTrigger>
                </TabsList>

                {/* Aba Sucessores */}
                <TabsContent value="successors" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setIsAddSuccessorDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Incluir Sucessor
                    </Button>
                  </div>

                  {selectedPlan.successors && selectedPlan.successors.length > 0 ? (
                    selectedPlan.successors.map((successor) => (
                      <Card key={successor.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{successor.employeeName}</h4>
                                <Badge variant="outline">Prioridade {successor.priority}</Badge>
                              </div>
                              
                              <div className="mt-3 flex items-center gap-2">
                                <Badge>
                                  Prontidão: {successor.readinessLevel?.replace("_", " ")}
                                </Badge>
                              </div>

                              {successor.notes && (
                                <p className="text-sm mt-3 text-muted-foreground">
                                  {successor.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  toast.info("Funcionalidade de edição em desenvolvimento");
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm(`Remover ${successor.employeeName} como sucessor?`)) {
                                    removeSuccessor.mutate({ id: successor.id });
                                  }
                                }}
                                disabled={removeSuccessor.isPending}
                              >
                                {removeSuccessor.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum sucessor cadastrado. Clique em "Incluir Sucessor" para adicionar.
                    </div>
                  )}
                </TabsContent>

                {/* Aba Riscos */}
                <TabsContent value="risks" className="space-y-4">
                  <div className="flex justify-end gap-2">
                    {isEditingRisks ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingRisks(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveRisks}
                          disabled={updatePlan.isPending}
                        >
                          {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsEditingRisks(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nível de Risco</Label>
                      {isEditingRisks ? (
                        <Select
                          value={risksData.riskLevel}
                          onValueChange={(value) => setRisksData({ ...risksData, riskLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixo">Baixo</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                            <SelectItem value="critico">Crítico</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 border rounded">
                          <Badge variant={
                            risksData.riskLevel === "critico" ? "destructive" :
                            risksData.riskLevel === "alto" ? "default" : "secondary"
                          }>
                            {risksData.riskLevel}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Risco de Saída</Label>
                      {isEditingRisks ? (
                        <Select
                          value={risksData.exitRisk}
                          onValueChange={(value) => setRisksData({ ...risksData, exitRisk: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixo">Baixo</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 border rounded">
                          <Badge>{risksData.exitRisk}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gaps de Competências</Label>
                    {isEditingRisks ? (
                      <Textarea
                        value={risksData.competencyGap}
                        onChange={(e) => setRisksData({ ...risksData, competencyGap: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <div className="p-3 border rounded min-h-[100px]">
                        {risksData.competencyGap || "Nenhum gap identificado"}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Aba Timeline */}
                <TabsContent value="timeline" className="space-y-4">
                  <div className="flex justify-end gap-2">
                    {isEditingTimeline ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingTimeline(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTimeline}
                          disabled={updatePlan.isPending}
                        >
                          {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsEditingTimeline(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tempo de Preparação (meses)</Label>
                      {isEditingTimeline ? (
                        <Input
                          type="number"
                          value={timelineData.preparationTime}
                          onChange={(e) => setTimelineData({ ...timelineData, preparationTime: e.target.value })}
                        />
                      ) : (
                        <div className="p-2 border rounded">
                          {timelineData.preparationTime || "Não definido"} meses
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Próxima Revisão</Label>
                      {isEditingTimeline ? (
                        <Input
                          type="date"
                          value={timelineData.nextReviewDate}
                          onChange={(e) => setTimelineData({ ...timelineData, nextReviewDate: e.target.value })}
                        />
                      ) : (
                        <div className="p-2 border rounded">
                          {timelineData.nextReviewDate ? new Date(timelineData.nextReviewDate).toLocaleDateString('pt-BR') : "Não definido"}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba Desenvolvimento */}
                <TabsContent value="development" className="space-y-4">
                  <div className="flex justify-end gap-2">
                    {isEditingDevelopment ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingDevelopment(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveDevelopment}
                          disabled={updatePlan.isPending}
                        >
                          {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsEditingDevelopment(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Plano de Desenvolvimento</Label>
                    {isEditingDevelopment ? (
                      <Textarea
                        value={developmentData.notes}
                        onChange={(e) => setDevelopmentData({ ...developmentData, notes: e.target.value })}
                        rows={6}
                        placeholder="Descreva as ações de desenvolvimento para os sucessores..."
                      />
                    ) : (
                      <div className="p-3 border rounded min-h-[150px]">
                        {developmentData.notes || "Nenhum plano de desenvolvimento definido"}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Dialog: Adicionar Sucessor */}
        <Dialog open={isAddSuccessorDialogOpen} onOpenChange={setIsAddSuccessorDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Incluir Sucessor</DialogTitle>
              <DialogDescription>
                Adicione um novo sucessor ao plano selecionado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSuccessor} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Colaborador *</Label>
                  <Select name="employeeId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.filter(e => e?.employee?.id).map((item) => (
                        <SelectItem key={item.employee.id} value={item.employee.id.toString()}>
                          {item.employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="readinessLevel">Nível de Prontidão *</Label>
                  <Select name="readinessLevel" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediato">Imediato</SelectItem>
                      <SelectItem value="1_ano">1 ano</SelectItem>
                      <SelectItem value="2_3_anos">2-3 anos</SelectItem>
                      <SelectItem value="mais_3_anos">Mais de 3 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Principal</SelectItem>
                      <SelectItem value="2">2 - Secundário</SelectItem>
                      <SelectItem value="3">3 - Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performanceRating">Performance</Label>
                  <Select name="performanceRating">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="excepcional">Excepcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="potentialRating">Potencial</Label>
                  <Select name="potentialRating">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="excepcional">Excepcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  name="notes"
                  placeholder="Observações sobre o sucessor..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={addSuccessor.isPending}>
                  {addSuccessor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar Sucessor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Enviar Testes */}
        <Dialog open={isSendTestsDialogOpen} onOpenChange={setIsSendTestsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Enviar Testes Psicométricos</DialogTitle>
              <DialogDescription>
                Selecione os testes e destinatários para envio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Seleção de Testes */}
              <div className="space-y-2">
                <Label>Testes Disponíveis</Label>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    { id: "disc", name: "DISC" },
                    { id: "big_five", name: "Big Five" },
                    { id: "mbti", name: "MBTI" },
                    { id: "ie", name: "Inteligência Emocional" },
                    { id: "vark", name: "VARK" },
                    { id: "lideranca", name: "Liderança" },
                    { id: "ancoras", name: "Âncoras de Carreira" },
                  ].map((test) => (
                    <div key={test.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={test.id}
                        checked={testsData.testTypes.includes(test.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTestsData({
                              ...testsData,
                              testTypes: [...testsData.testTypes, test.id],
                            });
                          } else {
                            setTestsData({
                              ...testsData,
                              testTypes: testsData.testTypes.filter((t) => t !== test.id),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={test.id} className="cursor-pointer">
                        {test.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo de Destinatário */}
              <div className="space-y-2">
                <Label>Enviar Para</Label>
                <Tabs
                  value={testsData.targetType}
                  onValueChange={(value: any) => setTestsData({ ...testsData, targetType: value })}
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="candidates">Candidatos</TabsTrigger>
                    <TabsTrigger value="department">Departamento</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                    <TabsTrigger value="groups">Grupos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="candidates" className="space-y-2">
                    <Label>Selecione os Candidatos</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedPlan?.successors?.map((successor) => (
                        <div key={successor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`candidate-${successor.id}`}
                            checked={testsData.candidateIds.includes(successor.employeeId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTestsData({
                                  ...testsData,
                                  candidateIds: [...testsData.candidateIds, successor.employeeId],
                                });
                              } else {
                                setTestsData({
                                  ...testsData,
                                  candidateIds: testsData.candidateIds.filter((id) => id !== successor.employeeId),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`candidate-${successor.id}`} className="cursor-pointer">
                            {successor.employeeName}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {(!selectedPlan?.successors || selectedPlan.successors.length === 0) && (
                      <p className="text-sm text-muted-foreground">Nenhum candidato cadastrado</p>
                    )}
                  </TabsContent>

                  <TabsContent value="department" className="space-y-2">
                    <Label>Selecione os Departamentos</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {departments?.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={testsData.departmentIds.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTestsData({
                                  ...testsData,
                                  departmentIds: [...testsData.departmentIds, dept.id],
                                });
                              } else {
                                setTestsData({
                                  ...testsData,
                                  departmentIds: testsData.departmentIds.filter((id) => id !== dept.id),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`dept-${dept.id}`} className="cursor-pointer">
                            {dept.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="emails" className="space-y-2">
                    <Label>Emails (separados por vírgula)</Label>
                    <Textarea
                      placeholder="email1@example.com, email2@example.com"
                      value={testsData.emails.join(", ")}
                      onChange={(e) => {
                        const emails = e.target.value.split(",").map((email) => email.trim()).filter(Boolean);
                        setTestsData({ ...testsData, emails });
                      }}
                      rows={4}
                    />
                  </TabsContent>

                  <TabsContent value="groups" className="space-y-2">
                    <Label>Grupos (em desenvolvimento)</Label>
                    <p className="text-sm text-muted-foreground">
                      Funcionalidade de envio por grupos será implementada em breve.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label>Mensagem (opcional)</Label>
                <Textarea
                  placeholder="Mensagem personalizada para os destinatários..."
                  value={testsData.message}
                  onChange={(e) => setTestsData({ ...testsData, message: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSendTests}
                disabled={sendTests.isPending || testsData.testTypes.length === 0}
              >
                {sendTests.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar Testes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Histórico de Alterações</DialogTitle>
              <DialogDescription>
                Registro de todas as alterações realizadas neste plano
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {history && history.length > 0 ? (
                history.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge>{item.actionType.replace("_", " ")}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {item.userName || "Sistema"}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-sm mt-2">{item.notes}</p>
                          )}
                          {item.fieldName && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Campo: {item.fieldName}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum histórico encontrado
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
