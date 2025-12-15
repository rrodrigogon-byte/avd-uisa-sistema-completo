import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Página de edição de template de avaliação
 */
export default function EditarTemplateAvaliacao() {
  const [, params] = useRoute("/admin/templates-avaliacao/:id/editar");
  const [, setLocation] = useLocation();
  const templateId = params?.id ? parseInt(params.id) : 0;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    templateType: "standard" as "standard" | "360" | "performance",
    hierarchyLevel: "" as "operacional" | "coordenacao" | "gerencia" | "diretoria" | "",
    isActive: true,
    isDefault: false,
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const { data: template, isLoading } = trpc.evaluationTemplates.getById.useQuery(
    { id: templateId },
    { enabled: templateId > 0 }
  );

  const updateMutation = trpc.evaluationTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      setLocation(`/admin/templates-avaliacao/${templateId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        templateType: (template.templateType as any) || "standard",
        hierarchyLevel: (template.hierarchyLevel as any) || "",
        isActive: template.isActive,
        isDefault: template.isDefault,
      });
      setQuestions(template.questions || []);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    updateMutation.mutate({
      id: templateId,
      ...formData,
      hierarchyLevel: formData.hierarchyLevel || undefined,
    });
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(), // Temporary ID
        questionText: "",
        questionType: "rating",
        isRequired: false,
        weight: 1,
        displayOrder: questions.length + 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Template não encontrado
            </h3>
            <Button onClick={() => setLocation("/admin/templates-avaliacao")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation(`/admin/templates-avaliacao/${templateId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Template</h1>
            <p className="text-gray-600 mt-1">Atualize as informações do template</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Configure os dados principais do template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Avaliação de Desempenho Anual"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste template"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateType">Tipo de Template</Label>
                <Select
                  value={formData.templateType}
                  onValueChange={(value: any) => setFormData({ ...formData, templateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão</SelectItem>
                    <SelectItem value="360">Avaliação 360°</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hierarchyLevel">Nível Hierárquico</Label>
                <Select
                  value={formData.hierarchyLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, hierarchyLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="coordenacao">Coordenação</SelectItem>
                    <SelectItem value="gerencia">Gerência</SelectItem>
                    <SelectItem value="diretoria">Diretoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="isActive">Template Ativo</Label>
                <p className="text-sm text-gray-600">
                  Templates ativos podem ser usados em avaliações
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="isDefault">Template Padrão</Label>
                <p className="text-sm text-gray-600">
                  Template padrão será sugerido automaticamente
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Perguntas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Perguntas do Template</CardTitle>
                <CardDescription>
                  Configure as perguntas que farão parte deste template
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma pergunta adicionada ainda</p>
                <p className="text-sm mt-1">Clique em "Adicionar Pergunta" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-sm font-medium text-gray-500">
                        Questão {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Texto da Pergunta</Label>
                        <Textarea
                          value={question.questionText}
                          onChange={(e) =>
                            handleQuestionChange(index, "questionText", e.target.value)
                          }
                          placeholder="Digite a pergunta..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={question.questionType}
                            onValueChange={(value) =>
                              handleQuestionChange(index, "questionType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">Escala</SelectItem>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Peso</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={question.weight}
                            onChange={(e) =>
                              handleQuestionChange(index, "weight", parseInt(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.isRequired}
                          onCheckedChange={(checked) =>
                            handleQuestionChange(index, "isRequired", checked)
                          }
                        />
                        <Label>Pergunta obrigatória</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(`/admin/templates-avaliacao/${templateId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
