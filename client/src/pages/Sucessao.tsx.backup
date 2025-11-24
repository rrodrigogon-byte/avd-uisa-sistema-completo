import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Users, TrendingUp, AlertCircle, Plus, UserPlus, Award, Calendar, Target, Search, Check, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Página de Mapa de Sucessão
 * Metodologia: 9-Box Succession Planning
 * 
 * Funcionalidades:
 * - Criar novo mapa de sucessão
 * - Incluir sucessores em mapa existente
 * - Abas: Planos de Acompanhamento, Riscos, Timeline, Desenvolvimento
 */

export default function Sucessao() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddSuccessorDialogOpen, setIsAddSuccessorDialogOpen] = useState(false);
  const [openEmployeeCombobox, setOpenEmployeeCombobox] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  // Queries
  const { data: plans, isLoading, refetch } = trpc.succession.list.useQuery();
  const { data: selectedPlan } = trpc.succession.getById.useQuery(
    { id: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );
  const { data: positions } = trpc.positions.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: suggestions } = trpc.succession.suggestSuccessors.useQuery(
    { positionId: selectedPlan?.positionId || 0 },
    { enabled: !!selectedPlan?.positionId }
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

  const updatePlan = trpc.succession.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
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
    
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    addSuccessor.mutate({
      planId: selectedPlanId!,
      employeeId: selectedEmployeeId,
      readinessLevel: formData.get("readinessLevel") as "imediato" | "1_ano" | "2_3_anos" | "mais_3_anos",
      priority: Number(formData.get("priority")),
      notes: formData.get("notes") as string,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h1 className="text-3xl font-bold">Mapa de Sucessão</h1>
            <p className="text-muted-foreground mt-1">
              Metodologia: <Badge variant="outline">9-Box Succession Planning</Badge>
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano de Sucessão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano de Sucessão</DialogTitle>
                <DialogDescription>
                  Identifique posições críticas e planeje a sucessão com base na metodologia 9-Box
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <Label htmlFor="positionId">Posição *</Label>
                  <Select name="positionId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a posição" />
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

                <div>
                  <Label htmlFor="currentHolderId">Titular Atual</Label>
                  <Select name="currentHolderId">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o titular" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                          {emp.employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isCritical">Posição Crítica?</Label>
                    <Select name="isCritical" defaultValue="false">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="riskLevel">Nível de Risco</Label>
                    <Select name="riskLevel" defaultValue="medio">
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exitRisk">Risco de Saída</Label>
                    <Select name="exitRisk" defaultValue="medio">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preparationTime">Tempo de Preparo (meses)</Label>
                    <Input
                      type="number"
                      name="preparationTime"
                      placeholder="Ex: 12"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="competencyGap">Gaps de Competências</Label>
                  <Textarea
                    name="competencyGap"
                    placeholder="Descreva as competências que precisam ser desenvolvidas..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    name="notes"
                    placeholder="Informações adicionais sobre o plano..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPlan.isPending}>
                    {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Plano
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold">
                {plans?.filter(p => p.isCritical).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sucessores Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans?.reduce((acc, p) => acc + (p.successors?.length || 0), 0) || 0}
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
              <div className="text-2xl font-bold text-destructive">
                {plans?.filter(p => p.riskLevel === "alto" || p.riskLevel === "critico").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Planos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar com lista de planos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Planos de Sucessão</CardTitle>
              <CardDescription>Selecione um plano para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {plans?.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlanId === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{plan.positionTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.currentHolderName || "Sem titular"}
                      </p>
                    </div>
                    {plan.isCritical && (
                      <Badge variant="destructive" className="text-xs">
                        Crítica
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {plan.successors?.length || 0} sucessores
                    </Badge>
                    <Badge
                      variant={
                        plan.riskLevel === "critico" || plan.riskLevel === "alto"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      Risco: {plan.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}

              {(!plans || plans.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum plano criado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes do plano selecionado */}
          <Card className="lg:col-span-2">
            {selectedPlan ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedPlan.position?.title}</CardTitle>
                      <CardDescription>
                        Titular: {selectedPlan.currentHolder?.name || "Não definido"}
                      </CardDescription>
                    </div>
                    
                    <Dialog open={isAddSuccessorDialogOpen} onOpenChange={setIsAddSuccessorDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar Sucessor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Sucessor</DialogTitle>
                          <DialogDescription>
                            Inclua um novo sucessor ao plano de sucessão
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleAddSuccessor} className="space-y-4">
                          {/* Combobox de Colaborador com Busca */}
                          <div>
                            <Label>Colaborador *</Label>
                            <Popover open={openEmployeeCombobox} onOpenChange={setOpenEmployeeCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openEmployeeCombobox}
                                  className="w-full justify-between"
                                >
                                  {selectedEmployeeId
                                    ? employees?.find((emp) => emp.employee.id === selectedEmployeeId)?.employee.name
                                    : "Buscar colaborador..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0">
                                <Command>
                                  <CommandInput placeholder="Digite o nome do colaborador..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {employees?.slice(0, 100).map((emp) => (
                                        <CommandItem
                                          key={emp.employee.id}
                                          value={emp.employee.name}
                                          onSelect={() => {
                                            setSelectedEmployeeId(emp.employee.id);
                                            setOpenEmployeeCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedEmployeeId === emp.employee.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{emp.employee.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {emp.position?.title || "Sem cargo"} • {emp.department?.name || "Sem depto"}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {selectedEmployeeId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ✓ {employees?.find((emp) => emp.employee.id === selectedEmployeeId)?.employee.name} selecionado
                              </p>
                            )}
                          </div>

                          {/* Nível (Primário, Secundário, Backup) */}
                          <div>
                            <Label htmlFor="level">Nível *</Label>
                            <Select name="level" defaultValue="primario" required>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primario">🥇 Primário (1ª opção)</SelectItem>
                                <SelectItem value="secundario">🥈 Secundário (2ª opção)</SelectItem>
                                <SelectItem value="backup">🥉 Backup (reserva)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Nível de Prontidão com Indicadores Visuais */}
                          <div>
                            <Label htmlFor="readinessLevel">Nível de Prontidão *</Label>
                            <Select name="readinessLevel" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="imediato">🟢 Imediato (pronto agora)</SelectItem>
                                <SelectItem value="1_ano">🟡 1 ano</SelectItem>
                                <SelectItem value="2_3_anos">🟠 2-3 anos</SelectItem>
                                <SelectItem value="mais_3_anos">🔴 Mais de 3 anos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Prioridade */}
                          <div>
                            <Label htmlFor="priority">Prioridade (ordem de sucessão)</Label>
                            <Input
                              type="number"
                              name="priority"
                              defaultValue="1"
                              min="1"
                              max="10"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              1 = maior prioridade, 10 = menor prioridade
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                              name="notes"
                              placeholder="Informações sobre o sucessor..."
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddSuccessorDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={addSuccessor.isPending}>
                              {addSuccessor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Adicionar
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
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
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {successor.employeeEmail}
                                  </p>
                                  
                                  <div className="mt-3 flex items-center gap-2">
                                    <Badge>
                                      Prontidão: {successor.readinessLevel.replace("_", " ")}
                                    </Badge>
                                    
                                    {successor.nineBox && (
                                      <Badge variant="secondary">
                                        Nine Box: Perf {successor.nineBox.performance} | Pot {successor.nineBox.potential}
                                      </Badge>
                                    )}
                                  </div>

                                  {successor.notes && (
                                    <p className="text-sm mt-3 text-muted-foreground">
                                      {successor.notes}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Botões de Ação */}
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
                                        toast.info("Funcionalidade de remoção em desenvolvimento");
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum sucessor identificado ainda</p>
                          <p className="text-sm mt-1">Clique em "Adicionar Sucessor" para começar</p>
                        </div>
                      )}

                      {/* Sugestões automáticas */}
                      {suggestions && suggestions.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            Sugestões Automáticas (Alto Potencial via Nine Box)
                          </h4>
                          <div className="space-y-2">
                            {suggestions.slice(0, 5).map((suggestion) => (
                              <div
                                key={suggestion.employeeId}
                                className="p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{suggestion.employeeName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {suggestion.positionTitle}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        Performance: {suggestion.performance}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Potencial: {suggestion.potential}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // TODO: Auto-preencher formulário com sugestão
                                      setIsAddSuccessorDialogOpen(true);
                                    }}
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Aba Riscos */}
                    <TabsContent value="risks" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Risco de Saída</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge
                              variant={
                                selectedPlan.exitRisk === "alto" ? "destructive" : "secondary"
                              }
                              className="text-lg"
                            >
                              {selectedPlan.exitRisk || "Não definido"}
                            </Badge>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Nível de Risco Geral</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge
                              variant={
                                selectedPlan.riskLevel === "critico" || selectedPlan.riskLevel === "alto"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-lg"
                            >
                              {selectedPlan.riskLevel}
                            </Badge>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Tempo de Preparo</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {selectedPlan.preparationTime || "N/A"} meses
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {selectedPlan.competencyGap && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Gaps de Competências</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {selectedPlan.competencyGap}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Aba Timeline */}
                    <TabsContent value="timeline" className="space-y-4">
                      <div className="space-y-4">
                        {["imediato", "1_ano", "2_3_anos", "mais_3_anos"].map((level) => {
                          const successorsInLevel = selectedPlan.successors?.filter(
                            (s) => s.readinessLevel === level
                          );
                          
                          const levelLabels: Record<string, string> = {
                            imediato: "Curto Prazo (Imediato)",
                            "1_ano": "Médio Prazo (1 ano)",
                            "2_3_anos": "Longo Prazo (2-3 anos)",
                            "mais_3_anos": "Muito Longo Prazo (3+ anos)",
                          };

                          return (
                            <Card key={level}>
                              <CardHeader>
                                <CardTitle className="text-sm">{levelLabels[level]}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {successorsInLevel && successorsInLevel.length > 0 ? (
                                  <div className="space-y-2">
                                    {successorsInLevel.map((successor) => (
                                      <div
                                        key={successor.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                      >
                                        <span className="font-medium text-sm">
                                          {successor.employeeName}
                                        </span>
                                        <Badge variant="outline">Prioridade {successor.priority}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Nenhum sucessor neste prazo
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>

                    {/* Aba Desenvolvimento */}
                    <TabsContent value="development" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Plano de Acompanhamento</CardTitle>
                          <CardDescription>
                            Marcos e ações de desenvolvimento para os sucessores
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {selectedPlan.trackingPlan ? (
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap text-sm">
                                {selectedPlan.trackingPlan}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nenhum plano de acompanhamento definido</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {selectedPlan.nextReviewDate && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Próxima Revisão</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              {new Date(selectedPlan.nextReviewDate).toLocaleDateString("pt-BR")}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="py-24">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione um plano de sucessão para ver os detalhes</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
