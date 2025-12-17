import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, Edit, Trash2, Share2, Search, Filter, Users, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState<"all" | "public" | "private">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.cycles360Templates.list.useQuery();
  const { data: competencies } = trpc.competencies.list.useQuery();

  const deleteTemplate = trpc.cycles360Templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template excluído com sucesso!");
      utils.cycles360Templates.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });

  const togglePublic = trpc.cycles360Templates.update.useMutation({
    onSuccess: () => {
      toast.success("Visibilidade do template atualizada!");
      utils.cycles360Templates.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  // Filtrar templates
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVisibility = 
      filterVisibility === "all" ||
      (filterVisibility === "public" && template.isPublic) ||
      (filterVisibility === "private" && !template.isPublic);

    return matchesSearch && matchesVisibility;
  });

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleDelete = (templateId: number) => {
    if (confirm("Tem certeza que deseja excluir este template?")) {
      deleteTemplate.mutate({ id: templateId });
    }
  };

  const handleTogglePublic = (template: any) => {
    togglePublic.mutate({
      id: template.id,
      isPublic: !template.isPublic,
    });
  };

  const getCompetencyNames = (competencyIds: string) => {
    try {
      const ids = JSON.parse(competencyIds);
      return ids
        .map((id: number) => competencies?.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    } catch {
      return "N/A";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Templates 360°</h1>
          <p className="text-muted-foreground mt-2">
            Visualize, edite e compartilhe templates de configuração de ciclos de avaliação
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterVisibility} onValueChange={(value: any) => setFilterVisibility(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por visibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="public">Públicos</SelectItem>
              <SelectItem value="private">Privados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estatísticas */}
        {templates && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Templates Públicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.filter((t) => t.isPublic).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Uso Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i: any) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: any) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isPublic ? (
                      <Badge variant="default" className="ml-2">
                        <Users className="h-3 w-3 mr-1" />
                        Público
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <Lock className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Criador:</span> {template.creatorName || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Pesos:</span> Auto {template.selfWeight}% | Pares{" "}
                      {template.peerWeight}% | Sub {template.subordinateWeight}% | Gestor{" "}
                      {template.managerWeight}%
                    </div>
                    <div>
                      <span className="font-medium">Usos:</span> {template.usageCount || 0}x
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublic(template)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhum template encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Preview */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>{selectedTemplate?.description}</DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Criador:</span>{" "}
                      {selectedTemplate.creatorName || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Visibilidade:</span>{" "}
                      {selectedTemplate.isPublic ? "Público" : "Privado"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usos:</span> {selectedTemplate.usageCount || 0}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>{" "}
                      {new Date(selectedTemplate.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Configuração de Pesos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Autoavaliação:</span>
                      <span className="font-semibold">{selectedTemplate.selfWeight}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Pares:</span>
                      <span className="font-semibold">{selectedTemplate.peerWeight}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Subordinados:</span>
                      <span className="font-semibold">{selectedTemplate.subordinateWeight}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Gestor:</span>
                      <span className="font-semibold">{selectedTemplate.managerWeight}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Competências Selecionadas</h4>
                  <div className="p-3 bg-muted rounded text-sm">
                    {getCompetencyNames(selectedTemplate.competencyIds) || "Nenhuma competência"}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
