import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Brain, Calendar, User, FileText, Download, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

/**
 * Página de Detalhes do Resultado do Teste Psicométrico
 * Exibe informações completas sobre um resultado específico
 */

export default function DetalhesResultadoTeste() {
  const params = useParams();
  const [, navigate] = useLocation();
  const resultId = parseInt(params.id || "0");

  // Query para buscar o resultado
  const { data: result, isLoading } = trpc.psychometricTests.getResultById.useQuery({ id: resultId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Brain className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-lg">Resultado não encontrado</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { label: "Concluído", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "secondary" },
      pending: { label: "Pendente", variant: "outline" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleDownloadPDF = () => {
    toast.info("Funcionalidade de download em desenvolvimento");
  };

  const handleSendByEmail = () => {
    toast.info("Funcionalidade de envio por email em desenvolvimento");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalhes do Resultado</h1>
              <p className="text-gray-600 mt-1">Visualização completa do teste psicométrico</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            <Button variant="outline" onClick={handleSendByEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </div>

        {/* Card Principal - Informações do Teste */}
        <Card className="border-l-4 border-l-[#F39200]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-[#F39200]" />
                <div>
                  <CardTitle className="text-2xl">{result.testType}</CardTitle>
                  <CardDescription>ID do Resultado: {result.id}</CardDescription>
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-[#F39200]" />
                <div>
                  <p className="text-sm text-gray-600">Funcionário</p>
                  <p className="font-semibold">{result.employeeName || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-[#F39200]" />
                <div>
                  <p className="text-sm text-gray-600">Data de Conclusão</p>
                  <p className="font-semibold">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleDateString("pt-BR")
                      : "Não concluído"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-[#F39200]" />
                <div>
                  <p className="text-sm text-gray-600">Pontuação</p>
                  <p className="font-semibold">{result.score || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Perfil Identificado */}
            {result.profile && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Perfil Identificado</h3>
                <div className="p-4 bg-[#F39200]/10 rounded-lg border-l-4 border-[#F39200]">
                  <p className="text-lg font-bold text-[#F39200]">{result.profile}</p>
                </div>
              </div>
            )}

            {/* Descrição do Perfil */}
            {result.profileDescription && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Descrição do Perfil</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Streamdown>{result.profileDescription}</Streamdown>
                </div>
              </div>
            )}

            {/* Respostas Detalhadas */}
            {result.answers && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Respostas Detalhadas</h3>
                <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {typeof result.answers === "string"
                      ? result.answers
                      : JSON.stringify(result.answers, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Recomendações */}
            {result.recommendations && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Recomendações de Desenvolvimento</h3>
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <Streamdown>{result.recommendations}</Streamdown>
                </div>
              </div>
            )}

            {/* Observações */}
            {result.notes && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Streamdown>{result.notes}</Streamdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
            <CardDescription>
              Utilize este resultado para criar planos de desenvolvimento personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  if (result.employeeId) {
                    navigate(`/pdi-inteligente/novo?employeeId=${result.employeeId}`);
                  } else {
                    toast.error("Funcionário não identificado");
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Criar PDI Baseado neste Resultado
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (result.employeeId) {
                    navigate(`/desenvolvimento/funcionarios/${result.employeeId}`);
                  } else {
                    toast.error("Funcionário não identificado");
                  }
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Ver Perfil do Funcionário
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
