import { useState } from "react";
import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Save, Download, ArrowLeft, TrendingUp, Calendar, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import { exportPDIPDF } from "@/lib/pdfExport";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * PDI Inteligente - Detalhes com Ações e Acompanhamento
 * Modelo Nadia: Tabela de ações 70-20-10 + Feedbacks DGC + Gráfico IPS
 */

export default function PDIInteligenteDetalhes() {
  const [, params] = useRoute("/pdi-inteligente/:id/detalhes");
  const pdiId = params?.id ? parseInt(params.id) : null;

  const [showAddAction, setShowAddAction] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);

  // Form states
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    axis: "70_pratica" as "70_pratica" | "20_experiencia" | "10_educacao",
    developmentArea: "",
    successMetric: "",
    evidenceRequired: "",
    responsible: "",
    dueDate: "",
  });

  const [reviewForm, setReviewForm] = useState({
    reviewDate: new Date().toISOString().split("T")[0],
    readinessIndex: 3,
    keyPoints: "",
    strengths: "",
    improvements: "",
    nextSteps: "",
  });

  // Queries
  const utils = trpc.useUtils();
  const { data: pdi, isLoading: loadingPDI } = trpc.pdiIntelligent.getById.useQuery(
    { id: pdiId! },
    { enabled: !!pdiId }
  );
  const { data: actions, isLoading: loadingActions } = trpc.pdiIntelligent.getActions.useQuery(
    { planId: pdiId! },
    { enabled: !!pdiId }
  );
  const { data: reviews, isLoading: loadingReviews } = trpc.pdiIntelligent.getGovernanceReviews.useQuery(
    { planId: pdiId! },
    { enabled: !!pdiId }
  );
  const { data: ipsEvolution } = trpc.pdiIntelligent.getIPSEvolution.useQuery(
    { planId: pdiId! },
    { enabled: !!pdiId }
  );

  // Mutations
  const addActionMutation = trpc.pdiIntelligent.addAction.useMutation({
    onSuccess: () => {
      toast.success("Ação adicionada com sucesso!");
      utils.pdiIntelligent.getActions.invalidate({ planId: pdiId! });
      setShowAddAction(false);
      setActionForm({
        title: "",
        description: "",
        axis: "70_pratica",
        developmentArea: "",
        successMetric: "",
        evidenceRequired: "",
        responsible: "",
        dueDate: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar ação: ${error.message}`);
    },
  });

  const updateActionStatusMutation = trpc.pdiIntelligent.updateActionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.pdiIntelligent.getActions.invalidate({ planId: pdiId! });
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const addReviewMutation = trpc.pdiIntelligent.addGovernanceReview.useMutation({
    onSuccess: () => {
      toast.success("Feedback adicionado com sucesso!");
      utils.pdiIntelligent.getGovernanceReviews.invalidate({ planId: pdiId! });
      utils.pdiIntelligent.getIPSEvolution.invalidate({ planId: pdiId! });
      setShowAddReview(false);
      setReviewForm({
        reviewDate: new Date().toISOString().split("T")[0],
        readinessIndex: 3,
        keyPoints: "",
        strengths: "",
        improvements: "",
        nextSteps: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar feedback: ${error.message}`);
    },
  });

  const handleAddAction = () => {
    if (!pdiId) return;
    addActionMutation.mutate({
      planId: pdiId,
      ...actionForm,
    });
  };

  const handleUpdateStatus = (actionId: number, status: "nao_iniciado" | "em_andamento" | "concluido") => {
    updateActionStatusMutation.mutate({ id: actionId, status });
  };

  const handleAddReview = () => {
    if (!pdiId) return;
    addReviewMutation.mutate({
      planId: pdiId,
      reviewerId: 1, // TODO: pegar do contexto do usuário
      reviewerRole: "dgc",
      ...reviewForm,
    });
  };

  // Dados do gráfico de evolução do IPS
  const ipsChartData = {
    labels: ipsEvolution?.map((e) => new Date(e.reviewDate).toLocaleDateString("pt-BR")) || [],
    datasets: [
      {
        label: "Índice de Prontidão para Sucessão (IPS)",
        data: ipsEvolution?.map((e) => parseFloat(e.readinessIndex)) || [],
        borderColor: "rgb(124, 58, 237)",
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const ipsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5,
        },
      },
    },
  };

  if (loadingPDI) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pdi) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">PDI não encontrado</h2>
          <Link href="/pdi-inteligente">
            <Button>Voltar</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      nao_iniciado: { label: "Não Iniciado", variant: "secondary" },
      em_andamento: { label: "Em Andamento", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
    };
    const config = variants[status] || variants.nao_iniciado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAxisBadge = (axis: string) => {
    const labels: Record<string, string> = {
      "70_pratica": "70% Prática",
      "20_experiencia": "20% Experiência",
      "10_educacao": "10% Educação",
    };
    return <Badge variant="outline">{labels[axis] || axis}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pdi-inteligente">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">PDI Inteligente - {pdi.employees?.name || "Colaborador"}</h1>
              <p className="text-muted-foreground">
                Cargo Alvo: {pdi.positions?.title || "N/A"} | Período: {new Date(pdi.pdiPlans.startDate).toLocaleDateString("pt-BR")} - {new Date(pdi.pdiPlans.endDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  await exportPDIPDF({
                    employeeName: pdi.employees?.name,
                    targetPositionName: pdi.positions?.title,
                    duration: Math.ceil((new Date(pdi.pdiPlans.endDate).getTime() - new Date(pdi.pdiPlans.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)),
                    overallProgress: pdi.pdiPlans.overallProgress,
                    status: pdi.pdiPlans.status,
                    createdAt: pdi.pdiPlans.createdAt,
                    objectives: pdi.pdiPlans.strategicObjectives,
                    actions: actions || [],
                    keyAreas: pdi.pdiIntelligentDetails?.keyDevelopmentAreas ? JSON.parse(pdi.pdiIntelligentDetails.keyDevelopmentAreas) : [],
                    competencyGaps: pdi.competencyGaps || []
                  });
                  toast.success('PDF exportado com sucesso!');
                } catch (error) {
                  console.error('Erro ao exportar PDF:', error);
                  toast.error('Erro ao exportar PDF');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Seção 1: Plano de Ação Detalhado (70-20-10) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Plano de Ação Detalhado (70-20-10)
                </CardTitle>
                <CardDescription>
                  Ações específicas com métricas de sucesso, responsáveis e status
                </CardDescription>
              </div>
              <Dialog open={showAddAction} onOpenChange={setShowAddAction}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Ação do PDI</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova ação ao plano de desenvolvimento
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título da Ação</Label>
                      <Input
                        id="title"
                        value={actionForm.title}
                        onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                        placeholder="Ex: Liderar Projeto Almox 5.0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={actionForm.description}
                        onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                        placeholder="Descreva a ação em detalhes..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="axis">Eixo (70-20-10)</Label>
                        <Select value={actionForm.axis} onValueChange={(value: any) => setActionForm({ ...actionForm, axis: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70_pratica">70% Prática</SelectItem>
                            <SelectItem value="20_experiencia">20% Experiência</SelectItem>
                            <SelectItem value="10_educacao">10% Educação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="developmentArea">Eixo de Desenvolvimento</Label>
                        <Input
                          id="developmentArea"
                          value={actionForm.developmentArea}
                          onChange={(e) => setActionForm({ ...actionForm, developmentArea: e.target.value })}
                          placeholder="Ex: Visão Holística"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="successMetric">Métrica de Sucesso / Evidência</Label>
                      <Textarea
                        id="successMetric"
                        value={actionForm.successMetric}
                        onChange={(e) => setActionForm({ ...actionForm, successMetric: e.target.value })}
                        placeholder="Como medir o sucesso desta ação?"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="responsible">Responsáveis</Label>
                        <Input
                          id="responsible"
                          value={actionForm.responsible}
                          onChange={(e) => setActionForm({ ...actionForm, responsible: e.target.value })}
                          placeholder="Ex: Nadia C. (Líder), Carlos M. (Sponsor)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dueDate">Prazo</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={actionForm.dueDate}
                          onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddAction(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddAction} disabled={addActionMutation.isPending}>
                      {addActionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingActions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : actions && actions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação Específica (e % de Foco)</TableHead>
                      <TableHead>Eixo de Desenvolvimento</TableHead>
                      <TableHead>Métrica de Sucesso</TableHead>
                      <TableHead>Responsáveis</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getAxisBadge(action.axis)} {action.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">{action.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{action.developmentArea}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{action.successMetric}</TableCell>
                        <TableCell className="text-sm">{action.responsible}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(action.dueDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={action.status}
                            onValueChange={(value: any) => handleUpdateStatus(action.id, value)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação cadastrada. Clique em "Adicionar Ação" para começar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 2: Acompanhamento e Medição (DGC) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Acompanhamento e Medição (DGC)
                </CardTitle>
                <CardDescription>
                  Monitoramento do progresso através de métricas claras e reuniões de governança
                </CardDescription>
              </div>
              <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Registro de Acompanhamento</DialogTitle>
                    <DialogDescription>
                      Adicione um feedback de reunião de governança
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reviewDate">Data da Reunião</Label>
                        <Input
                          id="reviewDate"
                          type="date"
                          value={reviewForm.reviewDate}
                          onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="readinessIndex">Índice de Prontidão (IPS - 1 a 5)</Label>
                        <Input
                          id="readinessIndex"
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={reviewForm.readinessIndex}
                          onChange={(e) => setReviewForm({ ...reviewForm, readinessIndex: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="keyPoints">Pontos-Chave e Feedback</Label>
                      <Textarea
                        id="keyPoints"
                        value={reviewForm.keyPoints}
                        onChange={(e) => setReviewForm({ ...reviewForm, keyPoints: e.target.value })}
                        placeholder="Principais pontos discutidos na reunião..."
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="strengths">Pontos Fortes Observados</Label>
                      <Textarea
                        id="strengths"
                        value={reviewForm.strengths}
                        onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                        placeholder="Forças identificadas..."
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="improvements">Pontos de Melhoria</Label>
                      <Textarea
                        id="improvements"
                        value={reviewForm.improvements}
                        onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })}
                        placeholder="Áreas que precisam de atenção..."
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nextSteps">Próximos Passos</Label>
                      <Textarea
                        id="nextSteps"
                        value={reviewForm.nextSteps}
                        onChange={(e) => setReviewForm({ ...reviewForm, nextSteps: e.target.value })}
                        placeholder="Ações para o próximo período..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddReview(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddReview} disabled={addReviewMutation.isPending}>
                      {addReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gráfico de Evolução do IPS */}
            {ipsEvolution && ipsEvolution.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Evolução do Índice de Prontidão (IPS)</h3>
                <div className="h-[300px]">
                  <Line data={ipsChartData} options={ipsChartOptions} />
                </div>
              </div>
            )}

            {/* Histórico de Reuniões */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Histórico de Reuniões de Governança</h3>
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <CardTitle className="text-base">
                                {new Date(review.reviewDate).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </CardTitle>
                              <CardDescription>
                                {review.reviewerName} - {review.reviewerRole.toUpperCase()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="default" className="text-lg px-4 py-2">
                            IPS: {review.readinessIndex}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="font-medium text-sm text-muted-foreground mb-1">Pontos-Chave:</p>
                          <p className="text-sm">{review.keyPoints}</p>
                        </div>
                        {review.strengths && (
                          <div>
                            <p className="font-medium text-sm text-muted-foreground mb-1">Pontos Fortes:</p>
                            <p className="text-sm">{review.strengths}</p>
                          </div>
                        )}
                        {review.improvements && (
                          <div>
                            <p className="font-medium text-sm text-muted-foreground mb-1">Pontos de Melhoria:</p>
                            <p className="text-sm">{review.improvements}</p>
                          </div>
                        )}
                        {review.nextSteps && (
                          <div>
                            <p className="font-medium text-sm text-muted-foreground mb-1">Próximos Passos:</p>
                            <p className="text-sm">{review.nextSteps}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum feedback registrado. Clique em "Adicionar Feedback" para começar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
