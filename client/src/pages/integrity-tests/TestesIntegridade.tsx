import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";

/**
 * Página de Testes de Integridade
 * Interface para visualizar testes disponíveis e resultados de análises comportamentais
 */
export default function TestesIntegridade() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [analysisDialog, setAnalysisDialog] = useState(false);

  // Query para listar testes disponíveis
  const { data: tests, isLoading: testsLoading } =
    trpc.integrityTests.listTests.useQuery({ activeOnly: true });

  // Query para análise comportamental (quando um funcionário é selecionado)
  const { data: analysis, isLoading: analysisLoading } =
    trpc.integrityTests.getIntegrityAnalysis.useQuery(
      { employeeId: selectedEmployeeId! },
      { enabled: !!selectedEmployeeId }
    );

  // Query para relatório consolidado
  const { data: consolidatedReport } =
    trpc.integrityTests.generateConsolidatedReport.useQuery(
      { employeeId: selectedEmployeeId!, includeHistory: true, periodMonths: 12 },
      { enabled: !!selectedEmployeeId }
    );

  const getRiskLevelBadge = (riskLevel: string) => {
    const riskMap = {
      baixo: {
        label: "Baixo Risco",
        variant: "success" as const,
        icon: CheckCircle2,
      },
      medio: {
        label: "Médio Risco",
        variant: "default" as const,
        icon: AlertTriangle,
      },
      alto: {
        label: "Alto Risco",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
      critico: {
        label: "Risco Crítico",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
      desconhecido: {
        label: "Desconhecido",
        variant: "secondary" as const,
        icon: Clock,
      },
    };

    const config =
      riskMap[riskLevel as keyof typeof riskMap] || riskMap.desconhecido;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Testes de Integridade
          </h1>
          <p className="text-muted-foreground">
            Avalie integridade e ética dos colaboradores
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {consolidatedReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Testes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consolidatedReport.totalTests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pontuação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getScoreColor(
                  consolidatedReport.averageScore
                )}`}
              >
                {consolidatedReport.averageScore.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nível de Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getRiskLevelBadge(consolidatedReport.riskLevel)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Último Teste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {consolidatedReport.lastTestDate
                  ? new Date(consolidatedReport.lastTestDate).toLocaleDateString(
                      "pt-BR"
                    )
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Testes Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Testes Disponíveis
          </CardTitle>
          <CardDescription>
            Catálogo de testes de integridade e ética
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando testes...
            </div>
          ) : !tests || tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum teste disponível
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Teste</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categorias</TableHead>
                    <TableHead>Tempo Limite</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {test.description}
                      </TableCell>
                      <TableCell>
                        {test.categories ? (
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(test.categories as string).map(
                              (cat: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              )
                            )}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {test.timeLimit ? `${test.timeLimit} min` : "Sem limite"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={test.isActive ? "success" : "secondary"}>
                          {test.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise Comportamental */}
      {analysis && analysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise Comportamental Detalhada
            </CardTitle>
            <CardDescription>
              Histórico de testes e evolução de integridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analysis.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{item.testName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Realizado em{" "}
                      {new Date(item.completedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${getScoreColor(
                          item.score || 0
                        )}`}
                      >
                        {item.score?.toFixed(1) || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pontuação
                      </div>
                    </div>
                    {item.riskLevel && getRiskLevelBadge(item.riskLevel)}
                  </div>
                </div>

                {item.score && (
                  <Progress value={item.score} className="h-2" />
                )}

                {item.behavioralAnalysis && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">
                      Análise Comportamental
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.behavioralAnalysis}
                    </p>
                  </div>
                )}

                {item.recommendations && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                      Recomendações
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                      {item.recommendations}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tendências e Recomendações Consolidadas */}
      {consolidatedReport && consolidatedReport.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendências Recentes</CardTitle>
            <CardDescription>
              Evolução dos últimos 3 testes realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consolidatedReport.trends.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium">{trend.testName}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trend.completedAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-xl font-bold ${getScoreColor(
                        trend.score || 0
                      )}`}
                    >
                      {trend.score?.toFixed(1) || "N/A"}
                    </div>
                    {trend.riskLevel && getRiskLevelBadge(trend.riskLevel)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações Consolidadas */}
      {consolidatedReport &&
        consolidatedReport.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Consolidadas</CardTitle>
              <CardDescription>
                Ações sugeridas baseadas nos resultados dos testes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {consolidatedReport.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-md"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Dialog de Análise Detalhada */}
      <Dialog open={analysisDialog} onOpenChange={setAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análise Comportamental Completa</DialogTitle>
            <DialogDescription>
              Visualização detalhada dos resultados de integridade
            </DialogDescription>
          </DialogHeader>
          {/* Conteúdo do dialog será implementado conforme necessário */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
