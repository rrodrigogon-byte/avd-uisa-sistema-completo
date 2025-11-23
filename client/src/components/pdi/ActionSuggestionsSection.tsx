import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lightbulb, Plus, Pencil, Check } from "lucide-react";

interface ActionSuggestionsSectionProps {
  pdiId: number | null;
}

export default function ActionSuggestionsSection({ pdiId }: ActionSuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [editingIndex, setEditingIndex] = useState<{ category: string; index: number } | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const utils = trpc.useUtils();
  
  const { data: suggestionsData, refetch: refetchSuggestions } = trpc.pdiIntelligent.generateActionSuggestions.useQuery(
    { planId: pdiId! },
    { enabled: false }
  );

  const addActionMutation = trpc.pdiIntelligent.addAction.useMutation({
    onSuccess: () => {
      toast.success("Ação adicionada ao PDI!");
      utils.pdiIntelligent.getActions.invalidate({ planId: pdiId! });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar ação: ${error.message}`);
    },
  });

  const handleGenerateSuggestions = async () => {
    const result = await refetchSuggestions();
    if (result.data) {
      setSuggestions(result.data);
      toast.success("Sugestões geradas com sucesso!");
    }
  };

  const handleEdit = (category: string, index: number, action: any) => {
    setEditingIndex({ category, index });
    setEditForm(action);
  };

  const handleSaveEdit = (category: string, index: number) => {
    if (!suggestions) return;
    
    const updated = { ...suggestions };
    updated[category][index] = editForm;
    setSuggestions(updated);
    setEditingIndex(null);
    toast.success("Sugestão atualizada!");
  };

  const handleAddToPDI = (action: any) => {
    if (!pdiId) return;
    
    addActionMutation.mutate({
      planId: pdiId,
      title: action.title,
      description: action.description,
      axis: action.axis,
      developmentArea: action.developmentArea,
      successMetric: action.successMetric,
      evidenceRequired: action.evidenceRequired,
      responsible: "",
      dueDate: action.dueDate,
    });
  };

  const getAxisBadge = (axis: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      "70_pratica": { label: "70% Prática", color: "bg-blue-100 text-blue-800" },
      "20_experiencia": { label: "20% Experiência", color: "bg-purple-100 text-purple-800" },
      "10_educacao": { label: "10% Educação", color: "bg-green-100 text-green-800" },
    };
    const config = labels[axis] || labels["70_pratica"];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const renderActionCard = (action: any, category: string, index: number) => {
    const isEditing = editingIndex?.category === category && editingIndex?.index === index;

    if (isEditing) {
      return (
        <Card key={index} className="border-2 border-primary">
          <CardHeader>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Métrica de Sucesso</Label>
              <Input
                value={editForm.successMetric}
                onChange={(e) => setEditForm({ ...editForm, successMetric: e.target.value })}
              />
            </div>
            <div>
              <Label>Evidência Requerida</Label>
              <Input
                value={editForm.evidenceRequired}
                onChange={(e) => setEditForm({ ...editForm, evidenceRequired: e.target.value })}
              />
            </div>
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSaveEdit(category, index)}>
                <Check className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={index}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{action.title}</CardTitle>
              <CardDescription className="mt-1">{action.description}</CardDescription>
            </div>
            {getAxisBadge(action.axis)}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Métrica de Sucesso:</p>
            <p className="text-sm">{action.successMetric}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Evidência Requerida:</p>
            <p className="text-sm">{action.evidenceRequired}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prazo:</p>
            <p className="text-sm">{new Date(action.dueDate).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(category, index, action)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button size="sm" onClick={() => handleAddToPDI(action)} disabled={addActionMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao PDI
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {!suggestions ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <p className="text-muted-foreground mb-4">
            Gere sugestões automáticas de ações 70-20-10 baseadas nos gaps de competências identificados
          </p>
          <Button onClick={handleGenerateSuggestions}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Gerar Sugestões
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleGenerateSuggestions} variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              Gerar Novamente
            </Button>
          </div>

          {/* 70% Prática */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">70% Prática</Badge>
              Projetos e Atividades no Dia a Dia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.pratica_70?.map((action: any, index: number) =>
                renderActionCard(action, "pratica_70", index)
              )}
            </div>
          </div>

          {/* 20% Experiência */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">20% Experiência</Badge>
              Mentoria e Job Rotation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.experiencia_20?.map((action: any, index: number) =>
                renderActionCard(action, "experiencia_20", index)
              )}
            </div>
          </div>

          {/* 10% Educação */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">10% Educação</Badge>
              Cursos e Certificações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.educacao_10?.map((action: any, index: number) =>
                renderActionCard(action, "educacao_10", index)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
