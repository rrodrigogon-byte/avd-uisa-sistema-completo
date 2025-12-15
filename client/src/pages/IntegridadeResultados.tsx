import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  FileSearch,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function IntegridadeResultados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Query para buscar resultados
  const { data: results, isLoading } = trpc.integrityTests.listResults.useQuery({
    limit: 100,
  });

  const getClassificationBadge = (classification: string) => {
    const classMap = {
      muito_alto: { label: "Muito Alto", className: "bg-green-600 text-white" },
      alto: { label: "Alto", className: "bg-blue-600 text-white" },
      medio: { label: "Médio", className: "bg-yellow-600 text-white" },
      baixo: { label: "Baixo", className: "bg-orange-600 text-white" },
      muito_baixo: { label: "Muito Baixo", className: "bg-red-600 text-white" },
    };
    const config = classMap[classification as keyof typeof classMap] || classMap.medio;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (score >= 40) return <BarChart3 className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const filteredResults = results?.filter((result) => {
    if (classificationFilter !== "all" && result.classification !== classificationFilter) {
      return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      // Aqui você pode adicionar mais campos para buscar
      return result.id.toString().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileSearch className="h-8 w-8 text-primary" />
          Resultados de Testes de Integridade
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualizar e analisar resultados dos testes aplicados
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {results && results.length > 0
                ? Math.round(
                    results.reduce((acc, r) => acc + r.score, 0) / results.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alto/Muito Alto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {results?.filter((r) =>
                ["alto", "muito_alto"].includes(r.classification || "")
              ).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {results?.filter((r) =>
                ["baixo", "muito_baixo"].includes(r.classification || "")
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classification">Classificação</Label>
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="muito_alto">Muito Alto</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="muito_baixo">Muito Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {filteredResults?.length || 0} resultado(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-4">
                          {getScoreIcon(result.score)}
                          <div>
                            <div className="font-semibold text-lg">
                              Teste #{result.id}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Funcionário ID: {result.employeeId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-sm text-muted-foreground">Pontuação</div>
                            <div className="text-2xl font-bold text-primary">{result.score}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground mb-1">Progresso</div>
                            <Progress value={result.score} className="h-2" />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Concluído: {format(new Date(result.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                          {result.totalTime && (
                            <div>
                              Tempo: {Math.round(result.totalTime / 60)} minutos
                            </div>
                          )}
                        </div>

                        {result.alerts && JSON.parse(result.alerts as string).length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            {JSON.parse(result.alerts as string).length} alerta(s) identificado(s)
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {result.classification && getClassificationBadge(result.classification)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedResult(result)}
                            >
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Resultado - Teste #{result.id}</DialogTitle>
                              <DialogDescription>
                                Análise completa do teste de integridade
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                              {/* Score Geral */}
                              <div>
                                <h3 className="font-semibold mb-3">Pontuação Geral</h3>
                                <div className="flex items-center gap-4">
                                  <div className="text-5xl font-bold text-primary">{result.score}</div>
                                  <div className="flex-1">
                                    <Progress value={result.score} className="h-3" />
                                    <div className="mt-2">
                                      {result.classification && getClassificationBadge(result.classification)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Scores por Dimensão */}
                              {result.dimensionScores && (
                                <div>
                                  <h3 className="font-semibold mb-3">Pontuações por Dimensão</h3>
                                  <div className="space-y-3">
                                    {Object.entries(JSON.parse(result.dimensionScores as string)).map(
                                      ([dimension, score]) => (
                                        <div key={dimension} className="space-y-1">
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{dimension}</span>
                                            <span className="text-muted-foreground">{score as number}</span>
                                          </div>
                                          <Progress value={score as number} className="h-2" />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Análise Comportamental */}
                              {result.behavioralAnalysis && (
                                <div>
                                  <h3 className="font-semibold mb-3">Análise Comportamental</h3>
                                  <div className="p-4 bg-muted rounded-lg">
                                    <pre className="text-sm whitespace-pre-wrap">
                                      {JSON.stringify(JSON.parse(result.behavioralAnalysis as string), null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Recomendação */}
                              {result.recommendation && (
                                <div>
                                  <h3 className="font-semibold mb-3">Recomendações</h3>
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm">{result.recommendation}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum resultado encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
