import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

interface Goal {
  id: string;
  description: string;
  indicator: string;
  target: string;
  deadline: string;
  weight: number;
  progress: number;
}

export default function EditPIR() {
  const [, params] = useRoute("/pir/edit/:id");
  const pirId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [period, setPeriod] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: pir, isLoading: loadingPIR } = trpc.pir.getById.useQuery(
    { id: pirId! },
    { enabled: !!pirId }
  );

  const { data: employees } = trpc.employee.list.useQuery();

  const updateMutation = trpc.pir.update.useMutation({
    onSuccess: () => {
      toast.success("PIR atualizado com sucesso!");
      navigate("/pir");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar PIR: " + error.message);
    },
  });

  useEffect(() => {
    if (pir) {
      setEmployeeId(pir.employeeId);
      setPeriod(pir.period);

      if (pir.goals && typeof pir.goals === 'string') {
        try {
          const parsed = JSON.parse(pir.goals);
          if (Array.isArray(parsed)) {
            setGoals(parsed.map((g, idx) => ({
              ...g,
              id: g.id || `goal-${idx}`,
              progress: g.progress || 0
            })));
          }
        } catch (e) {
          console.error("Erro ao parsear metas:", e);
        }
      }
    }
  }, [pir]);

  const addGoal = () => {
    setGoals([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        description: "",
        indicator: "",
        target: "",
        deadline: "",
        weight: 1,
        progress: 0,
      },
    ]);
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const updateGoal = (id: string, field: keyof Goal, value: string | number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!employeeId) {
      newErrors.employeeId = "Selecione um colaborador";
    }

    if (!period.trim()) {
      newErrors.period = "Período é obrigatório";
    }

    if (goals.length === 0) {
      newErrors.goals = "Adicione pelo menos uma meta";
    }

    goals.forEach((goal, idx) => {
      if (!goal.description.trim()) {
        newErrors[`goal-${idx}-description`] = "Descrição da meta é obrigatória";
      }
      if (!goal.indicator.trim()) {
        newErrors[`goal-${idx}-indicator`] = "Indicador é obrigatório";
      }
      if (!goal.target.trim()) {
        newErrors[`goal-${idx}-target`] = "Meta é obrigatória";
      }
      if (!goal.deadline) {
        newErrors[`goal-${idx}-deadline`] = "Prazo é obrigatório";
      }
      if (goal.weight < 1 || goal.weight > 10) {
        newErrors[`goal-${idx}-weight`] = "Peso deve estar entre 1 e 10";
      }
      if (goal.progress < 0 || goal.progress > 100) {
        newErrors[`goal-${idx}-progress`] = "Progresso deve estar entre 0 e 100";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (!pirId) {
      toast.error("ID do PIR não encontrado");
      return;
    }

    updateMutation.mutate({
      id: pirId,
      employeeId: employeeId!,
      period,
      goals: JSON.stringify(goals),
    });
  };

  if (authLoading || loadingPIR) {
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
              Você precisa estar autenticado para editar PIRs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!pir) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>PIR não encontrado</CardTitle>
            <CardDescription>
              O PIR que você está tentando editar não existe.
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
          <CardTitle>Editar PIR - Plano Individual de Resultados</CardTitle>
          <CardDescription>
            Atualize as metas e informações do PIR
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
                    {employees?.map((emp) => (
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
                <Label htmlFor="period">Período *</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ex: 2024, Q1 2024"
                />
                {errors.period && (
                  <p className="text-sm text-destructive">{errors.period}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Metas e Indicadores *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Meta
                </Button>
              </div>

              {errors.goals && (
                <p className="text-sm text-destructive">{errors.goals}</p>
              )}

              <div className="space-y-4">
                {goals.map((goal, idx) => (
                  <Card key={goal.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold">Meta {idx + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGoal(goal.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição da Meta *</Label>
                          <Textarea
                            value={goal.description}
                            onChange={(e) =>
                              updateGoal(goal.id, "description", e.target.value)
                            }
                            placeholder="Descreva a meta a ser alcançada..."
                            rows={2}
                          />
                          {errors[`goal-${idx}-description`] && (
                            <p className="text-sm text-destructive">
                              {errors[`goal-${idx}-description`]}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Indicador *</Label>
                            <Input
                              value={goal.indicator}
                              onChange={(e) =>
                                updateGoal(goal.id, "indicator", e.target.value)
                              }
                              placeholder="Ex: Vendas, Produtividade"
                            />
                            {errors[`goal-${idx}-indicator`] && (
                              <p className="text-sm text-destructive">
                                {errors[`goal-${idx}-indicator`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Meta *</Label>
                            <Input
                              value={goal.target}
                              onChange={(e) =>
                                updateGoal(goal.id, "target", e.target.value)
                              }
                              placeholder="Ex: R$ 100.000, 95%"
                            />
                            {errors[`goal-${idx}-target`] && (
                              <p className="text-sm text-destructive">
                                {errors[`goal-${idx}-target`]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Prazo *</Label>
                            <Input
                              type="date"
                              value={goal.deadline}
                              onChange={(e) =>
                                updateGoal(goal.id, "deadline", e.target.value)
                              }
                            />
                            {errors[`goal-${idx}-deadline`] && (
                              <p className="text-sm text-destructive">
                                {errors[`goal-${idx}-deadline`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Peso (1-10) *</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={goal.weight}
                              onChange={(e) =>
                                updateGoal(goal.id, "weight", parseInt(e.target.value) || 1)
                              }
                            />
                            {errors[`goal-${idx}-weight`] && (
                              <p className="text-sm text-destructive">
                                {errors[`goal-${idx}-weight`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Progresso (%) *</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={goal.progress}
                              onChange={(e) =>
                                updateGoal(goal.id, "progress", parseInt(e.target.value) || 0)
                              }
                            />
                            {errors[`goal-${idx}-progress`] && (
                              <p className="text-sm text-destructive">
                                {errors[`goal-${idx}-progress`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                onClick={() => navigate("/pir")}
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
