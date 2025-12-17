import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Calendar,
  Download,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ListSkeleton from "@/components/ListSkeleton";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Dashboard de Metas SMART
 * Exibe KPIs, gráficos e lista de metas do colaborador
 */
export default function MetasSMART() {
  const [cycleFilter, setCycleFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  // Exportar PDF consolidado
  const exportConsolidatedPDFMutation = trpc.goals.exportConsolidatedPDF.useMutation({
    onSuccess: (data) => {
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Relatório PDF exportado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao exportar PDF", {
        description: error.message,
      });
    },
  });

  // Buscar dashboard com KPIs
  const { data: dashboard, isLoading: loadingDashboard } = trpc.goals.getDashboard.useQuery({
    cycleId: cycleFilter,
  });

  // Buscar lista de metas
  const { data: goals = [], isLoading: loadingGoals } = trpc.goals.list.useQuery({
    cycleId: cycleFilter,
    status: statusFilter as any,
    category: categoryFilter as any,
  });

  // Buscar ciclos disponíveis
  const { data: cycles = [] } = trpc.cyclesLegacy.list.useQuery();

  // Buscar metas do PDI
  const { data: pdiGoals = [], isLoading: loadingPDI } = trpc.pdi.list.useQuery({});

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      pending_approval: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      in_progress: "bg-blue-500",
      completed: "bg-emerald-500",
      cancelled: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      pending_approval: "Aguardando Aprovação",
      approved: "Aprovada",
      rejected: "Rejeitada",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
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

  if (loadingDashboard || loadingGoals) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Metas SMART</h1>
              <p className="text-muted-foreground mt-1">Carregando suas metas...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i: number) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
          <ListSkeleton count={5} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Metas SMART</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas metas com critérios SMART e acompanhe seu progresso
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportConsolidatedPDFMutation.mutate({
                cycleId: cycleFilter,
                status: statusFilter as any,
                category: categoryFilter as any,
              })
            }
            disabled={exportConsolidatedPDFMutation.isPending || goals.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportConsolidatedPDFMutation.isPending ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Link href="/metas/criar">
            <Button className="bg-[#F39200] hover:bg-[#d67e00]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activeGoals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard?.totalGoals || 0} metas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.completionRate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard?.completedGoals || 0} metas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bônus Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboard?.potentialBonus?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Baseado em metas elegíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Progresso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0
                ? Math.round(
                    goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">Todas as metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Categoria */}
      {dashboard && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dashboard?.byCategory?.financial || 0}
                </div>
                <p className="text-sm text-gray-600">Financeiras</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboard?.byCategory?.behavioral || 0}
                </div>
                <p className="text-sm text-gray-600">Comportamentais</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboard?.byCategory?.corporate || 0}
                </div>
                <p className="text-sm text-gray-600">Corporativas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboard?.byCategory?.development || 0}
                </div>
                <p className="text-sm text-gray-600">Desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className="text-sm font-medium mb-2 block">Ciclo</label>
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
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-sm font-medium mb-2 block">Categoria</label>
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

      {/* Metas do PDI */}
      {pdiGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Metas do PDI ({pdiGoals.length})
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso das metas de desenvolvimento do seu Plano de Desenvolvimento Individual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pdiGoals.map((pdi: any) => (
                <div key={pdi.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{pdi.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{pdi.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      PDI
                    </Badge>
                  </div>

                  {/* Progresso do PDI */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progresso Geral</span>
                      <span className="font-semibold">{pdi.progress || 0}%</span>
                    </div>
                    <Progress value={pdi.progress || 0} className="h-2" />
                  </div>

                  {/* Datas do PDI */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(pdi.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(new Date(pdi.endDate), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {new Date(pdi.endDate) < new Date() && pdi.status !== "completed" && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Vencido
                      </Badge>
                    )}
                  </div>

                  {/* Ações do PDI */}
                  <div className="flex gap-2">
                    <Link href={`/pdi/${pdi.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                    <Link href={`/pdi/${pdi.id}/progresso`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Atualizar Progresso
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Metas SMART */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Minhas Metas SMART ({goals.length})</h2>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma meta encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando sua primeira meta SMART
              </p>
              <Link href="/metas/criar">
                <Button className="bg-[#F39200] hover:bg-[#d67e00]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Meta
                </Button>
              </Link>
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
                      <Badge className={getStatusColor(goal.status)}>
                        {getStatusLabel(goal.status)}
                      </Badge>
                      {goal.bonusEligible && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Bônus
                        </Badge>
                      )}
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
                {/* Progresso */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-semibold">{goal.progress || 0}%</span>
                  </div>
                  <Progress value={goal.progress || 0} className="h-2" />
                </div>

                {/* Métricas */}
                {goal.measurementUnit && goal.targetValue && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Meta:</span>
                      <span className="font-semibold">
                        {goal.targetValue} {goal.measurementUnit}
                      </span>
                    </div>
                    {goal.currentValue && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Atual:</span>
                        <span className="font-semibold">
                          {goal.currentValue} {goal.measurementUnit}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Datas */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(goal.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(new Date(goal.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {new Date(goal.endDate) < new Date() && goal.status !== "completed" && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Vencida
                    </Badge>
                  )}
                </div>

                {/* Critérios SMART */}
                <div className="flex gap-2 flex-wrap">
                  {goal.isSpecific && (
                    <Badge variant="outline" className="bg-blue-50">
                      ✓ Específica
                    </Badge>
                  )}
                  {goal.isMeasurable && (
                    <Badge variant="outline" className="bg-green-50">
                      ✓ Mensurável
                    </Badge>
                  )}
                  {goal.isAchievable && (
                    <Badge variant="outline" className="bg-purple-50">
                      ✓ Atingível
                    </Badge>
                  )}
                  {goal.isRelevant && (
                    <Badge variant="outline" className="bg-orange-50">
                      ✓ Relevante
                    </Badge>
                  )}
                  {goal.isTimeBound && (
                    <Badge variant="outline" className="bg-pink-50">
                      ✓ Temporal
                    </Badge>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/metas/${goal.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                  {goal.status === "draft" && (
                    <Link href={`/metas/${goal.id}/editar`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                  )}
                  {["approved", "in_progress"].includes(goal.status) && (
                    <Link href={`/metas/${goal.id}/progresso`}>
                      <Button size="sm" className="bg-[#F39200] hover:bg-[#d67e00]">
                        Atualizar Progresso
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
