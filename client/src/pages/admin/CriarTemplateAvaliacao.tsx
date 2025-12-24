import { safeMap, safeFilter, safeReduce, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Question {
  id: string;
  category: string;
  questionText: string;
  questionType: "scale_1_5" | "scale_1_10" | "text" | "multiple_choice" | "yes_no";
  options?: string[];
  weight: number;
  displayOrder: number;
  isRequired: boolean;
  helpText?: string;
}

/**
 * Componente de pergunta arrastável
 */
function SortableQuestion({
  question,
  onEdit,
  onDelete,
}: {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      scale_1_5: "Escala 1-5",
      scale_1_10: "Escala 1-10",
      text: "Texto Livre",
      multiple_choice: "Múltipla Escolha",
      yes_no: "Sim/Não",
    };
    return types[type] || type;
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border rounded-lg p-4 mb-2 shadow-sm">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-move mt-1">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{question.category}</Badge>
                <Badge className="bg-blue-500 text-white">
                  {getQuestionTypeLabel(question.questionType)}
                </Badge>
                {question.isRequired && (
                  <Badge className="bg-red-500 text-white">Obrigatória</Badge>
                )}
                <span className="text-xs text-gray-500">Peso: {question.weight}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
              {question.helpText && (
                <p className="text-xs text-gray-500 mt-1">{question.helpText}</p>
              )}
              {question.options && question.options.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {question.options.map((opt: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {opt}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página de criação de template de avaliação
 */
export default function CriarTemplateAvaliacao() {
  const [, setLocation] = useLocation();

  // Estado do formulário
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState<"360" | "180" | "90" | "custom">("custom");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Estado das perguntas
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  // Estado do formulário de pergunta
  const [questionCategory, setQuestionCategory] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<Question["questionType"]>("scale_1_5");
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [questionWeight, setQuestionWeight] = useState(1);
  const [questionRequired, setQuestionRequired] = useState(true);
  const [questionHelpText, setQuestionHelpText] = useState("");

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation
  const createMutation = trpc.evaluationTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      setLocation("/admin/templates-avaliacao");
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Atualizar displayOrder
        return newItems.map((item: any, index: number) => ({ ...item, displayOrder: index }));
      });
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionCategory("");
    setQuestionText("");
    setQuestionType("scale_1_5");
    setQuestionOptions([]);
    setQuestionWeight(1);
    setQuestionRequired(true);
    setQuestionHelpText("");
    setQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionCategory(question.category);
    setQuestionText(question.questionText);
    setQuestionType(question.questionType);
    setQuestionOptions(question.options || []);
    setQuestionWeight(question.weight);
    setQuestionRequired(question.isRequired);
    setQuestionHelpText(question.helpText || "");
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionCategory || !questionText) {
      toast.error("Categoria e pergunta são obrigatórias");
      return;
    }

    const newQuestion: Question = {
      id: editingQuestion?.id || `q-${Date.now()}`,
      category: questionCategory,
      questionText,
      questionType,
      options: questionType === "multiple_choice" ? questionOptions : undefined,
      weight: questionWeight,
      displayOrder: editingQuestion?.displayOrder ?? questions.length,
      isRequired: questionRequired,
      helpText: questionHelpText || undefined,
    };

    if (editingQuestion) {
      setQuestions(questions.map((q: any) => (q.id === editingQuestion.id ? newQuestion : q)));
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setQuestionDialogOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = () => {
    if (!name) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    if (questions.length === 0) {
      toast.error("Adicione pelo menos uma pergunta");
      return;
    }

    createMutation.mutate({
      name,
      description,
      templateType,
      isActive,
      isDefault,
      questions: questions.map((q: any) => ({
        category: q.category,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        weight: q.weight,
        displayOrder: q.displayOrder,
        isRequired: q.isRequired,
        helpText: q.helpText,
      })),
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => setLocation("/admin/templates-avaliacao")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Criar Template de Avaliação</h1>
          <p className="text-gray-600 mt-1">
            Configure um questionário personalizado com perguntas customizadas
          </p>
        </div>
        <Button onClick={handleSubmit} size="lg" disabled={createMutation.isPending}>
          <Save className="h-5 w-5 mr-2" />
          {createMutation.isPending ? "Salvando..." : "Salvar Template"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações do Template */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Informações básicas do template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Avaliação de Liderança"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito deste template"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="templateType">Tipo de Avaliação</Label>
                <Select value={templateType} onValueChange={(v: any) => setTemplateType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360">360° (Completa)</SelectItem>
                    <SelectItem value="180">180° (Gestor + Auto)</SelectItem>
                    <SelectItem value="90">90° (Apenas Gestor)</SelectItem>
                    <SelectItem value="custom">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Template Ativo</Label>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isDefault">Template Padrão</Label>
                <Switch id="isDefault" checked={isDefault} onCheckedChange={setIsDefault} />
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Total de perguntas: <strong>{questions.length}</strong></div>
                  <div>Perguntas obrigatórias: <strong>{questions.filter(q => q.isRequired).length}</strong></div>
                  <div>Peso total: <strong>{questions.reduce((sum, q) => sum + q.weight, 0)}</strong></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Perguntas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perguntas do Questionário</CardTitle>
                  <CardDescription>
                    Arraste para reordenar | {questions.length} pergunta(s)
                  </CardDescription>
                </div>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhuma pergunta adicionada</p>
                  <p className="text-sm">Clique em "Adicionar Pergunta" para começar</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={questions.map((q: any) => q.id)} strategy={verticalListSortingStrategy}>
                    {questions.map((question: any) => (
                      <SortableQuestion
                        key={question.id}
                        question={question}
                        onEdit={() => handleEditQuestion(question)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Adicionar/Editar Pergunta */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Editar Pergunta" : "Adicionar Pergunta"}</DialogTitle>
            <DialogDescription>
              Configure os detalhes da pergunta do questionário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="questionCategory">Categoria *</Label>
              <Input
                id="questionCategory"
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
                placeholder="Ex: Competências, Comportamento, Resultados"
              />
            </div>

            <div>
              <Label htmlFor="questionText">Pergunta *</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="questionType">Tipo de Resposta</Label>
              <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scale_1_5">Escala 1-5</SelectItem>
                  <SelectItem value="scale_1_10">Escala 1-10</SelectItem>
                  <SelectItem value="text">Texto Livre</SelectItem>
                  <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                  <SelectItem value="yes_no">Sim/Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {questionType === "multiple_choice" && (
              <div>
                <Label>Opções (separadas por vírgula)</Label>
                <Input
                  value={questionOptions.join(", ")}
                  onChange={(e) => setQuestionOptions(e.target.value.split(",").map(s => s.trim()))}
                  placeholder="Opção 1, Opção 2, Opção 3"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionWeight">Peso</Label>
                <Input
                  id="questionWeight"
                  type="number"
                  min="1"
                  value={questionWeight}
                  onChange={(e) => setQuestionWeight(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="questionRequired">Obrigatória</Label>
                <Switch
                  id="questionRequired"
                  checked={questionRequired}
                  onCheckedChange={setQuestionRequired}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="questionHelpText">Texto de Ajuda (opcional)</Label>
              <Textarea
                id="questionHelpText"
                value={questionHelpText}
                onChange={(e) => setQuestionHelpText(e.target.value)}
                placeholder="Dica ou explicação para o avaliador"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuestion}>
              {editingQuestion ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
