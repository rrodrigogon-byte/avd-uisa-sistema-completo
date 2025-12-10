import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventType: "",
    title: "",
    message: "",
    link: "",
    priority: "media" as "baixa" | "media" | "alta" | "critica",
    active: "yes" as "yes" | "no",
    sendEmail: "no" as "yes" | "no",
    sendPush: "yes" as "yes" | "no",
  });

  // Queries
  const { data: templates, isLoading, refetch } = trpc.notificationTemplates.list.useQuery();

  // Mutations
  const createMutation = trpc.notificationTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateMutation = trpc.notificationTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.notificationTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });

  const previewMutation = trpc.notificationTemplates.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setIsPreviewDialogOpen(true);
    },
    onError: (error) => {
      toast.error(`Erro ao gerar preview: ${error.message}`);
    },
  });

  const createDefaultsMutation = trpc.notificationTemplates.createDefaultTemplates.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} templates padrão criados com sucesso!`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar templates padrão: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      eventType: "",
      title: "",
      message: "",
      link: "",
      priority: "media",
      active: "yes",
      sendEmail: "no",
      sendPush: "yes",
    });
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este template?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      eventType: template.eventType,
      title: template.title,
      message: template.message,
      link: template.link || "",
      priority: template.priority,
      active: template.active,
      sendEmail: template.sendEmail,
      sendPush: template.sendPush,
    });
    setIsEditDialogOpen(true);
  };

  const handlePreview = () => {
    const sampleVariables = {
      nome: "João Silva",
      meta: "Aumentar vendas em 20%",
      prazo: "31/12/2025",
      dias_atraso: "5",
      tipo_avaliacao: "360°",
      link: "/avaliacoes/123",
      periodo: "2025",
      total_acoes: "10",
      nome_ciclo: "Ciclo 2025",
      data_inicio: "01/01/2025",
      data_fim: "31/12/2025",
      aprovador: "Gestor RH",
      motivo: "Meta muito genérica",
      nome_sucessor: "Julia Ferreira",
      cargo: "Gerente de Vendas",
      prontidao: "Pronto agora",
      avaliador: "Gestor Direto",
      tipo_feedback: "Positivo",
      tipo_alerta: "Baixo desempenho",
      tipo_relatorio: "PDI",
      data_geracao: "20/01/2025",
      total_registros: "45",
    };

    previewMutation.mutate({
      title: formData.title,
      message: formData.message,
      variables: sampleVariables,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica":
        return "destructive";
      case "alta":
        return "default";
      case "media":
        return "secondary";
      case "baixa":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critica":
        return <AlertCircle className="w-4 h-4" />;
      case "alta":
        return <Bell className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie templates personalizados para notificações automáticas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => createDefaultsMutation.mutate()}
            disabled={createDefaultsMutation.isPending}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Criar Templates Padrão
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {templates?.filter((t) => t.active === "yes").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com E-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templates?.filter((t) => t.sendEmail === "yes").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Push</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {templates?.filter((t) => t.sendPush === "yes").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map((template: any) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getPriorityIcon(template.priority)}
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge variant={template.active === "yes" ? "default" : "secondary"}>
                  {template.active === "yes" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Evento</p>
                  <Badge variant="outline">{template.eventType}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Título</p>
                  <p className="text-sm line-clamp-1">{template.title}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Mensagem</p>
                  <p className="text-sm line-clamp-2 text-muted-foreground">{template.message}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Badge variant={getPriorityColor(template.priority)} className="text-xs">
                    {template.priority}
                  </Badge>
                  {template.sendEmail === "yes" && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      E-mail
                    </Badge>
                  )}
                  {template.sendPush === "yes" && (
                    <Badge variant="outline" className="text-xs">
                      <Bell className="w-3 h-3 mr-1" />
                      Push
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template ou use os templates padrão
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => createDefaultsMutation.mutate()}>
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Templates Padrão
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação/Edição */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Configure o template de notificação. Use variáveis como {`{{nome}}`}, {`{{meta}}`},{" "}
              {`{{prazo}}`} para personalizar a mensagem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Meta Vencida"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Input
                id="eventType"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                placeholder="Ex: meta_vencida, avaliacao_pendente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título da Notificação</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: ⚠️ Meta Vencida: {{meta}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Ex: Olá {{nome}}, sua meta '{{meta}}' venceu em {{prazo}}."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/metas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  value={formData.active}
                  onValueChange={(value: any) => setFormData({ ...formData, active: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ativo</SelectItem>
                    <SelectItem value="no">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <Label htmlFor="sendEmail">Enviar E-mail</Label>
              </div>
              <Switch
                id="sendEmail"
                checked={formData.sendEmail === "yes"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendEmail: checked ? "yes" : "no" })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <Label htmlFor="sendPush">Enviar Push</Label>
              </div>
              <Switch
                id="sendPush"
                checked={formData.sendPush === "yes"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendPush: checked ? "yes" : "no" })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditDialogOpen ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview da Notificação</DialogTitle>
            <DialogDescription>
              Visualização com dados de exemplo
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{previewData.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{previewData.message}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
