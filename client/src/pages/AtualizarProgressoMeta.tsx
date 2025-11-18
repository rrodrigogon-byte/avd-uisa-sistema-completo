import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  TrendingUp,
  Target,
  CheckCircle2,
  Plus,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Atualização de Progresso da Meta
 * Permite atualizar progresso, valor atual e adicionar marcos
 */
export default function AtualizarProgressoMeta() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const goalId = parseInt(id || "0");

  const [progress, setProgress] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [comment, setComment] = useState("");

  // Buscar meta
  const { data: goal, isLoading, refetch } = trpc.smartGoals.getById.useQuery({ goalId });

  // Atualizar progresso
  const updateProgressMutation = trpc.smartGoals.updateProgress.useMutation({
    onSuccess: () => {
      toast.success("Progresso atualizado com sucesso!");
      setProgress("");
      setCurrentValue("");
      setComment("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar progresso", {
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!progress) {
      toast.error("Informe o progresso atual");
      return;
    }

    const progressNum = parseInt(progress);
    if (progressNum < 0 || progressNum > 100) {
      toast.error("Progresso deve estar entre 0 e 100");
      return;
    }

    const payload: any = {
      goalId,
      progress: progressNum,
    };
    if (currentValue) payload.currentValue = parseFloat(currentValue);
    if (comment) payload.comment = comment;

    await updateProgressMutation.mutateAsync(payload);
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

  if (!["approved", "in_progress"].includes(goal.status)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Meta não disponível para atualização
            </h3>
            <p className="text-gray-600 mb-4">
              Apenas metas aprovadas ou em andamento podem ter progresso atualizado
            </p>
            <Button onClick={() => navigate(`/metas/${goalId}`)}>Ver Detalhes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = goal.progress || 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/metas/${goalId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Atualizar Progresso</h1>
        <p className="text-gray-600 mt-1">{goal.title}</p>
      </div>

      {/* Progresso Atual */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progresso Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{progressPercentage}%</span>
              <Badge
                variant={
                  progressPercentage === 100
                    ? "default"
                    : progressPercentage >= 50
                    ? "secondary"
                    : "outline"
                }
              >
                {progressPercentage === 100
                  ? "Concluída"
                  : progressPercentage >= 50
                  ? "Em Andamento"
                  : "Iniciando"}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-3" />

            {goal.measurementUnit && goal.targetValue && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Valor Atual</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {goal.currentValue || 0} {goal.measurementUnit}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Valor Alvo</p>
                  <p className="text-2xl font-bold text-green-900">
                    {goal.targetValue} {goal.measurementUnit}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Atualização */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova Atualização</CardTitle>
            <CardDescription>
              Registre o progresso atual e adicione observações relevantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="progress">Progresso (%) *</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Ex: 75"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor entre 0 e 100. Atual: {progressPercentage}%
                </p>
              </div>

              {goal.measurementUnit && (
                <div>
                  <Label htmlFor="currentValue">
                    Valor Atual ({goal.measurementUnit})
                  </Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    placeholder={`Ex: ${goal.targetValue || 100}`}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Atual: {goal.currentValue || 0} / Meta: {goal.targetValue}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="comment">Comentário (Opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Descreva as ações realizadas, desafios enfrentados ou próximos passos..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Registre informações importantes sobre esta atualização
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Dica</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Atualize o progresso regularmente para manter gestores e RH informados.
                    Quando atingir 100%, a meta será marcada como concluída automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/metas/${goalId}`)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updateProgressMutation.isPending}
            className="bg-[#F39200] hover:bg-[#d67e00]"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProgressMutation.isPending ? "Salvando..." : "Salvar Atualização"}
          </Button>
        </div>
      </form>

      {/* Histórico de Atualizações */}
      {goal.comments && goal.comments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico de Atualizações ({goal.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.comments
                .slice()
                .reverse()
                .map((commentItem: any) => (
                  <div key={commentItem.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{commentItem.authorName || "Usuário"}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(commentItem.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {commentItem.comment}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marcos */}
      {goal.milestones && goal.milestones.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Marcos Intermediários ({goal.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.milestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{milestone.title}</h4>
                      {milestone.status === "completed" && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Prazo:{" "}
                        {format(new Date(milestone.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span>Progresso: {milestone.progress || 0}%</span>
                    </div>
                  </div>
                  <Progress value={milestone.progress || 0} className="w-24 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
