import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

/**
 * Página de Visualização de Resultados Individuais
 * Mostra resultados consolidados de um participante em um processo avaliativo
 */
export default function ResultadosIndividuais() {
  const params = useParams();
  const [, navigate] = useLocation();
  const participantId = params.participantId ? parseInt(params.participantId) : undefined;

  const { data: participant, isLoading: loadingParticipant } = trpc.evaluationProcesses.getParticipantById.useQuery(
    { participantId: participantId! },
    { enabled: !!participantId }
  );

  const { data: results, isLoading: loadingResults } = trpc.consolidatedReports.getParticipantResults.useQuery(
    { participantId: participantId! },
    { enabled: !!participantId }
  );

  const exportPdfMutation = trpc.consolidatedReports.exportParticipantReport.useMutation({
    onSuccess: (data) => {
      // Criar link de download
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório exportado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao exportar relatório: ${error.message}`);
    },
  });

  const handleExportPdf = () => {
    if (!participantId) return;
    exportPdfMutation.mutate({ participantId });
  };

  if (loadingParticipant || loadingResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!participant || !results) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Resultados não encontrados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar dados para o gráfico radar
  const radarData = results.dimensionScores.map((dim: any) => ({
    dimension: dim.dimensionName,
    autoavaliacao: dim.selfScore || 0,
    gestor: dim.managerScore || 0,
    pares: dim.peerAverageScore || 0,
    subordinados: dim.subordinateAverageScore || 0,
    media: dim.averageScore,
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/processos-avaliativos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Resultados da Avaliação</h1>
            <p className="text-muted-foreground">
              {participant.employeeName} - {participant.processName}
            </p>
          </div>
        </div>
        <Button onClick={handleExportPdf} disabled={exportPdfMutation.isPending}>
          {exportPdfMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar PDF
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Autoavaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.summary.selfScore?.toFixed(1) || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avaliação do Gestor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.summary.managerScore?.toFixed(1) || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média dos Pares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.summary.peerAverageScore?.toFixed(1) || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pontuação Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{results.summary.finalScore?.toFixed(1) || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Dimensão</CardTitle>
          <CardDescription>Comparação entre autoavaliação e avaliações externas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar name="Autoavaliação" dataKey="autoavaliacao" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              <Radar name="Gestor" dataKey="gestor" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              <Radar name="Pares" dataKey="pares" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
              <Radar name="Subordinados" dataKey="subordinados" stroke="#ff7c7c" fill="#ff7c7c" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalhamento por Dimensão */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Dimensão</CardTitle>
          <CardDescription>Pontuações detalhadas em cada dimensão avaliada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.dimensionScores.map((dim: any) => (
              <div key={dim.dimensionName} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{dim.dimensionName}</h3>
                  <span className="text-lg font-bold text-primary">{dim.averageScore.toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Autoavaliação:</span>
                    <span className="ml-2 font-medium">{dim.selfScore?.toFixed(1) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gestor:</span>
                    <span className="ml-2 font-medium">{dim.managerScore?.toFixed(1) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pares:</span>
                    <span className="ml-2 font-medium">{dim.peerAverageScore?.toFixed(1) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subordinados:</span>
                    <span className="ml-2 font-medium">{dim.subordinateAverageScore?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comentários */}
      {results.comments && results.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comentários e Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.comments.map((comment: any, index: number) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <p className="text-sm text-muted-foreground mb-1">{comment.evaluatorType}</p>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
