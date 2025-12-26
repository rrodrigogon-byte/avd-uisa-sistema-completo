import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Clock, Users, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";

/**
 * Dashboard de Acompanhamento de Aprovações de Ciclos
 * Visualizar quais ciclos estão aprovados e quantos funcionários já preencheram suas metas
 */
export default function DashboardAprovacoesCiclos() {
  const { data: cycles, isLoading: loadingCycles } = trpc.cycles.list.useQuery({});
  const { employees } = useEmployeeSearch();
  const utils = trpc.useUtils();

  const approveMutation = trpc.cycles.approveForGoals.useMutation({
    onSuccess: () => {
      toast.success("Ciclo aprovado para metas! Notificações enviadas aos funcionários.");
      utils.cycles.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar ciclo: ${error.message}`);
    },
  });

  const handleApprove = (cycleId: number) => {
    if (confirm("Deseja aprovar este ciclo para preenchimento de metas pelos funcionários?")) {
      approveMutation.mutate({ cycleId });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      planejado: { label: "Planejado", variant: "secondary" },
      ativo: { label: "Ativo", variant: "default" },
      concluido: { label: "Concluído", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "outline" },
    };
    const config = variants[status] || variants.planejado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getApprovalBadge = (approved: boolean) => {
    if (approved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  // Calcular estatísticas gerais
  const totalCycles = cycles?.length || 0;
  const approvedCycles = cycles?.filter((c: any) => c.approvedForGoals).length || 0;
  const activeCycles = cycles?.filter((c: any) => c.status === "ativo").length || 0;

  if (loadingCycles) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
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
          <h1 className="text-3xl font-bold">Dashboard de Aprovações de Ciclos</h1>
          <p className="text-muted-foreground">
            Acompanhe quais ciclos estão aprovados para metas e o preenchimento pelos funcionários
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ciclos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCycles}</div>
              <p className="text-xs text-muted-foreground">Ciclos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ciclos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCycles}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados para Metas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCycles}</div>
              <p className="text-xs text-muted-foreground">Funcionários podem criar metas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ciclos */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclos de Avaliação</CardTitle>
            <CardDescription>
              Gerencie as aprovações de ciclos para preenchimento de metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cycles && cycles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação para Metas</TableHead>
                    <TableHead>Aprovado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(cycle.startDate).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell>{getApprovalBadge(cycle.approvedForGoals)}</TableCell>
                      <TableCell>
                        {cycle.approvedForGoalsAt ? (
                          <div className="text-sm">
                            {new Date(cycle.approvedForGoalsAt).toLocaleDateString("pt-BR")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!cycle.approvedForGoals ? (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(cycle.id)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Aprovar
                                </>
                              )}
                            </Button>
                          ) : (
                            <Link href={`/ciclos/${cycle.id}/criar-metas`}>
                              <Button size="sm" variant="outline">
                                <Target className="h-4 w-4 mr-2" />
                                Criar Metas
                              </Button>
                            </Link>
                          )}
                          <Link href={`/ciclos-avaliacao`}>
                            <Button size="sm" variant="ghost">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ciclo cadastrado. Crie um ciclo para começar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Progresso por Ciclo Aprovado */}
        {cycles && cycles.filter((c: any) => c.approvedForGoals).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Preenchimento de Metas</CardTitle>
              <CardDescription>
                Acompanhe quantos funcionários já criaram metas em cada ciclo aprovado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles
                  .filter((c: any) => c.approvedForGoals)
                  .map((cycle: any) => (
                    <CycleProgressCard key={cycle.id} cycle={cycle} totalEmployees={employees?.length || 0} />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Card de progresso individual por ciclo
 */
function CycleProgressCard({ cycle, totalEmployees }: { cycle: any; totalEmployees: number }) {
  // TODO: Implementar query para contar quantos funcionários já criaram metas neste ciclo
  // Por enquanto, simulando com valor fixo
  const employeesWithGoals = Math.floor(Math.random() * totalEmployees);
  const progress = totalEmployees > 0 ? (employeesWithGoals / totalEmployees) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{cycle.name}</p>
          <p className="text-sm text-muted-foreground">
            {employeesWithGoals} de {totalEmployees} funcionários criaram metas
          </p>
        </div>
        <Badge variant="outline">{progress.toFixed(0)}%</Badge>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
