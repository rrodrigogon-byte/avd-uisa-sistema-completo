import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Send } from "lucide-react";

export default function EvaluationForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: templates } = trpc.template.list.useQuery();

  const [templateId, setTemplateId] = useState<number | null>(null);
  const [evaluatedUserId, setEvaluatedUserId] = useState<number>(user?.id || 0);
  const [period, setPeriod] = useState("");
  const [comments, setComments] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const createMutation = trpc.evaluation.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação criada com sucesso!");
      utils.evaluation.list.invalidate();
      setLocation("/evaluations");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar avaliação");
    },
  });

  useEffect(() => {
    if (templateId && templates) {
      const template = templates.find((t: any) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        try {
          const structure = JSON.parse(template.structure);
          const initialResponses: Record<string, any> = {};
          structure.questions?.forEach((q: any, index: number) => {
            initialResponses[`q${index}`] = q.type === 'rating' ? 3 : '';
          });
          setResponses(initialResponses);
        } catch (e) {
          console.error("Erro ao parsear estrutura do template", e);
        }
      }
    }
  }, [templateId, templates]);

  const handleSubmit = (status: 'draft' | 'submitted') => {
    if (!templateId) {
      toast.error("Selecione um template");
      return;
    }

    if (!period.trim()) {
      toast.error("Período é obrigatório");
      return;
    }

    const score = calculateScore();

    createMutation.mutate({
      templateId,
      evaluatedUserId,
      period,
      responses: JSON.stringify(responses),
      comments,
      score,
      status,
    } as any);
  };

  const calculateScore = () => {
    if (!selectedTemplate) return 0;

    try {
      const structure = JSON.parse(selectedTemplate.structure);
      const questions = structure.questions || [];
      
      let totalWeight = 0;
      let weightedSum = 0;

      questions.forEach((q: any, index: number) => {
        const response = responses[`q${index}`];
        if (q.type === 'rating' && typeof response === 'number') {
          totalWeight += q.weight || 1;
          weightedSum += (response / 5) * 100 * (q.weight || 1);
        }
      });

      return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    } catch (e) {
      return 0;
    }
  };

  const renderQuestion = (question: any, index: number) => {
    const questionId = `q${index}`;

    switch (question.type) {
      case 'rating':
        return (
          <div key={index} className="space-y-3">
            <Label className="text-base">{question.text}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant={responses[questionId] === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResponses({ ...responses, [questionId]: rating })}
                  className="w-12"
                >
                  {rating}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">1 = Insuficiente | 5 = Excelente</p>
          </div>
        );

      case 'text':
        return (
          <div key={index} className="space-y-3">
            <Label className="text-base">{question.text}</Label>
            <Textarea
              value={responses[questionId] || ''}
              onChange={(e) => setResponses({ ...responses, [questionId]: e.target.value })}
              rows={4}
              placeholder="Digite sua resposta"
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={index} className="space-y-3">
            <Label className="text-base">{question.text}</Label>
            <div className="space-y-2">
              {question.options?.map((option: string, optIndex: number) => (
                <Button
                  key={optIndex}
                  type="button"
                  variant={responses[questionId] === option ? "default" : "outline"}
                  onClick={() => setResponses({ ...responses, [questionId]: option })}
                  className="w-full justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation("/evaluations")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nova Avaliação de Desempenho</CardTitle>
            <CardDescription>Preencha os campos abaixo para criar uma nova avaliação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Seleção de template */}
              <div>
                <Label htmlFor="template">Template de Avaliação *</Label>
                <select
                  id="template"
                  value={templateId || ''}
                  onChange={(e) => setTemplateId(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
                  required
                >
                  <option value="">Selecione um template</option>
                  {templates?.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div>
                <Label htmlFor="period">Período *</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ex: 2024-Q1, Janeiro 2024"
                  required
                />
              </div>

              {/* Perguntas do template */}
              {selectedTemplate && (
                <div className="space-y-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Perguntas da Avaliação</h3>
                  {(() => {
                    try {
                      const structure = JSON.parse(selectedTemplate.structure);
                      return structure.questions?.map((q: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            {renderQuestion(q, index)}
                          </CardContent>
                        </Card>
                      ));
                    } catch (e) {
                      return <p className="text-destructive">Erro ao carregar perguntas do template</p>;
                    }
                  })()}
                </div>
              )}

              {/* Comentários */}
              <div>
                <Label htmlFor="comments">Comentários Gerais</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Adicione observações ou comentários sobre a avaliação"
                  rows={4}
                />
              </div>

              {/* Score calculado */}
              {selectedTemplate && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Score Calculado</p>
                  <p className="text-3xl font-bold text-primary">{calculateScore()}/100</p>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/evaluations")}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={createMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit('submitted')}
                  disabled={createMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
