import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Award, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard Executivo Consolidado
 * 
 * Agrega KPIs de todos os módulos do sistema:
 * - Nine Box (distribuição por quadrante)
 * - PDI (em desenvolvimento, concluídos)
 * - Sucessão (posições críticas, cobertura)
 * - Avaliação 360° (em andamento, concluídas)
 * - Metas (atingidas, em risco)
 * - Benchmarking (gaps significativos)
 */

export default function DashboardExecutivoConsolidado() {
  const [, navigate] = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("todos");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2025");

  // Queries para buscar KPIs de cada módulo
  // TODO: Implementar endpoints getDistribution e getStats nos routers
  const nineBoxData = { total: 150, altoDesempenho: 45, q1: 5, q2: 10, q3: 15, q4: 12, q5: 25, q6: 18, q7: 8, q8: 12, q9: 45 };
  const pdiData = { total: 78, percentualConclusao: 65 };
  const successionData = { posicoesCriticas: 12, cobertura: 75 };
  const goalsData = { total: 120, avgAlignmentGeral: 82 };
  const isLoading = false;

  // Dados simulados para demonstração (substituir por dados reais)
  const evaluation360Stats = {
    total: 45,
    emAndamento: 18,
    concluidas: 27,
    percentualConclusao: 60,
  };

  const benchmarkingStats = {
    gapsSignificativos: 5,
    dimensoesAnalisadas: 9,
    percentualAcimaMercado: 55,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Executivo Consolidado</h1>
            <p className="text-sm text-muted-foreground">
              Visão estratégica consolidada de todos os módulos de gestão de talentos
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Departamentos</SelectItem>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/nine-box")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Nine Box</CardTitle>
                <PieChart className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{nineBoxData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Colaboradores mapeados</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {nineBoxData?.altoDesempenho || 0} Alto Desempenho
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/pdi-inteligente")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">PDI Ativos</CardTitle>
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pdiData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Planos em desenvolvimento</p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {pdiData?.percentualConclusao || 0}% concluídos
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/mapa-sucessao-completo")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Sucessão</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{successionData?.posicoesCriticas || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Posições críticas</p>
              <div className="mt-3 flex items-center gap-2">
                {(successionData?.cobertura || 0) >= 70 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${(successionData?.cobertura || 0) >= 70 ? "text-green-600" : "text-red-600"}`}>
                  {successionData?.cobertura || 0}% cobertura
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/metas-cascata")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Metas em Cascata</CardTitle>
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{goalsData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Metas ativas</p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  {goalsData?.avgAlignmentGeral || 0}% alinhamento
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Avaliação 360° e Benchmarking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/avaliacoes")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Avaliação 360°
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Avaliações</span>
                  <span className="text-2xl font-bold">{evaluation360Stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em Andamento</span>
                  <Badge variant="secondary">{evaluation360Stats.emAndamento}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Concluídas</span>
                  <Badge className="bg-green-100 text-green-800">{evaluation360Stats.concluidas}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Percentual de Conclusão</span>
                    <span className="font-semibold text-green-600">{evaluation360Stats.percentualConclusao}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${evaluation360Stats.percentualConclusao}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/benchmarking")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Benchmarking de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dimensões Analisadas</span>
                  <span className="text-2xl font-bold">{benchmarkingStats.dimensoesAnalisadas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gaps Significativos</span>
                  <Badge variant="destructive">{benchmarkingStats.gapsSignificativos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Acima do Mercado</span>
                  <Badge className="bg-green-100 text-green-800">{benchmarkingStats.percentualAcimaMercado}%</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Posição Competitiva</span>
                    <span className="font-semibold text-green-600">
                      {benchmarkingStats.percentualAcimaMercado >= 60 ? "Forte" : benchmarkingStats.percentualAcimaMercado >= 40 ? "Moderada" : "Fraca"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição Nine Box */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Nine Box - Talentos por Quadrante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Linha 3 (Alto Potencial) */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{nineBoxData?.q7 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Alto Potencial</div>
                </CardContent>
              </Card>
              <Card className="bg-green-100 border-green-300">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">{nineBoxData?.q8 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Alto Potencial</div>
                </CardContent>
              </Card>
              <Card className="bg-green-200 border-green-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{nineBoxData?.q9 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Alto Potencial</div>
                  <Badge className="mt-2 bg-yellow-500">Estrelas</Badge>
                </CardContent>
              </Card>

              {/* Linha 2 (Médio Potencial) */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{nineBoxData?.q4 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-100 border-yellow-300">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-800">{nineBoxData?.q5 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-200 border-yellow-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{nineBoxData?.q6 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>

              {/* Linha 1 (Baixo Potencial) */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{nineBoxData?.q1 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Baixo Potencial</div>
                  <Badge variant="destructive" className="mt-2">Atenção</Badge>
                </CardContent>
              </Card>
              <Card className="bg-red-100 border-red-300">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-800">{nineBoxData?.q2 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Baixo Potencial</div>
                </CardContent>
              </Card>
              <Card className="bg-red-200 border-red-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{nineBoxData?.q3 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Baixo Potencial</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Insights Estratégicos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Nine Box:</strong> {nineBoxData?.altoDesempenho || 0} colaboradores identificados como alto desempenho - foco em retenção e desenvolvimento</span>
              </li>
              <li className="flex items-start gap-2">
                {(successionData?.cobertura || 0) >= 70 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span><strong>Sucessão:</strong> {successionData?.cobertura || 0}% de cobertura - {(successionData?.cobertura || 0) >= 70 ? "cobertura adequada" : "necessário aumentar pipeline de sucessores"}</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <span><strong>Metas:</strong> {goalsData?.avgAlignmentGeral || 0}% de alinhamento geral na cascata - {(goalsData?.avgAlignmentGeral || 0) >= 80 ? "excelente alinhamento estratégico" : "oportunidade de melhorar alinhamento"}</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Avaliação 360°:</strong> {evaluation360Stats.percentualConclusao}% de conclusão - {evaluation360Stats.percentualConclusao >= 80 ? "ótima adesão" : "incentivar conclusão das avaliações pendentes"}</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span><strong>Benchmarking:</strong> {benchmarkingStats.gapsSignificativos} gaps significativos identificados - priorizar ações de desenvolvimento nessas dimensões</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
