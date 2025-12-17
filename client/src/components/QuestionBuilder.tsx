import { Button } from "@/components/ui/button";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type QuestionType = "multipla_escolha" | "dissertativa" | "escala" | "sim_nao" | "nota";

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  options?: QuestionOption[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  readOnly?: boolean;
}

export function QuestionBuilder({ questions, onChange, readOnly = false }: QuestionBuilderProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: "escala",
      title: "",
      required: true,
      weight: 1,
      minValue: 1,
      maxValue: 5,
      minLabel: "Discordo totalmente",
      maxLabel: "Concordo totalmente",
    };
    onChange([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    const safeQuestions = ensureArray(questions);
    onChange(safeFilter(safeQuestions, q => q.id !== id));
    toast.success("Questão removida");
  };

  const duplicateQuestion = (question: Question) => {
    const duplicate: Question = {
      ...question,
      id: `q-${Date.now()}`,
      title: `${question.title} (cópia)`,
    };
    const index = questions.findIndex(q => q.id === question.id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    onChange(newQuestions);
    toast.success("Questão duplicada");
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    onChange(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: "",
      value: (question.options?.length || 0) + 1,
    };

    updateQuestion(questionId, {
      options: [...(question.options || []), newOption],
    });
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    updateQuestion(questionId, {
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const safeOptions = ensureArray(question.options);
    updateQuestion(questionId, {
      options: safeFilter(safeOptions, opt => opt.id !== optionId),
    });
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels: Record<QuestionType, string> = {
      multipla_escolha: "Múltipla Escolha",
      dissertativa: "Dissertativa",
      escala: "Escala Likert",
      sim_nao: "Sim/Não",
      nota: "Nota (0-10)",
    };
    return labels[type];
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                {!readOnly && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Questão {index + 1}
                    </span>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(question.id, { type: value as QuestionType })}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="escala">Escala Likert</SelectItem>
                        <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                        <SelectItem value="dissertativa">Dissertativa</SelectItem>
                        <SelectItem value="sim_nao">Sim/Não</SelectItem>
                        <SelectItem value="nota">Nota (0-10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Título da questão"
                    value={question.title}
                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    disabled={readOnly}
                    className="font-medium"
                  />
                  <Textarea
                    placeholder="Descrição ou contexto (opcional)"
                    value={question.description || ""}
                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                    disabled={readOnly}
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateQuestion(question)}
                    title="Duplicar questão"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    title="Remover questão"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Opções para Múltipla Escolha */}
            {question.type === "multipla_escolha" && (
              <div className="space-y-2">
                <Label>Opções de Resposta</Label>
                {question.options?.map((option, idx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                    <Input
                      placeholder={`Opção ${idx + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(question.id, option.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(question.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                )}
              </div>
            )}

            {/* Configuração de Escala */}
            {question.type === "escala" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    value={question.minValue || 1}
                    onChange={(e) => updateQuestion(question.id, { minValue: parseInt(e.target.value) })}
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Rótulo mínimo"
                    value={question.minLabel || ""}
                    onChange={(e) => updateQuestion(question.id, { minLabel: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    value={question.maxValue || 5}
                    onChange={(e) => updateQuestion(question.id, { maxValue: parseInt(e.target.value) })}
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Rótulo máximo"
                    value={question.maxLabel || ""}
                    onChange={(e) => updateQuestion(question.id, { maxLabel: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}

            {/* Configurações Gerais */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                    disabled={readOnly}
                  />
                  <Label className="text-sm">Obrigatória</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Peso:</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={question.weight}
                    onChange={(e) => updateQuestion(question.id, { weight: parseFloat(e.target.value) })}
                    disabled={readOnly}
                    className="w-20 h-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {!readOnly && (
        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Questão
        </Button>
      )}

      {questions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma questão adicionada ainda
            </p>
            {!readOnly && (
              <Button onClick={addQuestion} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Questão
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
