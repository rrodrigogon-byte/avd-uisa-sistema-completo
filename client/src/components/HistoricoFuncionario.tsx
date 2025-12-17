import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Target, FileText, TrendingUp, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";

/**
 * Componente de Histórico do Funcionário
 * Timeline com todas as atividades: avaliações, metas, PDI, promoções, etc
 */

interface HistoricoFuncionarioProps {
  employeeId: number;
}

export default function HistoricoFuncionario({ employeeId }: HistoricoFuncionarioProps) {
  // Queries para buscar histórico
  const { data: evaluations, isLoading: loadingEvaluations } = trpc.performance.listByEmployee.useQuery({ employeeId });
  const { data: goals, isLoading: loadingGoals } = trpc.goals.listByEmployee.useQuery({ employeeId });
  const { data: pdiPlans, isLoading: loadingPDI } = trpc.pdi.listByEmployee.useQuery({ employeeId });

  const isLoading = loadingEvaluations || loadingGoals || loadingPDI;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  // Combinar todos os eventos em uma timeline
  const events = [
    ...(evaluations || []).map((evaluation: any) => ({
      type: "evaluation",
      date: evaluation.createdAt || new Date(),
      title: "Avaliação de Desempenho",
      description: `Score final: ${evaluation.finalScore || evaluation.selfScore || "-"}/5`,
      status: evaluation.status,
      icon: Award,
      color: "blue",
    })),
    ...(goals || []).map((goal: any) => ({
      type: "goal",
      date: goal.createdAt || new Date(),
      title: goal.title || "Meta",
      description: `Progresso: ${goal.progress || 0}%`,
      status: goal.status,
      icon: Target,
      color: "green",
    })),
    ...(pdiPlans || []).map((pdi: any) => ({
      type: "pdi",
      date: pdi.createdAt || new Date(),
      title: "Plano de Desenvolvimento Individual",
      description: `Progresso geral: ${pdi.overallProgress || 0}%`,
      status: pdi.status,
      icon: FileText,
      color: "purple",
    })),
  ];

  // Ordenar por data (mais recente primeiro)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Nenhum histórico registrado</p>
        </div>
      </Card>
    );
  }

  // Mapear status para ícones e cores
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { icon: any; color: string; label: string }> = {
      concluida: { icon: CheckCircle2, color: "green", label: "Concluída" },
      concluido: { icon: CheckCircle2, color: "green", label: "Concluído" },
      completed: { icon: CheckCircle2, color: "green", label: "Concluído" },
      em_andamento: { icon: Clock, color: "blue", label: "Em Andamento" },
      in_progress: { icon: Clock, color: "blue", label: "Em Andamento" },
      aprovada: { icon: CheckCircle2, color: "green", label: "Aprovada" },
      aprovado: { icon: CheckCircle2, color: "green", label: "Aprovado" },
      pendente: { icon: Clock, color: "yellow", label: "Pendente" },
      pendente_aprovacao: { icon: Clock, color: "yellow", label: "Pendente Aprovação" },
      cancelada: { icon: XCircle, color: "red", label: "Cancelada" },
      cancelado: { icon: XCircle, color: "red", label: "Cancelado" },
      rascunho: { icon: FileText, color: "gray", label: "Rascunho" },
    };

    return statusMap[status] || { icon: Clock, color: "gray", label: status };
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">
                {evaluations?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Avaliações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">
                {goals?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Metas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">
                {pdiPlans?.length || 0}
              </p>
              <p className="text-sm text-gray-600">PDIs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Eventos */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Timeline de Atividades
          </h3>
          <div className="space-y-4">
            {events.map((event, index) => {
              const Icon = event.icon;
              const statusConfig = getStatusConfig(event.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={index} className="flex gap-4">
                  {/* Linha da Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-2 rounded-full bg-${event.color}-100`}
                    >
                      <Icon className={`w-5 h-5 text-${event.color}-600`} />
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Conteúdo do Evento */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {event.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border-${statusConfig.color}-200`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
