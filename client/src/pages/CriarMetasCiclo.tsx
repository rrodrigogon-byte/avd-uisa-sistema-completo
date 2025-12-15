import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Target, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Página de Criação de Metas Vinculadas ao Ciclo Aprovado
 * Permite que funcionários criem metas assim que o ciclo for aprovado
 */
export default function CriarMetasCiclo() {
  const [, params] = useRoute("/ciclos/:cycleId/criar-metas");
  const [, navigate] = useLocation();
  const cycleId = params?.cycleId ? parseInt(params.cycleId) : null;
  const { user } = useAuth();

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    category: "individual" as "individual" | "equipe" | "organizacional",
    weight: 100,
    targetValue: "",
    unit: "",
    deadline: "",
  });

  const utils = trpc.useUtils();
  
  // Verificar se ciclo está aprovado para metas
  const { data: isApproved, isLoading: loadingApproval } = trpc.cycles.isApprovedForGoals.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  const { data: cycle, isLoading: loadingCycle } = trpc.cycles.getById.useQuery(
    { id: cycleId! },
    { enabled: !!cycleId }
  );

  // Buscar metas já criadas pelo funcionário neste ciclo
  const { data: existingGoals, isLoading: loadingGoals } = trpc.goals.listByCycle.useQuery(
    { cycleId: cycleId!, employeeId: user?.id || 0 },
    { enabled: !!cycleId && !!user?.id }
  );

  const createGoalMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      utils.goals.listByCycle.invalidate({ cycleId: cycleId!, employeeId: user?.id || 0 });
      setGoalForm({
        title: "",
        description: "",
        category: "individual",
        weight: 100,
        targetValue: "",
        unit: "",
        deadline: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar meta: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cycleId || !user?.id) {
      toast.error("Informações do ciclo ou usuário não disponíveis");
      return;
    }

    if (!goalForm.title || !goalForm.description || !goalForm.targetValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createGoalMutation.mutate({
      cycleId,
      employeeId: user.id,
      title: goalForm.title,
      description: goalForm.description,
      category: goalForm.category,
      weight: goalForm.weight,
      targetValue: goalForm.targetValue,
      unit: goalForm.unit,
      deadline: goalForm.deadline ? new Date(goalForm.deadline).toISOString() : new Date().toISOString(),
      status: "rascunho",
    });
  };

  if (loadingApproval || loadingCycle || loadingGoals) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!cycle) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Ciclo não encontrado</h2>
          <Link href="/ciclos-avaliacao">
            <Button>Voltar para Ciclos</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!isApproved) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/ciclos-avaliacao">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Criar Metas - {cycle.name}</h1>
              <p className="text-muted-foreground">
                Período: {new Date(cycle.startDate).toLocaleDateString("pt-BR")} - {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ciclo não aprovado para metas</AlertTitle>
            <AlertDescription>
              Este ciclo ainda não foi aprovado para preenchimento de metas pelos funcionários.
              Aguarde a aprovação do gestor ou RH para começar a criar suas metas.
            </AlertDescription>
          </Alert>

          <Link href="/ciclos-avaliacao">
            <Button>Voltar para Ciclos</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/ciclos-avaliacao">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Criar Metas - {cycle.name}</h1>
            <p className="text-muted-foreground">
              Período: {new Date(cycle.startDate).toLocaleDateString("pt-BR")} - {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Alert de Sucesso */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Ciclo aprovado para metas</AlertTitle>
          <AlertDescription className="text-green-800">
            Este ciclo está aprovado para preenchimento de metas. Crie suas metas individuais, de equipe ou organizacionais.
          </AlertDescription>
        </Alert>

        {/* Metas Existentes */}
        {existingGoals && existingGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Metas já criadas ({existingGoals.length})</CardTitle>
              <CardDescription>Suas metas para este ciclo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {existingGoals.map((goal: any) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">{goal.category} • {goal.status}</p>
                    </div>
                    <Link href={`/metas/${goal.id}`}>
                      <Button size="sm" variant="outline">Ver Detalhes</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de Criação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Criar Nova Meta
            </CardTitle>
            <CardDescription>
              Defina uma meta SMART (Específica, Mensurável, Atingível, Relevante, Temporal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Meta *</Label>
                <Input
                  id="title"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="Ex: Aumentar vendas em 20%"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Descreva detalhadamente a meta, como será medida e o que é esperado..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={goalForm.category}
                    onValueChange={(value: any) => setGoalForm({ ...goalForm, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="organizacional">Organizacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="weight">Peso (%) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    value={goalForm.weight}
                    onChange={(e) => setGoalForm({ ...goalForm, weight: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Valor Alvo *</Label>
                  <Input
                    id="targetValue"
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                    placeholder="Ex: 20, 100000, 95%"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unidade de Medida</Label>
                  <Input
                    id="unit"
                    value={goalForm.unit}
                    onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                    placeholder="Ex: %, R$, unidades"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deadline">Prazo *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  min={new Date(cycle.startDate).toISOString().split('T')[0]}
                  max={new Date(cycle.endDate).toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createGoalMutation.isPending}>
                  {createGoalMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Criar Meta
                    </>
                  )}
                </Button>
                <Link href="/ciclos-avaliacao">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
