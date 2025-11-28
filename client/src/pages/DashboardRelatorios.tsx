import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { BarChart3, Download, TrendingUp, Users, Target, Award, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COLORS = ["#F39200", "#FF6B00", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

export default function DashboardRelatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().getFullYear().toString());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Queries
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: goals } = trpc.goals.list.useQuery({});
  const { data: evaluations } = trpc.evaluations.list.useQuery({});
  const { data: pdis } = trpc.pdi.list.useQuery({});
  const { data: cycles360 } = trpc.cycles360.list.useQuery();

  // Estatísticas Gerais
  const totalEmployees = employees?.length || 0;
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter(g => g.status === "concluida").length || 0;
  const avgGoalProgress = goals?.length 
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  const totalEvaluations = evaluations?.length || 0;
  const completedEvaluations = evaluations?.filter(e => e.status === "concluida").length || 0;

  const totalPDIs = pdis?.length || 0;
  const activePDIs = pdis?.filter(p => p.status === "aprovado" || p.status === "em_andamento").length || 0;

  const totalCycles360 = cycles360?.length || 0;
  const activeCycles360 = cycles360?.filter(c => c.status === "ativo").length || 0;

  // Dados para gráfico de metas por mês
  const goalsPerMonth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthGoals = goals?.filter(g => {
      const goalDate = new Date(g.createdAt);
      return goalDate.getMonth() + 1 === month && goalDate.getFullYear() === parseInt(selectedPeriod);
    }) || [];
    
    return {
      month: new Date(2000, i).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      criadas: monthGoals.length,
      concluidas: monthGoals.filter(g => g.status === "concluida").length,
      emAndamento: monthGoals.filter(g => g.status === "em_andamento").length,
    };
  });

  // Dados para gráfico de desempenho por departamento
  const performanceByDepartment = departments?.map(dept => {
    const deptEmployees = employees?.filter(e => e.departmentId === dept.id) || [];
    const deptGoals = goals?.filter(g => 
      deptEmployees.some(e => e.id === g.employeeId)
    ) || [];
    
    const avgProgress = deptGoals.length > 0
      ? deptGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / deptGoals.length
      : 0;

    return {
      name: dept.name,
      funcionarios: deptEmployees.length,
      metas: deptGoals.length,
      progresso: Math.round(avgProgress),
      concluidas: deptGoals.filter(g => g.status === "concluida").length,
    };
  }) || [];

  // Dados para gráfico de distribuição de status
  const statusDistribution = [
    { name: "Concluídas", value: completedGoals, color: "#10B981" },
    { name: "Em Andamento", value: goals?.filter(g => g.status === "em_andamento").length || 0, color: "#F39200" },
    { name: "Pendentes", value: goals?.filter(g => g.status === "pendente").length || 0, color: "#EF4444" },
    { name: "Canceladas", value: goals?.filter(g => g.status === "cancelada").length || 0, color: "#6B7280" },
  ].filter(item => item.value > 0);

  // Dados para gráfico de PDIs
  const pdiStatus = [
    { name: "Aprovados", value: pdis?.filter(p => p.status === "aprovado").length || 0 },
    { name: "Em Andamento", value: pdis?.filter(p => p.status === "em_andamento").length || 0 },
    { name: "Concluídos", value: pdis?.filter(p => p.status === "concluido").length || 0 },
    { name: "Pendentes", value: pdis?.filter(p => p.status === "pendente").length || 0 },
  ].filter(item => item.value > 0);

  // Exportar relatório
  const handleExportPDF = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  const handleExportExcel = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Dashboard de Relatórios
            </h1>
            <p className="text-muted-foreground mt-2">
              Análise completa de desempenho e indicadores
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileText className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                {completedGoals} concluídas ({totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvaluations}</div>
              <p className="text-xs text-muted-foreground">
                {completedEvaluations} concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDIs Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePDIs}</div>
              <p className="text-xs text-muted-foreground">
                De {totalPDIs} totais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Gráficos */}
        <Tabs defaultValue="metas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
            <TabsTrigger value="pdis">PDIs</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>

          {/* Tab: Metas */}
          <TabsContent value="metas" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Metas por Mês ({selectedPeriod})</CardTitle>
                  <CardDescription>Evolução de criação e conclusão de metas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={goalsPerMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="criadas" fill="#3B82F6" name="Criadas" />
                      <Bar dataKey="concluidas" fill="#10B981" name="Concluídas" />
                      <Bar dataKey="emAndamento" fill="#F39200" name="Em Andamento" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>Status atual de todas as metas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso Médio de Metas</CardTitle>
                <CardDescription>Acompanhamento do progresso geral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-primary">{avgGoalProgress}%</div>
                  <p className="text-muted-foreground mt-2">Progresso médio de todas as metas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Departamentos */}
          <TabsContent value="departamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Departamento</CardTitle>
                <CardDescription>Comparativo de metas e progresso entre departamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="metas" fill="#3B82F6" name="Total de Metas" />
                    <Bar dataKey="concluidas" fill="#10B981" name="Concluídas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso Médio por Departamento</CardTitle>
                  <CardDescription>Percentual de conclusão</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceByDepartment}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progresso" fill="#F39200" name="Progresso %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funcionários por Departamento</CardTitle>
                  <CardDescription>Distribuição da equipe</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceByDepartment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="funcionarios"
                      >
                        {performanceByDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: PDIs */}
          <TabsContent value="pdis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status dos PDIs</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pdiStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de PDIs</CardTitle>
                  <CardDescription>Estatísticas gerais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de PDIs</span>
                    <span className="text-2xl font-bold">{totalPDIs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">PDIs Ativos</span>
                    <span className="text-2xl font-bold text-primary">{activePDIs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Taxa de Ativação</span>
                    <span className="text-2xl font-bold text-green-600">
                      {totalPDIs > 0 ? Math.round((activePDIs / totalPDIs) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Avaliações */}
          <TabsContent value="avaliacoes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Realizadas</CardTitle>
                  <CardDescription>Total e status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Avaliações</span>
                    <span className="text-2xl font-bold">{totalEvaluations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Concluídas</span>
                    <span className="text-2xl font-bold text-green-600">{completedEvaluations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Taxa de Conclusão</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ciclos 360°</CardTitle>
                  <CardDescription>Status dos ciclos de avaliação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Ciclos</span>
                    <span className="text-2xl font-bold">{totalCycles360}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ciclos Ativos</span>
                    <span className="text-2xl font-bold text-primary">{activeCycles360}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Taxa de Ativação</span>
                    <span className="text-2xl font-bold text-green-600">
                      {totalCycles360 > 0 ? Math.round((activeCycles360 / totalCycles360) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
