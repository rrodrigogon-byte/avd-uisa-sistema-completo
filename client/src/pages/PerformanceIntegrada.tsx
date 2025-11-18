import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Download, ArrowLeft, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Performance Integrada 40-30-30
 * 
 * Estrutura:
 * - Header com score total e breakdown ponderado
 * - Financial Goals (peso 40%)
 * - Behavioral Goals (peso 30%)
 * - Corporate Goals (peso 30%)
 * - Gráfico Breakdown Ponderado
 * - Performance Multi-Dimensional
 * - Evolução Histórica
 * - Recomendações de Desenvolvimento
 */

export default function PerformanceIntegrada() {
  const [selectedEmployee, setSelectedEmployee] = useState("1");
  const [selectedCycle, setSelectedCycle] = useState("2025");

  // Mock data - TODO: integrar com backend
  const performanceData = {
    employee: {
      id: 1,
      name: "Maria Silva",
      position: "Gerente de Vendas",
      department: "Comercial",
    },
    cycle: "Safra 2024/2025",
    totalScore: 0, // Será calculado
    breakdown: {
      financial: { score: 0, weight: 40, goals: [] as any[] },
      behavioral: { score: 0, weight: 30, goals: [] as any[] },
      corporate: { score: 0, weight: 30, goals: [] as any[] },
    },
    financialGoals: [
      { name: "Receita Anual", target: 1000000, achieved: 0, weight: 50 },
      { name: "Margem de Lucro", target: 25, achieved: 0, weight: 30 },
      { name: "Novos Clientes", target: 50, achieved: 0, weight: 20 },
    ],
    behavioralGoals: [
      { name: "Liderança", score: 0, weight: 40 },
      { name: "Trabalho em Equipe", score: 0, weight: 30 },
      { name: "Comunicação", score: 0, weight: 30 },
    ],
    corporateGoals: [
      { name: "Transformação Digital", score: 0, weight: 50 },
      { name: "Sustentabilidade", score: 0, weight: 30 },
      { name: "Diversidade e Inclusão", score: 0, weight: 20 },
    ],
  };

  // Dados para gráfico de evolução histórica
  const historicalData = [
    { month: "Jul", score: 82 },
    { month: "Ago", score: 84 },
    { month: "Set", score: 86 },
    { month: "Out", score: 88 },
    { month: "Nov", score: 0 },
    { month: "Dez", score: 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/performance">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Performance Integrada 40-30-30</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Avaliação multi-dimensional de performance - UISA
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Seletores */}
        <div className="flex items-center gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Maria Silva - Gerente de Vendas</SelectItem>
              <SelectItem value="2">João Santos - Analista Financeiro</SelectItem>
              <SelectItem value="3">Ana Costa - Coordenadora de RH</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">Safra 2024/2025</SelectItem>
              <SelectItem value="2024">Safra 2023/2024</SelectItem>
              <SelectItem value="2023">Safra 2022/2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Score Total */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-2">Score Total de Performance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold">{performanceData.totalScore}</span>
                  <span className="text-2xl opacity-90">/ 100 pontos possíveis</span>
                </div>
                <p className="text-sm opacity-90 mt-2">{performanceData.totalScore}% Total</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-2">{performanceData.cycle}</p>
                <Badge className="bg-white text-blue-600">
                  {performanceData.employee.department}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Ponderado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Breakdown Ponderado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-semibold">Financial Goals</span>
                    <Badge variant="outline">Peso: 40%</Badge>
                  </div>
                  <span className="text-2xl font-bold">
                    {performanceData.breakdown.financial.score} pontos
                  </span>
                </div>
                <Progress value={performanceData.breakdown.financial.score} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">de 100 pontos</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    <span className="font-semibold">Behavioral Goals</span>
                    <Badge variant="outline">Peso: 30%</Badge>
                  </div>
                  <span className="text-2xl font-bold">
                    {performanceData.breakdown.behavioral.score} pontos
                  </span>
                </div>
                <Progress value={performanceData.breakdown.behavioral.score} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">de 100 pontos</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-semibold">Corporate Goals</span>
                    <Badge variant="outline">Peso: 30%</Badge>
                  </div>
                  <span className="text-2xl font-bold">
                    {performanceData.breakdown.corporate.score} pontos
                  </span>
                </div>
                <Progress value={performanceData.breakdown.corporate.score} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">de 100 pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Metas Detalhadas */}
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financial">Financial (40%)</TabsTrigger>
            <TabsTrigger value="behavioral">Behavioral (30%)</TabsTrigger>
            <TabsTrigger value="corporate">Corporate (30%)</TabsTrigger>
          </TabsList>

          {/* Financial Goals */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Goals - Peso 40%</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Metas financeiras e de resultados quantitativos
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.financialGoals.map((goal, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">Peso: {goal.weight}%</p>
                        </div>
                        <Badge variant="outline">0 metas Harvest</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Meta</p>
                          <p className="text-lg font-semibold">
                            {goal.target.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Alcançado</p>
                          <p className="text-lg font-semibold">
                            {goal.achieved.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavioral Goals */}
          <TabsContent value="behavioral">
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Goals - Peso 30%</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Competências comportamentais e soft skills
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.behavioralGoals.map((goal, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">Peso: {goal.weight}%</p>
                        </div>
                        <Badge variant="outline">0 competências</Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold">{goal.score}/100</p>
                      </div>
                      <Progress value={goal.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Corporate Goals */}
          <TabsContent value="corporate">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Goals - Peso 30%</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Metas estratégicas corporativas
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.corporateGoals.map((goal, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">Peso: {goal.weight}%</p>
                        </div>
                        <Badge variant="outline">0 metas estratégicas</Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold">{goal.score}/100</p>
                      </div>
                      <Progress value={goal.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Evolução Histórica */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Histórica</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Performance Média (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recomendações de Desenvolvimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recomendações de Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                <p className="font-semibold mb-1">Aguardando avaliação</p>
                <p className="text-sm text-muted-foreground">
                  Complete as metas para receber recomendações personalizadas de desenvolvimento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
