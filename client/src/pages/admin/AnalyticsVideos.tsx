import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Play,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsVideos() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  // Queries
  const { data: categories = [] } = trpc.educationalVideos.listCategories.useQuery();
  const { data: videoStats, isLoading: loadingStats } = trpc.educationalVideos.getVideoAnalytics.useQuery({
    categoryId: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
    days: parseInt(timeRange),
  });

  // Processar dados para gráficos
  const engagementData = useMemo(() => {
    if (!videoStats?.videos) return [];
    
    return safeMap(videoStats.videos, (video: any) => ({
      name: video.title.length > 30 ? video.title.substring(0, 30) + "..." : video.title,
      visualizacoes: video.viewCount,
      conclusoes: video.completionCount,
      taxaConclusao: video.viewCount > 0 ? Math.round((video.completionCount / video.viewCount) * 100) : 0,
    })).slice(0, 10); // Top 10 vídeos
  }, [videoStats]);

  const completionRateData = useMemo(() => {
    if (!videoStats?.videos) return [];
    
    return safeMap(videoStats.videos, (video: any) => ({
      name: video.title.length > 25 ? video.title.substring(0, 25) + "..." : video.title,
      taxa: video.viewCount > 0 ? Math.round((video.completionCount / video.viewCount) * 100) : 0,
      visualizacoes: video.viewCount,
    })).slice(0, 15);
  }, [videoStats]);

  const correlationData = useMemo(() => {
    if (!videoStats?.performanceCorrelation) return [];
    
    return safeMap(videoStats.performanceCorrelation, (item: any) => ({
      videosAssistidos: item.videosWatched,
      scorePIR: item.avgPIRScore,
      usuarios: item.userCount,
    }));
  }, [videoStats]);

  const categoryEngagementData = useMemo(() => {
    if (!videoStats?.categoryStats) return [];
    
    return safeMap(videoStats.categoryStats, (cat: any) => ({
      name: cat.categoryName,
      visualizacoes: cat.totalViews,
      conclusoes: cat.totalCompletions,
      tempoTotal: Math.round(cat.totalWatchTime / 60), // Converter para minutos
    }));
  }, [videoStats]);

  const timeSeriesData = useMemo(() => {
    if (!videoStats?.timeSeriesData) return [];
    
    return safeMap(videoStats.timeSeriesData, (item: any) => ({
      data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      visualizacoes: item.views,
      conclusoes: item.completions,
    }));
  }, [videoStats]);

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics de Vídeos Educacionais</h1>
          <p className="text-muted-foreground">
            Análise de engajamento, completion rate e correlação com performance PIR
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {safeMap(categories, (cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !videoStats ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">
              Ainda não há dados de analytics para exibir
            </p>
          </div>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{videoStats.summary?.totalViews || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {videoStats.summary?.uniqueViewers || 0} usuários únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videoStats.summary?.avgCompletionRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {videoStats.summary?.totalCompletions || 0} vídeos concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio de Visualização</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((videoStats.summary?.avgWatchTime || 0) / 60)}min
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((videoStats.summary?.totalWatchTime || 0) / 3600)}h totais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videoStats.summary?.engagementScore || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Score de engajamento
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="engagement" className="space-y-6">
              <TabsList>
                <TabsTrigger value="engagement">Engajamento</TabsTrigger>
                <TabsTrigger value="completion">Taxa de Conclusão</TabsTrigger>
                <TabsTrigger value="correlation">Correlação PIR</TabsTrigger>
                <TabsTrigger value="categories">Por Categoria</TabsTrigger>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              </TabsList>

              {/* Aba de Engajamento */}
              <TabsContent value="engagement" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Vídeos por Engajamento</CardTitle>
                    <CardDescription>
                      Visualizações e conclusões dos vídeos mais assistidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEmpty(engagementData) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado de engajamento disponível
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="visualizacoes" fill="#3b82f6" name="Visualizações" />
                          <Bar dataKey="conclusoes" fill="#10b981" name="Conclusões" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba de Taxa de Conclusão */}
              <TabsContent value="completion" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Conclusão por Vídeo</CardTitle>
                    <CardDescription>
                      Percentual de usuários que concluíram cada vídeo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEmpty(completionRateData) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado de conclusão disponível
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart 
                          data={completionRateData} 
                          layout="horizontal"
                          margin={{ left: 150 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis 
                            type="category" 
                            dataKey="name"
                            width={140}
                            style={{ fontSize: '11px' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="taxa" name="Taxa de Conclusão (%)">
                            {safeMap(completionRateData, (entry: any, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.taxa >= 80 ? "#10b981" : 
                                  entry.taxa >= 50 ? "#f59e0b" : 
                                  "#ef4444"
                                } 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba de Correlação com PIR */}
              <TabsContent value="correlation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Correlação: Vídeos Assistidos × Performance PIR</CardTitle>
                    <CardDescription>
                      Relação entre quantidade de vídeos assistidos e score médio no PIR Integridade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEmpty(correlationData) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado de correlação disponível
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="videosAssistidos" 
                            name="Vídeos Assistidos"
                            label={{ value: 'Vídeos Assistidos', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="scorePIR" 
                            name="Score PIR"
                            domain={[0, 100]}
                            label={{ value: 'Score PIR Médio', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-semibold">Vídeos: {data.videosAssistidos}</p>
                                    <p className="text-sm">Score PIR: {data.scorePIR.toFixed(1)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {data.usuarios} usuário(s)
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter 
                            name="Usuários" 
                            data={correlationData} 
                            fill="#8b5cf6"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                    {!isEmpty(correlationData) && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Insights</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Cada ponto representa um grupo de usuários com quantidade similar de vídeos assistidos</li>
                          <li>• Tendência ascendente indica correlação positiva entre vídeos e performance</li>
                          <li>• Tamanho dos pontos representa o número de usuários no grupo</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba por Categoria */}
              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engajamento por Categoria</CardTitle>
                    <CardDescription>
                      Visualizações, conclusões e tempo total por categoria de vídeo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEmpty(categoryEngagementData) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado de categoria disponível
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={categoryEngagementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            yAxisId="left" 
                            dataKey="visualizacoes" 
                            fill="#3b82f6" 
                            name="Visualizações" 
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey="conclusoes" 
                            fill="#10b981" 
                            name="Conclusões" 
                          />
                          <Bar 
                            yAxisId="right" 
                            dataKey="tempoTotal" 
                            fill="#f59e0b" 
                            name="Tempo Total (min)" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba de Linha do Tempo */}
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução Temporal</CardTitle>
                    <CardDescription>
                      Visualizações e conclusões ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEmpty(timeSeriesData) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado temporal disponível
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="data"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="visualizacoes" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Visualizações"
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="conclusoes" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Conclusões"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
