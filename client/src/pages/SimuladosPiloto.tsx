import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, User, FileText, Trash2, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SimuladosPiloto() {
  const { user, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSimulado, setSelectedSimulado] = useState<any>(null);
  const [formData, setFormData] = useState({
    pilotId: "",
    simulationType: "CHECK_RIDE" as const,
    date: "",
    location: "",
    aircraft: "",
    evaluator: "",
    score: "",
    passed: true,
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: simuladosData, isLoading } = trpc.pilotSimulations.list.useQuery({ status: "all", page: 1, limit: 100 });
  const simulados = simuladosData?.pilots || [];
  const createMutation = trpc.pilotSimulations.create.useMutation({
    onSuccess: () => {
      toast.success("Simulado criado com sucesso!");
      setIsCreateDialogOpen(false);
      utils.pilotSimulations.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar simulado: ${error.message}`);
    },
  });

  const deleteMutation = trpc.pilotSimulations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Simulado excluído com sucesso!");
      utils.pilotSimulations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir simulado: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      pilotId: "",
      simulationType: "CHECK_RIDE",
      date: "",
      location: "",
      aircraft: "",
      evaluator: "",
      score: "",
      passed: true,
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: `Simulado - ${formData.simulationType}`,
      description: formData.notes,
      targetParticipants: 30,
      startDate: new Date(formData.date),
      endDate: new Date(new Date(formData.date).getTime() + 30 * 24 * 60 * 60 * 1000),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja cancelar este simulado?")) {
      deleteMutation.mutate({ pilotId: id, status: "cancelled" });
    }
  };

  const handleView = (simulado: any) => {
    setSelectedSimulado(simulado);
    setIsViewDialogOpen(true);
  };

  const getSimulationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      CHECK_RIDE: "Check Ride",
      RECURRENT: "Recorrente",
      UPGRADE: "Upgrade",
      INITIAL: "Inicial",
    };
    return types[type] || type;
  };

  const getSimulationTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      CHECK_RIDE: "default",
      RECURRENT: "secondary",
      UPGRADE: "outline",
      INITIAL: "destructive",
    };
    return variants[type] || "default";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar autenticado para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Simulados do Piloto</h1>
          <p className="text-muted-foreground mt-2">Gerencie e acompanhe os simulados de treinamento</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Simulado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Simulado</DialogTitle>
              <DialogDescription>Preencha os dados do simulado de treinamento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pilotId">ID do Piloto *</Label>
                  <Input
                    id="pilotId"
                    type="number"
                    value={formData.pilotId}
                    onChange={(e) => setFormData({ ...formData, pilotId: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simulationType">Tipo de Simulado *</Label>
                  <Select
                    value={formData.simulationType}
                    onValueChange={(value) => setFormData({ ...formData, simulationType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECK_RIDE">Check Ride</SelectItem>
                      <SelectItem value="RECURRENT">Recorrente</SelectItem>
                      <SelectItem value="UPGRADE">Upgrade</SelectItem>
                      <SelectItem value="INITIAL">Inicial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aircraft">Aeronave *</Label>
                  <Input
                    id="aircraft"
                    value={formData.aircraft}
                    onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evaluator">Avaliador *</Label>
                  <Input
                    id="evaluator"
                    value={formData.evaluator}
                    onChange={(e) => setFormData({ ...formData, evaluator: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Pontuação (0-100) *</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passed">Resultado *</Label>
                  <Select
                    value={formData.passed ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, passed: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aprovado</SelectItem>
                      <SelectItem value="false">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Adicione observações sobre o simulado..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Simulado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : simulados && simulados.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulados.map((simulado) => (
            <Card key={simulado.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {simulado.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(simulado.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Badge variant={simulado.status === "completed" ? "default" : simulado.status === "active" ? "secondary" : "outline"}>
                    {simulado.status === "completed" ? "Concluído" : simulado.status === "active" ? "Ativo" : simulado.status === "cancelled" ? "Cancelado" : "Rascunho"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Participantes:</span>
                    <span className="font-medium">{simulado.targetParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fase:</span>
                    <span className="font-medium">{simulado.phase}</span>
                  </div>
                  {simulado.description && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Descrição:</span>
                      <span className="font-medium truncate">{simulado.description}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleView(simulado)} className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(simulado.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum simulado cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">Clique em "Novo Simulado" para começar.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Simulado</DialogTitle>
          </DialogHeader>
          {selectedSimulado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedSimulado.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{selectedSimulado.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data de Início</Label>
                  <p className="font-medium">
                    {format(new Date(selectedSimulado.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Término</Label>
                  <p className="font-medium">
                    {format(new Date(selectedSimulado.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Participantes Alvo</Label>
                  <p className="font-medium">{selectedSimulado.targetParticipants}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fase</Label>
                  <p className="font-medium">{selectedSimulado.phase}</p>
                </div>
              </div>
              {selectedSimulado.description && (
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedSimulado.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
