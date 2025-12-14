import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface CompetencyScore {
  name: string;
  description: string;
  weight: number;
  score: number;
}

export default function EditEvaluation() {
  const [, params] = useRoute("/evaluations/edit/:id");
  const evaluationId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [period, setPeriod] = useState("");
  const [comments, setComments] = useState("");
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: evaluation, isLoading: loadingEvaluation } = trpc.evaluation.getById.useQuery(
    { id: evaluationId! },
    { enabled: !!evaluationId }
  );

  // Employee list não está implementado no router
  const employees: any[] = [];
  const { data: templates } = trpc.template.list.useQuery();

  const updateMutation = trpc.evaluation.update.useMutation({
    onSuccess: () => {
      toast.success("Avaliação atualizada com sucesso!");
      navigate("/evaluations");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar avaliação: " + error.message);
    },
  });

  useEffect(() => {
    if (evaluation) {
      setEmployeeId(evaluation.evaluatedUserId);
      setTemplateId(evaluation.templateId);
      setPeriod(evaluation.period);
      setComments(evaluation.comments || "");

      if (evaluation.responses && typeof evaluation.responses === 'string') {
        try {
          const parsed = JSON.parse(evaluation.responses);
          if (Array.isArray(parsed)) {
            setCompetencyScores(parsed);
          }
        } catch (e) {
          console.error("Erro ao parsear scores:", e);
        }
      }
    }
  }, [evaluation]);

  useEffect(() => {
    if (templateId && templates) {
      const selectedTemplate = templates.find((t) => t.id === templateId);
      if (selectedTemplate?.structure && typeof selectedTemplate.structure === 'string') {
        try {
          const parsed = JSON.parse(selectedTemplate.structure);
          if (Array.isArray(parsed)) {
            const existingScores = competencyScores.reduce((acc, score) => {
              acc[score.name] = score.score;
              return acc;
            }, {} as Record<string, number>);

            setCompetencyScores(
              parsed.map((comp) => ({
                name: comp.name,
                description: comp.description || "",
                weight: comp.weight || 1,
                score: existingScores[comp.name] || 5,
              }))
            );
          }
        } catch (e) {
          console.error("Erro ao parsear competências do template:", e);
        }
      }
    }
  }, [templateId, templates]);

  const updateScore = (index: number, score: number) => {
    const newScores = [...competencyScores];
    newScores[index].score = score;
    setCompetencyScores(newScores);
  };

  const calculateFinalScore = () => {
    if (competencyScores.length === 0) return 0;

    const totalWeight = competencyScores.reduce((sum, comp) => sum + comp.weight, 0);
    const weightedSum = competencyScores.reduce(
      (sum, comp) => sum + comp.score * comp.weight,
      0
    );

    return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : 0;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!employeeId) {
      newErrors.employeeId = "Selecione um colaborador";
    }

    if (!templateId) {
      newErrors.templateId = "Selecione um template";
    }

    if (!period.trim()) {
      newErrors.period = "Período é obrigatório";
    }

    if (competencyScores.length === 0) {
      newErrors.competencies = "Selecione um template com competências";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (!evaluationId) {
      toast.error("ID da avaliação não encontrado");
      return;
    }

    updateMutation.mutate({
      id: evaluationId,
      responses: JSON.stringify(competencyScores),
      score: calculateFinalScore(),
      comments,
    });
  };

  if (authLoading || loadingEvaluation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para editar avaliações.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Avaliação não encontrada</CardTitle>
            <CardDescription>
              A avaliação que você está tentando editar não existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar Avaliação de Desempenho</CardTitle>
          <CardDescription>
            Atualize as informações da avaliação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Colaborador *</Label>
                <Select
                  value={employeeId?.toString()}
                  onValueChange={(value) => setEmployeeId(parseInt(value))}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-destructive">{errors.employeeId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template de Avaliação *</Label>
                <Select
                  value={templateId?.toString()}
                  onValueChange={(value) => setTemplateId(parseInt(value))}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Selecione o template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id.toString()}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.templateId && (
                  <p className="text-sm text-destructive">{errors.templateId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ex: 2024 Q1, Janeiro/2024"
              />
              {errors.period && (
                <p className="text-sm text-destructive">{errors.period}</p>
              )}
            </div>

            {competencyScores.length > 0 && (
              <div className="space-y-4">
                <Label>Avaliação de Competências *</Label>
                {errors.competencies && (
                  <p className="text-sm text-destructive">{errors.competencies}</p>
                )}

                <div className="space-y-4">
                  {competencyScores.map((comp, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-base font-semibold">
                                {comp.name}
                              </Label>
                              <span className="text-sm text-muted-foreground">
                                Peso: {comp.weight}
                              </span>
                            </div>
                            {comp.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {comp.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Nota: {comp.score}</Label>
                              <span className="text-xs text-muted-foreground">
                                1 (Insatisfatório) - 10 (Excelente)
                              </span>
                            </div>
                            <Slider
                              value={[comp.score]}
                              onValueChange={(value) => updateScore(idx, value[0])}
                              min={1}
                              max={10}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Nota Final Calculada:</span>
                      <span className="text-2xl font-bold text-primary">
                        {calculateFinalScore()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">Comentários Adicionais</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Adicione observações sobre esta avaliação..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/evaluations")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
