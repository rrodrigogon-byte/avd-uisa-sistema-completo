import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, Award, Calendar, Download, Filter } from "lucide-react";

/**
 * Página de Dashboards Analíticos - ONDA 3
 * Visualizações avançadas de dados de desempenho e avaliações
 */
export default function DashboardsAnaliticos() {
  const [selectedPeriod, setSelectedPeriod] = useState("ultimo_mes");
  const [selectedDepartment, setSelectedDepartment] = useState("todos");
  const [activeTab, setActiveTab] = useState("geral");

  // Queries
  const { data: departments = [] } = trpc.employees.listDepartments.useQuery();
  const { data: processes = [] } = trpc.evaluationProcesses.list.useQuery();

  // Mock data para demonstração - substituir por queries reais
  const kpiData = {
    totalEmployees: 3114,
    activeEvaluations: 45,
    completionRate: 78,
    averageScore: 4.2,
    trend: {
      employees: 5.2,
      evaluations: -2.1,
      completion: 12.3,
      score: 0.3,
    },
  };

  const performanceByDepartment = [
    { name: "TI", score: 4.5, employees: 120 },
    { name: "RH", score: 4.3, employees: 45 },
    { name: "Vendas", score: 4.1, employees: 200 },
    { name: "Marketing", score: 4.4, employees: 80 },
    { name: "Operações", score: 3.9, employees: 350 },
    { name: "Financeiro", score: 4.2, employees: 60 },
  ];

  const evolutionData = [
    { month: "Jan", score: 3.8, completion: 65 },
    { month: "Fev", score: 3.9, completion: 70 },
    { month: "Mar", score: 4.0, completion: 72 },
    { month: "Abr", score: 4.1, completion: 75 },
    { month: "Mai", score: 4.2, completion: 78 },
    { month: "Jun", score: 4.2, completion: 78 },
  ];

  const distributionData = [
    { range: "1.0-2.0", count: 45, color: "#ef4444" },
    { range: "2.1-3.0", count: 120, color: "#f97316" },
    { range: "3.1-4.0", count: 450, color: "#eab308" },
    { range: "4.1-5.0", count: 890, color: "#22c55e" },
  ];

  const competencyHeatmap = [
    { competency: "Liderança", dept1: 4.5, dept2: 4.2, dept3: 3.8, dept4: 4.1 },
    { competency: "Comunicação", dept1: 4.3, dept2: 4.4, dept3: 4.0, dept4: 4.2 },
    { competency: "Trabalho em Equipe", dept1: 4.6, dept2: 4.3, dept3: 4.1, dept4: 4.4 },
    { competency: "Inovação", dept1: 4.1, dept2: 3.9, dept3: 4.2, dept4: 4.0 },
    { competency: "Resolução de Problemas", dept1: 4.4, dept2: 4.1, dept3: 3.9, dept4: 4.3 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  const handleExportPDF = () => {
    // Implementar exportação para PDF
    console.log("Exportando dashboard para PDF...");
  };

  const handleExportExcel = () => {
    // Implementar exportação para Excel
    console.log("Exportando dados para Excel...");
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboards Analíticos</h1>
            <p className="text-muted-foreground">Análise avançada de desempenho e avaliações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultima_semana">Última Semana</SelectItem>
                    <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                    <SelectItem value="ultimo_trimestre">Último Trimestre</SelectItem>
                    <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Departamentos</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cargo</label>
                <Select defaultValue="todos">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Cargos</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="analista">Analista</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
            <TabsTrigger value="competencias">Competências</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="geral" className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.totalEmployees.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getTrendIcon(kpiData.trend.employees)}
                    <span className="ml-1">{Math.abs(kpiData.trend.employees)}% vs período anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliações Ativas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.activeEvaluations}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getTrendIcon(kpiData.trend.evaluations)}
                    <span className="ml-1">{Math.abs(kpiData.trend.evaluations)}% vs período anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.completionRate}%</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getTrendIcon(kpiData.trend.completion)}
                    <span className="ml-1">{Math.abs(kpiData.trend.completion)}% vs período anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.averageScore.toFixed(1)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getTrendIcon(kpiData.trend.score)}
                    <span className="ml-1">{Math.abs(kpiData.trend.score)} pontos vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Departamento</CardTitle>
                  <CardDescription>Pontuação média de cada departamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceByDepartment}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#3b82f6" name="Pontuação Média" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Notas</CardTitle>
                  <CardDescription>Quantidade de funcionários por faixa de nota</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {distributionData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Desempenho */}
          <TabsContent value="desempenho" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Desempenho por Departamento</CardTitle>
                <CardDescription>Top 10 departamentos com melhor desempenho</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#8b5cf6" name="Pontuação" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Competências */}
          <TabsContent value="competencias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Heatmap de Competências</CardTitle>
                <CardDescription>Análise de competências por departamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competencyHeatmap.map((item: any) => (
                    <div key={item.competency} className="space-y-2">
                      <div className="font-medium">{item.competency}</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[item.dept1, item.dept2, item.dept3, item.dept4].map((value: any, idx: number) => (
                          <div
                            key={idx}
                            className="h-12 rounded flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor:
                                value >= 4.5
                                  ? "#22c55e"
                                  : value >= 4.0
                                  ? "#84cc16"
                                  : value >= 3.5
                                  ? "#eab308"
                                  : value >= 3.0
                                  ? "#f97316"
                                  : "#ef4444",
                            }}
                          >
                            {value.toFixed(1)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Evolução */}
          <TabsContent value="evolucao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Temporal</CardTitle>
                <CardDescription>Acompanhamento de pontuação e taxa de conclusão ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Pontuação Média"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="completion"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Taxa de Conclusão (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
