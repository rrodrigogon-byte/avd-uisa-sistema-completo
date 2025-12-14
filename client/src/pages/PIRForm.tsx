import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Goal {
  description: string;
  indicator: string;
  target: string;
  deadline: string;
  weight: number;
  progress: number;
}

export default function PIRForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState<Goal[]>([
    {
      description: "",
      indicator: "",
      target: "",
      deadline: "",
      weight: 0,
      progress: 0,
    },
  ]);

  const createMutation = trpc.pir.create.useMutation({
    onSuccess: () => {
      toast.success("PIR criado com sucesso!");
      utils.pir.list.invalidate();
      setLocation("/pir");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar PIR");
    },
  });

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        description: "",
        indicator: "",
        target: "",
        deadline: "",
        weight: 0,
        progress: 0,
      },
    ]);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    } else {
      toast.error("É necessário ter pelo menos uma meta");
    }
  };

  const handleGoalChange = (index: number, field: keyof Goal, value: string | number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!period.trim()) {
      toast.error("Período é obrigatório");
      return;
    }

    if (!startDate) {
      toast.error("Data de início é obrigatória");
      return;
    }

    if (!endDate) {
      toast.error("Data de término é obrigatória");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Data de término deve ser posterior à data de início");
      return;
    }

    // Validar metas
    const totalWeight = goals.reduce((sum, goal) => sum + goal.weight, 0);
    if (totalWeight !== 100) {
      toast.error(`A soma dos pesos das metas deve ser 100% (atual: ${totalWeight}%)`);
      return;
    }

    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      if (!goal.description.trim()) {
        toast.error(`Meta ${i + 1}: Descrição é obrigatória`);
        return;
      }
      if (!goal.indicator.trim()) {
        toast.error(`Meta ${i + 1}: Indicador é obrigatório`);
        return;
      }
      if (!goal.target.trim()) {
        toast.error(`Meta ${i + 1}: Meta/Alvo é obrigatória`);
        return;
      }
      if (!goal.deadline) {
        toast.error(`Meta ${i + 1}: Prazo é obrigatório`);
        return;
      }
      if (goal.weight <= 0 || goal.weight > 100) {
        toast.error(`Meta ${i + 1}: Peso deve estar entre 1 e 100`);
        return;
      }
    }

    createMutation.mutate({
      userId: user?.id || 0,
      title,
      description: description || undefined,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      evaluationId: undefined,
    });
  };

  const totalWeight = goals.reduce((sum, goal) => sum + goal.weight, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-5xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/pir")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo PIR - Plano Individual de Resultados</CardTitle>
            <CardDescription>
              Defina as metas e objetivos para o período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: PIR 2024 - Vendas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o contexto e objetivos gerais deste PIR"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">Período *</Label>
                    <Input
                      id="period"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="Ex: 2024-Q1, 2024"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Metas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Metas e Objetivos</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina as metas com seus respectivos pesos (total deve somar 100%)
                    </p>
                  </div>
                  <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
                    Peso Total: {totalWeight}%
                  </Badge>
                </div>

                {goals.map((goal, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Meta {index + 1}</CardTitle>
                        {goals.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGoal(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Descrição da Meta *</Label>
                        <Textarea
                          value={goal.description}
                          onChange={(e) =>
                            handleGoalChange(index, "description", e.target.value)
                          }
                          placeholder="Descreva a meta de forma clara e objetiva"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Indicador *</Label>
                          <Input
                            value={goal.indicator}
                            onChange={(e) =>
                              handleGoalChange(index, "indicator", e.target.value)
                            }
                            placeholder="Ex: Número de vendas, Taxa de conversão"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Meta/Alvo *</Label>
                          <Input
                            value={goal.target}
                            onChange={(e) =>
                              handleGoalChange(index, "target", e.target.value)
                            }
                            placeholder="Ex: 100 vendas, 85%"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Prazo *</Label>
                          <Input
                            type="date"
                            value={goal.deadline}
                            onChange={(e) =>
                              handleGoalChange(index, "deadline", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Peso (%) *</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={goal.weight || ""}
                            onChange={(e) =>
                              handleGoalChange(
                                index,
                                "weight",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="Ex: 25"
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddGoal}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Meta
                </Button>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/pir")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Salvando..." : "Salvar PIR"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
