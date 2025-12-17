/**
 * Temporal Analysis Dashboard
 * Dashboard completo para análise temporal de desempenho com comparações
 */

import { useState } from "react";
import { Calendar, TrendingUp, TrendingDown, Users, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

export default function TemporalAnalysis() {
  const [selectedPeriod, setSelectedPeriod] = useState("trimestral");
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [comparisonMode, setComparisonMode] = useState<"individual" | "comparative">("individual");

  // Queries
  const { data: configs } = trpc.temporalAnalysis.listConfigs.useQuery({ activeOnly: true });
  const { data: employees } = trpc.employees.list.useQuery({ status: "ativo", limit: 100 });

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análise Temporal de Desempenho</h1>
          <p className="text-muted-foreground mt-2">
            Compare tendências PIR, metas e avaliações 360° ao longo do tempo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Análise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modo de Comparação</label>
              <Select value={comparisonMode} onValueChange={(v: any) => setComparisonMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="comparative">Comparativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionários</label>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Selecionar ({selectedEmployees.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Analisados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Melhoria</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68%</div>
            <p className="text-xs text-muted-foreground">Funcionários com tendência positiva</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Declínio</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">18%</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score PIR Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">+5 pontos vs período anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Tab: Tendências */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Score PIR</CardTitle>
              <CardDescription>Tendência dos scores ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={[
                    { period: "Jan", score: 72, meta: 75 },
                    { period: "Fev", score: 74, meta: 75 },
                    { period: "Mar", score: 76, meta: 75 },
                    { period: "Abr", score: 75, meta: 78 },
                    { period: "Mai", score: 78, meta: 78 },
                    { period: "Jun", score: 80, meta: 78 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} name="Score Real" />
                  <Line type="monotone" dataKey="meta" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Meta" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conclusão de Metas</CardTitle>
              <CardDescription>Percentual de metas concluídas por período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { period: "Jan", conclusao: 65 },
                    { period: "Fev", conclusao: 70 },
                    { period: "Mar", conclusao: 75 },
                    { period: "Abr", conclusao: 72 },
                    { period: "Mai", conclusao: 80 },
                    { period: "Jun", conclusao: 85 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conclusao" fill="#8884d8" name="% Conclusão" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comparação */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação Lado-a-Lado</CardTitle>
              <CardDescription>Compare múltiplos funcionários simultaneamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Selecionar Funcionários para Comparar
                </Button>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={[
                      { period: "Jan", func1: 72, func2: 68, func3: 75 },
                      { period: "Fev", func1: 74, func2: 70, func3: 76 },
                      { period: "Mar", func1: 76, func2: 72, func3: 78 },
                      { period: "Abr", func1: 75, func2: 74, func3: 80 },
                      { period: "Mai", func1: 78, func2: 76, func3: 82 },
                      { period: "Jun", func1: 80, func2: 78, func3: 85 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="func1" stroke="#8884d8" name="João Silva" />
                    <Line type="monotone" dataKey="func2" stroke="#82ca9d" name="Maria Santos" />
                    <Line type="monotone" dataKey="func3" stroke="#ffc658" name="Pedro Costa" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Distribuição */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Performance</CardTitle>
              <CardDescription>Dispersão de scores PIR vs conclusão de metas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pir" name="Score PIR" />
                  <YAxis dataKey="metas" name="% Metas" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    name="Funcionários"
                    data={[
                      { pir: 65, metas: 70 },
                      { pir: 72, metas: 75 },
                      { pir: 78, metas: 80 },
                      { pir: 85, metas: 90 },
                      { pir: 70, metas: 65 },
                      { pir: 82, metas: 85 },
                    ]}
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Funcionários com melhor evolução</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "João Silva", improvement: "+25%", score: 92 },
                    { name: "Maria Santos", improvement: "+22%", score: 89 },
                    { name: "Pedro Costa", improvement: "+20%", score: 87 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Score: {item.score}</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        {item.improvement}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requerem Atenção</CardTitle>
                <CardDescription>Funcionários com declínio significativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Carlos Oliveira", decline: "-18%", score: 62 },
                    { name: "Ana Paula", decline: "-15%", score: 65 },
                    { name: "Roberto Lima", decline: "-12%", score: 68 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Score: {item.score}</p>
                      </div>
                      <Badge variant="destructive">
                        {item.decline}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
