import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle, Download, FileText, Loader2, Shield, TrendingUp } from "lucide-react";

export default function ResultadoPIRIntegridade() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(params.id || "0");

  const { data, isLoading } = trpc.pirIntegrity.getAssessment.useQuery({ id: assessmentId });
  const { data: dimensionsData } = trpc.pirIntegrity.listDimensions.useQuery();
  const generateReport = trpc.pirIntegrity.generateReport.useMutation();

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-100";
      case "moderate": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskLabel = (level: string | null) => {
    switch (level) {
      case "low": return "Baixo";
      case "moderate": return "Moderado";
      case "high": return "Alto";
      case "critical": return "Crítico";
      default: return "-";
    }
  };

  const getMoralLabel = (level: string | null) => {
    switch (level) {
      case "pre_conventional": return "Pré-Convencional";
      case "conventional": return "Convencional";
      case "post_conventional": return "Pós-Convencional";
      default: return "-";
    }
  };

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync({ assessmentId });
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.assessment) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold">Avaliação não encontrada</h2>
          <Button className="mt-4" onClick={() => navigate("/pir-integridade")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { assessment, employee, dimensionScores, riskIndicators } = data;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/pir-integridade")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Resultado PIR Integridade
            </h1>
            <p className="text-gray-500">{employee?.name || "Colaborador"}</p>
          </div>
          <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
            {generateReport.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Gerar Relatório PDF
          </Button>
        </div>

        {/* Score Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Pontuação Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{assessment.overallScore || 0}/100</div>
              <Progress value={assessment.overallScore || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Nível de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${getRiskColor(assessment.riskLevel)}`}>
                {getRiskLabel(assessment.riskLevel)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Nível Moral (Kohlberg)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold text-purple-600">
                {getMoralLabel(assessment.moralLevel)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.moralLevel === "post_conventional" ? "Princípios éticos universais" :
                 assessment.moralLevel === "conventional" ? "Conformidade social" : "Interesse próprio"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scores por Dimensão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pontuação por Dimensão
            </CardTitle>
            <CardDescription>Análise detalhada das 6 dimensões de integridade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dimensionScores?.map((score) => {
                const dimension = dimensionsData?.dimensions.find(d => d.id === score.dimensionId);
                return (
                  <div key={score.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{dimension?.name || `Dimensão ${score.dimensionId}`}</span>
                        <Badge className={`ml-2 ${getRiskColor(score.riskLevel)}`}>
                          {getRiskLabel(score.riskLevel)}
                        </Badge>
                      </div>
                      <span className="font-bold">{score.score}/100</span>
                    </div>
                    <Progress value={score.score} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de Risco */}
        {riskIndicators && riskIndicators.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Indicadores de Risco Detectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskIndicators.map((indicator) => (
                  <div key={indicator.id} className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant={indicator.severity === "critical" ? "destructive" : "outline"}>
                        {indicator.severity}
                      </Badge>
                      <span className="font-medium">{indicator.indicatorType}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{indicator.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tipo</span>
                <p className="font-medium capitalize">{assessment.assessmentType}</p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p className="font-medium capitalize">{assessment.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Iniciada em</span>
                <p className="font-medium">{assessment.startedAt ? new Date(assessment.startedAt).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Concluída em</span>
                <p className="font-medium">{assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
