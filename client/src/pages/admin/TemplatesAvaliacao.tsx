import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Star,
  Download,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Página de gerenciamento de templates de avaliação customizados
 */
export default function TemplatesAvaliacao() {
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Queries
  const { data: templates, isLoading, refetch } = trpc.evaluationTemplates.list.useQuery({
    onlyActive: false,
  });

  // Mutations
  const deleteMutation = trpc.evaluationTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deletado com sucesso!");
      refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar template: ${error.message}`);
    },
  });

  const duplicateMutation = trpc.evaluationTemplates.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao duplicar template: ${error.message}`);
    },
  });

  const updateMutation = trpc.evaluationTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const [exportingId, setExportingId] = useState<number | null>(null);

  const importMutation = trpc.evaluationTemplates.importTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template importado com sucesso!");
      refetch();
      setImportDialogOpen(false);
      setImportFile(null);
    },
    onError: (error) => {
      toast.error(`Erro ao importar template: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (selectedTemplateId) {
      deleteMutation.mutate({ id: selectedTemplateId });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id });
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isActive: !currentStatus,
    });
  };

  const handleToggleDefault = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isDefault: !currentStatus,
    });
  };

  const handleExport = async (id: number) => {
    try {
      setExportingId(id);
      const data = await trpc.evaluationTemplates.exportTemplate.query({ id });
      
      // Criar blob e fazer download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${data.template.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template exportado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao exportar template: ${error.message}`);
    } finally {
      setExportingId(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Selecione um arquivo JSON para importar");
      return;
    }

    try {
      const text = await importFile.text();
      importMutation.mutate({ json: text });
    } catch (error) {
      toast.error("Erro ao ler arquivo");
    }
  };

  const getTemplateTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      "360": { label: "360°", color: "bg-blue-500" },
      "180": { label: "180°", color: "bg-green-500" },
      "90": { label: "90°", color: "bg-yellow-500" },
      custom: { label: "Customizado", color: "bg-purple-500" },
    };
    const config = types[type] || types.custom;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Avaliação</h1>
          <p className="text-gray-600 mt-1">
            Crie e gerencie questionários personalizados para diferentes cargos e departamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Importar Template
          </Button>
          <Button onClick={() => setLocation("/admin/templates-avaliacao/criar")} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Templates Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {templates?.filter((t) => t.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Templates Padrão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {templates?.filter((t) => t.isDefault).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Templates 360°</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {templates?.filter((t) => t.templateType === "360").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates && templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum template criado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie seu primeiro template de avaliação customizado
            </p>
            <Button onClick={() => setLocation("/admin/templates-avaliacao/criar")}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>
        )}

        {templates?.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || "Sem descrição"}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {getTemplateTypeBadge(template.templateType)}
                {template.isActive ? (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  Criado em: {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                </div>
                {template.targetRoles && (JSON.parse(template.targetRoles as string) as any[]).length > 0 ? (
                  <div>
                    Cargos-alvo: {(JSON.parse(template.targetRoles as string) as any[]).length}
                  </div>
                ) : null}
                {template.targetDepartments &&
                  (JSON.parse(template.targetDepartments as string) as any[]).length > 0 ? (
                    <div>
                      Departamentos-alvo: {(JSON.parse(template.targetDepartments as string) as any[]).length}
                    </div>
                  ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/admin/templates-avaliacao/${template.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/admin/templates-avaliacao/${template.id}/editar`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(template.id)}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(template.id)}
                  disabled={exportingId === template.id}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {exportingId === template.id ? "Exportando..." : "Exportar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(template.id, template.isActive)}
                  disabled={updateMutation.isPending}
                >
                  {template.isActive ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                  Deletar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Importação */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Template</DialogTitle>
            <DialogDescription>
              Selecione um arquivo JSON de template para importar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo JSON
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
            {importFile && (
              <div className="text-sm text-gray-600">
                Arquivo selecionado: <span className="font-medium">{importFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialogOpen(false);
              setImportFile(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
