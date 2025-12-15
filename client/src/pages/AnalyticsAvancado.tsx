import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Analytics Avançado - Dashboard com Gráficos de Evolução Temporal
 * 
 * Features:
 * - Gráfico de evolução de progresso de metas por mês
 * - Gráfico de taxa de conclusão de avaliações 360°
 * - Gráfico de distribuição de notas por departamento
 * - Filtros por período, departamento e colaborador
 */

export default function AnalyticsAvancado() {
  const [periodo, setPeriodo] = useState("2025");
  const [departamento, setDepartamento] = useState("todos");

  // Dados mockados - em produção virão do backend via tRPC
  const progressoMetasPorMes = [
    { mes: "Jan", progresso: 15, metas: 50 },
    { mes: "Fev", progresso: 28, metas: 50 },
    { mes: "Mar", progresso: 42, metas: 50 },
    { mes: "Abr", progresso: 55, metas: 50 },
    { mes: "Mai", progresso: 68, metas: 50 },
    { mes: "Jun", progresso: 75, metas: 50 },
    { mes: "Jul", progresso: 82, metas: 50 },
    { mes: "Ago", progresso: 88, metas: 50 },
    { mes: "Set", progresso: 92, metas: 50 },
    { mes: "Out", progresso: 95, metas: 50 },
    { mes: "Nov", progresso: 97, metas: 50 },
    { mes: "Dez", progresso: 100, metas: 50 },
  ];

  const taxaConclusaoAvaliacoes = [
    { mes: "Jan", autoavaliacao: 80, gestor: 60, consenso: 40 },
    { mes: "Fev", autoavaliacao: 85, gestor: 70, consenso: 55 },
    { mes: "Mar", autoavaliacao: 90, gestor: 80, consenso: 70 },
    { mes: "Abr", autoavaliacao: 92, gestor: 85, consenso: 75 },
    { mes: "Mai", autoavaliacao: 95, gestor: 88, consenso: 80 },
    { mes: "Jun", autoavaliacao: 98, gestor: 92, consenso: 85 },
  ];

  const distribuicaoNotasPorDepartamento = [
    { departamento: "Vendas", nota: 8.5 },
    { departamento: "TI", nota: 8.8 },
    { departamento: "Marketing", nota: 8.2 },
    { departamento: "Financeiro", nota: 8.7 },
    { departamento: "RH", nota: 9.0 },
    { departamento: "Operações", nota: 8.4 },
  ];

  const distribuicaoColaboradoresPorNota = [
    { nota: "9-10", quantidade: 15, cor: "#10b981" },
    { nota: "7-8", quantidade: 35, cor: "#3b82f6" },
    { nota: "5-6", quantidade: 8, cor: "#f59e0b" },
    { nota: "0-4", quantidade: 2, cor: "#ef4444" },
  ];

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics Avançado</h1>
          <p className="text-muted-foreground">
            Análise detalhada de desempenho com gráficos de evolução temporal
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Personalize a visualização dos dados</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <Select value={departamento} onValueChange={setDepartamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="ti">TI</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72%</div>
              <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">50</div>
              <p className="text-xs text-muted-foreground">10 colaboradores</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações 360°</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.6</div>
              <p className="text-xs text-muted-foreground">+0.3 vs ano anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico 1: Evolução de Progresso de Metas */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Progresso de Metas por Mês</CardTitle>
            <CardDescription>
              Acompanhe o progresso médio das metas ao longo do ano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={progressoMetasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progresso"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Progresso Médio (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Taxa de Conclusão de Avaliações 360° */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conclusão de Avaliações 360°</CardTitle>
            <CardDescription>
              Acompanhe o progresso das etapas de avaliação 360°
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={taxaConclusaoAvaliacoes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="autoavaliacao"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Autoavaliação (%)"
                />
                <Line
                  type="monotone"
                  dataKey="gestor"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Avaliação Gestor (%)"
                />
                <Line
                  type="monotone"
                  dataKey="consenso"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Consenso (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico 3: Distribuição de Notas por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Médias por Departamento</CardTitle>
              <CardDescription>
                Comparação de desempenho entre departamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribuicaoNotasPorDepartamento}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departamento" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="nota" fill="#3b82f6" name="Nota Média" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 4: Distribuição de Colaboradores por Faixa de Nota */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Faixa de Nota</CardTitle>
              <CardDescription>
                Quantidade de colaboradores em cada faixa de desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoColaboradoresPorNota}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nota, quantidade }) => `${nota}: ${quantidade}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {distribuicaoColaboradoresPorNota.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
