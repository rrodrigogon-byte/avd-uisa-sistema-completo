import React, { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Dashboard de Analise de Desempenho
 * Exibe graficos e metricas de performance, metas e alertas
 */

interface PerformanceMetric {
  date: string;
  score: number;
  completed: number;
  total: number;
  critical: number;
}

interface GoalStatus {
  name: string;
  value: number;
  color: string;
}

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [department, setDepartment] = useState<string>("all");

  // Dados simulados para graficos (sera integrado com API real)
  const performanceData: PerformanceMetric[] = useMemo(() => {
    const data: PerformanceMetric[] = [];
    const now = new Date();
    const daysBack = period === "week" ? 7 : period === "month" ? 30 : 90;

    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
        score: Math.min(100, 40 + Math.random() * 50),
        completed: Math.floor(Math.random() * 15),
        total: 20,
        critical: Math.floor(Math.random() * 5),
      });
    }

    return data;
  }, [period]);

  const goalStatusData: GoalStatus[] = [
    { name: "Concluidas", value: 12, color: "#10b981" },
    { name: "Em Andamento", value: 6, color: "#3b82f6" },
    { name: "Criticas", value: 2, color: "#ef4444" },
  ];

  const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b"];

  // Calcular metricas
  const totalGoals = 20;
  const completedGoals = 12;
  const criticalGoals = 2;
  const completionRate = ((completedGoals / totalGoals) * 100).toFixed(1);
  const avgPerformanceScore = (performanceData.reduce((sum, d) => sum + d.score, 0) / performanceData.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            📊 Dashboard de Performance
          </h1>
          <p className="text-slate-600">
            Acompanhe seu desempenho, metas e alertas em tempo real
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione o periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Ultima Semana</SelectItem>
              <SelectItem value="month">Ultimo Mes</SelectItem>
              <SelectItem value="quarter">Ultimo Trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="operacoes">Operacoes</SelectItem>
              <SelectItem value="ti">TI</SelectItem>
              <SelectItem value="rh">RH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Score de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {avgPerformanceScore}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +2.5% vs periodo anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Taxa de Conclusao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  {completionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <CheckCircle className="inline w-3 h-3 mr-1" />
                {completedGoals} de {totalGoals} metas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Metas Criticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600">
                  {criticalGoals}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <AlertCircle className="inline w-3 h-3 mr-1" />
                Requerem atencao imediata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Metas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-600">
                  {totalGoals}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <Target className="inline w-3 h-3 mr-1" />
                Ativas neste periodo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Grafico de Tendencias */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendencia de Performance</CardTitle>
              <CardDescription>
                Evolucao do score de performance ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    name="Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status de Metas */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Metas</CardTitle>
              <CardDescription>
                Distribuicao por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={goalStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {goalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Grafico de Metas Concluidas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Metas Concluidas por Semana</CardTitle>
            <CardDescription>
              Quantidade de metas concluidas em cada semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Concluidas" />
                <Bar dataKey="critical" fill="#ef4444" name="Criticas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Abas de Detalhes */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">Alertas Recentes</TabsTrigger>
            <TabsTrigger value="goals">Metas em Andamento</TabsTrigger>
            <TabsTrigger value="reports">Relatorios</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Criticos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Meta de Vendas Q4",
                      progress: 15,
                      severity: "high",
                      daysLeft: 12,
                    },
                    {
                      title: "Implementacao de Sistema",
                      progress: 8,
                      severity: "critical",
                      daysLeft: 5,
                    },
                  ].map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Progresso: {alert.progress}% | {alert.daysLeft} dias restantes
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Metas em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Aumentar Vendas em 20%",
                      progress: 65,
                      category: "financial",
                      endDate: "2024-12-31",
                    },
                    {
                      title: "Melhorar Atendimento ao Cliente",
                      progress: 45,
                      category: "behavioral",
                      endDate: "2024-12-15",
                    },
                    {
                      title: "Implementar Novo Sistema",
                      progress: 30,
                      category: "corporate",
                      endDate: "2024-11-30",
                    },
                  ].map((goal, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{goal.title}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {goal.category}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{goal.progress}% completo</span>
                        <span>Vencimento: {goal.endDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatorios Disponiveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      name: "Relatorio de Performance Mensal",
                      date: "2024-11-24",
                      format: "PDF",
                    },
                    {
                      name: "Analise de Metas - Trimestre",
                      date: "2024-11-20",
                      format: "Excel",
                    },
                    {
                      name: "Resumo de Alertas",
                      date: "2024-11-18",
                      format: "CSV",
                    },
                  ].map((report, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{report.name}</p>
                        <p className="text-xs text-slate-600">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded">
                          {report.format}
                        </span>
                        <Button variant="outline" size="sm">
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
