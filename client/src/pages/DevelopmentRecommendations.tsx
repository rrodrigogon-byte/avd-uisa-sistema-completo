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
  Brain,
  Search,
  BookOpen,
  Users,
  Briefcase,
  Award,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Recomendações de Desenvolvimento com IA
 * Sugere ações de desenvolvimento personalizadas
 */
export default function DevelopmentRecommendations() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees, isLoading: loadingEmployees } = trpc.avdUisa.employees.list.useQuery();

  const recommendMutation = trpc.aiAnalytics.generateDevelopmentRecommendations.useMutation({
    onSuccess: () => {
      toast.success("Recomendações geradas com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar recomendações: ${error.message}`);
    },
  });

  const filteredEmployees = employees?.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }
    recommendMutation.mutate({ employeeId: selectedEmployeeId });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "curso":
        return <BookOpen className="h-5 w-5" />;
      case "mentoria":
        return <Users className="h-5 w-5" />;
      case "projeto":
        return <Briefcase className="h-5 w-5" />;
      case "certificacao":
        return <Award className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "curso":
        return "text-blue-600 bg-blue-50";
      case "mentoria":
        return "text-purple-600 bg-purple-50";
      case "projeto":
        return "text-green-600 bg-green-50";
      case "certificacao":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "destructive";
      case "media":
        return "default";
      case "baixa":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "alto":
        return "bg-green-600";
      case "medio":
        return "bg-blue-600";
      case "baixo":
        return "bg-gray-600";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-indigo-600" />
          Recomendações de Desenvolvimento
        </h1>
        <p className="text-muted-foreground mt-1">
          Sugestões personalizadas de ações de desenvolvimento geradas por IA
        </p>
      </div>

      {/* Seleção de Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Colaborador</CardTitle>
          <CardDescription>
            Escolha um colaborador para gerar recomendações personalizadas de desenvolvimento
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

          <Button onClick={handleGenerate} disabled={recommendMutation.isPending || !selectedEmployeeId} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            {recommendMutation.isPending ? "Gerando..." : "Gerar Recomendações"}
          </Button>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {recommendMutation.data && (
        <div className="space-y-4">
          {/* Header de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{recommendMutation.data.employeeName}</CardTitle>
              <CardDescription>
                {recommendMutation.data.recommendations.length} recomendações personalizadas de desenvolvimento
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Lista de Recomendações */}
          {recommendMutation.data.recommendations.map((rec, idx) => (
            <Card key={idx} className="border-l-4" style={{ borderLeftColor: getTypeColor(rec.type).split(" ")[0].replace("text-", "") }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${getTypeColor(rec.type)}`}>
                      {getTypeIcon(rec.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <CardDescription className="mt-1">{rec.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(rec.priority) as any} className="capitalize">
                    {rec.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="text-sm font-medium capitalize">{rec.type}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Duração Estimada</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rec.estimatedDuration}h
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Impacto Esperado</Label>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-full rounded-full ${getImpactColor(rec.expectedImpact)}`} />
                      <span className="text-sm font-medium capitalize">{rec.expectedImpact}</span>
                    </div>
                  </div>
                </div>

                {/* Competências Alvo */}
                {rec.targetCompetencies.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Competências Desenvolvidas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {rec.targetCompetencies.map((comp, compIdx) => (
                        <Badge key={compIdx} variant="outline">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ação */}
                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Adicionar ao PDI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado Vazio */}
      {!recommendMutation.data && !recommendMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma recomendação gerada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um colaborador e clique em "Gerar Recomendações" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
