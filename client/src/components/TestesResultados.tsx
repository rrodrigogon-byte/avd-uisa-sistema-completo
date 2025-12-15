import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Mail, TrendingUp, Brain, Target, Filter, X, FileText, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/**
 * Componente de Resultados de Testes Psicométricos
 * Exibe todos os testes realizados pelo funcionário com seus perfis
 * Com filtros por tipo de teste e período
 */

interface TestesResultadosProps {
  employeeId: number;
}

export default function TestesResultados({ employeeId }: TestesResultadosProps) {
  const [, navigate] = useLocation();
  
  // Estados dos filtros
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedResultForSummary, setSelectedResultForSummary] = useState<any>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Query para buscar resultados de testes
  const { data: testResults, isLoading } = trpc.psychometricTests.getEmployeeResults.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  // Mapear tipos de testes para ícones e cores
  const testConfig: Record<string, { icon: any; color: string; label: string }> = {
    disc: { icon: Target, color: "blue", label: "DISC" },
    bigfive: { icon: Brain, color: "purple", label: "Big Five" },
    mbti: { icon: Award, color: "green", label: "MBTI" },
    ie: { icon: TrendingUp, color: "orange", label: "Inteligência Emocional" },
    vark: { icon: Brain, color: "pink", label: "VARK" },
    leadership: { icon: Target, color: "indigo", label: "Liderança" },
    careeranchors: { icon: Award, color: "teal", label: "Âncoras de Carreira" },
    pir: { icon: Brain, color: "amber", label: "PIR - Perfil de Interesses e Reações" },
  };

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    if (!testResults) return [];

    let filtered = [...testResults];

    // Filtro por tipo de teste
    if (selectedTestType !== "all") {
      filtered = filtered.filter((result: any) => result.testType === selectedTestType);
    }

    // Filtro por período
    if (selectedPeriod !== "all") {
      const now = new Date();
      const periodDate = new Date();

      switch (selectedPeriod) {
        case "7days":
          periodDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          periodDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          periodDate.setDate(now.getDate() - 90);
          break;
        case "6months":
          periodDate.setMonth(now.getMonth() - 6);
          break;
        case "1year":
          periodDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((result: any) => {
        if (!result.completedAt) return false;
        return new Date(result.completedAt) >= periodDate;
      });
    }

    return filtered;
  }, [testResults, selectedTestType, selectedPeriod]);

  // Verificar se há filtros ativos
  const hasActiveFilters = selectedTestType !== "all" || selectedPeriod !== "all";

  // Limpar filtros
  const clearFilters = () => {
    setSelectedTestType("all");
    setSelectedPeriod("all");
  };

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

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Tipo de Teste */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Teste</label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="disc">DISC</SelectItem>
                  <SelectItem value="bigfive">Big Five</SelectItem>
                  <SelectItem value="mbti">MBTI</SelectItem>
                  <SelectItem value="ie">Inteligência Emocional</SelectItem>
                  <SelectItem value="vark">VARK</SelectItem>
                  <SelectItem value="leadership">Liderança</SelectItem>
                  <SelectItem value="careeranchors">Âncoras de Carreira</SelectItem>
                  <SelectItem value="pir">PIR - Perfil de Interesses e Reações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Todo o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="90days">Últimos 90 dias</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="1year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredResults.length === testResults.length ? (
              <span>Exibindo todos os {testResults.length} teste(s)</span>
            ) : (
              <span>
                Exibindo {filteredResults.length} de {testResults.length} teste(s)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Mensagem quando não há resultados após filtros */}
      {filteredResults.length === 0 && hasActiveFilters && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="mb-4">Nenhum teste encontrado com os filtros selecionados</p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </Card>
      )}

      {/* Grid de resultados */}
      {filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map((result: any) => {
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
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Concluído
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.profileType || result.profileDescription ? (
                    <div className="space-y-3">
                      {/* Perfil Principal */}
                      {result.profileType && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Perfil Principal:</p>
                          <p className="text-lg font-bold text-[#F39200]">
                            {result.profileType}
                          </p>
                        </div>
                      )}

                      {/* Scores */}
                      {result.scores && typeof result.scores === 'string' && (() => {
                        try {
                          const scores = JSON.parse(result.scores);
                          return Object.keys(scores).length > 0;
                        } catch {
                          return false;
                        }
                      })() && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Pontuações:</p>
                          <div className="space-y-2">
                            {Object.entries(JSON.parse(result.scores)).map(([key, value]: [string, any]) => (
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
                      {result.profileDescription && (
                        <div>
                          <p className="text-sm text-gray-600">{result.profileDescription}</p>
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/testes-psicometricos/resultado/${result.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-[#F39200] hover:bg-[#d97f00]"
                          onClick={() => {
                            setSelectedResultForSummary(result);
                            setIsSummaryModalOpen(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Resumo Completo
                        </Button>
                      </div>
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
      )}

      {/* Modal de Resumo Completo */}
      <Dialog open={isSummaryModalOpen} onOpenChange={setIsSummaryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#F39200]" />
              Resumo Completo da Pesquisa
            </DialogTitle>
            <DialogDescription>
              Visualização detalhada de todas as perguntas, respostas e interpretação do teste
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            {selectedResultForSummary && (
              <div className="space-y-6">
                {/* Cabeçalho do Teste */}
                <div className="bg-gradient-to-r from-[#F39200]/10 to-transparent p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {testConfig[selectedResultForSummary.testType]?.label || selectedResultForSummary.testType}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Data: {new Date(selectedResultForSummary.completedAt).toLocaleDateString("pt-BR", { dateStyle: "long" })}</span>
                    <span>•</span>
                    <span>Horário: {new Date(selectedResultForSummary.completedAt).toLocaleTimeString("pt-BR", { timeStyle: "short" })}</span>
                  </div>
                </div>

                {/* Perfil Principal */}
                {selectedResultForSummary.profileType && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#F39200]" />
                      Perfil Identificado
                    </h4>
                    <div className="bg-[#F39200]/5 border-l-4 border-[#F39200] p-4 rounded">
                      <p className="text-2xl font-bold text-[#F39200] mb-2">
                        {selectedResultForSummary.profileType}
                      </p>
                      {selectedResultForSummary.profileDescription && (
                        <p className="text-gray-700 leading-relaxed">
                          {selectedResultForSummary.profileDescription}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Pontuações Detalhadas */}
                {selectedResultForSummary.scores && typeof selectedResultForSummary.scores === 'string' && (() => {
                  try {
                    const scores = JSON.parse(selectedResultForSummary.scores);
                    return Object.keys(scores).length > 0;
                  } catch {
                    return false;
                  }
                })() && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#F39200]" />
                      Pontuações por Dimensão
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(JSON.parse(selectedResultForSummary.scores)).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-xl font-bold text-[#F39200]">
                              {typeof value === "number" ? value.toFixed(0) : value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-[#F39200] h-3 rounded-full transition-all"
                              style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Pontos Fortes */}
                {selectedResultForSummary.strengths && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Pontos Fortes
                    </h4>
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedResultForSummary.strengths}
                      </p>
                    </div>
                  </div>
                )}

                {/* Áreas de Desenvolvimento */}
                {selectedResultForSummary.developmentAreas && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      Áreas de Desenvolvimento
                    </h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedResultForSummary.developmentAreas}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estilo de Trabalho */}
                {selectedResultForSummary.workStyle && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Estilo de Trabalho</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedResultForSummary.workStyle}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estilo de Comunicação */}
                {selectedResultForSummary.communicationStyle && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Estilo de Comunicação</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedResultForSummary.communicationStyle}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {selectedResultForSummary.recommendations && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recomendações</h4>
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedResultForSummary.recommendations}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão de Exportar PDF */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.info("Funcionalidade de exportação em desenvolvimento");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
