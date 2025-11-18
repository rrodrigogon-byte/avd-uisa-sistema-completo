import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";

/**
 * Página de Edição de Meta em Rascunho
 * Permite editar metas que ainda não foram enviadas para aprovação
 */
export default function EditarMeta() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const goalId = parseInt(id || "0");

  // Buscar meta
  const { data: goal, isLoading } = trpc.smartGoals.getById.useQuery({ goalId });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "individual" as "individual" | "team" | "organizational",
    category: "development" as "financial" | "behavioral" | "corporate" | "development",
    measurementUnit: "",
    targetValue: "",
    weight: "10",
    startDate: "",
    endDate: "",
    bonusEligible: false,
    bonusPercentage: "",
    bonusAmount: "",
  });

  // Atualizar meta
  const updateMutation = trpc.smartGoals.update.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada com sucesso!");
      navigate(`/metas/${goalId}`);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar meta", {
        description: error.message,
      });
    },
  });

  // Preencher formulário quando meta carregar
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        type: goal.type,
        category: goal.category,
        measurementUnit: goal.measurementUnit || "",
        targetValue: goal.targetValue?.toString() || "",
        weight: goal.weight.toString(),
        startDate: goal.startDate instanceof Date ? goal.startDate.toISOString().split("T")[0] : goal.startDate,
        endDate: goal.endDate instanceof Date ? goal.endDate.toISOString().split("T")[0] : goal.endDate,
        bonusEligible: goal.bonusEligible,
        bonusPercentage: goal.bonusPercentage?.toString() || "",
        bonusAmount: goal.bonusAmount?.toString() || "",
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    await updateMutation.mutateAsync({
      goalId,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      category: formData.category,
      measurementUnit: formData.measurementUnit || undefined,
      targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
      weight: parseInt(formData.weight),
      startDate: formData.startDate,
      endDate: formData.endDate,
      bonusEligible: formData.bonusEligible,
      bonusPercentage: formData.bonusPercentage ? parseFloat(formData.bonusPercentage) : undefined,
      bonusAmount: formData.bonusAmount ? parseFloat(formData.bonusAmount) : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meta não encontrada</h3>
            <Button onClick={() => navigate("/metas")}>Voltar para Metas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (goal.status !== "draft") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meta não editável</h3>
            <p className="text-gray-600 mb-4">
              Apenas metas em rascunho podem ser editadas
            </p>
            <Button onClick={() => navigate(`/metas/${goalId}`)}>Ver Detalhes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/metas/${goalId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Meta</h1>
        <p className="text-gray-600 mt-1">Atualize as informações da meta em rascunho</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Título, descrição e categoria da meta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Meta *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Meta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Equipe</SelectItem>
                    <SelectItem value="organizational">Organizacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: any) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financeira</SelectItem>
                    <SelectItem value="behavioral">Comportamental</SelectItem>
                    <SelectItem value="corporate">Corporativa</SelectItem>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas e Datas */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas e Datas</CardTitle>
            <CardDescription>Como a meta será medida e o prazo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="measurementUnit">Unidade de Medida</Label>
                <Input
                  id="measurementUnit"
                  placeholder="Ex: R$, %, unidades"
                  value={formData.measurementUnit}
                  onChange={(e) => setFormData({ ...formData, measurementUnit: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetValue">Valor Alvo</Label>
                <Input
                  id="targetValue"
                  type="number"
                  placeholder="Ex: 100"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weight">Peso da Meta (1-100)</Label>
              <Input
                id="weight"
                type="number"
                min="1"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bônus */}
        <Card>
          <CardHeader>
            <CardTitle>Bônus Financeiro</CardTitle>
            <CardDescription>Configure elegibilidade para bônus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="bonusEligible" className="text-base font-medium">
                  Elegível para Bônus
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Ativar se esta meta deve contar para cálculo de bônus
                </p>
              </div>
              <Switch
                id="bonusEligible"
                checked={formData.bonusEligible}
                onCheckedChange={(checked) => setFormData({ ...formData, bonusEligible: checked })}
              />
            </div>

            {formData.bonusEligible && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <Label htmlFor="bonusPercentage">Bônus Percentual (%)</Label>
                  <Input
                    id="bonusPercentage"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.5"
                    value={formData.bonusPercentage}
                    onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bonusAmount">Bônus Fixo (R$)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000.00"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/metas/${goalId}`)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-[#F39200] hover:bg-[#d67e00]"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
