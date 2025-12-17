import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, BarChart3, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DashboardAVD() {
  const [selectedCycleId, setSelectedCycleId] = useState<number>();

  const { data: cycles } = trpc.avdUisa.listCycles.useQuery({});
  const { data: dashboard, isLoading } = trpc.avdUisa.executiveDashboard.useQuery(
    { cycleId: selectedCycleId },
    { enabled: !!selectedCycleId }
  );

  // Selecionar automaticamente o ciclo ativo
  const activeCycle = cycles?.find((c) => c.status === "ativo");
  if (activeCycle && !selectedCycleId) {
    setSelectedCycleId(activeCycle.id);
  }

  const summary = dashboard?.summary;
  const byDepartment = dashboard?.byDepartment || [];

  // Preparar dados para gráfico
  const chartData = byDepartment.map((d: any) => ({
    name: d.departmentName.length > 20 ? d.departmentName.substring(0, 20) + "..." : d.departmentName,
    "Taxa de Conclusão": d.completionRate,
    "Média de Nota": d.avgScore,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard AVD</h1>
          <p className="text-muted-foreground mt-1">
            Visão executiva do processo de avaliação de desempenho
          </p>
        </div>

        {/* Filtro de Ciclo */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Ciclo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Ciclo de Avaliação</Label>
              <Select
                value={selectedCycleId?.toString() || ""}
                onValueChange={(value) => setSelectedCycleId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles?.map((cycle: any) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name} ({cycle.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedCycleId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Selecione um ciclo para visualizar o dashboard</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando dados...</p>
          </div>
        ) : summary ? (
          <>
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.completed} concluídas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.completionRate}%</div>
                  <Progress value={summary.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Autoavaliações Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.selfPending}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando colaboradores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliações de Gestor Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.managerPending}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando gestores
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Média Geral */}
            {summary.completed > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Média Geral de Desempenho
                  </CardTitle>
                  <CardDescription>
                    Baseado em {summary.completed} avaliações concluídas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold">{summary.averageScore}</div>
                    <div className="text-muted-foreground">/100</div>
                  </div>
                  <Progress value={summary.averageScore} className="mt-4 h-3" />
                </CardContent>
              </Card>
            )}

            {/* Gráfico por Departamento */}
            {byDepartment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Desempenho por Departamento
                  </CardTitle>
                  <CardDescription>
                    Taxa de conclusão e média de notas por unidade organizacional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Taxa de Conclusão" fill="#3b82f6" />
                      <Bar dataKey="Média de Nota" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Departamento</th>
                        <th className="text-center py-3 px-4">Total</th>
                        <th className="text-center py-3 px-4">Concluídas</th>
                        <th className="text-center py-3 px-4">Taxa de Conclusão</th>
                        <th className="text-center py-3 px-4">Média de Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDepartment.map((dept: any) => (
                        <tr key={dept.departmentId || "no-dept"} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{dept.departmentName}</td>
                          <td className="text-center py-3 px-4">{dept.total}</td>
                          <td className="text-center py-3 px-4">{dept.completed}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={dept.completionRate} className="w-20 h-2" />
                              <span className="text-sm font-medium">{dept.completionRate}%</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-semibold">{dept.avgScore}</span>
                            <span className="text-muted-foreground text-sm">/100</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
