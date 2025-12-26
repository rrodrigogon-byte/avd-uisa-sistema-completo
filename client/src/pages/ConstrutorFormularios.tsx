import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Eye, Copy, Edit, FileText, List, AlignLeft, CheckSquare, Star } from "lucide-react";

/**
 * Página de Construtor de Formulários - ONDA 2
 * Editor visual de formulários dinâmicos com drag-and-drop
 */
export default function ConstrutorFormularios() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("templates");

  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "",
    type: "avaliacao_desempenho" as any,
    isPublic: false,
    allowComments: true,
    allowAttachments: false,
    requireAllQuestions: true,
  });

  const [sections, setSections] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Queries
  const { data: templates = [], isLoading, refetch } = trpc.formBuilder.templates.list.useQuery(undefined);

  // Mutations
  const createTemplateMutation = trpc.formBuilder.templates.create.useMutation({
    onSuccess: (data) => {
      toast.success("Template criado com sucesso!");
      setSelectedTemplate(data);
      setIsCreateDialogOpen(false);
      setActiveTab("editor");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const createSectionMutation = trpc.formBuilder.sections.create.useMutation({
    onSuccess: () => {
      toast.success("Seção adicionada com sucesso!");
      refetchSections();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar seção: ${error.message}`);
    },
  });

  const createQuestionMutation = trpc.formBuilder.questions.create.useMutation({
    onSuccess: () => {
      toast.success("Questão adicionada com sucesso!");
      refetchQuestions();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar questão: ${error.message}`);
    },
  });

  // Queries condicionais
  const { data: sectionsData = [], refetch: refetchSections } = trpc.formBuilder.sections.list.useQuery(
    { templateId: selectedTemplate?.id },
    { enabled: !!selectedTemplate?.id }
  );

  const { data: questionsData = [], refetch: refetchQuestions } = trpc.formBuilder.questions.list.useQuery(
    { sectionId: currentSection?.id },
    { enabled: !!currentSection?.id }
  );

  const handleCreateTemplate = () => {
    if (!templateForm.name) {
      toast.error("Nome do template é obrigatório");
      return;
    }
    createTemplateMutation.mutate(templateForm);
  };

  const handleAddSection = () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template primeiro");
      return;
    }

    const title = prompt("Nome da seção:");
    if (!title) return;

    createSectionMutation.mutate({
      templateId: selectedTemplate.id,
      title,
      description: "",
      order: sectionsData.length + 1,
      weight: 1,
    });
  };

  const handleAddQuestion = (type: string) => {
    if (!currentSection) {
      toast.error("Selecione uma seção primeiro");
      return;
    }

    const question = prompt("Texto da questão:");
    if (!question) return;

    const questionData: any = {
      sectionId: currentSection.id,
      question,
      description: "",
      type,
      order: questionsData.length + 1,
      required: true,
      weight: 1,
    };

    // Configurações específicas por tipo
    if (type === "multiple_choice" || type === "checkbox") {
      const options = prompt("Opções (separadas por vírgula):");
      if (options) {
        questionData.options = options.split(",").map((opt: any) => opt.trim());
      }
    } else if (type === "scale") {
      questionData.minValue = 1;
      questionData.maxValue = 5;
      questionData.minLabel = "Discordo totalmente";
      questionData.maxLabel = "Concordo totalmente";
    }

    createQuestionMutation.mutate(questionData);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      text: <AlignLeft className="h-4 w-4" />,
      textarea: <FileText className="h-4 w-4" />,
      multiple_choice: <List className="h-4 w-4" />,
      checkbox: <CheckSquare className="h-4 w-4" />,
      scale: <Star className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      avaliacao_desempenho: "Avaliação de Desempenho",
      feedback: "Feedback",
      competencias: "Competências",
      metas: "Metas",
      pdi: "PDI",
      outro: "Outro",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Construtor de Formulários</h1>
            <p className="text-muted-foreground">Crie formulários dinâmicos para avaliações e pesquisas</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="editor" disabled={!selectedTemplate}>
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplate}>
              Pré-visualização
            </TabsTrigger>
          </TabsList>

          {/* Tab: Templates */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 text-center py-8">Carregando...</div>
              ) : templates.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  Nenhum template encontrado. Crie seu primeiro template!
                </div>
              ) : (
                templates.map((template: any) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setActiveTab("editor");
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description || "Sem descrição"}
                          </CardDescription>
                        </div>
                        {getTypeBadge(template.type)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {template.isPublic ? "Público" : "Privado"}
                        </span>
                        <span>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab: Editor */}
          <TabsContent value="editor">
            {selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Seções */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Seções</CardTitle>
                        <Button size="sm" onClick={handleAddSection}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sectionsData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma seção adicionada
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sectionsData.map((section: any) => (
                            <div
                              key={section.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                currentSection?.id === section.id
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => setCurrentSection(section)}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{section.title}</p>
                                  {section.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {section.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Painel de Questões */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {currentSection ? currentSection.title : "Selecione uma seção"}
                          </CardTitle>
                          {currentSection?.description && (
                            <CardDescription>{currentSection.description}</CardDescription>
                          )}
                        </div>
                        {currentSection && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddQuestion("text")}
                            >
                              Texto
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddQuestion("multiple_choice")}
                            >
                              Múltipla Escolha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddQuestion("scale")}
                            >
                              Escala
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!currentSection ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Selecione uma seção para adicionar questões
                        </p>
                      ) : questionsData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhuma questão adicionada nesta seção
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {questionsData.map((question: any, index: number) => (
                            <div
                              key={question.id}
                              className="p-4 rounded-lg border bg-card"
                            >
                              <div className="flex items-start gap-3">
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(question.type)}
                                      <span className="font-medium">
                                        {index + 1}. {question.question}
                                      </span>
                                      {question.required && (
                                        <Badge variant="destructive" className="text-xs">
                                          Obrigatória
                                        </Badge>
                                      )}
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {question.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {question.description}
                                    </p>
                                  )}
                                  {question.type === "multiple_choice" && question.options && (
                                    <div className="mt-2 space-y-1">
                                      {question.options.map((option: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {question.type === "scale" && (
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        {question.minLabel || "Mínimo"}
                                      </span>
                                      <div className="flex gap-2">
                                        {Array.from(
                                          { length: (question.maxValue || 5) - (question.minValue || 1) + 1 },
                                          (_, i) => i + (question.minValue || 1)
                                        ).map((num: any) => (
                                          <div
                                            key={num}
                                            className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center"
                                          >
                                            {num}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-muted-foreground">
                                        {question.maxLabel || "Máximo"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Preview */}
          <TabsContent value="preview">
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Pré-visualização do Formulário</CardTitle>
                  <CardDescription>
                    Veja como o formulário será exibido para os usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
                      {selectedTemplate.description && (
                        <p className="text-muted-foreground">{selectedTemplate.description}</p>
                      )}
                    </div>

                    {sectionsData.map((section: any) => (
                      <div key={section.id} className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="text-xl font-semibold">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                        {/* Aqui viriam as questões renderizadas */}
                        <p className="text-sm text-muted-foreground italic">
                          As questões desta seção serão exibidas aqui
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Criação de Template */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Configure um novo template de formulário
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Ex: Avaliação de Desempenho Anual"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Descreva o objetivo deste formulário"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Formulário</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avaliacao_desempenho">Avaliação de Desempenho</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="competencias">Competências</SelectItem>
                    <SelectItem value="metas">Metas</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  placeholder="Ex: RH, Gestão, Operacional"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={templateForm.isPublic}
                  onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })}
                />
                <Label htmlFor="isPublic">Template público (visível para todos)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? "Criando..." : "Criar Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
