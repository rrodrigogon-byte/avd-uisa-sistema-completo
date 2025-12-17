import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Calendar, Eye, Loader2, Mail, Plus, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ManageEvaluations() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: evaluations, isLoading, refetch } = trpc.evaluations.list.useQuery();
  const sendNotificationMutation = trpc.evaluations.sendNotification.useMutation({
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar notificação: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
    if (!authLoading && user?.role !== "admin") {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const handleSendNotification = async (evaluationId: number) => {
    await sendNotificationMutation.mutateAsync({ evaluationId });
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Avaliações</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as avaliações de desempenho
            </p>
          </div>
          <Button onClick={() => setLocation("/nova-avaliacao")}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Avaliação
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluations?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Registradas no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {evaluations && evaluations.length > 0
                  ? (
                      evaluations.reduce((sum, e) => sum + e.finalScore, 0) / evaluations.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">Pontuação média</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excelentes</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {evaluations?.filter((e) => e.finalScore >= 90).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pontuação ≥ 90</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Necessitam Atenção</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {evaluations?.filter((e) => e.finalScore < 50).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pontuação &lt; 50</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Avaliações</CardTitle>
            <CardDescription>
              Todas as avaliações registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!evaluations || evaluations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando uma nova avaliação de desempenho
                </p>
                <Button onClick={() => setLocation("/nova-avaliacao")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avaliado</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Avaliador</TableHead>
                    <TableHead>Pontuação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation: any) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.employeeName}</TableCell>
                      <TableCell>{evaluation.employeePosition}</TableCell>
                      <TableCell>{evaluation.evaluationPeriod}</TableCell>
                      <TableCell>{evaluation.evaluatorName}</TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(evaluation.finalScore)}>
                          {evaluation.finalScore.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocation(`/avaliacoes/${evaluation.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendNotification(evaluation.id)}
                          disabled={sendNotificationMutation.isPending}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Notificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
