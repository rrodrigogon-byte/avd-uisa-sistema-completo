import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Target, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function AderirCicloAvaliacao() {
  const { user } = useAuth();
  const [, params] = useRoute("/ciclos-avaliacao/:id/aderir");
  const [, setLocation] = useLocation();
  const cycleId = params?.id ? parseInt(params.id) : 0;

  const { data: cycle, isLoading: cycleLoading } = trpc.performanceEvaluationCycle.getCycleById.useQuery({ cycleId });
  const { data: participation } = trpc.performanceEvaluationCycle.getParticipation.useQuery({ cycleId });

  const [individualGoals, setIndividualGoals] = useState<Array<{ title: string; description: string; targetValue: string; unit: string }>>([
    { title: "", description: "", targetValue: "", unit: "" },
  ]);

  const joinCycleMutation = trpc.performanceEvaluationCycle.joinCycle.useMutation({
    onSuccess: () => {
      toast.success("Adesão realizada com sucesso!");
      setLocation("/ciclos-avaliacao");
    },
    onError: (error) => {
      toast.error(`Erro ao aderir ao ciclo: ${error.message}`);
    },
  });

  const handleAddGoal = () => {
    setIndividualGoals([...individualGoals, { title: "", description: "", targetValue: "", unit: "" }]);
  };

  const handleRemoveGoal = (index: number) => {
    setIndividualGoals(individualGoals.filter((_, i) => i !== index));
  };

  const handleGoalChange = (index: number, field: string, value: string) => {
    const updated = [...individualGoals];
    updated[index] = { ...updated[index], [field]: value };
    setIndividualGoals(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (individualGoals.some((g) => !g.title || !g.targetValue)) {
      toast.error("Preencha todas as metas individuais");
      return;
    }

    joinCycleMutation.mutate({
      cycleId,
      individualGoals: JSON.stringify(individualGoals),
    });
  };

  if (cycleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ciclo...</p>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Ciclo não encontrado</p>
            <Link href="/ciclos-avaliacao">
              <Button>Voltar para Ciclos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se já aderiu
  if (participation) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium mb-2">Você já aderiu a este ciclo</p>
            <p className="text-muted-foreground text-center mb-4">
              Status: <Badge>{participation.status}</Badge>
            </p>
            <div className="flex gap-2">
              <Link href="/ciclos-avaliacao">
                <Button variant="outline">Voltar para Ciclos</Button>
              </Link>
              <Link href={`/ciclos-avaliacao/${cycleId}/acompanhar`}>
                <Button>Ver Minhas Metas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const corporateGoals = cycle.corporateGoals ? JSON.parse(cycle.corporateGoals) : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ciclos-avaliacao">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Aderir ao Ciclo: {cycle.name}</h1>
          <p className="text-muted-foreground mt-1">
            Defina suas metas individuais alinhadas às metas corporativas
          </p>
        </div>
      </div>

      {/* Informações do Ciclo */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Ciclo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Descrição:</strong> {cycle.description}</p>
          <p><strong>Período:</strong> {new Date(cycle.startDate).toLocaleDateString("pt-BR")} até {new Date(cycle.endDate).toLocaleDateString("pt-BR")}</p>
          {cycle.goalSubmissionDeadline && (
            <p><strong>Prazo para Envio de Metas:</strong> {new Date(cycle.goalSubmissionDeadline).toLocaleDateString("pt-BR")}</p>
          )}
        </CardContent>
      </Card>

      {/* Metas Corporativas */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Corporativas</CardTitle>
          <CardDescription>Estas são as metas definidas pela empresa para este ciclo</CardDescription>
        </CardHeader>
        <CardContent>
          {corporateGoals.length > 0 ? (
            <div className="space-y-3">
              {corporateGoals.map((goal: any, idx: number) => (
                <Card key={idx} className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {goal.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Alvo: {goal.targetValue} {goal.unit}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma meta corporativa definida.</p>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Metas Individuais */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Suas Metas Individuais</CardTitle>
                <CardDescription>Defina metas específicas alinhadas às metas corporativas</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddGoal}>
                <Target className="h-4 w-4 mr-2" />
                Adicionar Meta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {individualGoals.map((goal, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Meta Individual {index + 1}</CardTitle>
                    {individualGoals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGoal(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título da Meta *</Label>
                    <Input
                      placeholder="Ex: Aumentar minhas vendas em 25%"
                      value={goal.title}
                      onChange={(e) => handleGoalChange(index, "title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Como você pretende alcançar esta meta?"
                      value={goal.description}
                      onChange={(e) => handleGoalChange(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Alvo *</Label>
                      <Input
                        placeholder="Ex: 25"
                        value={goal.targetValue}
                        onChange={(e) => handleGoalChange(index, "targetValue", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input
                        placeholder="Ex: %"
                        value={goal.unit}
                        onChange={(e) => handleGoalChange(index, "unit", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link href="/ciclos-avaliacao">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={joinCycleMutation.isPending}>
            {joinCycleMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enviar Adesão
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
