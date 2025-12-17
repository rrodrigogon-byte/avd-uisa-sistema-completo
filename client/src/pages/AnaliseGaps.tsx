import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AnaliseGaps() {
  const [period, setPeriod] = useState("30");

  // Mock data enquanto backend não está pronto
  const mockData = {
    overallScore: 75,
    comparison: [
      { responsibility: "Análise de KPIs", category: "Análise", executedHours: 20, expectedHours: 25, adherenceRate: 80 },
      { responsibility: "Planejamento Estratégico", category: "Planejamento", executedHours: 15, expectedHours: 20, adherenceRate: 75 },
      { responsibility: "Reuniões de Alinhamento", category: "Reunião", executedHours: 8, expectedHours: 10, adherenceRate: 80 },
      { responsibility: "Execução de Processos", category: "Execução", executedHours: 25, expectedHours: 30, adherenceRate: 83 },
      { responsibility: "Suporte Técnico", category: "Suporte", executedHours: 5, expectedHours: 15, adherenceRate: 33 },
    ],
    gaps: [
      {
        title: "Baixa execução de Suporte Técnico",
        description: "Apenas 33% do tempo esperado foi dedicado a suporte técnico",
        severity: "Alta",
        suggestion: "Alocar mais tempo para atividades de suporte ou revisar se esta responsabilidade ainda é aplicável ao cargo"
      },
      {
        title: "Planejamento abaixo do esperado",
        description: "Atividades de planejamento estratégico estão 25% abaixo do esperado",
        severity: "Média",
        suggestion: "Aumentar dedicação a atividades de planejamento ou redistribuir responsabilidades"
      }
    ],
    suggestions: [
      {
        type: "adjust",
        title: "Reduzir carga de Suporte Técnico",
        description: "Considerar reduzir a expectativa de horas em suporte técnico de 15h para 8h mensais",
        impact: "Melhoraria o score de aderência em aproximadamente 10 pontos"
      },
      {
        type: "add",
        title: "Adicionar responsabilidade de Treinamento",
        description: "Funcionário demonstra capacidade para conduzir treinamentos internos",
        impact: "Aproveitaria melhor as competências do funcionário"
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excelente", variant: "default" as const };
    if (score >= 60) return { label: "Bom", variant: "secondary" as const };
    return { label: "Atenção", variant: "destructive" as const };
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Análise de Gaps de Produtividade</h1>
          <p className="text-muted-foreground">
            Comparação entre responsabilidades do cargo e atividades realmente executadas
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Geral */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Score Geral de Aderência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(mockData.overallScore)}`}>
                  {mockData.overallScore}
                </div>
                <div className="text-sm text-muted-foreground mb-4">de 100 pontos</div>
                <Badge variant={getScoreBadge(mockData.overallScore).variant}>
                  {getScoreBadge(mockData.overallScore).label}
                </Badge>
              </div>
            </div>
            <Progress value={mockData.overallScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Comparação */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Responsabilidades vs Atividades Executadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockData.comparison.map((item: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.responsibility}</h4>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.executedHours}h / {item.expectedHours}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.adherenceRate}% de aderência
                      </div>
                    </div>
                  </div>
                  <Progress value={item.adherenceRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gaps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Gaps Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.gaps.map((gap: any, index: number) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">
                        {gap.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                    </div>
                    <Badge variant="secondary">{gap.severity}</Badge>
                  </div>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Sugestão:</strong> {gap.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sugestões */}
        <Card>
          <CardHeader>
            <CardTitle>Sugestões de Ajustes na Descrição de Cargo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.suggestions.map((suggestion: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {suggestion.type === "add" && <TrendingUp className="w-5 h-5 text-green-600" />}
                      {suggestion.type === "adjust" && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <strong>Impacto esperado:</strong> {suggestion.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
