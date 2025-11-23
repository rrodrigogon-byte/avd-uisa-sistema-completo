import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, Target, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

/**
 * Dashboard de Acompanhamento de Metas por Ciclo
 * 
 * Mostra estatísticas reais de preenchimento de metas pelos funcionários
 * após aprovação dos ciclos de avaliação 360°
 */
export default function DashboardMetasCiclos() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);

  // Buscar estatísticas de metas por ciclo
  const { data: cycleStats, isLoading, refetch } = trpc.goals.countByCycle.useQuery({
    cycleId: selectedCycleId,
  });

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAdherenceBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: "default" as const, label: "Ótima Adesão" };
    if (percentage >= 50) return { variant: "secondary" as const, label: "Adesão Moderada" };
    return { variant: "destructive" as const, label: "Baixa Adesão" };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Acompanhamento de Metas por Ciclo</h1>
          <p className="text-muted-foreground mt-2">
            Monitore a adesão dos funcionários ao preenchimento de metas após aprovação dos ciclos
          </p>
        </div>

        {/* Estatísticas Gerais */}
        {cycleStats && cycleStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ciclos Aprovados</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cycleStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando preenchimento de metas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cycleStats.reduce((sum, c) => sum + c.totalEmployees, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Funcionários ativos no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas Criadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cycleStats.reduce((sum, c) => sum + c.totalGoals, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de metas cadastradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adesão Média</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    cycleStats.reduce((sum, c) => sum + c.adherencePercentage, 0) / cycleStats.length
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentual médio de adesão
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cards de Ciclos */}
        {cycleStats && cycleStats.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {cycleStats.map((cycle) => (
              <Card key={cycle.cycleId} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cycle.cycleName}</CardTitle>
                      <CardDescription>Ano: {cycle.cycleYear}</CardDescription>
                    </div>
                    <Badge {...getAdherenceBadge(cycle.adherencePercentage)}>
                      {getAdherenceBadge(cycle.adherencePercentage).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Progresso de Adesão */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Adesão de Funcionários</span>
                      <span className={`text-2xl font-bold ${getAdherenceColor(cycle.adherencePercentage)}`}>
                        {cycle.adherencePercentage}%
                      </span>
                    </div>
                    <Progress value={cycle.adherencePercentage} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {cycle.employeesWithGoals} de {cycle.totalEmployees} funcionários criaram metas
                    </p>
                  </div>

                  {/* Estatísticas do Ciclo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Target className="h-4 w-4 text-blue-600 mr-1" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{cycle.totalGoals}</p>
                      <p className="text-xs text-muted-foreground">Metas Criadas</p>
                    </div>

                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{cycle.approvedGoals}</p>
                      <p className="text-xs text-muted-foreground">Aprovadas</p>
                    </div>

                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{cycle.pendingGoals}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                  </div>

                  {/* Alerta se adesão baixa */}
                  {cycle.adherencePercentage < 50 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          Adesão Baixa Detectada
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Apenas {cycle.employeesWithGoals} funcionários criaram metas. 
                          Considere enviar lembretes ou verificar se há dificuldades no processo.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toast.info("Funcionalidade em desenvolvimento");
                      }}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toast.info("Funcionalidade em desenvolvimento");
                      }}
                    >
                      Enviar Lembretes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Ciclo Aprovado</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Não há ciclos de avaliação aprovados para preenchimento de metas no momento.
                Aprove um ciclo 360° para permitir que os funcionários criem suas metas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
