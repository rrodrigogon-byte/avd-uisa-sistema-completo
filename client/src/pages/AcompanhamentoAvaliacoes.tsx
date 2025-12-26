import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, RefreshCw, TrendingUp, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { FivePercentRuleValidator } from "@/components/FivePercentRuleValidator";
import { toast } from "sonner";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AcompanhamentoAvaliacoes() {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const { data: cycles, isLoading: cyclesLoading } = trpc.evaluationCycles.listActive.useQuery({});
  const { data: stats, isLoading: statsLoading } = trpc.evaluationCycles.getProgressStats.useQuery(
    { cycleId: selectedCycle ?? 0 },
    { enabled: !!selectedCycle }
  );
  const { data: pendingEvaluators } = trpc.evaluationCycles.getPendingEvaluators.useQuery(
    { cycleId: selectedCycle ?? 0, department: selectedDepartment !== "all" ? selectedDepartment : undefined },
    { enabled: !!selectedCycle }
  );

  const resendReminderMutation = trpc.evaluationCycles.resendReminder.useMutation({
    onSuccess: () => {
      toast.success("Lembrete reenviado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar lembrete: ${error.message}`);
    },
  });

  const handleResendReminder = (participantId: number) => {
    resendReminderMutation.mutate({ participantId });
  };

  const progressByType = stats?.progressByType || {
    autoavaliacao: 0,
    pares: 0,
    superiores: 0,
    subordinados: 0,
  };

  const progressChartData = {
    labels: ["Autoavaliação", "Pares", "Superiores", "Subordinados"],
    datasets: [
      {
        label: "Progresso (%)",
        data: [
          progressByType.autoavaliacao,
          progressByType.pares,
          progressByType.superiores,
          progressByType.subordinados,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
      },
    ],
  };

  const statusDistribution = {
    labels: ["Concluídas", "Pendentes", "Atrasadas"],
    datasets: [
      {
        data: [stats?.completed || 0, stats?.pending || 0, stats?.overdue || 0],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
      },
    ],
  };

  const departmentProgress = stats?.byDepartment || [];
  const departmentChartData = {
    labels: departmentProgress.map((d: any) => d.department),
    datasets: [
      {
        label: "Taxa de Conclusão (%)",
        data: departmentProgress.map((d: any) => d.completionRate),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Acompanhamento de Avaliações 360°</h1>
          <p className="text-muted-foreground mt-2">
            Monitore o progresso dos ciclos de avaliação em tempo real
          </p>
        </div>

        {/* Seleção de Ciclo */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Ciclo</CardTitle>
            <CardDescription>Escolha o ciclo de avaliação para acompanhar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCycle?.toString() || ""}
              onValueChange={(value) => setSelectedCycle(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um ciclo ativo" />
              </SelectTrigger>
              <SelectContent>
                {cycles?.map((cycle: any) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.name} ({new Date(cycle.startDate).toLocaleDateString()} -{" "}
                    {new Date(cycle.endDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCycle && !statsLoading && stats && (
          <>
            {/* Validação da Regra 5% */}
            <FivePercentRuleValidator
              totalEmployees={stats.totalEmployees || 0}
              evaluatedEmployees={stats.completed || 0}
              showDetails={true}
            />

            {/* Cards de Métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed} concluídas de {stats.total}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                  <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Após prazo final</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <Tabs defaultValue="progress" className="space-y-4">
              <TabsList>
                <TabsTrigger value="progress">Progresso por Tipo</TabsTrigger>
                <TabsTrigger value="status">Distribuição de Status</TabsTrigger>
                <TabsTrigger value="department">Por Departamento</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso por Tipo de Avaliador</CardTitle>
                    <CardDescription>
                      Taxa de conclusão de cada tipo de avaliação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Bar
                      data={progressChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => `${value}%`,
                            },
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Status</CardTitle>
                    <CardDescription>Visão geral do status das avaliações</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-64 h-64">
                      <Doughnut data={statusDistribution} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="department" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso por Departamento</CardTitle>
                    <CardDescription>Taxa de conclusão em cada departamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Line
                      data={departmentChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => `${value}%`,
                            },
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Lista de Avaliadores Pendentes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Avaliadores Pendentes</CardTitle>
                    <CardDescription>
                      Lista de avaliadores que ainda não concluíram suas avaliações
                    </CardDescription>
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os departamentos</SelectItem>
                      {departmentProgress.map((dept: any) => (
                        <SelectItem key={dept.department} value={dept.department}>
                          {dept.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avaliador</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Avaliado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEvaluators?.map((evaluator: any) => {
                      const isOverdue = new Date(evaluator.deadline) < new Date();
                      return (
                        <TableRow key={evaluator.id}>
                          <TableCell className="font-medium">{evaluator.evaluatorName}</TableCell>
                          <TableCell>{evaluator.department}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{evaluator.type}</Badge>
                          </TableCell>
                          <TableCell>{evaluator.evaluatedName}</TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">Atrasada</Badge>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(evaluator.deadline).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResendReminder(evaluator.id)}
                              disabled={resendReminderMutation.isPending}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Reenviar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedCycle && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Selecione um ciclo para visualizar o acompanhamento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
