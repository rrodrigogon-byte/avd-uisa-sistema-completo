import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Star, Plus, ThumbsUp, Meh, ThumbsDown, TrendingUp, TrendingDown, Minus, MessageSquare, BarChart3, Users } from "lucide-react";

export default function NPSDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<number | null>(null);

  const { data: surveys, refetch } = trpc.nps.listSurveys.useQuery();
  const { data: results } = trpc.nps.getResults.useQuery({ surveyId: selectedSurvey! }, { enabled: !!selectedSurvey });
  const { data: analytics } = trpc.nps.getAnalytics.useQuery({ surveyId: selectedSurvey! }, { enabled: !!selectedSurvey });

  const createSurvey = trpc.nps.createSurvey.useMutation({
    onSuccess: () => { toast.success("Pesquisa criada com sucesso!"); setShowCreateDialog(false); refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = trpc.nps.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const [newSurvey, setNewSurvey] = useState({
    name: "",
    description: "",
    mainQuestion: "Em uma escala de 0 a 10, o quanto voce recomendaria nosso sistema de avaliacao?",
    promoterFollowUp: "O que voce mais gostou?",
    passiveFollowUp: "O que podemos melhorar?",
    detractorFollowUp: "O que causou sua insatisfacao?",
  });

  const handleCreateSurvey = () => { createSurvey.mutate(newSurvey); };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { draft: "secondary", active: "default", paused: "outline", completed: "destructive" };
    const labels: Record<string, string> = { draft: "Rascunho", active: "Ativa", paused: "Pausada", completed: "Concluida" };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getNpsColor = (score: number) => {
    if (score >= 50) return "text-green-600";
    if (score >= 0) return "text-yellow-600";
    return "text-red-600";
  };

  const getNpsBg = (score: number) => {
    if (score >= 50) return "bg-green-100";
    if (score >= 0) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Pesquisa NPS
            </h1>
            <p className="text-muted-foreground mt-1">Net Promoter Score - Meca a satisfacao dos colaboradores</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Pesquisa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Pesquisa NPS</DialogTitle>
                <DialogDescription>Configure uma pesquisa de satisfacao</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome da Pesquisa</Label>
                  <Input value={newSurvey.name} onChange={(e) => setNewSurvey({ ...newSurvey, name: e.target.value })} placeholder="Ex: NPS Ciclo 2025" />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Textarea value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })} placeholder="Descreva o objetivo..." />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta Principal</Label>
                  <Textarea value={newSurvey.mainQuestion} onChange={(e) => setNewSurvey({ ...newSurvey, mainQuestion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta para Promotores (9-10)</Label>
                  <Input value={newSurvey.promoterFollowUp} onChange={(e) => setNewSurvey({ ...newSurvey, promoterFollowUp: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta para Neutros (7-8)</Label>
                  <Input value={newSurvey.passiveFollowUp} onChange={(e) => setNewSurvey({ ...newSurvey, passiveFollowUp: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta para Detratores (0-6)</Label>
                  <Input value={newSurvey.detractorFollowUp} onChange={(e) => setNewSurvey({ ...newSurvey, detractorFollowUp: e.target.value })} />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateSurvey} disabled={!newSurvey.name}>Criar Pesquisa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pesquisas</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{surveys?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{surveys?.filter(s => s.status === "active").length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Respostas</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{surveys?.reduce((acc, s) => acc + s.responseCount, 0) || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Medio</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {surveys && surveys.length > 0 ? Math.round(surveys.reduce((acc, s) => acc + s.npsScore, 0) / surveys.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisas</CardTitle>
              <CardDescription>Selecione uma pesquisa para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {surveys?.map((survey) => (
                  <div key={survey.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedSurvey === survey.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => setSelectedSurvey(survey.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{survey.name}</h3>
                        <p className="text-sm text-muted-foreground">{survey.responseCount} respostas - NPS: {survey.npsScore}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(survey.status)}
                        {survey.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ surveyId: survey.id, status: "active" }); }}>Ativar</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!surveys || surveys.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma pesquisa criada</p>
                    <p className="text-sm">Crie sua primeira pesquisa NPS</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Resultados</CardTitle>
              <CardDescription>{selectedSurvey ? "Metricas da pesquisa selecionada" : "Selecione uma pesquisa"}</CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-6">
                  <div className={`p-6 rounded-lg text-center ${getNpsBg(results.npsScore)}`}>
                    <div className="text-sm text-muted-foreground mb-1">NPS Score</div>
                    <div className={`text-5xl font-bold ${getNpsColor(results.npsScore)}`}>{results.npsScore}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {results.npsScore >= 50 ? "Excelente" : results.npsScore >= 0 ? "Bom" : "Precisa melhorar"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <ThumbsUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
                      <div className="text-2xl font-bold text-green-600">{results.promoterPercent}%</div>
                      <div className="text-xs text-muted-foreground">Promotores ({results.promoters})</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Meh className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                      <div className="text-2xl font-bold text-yellow-600">{results.passivePercent}%</div>
                      <div className="text-xs text-muted-foreground">Neutros ({results.passives})</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <ThumbsDown className="h-5 w-5 mx-auto text-red-600 mb-1" />
                      <div className="text-2xl font-bold text-red-600">{results.detractorPercent}%</div>
                      <div className="text-xs text-muted-foreground">Detratores ({results.detractors})</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Distribuicao de Notas</span>
                      <span>{results.totalResponses} respostas</span>
                    </div>
                    <div className="flex gap-1 h-20">
                      {Object.entries(results.scoreDistribution).map(([score, count]) => {
                        const height = results.totalResponses > 0 ? (count / results.totalResponses) * 100 : 0;
                        const scoreNum = parseInt(score);
                        const color = scoreNum >= 9 ? "bg-green-500" : scoreNum >= 7 ? "bg-yellow-500" : "bg-red-500";
                        return (
                          <div key={score} className="flex-1 flex flex-col justify-end items-center">
                            <div className={`w-full ${color} rounded-t transition-all`} style={{ height: `${height}%` }}></div>
                            <span className="text-xs mt-1">{score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {analytics && (
                    <div className={`p-4 rounded-lg border ${analytics.trend.direction === "up" ? "bg-green-50 border-green-200" : analytics.trend.direction === "down" ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        {analytics.trend.direction === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                        {analytics.trend.direction === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
                        {analytics.trend.direction === "stable" && <Minus className="h-5 w-5 text-gray-600" />}
                        <span className="font-medium">
                          {analytics.trend.direction === "up" && `+${analytics.trend.change} pontos vs periodo anterior`}
                          {analytics.trend.direction === "down" && `${analytics.trend.change} pontos vs periodo anterior`}
                          {analytics.trend.direction === "stable" && "Estavel vs periodo anterior"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione uma pesquisa para ver os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {analytics && selectedSurvey && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Comentarios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2"><ThumbsUp className="h-4 w-4" />Promotores</h4>
                  <div className="space-y-2">
                    {analytics.promoterComments.slice(0, 3).map((c, i) => (
                      <div key={i} className="p-3 bg-green-50 rounded-lg text-sm">
                        <p className="text-green-800">{c.comment}</p>
                        <p className="text-xs text-green-600 mt-1">Nota: {c.score}</p>
                      </div>
                    ))}
                    {analytics.promoterComments.length === 0 && <p className="text-sm text-muted-foreground">Sem comentarios</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2"><Meh className="h-4 w-4" />Neutros</h4>
                  <div className="space-y-2">
                    {analytics.passiveComments.slice(0, 3).map((c, i) => (
                      <div key={i} className="p-3 bg-yellow-50 rounded-lg text-sm">
                        <p className="text-yellow-800">{c.comment}</p>
                        <p className="text-xs text-yellow-600 mt-1">Nota: {c.score}</p>
                      </div>
                    ))}
                    {analytics.passiveComments.length === 0 && <p className="text-sm text-muted-foreground">Sem comentarios</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2"><ThumbsDown className="h-4 w-4" />Detratores</h4>
                  <div className="space-y-2">
                    {analytics.detractorComments.slice(0, 3).map((c, i) => (
                      <div key={i} className="p-3 bg-red-50 rounded-lg text-sm">
                        <p className="text-red-800">{c.comment}</p>
                        <p className="text-xs text-red-600 mt-1">Nota: {c.score}</p>
                      </div>
                    ))}
                    {analytics.detractorComments.length === 0 && <p className="text-sm text-muted-foreground">Sem comentarios</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
