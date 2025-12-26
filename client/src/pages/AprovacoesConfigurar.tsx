import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Search, CheckCircle2, Settings } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Configuração de Fluxos de Aprovação
 * Permite criar e gerenciar fluxos de aprovação personalizados
 */
export default function AprovacoesConfigurar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    processType: "job_description" as const,
    scope: "global" as const,
    approvalLevels: [
      { level: 1, name: "Nível 1", roleRequired: "rh" },
    ],
    allowParallelApproval: false,
    requireComments: false,
    notifyOnEachLevel: true,
    isDefault: false,
  });

  // Queries
  const { data: flows = [], isLoading, refetch } = trpc.approvals.listFlowConfigs.useQuery(undefined);
  const { data: stats } = trpc.approvals.stats.useQuery(undefined);

  // Mutations
  const createMutation = trpc.approvals.createFlowConfig.useMutation({
    onSuccess: () => {
      toast.success("Fluxo de aprovação criado com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao criar fluxo: ${error.message}`);
    },
  });

  const updateMutation = trpc.approvals.updateFlowConfig.useMutation({
    onSuccess: () => {
      toast.success("Fluxo de aprovação atualizado com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar fluxo: ${error.message}`);
    },
  });

  // Handlers
  const openDialog = (flow?: any) => {
    if (flow) {
      setEditingFlow(flow);
      setFormData({
        name: flow.name || "",
        description: flow.description || "",
        processType: flow.processType || "job_description",
        scope: flow.scope || "global",
        approvalLevels: JSON.parse(flow.approvalLevels || "[]"),
        allowParallelApproval: flow.allowParallelApproval || false,
        requireComments: flow.requireComments || false,
        notifyOnEachLevel: flow.notifyOnEachLevel !== false,
        isDefault: flow.isDefault || false,
      });
    } else {
      setEditingFlow(null);
      setFormData({
        name: "",
        description: "",
        processType: "job_description",
        scope: "global",
        approvalLevels: [
          { level: 1, name: "Nível 1", roleRequired: "rh" },
        ],
        allowParallelApproval: false,
        requireComments: false,
        notifyOnEachLevel: true,
        isDefault: false,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFlow(null);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.approvalLevels.length === 0) {
      toast.error("Nome e pelo menos um nível de aprovação são obrigatórios");
      return;
    }

    if (editingFlow) {
      updateMutation.mutate({
        id: editingFlow.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addApprovalLevel = () => {
    setFormData({
      ...formData,
      approvalLevels: [
        ...formData.approvalLevels,
        {
          level: formData.approvalLevels.length + 1,
          name: `Nível ${formData.approvalLevels.length + 1}`,
          roleRequired: "gestor",
        },
      ],
    });
  };

  const removeApprovalLevel = (index: number) => {
    setFormData({
      ...formData,
      approvalLevels: formData.approvalLevels.filter((_, i) => i !== index),
    });
  };

  // Filtrar fluxos
  const filteredFlows = flows.filter((flow: any) =>
    flow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.processType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProcessTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      job_description: "bg-blue-100 text-blue-800",
      performance_review: "bg-green-100 text-green-800",
      salary_adjustment: "bg-yellow-100 text-yellow-800",
      promotion: "bg-purple-100 text-purple-800",
      bonus_approval: "bg-orange-100 text-orange-800",
    };

    const labels: Record<string, string> = {
      job_description: "Descrição de Cargo",
      performance_review: "Avaliação de Desempenho",
      salary_adjustment: "Ajuste Salarial",
      promotion: "Promoção",
      bonus_approval: "Aprovação de Bônus",
    };

    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuração de Aprovações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os fluxos de aprovação do sistema
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Instâncias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus?.pending || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.approved || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Fluxos */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxos de Aprovação</CardTitle>
          <CardDescription>
            Fluxos configurados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fluxos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredFlows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fluxo encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo de Processo</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Níveis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlows.map((flow: any) => {
                  const levels = JSON.parse(flow.approvalLevels || "[]");
                  return (
                    <TableRow key={flow.id}>
                      <TableCell className="font-medium">{flow.name}</TableCell>
                      <TableCell>{getProcessTypeBadge(flow.processType)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{flow.scope}</Badge>
                      </TableCell>
                      <TableCell>{levels.length} níveis</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {flow.active && (
                            <Badge variant="default">Ativo</Badge>
                          )}
                          {flow.isDefault && (
                            <Badge variant="secondary">Padrão</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(flow)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFlow ? "Editar Fluxo" : "Novo Fluxo de Aprovação"}
            </DialogTitle>
            <DialogDescription>
              Configure o fluxo de aprovação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Aprovação de Descrição de Cargo"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do fluxo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="processType">Tipo de Processo</Label>
                <Select
                  value={formData.processType}
                  onValueChange={(value: any) => setFormData({ ...formData, processType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_description">Descrição de Cargo</SelectItem>
                    <SelectItem value="performance_review">Avaliação de Desempenho</SelectItem>
                    <SelectItem value="salary_adjustment">Ajuste Salarial</SelectItem>
                    <SelectItem value="promotion">Promoção</SelectItem>
                    <SelectItem value="bonus_approval">Aprovação de Bônus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scope">Escopo</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value: any) => setFormData({ ...formData, scope: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="department">Por Departamento</SelectItem>
                    <SelectItem value="position">Por Cargo</SelectItem>
                    <SelectItem value="level">Por Nível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Níveis de Aprovação */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Níveis de Aprovação</Label>
                <Button size="sm" variant="outline" onClick={addApprovalLevel}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Nível
                </Button>
              </div>

              <div className="space-y-2">
                {formData.approvalLevels.map((level, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nome do nível"
                            value={level.name}
                            onChange={(e) => {
                              const newLevels = [...formData.approvalLevels];
                              newLevels[index].name = e.target.value;
                              setFormData({ ...formData, approvalLevels: newLevels });
                            }}
                          />
                          <Select
                            value={level.roleRequired}
                            onValueChange={(value) => {
                              const newLevels = [...formData.approvalLevels];
                              newLevels[index].roleRequired = value;
                              setFormData({ ...formData, approvalLevels: newLevels });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Papel necessário" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="rh">RH</SelectItem>
                              <SelectItem value="gestor">Gestor</SelectItem>
                              <SelectItem value="colaborador">Colaborador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.approvalLevels.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeApprovalLevel(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnEachLevel">Notificar a cada nível</Label>
                <Switch
                  id="notifyOnEachLevel"
                  checked={formData.notifyOnEachLevel}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyOnEachLevel: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireComments">Exigir comentários</Label>
                <Switch
                  id="requireComments"
                  checked={formData.requireComments}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requireComments: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isDefault">Fluxo padrão</Label>
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingFlow ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
