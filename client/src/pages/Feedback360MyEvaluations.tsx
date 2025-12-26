import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Feedback360MyEvaluations() {
  const { user } = useAuth();

  const { data: evaluations, isLoading } = trpc.feedback360.getMyPendingEvaluations.useQuery(undefined);

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      self: "Autoavaliação",
      manager: "Gestor",
      peer: "Colega",
      subordinate: "Subordinado",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      self: "bg-blue-100 text-blue-800",
      manager: "bg-purple-100 text-purple-800",
      peer: "bg-green-100 text-green-800",
      subordinate: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.other;
  };

  const getDaysRemaining = (endDate: Date) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Atrasado
        </Badge>
      );
    } else if (daysRemaining <= 3) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-500">
          <Clock className="h-3 w-3" />
          Urgente
        </Badge>
      );
    } else if (daysRemaining <= 7) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining} dias
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          {daysRemaining} dias
        </Badge>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-4">
            <BackButton />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Minhas Avaliações 360°</h1>
            <p className="text-muted-foreground">
              Avaliações pendentes que você precisa completar
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {evaluations && evaluations.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evaluations.length}</div>
                <p className="text-xs text-muted-foreground">avaliações para completar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    evaluations.filter(
                      (e) => getDaysRemaining(e.cycleEndDate) <= 3 && getDaysRemaining(e.cycleEndDate) >= 0
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">prazo menor que 3 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {evaluations.filter((e) => getDaysRemaining(e.cycleEndDate) < 0).length}
                </div>
                <p className="text-xs text-muted-foreground">prazo vencido</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Avaliações */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : evaluations && evaluations.length > 0 ? (
          <div className="grid gap-4">
            {evaluations
              .sort((a, b) => getDaysRemaining(a.cycleEndDate) - getDaysRemaining(b.cycleEndDate))
              .map((evaluation) => {
                const daysRemaining = getDaysRemaining(evaluation.cycleEndDate);

                return (
                  <Card
                    key={evaluation.evaluatorRecordId}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{evaluation.cycleName}</CardTitle>
                            {getUrgencyBadge(daysRemaining)}
                          </div>
                          <CardDescription>
                            Avaliação de {evaluation.participantName}
                          </CardDescription>
                        </div>
                        <Badge className={getRelationshipColor(evaluation.relationshipType)}>
                          {getRelationshipLabel(evaluation.relationshipType)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Avaliado</p>
                            <p className="text-sm font-medium">{evaluation.participantName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Prazo</p>
                            <p className="text-sm font-medium">
                              {format(new Date(evaluation.cycleEndDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tempo restante</p>
                            <p className="text-sm font-medium">
                              {daysRemaining < 0
                                ? `${Math.abs(daysRemaining)} dias atrasado`
                                : daysRemaining === 0
                                ? "Último dia"
                                : `${daysRemaining} dias`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          window.location.href = `/feedback360/avaliar/${evaluation.evaluatorRecordId}`;
                        }}
                      >
                        Iniciar Avaliação
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-semibold">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground">
                Você não tem avaliações pendentes no momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
