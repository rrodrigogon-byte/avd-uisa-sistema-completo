import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Briefcase, 
  Target, 
  Plus, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart3,
  Loader2
} from "lucide-react";

const levelLabels: Record<number, string> = {
  1: "Básico",
  2: "Intermediário",
  3: "Avançado",
  4: "Especialista",
  5: "Expert",
};

const categoryLabels: Record<string, string> = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  lideranca: "Liderança",
};

const categoryColors: Record<string, string> = {
  tecnica: "bg-blue-100 text-blue-800",
  comportamental: "bg-green-100 text-green-800",
  lideranca: "bg-purple-100 text-purple-800",
};

export default function CompetenciasPorCargo() {
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState<Map<number, { level: number; weight: number }>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: positions, isLoading: loadingPositions } = trpc.positions.list.useQuery({ activeOnly: true });
  const { data: competencies, isLoading: loadingCompetencies } = trpc.competencyValidation.listCompetencies.useQuery({});
  const { data: positionCompetencies, isLoading: loadingPositionCompetencies, refetch: refetchPositionCompetencies } = 
    trpc.positionCompetencies.listByPosition.useQuery(
      { positionId: selectedPositionId! },
      { enabled: !!selectedPositionId }
    );

  // Mutations
  const saveBulkMutation = trpc.positionCompetencies.createBulk.useMutation({
    onSuccess: () => {
      toast.success("Competências salvas com sucesso!");
      setHasChanges(false);
      refetchPositionCompetencies();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Inicializar seleção quando carregar competências do cargo
  const initializeSelection = () => {
    if (positionCompetencies) {
      const newMap = new Map<number, { level: number; weight: number }>();
      positionCompetencies.forEach((pc) => {
        newMap.set(pc.competencyId, { level: pc.requiredLevel, weight: pc.weight });
      });
      setSelectedCompetencies(newMap);
      setHasChanges(false);
    }
  };

  // Quando mudar o cargo selecionado
  const handlePositionChange = (value: string) => {
    const posId = parseInt(value);
    setSelectedPositionId(posId);
    setSelectedCompetencies(new Map());
    setHasChanges(false);
  };

  // Quando carregar competências do cargo
  if (positionCompetencies && selectedCompetencies.size === 0 && positionCompetencies.length > 0) {
    initializeSelection();
  }

  // Toggle competência
  const toggleCompetency = (competencyId: number) => {
    const newMap = new Map(selectedCompetencies);
    if (newMap.has(competencyId)) {
      newMap.delete(competencyId);
    } else {
      newMap.set(competencyId, { level: 3, weight: 1 });
    }
    setSelectedCompetencies(newMap);
    setHasChanges(true);
  };

  // Atualizar nível
  const updateLevel = (competencyId: number, level: number) => {
    const newMap = new Map(selectedCompetencies);
    const current = newMap.get(competencyId);
    if (current) {
      newMap.set(competencyId, { ...current, level });
      setSelectedCompetencies(newMap);
      setHasChanges(true);
    }
  };

  // Atualizar peso
  const updateWeight = (competencyId: number, weight: number) => {
    const newMap = new Map(selectedCompetencies);
    const current = newMap.get(competencyId);
    if (current) {
      newMap.set(competencyId, { ...current, weight });
      setSelectedCompetencies(newMap);
      setHasChanges(true);
    }
  };

  // Salvar
  const handleSave = () => {
    if (!selectedPositionId) return;

    const competenciesArray = Array.from(selectedCompetencies.entries()).map(([competencyId, data]) => ({
      competencyId,
      requiredLevel: data.level,
      weight: data.weight,
    }));

    saveBulkMutation.mutate({
      positionId: selectedPositionId,
      competencies: competenciesArray,
    });
  };

  // Agrupar competências por categoria
  const groupedCompetencies = competencies?.reduce((acc, comp) => {
    const category = comp.category || "outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {} as Record<string, typeof competencies>);

  const selectedPosition = positions?.find(p => p.id === selectedPositionId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Competências por Cargo</h1>
            <p className="text-muted-foreground">
              Defina quais competências e níveis mínimos são exigidos para cada cargo
            </p>
          </div>
          
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleSave} disabled={saveBulkMutation.isPending}>
                {saveBulkMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            )}
          </div>
        </div>

        {/* Seleção de Cargo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Selecione o Cargo
            </CardTitle>
            <CardDescription>
              Escolha um cargo para configurar as competências exigidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handlePositionChange} value={selectedPositionId?.toString()}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Selecione um cargo..." />
              </SelectTrigger>
              <SelectContent>
                {loadingPositions ? (
                  <div className="p-2 text-center text-muted-foreground">Carregando...</div>
                ) : (
                  positions?.map((position) => (
                    <SelectItem key={position.id} value={position.id.toString()}>
                      {position.title} {position.level && `(${position.level})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Competências do Cargo */}
        {selectedPositionId && (
          <>
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Competências Vinculadas</p>
                      <p className="text-2xl font-bold">{selectedCompetencies.size}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nível Médio Exigido</p>
                      <p className="text-2xl font-bold">
                        {selectedCompetencies.size > 0
                          ? (Array.from(selectedCompetencies.values()).reduce((sum, c) => sum + c.level, 0) / selectedCompetencies.size).toFixed(1)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Peso Total</p>
                      <p className="text-2xl font-bold">
                        {Array.from(selectedCompetencies.values()).reduce((sum, c) => sum + c.weight, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Competências por Categoria */}
            <div className="grid gap-6">
              {loadingCompetencies ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedCompetencies || {}).map(([category, comps]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                          {categoryLabels[category] || category}
                        </Badge>
                        <span className="text-sm font-normal text-muted-foreground">
                          ({comps?.filter(c => selectedCompetencies.has(c.id)).length || 0} de {comps?.length || 0} selecionadas)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {comps?.map((comp) => {
                          const isSelected = selectedCompetencies.has(comp.id);
                          const data = selectedCompetencies.get(comp.id);
                          
                          return (
                            <div 
                              key={comp.id} 
                              className={`rounded-lg border p-4 transition-colors ${
                                isSelected ? "border-primary bg-primary/5" : "border-border"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  id={`comp-${comp.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleCompetency(comp.id)}
                                />
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <Label 
                                      htmlFor={`comp-${comp.id}`}
                                      className="text-base font-medium cursor-pointer"
                                    >
                                      {comp.name}
                                    </Label>
                                    {comp.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {comp.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {isSelected && data && (
                                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                                      <div className="space-y-2">
                                        <Label className="text-sm">
                                          Nível Mínimo Exigido: <strong>{levelLabels[data.level]}</strong>
                                        </Label>
                                        <Slider
                                          value={[data.level]}
                                          onValueChange={([value]) => updateLevel(comp.id, value)}
                                          min={1}
                                          max={5}
                                          step={1}
                                          className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Básico</span>
                                          <span>Expert</span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-sm">
                                          Peso: <strong>{data.weight}</strong>
                                        </Label>
                                        <Slider
                                          value={[data.weight]}
                                          onValueChange={([value]) => updateWeight(comp.id, value)}
                                          min={1}
                                          max={10}
                                          step={1}
                                          className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>1</span>
                                          <span>10</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Aviso de alterações não salvas */}
            {hasChanges && (
              <div className="fixed bottom-4 right-4 z-50">
                <Card className="border-yellow-500 bg-yellow-50">
                  <CardContent className="flex items-center gap-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Você tem alterações não salvas</span>
                    <Button size="sm" onClick={handleSave} disabled={saveBulkMutation.isPending}>
                      {saveBulkMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Estado vazio */}
        {!selectedPositionId && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Selecione um cargo</h3>
              <p className="text-muted-foreground mt-1">
                Escolha um cargo acima para configurar as competências exigidas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
