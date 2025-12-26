import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Feedbacks Pendentes
 * Exibe avaliações 360° que o usuário precisa responder
 */
export default function MeusFeedbacks() {
  const [, setLocation] = useLocation();

  const { data: pendingEvaluations, isLoading } =
    trpc.feedback360.getMyPendingEvaluations.useQuery(undefined);

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      self: "Autoavaliação",
      manager: "Como Gestor",
      peer: "Como Colega",
      subordinate: "Como Subordinado",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isOverdue = (endDate: Date | string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meus Feedbacks Pendentes</h1>
        <p className="text-muted-foreground mt-1">
          Avaliações 360° aguardando sua resposta
        </p>
      </div>

      {/* Alertas */}
      {pendingEvaluations && pendingEvaluations.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Você tem {pendingEvaluations.length} avaliação(ões) pendente(s)
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Por favor, complete suas avaliações dentro do prazo para contribuir
                  com o desenvolvimento da equipe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Feedbacks */}
      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : pendingEvaluations && pendingEvaluations.length > 0 ? (
          pendingEvaluations.map((evaluation) => (
            <Card
              key={evaluation.evaluatorRecordId}
              className={
                isOverdue(evaluation.cycleEndDate)
                  ? "border-red-500"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {evaluation.cycleName}
                    </CardTitle>
                    <CardDescription>
                      Avaliar: {evaluation.participantName}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      isOverdue(evaluation.cycleEndDate)
                        ? "destructive"
                        : "default"
                    }
                  >
                    {getRelationshipLabel(evaluation.relationshipType)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{evaluation.participantEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Prazo: {formatDate(evaluation.cycleEndDate)}
                      </span>
                    </div>
                  </div>

                  {isOverdue(evaluation.cycleEndDate) && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">
                        Prazo vencido! Complete esta avaliação o quanto antes.
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() =>
                        setLocation(
                          `/feedback360/responder/${evaluation.evaluatorRecordId}`
                        )
                      }
                      variant={
                        isOverdue(evaluation.cycleEndDate)
                          ? "destructive"
                          : "default"
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Responder Avaliação
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhuma avaliação pendente
                </h3>
                <p className="text-muted-foreground mt-2">
                  Você está em dia com todas as suas avaliações 360°!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
