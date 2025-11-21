import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Plus, Calendar, Users, CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";

interface EvaluationCycle {
  id: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  selfEvaluationDeadline: Date | null;
  managerEvaluationDeadline: Date | null;
  consensusDeadline: Date | null;
  status: "planejado" | "em_andamento" | "concluido" | "cancelado";
  active: boolean;
  createdAt: Date;
}

export default function ConfigurarAvaliacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<EvaluationCycle | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    selfEvaluationDeadline: "",
    managerEvaluationDeadline: "",
    consensusDeadline: "",
  });

  // Queries
  const { data: cycles, isLoading, refetch } = trpc.evaluationCycles.list.useQuery();

  // Mutations
  const createCycleMutation = trpc.evaluationCycles.create.useMutation({
    onSuccess: () => {
      toast.success("Ciclo de avaliação criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar ciclo");
    },
  });

  const updateCycleMutation = trpc.evaluationCycles.update.useMutation({
    onSuccess: () => {
      toast.success("Ciclo atualizado com sucesso!");
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar ciclo");
    },
  });

  const toggleActiveMutation = trpc.evaluationCycles.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status do ciclo atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const deleteCycleMutation = trpc.evaluationCycles.delete.useMutation({
    onSuccess: () => {
      toast.success("Ciclo excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir ciclo");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      selfEvaluationDeadline: "",
      managerEvaluationDeadline: "",
      consensusDeadline: "",
    });
  };

  const handleOpenDialog = (cycle?: EvaluationCycle) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        name: cycle.name,
        description: cycle.description || "",
        startDate: cycle.startDate.toISOString().split("T")[0],
        endDate: cycle.endDate.toISOString().split("T")[0],
        selfEvaluationDeadline: cycle.selfEvaluationDeadline
          ? cycle.selfEvaluationDeadline.toISOString().split("T")[0]
          : "",
        managerEvaluationDeadline: cycle.managerEvaluationDeadline
          ? cycle.managerEvaluationDeadline.toISOString().split("T")[0]
          : "",
        consensusDeadline: cycle.consensusDeadline
          ? cycle.consensusDeadline.toISOString().split("T")[0]
          : "",
      });
    } else {
      resetForm();
      setEditingCycle(null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // Validações
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("A data de início deve ser anterior à data de término");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      selfEvaluationDeadline: formData.selfEvaluationDeadline || null,
      managerEvaluationDeadline: formData.managerEvaluationDeadline || null,
      consensusDeadline: formData.consensusDeadline || null,
    };

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, ...payload });
    } else {
      createCycleMutation.mutate(payload);
    }
  };

  const handleToggleActive = (cycleId: number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id: cycleId, active: !currentStatus });
  };

  const handleDelete = (cycleId: number) => {
    if (confirm("Tem certeza que deseja excluir este ciclo de avaliação?")) {
      deleteCycleMutation.mutate({ id: cycleId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      planejado: { label: "Planejado", variant: "secondary" },
      em_andamento: { label: "Em Andamento", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-8 h-8 text-[#F39200]" />
                Configuração de Avaliações
              </h1>
              <p className="text-gray-600">Gerenciar ciclos de avaliação 360°</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-[#F39200] hover:bg-[#D68200]">
            <Plus className="w-4 h-4 mr-2" />
            Novo Ciclo
          </Button>
        </div>

        {/* Estatísticas */}
        {cycles && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Ciclos
                </CardTitle>
                <Calendar className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cycles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Em Andamento
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {cycles.filter((c: any) => c.status === "em_andamento").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Planejados
                </CardTitle>
                <Calendar className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {cycles.filter((c: any) => c.status === "planejado").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Concluídos
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-[#F39200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#F39200]">
                  {cycles.filter((c: any) => c.status === "concluido").length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Ciclos */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclos de Avaliação</CardTitle>
            <CardDescription>
              Configure prazos e etapas para cada ciclo de avaliação 360°
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200] mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando ciclos...</p>
              </div>
            ) : cycles && cycles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Prazos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cycle.name}</div>
                          {cycle.description && (
                            <div className="text-sm text-gray-500">{cycle.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(cycle.startDate).toLocaleDateString("pt-BR")}</div>
                          <div className="text-gray-500">
                            até {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {cycle.selfEvaluationDeadline && (
                            <div>
                              <span className="font-semibold">Auto:</span>{" "}
                              {new Date(cycle.selfEvaluationDeadline).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                          {cycle.managerEvaluationDeadline && (
                            <div>
                              <span className="font-semibold">Gestor:</span>{" "}
                              {new Date(cycle.managerEvaluationDeadline).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                          {cycle.consensusDeadline && (
                            <div>
                              <span className="font-semibold">Consenso:</span>{" "}
                              {new Date(cycle.consensusDeadline).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={cycle.active}
                          onCheckedChange={() => handleToggleActive(cycle.id, cycle.active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(cycle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(cycle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum ciclo de avaliação cadastrado</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="mt-4 bg-[#F39200] hover:bg-[#D68200]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Ciclo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCycle ? "Editar Ciclo de Avaliação" : "Novo Ciclo de Avaliação"}
              </DialogTitle>
              <DialogDescription>
                Configure os prazos e informações do ciclo de avaliação 360°
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome do Ciclo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Avaliação Anual 2024"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do ciclo"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data de Término *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Prazos das Etapas</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Autoavaliação</Label>
                    <Input
                      type="date"
                      value={formData.selfEvaluationDeadline}
                      onChange={(e) =>
                        setFormData({ ...formData, selfEvaluationDeadline: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Avaliação Gestor</Label>
                    <Input
                      type="date"
                      value={formData.managerEvaluationDeadline}
                      onChange={(e) =>
                        setFormData({ ...formData, managerEvaluationDeadline: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Consenso</Label>
                    <Input
                      type="date"
                      value={formData.consensusDeadline}
                      onChange={(e) =>
                        setFormData({ ...formData, consensusDeadline: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#F39200] hover:bg-[#D68200]"
                disabled={createCycleMutation.isPending || updateCycleMutation.isPending}
              >
                {editingCycle ? "Atualizar" : "Criar"} Ciclo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
