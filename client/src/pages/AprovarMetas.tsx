import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Aprovação de Metas para Gestores/RH
 * Lista metas pendentes de aprovação e permite aprovar/rejeitar
 */
export default function AprovarMetas() {
  const [cycleFilter, setCycleFilter] = useState<number | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  // Buscar metas pendentes de aprovação
  const { data: goals = [], isLoading, refetch } = trpc.goals.list.useQuery({
    status: "pending_approval",
    cycleId: cycleFilter,
    category: categoryFilter as any,
  });

  // Buscar ciclos
  const { data: cycles = [] } = trpc.evaluationCycles.list.useQuery(undefined);

  // Aprovar meta
  const approveMutation = trpc.goals.approve.useMutation({
    onSuccess: () => {
      toast.success("Meta aprovada com sucesso!");
      setShowApproveDialog(false);
      setComments("");
      setSelectedGoal(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao aprovar meta", {
        description: error.message,
      });
    },
  });

  // Rejeitar meta
  const rejectMutation = trpc.goals.reject.useMutation({
    onSuccess: () => {
      toast.success("Meta rejeitada");
      setShowRejectDialog(false);
      setComments("");
      setSelectedGoal(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao rejeitar meta", {
        description: error.message,
      });
    },
  });

  const handleApprove = async () => {
    if (!selectedGoal) return;

    await approveMutation.mutateAsync({
      goalId: selectedGoal.id,
      comments: comments || undefined,
    });
  };

  const handleReject = async () => {
    if (!selectedGoal) return;

    if (!comments.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    await rejectMutation.mutateAsync({
      goalId: selectedGoal.id,
      comments,
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      financial: "Financeira",
      behavioral: "Comportamental",
      corporate: "Corporativa",
      development: "Desenvolvimento",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      financial: "text-green-600",
      behavioral: "text-blue-600",
      corporate: "text-purple-600",
      development: "text-orange-600",
    };
    return colors[category] || "text-gray-600";
  };

  const smartScore = (goal: any) =>
    [goal.isSpecific, goal.isMeasurable, goal.isAchievable, goal.isRelevant, goal.isTimeBound].filter(
      Boolean
    ).length * 20;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i: any) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aprovação de Metas</h1>
        <p className="text-gray-600 mt-1">
          Revise e aprove metas enviadas pelos colaboradores
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-gray-500 mt-1">Aguardando sua análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas com Bônus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter((g) => g.bonusEligible).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Elegíveis para bônus financeiro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score SMART Médio</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0
                ? Math.round(goals.reduce((sum, g) => sum + smartScore(g), 0) / goals.length)
                : 0}
              /100
            </div>
            <p className="text-xs text-gray-500 mt-1">Qualidade das metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <Label className="text-sm font-medium mb-2 block">Ciclo</Label>
            <Select
              value={cycleFilter?.toString() || "all"}
              onValueChange={(v) => setCycleFilter(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os ciclos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ciclos</SelectItem>
                {cycles.map((cycle: any) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-sm font-medium mb-2 block">Categoria</Label>
            <Select
              value={categoryFilter || "all"}
              onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="financial">Financeira</SelectItem>
                <SelectItem value="behavioral">Comportamental</SelectItem>
                <SelectItem value="corporate">Corporativa</SelectItem>
                <SelectItem value="development">Desenvolvimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Metas Pendentes ({goals.length})</h2>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma meta pendente
              </h3>
              <p className="text-gray-600">Todas as metas foram revisadas</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal: any) => (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className="bg-yellow-500">Aguardando Aprovação</Badge>
                      {goal.bonusEligible && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          💰 Bônus
                        </Badge>
                      )}
                      <Badge variant="outline">
                        SMART: {smartScore(goal)}/100
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {goal.description}
                    </CardDescription>
                  </div>
                  <span className={`text-sm font-medium ${getCategoryColor(goal.category)}`}>
                    {getCategoryLabel(goal.category)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações do Colaborador */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Colaborador:</span>
                    <span className="font-semibold">{goal.employeeName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Período:</span>
                    <span className="font-semibold">
                      {format(new Date(goal.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(new Date(goal.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {/* Métricas */}
                {goal.measurementUnit && goal.targetValue && (
                  <div className="flex items-center gap-4 text-sm bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">Meta:</span>
                      <span className="font-semibold text-blue-900">
                        {goal.targetValue} {goal.measurementUnit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700">Peso:</span>
                      <span className="font-semibold text-blue-900">{goal.weight}%</span>
                    </div>
                  </div>
                )}

                {/* Critérios SMART */}
                <div className="flex gap-2 flex-wrap">
                  {goal.isSpecific && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Específica
                    </Badge>
                  )}
                  {goal.isMeasurable && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Mensurável
                    </Badge>
                  )}
                  {goal.isAchievable && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Atingível
                    </Badge>
                  )}
                  {goal.isRelevant && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Relevante
                    </Badge>
                  )}
                  {goal.isTimeBound && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Temporal
                    </Badge>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/metas/${goal.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </Link>

                  <Dialog
                    open={showApproveDialog && selectedGoal?.id === goal.id}
                    onOpenChange={(open) => {
                      setShowApproveDialog(open);
                      if (!open) {
                        setSelectedGoal(null);
                        setComments("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aprovar Meta</DialogTitle>
                        <DialogDescription>
                          Confirme a aprovação da meta: <strong>{goal.title}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="approve-comments">Comentários (Opcional)</Label>
                          <Textarea
                            id="approve-comments"
                            placeholder="Adicione observações ou orientações..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowApproveDialog(false);
                              setComments("");
                              setSelectedGoal(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleApprove}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveMutation.isPending ? "Aprovando..." : "Confirmar Aprovação"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={showRejectDialog && selectedGoal?.id === goal.id}
                    onOpenChange={(open) => {
                      setShowRejectDialog(open);
                      if (!open) {
                        setSelectedGoal(null);
                        setComments("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeitar Meta</DialogTitle>
                        <DialogDescription>
                          Informe o motivo da rejeição da meta: <strong>{goal.title}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-900">Atenção</p>
                              <p className="text-sm text-yellow-700 mt-1">
                                O colaborador será notificado e deverá revisar a meta antes de
                                reenviar para aprovação.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="reject-comments">Motivo da Rejeição *</Label>
                          <Textarea
                            id="reject-comments"
                            placeholder="Explique o motivo da rejeição e as melhorias necessárias..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={4}
                            className="mt-1"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRejectDialog(false);
                              setComments("");
                              setSelectedGoal(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleReject}
                            disabled={rejectMutation.isPending}
                            variant="destructive"
                          >
                            {rejectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
