import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Target, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GoalsManagerProps {
  employeeId: number;
  goals: any[];
  isLoading: boolean;
}

export default function GoalsManager({ employeeId, goals, isLoading }: GoalsManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    progress: 0,
    status: "rascunho" as const,
    deadline: "",
    cycleId: 1,
    type: "individual" as const,
    category: "qualitativa" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const utils = trpc.useUtils();
  const { data: cycles } = trpc.cycles.list.useQuery();

  const createMutation = trpc.employeeProfile.createGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      utils.goals.listByEmployee.invalidate({ employeeId });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar meta");
    },
  });

  const updateMutation = trpc.employeeProfile.updateGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada com sucesso!");
      utils.goals.listByEmployee.invalidate({ employeeId });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar meta");
    },
  });

  const deleteMutation = trpc.employeeProfile.deleteGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta excluída com sucesso!");
      utils.goals.listByEmployee.invalidate({ employeeId });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir meta");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      progress: 0,
      status: "rascunho",
      deadline: "",
      cycleId: 1,
      type: "individual",
      category: "qualitativa",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      employeeId,
      title: formData.title,
      description: formData.description,
      progress: formData.progress,
      status: formData.status,
      cycleId: formData.cycleId,
      type: formData.type,
      category: formData.category,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  const handleUpdate = () => {
    if (!selectedGoal) return;

    updateMutation.mutate({
      id: selectedGoal.id,
      title: formData.title,
      description: formData.description,
      progress: formData.progress,
      status: formData.status,
      deadline: formData.deadline,
    });
  };

  const handleDelete = () => {
    if (selectedGoal) {
      deleteMutation.mutate({ id: selectedGoal.id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
        return "bg-green-50 text-green-700 border-green-200";
      case "em_andamento":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "aprovada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelada":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Metas e Objetivos</h3>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#F39200] hover:bg-[#d97f00]">
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal: any) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{goal.title || goal.specific}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getStatusColor(goal.status || "")}>
                        {goal.status || "Pendente"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setFormData({
                            title: goal.title || "",
                            description: goal.description || "",
                            progress: goal.progress || 0,
                            status: goal.status || "rascunho",
                            deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
                            cycleId: goal.cycleId || 1,
                            type: goal.type || "individual",
                            category: goal.category || "qualitativa",
                            startDate: goal.startDate ? new Date(goal.startDate).toISOString().split("T")[0] : "",
                            endDate: goal.endDate ? new Date(goal.endDate).toISOString().split("T")[0] : "",
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-semibold">{goal.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#F39200] h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">Nenhuma meta registrada</p>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#F39200] hover:bg-[#d97f00]">
                <Target className="w-4 h-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog Criar */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Aumentar vendas em 20%"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes da meta..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="equipe">Equipe</SelectItem>
                    <SelectItem value="organizacional">Organizacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantitativa">Quantitativa</SelectItem>
                    <SelectItem value="qualitativa">Qualitativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select
                value={formData.cycleId.toString()}
                onValueChange={(value) => setFormData({ ...formData, cycleId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cycles?.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Progresso (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pendente_aprovacao">Pendente Aprovação</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{selectedGoal?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
