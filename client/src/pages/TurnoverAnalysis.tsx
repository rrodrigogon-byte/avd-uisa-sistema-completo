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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Users,
  Brain,
  Search,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Análise de Risco de Turnover com IA
 * Prediz probabilidade de saída de colaboradores
 */
export default function TurnoverAnalysis() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees, isLoading: loadingEmployees } = trpc.avdUisa.employees.list.useQuery();

  const analyzeMutation = trpc.aiAnalytics.analyzeTurnoverRisk.useMutation({
    onSuccess: () => {
      toast.success("Análise de risco concluída!");
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });

  const filteredEmployees = employees?.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyze = () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }
    analyzeMutation.mutate({ employeeId: selectedEmployeeId });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critico":
        return "text-red-600 bg-red-50 border-red-200";
      case "alto":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medio":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "baixo":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critico":
      case "alto":
        return <AlertTriangle className="h-6 w-6" />;
      case "medio":
        return <TrendingDown className="h-6 w-6" />;
      case "baixo":
        return <Shield className="h-6 w-6" />;
      default:
        return <Users className="h-6 w-6" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          Análise de Risco de Turnover
        </h1>
        <p className="text-muted-foreground mt-1">
          Predição inteligente de probabilidade de saída de colaboradores
        </p>
      </div>

      {/* Seleção de Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Colaborador para Análise</CardTitle>
          <CardDescription>
            Escolha um colaborador para analisar o risco de turnover usando IA
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

          <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending || !selectedEmployeeId} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            {analyzeMutation.isPending ? "Analisando..." : "Analisar Risco de Turnover"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Análise */}
      {analyzeMutation.data && (
        <div className="space-y-4">
          {/* Card de Risco */}
          <Card className={`border-2 ${getRiskColor(analyzeMutation.data.riskLevel)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskIcon(analyzeMutation.data.riskLevel)}
                  <div>
                    <CardTitle className="text-2xl">{analyzeMutation.data.employeeName}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Nível de Risco: <strong className="capitalize">{analyzeMutation.data.riskLevel}</strong>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{analyzeMutation.data.probabilityPercent}%</div>
                  <p className="text-sm text-muted-foreground">Probabilidade de Saída</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Fatores de Risco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Principais Fatores de Risco
              </CardTitle>
              <CardDescription>Fatores que contribuem para o risco de turnover</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyzeMutation.data.topRiskFactors.map((factor, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{factor.factor}</span>
                    <Badge variant="outline">{factor.impact}% impacto</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${factor.impact}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Ações Recomendadas
              </CardTitle>
              <CardDescription>Ações para reduzir o risco de turnover</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyzeMutation.data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        Prioridade {rec.priority}
                      </Badge>
                    </div>
                    <p className="font-medium mb-1">{rec.action}</p>
                    <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estado Vazio */}
      {!analyzeMutation.data && !analyzeMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma análise realizada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um colaborador e clique em "Analisar" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
