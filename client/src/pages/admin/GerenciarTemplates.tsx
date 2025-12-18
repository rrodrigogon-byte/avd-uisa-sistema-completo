import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Target,
  TrendingUp,
  Award,
  Briefcase,
  GraduationCap,
  BarChart3,
  Loader2,
} from "lucide-react";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";

const iconMap: Record<string, any> = {
  Target,
  TrendingUp,
  Award,
  Briefcase,
  GraduationCap,
  BarChart3,
};

const targetTypeLabels = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  lideranca: "Liderança",
  resultado: "Resultado",
  desenvolvimento: "Desenvolvimento",
};

const difficultyLabels = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const difficultyColors = {
  basico: "bg-green-100 text-green-800",
  intermediario: "bg-yellow-100 text-yellow-800",
  avancado: "bg-red-100 text-red-800",
};

export default function GerenciarTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Queries
  const { data: categories = [], isLoading: loadingCategories } = trpc.goalTemplates.listCategories.useQuery();
  const { data: templates = [], isLoading: loadingTemplates } = trpc.goalTemplates.listTemplates.useQuery({
    categoryId: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
    targetType: selectedTargetType !== "all" ? selectedTargetType as any : undefined,
  });
  const { data: stats } = trpc.goalTemplates.getTemplateStats.useQuery();

  // Mutations
  const utils = trpc.useUtils();
  const createCategory = trpc.goalTemplates.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      utils.goalTemplates.listCategories.invalidate();
      setShowCategoryDialog(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });

  const createTemplate = trpc.goalTemplates.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      utils.goalTemplates.listTemplates.invalidate();
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateTemplate = trpc.goalTemplates.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      utils.goalTemplates.listTemplates.invalidate();
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const deleteTemplate = trpc.goalTemplates.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template removido com sucesso!");
      utils.goalTemplates.listTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover template: ${error.message}`);
    },
  });

  // Filtrar templates
  const filteredTemplates = safeMap(templates, (t: any) => t).filter((template: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(search) ||
      template.description?.toLowerCase().includes(search)
    );
  });

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createCategory.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    });
  };

  const handleSaveTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const templateData = {
      categoryId: parseInt(formData.get("categoryId") as string),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      targetType: formData.get("targetType") as any,
      difficultyLevel: formData.get("difficultyLevel") as any,
      suggestedDurationMonths: parseInt(formData.get("suggestedDurationMonths") as string) || 3,
      metrics: {
        specific: formData.get("specific") as string,
        measurable: formData.get("measurable") as string,
        achievable: formData.get("achievable") as string,
        relevant: formData.get("relevant") as string,
        timeBound: formData.get("timeBound") as string,
      },
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...templateData });
    } else {
      createTemplate.mutate(templateData);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Tem certeza que deseja remover este template?")) {
      deleteTemplate.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Templates de Metas</h1>
          <p className="text-muted-foreground">
            Crie e organize templates de metas para facilitar a criação de PDIs
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeTemplates} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Organizadas por tipo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage}</div>
                <p className="text-xs text-muted-foreground">
                  Templates utilizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.avgSuccessRate)}%</div>
                <p className="text-xs text-muted-foreground">
                  Média de conclusão
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          {/* Aba de Templates */}
          <TabsContent value="templates" className="space-y-6">
            {/* Filtros e Ações */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Templates de Metas</CardTitle>
                    <CardDescription>
                      Gerencie templates pré-configurados para criação de metas
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                      setShowTemplateDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {safeMap(categories, (cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTargetType} onValueChange={setSelectedTargetType}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {Object.entries(targetTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isEmpty(filteredTemplates) ? (
                  <div className="text-center py-12">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Tente ajustar os filtros de busca"
                        : "Comece criando seu primeiro template"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setShowTemplateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Template
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Dificuldade</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Taxa Sucesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeMap(filteredTemplates, (template: any) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            {template.category ? (
                              <Badge variant="outline">{template.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {targetTypeLabels[template.targetType as keyof typeof targetTypeLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={difficultyColors[template.difficultyLevel as keyof typeof difficultyColors]}>
                              {difficultyLabels[template.difficultyLevel as keyof typeof difficultyLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>{template.suggestedDurationMonths} meses</TableCell>
                          <TableCell>{template.usageCount}</TableCell>
                          <TableCell>{template.successRate}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Categorias */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categorias</CardTitle>
                    <CardDescription>
                      Organize templates em categorias temáticas
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCategoryDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isEmpty(categories) ? (
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma categoria criada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie categorias para organizar seus templates
                    </p>
                    <Button onClick={() => setShowCategoryDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Categoria
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {safeMap(categories, (category: any) => {
                      const Icon = iconMap[category.icon || "Target"] || Target;
                      return (
                        <Card key={category.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{category.name}</CardTitle>
                                  <CardDescription className="text-sm mt-1">
                                    {category.description || "Sem descrição"}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Categoria */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                Crie uma categoria para organizar templates de metas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCategory}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCategory?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCategory?.description}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ícone</Label>
                  <Select name="icon" defaultValue={editingCategory?.icon || "Target"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconMap).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          {iconName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                  <Input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    defaultValue={editingCategory?.displayOrder || 0}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategoryDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Template */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Configure um template de meta com critérios SMART
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTemplate}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingTemplate?.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select
                      name="categoryId"
                      defaultValue={editingTemplate?.categoryId?.toString()}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {safeMap(categories, (cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingTemplate?.description}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="targetType">Tipo de Meta</Label>
                    <Select
                      name="targetType"
                      defaultValue={editingTemplate?.targetType}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(targetTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficultyLevel">Dificuldade</Label>
                    <Select
                      name="difficultyLevel"
                      defaultValue={editingTemplate?.difficultyLevel || "intermediario"}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(difficultyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="suggestedDurationMonths">Duração (meses)</Label>
                    <Input
                      id="suggestedDurationMonths"
                      name="suggestedDurationMonths"
                      type="number"
                      min="1"
                      defaultValue={editingTemplate?.suggestedDurationMonths || 3}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Critérios SMART</h4>
                  <div>
                    <Label htmlFor="specific">Específico (S)</Label>
                    <Textarea
                      id="specific"
                      name="specific"
                      placeholder="O que exatamente será alcançado?"
                      defaultValue={editingTemplate?.metrics?.specific}
                    />
                  </div>
                  <div>
                    <Label htmlFor="measurable">Mensurável (M)</Label>
                    <Textarea
                      id="measurable"
                      name="measurable"
                      placeholder="Como o progresso será medido?"
                      defaultValue={editingTemplate?.metrics?.measurable}
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievable">Alcançável (A)</Label>
                    <Textarea
                      id="achievable"
                      name="achievable"
                      placeholder="É realista e possível de alcançar?"
                      defaultValue={editingTemplate?.metrics?.achievable}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relevant">Relevante (R)</Label>
                    <Textarea
                      id="relevant"
                      name="relevant"
                      placeholder="Por que esta meta é importante?"
                      defaultValue={editingTemplate?.metrics?.relevant}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeBound">Temporal (T)</Label>
                    <Textarea
                      id="timeBound"
                      name="timeBound"
                      placeholder="Qual o prazo para conclusão?"
                      defaultValue={editingTemplate?.metrics?.timeBound}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTemplateDialog(false);
                    setEditingTemplate(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTemplate.isPending || updateTemplate.isPending}
                >
                  {(createTemplate.isPending || updateTemplate.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
