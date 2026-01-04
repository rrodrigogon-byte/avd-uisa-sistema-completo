import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, PlayCircle, PauseCircle, Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CycleStatus = "planejado" | "ativo" | "em_andamento" | "concluido" | "cancelado";

const statusConfig: Record<CycleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  planejado: { label: "Planejado", variant: "outline", color: "text-gray-600" },
  ativo: { label: "Ativo", variant: "default", color: "text-green-600" },
  em_andamento: { label: "Em Andamento", variant: "default", color: "text-blue-600" },
  concluido: { label: "Concluído", variant: "secondary", color: "text-gray-500" },
  cancelado: { label: "Cancelado", variant: "destructive", color: "text-red-600" },
};

export default function GerenciamentoCiclos() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  
  // Queries
  const { data: cycles, isLoading, refetch } = trpc.cycles.list.useQuery(undefined);
  const { data: activeCycles } = trpc.cycles.getActiveCycles.useQuery(undefined);

  // Mutations
  const createCycle = trpc.cycles.create.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    },
  });

  const activateCycle = trpc.cycles.activate.useMutation({
    onSuccess: () => {
      toast.success("Ciclo ativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao ativar ciclo: ${error.message}`);
    },
  });

  const deactivateCycle = trpc.cycles.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Ciclo desativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar ciclo: ${error.message}`);
    },
  });

  const handleActivateCycle = (cycleId: number) => {
    if (confirm("Tem certeza que deseja ativar este ciclo? Isso permitirá que os colaboradores iniciem suas avaliações.")) {
      activateCycle.mutate({ id: cycleId });
    }
  };

  const handleDeactivateCycle = (cycleId: number) => {
    if (confirm("Tem certeza que deseja desativar este ciclo? As avaliações em andamento serão pausadas.")) {
      deactivateCycle.mutate({ id: cycleId });
    }
  };

  const handleCreateCycle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      description: formData.get("description") as string,
      selfEvaluationDeadline: formData.get("selfEvaluationDeadline") as string || undefined,
      managerEvaluationDeadline: formData.get("managerEvaluationDeadline") as string || undefined,
    };

    createCycle.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedCycles = cycles?.sort((a, b) => {
    // Priorizar ciclos ativos
    if (a.status === "ativo" && b.status !== "ativo") return -1;
    if (a.status !== "ativo" && b.status === "ativo") return 1;
    // Depois por data de início (mais recente primeiro)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Ciclos</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie ciclos de avaliação de desempenho
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ciclo
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ciclos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCycles?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ciclos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycles?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planejados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycles?.filter(c => c.status === "planejado").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycles?.filter(c => c.status === "concluido").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ciclos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Todos os Ciclos</h2>
        
        {sortedCycles && sortedCycles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedCycles.map((cycle) => {
              const status = statusConfig[cycle.status as CycleStatus] || statusConfig.planejado;
              const isActive = cycle.status === "ativo" || cycle.status === "em_andamento";
              
              return (
                <Card key={cycle.id} className={isActive ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{cycle.name}</CardTitle>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <CardDescription>
                          {cycle.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {cycle.status === "planejado" && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateCycle(cycle.id)}
                            disabled={activateCycle.isLoading}
                          >
                            {activateCycle.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </Button>
                        )}
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateCycle(cycle.id)}
                            disabled={deactivateCycle.isLoading}
                          >
                            {deactivateCycle.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Início:</span>
                        <span className="font-medium">
                          {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Fim:</span>
                        <span className="font-medium">
                          {format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ano:</span>
                        <span className="font-medium">{cycle.year}</span>
                      </div>
                    </div>
                    
                    {(cycle.selfEvaluationDeadline || cycle.managerEvaluationDeadline) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Prazos:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {cycle.selfEvaluationDeadline && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Autoavaliação:</span>
                              <span className="font-medium">
                                {format(new Date(cycle.selfEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          {cycle.managerEvaluationDeadline && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Avaliação Gestor:</span>
                              <span className="font-medium">
                                {format(new Date(cycle.managerEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum ciclo cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando seu primeiro ciclo de avaliação
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Ciclo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Ciclo de Avaliação</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo ciclo de avaliação
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCycle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ciclo *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Avaliação de Desempenho 2026"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva os objetivos e escopo deste ciclo..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Prazos Opcionais</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selfEvaluationDeadline">Prazo Autoavaliação</Label>
                  <Input
                    id="selfEvaluationDeadline"
                    name="selfEvaluationDeadline"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEvaluationDeadline">Prazo Avaliação Gestor</Label>
                  <Input
                    id="managerEvaluationDeadline"
                    name="managerEvaluationDeadline"
                    type="date"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createCycle.isLoading}>
                {createCycle.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Ciclo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
