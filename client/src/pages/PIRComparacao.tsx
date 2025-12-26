import { useState } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { toast } from 'sonner';

/**
 * Página de Comparação Temporal de Resultados PIR
 * Permite visualizar a evolução dos resultados PIR ao longo do tempo
 */
export default function PIRComparacao() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year' | 'all'>('6months');

  // Buscar lista de funcionários com avaliações PIR
  const { data: employees, isLoading: loadingEmployees } = trpc.pir.getEmployeesWithAssessments.useQuery(undefined);

  // Buscar histórico de avaliações do funcionário selecionado
  const { data: assessmentHistory, isLoading: loadingHistory } = trpc.pir.getAssessmentHistory.useQuery(
    { employeeId: selectedEmployeeId!, period: selectedPeriod },
    { enabled: !!selectedEmployeeId }
  );

  // Preparar dados para gráfico de linha (evolução temporal)
  const evolutionData = assessmentHistory?.map(assessment => ({
    date: new Date(assessment.assessmentDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
    IP: assessment.ipScore || 0,
    ID: assessment.idScore || 0,
    IC: assessment.icScore || 0,
    ES: assessment.esScore || 0,
    FL: assessment.flScore || 0,
    AU: assessment.auScore || 0,
    overall: assessment.overallScore || 0
  })) || [];

  // Preparar dados para gráfico radar (comparação primeira vs última avaliação)
  const radarData = assessmentHistory && assessmentHistory.length >= 2 ? [
    {
      dimension: 'IP',
      primeira: assessmentHistory[0].ipScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].ipScore || 0
    },
    {
      dimension: 'ID',
      primeira: assessmentHistory[0].idScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].idScore || 0
    },
    {
      dimension: 'IC',
      primeira: assessmentHistory[0].icScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].icScore || 0
    },
    {
      dimension: 'ES',
      primeira: assessmentHistory[0].esScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].esScore || 0
    },
    {
      dimension: 'FL',
      primeira: assessmentHistory[0].flScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].flScore || 0
    },
    {
      dimension: 'AU',
      primeira: assessmentHistory[0].auScore || 0,
      última: assessmentHistory[assessmentHistory.length - 1].auScore || 0
    }
  ] : [];

  // Calcular tendências (comparação entre primeira e última avaliação)
  const calculateTrend = (dimension: 'IP' | 'ID' | 'IC' | 'ES' | 'FL' | 'AU') => {
    if (!assessmentHistory || assessmentHistory.length < 2) return null;
    
    const first = assessmentHistory[0][`${dimension.toLowerCase()}Score` as keyof typeof assessmentHistory[0]] as number || 0;
    const last = assessmentHistory[assessmentHistory.length - 1][`${dimension.toLowerCase()}Score` as keyof typeof assessmentHistory[0]] as number || 0;
    const diff = last - first;
    
    return {
      value: diff,
      percentage: first > 0 ? ((diff / first) * 100).toFixed(1) : '0',
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
    };
  };

  const dimensions = [
    { key: 'IP' as const, label: 'Influência Pessoal', color: '#8b5cf6' },
    { key: 'ID' as const, label: 'Influência Diretiva', color: '#3b82f6' },
    { key: 'IC' as const, label: 'Influência Cooperativa', color: '#10b981' },
    { key: 'ES' as const, label: 'Estabilidade', color: '#f59e0b' },
    { key: 'FL' as const, label: 'Flexibilidade', color: '#ef4444' },
    { key: 'AU' as const, label: 'Autonomia', color: '#ec4899' }
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comparação Temporal PIR</h1>
        <p className="text-muted-foreground mt-2">
          Visualize a evolução dos resultados PIR ao longo do tempo
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o funcionário e o período para análise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionário</label>
              <Select
                value={selectedEmployeeId?.toString()}
                onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEmployees ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </SelectItem>
                  ) : employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} - {employee.assessmentCount} avaliações
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="1year">Último ano</SelectItem>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {selectedEmployeeId && (
        <>
          {loadingHistory ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : assessmentHistory && assessmentHistory.length > 0 ? (
            <>
              {/* Cards de Tendências */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {dimensions.map((dimension) => {
                  const trend = calculateTrend(dimension.key);
                  return (
                    <Card key={dimension.key}>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{dimension.label}</p>
                          {trend && (
                            <>
                              <div className="flex items-center justify-center gap-1">
                                {trend.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                                {trend.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                                {trend.trend === 'stable' && <Minus className="h-5 w-5 text-gray-500" />}
                                <span className={`text-lg font-bold ${
                                  trend.trend === 'up' ? 'text-green-500' : 
                                  trend.trend === 'down' ? 'text-red-500' : 
                                  'text-gray-500'
                                }`}>
                                  {trend.value > 0 ? '+' : ''}{trend.value}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {trend.percentage}%
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Gráfico de Evolução Temporal */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal das Dimensões</CardTitle>
                  <CardDescription>
                    Acompanhe a evolução de cada dimensão ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {dimensions.map((dimension) => (
                        <Line
                          key={dimension.key}
                          type="monotone"
                          dataKey={dimension.key}
                          stroke={dimension.color}
                          strokeWidth={2}
                          name={dimension.label}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Comparação Radar (Primeira vs Última) */}
              {radarData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação: Primeira vs Última Avaliação</CardTitle>
                    <CardDescription>
                      Visualize a evolução geral do perfil PIR
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimension" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Primeira Avaliação"
                          dataKey="primeira"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name="Última Avaliação"
                          dataKey="última"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Insights e Análise */}
              <Card>
                <CardHeader>
                  <CardTitle>Insights e Análise</CardTitle>
                  <CardDescription>
                    Análise automática da evolução do perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Dimensões em Crescimento</h4>
                      <div className="space-y-1">
                        {dimensions.filter(d => {
                          const trend = calculateTrend(d.key);
                          return trend && trend.value > 0;
                        }).map(d => {
                          const trend = calculateTrend(d.key)!;
                          return (
                            <div key={d.key} className="flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span>{d.label}: +{trend.value} pontos ({trend.percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Dimensões em Declínio</h4>
                      <div className="space-y-1">
                        {dimensions.filter(d => {
                          const trend = calculateTrend(d.key);
                          return trend && trend.value < 0;
                        }).map(d => {
                          const trend = calculateTrend(d.key)!;
                          return (
                            <div key={d.key} className="flex items-center gap-2 text-sm">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              <span>{d.label}: {trend.value} pontos ({trend.percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Resumo</h4>
                      <p className="text-sm text-muted-foreground">
                        Total de avaliações analisadas: {assessmentHistory.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Período: {new Date(assessmentHistory[0].assessmentDate).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(assessmentHistory[assessmentHistory.length - 1].assessmentDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma avaliação encontrada para o período selecionado
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
