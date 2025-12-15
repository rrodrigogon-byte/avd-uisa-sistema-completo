import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multiple_choice';
  weight: number;
  options?: string[];
}

export default function TemplateForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', type: 'rating', weight: 1 }
  ]);

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      utils.template.list.invalidate();
      setLocation("/templates");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar template");
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      text: '',
      type: 'rating',
      weight: 1
    }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    if (questions.length === 0) {
      toast.error("Adicione pelo menos uma pergunta");
      return;
    }

    const invalidQuestions = questions.filter(q => !q.text.trim());
    if (invalidQuestions.length > 0) {
      toast.error("Todas as perguntas devem ter um texto");
      return;
    }

    const structure = JSON.stringify({
      questions: questions.map(q => ({
        text: q.text,
        type: q.type,
        weight: q.weight,
        options: q.options
      }))
    });

    createMutation.mutate({
      name,
      description,
      structure,
      isActive,
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Acesso restrito a administradores</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/templates")}>
                Voltar para Templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation("/templates")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Novo Template de Avaliação</CardTitle>
            <CardDescription>Crie um template reutilizável para avaliações de desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Avaliação de Desempenho Trimestral"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o propósito e contexto deste template"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Template Ativo</Label>
                    <p className="text-sm text-muted-foreground">Disponível para uso em novas avaliações</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              {/* Perguntas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Perguntas do Template</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </div>

                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label htmlFor={`question-${question.id}`}>Pergunta {index + 1} *</Label>
                            <Textarea
                              id={`question-${question.id}`}
                              value={question.text}
                              onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                              placeholder="Digite a pergunta da avaliação"
                              rows={2}
                              required
                            />
                          </div>
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(question.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`type-${question.id}`}>Tipo de Resposta</Label>
                            <select
                              id={`type-${question.id}`}
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            >
                              <option value="rating">Avaliação (1-5)</option>
                              <option value="text">Texto Livre</option>
                              <option value="multiple_choice">Múltipla Escolha</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`weight-${question.id}`}>Peso (%)</Label>
                            <Input
                              id={`weight-${question.id}`}
                              type="number"
                              min="1"
                              max="100"
                              value={question.weight}
                              onChange={(e) => updateQuestion(question.id, 'weight', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/templates")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Salvando..." : "Salvar Template"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
