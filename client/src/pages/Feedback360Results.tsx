import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";

/**
 * Dashboard de Resultados do Feedback 360°
 * Visualização com gráficos de radar e análise por competência
 */
export default function Feedback360Results() {
  const params = useParams();
  const participantId = parseInt(params.participantId || "0");

  // Queries
  const { data: results = [], isLoading } = trpc.feedback360New.getResults.useQuery({ participantId });

  // Agrupar por categoria
  const resultsByCategory = results.reduce((acc, result) => {
    const category = result.competencyCategory || "Geral";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const getGapIcon = (gap: number | null) => {
    if (!gap) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (gap > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (gap < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getGapText = (gap: number | null) => {
    if (!gap) return "Sem dados";
    if (gap > 0) return `+${gap} (Autoavaliação maior)`;
    if (gap < 0) return `${gap} (Autoavaliação menor)`;
    return "Alinhado";
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "bg-gray-200";
    if (rating >= 4) return "bg-green-500";
    if (rating >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRatingLabel = (rating: number | null) => {
    if (!rating) return "N/A";
    const labels = {
      1: "Muito Abaixo",
      2: "Abaixo",
      3: "Atende",
      4: "Supera",
      5: "Excepcional",
    };
    return labels[rating as keyof typeof labels] || rating.toString();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resultados do Feedback 360°</h1>
          <p className="text-muted-foreground">
            Análise consolidada das avaliações recebidas
          </p>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhum resultado disponível ainda</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Autoavaliação Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(results.reduce((sum, r) => sum + (r.selfRating || 0), 0) / results.length).toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avaliação de Pares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(results.reduce((sum, r) => sum + (r.peerRating || 0), 0) / results.length).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.reduce((sum, r) => sum + (r.peerCount || 0), 0)} avaliadores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avaliação de Gestor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(results.reduce((sum, r) => sum + (r.managerRating || 0), 0) / results.length).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.reduce((sum, r) => sum + (r.managerCount || 0), 0)} avaliadores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Média Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(results.reduce((sum, r) => sum + (r.overallRating || 0), 0) / results.length).toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Radar Chart Simulation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Visão Geral por Competência</CardTitle>
                <CardDescription>
                  Comparação entre autoavaliação, pares e gestor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.slice(0, 8).map((result) => (
                    <div key={result.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.competencyName}</span>
                        <Badge variant="outline">{result.competencyCategory}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Self Rating */}
                        {result.selfRating && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-32">Autoavaliação</span>
                            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRatingColor(result.selfRating)} transition-all`}
                                style={{ width: `${(result.selfRating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-24">
                              {getRatingLabel(result.selfRating)}
                            </span>
                          </div>
                        )}

                        {/* Peer Rating */}
                        {result.peerRating && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-32">Pares ({result.peerCount})</span>
                            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRatingColor(result.peerRating)} transition-all`}
                                style={{ width: `${(result.peerRating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-24">
                              {getRatingLabel(result.peerRating)}
                            </span>
                          </div>
                        )}

                        {/* Manager Rating */}
                        {result.managerRating && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-32">Gestor</span>
                            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRatingColor(result.managerRating)} transition-all`}
                                style={{ width: `${(result.managerRating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-24">
                              {getRatingLabel(result.managerRating)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Análise de Gaps</CardTitle>
                <CardDescription>
                  Diferenças entre autoavaliação e avaliação de outros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{result.competencyName}</h4>
                        <p className="text-sm text-muted-foreground">{result.competencyCategory}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Self vs Peer Gap */}
                        {result.selfPeerGap !== null && (
                          <div className="flex items-center gap-2">
                            {getGapIcon(result.selfPeerGap)}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">vs Pares</p>
                              <p className="text-sm font-medium">{getGapText(result.selfPeerGap)}</p>
                            </div>
                          </div>
                        )}

                        {/* Self vs Manager Gap */}
                        {result.selfManagerGap !== null && (
                          <div className="flex items-center gap-2">
                            {getGapIcon(result.selfManagerGap)}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">vs Gestor</p>
                              <p className="text-sm font-medium">{getGapText(result.selfManagerGap)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results by Category */}
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {Object.entries(resultsByCategory).map(([category, categoryResults]) => {
                const avgRating = categoryResults.reduce((sum, r) => sum + (r.overallRating || 0), 0) / categoryResults.length;
                
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{category}</span>
                        <Badge variant="outline" className="text-lg">
                          {avgRating.toFixed(1)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryResults.map((result) => (
                          <div key={result.id} className="flex items-center justify-between">
                            <span className="text-sm">{result.competencyName}</span>
                            <Badge variant={
                              (result.overallRating || 0) >= 4 ? "default" :
                              (result.overallRating || 0) >= 3 ? "secondary" : "destructive"
                            }>
                              {result.overallRating || "N/A"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
