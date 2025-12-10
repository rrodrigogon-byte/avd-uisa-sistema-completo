/**
 * Continuous Feedback Page
 * Sistema de Feedback 360° Contínuo com solicitações ad-hoc
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { MessageSquare, Send, TrendingUp, TrendingDown, Minus, Star, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CONTEXT_OPTIONS = [
  { value: "project_completion", label: "Conclusão de Projeto" },
  { value: "skill_assessment", label: "Avaliação de Habilidade" },
  { value: "behavior_feedback", label: "Feedback Comportamental" },
  { value: "general_feedback", label: "Feedback Geral" },
  { value: "competency_specific", label: "Competência Específica" },
];

export default function ContinuousFeedback() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Form state - Request
  const [respondentId, setRespondentId] = useState("");
  const [context, setContext] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Form state - Response
  const [overallRating, setOverallRating] = useState(5);
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [specificExamples, setSpecificExamples] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  const { data: pendingRequests, refetch: refetchPending } = trpc.continuousFeedback.pendingRequests.useQuery();
  const { data: dashboard } = trpc.continuousFeedback.myFeedbackDashboard.useQuery({});
  const { data: templates } = trpc.continuousFeedback.listTemplates.useQuery();
  const { data: evolution } = trpc.continuousFeedback.feedbackEvolution.useQuery({});

  const requestFeedbackMutation = trpc.continuousFeedback.requestFeedback.useMutation();
  const respondFeedbackMutation = trpc.continuousFeedback.respondFeedback.useMutation();

  const handleRequestFeedback = async () => {
    if (!respondentId || !context) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await requestFeedbackMutation.mutateAsync({
        respondentId: parseInt(respondentId),
        context: context as any,
        projectName: projectName || undefined,
        isAnonymous,
      });

      toast.success("Solicitação de feedback enviada!");
      setIsRequesting(false);
      resetRequestForm();
    } catch (error) {
      toast.error("Erro ao solicitar feedback");
    }
  };

  const handleRespondFeedback = async () => {
    if (!selectedRequest || !strengths) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await respondFeedbackMutation.mutateAsync({
        feedbackId: selectedRequest.id,
        overallRating,
        responses: [],
        strengths,
        areasForImprovement,
        specificExamples,
        additionalComments,
      });

      toast.success("Feedback enviado com sucesso!");
      setIsResponding(false);
      setSelectedRequest(null);
      resetResponseForm();
      refetchPending();
    } catch (error) {
      toast.error("Erro ao enviar feedback");
    }
  };

  const resetRequestForm = () => {
    setRespondentId("");
    setContext("");
    setProjectName("");
    setIsAnonymous(false);
  };

  const resetResponseForm = () => {
    setOverallRating(5);
    setStrengths("");
    setAreasForImprovement("");
    setSpecificExamples("");
    setAdditionalComments("");
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Feedback 360° Contínuo
          </h1>
          <p className="text-muted-foreground">Solicite e forneça feedback a qualquer momento</p>
        </div>
        <Dialog open={isRequesting} onOpenChange={setIsRequesting}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Solicitar Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Feedback</DialogTitle>
              <DialogDescription>Peça feedback a um colega sobre seu trabalho</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="respondent">ID do Respondente *</Label>
                <Input id="respondent" type="number" value={respondentId} onChange={(e) => setRespondentId(e.target.value)} placeholder="Ex: 123" />
              </div>
              <div>
                <Label htmlFor="context">Contexto *</Label>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o contexto" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEXT_OPTIONS.map((opt: any) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project">Nome do Projeto (opcional)</Label>
                <Input id="project" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Ex: Projeto X" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label htmlFor="anonymous">Feedback anônimo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRequesting(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRequestFeedback} disabled={requestFeedbackMutation.isPending}>
                {requestFeedbackMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes
            {pendingRequests && pendingRequests.length > 0 && <Badge className="ml-2" variant="destructive">{pendingRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Feedbacks Recebidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.totalFeedbackReceived || 0}</div>
                <p className="text-xs text-muted-foreground">{dashboard?.completedFeedbackReceived || 0} completos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Feedbacks Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.totalFeedbackGiven || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{dashboard?.averageRatingReceived?.toFixed(1) || "0.0"}</div>
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sentimento Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.overallSentimentScore || 0}</div>
                <Progress value={Math.abs(dashboard?.overallSentimentScore || 0)} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {dashboard && dashboard.commonStrengths.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pontos Fortes Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.commonStrengths.map((strength: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{strength.theme}</span>
                        <Badge variant="secondary">{strength.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Áreas de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.commonImprovements.map((improvement: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{improvement.theme}</span>
                        <Badge variant="secondary">{improvement.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {dashboard && dashboard.recentFeedbacks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Feedbacks Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recentFeedbacks.map((feedback: any) => (
                    <div key={feedback.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_: any, i: number) => (
                            <Star key={i} className={`h-4 w-4 ${i < (feedback.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(feedback.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{feedback.strengths}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pendentes */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRequests.map((request: any) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {request.isAnonymous ? "Solicitação Anônima" : request.requesterName}
                    </CardTitle>
                    <CardDescription>
                      {CONTEXT_OPTIONS.find((opt) => opt.value === request.context)?.label || request.context}
                      {request.projectName && ` • ${request.projectName}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsResponding(true);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evolução */}
        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {evolution && getTrendIcon(evolution.trend)}
                Evolução de Feedback
              </CardTitle>
              <CardDescription>Histórico dos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {evolution && evolution.evolution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={evolution.evolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="averageRating" stroke="#0088FE" name="Avaliação Média" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Tendência</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(evolution.trend)}
                          <span className="text-lg font-bold capitalize">{evolution.trend === "improving" ? "Melhorando" : evolution.trend === "declining" ? "Declinando" : "Estável"}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{evolution.totalFeedbacks}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Média Atual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{evolution.currentAverage.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-12">Dados insuficientes para análise de evolução</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {templates?.map((template: any) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Perguntas:</p>
                    {template.questions.slice(0, 3).map((q: any) => (
                      <p key={q.id} className="text-xs text-muted-foreground">
                        • {q.question}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Resposta */}
      <Dialog open={isResponding} onOpenChange={setIsResponding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Feedback</DialogTitle>
            <DialogDescription>Forneça um feedback construtivo e honesto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Avaliação Geral *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating: any) => (
                  <button key={rating} onClick={() => setOverallRating(rating)}>
                    <Star className={`h-8 w-8 ${rating <= overallRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="strengths">Pontos Fortes *</Label>
              <Textarea id="strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="O que esta pessoa faz bem?" rows={3} />
            </div>
            <div>
              <Label htmlFor="improvements">Áreas de Melhoria</Label>
              <Textarea id="improvements" value={areasForImprovement} onChange={(e) => setAreasForImprovement(e.target.value)} placeholder="O que pode ser melhorado?" rows={3} />
            </div>
            <div>
              <Label htmlFor="examples">Exemplos Específicos</Label>
              <Textarea id="examples" value={specificExamples} onChange={(e) => setSpecificExamples(e.target.value)} placeholder="Dê exemplos concretos" rows={3} />
            </div>
            <div>
              <Label htmlFor="comments">Comentários Adicionais</Label>
              <Textarea id="comments" value={additionalComments} onChange={(e) => setAdditionalComments(e.target.value)} placeholder="Outros comentários" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponding(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRespondFeedback} disabled={respondFeedbackMutation.isPending}>
              {respondFeedbackMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
