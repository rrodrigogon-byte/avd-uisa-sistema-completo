import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Mail, TrendingUp, Brain, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * Componente de Resultados de Testes Psicométricos
 * Exibe todos os testes realizados pelo funcionário com seus perfis
 */

interface TestesResultadosProps {
  employeeId: number;
}

export default function TestesResultados({ employeeId }: TestesResultadosProps) {
  const [, navigate] = useLocation();

  // Query para buscar resultados de testes
  const { data: testResults, isLoading } = trpc.psychometricTests.getEmployeeResults.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  if (!testResults || testResults.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">Nenhum teste psicométrico realizado</p>
          <Button
            onClick={() => navigate(`/testes-psicometricos/enviar?employeeId=${employeeId}`)}
            className="bg-[#F39200] hover:bg-[#d97f00]"
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar Testes
          </Button>
        </div>
      </Card>
    );
  }

  // Mapear tipos de testes para ícones e cores
  const testConfig: Record<string, { icon: any; color: string; label: string }> = {
    disc: { icon: Target, color: "blue", label: "DISC" },
    big_five: { icon: Brain, color: "purple", label: "Big Five" },
    mbti: { icon: Award, color: "green", label: "MBTI" },
    ie: { icon: TrendingUp, color: "orange", label: "Inteligência Emocional" },
    vark: { icon: Brain, color: "pink", label: "VARK" },
    leadership: { icon: Target, color: "indigo", label: "Liderança" },
    career_anchors: { icon: Award, color: "teal", label: "Âncoras de Carreira" },
  };

  return (
    <div className="space-y-4">
      {/* Botão de enviar mais testes */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/testes-psicometricos/enviar?employeeId=${employeeId}`)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Enviar Mais Testes
        </Button>
      </div>

      {/* Grid de resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testResults.map((result: any) => {
          const config = testConfig[result.testType] || {
            icon: Award,
            color: "gray",
            label: result.testType,
          };
          const Icon = config.icon;

          return (
            <Card key={result.id} className={`border-l-4 border-l-${config.color}-500`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg bg-${config.color}-100`}
                    >
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString("pt-BR")
                          : "Em andamento"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      result.status === "completed"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : result.status === "in_progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {result.status === "completed"
                      ? "Concluído"
                      : result.status === "in_progress"
                      ? "Em Andamento"
                      : "Pendente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {result.status === "completed" && result.profile ? (
                  <div className="space-y-3">
                    {/* Perfil Principal */}
                    {result.profile.primaryProfile && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Perfil Principal:</p>
                        <p className="text-lg font-bold text-[#F39200]">
                          {result.profile.primaryProfile}
                        </p>
                      </div>
                    )}

                    {/* Scores */}
                    {result.profile.scores && Object.keys(result.profile.scores).length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Pontuações:</p>
                        <div className="space-y-2">
                          {Object.entries(result.profile.scores).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-[#F39200] h-2 rounded-full"
                                    style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                  {typeof value === "number" ? value.toFixed(0) : value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Descrição */}
                    {result.profile.description && (
                      <div>
                        <p className="text-sm text-gray-600">{result.profile.description}</p>
                      </div>
                    )}

                    {/* Botão Ver Detalhes */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => navigate(`/testes-psicometricos/resultado/${result.id}`)}
                    >
                      Ver Detalhes Completos
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      {result.status === "in_progress"
                        ? "Teste em andamento..."
                        : "Aguardando resposta"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
