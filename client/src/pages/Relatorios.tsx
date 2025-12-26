import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { exportDashboardPDF } from "@/utils/pdfExport";
import { BarChart3, Download, FileText, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("2025");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const { data: goals } = trpc.goals.list.useQuery(undefined);
  const { data: evaluations } = trpc.evaluations.list.useQuery(undefined);
  const { data: pdis } = trpc.pdi.list.useQuery(undefined);
  const { data: employeesData } = trpc.employees.list.useQuery(undefined);

  // Calculate statistics
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter(g => g.status === "concluida").length || 0;
  const avgGoalProgress = goals?.length 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const totalEvaluations = evaluations?.length || 0;
  const completedEvaluations = evaluations?.filter(e => e.status === "concluida").length || 0;

  const totalPDIs = pdis?.length || 0;
  const activePDIs = pdis?.filter(p => p.status === "aprovado" || p.status === "em_andamento").length || 0;

  const totalEmployees = employeesData?.length || 0;

  // Mock data for charts (in production, this would come from API)
  const monthlyGoalsData = [
    { month: "Jan", completed: 12, total: 15 },
    { month: "Fev", completed: 18, total: 20 },
    { month: "Mar", completed: 22, total: 25 },
    { month: "Abr", completed: 28, total: 30 },
    { month: "Mai", completed: 25, total: 28 },
    { month: "Jun", completed: 30, total: 32 },
  ];

  const departmentPerformance = [
    { name: "Vendas", score: 8.5, employees: 25 },
    { name: "Marketing", score: 7.8, employees: 15 },
    { name: "TI", score: 9.2, employees: 30 },
    { name: "RH", score: 8.1, employees: 12 },
    { name: "Financeiro", score: 8.7, employees: 18 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Relatórios e Análises
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe indicadores e tendências de desempenho
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => exportDashboardPDF({
                userName: "Sistema AVD",
                activeGoals: totalGoals,
                evaluations: totalEvaluations,
                activePDIs: activePDIs,
                currentCycle: selectedPeriod
              })}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">Total ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedGoals}/{totalGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Avaliações 360°
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedEvaluations}/{totalEvaluations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0}% completas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDIs Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activePDIs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPDIs} no total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="metas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="pdi">PDI</TabsTrigger>
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
          </TabsList>

          {/* Metas Tab */}
          <TabsContent value="metas" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal de Metas</CardTitle>
                  <CardDescription>Metas concluídas vs. total por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyGoalsData.map((item: any) => (
                      <div key={item.month} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.month}</span>
                          <span className="text-muted-foreground">
                            {item.completed}/{item.total} ({Math.round((item.completed / item.total) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(item.completed / item.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metas por Status</CardTitle>
                  <CardDescription>Distribuição atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Concluídas</span>
                      </div>
                      <span className="font-semibold">{completedGoals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">Em Andamento</span>
                      </div>
                      <span className="font-semibold">
                        {goals?.filter(g => g.status === "em_andamento").length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Pendente Aprovação</span>
                      </div>
                      <span className="font-semibold">
                        {goals?.filter(g => g.status === "pendente_aprovacao").length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span className="text-sm">Rascunho</span>
                      </div>
                      <span className="font-semibold">
                        {goals?.filter(g => g.status === "rascunho").length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso Médio por Categoria</CardTitle>
                <CardDescription>Desempenho por tipo de meta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["quantitativa", "qualitativa", "projeto", "comportamental"].map((category: any) => {
                    const categoryGoals = goals?.filter(g => g.category === category) || [];
                    const avgProgress = categoryGoals.length
                      ? Math.round(categoryGoals.reduce((sum, g) => sum + g.progress, 0) / categoryGoals.length)
                      : 0;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{category}</span>
                          <span className="text-muted-foreground">
                            {avgProgress}% ({categoryGoals.length} metas)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações Tab */}
          <TabsContent value="avaliacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status das Avaliações 360°</CardTitle>
                <CardDescription>Progresso do ciclo atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {evaluations?.filter(e => e.status === "pendente").length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {evaluations?.filter(e => e.status === "em_andamento").length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Em Andamento</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {completedEvaluations}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDI Tab */}
          <TabsContent value="pdi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PDIs por Status</CardTitle>
                <CardDescription>Distribuição de planos de desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido"].map((status: any) => {
                    const count = pdis?.filter(p => p.status === status).length || 0;
                    const percentage = totalPDIs > 0 ? Math.round((count / totalPDIs) * 100) : 0;

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{status.replace("_", " ")}</span>
                          <span className="text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departamentos Tab */}
          <TabsContent value="departamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Departamento</CardTitle>
                <CardDescription>Média de avaliações e número de colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.map((dept: any) => (
                    <div key={dept.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ({dept.employees} colaboradores)
                          </span>
                        </div>
                        <span className="font-semibold">{dept.score}/10</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(dept.score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
