import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, GitBranch, Users, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BonusWorkflows() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const { data: workflows, isLoading, refetch } = trpc.bonusWorkflow.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();

  const createWorkflow = trpc.bonusWorkflow.create.useMutation({
    onSuccess: () => {
      toast.success("Workflow criado com sucesso!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar workflow: ${error.message}`);
    },
  });

  const deleteWorkflow = trpc.bonusWorkflow.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minValue: 0,
    maxValue: null as number | null,
    departmentId: null as number | null,
    levels: [
      { levelOrder: 1, approverRole: "gestor_direto", requiresComment: false, requiresEvidence: false, timeoutDays: 3 },
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkflow.mutate(formData as any);
  };

  const addLevel = () => {
    setFormData({
      ...formData,
      levels: [
        ...formData.levels,
        {
          levelOrder: formData.levels.length + 1,
          approverRole: "gerente",
          requiresComment: false,
          requiresEvidence: false,
          timeoutDays: 3,
        },
      ],
    });
  };

  const removeLevel = (index: number) => {
    setFormData({
      ...formData,
      levels: formData.levels.filter((_, i) => i !== index),
    });
  };

  const updateLevel = (index: number, field: string, value: any) => {
    const newLevels = [...formData.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setFormData({ ...formData, levels: newLevels });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflows de Aprovação de Bônus</h1>
          <p className="text-muted-foreground">
            Configure workflows multinível para aprovação de bônus
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Workflow de Aprovação</DialogTitle>
              <DialogDescription>
                Configure os níveis de aprovação e regras do workflow
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Workflow</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Aprovação Padrão de Bônus"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva quando este workflow deve ser aplicado"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
                    <Input
                      id="minValue"
                      type="number"
                      value={formData.minValue}
                      onChange={(e) => setFormData({ ...formData, minValue: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      value={formData.maxValue || ""}
                      onChange={(e) => setFormData({ ...formData, maxValue: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Sem limite"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="department">Departamento (Opcional)</Label>
                  <Select
                    value={formData.departmentId?.toString() || "all"}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value === "all" ? null : Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os departamentos</SelectItem>
                      {departments?.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Níveis de Aprovação</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLevel}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Nível
                  </Button>
                </div>

                {formData.levels.map((level, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Nível {level.levelOrder}</CardTitle>
                        {formData.levels.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLevel(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Papel do Aprovador</Label>
                        <Select
                          value={level.approverRole}
                          onValueChange={(value) => updateLevel(index, "approverRole", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gestor_direto">Gestor Direto</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="diretor">Diretor</SelectItem>
                            <SelectItem value="diretor_gente">Diretor de Gente</SelectItem>
                            <SelectItem value="cfo">CFO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Prazo (dias)</Label>
                        <Input
                          type="number"
                          value={level.timeoutDays}
                          onChange={(e) => updateLevel(index, "timeoutDays", Number(e.target.value))}
                          min="1"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={level.requiresComment}
                            onChange={(e) => updateLevel(index, "requiresComment", e.target.checked)}
                            className="rounded"
                          />
                          Comentário obrigatório
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={level.requiresEvidence}
                            onChange={(e) => updateLevel(index, "requiresEvidence", e.target.checked)}
                            className="rounded"
                          />
                          Evidência obrigatória
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createWorkflow.isPending}>
                  {createWorkflow.isPending ? "Criando..." : "Criar Workflow"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows?.filter((w: any) => w.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Níveis Médios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows && workflows.length > 0
                ? Math.round(workflows.reduce((sum: number, w: any) => sum + (w.levelCount || 0), 0) / workflows.length)
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa Máxima</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {workflows && workflows.length > 0
                ? Math.max(...workflows.map((w: any) => w.maxValue || 0)).toLocaleString()
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Workflows */}
      <div className="space-y-4">
        {workflows?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum workflow configurado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seu primeiro workflow de aprovação de bônus
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          workflows?.map((workflow: any) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription>{workflow.description || "Sem descrição"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Deseja realmente excluir este workflow?")) {
                          deleteWorkflow.mutate(workflow.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Faixa de Valores</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {workflow.minValue?.toLocaleString() || 0} - {workflow.maxValue ? `R$ ${workflow.maxValue.toLocaleString()}` : "Sem limite"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Departamento</p>
                    <p className="text-sm text-muted-foreground">
                      {workflow.departmentName || "Todos"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Níveis de Aprovação</p>
                    <p className="text-sm text-muted-foreground">
                      {workflow.levelCount || 0} níveis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
