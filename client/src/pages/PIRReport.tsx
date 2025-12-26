/**
 * Página de Relatório Detalhado do PIR
 * Exibe análise completa da avaliação PIR incluindo análise de vídeo com IA
 */

import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Share2,
  Loader2,
  Brain,
  Activity,
  Target,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { generatePDFFromElement } from "@/lib/pdfGenerator";

export default function PIRReport() {
  const params = useParams();
  const assessmentId = parseInt(params.id || "0");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Buscar avaliação PIR
  const { data: assessments, isLoading, refetch } = trpc.pirVideo.list.useQuery(undefined);
  const assessment = assessments?.find(a => a.id === assessmentId);

  // Mutation para análise de vídeo
  const analyzeVideoMutation = trpc.pirVideo.analyzeVideo.useMutation({
    onSuccess: (data) => {
      toast.success("Análise de vídeo concluída com sucesso!");
      refetch();
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao analisar vídeo: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const handleAnalyzeVideo = async () => {
    if (!assessment?.videoUrl) {
      toast.error("Nenhum vídeo disponível para análise");
      return;
    }

    setIsAnalyzing(true);
    analyzeVideoMutation.mutate({ assessmentId });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Aqui você pode adicionar lógica para publicar o relatório
      // Por exemplo, enviar por email, salvar como PDF, etc.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular processamento
      toast.success("Relatório publicado com sucesso!");
    } catch (error) {
      toast.error("Erro ao publicar relatório");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Gerando PDF do relatório...");
      
      // Gerar PDF do relatório
      await generatePDFFromElement(
        'pir-report-content',
        `Relatorio_PIR_${assessment?.id}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        {
          title: 'Relatório PIR - Perfil Individual de Referência',
          subtitle: `Avaliação #${assessment?.id}`,
          author: assessment?.employeeName || 'Sistema AVD UISA',
          orientation: 'portrait',
          includeHeader: true,
          includeFooter: true
        }
      );
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#F39200] mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Avaliação não encontrada</h3>
              <p className="text-gray-600">A avaliação PIR solicitada não foi encontrada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parsear análise de vídeo se existir
  let videoAnalysis = null;
  try {
    if (assessment.comments) {
      videoAnalysis = JSON.parse(assessment.comments);
    }
  } catch (e) {
    console.error("Erro ao parsear análise de vídeo:", e);
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pendente: { variant: "secondary", label: "Pendente" },
      em_andamento: { variant: "default", label: "Em Andamento" },
      concluida: { variant: "default", label: "Concluída" },
      cancelada: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Relatório Detalhado - PIR</h1>
            <p className="text-muted-foreground">
              Avaliação #{assessment.id} • {new Date(assessment.assessmentDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={isPublishing || !videoAnalysis}
              className="bg-[#F39200] hover:bg-[#d97f00]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Publicar Relatório
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status e Pontuação */}
        <div className="flex items-center gap-4">
          {getStatusBadge(assessment.status)}
          {assessment.overallScore !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Pontuação Geral:</span>
              <Badge variant="outline" className="text-lg">
                {assessment.overallScore}/100
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div id="pir-report-content">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="video">Vídeo e Análise</TabsTrigger>
          <TabsTrigger value="patterns">Padrões Detectados</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {videoAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Análise Geral</h4>
                    <p className="text-gray-700">{videoAnalysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">Movimento</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {videoAnalysis.patterns?.movementQuality?.score || 0}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 font-medium">Expressões</div>
                      <div className="text-2xl font-bold text-green-900">
                        {videoAnalysis.patterns?.facialExpressions?.score || 0}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-600 font-medium">Linguagem Corporal</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {videoAnalysis.patterns?.bodyLanguage?.score || 0}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm text-orange-600 font-medium">Comunicação</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {videoAnalysis.patterns?.verbalCommunication?.score || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Análise de vídeo ainda não realizada</p>
                  {assessment.videoUrl && (
                    <Button onClick={handleAnalyzeVideo} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analisar Vídeo com IA
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacidades Funcionais */}
          {videoAnalysis?.functionalCapabilities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Capacidades Funcionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(videoAnalysis.functionalCapabilities).map(([key, capability]: [string, any]) => (
                  <div key={key} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">{key.replace(/_/g, ' ')}</h4>
                      <Badge>{capability.level.replace(/_/g, ' ')}</Badge>
                    </div>
                    <Progress value={capability.score} className="mb-2" />
                    <p className="text-sm text-gray-600">{capability.details}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Vídeo e Análise */}
        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Gravação da Avaliação
              </CardTitle>
              <CardDescription>
                Vídeo gravado durante a avaliação PIR
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment.videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={assessment.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Duração: {Math.floor((assessment.videoDuration || 0) / 60)}:
                      {((assessment.videoDuration || 0) % 60).toString().padStart(2, '0')}
                    </span>
                    <span>
                      Gravado em: {assessment.videoRecordedAt ? new Date(assessment.videoRecordedAt).toLocaleString('pt-BR') : '-'}
                    </span>
                  </div>

                  {!videoAnalysis && (
                    <Button onClick={handleAnalyzeVideo} disabled={isAnalyzing} className="w-full">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analisando vídeo com IA...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analisar Vídeo com IA
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum vídeo disponível para esta avaliação</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas da Análise */}
          {videoAnalysis?.alerts && videoAnalysis.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Alertas e Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {videoAnalysis.alerts.map((alert: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'error'
                          ? 'bg-red-50 border-red-200'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className={`w-5 h-5 flex-shrink-0 ${
                            alert.severity === 'error'
                              ? 'text-red-600'
                              : alert.severity === 'warning'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        />
                        <div>
                          <div className="font-medium text-sm">{alert.type.toUpperCase()}</div>
                          <div className="text-sm">{alert.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Padrões Detectados */}
        <TabsContent value="patterns" className="space-y-6">
          {videoAnalysis?.patterns ? (
            <>
              {Object.entries(videoAnalysis.patterns).map(([key, pattern]: [string, any]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                    <CardDescription>Pontuação: {pattern.score}/100</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={pattern.score} />
                    <p className="text-gray-700">{pattern.description}</p>
                    {pattern.observations && pattern.observations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Observações:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {pattern.observations.map((obs: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Dificuldades Identificadas */}
              {videoAnalysis.difficulties && videoAnalysis.difficulties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Dificuldades Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {videoAnalysis.difficulties.map((diff: any, index: number) => (
                        <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{diff.activity}</h4>
                            <Badge
                              variant={
                                diff.severity === 'grave'
                                  ? 'destructive'
                                  : diff.severity === 'moderada'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {diff.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{diff.description}</p>
                          {diff.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              Timestamp: {Math.floor(diff.timestamp / 60)}:
                              {(diff.timestamp % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pontos Fortes */}
              {videoAnalysis.strengths && videoAnalysis.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Pontos Fortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {videoAnalysis.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Análise de padrões não disponível</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Realize a análise de vídeo para ver os padrões detectados
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Recomendações */}
        <TabsContent value="recommendations" className="space-y-6">
          {videoAnalysis?.recommendations && videoAnalysis.recommendations.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Recomendações para Reabilitação
                  </CardTitle>
                  <CardDescription>
                    Sugestões baseadas na análise automática do vídeo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['alta', 'media', 'baixa'].map(priority => {
                      const recs = videoAnalysis.recommendations.filter((r: any) => r.priority === priority);
                      if (recs.length === 0) return null;

                      return (
                        <div key={priority}>
                          <h4 className="font-semibold mb-3 capitalize">
                            Prioridade {priority === 'alta' ? 'Alta' : priority === 'media' ? 'Média' : 'Baixa'}
                          </h4>
                          <div className="space-y-3">
                            {recs.map((rec: any, index: number) => (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border ${
                                  priority === 'alta'
                                    ? 'bg-red-50 border-red-200'
                                    : priority === 'media'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="font-medium mb-1">{rec.category}</div>
                                <div className="text-sm">{rec.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Insights Automáticos */}
              {videoAnalysis.insights && videoAnalysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Insights Automáticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {videoAnalysis.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Recomendações não disponíveis</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Realize a análise de vídeo para ver as recomendações personalizadas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
