import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle2, Clock, Loader2, Pause, Play, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Página de Gestão de Ciclos de Avaliação
 * CRUD completo para criar e gerenciar ciclos anuais/semestrais/trimestrais
 */
export default function CiclosAvaliacao() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    type: "anual" as "anual" | "semestral" | "trimestral",
    startDate: "",
    endDate: "",
    selfEvaluationDeadline: "",
    managerEvaluationDeadline: "",
    consensusDeadline: "",
    description: "",
  });

  const { data: cycles, isLoading, refetch } = trpc.evaluationCycles.list.useQuery();

  const createMutation = trpc.evaluationCycles.create.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
      setFormData({
        name: "",
        year: new Date().getFullYear(),
        type: "anual",
        startDate: "",
        endDate: "",
        selfEvaluationDeadline: "",
        managerEvaluationDeadline: "",
        consensusDeadline: "",
        description: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    },
  });

  const activateMutation = trpc.evaluationCycles.activate.useMutation({
    onSuccess: () => {
      toast.success("Ciclo ativado!");
      refetch();
    },
  });

  const deactivateMutation = trpc.evaluationCycles.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Ciclo desativado!");
      refetch();
    },
  });

  const completeMutation = trpc.evaluationCycles.complete.useMutation({
    onSuccess: () => {
      toast.success("Ciclo concluído!");
      refetch();
    },
  });

  const deleteMutation = trpc.evaluationCycles.delete.useMutation({
    onSuccess: () => {
      toast.success("Ciclo deletado!");
      refetch();
    },
  });

  const approveForGoalsMutation = trpc.evaluationCycles.approveForGoals.useMutation({
    onSuccess: () => {
      toast.success("Ciclo aprovado para preenchimento de metas! Funcionários já podem criar suas metas.");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar ciclo: ${error.message}`);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planejamento: { label: "Planejamento", variant: "secondary" as const, icon: Clock },
      em_andamento: { label: "Em Andamento", variant: "default" as const, icon: Play },
      concluido: { label: "Concluído", variant: "outline" as const, icon: CheckCircle2 },
      cancelado: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.planejamento;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      anual: { label: "Anual", color: "bg-blue-100 text-blue-800" },
      semestral: { label: "Semestral", color: "bg-green-100 text-green-800" },
      trimestral: { label: "Trimestral", color: "bg-purple-100 text-purple-800" },
    };

    const config = typeMap[type as keyof typeof typeMap] || typeMap.anual;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ciclos de Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie ciclos anuais, semestrais ou trimestrais de avaliação 360°
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Ciclo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Ciclo de Avaliação</DialogTitle>
              <DialogDescription>
                Defina o período, tipo e prazos de cada etapa do ciclo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ciclo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Avaliação Anual 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Ciclo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Prazos por Etapa do Fluxo 360°</h3>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="selfDeadline">Prazo Autoavaliação</Label>
                    <Input
                      id="selfDeadline"
                      type="date"
                      value={formData.selfEvaluationDeadline}
                      onChange={(e) => setFormData({ ...formData, selfEvaluationDeadline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerDeadline">Prazo Avaliação do Gestor</Label>
                    <Input
                      id="managerDeadline"
                      type="date"
                      value={formData.managerEvaluationDeadline}
                      onChange={(e) => setFormData({ ...formData, managerEvaluationDeadline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consensusDeadline">Prazo Consenso do Líder</Label>
                    <Input
                      id="consensusDeadline"
                      type="date"
                      value={formData.consensusDeadline}
                      onChange={(e) => setFormData({ ...formData, consensusDeadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos e escopo deste ciclo..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Ciclo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Ciclos */}
      <div className="grid gap-4">
        {cycles && cycles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum ciclo criado ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Novo Ciclo" para começar
              </p>
            </CardContent>
          </Card>
        )}

        {cycles?.map((cycle) => (
          <Card key={cycle.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{cycle.name}</CardTitle>
                    {getTypeBadge(cycle.type)}
                    {getStatusBadge(cycle.status)}
                  </div>
                  <CardDescription>
                    {new Date(cycle.startDate).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  {cycle.status === "planejamento" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => activateMutation.mutate({ id: cycle.id })}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                  )}

                  {cycle.status === "em_andamento" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeMutation.mutate({ id: cycle.id })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateMutation.mutate({ id: cycle.id })}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}

                  {cycle.status === "concluido" && (
                    <>
                      {!cycle.approvedForGoals && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            if (confirm("Aprovar este ciclo para preenchimento de metas pelos funcionários?")) {
                              approveForGoalsMutation.mutate({ id: cycle.id });
                            }
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar para Metas
                        </Button>
                      )}
                      {cycle.approvedForGoals && (
                        <Badge variant="default" className="text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aprovado para Metas
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja deletar este ciclo?")) {
                            deleteMutation.mutate({ id: cycle.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deletar
                      </Button>
                    </>
                  )}
                  {cycle.status === "cancelado" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja deletar este ciclo?")) {
                          deleteMutation.mutate({ id: cycle.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {cycle.description && (
                <p className="text-sm text-muted-foreground mb-4">{cycle.description}</p>
              )}

              {(cycle.selfEvaluationDeadline || cycle.managerEvaluationDeadline || cycle.consensusDeadline) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Prazos por Etapa:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {cycle.selfEvaluationDeadline && (
                      <div>
                        <span className="text-muted-foreground">Autoavaliação:</span>
                        <p className="font-medium">
                          {new Date(cycle.selfEvaluationDeadline).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                    {cycle.managerEvaluationDeadline && (
                      <div>
                        <span className="text-muted-foreground">Gestor:</span>
                        <p className="font-medium">
                          {new Date(cycle.managerEvaluationDeadline).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                    {cycle.consensusDeadline && (
                      <div>
                        <span className="text-muted-foreground">Consenso:</span>
                        <p className="font-medium">
                          {new Date(cycle.consensusDeadline).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
