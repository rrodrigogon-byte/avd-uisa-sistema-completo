import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, TrendingUp, Eye, FileText, Calendar, User, Target, Loader2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty, safeSort } from "@/lib/arrayHelpers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { toast } from "sonner";

interface EvaluationsTabProps {
  employeeId: number;
}

export default function EvaluationsTab({ employeeId }: EvaluationsTabProps) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: evaluations, isLoading } = trpc.performance.listByEmployee.useQuery({ employeeId });
  const { data: evaluationDetails, isLoading: loadingDetails } = trpc.performance.getById.useQuery(
    { id: selectedEvaluation?.id || 0 },
    { enabled: !!selectedEvaluation }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação registrada</h3>
          <p className="text-sm">Este funcionário ainda não possui avaliações de desempenho.</p>
        </div>
      </Card>
    );
  }

  // Dados para gráfico de evolução
  const safeEvaluations = ensureArray(evaluations);
  const filteredEvals = safeFilter(safeEvaluations, (e: any) => e.finalScore);
  const sortedEvals = safeSort(filteredEvals, (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const evolutionData = safeMap(sortedEvals, (e: any) => ({
    date: new Date(e.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    autoavaliacao: e.selfScore || 0,
    gestor: e.managerScore || 0,
    final: e.finalScore || 0,
  }));

  // Calcular estatísticas
  const avgSelfScore = safeLength(safeEvaluations) > 0 ? safeReduce(safeEvaluations, (acc: number, e: any) => acc + (e.selfScore || 0), 0) / safeLength(safeEvaluations) : 0;
  const avgManagerScore = safeLength(safeEvaluations) > 0 ? safeReduce(safeEvaluations, (acc: number, e: any) => acc + (e.managerScore || 0), 0) / safeLength(safeEvaluations) : 0;
  const avgFinalScore = safeLength(safeEvaluations) > 0 ? safeReduce(safeEvaluations, (acc: number, e: any) => acc + (e.finalScore || 0), 0) / safeLength(safeEvaluations) : 0;

  const handleViewDetails = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setDetailsOpen(true);
  };

  const handleExportHistory = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{evaluations.length}</div>
            <p className="text-xs text-gray-500 mt-1">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Média Autoavaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{avgSelfScore.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">De 0 a 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Média Gestor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{avgManagerScore.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">De 0 a 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Média Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#F39200]">{avgFinalScore.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Score consolidado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      {evolutionData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#F39200]" />
                <CardTitle>Evolução de Performance</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportHistory}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="autoavaliacao" stroke="#3b82f6" name="Autoavaliação" strokeWidth={2} />
                <Line type="monotone" dataKey="gestor" stroke="#a855f7" name="Avaliação Gestor" strokeWidth={2} />
                <Line type="monotone" dataKey="final" stroke="#F39200" name="Score Final" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Autoavaliação</TableHead>
                <TableHead className="text-center">Gestor</TableHead>
                <TableHead className="text-center">Final</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation: any) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="font-medium">
                    {evaluation.periodName || `Avaliação #${evaluation.id}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {evaluation.type || "360°"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        evaluation.status === "concluida"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : evaluation.status === "em_andamento"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {evaluation.status === "concluida"
                        ? "Concluída"
                        : evaluation.status === "em_andamento"
                        ? "Em Andamento"
                        : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-semibold text-blue-600">
                      {evaluation.selfScore || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-semibold text-purple-600">
                      {evaluation.managerScore || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-semibold text-[#F39200]">
                      {evaluation.finalScore || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(evaluation.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(evaluation)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Avaliação */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
            <DialogDescription>
              Visualização completa da avaliação de desempenho
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
            </div>
          ) : evaluationDetails ? (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Data: {new Date(evaluationDetails.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Avaliador: {evaluationDetails.evaluatorName || "Sistema"}
                  </span>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Autoavaliação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {evaluationDetails.selfScore || "-"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Avaliação Gestor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {evaluationDetails.managerScore || "-"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Score Final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#F39200]">
                      {evaluationDetails.finalScore || "-"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comentários */}
              {evaluationDetails.comments && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Comentários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {evaluationDetails.comments}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Competências Avaliadas (se disponível) */}
              {evaluationDetails.competencies && evaluationDetails.competencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Competências Avaliadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {evaluationDetails.competencies.map((comp: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{comp.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#F39200] h-2 rounded-full"
                                style={{ width: `${(comp.score / 100) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                              {comp.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Detalhes não disponíveis
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
