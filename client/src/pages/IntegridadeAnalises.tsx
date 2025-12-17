import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  BarChart,
  TrendingUp,
  Users,
  AlertTriangle,
  PieChart,
  Download,
  Calendar,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function IntegridadeAnalises() {
  const [periodFilter, setPeriodFilter] = useState("30");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Query para buscar resultados
  const { data: results } = trpc.integrityTests.listResults.useQuery({
    limit: 1000,
  });

  const { data: departments } = trpc.departments.list.useQuery();

  // Calcular estatísticas
  const stats = {
    total: results?.length || 0,
    average: results && results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
      : 0,
    muitoAlto: results?.filter(r => r.classification === "muito_alto").length || 0,
    alto: results?.filter(r => r.classification === "alto").length || 0,
    medio: results?.filter(r => r.classification === "medio").length || 0,
    baixo: results?.filter(r => r.classification === "baixo").length || 0,
    muitoBaixo: results?.filter(r => r.classification === "muito_baixo").length || 0,
  };

  // Calcular distribuição por classificação
  const distributionData = [
    { label: "Muito Alto", value: stats.muitoAlto, color: "bg-green-600", percentage: (stats.muitoAlto / stats.total) * 100 },
    { label: "Alto", value: stats.alto, color: "bg-blue-600", percentage: (stats.alto / stats.total) * 100 },
    { label: "Médio", value: stats.medio, color: "bg-yellow-600", percentage: (stats.medio / stats.total) * 100 },
    { label: "Baixo", value: stats.baixo, color: "bg-orange-600", percentage: (stats.baixo / stats.total) * 100 },
    { label: "Muito Baixo", value: stats.muitoBaixo, color: "bg-red-600", percentage: (stats.muitoBaixo / stats.total) * 100 },
  ];

  // Calcular média por dimensão
  const dimensionAverages: Record<string, number> = {};
  if (results && results.length > 0) {
    const dimensionTotals: Record<string, { sum: number; count: number }> = {};
    
    results.forEach(result => {
      if (result.dimensionScores) {
        const scores = JSON.parse(result.dimensionScores as string);
        Object.entries(scores).forEach(([dim, score]) => {
          if (!dimensionTotals[dim]) {
            dimensionTotals[dim] = { sum: 0, count: 0 };
          }
          dimensionTotals[dim].sum += score as number;
          dimensionTotals[dim].count += 1;
        });
      }
    });

    Object.entries(dimensionTotals).forEach(([dim, data]) => {
      dimensionAverages[dim] = Math.round(data.sum / data.count);
    });
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            Análises de Integridade
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises consolidadas e tendências dos testes de integridade
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Testes aplicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Média Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.average}</div>
            <Progress value={stats.average} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Alto Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.muitoAlto + stats.alto}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round(((stats.muitoAlto + stats.alto) / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.baixo + stats.muitoBaixo}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round(((stats.baixo + stats.muitoBaixo) / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Classificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribuição por Classificação
          </CardTitle>
          <CardDescription>
            Percentual de testes em cada nível de integridade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {distributionData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {item.value} teste(s)
                    </span>
                    <Badge variant="outline" className="min-w-[60px] justify-center">
                      {isNaN(item.percentage) ? 0 : item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Média por Dimensão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Média por Dimensão de Integridade
          </CardTitle>
          <CardDescription>
            Pontuação média em cada dimensão avaliada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dimensionAverages).map(([dimension, average]) => (
              <div key={dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dimension}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{average}</span>
                  </div>
                </div>
                <Progress value={average} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.average >= 70 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Excelente Desempenho</h4>
                    <p className="text-sm text-green-700 mt-1">
                      A média geral de integridade está acima de 70 pontos, indicando um alto padrão ético
                      na organização. Continue investindo em programas de ética e compliance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats.average >= 40 && stats.average < 70 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Atenção Necessária</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      A média geral está em nível moderado. Recomenda-se implementar treinamentos focados
                      nas dimensões com scores mais baixos e reforçar a cultura de integridade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats.average < 40 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Ação Urgente Necessária</h4>
                    <p className="text-sm text-red-700 mt-1">
                      A média geral está abaixo do esperado. É crítico implementar um programa abrangente
                      de ética e integridade, com treinamentos obrigatórios e acompanhamento próximo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(stats.baixo + stats.muitoBaixo) > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Casos de Atenção Individual</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      {stats.baixo + stats.muitoBaixo} teste(s) apresentaram classificação baixa ou muito baixa.
                      Recomenda-se acompanhamento individualizado e plano de desenvolvimento específico.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recomendações Gerais */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Recomendações Gerais</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Implementar programa contínuo de treinamento em ética e compliance</li>
                <li>• Criar canal de denúncias anônimo e seguro</li>
                <li>• Realizar workshops sobre dilemas éticos comuns no ambiente de trabalho</li>
                <li>• Estabelecer código de conduta claro e acessível a todos</li>
                <li>• Reconhecer e premiar comportamentos éticos exemplares</li>
                <li>• Aplicar testes de integridade periodicamente (semestral ou anual)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
