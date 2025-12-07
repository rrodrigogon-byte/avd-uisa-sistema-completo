import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, AlertTriangle } from "lucide-react";

interface RisksSectionProps {
  pdiId: number | null;
}

export default function RisksSection({ pdiId }: RisksSectionProps) {
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [riskForm, setRiskForm] = useState({
    type: "outro" as "saida" | "gap_competencia" | "tempo_preparo" | "mudanca_estrategica" | "outro",
    description: "",
    impact: "medio" as "baixo" | "medio" | "alto" | "critico",
    probability: "media" as "baixa" | "media" | "alta",
    mitigation: "",
  });

  const utils = trpc.useUtils();
  const { data: risksData } = trpc.pdiIntelligent.getMainRisks.useQuery(
    { planId: pdiId! },
    { enabled: !!pdiId }
  );

  const addRiskMutation = trpc.pdiIntelligent.addRisk.useMutation({
    onSuccess: () => {
      toast.success("Risco adicionado com sucesso!");
      utils.pdiIntelligent.getMainRisks.invalidate({ planId: pdiId! });
      setShowAddRisk(false);
      setRiskForm({
        type: "outro",
        description: "",
        impact: "medio",
        probability: "media",
        mitigation: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar risco: ${error.message}`);
    },
  });

  const handleAddRisk = () => {
    if (!pdiId || !riskForm.description) {
      toast.error("Preencha a descrição do risco");
      return;
    }

    addRiskMutation.mutate({
      planId: pdiId,
      ...riskForm,
    });
  };

  const handleAddSuggestion = (suggestion: any) => {
    if (!pdiId) return;
    
    addRiskMutation.mutate({
      planId: pdiId,
      ...suggestion,
    });
  };

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      baixo: { label: "Baixo", variant: "secondary" },
      medio: { label: "Médio", variant: "default" },
      alto: { label: "Alto", variant: "destructive" },
      critico: { label: "Crítico", variant: "destructive" },
    };
    const config = variants[impact] || variants.medio;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProbabilityBadge = (probability: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      baixa: { label: "Baixa", variant: "secondary" },
      media: { label: "Média", variant: "default" },
      alta: { label: "Alta", variant: "outline" },
    };
    const config = variants[probability] || variants.media;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      saida: "Saída do Colaborador",
      gap_competencia: "Gap de Competências",
      tempo_preparo: "Tempo de Preparo",
      mudanca_estrategica: "Mudança Estratégica",
      outro: "Outro",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Riscos Principais Sugeridos */}
      {risksData?.suggestions && risksData.suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Principais Riscos Identificados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risksData.suggestions.map((risk: any, index: number) => (
              <Card key={index} className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{getTypeLabel(risk.type)}</CardTitle>
                      <CardDescription className="mt-1">{risk.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Impacto:</span>
                    {getImpactBadge(risk.impact)}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Probabilidade:</span>
                    {getProbabilityBadge(risk.probability)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mitigação:</p>
                    <p className="text-sm">{risk.mitigation}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleAddSuggestion(risk)}
                    disabled={addRiskMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar aos Riscos Monitorados
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Riscos Cadastrados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Riscos Monitorados</h3>
          <Dialog open={showAddRisk} onOpenChange={setShowAddRisk}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Risco Personalizado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Risco</DialogTitle>
                <DialogDescription>
                  Identifique um risco específico para este PDI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Tipo de Risco</Label>
                  <Select
                    value={riskForm.type}
                    onValueChange={(value: any) => setRiskForm({ ...riskForm, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saida">Saída do Colaborador</SelectItem>
                      <SelectItem value="gap_competencia">Gap de Competências</SelectItem>
                      <SelectItem value="tempo_preparo">Tempo de Preparo</SelectItem>
                      <SelectItem value="mudanca_estrategica">Mudança Estratégica</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição do Risco</Label>
                  <Textarea
                    id="description"
                    value={riskForm.description}
                    onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                    rows={3}
                    placeholder="Descreva o risco identificado..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="impact">Impacto</Label>
                    <Select
                      value={riskForm.impact}
                      onValueChange={(value: any) => setRiskForm({ ...riskForm, impact: value })}
                    >
                      <SelectTrigger id="impact">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="critico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="probability">Probabilidade</Label>
                    <Select
                      value={riskForm.probability}
                      onValueChange={(value: any) => setRiskForm({ ...riskForm, probability: value })}
                    >
                      <SelectTrigger id="probability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="mitigation">Plano de Mitigação</Label>
                  <Textarea
                    id="mitigation"
                    value={riskForm.mitigation}
                    onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                    rows={3}
                    placeholder="Como mitigar este risco..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddRisk(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddRisk} disabled={addRiskMutation.isPending}>
                  {addRiskMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {risksData && 'existing' in risksData && risksData.existing && risksData.existing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risksData && 'existing' in risksData && risksData.existing.map((risk: any) => (
              <Card key={risk.id}>
                <CardHeader>
                  <CardTitle className="text-base">{getTypeLabel(risk.type)}</CardTitle>
                  <CardDescription>{risk.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Impacto:</span>
                    {getImpactBadge(risk.impact)}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Probabilidade:</span>
                    {getProbabilityBadge(risk.probability)}
                  </div>
                  {risk.mitigation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mitigação:</p>
                      <p className="text-sm">{risk.mitigation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            Nenhum risco monitorado. Adicione riscos sugeridos ou crie riscos personalizados.
          </div>
        )}
      </div>
    </div>
  );
}
