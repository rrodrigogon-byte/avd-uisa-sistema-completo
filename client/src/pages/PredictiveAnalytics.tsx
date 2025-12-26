/**
 * Predictive Analytics Dashboard
 * Dashboard de Análise Preditiva com ML e predições
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, Target, GraduationCap, Award, Heart, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PredictiveAnalytics() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const { data: turnoverRisks, isLoading: loadingTurnover } = trpc.predictiveAnalytics.turnoverRisk.useQuery({});
  const { data: performanceTrend, isLoading: loadingPerformance } = trpc.predictiveAnalytics.performanceTrend.useQuery(
    { employeeId: selectedEmployee || undefined },
    { enabled: !!selectedEmployee }
  );
  const { data: trainingNeeds, isLoading: loadingTraining } = trpc.predictiveAnalytics.trainingNeeds.useQuery({});
  const { data: promotionReadiness, isLoading: loadingPromotion } = trpc.predictiveAnalytics.promotionReadiness.useQuery({});
  const { data: engagementScores, isLoading: loadingEngagement } = trpc.predictiveAnalytics.engagementScore.useQuery({});
  const { data: proactiveAlerts } = trpc.predictiveAnalytics.proactiveAlerts.useQuery({});

  const getRiskColor = (score: number) => {
    if (score >= 70) return "destructive";
    if (score >= 50) return "default";
    if (score >= 30) return "secondary";
    return "outline";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "Crítico";
    if (score >= 50) return "Alto";
    if (score >= 30) return "Médio";
    return "Baixo";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getReadinessColor = (level: string) => {
    if (level === "ready") return "text-green-600";
    if (level === "almost_ready") return "text-blue-600";
    if (level === "developing") return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Análise Preditiva
        </h1>
        <p className="text-muted-foreground">Dashboard com predições baseadas em Machine Learning</p>
      </div>

      {/* Alertas Proativos */}
      {proactiveAlerts && proactiveAlerts.length > 0 && (
        <div className="space-y-2">
          {proactiveAlerts.map((alert: any, idx: number) => (
            <Alert key={idx} variant={alert.severity === "critical" ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.message}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {alert.actions.map((action: any, i: number) => (
                    <div key={i} className="text-sm">
                      • {action.action}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="turnover" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="turnover">Risco de Turnover</TabsTrigger>
          <TabsTrigger value="performance">Tendência de Performance</TabsTrigger>
          <TabsTrigger value="training">Necessidades de Treinamento</TabsTrigger>
          <TabsTrigger value="promotion">Prontidão para Promoção</TabsTrigger>
          <TabsTrigger value="engagement">Score de Engajamento</TabsTrigger>
        </TabsList>

        {/* Risco de Turnover */}
        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Risco de Turnover</CardTitle>
              <CardDescription>Funcionários com maior probabilidade de saída</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTurnover ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {turnoverRisks?.slice(0, 10).map((risk: any) => (
                    <div key={risk.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{risk.employeeName}</p>
                          <Badge variant={getRiskColor(risk.riskScore)}>{getRiskLabel(risk.riskScore)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {risk.department} • {risk.position}
                        </p>
                        <div className="mt-2 space-y-1">
                          {risk.factors.slice(0, 2).map((factor: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              • {factor.factor}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{risk.riskScore}%</div>
                        <Progress value={risk.riskScore} className="w-24 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendência de Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendência de Performance</CardTitle>
              <CardDescription>Predição de performance futura baseada em histórico</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : performanceTrend ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Tendência</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(performanceTrend.trend)}
                          <span className="text-2xl font-bold capitalize">{performanceTrend.trend === "improving" ? "Melhorando" : performanceTrend.trend === "declining" ? "Declinando" : "Estável"}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Rating Atual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{performanceTrend.currentRating}/5</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Predição</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {performanceTrend.predictedRating}/5
                          <span className="text-sm text-muted-foreground ml-2">({performanceTrend.confidence}% confiança)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {performanceTrend.historicalData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={performanceTrend.historicalData.map((rating: any, idx: number) => ({
                          avaliacao: `Aval ${idx + 1}`,
                          rating,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="avaliacao" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="rating" stroke="#0088FE" name="Rating" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold">Insights</h4>
                    {performanceTrend.insights?.map((insight: any, idx: number) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        • {insight}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">Selecione um funcionário para ver a análise</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Necessidades de Treinamento */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Necessidades de Treinamento
              </CardTitle>
              <CardDescription>Gaps de competências identificados por IA</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTraining ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Gaps Identificados</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Treinamentos Sugeridos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingNeeds?.slice(0, 10).map((need: any) => (
                      <TableRow key={need.employeeId}>
                        <TableCell className="font-medium">{need.employeeName}</TableCell>
                        <TableCell>{need.department}</TableCell>
                        <TableCell>{need.competencyGaps.length}</TableCell>
                        <TableCell>
                          <Badge variant={need.priority > 5 ? "destructive" : need.priority > 3 ? "default" : "secondary"}>{need.priority > 5 ? "Alta" : need.priority > 3 ? "Média" : "Baixa"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {need.suggestedTrainings.slice(0, 2).map((training: any, idx: number) => (
                              <p key={idx} className="text-xs">
                                {training.training}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prontidão para Promoção */}
        <TabsContent value="promotion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Prontidão para Promoção
              </CardTitle>
              <CardDescription>Funcionários prontos para assumir novas responsabilidades</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPromotion ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {promotionReadiness?.slice(0, 10).map((readiness: any) => (
                    <div key={readiness.employeeId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{readiness.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {readiness.department} • {readiness.currentPosition}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getReadinessColor(readiness.readinessLevel)}`}>{readiness.readinessScore}%</div>
                          <p className="text-xs text-muted-foreground capitalize">{readiness.readinessLevel.replace("_", " ")}</p>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold mb-1">Pontos Fortes:</p>
                          {readiness.strengths.slice(0, 2).map((strength: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              ✓ {strength}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1">Áreas de Desenvolvimento:</p>
                          {readiness.developmentAreas.slice(0, 2).map((area: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              • {area}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score de Engajamento */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Score de Engajamento
              </CardTitle>
              <CardDescription>Nível de engajamento predito por IA</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEngagement ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {engagementScores?.slice(0, 10).map((score: any) => (
                    <div key={score.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{score.employeeName}</p>
                          <Badge variant={score.engagementScore >= 80 ? "default" : score.engagementScore >= 60 ? "secondary" : "destructive"}>{score.engagementLevel === "high" ? "Alto" : score.engagementLevel === "medium" ? "Médio" : score.engagementLevel === "low" ? "Baixo" : "Muito Baixo"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {score.department} • {score.position}
                        </p>
                        {score.alerts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-orange-600">⚠️ {score.alerts[0]}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{score.engagementScore}</div>
                        <Progress value={score.engagementScore} className="w-24 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
