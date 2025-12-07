import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Search,
  Target,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Predição de Desempenho com IA
 * Prevê desempenho futuro de colaboradores
 */
export default function PerformancePrediction() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees, isLoading: loadingEmployees } = trpc.avdUisa.employees.list.useQuery();

  const predictMutation = trpc.aiAnalytics.predictPerformance.useMutation({
    onSuccess: () => {
      toast.success("Predição de desempenho concluída!");
    },
    onError: (error) => {
      toast.error(`Erro na predição: ${error.message}`);
    },
  });

  const filteredEmployees = employees?.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePredict = () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }
    predictMutation.mutate({ employeeId: selectedEmployeeId });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "crescimento_forte":
      case "crescimento":
        return <TrendingUp className="h-6 w-6 text-green-600" />;
      case "declinio_forte":
      case "declinio":
        return <TrendingDown className="h-6 w-6 text-red-600" />;
      default:
        return <Minus className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "crescimento_forte":
        return "text-green-600 bg-green-50 border-green-200";
      case "crescimento":
        return "text-green-500 bg-green-50 border-green-100";
      case "estavel":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "declinio":
        return "text-orange-500 bg-orange-50 border-orange-100";
      case "declinio_forte":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excepcional":
        return "bg-purple-600";
      case "supera_expectativas":
        return "bg-green-600";
      case "atende_expectativas":
        return "bg-blue-600";
      case "abaixo_expectativas":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case "excepcional":
        return "Excepcional";
      case "supera_expectativas":
        return "Supera Expectativas";
      case "atende_expectativas":
        return "Atende Expectativas";
      case "abaixo_expectativas":
        return "Abaixo das Expectativas";
      default:
        return rating;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Predição de Desempenho
        </h1>
        <p className="text-muted-foreground mt-1">
          Previsão inteligente de desempenho futuro de colaboradores
        </p>
      </div>

      {/* Seleção de Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Colaborador para Predição</CardTitle>
          <CardDescription>
            Escolha um colaborador para prever seu desempenho futuro usando IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Colaborador</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Digite o nome do colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee">Colaborador</Label>
            <Select
              value={selectedEmployeeId?.toString()}
              onValueChange={(value) => setSelectedEmployeeId(Number(value))}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {loadingEmployees ? (
                  <div className="p-2">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  filteredEmployees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name || "Sem nome"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handlePredict} disabled={predictMutation.isPending || !selectedEmployeeId} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            {predictMutation.isPending ? "Prevendo..." : "Prever Desempenho Futuro"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Predição */}
      {predictMutation.data && (
        <div className="space-y-4">
          {/* Card de Predição */}
          <Card className={`border-2 ${getTrendColor(predictMutation.data.trend)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTrendIcon(predictMutation.data.trend)}
                  <div>
                    <CardTitle className="text-2xl">{predictMutation.data.employeeName}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Tendência: <strong className="capitalize">{predictMutation.data.trend.replace("_", " ")}</strong>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{predictMutation.data.predictedScore}</div>
                  <p className="text-sm text-muted-foreground">Score Previsto</p>
                  <Badge className="mt-2" variant="outline">
                    {predictMutation.data.confidenceScore}% confiança
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Rating Previsto</Label>
                <div className="flex items-center gap-2">
                  <div className={`h-3 flex-1 rounded-full ${getRatingColor(predictMutation.data.predictedRating)}`} />
                  <span className="font-medium">{getRatingLabel(predictMutation.data.predictedRating)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fatores Positivos */}
          {predictMutation.data.positiveFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Fatores Positivos
                </CardTitle>
                <CardDescription>Aspectos que contribuem para bom desempenho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictMutation.data.positiveFactors.map((factor, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.factor}</span>
                      <Badge variant="outline" className="bg-green-50">
                        +{factor.impact}% impacto
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${factor.impact}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Fatores Negativos */}
          {predictMutation.data.negativeFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  Fatores de Atenção
                </CardTitle>
                <CardDescription>Aspectos que podem impactar negativamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictMutation.data.negativeFactors.map((factor, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.factor}</span>
                      <Badge variant="outline" className="bg-red-50">
                        -{factor.impact}% impacto
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${factor.impact}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Estado Vazio */}
      {!predictMutation.data && !predictMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma predição realizada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um colaborador e clique em "Prever" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
