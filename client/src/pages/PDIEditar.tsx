import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Edição de PDI
 * Permite editar todos os campos do PDI existente
 */

export default function PDIEditar() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const pdiId = parseInt(id || "0");

  const { data: pdi, isLoading } = trpc.pdi.getById.useQuery({ id: pdiId });

  // Estado do formulário
  const [formData, setFormData] = useState({
    status: "rascunho",
    startDate: "",
    endDate: "",
    overallProgress: 0,
  });

  const [kpis, setKpis] = useState({
    currentPosition: "",
    reframing: "",
    newPosition: "",
    performancePlanMonths: 24,
  });

  const [actionPlan, setActionPlan] = useState({
    practice70Items: [] as string[],
    social20Items: [] as string[],
    formal10Items: [] as string[],
  });

  const [timelineItems, setTimelineItems] = useState<Array<{
    title: string;
    description: string;
    targetDate: string;
    status: string;
  }>>([]);

  // Carregar dados do PDI
  useEffect(() => {
    if (pdi) {
      setFormData({
        status: pdi.plan.status,
        startDate: pdi.plan.startDate ? new Date(pdi.plan.startDate).toISOString().split('T')[0] : "",
        endDate: pdi.plan.endDate ? new Date(pdi.plan.endDate).toISOString().split('T')[0] : "",
        overallProgress: pdi.plan.overallProgress || 0,
      });

      if (pdi.kpis) {
        setKpis({
          currentPosition: pdi.kpis.currentPosition || "",
          reframing: pdi.kpis.reframing || "",
          newPosition: pdi.kpis.newPosition || "",
          performancePlanMonths: pdi.kpis.performancePlanMonths || 24,
        });
      }

      if (pdi.actionPlan) {
        setActionPlan({
          practice70Items: pdi.actionPlan.practice70Items || [],
          social20Items: pdi.actionPlan.social20Items || [],
          formal10Items: pdi.actionPlan.formal10Items || [],
        });
      }

      if (pdi.timeline) {
        setTimelineItems(pdi.timeline.map((item: any) => ({
          title: item.title,
          description: item.description || "",
          targetDate: item.targetDate ? new Date(item.targetDate).toISOString().split('T')[0] : "",
          status: item.status,
        })));
      }
    }
  }, [pdi]);

  // Mutation
  const updatePDI = trpc.pdi.update.useMutation({
    onSuccess: () => {
      toast.success("PDI atualizado com sucesso!");
      navigate(`/pdi/visualizar/${pdiId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar PDI: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error("Preencha as datas de início e fim");
      return;
    }

    updatePDI.mutate({
      id: pdiId,
      status: formData.status as any,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      overallProgress: formData.overallProgress,
      kpis,
      actionPlan,
      timeline: timelineItems.map((item, index) => ({
        ...item,
        targetDate: new Date(item.targetDate),
        orderIndex: index,
      })),
    });
  };

  const addPracticeItem = () => {
    setActionPlan({
      ...actionPlan,
      practice70Items: [...actionPlan.practice70Items, ""],
    });
  };

  const addSocialItem = () => {
    setActionPlan({
      ...actionPlan,
      social20Items: [...actionPlan.social20Items, ""],
    });
  };

  const addFormalItem = () => {
    setActionPlan({
      ...actionPlan,
      formal10Items: [...actionPlan.formal10Items, ""],
    });
  };

  const removePracticeItem = (index: number) => {
    setActionPlan({
      ...actionPlan,
      practice70Items: actionPlan.practice70Items.filter((_, i) => i !== index),
    });
  };

  const removeSocialItem = (index: number) => {
    setActionPlan({
      ...actionPlan,
      social20Items: actionPlan.social20Items.filter((_, i) => i !== index),
    });
  };

  const removeFormalItem = (index: number) => {
    setActionPlan({
      ...actionPlan,
      formal10Items: actionPlan.formal10Items.filter((_, i) => i !== index),
    });
  };

  const updatePracticeItem = (index: number, value: string) => {
    const newItems = [...actionPlan.practice70Items];
    newItems[index] = value;
    setActionPlan({ ...actionPlan, practice70Items: newItems });
  };

  const updateSocialItem = (index: number, value: string) => {
    const newItems = [...actionPlan.social20Items];
    newItems[index] = value;
    setActionPlan({ ...actionPlan, social20Items: newItems });
  };

  const updateFormalItem = (index: number, value: string) => {
    const newItems = [...actionPlan.formal10Items];
    newItems[index] = value;
    setActionPlan({ ...actionPlan, formal10Items: newItems });
  };

  const addTimelineItem = () => {
    setTimelineItems([
      ...timelineItems,
      {
        title: "",
        description: "",
        targetDate: "",
        status: "pendente",
      },
    ]);
  };

  const removeTimelineItem = (index: number) => {
    setTimelineItems(timelineItems.filter((_, i) => i !== index));
  };

  const updateTimelineItem = (index: number, field: string, value: string) => {
    const newItems = [...timelineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setTimelineItems(newItems);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pdi) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">PDI não encontrado</p>
              <Button onClick={() => navigate("/pdi")} className="mt-4">
                Voltar para lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/pdi/visualizar/${pdiId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar PDI</h1>
              <p className="text-gray-600 mt-1">
                {pdi.employee?.name || "Colaborador"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="pendente_aprovacao">Pendente Aprovação</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="overallProgress">Progresso Geral (%)</Label>
                    <Input
                      id="overallProgress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.overallProgress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overallProgress: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance (KPIs)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentPosition">Posição Atual</Label>
                    <Input
                      id="currentPosition"
                      value={kpis.currentPosition}
                      onChange={(e) =>
                        setKpis({ ...kpis, currentPosition: e.target.value })
                      }
                      placeholder="Ex: ~122%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reframing">Reenquadramento</Label>
                    <Input
                      id="reframing"
                      value={kpis.reframing}
                      onChange={(e) =>
                        setKpis({ ...kpis, reframing: e.target.value })
                      }
                      placeholder="Ex: +12,5%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPosition">Nova Posição</Label>
                    <Input
                      id="newPosition"
                      value={kpis.newPosition}
                      onChange={(e) =>
                        setKpis({ ...kpis, newPosition: e.target.value })
                      }
                      placeholder="Ex: ~137%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="performancePlanMonths">Plano de Performance (meses)</Label>
                    <Input
                      id="performancePlanMonths"
                      type="number"
                      min="1"
                      value={kpis.performancePlanMonths}
                      onChange={(e) =>
                        setKpis({
                          ...kpis,
                          performancePlanMonths: parseInt(e.target.value) || 24,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plano de Ação 70-20-10 */}
            <Card>
              <CardHeader>
                <CardTitle>Plano de Ação 70-20-10</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 70% - Prática */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-lg">70% - Aprendizado na Prática</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPracticeItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actionPlan.practice70Items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updatePracticeItem(index, e.target.value)}
                          placeholder="Descreva a ação prática..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePracticeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 20% - Social */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-lg">20% - Aprendizado com Outros</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSocialItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actionPlan.social20Items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateSocialItem(index, e.target.value)}
                          placeholder="Descreva a ação social..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSocialItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10% - Formal */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-lg">10% - Aprendizado Formal</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFormalItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actionPlan.formal10Items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateFormalItem(index, e.target.value)}
                          placeholder="Descreva a ação formal..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFormalItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Timeline de Acompanhamento</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimelineItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Marco
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineItems.map((item, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              updateTimelineItem(index, "title", e.target.value)
                            }
                            placeholder="Título do marco"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) =>
                              updateTimelineItem(index, "description", e.target.value)
                            }
                            placeholder="Descrição (opcional)"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Data Prevista</Label>
                              <Input
                                type="date"
                                value={item.targetDate}
                                onChange={(e) =>
                                  updateTimelineItem(index, "targetDate", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select
                                value={item.status}
                                onValueChange={(value) =>
                                  updateTimelineItem(index, "status", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                  <SelectItem value="concluido">Concluído</SelectItem>
                                  <SelectItem value="atrasado">Atrasado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTimelineItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/pdi/visualizar/${pdiId}`)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updatePDI.isPending}>
                {updatePDI.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
