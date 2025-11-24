import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Calendar, Target, Save } from "lucide-react";
import { Link } from "wouter";

export default function CriarCicloAvaliacao() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    goalSubmissionDeadline: "",
    managerApprovalDeadline: "",
    evidenceSubmissionDeadline: "",
    evaluationDeadline: "",
    finalApprovalDeadline: "",
  });

  const [corporateGoals, setCorporateGoals] = useState<Array<{ title: string; description: string; targetValue: string; unit: string }>>([
    { title: "", description: "", targetValue: "", unit: "" },
  ]);

  const createCycleMutation = trpc.performanceEvaluationCycle.createCycle.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      setLocation("/ciclos-avaliacao");
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    },
  });

  const handleAddGoal = () => {
    setCorporateGoals([...corporateGoals, { title: "", description: "", targetValue: "", unit: "" }]);
  };

  const handleRemoveGoal = (index: number) => {
    setCorporateGoals(corporateGoals.filter((_, i) => i !== index));
  };

  const handleGoalChange = (index: number, field: string, value: string) => {
    const updated = [...corporateGoals];
    updated[index] = { ...updated[index], [field]: value };
    setCorporateGoals(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (corporateGoals.some((g) => !g.title || !g.targetValue)) {
      toast.error("Preencha todas as metas corporativas");
      return;
    }

    createCycleMutation.mutate({
      name: formData.name,
      description: formData.description,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      goalSubmissionDeadline: formData.goalSubmissionDeadline ? new Date(formData.goalSubmissionDeadline) : undefined,
      managerApprovalDeadline: formData.managerApprovalDeadline ? new Date(formData.managerApprovalDeadline) : undefined,
      evidenceSubmissionDeadline: formData.evidenceSubmissionDeadline ? new Date(formData.evidenceSubmissionDeadline) : undefined,
      evaluationDeadline: formData.evaluationDeadline ? new Date(formData.evaluationDeadline) : undefined,
      finalApprovalDeadline: formData.finalApprovalDeadline ? new Date(formData.finalApprovalDeadline) : undefined,
      corporateGoals: JSON.stringify(corporateGoals),
    });
  };

  // Verificar permissão
  if (user?.role !== "admin" && !user?.email?.includes("rh")) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Acesso Negado</p>
            <p className="text-muted-foreground text-center mb-4">
              Apenas RH e Administradores podem criar ciclos de avaliação.
            </p>
            <Link href="/ciclos-avaliacao">
              <Button>Voltar para Ciclos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Criar Novo Ciclo de Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Configure um novo ciclo com metas corporativas e prazos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Defina nome, descrição e período do ciclo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ciclo *</Label>
              <Input
                id="name"
                placeholder="Ex: Ciclo de Avaliação 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva os objetivos e contexto deste ciclo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prazos */}
        <Card>
          <CardHeader>
            <CardTitle>Prazos do Ciclo</CardTitle>
            <CardDescription>Configure os prazos de cada etapa (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalSubmissionDeadline">Prazo para Envio de Metas</Label>
                <Input
                  id="goalSubmissionDeadline"
                  type="date"
                  value={formData.goalSubmissionDeadline}
                  onChange={(e) => setFormData({ ...formData, goalSubmissionDeadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerApprovalDeadline">Prazo para Aprovação do Gestor</Label>
                <Input
                  id="managerApprovalDeadline"
                  type="date"
                  value={formData.managerApprovalDeadline}
                  onChange={(e) => setFormData({ ...formData, managerApprovalDeadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evidenceSubmissionDeadline">Prazo para Envio de Evidências</Label>
                <Input
                  id="evidenceSubmissionDeadline"
                  type="date"
                  value={formData.evidenceSubmissionDeadline}
                  onChange={(e) => setFormData({ ...formData, evidenceSubmissionDeadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluationDeadline">Prazo para Avaliação</Label>
                <Input
                  id="evaluationDeadline"
                  type="date"
                  value={formData.evaluationDeadline}
                  onChange={(e) => setFormData({ ...formData, evaluationDeadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalApprovalDeadline">Prazo para Aprovação Final</Label>
                <Input
                  id="finalApprovalDeadline"
                  type="date"
                  value={formData.finalApprovalDeadline}
                  onChange={(e) => setFormData({ ...formData, finalApprovalDeadline: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metas Corporativas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Metas Corporativas</CardTitle>
                <CardDescription>Defina as metas que todos os funcionários devem seguir</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddGoal}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Meta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {corporateGoals.map((goal, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Meta {index + 1}</CardTitle>
                    {corporateGoals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGoal(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título da Meta *</Label>
                    <Input
                      placeholder="Ex: Aumentar vendas em 20%"
                      value={goal.title}
                      onChange={(e) => handleGoalChange(index, "title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva a meta em detalhes..."
                      value={goal.description}
                      onChange={(e) => handleGoalChange(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Alvo *</Label>
                      <Input
                        placeholder="Ex: 20"
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
          <Button type="submit" disabled={createCycleMutation.isPending}>
            {createCycleMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Ciclo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
