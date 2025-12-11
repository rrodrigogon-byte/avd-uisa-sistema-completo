import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, ExternalLink, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface PsychometricResultsCardProps {
  employeeId: number;
}

export default function PsychometricResultsCard({ employeeId }: PsychometricResultsCardProps) {
  const [, navigate] = useLocation();
  const { data: results, isLoading } = trpc.pdiIntelligent.getPsychometricResults.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>Perfil Psicométrico</CardTitle>
          </div>
          <CardDescription>Carregando resultados...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>Perfil Psicométrico</CardTitle>
          </div>
          <CardDescription>
            Nenhum teste psicométrico realizado ainda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para criar um PDI mais eficaz, recomendamos que o funcionário complete
            os testes psicométricos disponíveis.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/testes-psicometricos")}
          >
            <Brain className="h-4 w-4 mr-2" />
            Ir para Testes Psicométricos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getTestTypeLabel = (testType: string): string => {
    const labels: Record<string, string> = {
      disc: "DISC",
      big_five: "Big Five",
      mbti: "MBTI",
      emotional_intelligence: "Inteligência Emocional",
      leadership_styles: "Estilos de Liderança",
      vark: "VARK",
      career_anchors: "Âncoras de Carreira",
    };
    return labels[testType] || testType;
  };

  const getTestTypeColor = (testType: string): string => {
    const colors: Record<string, string> = {
      disc: "bg-blue-500",
      big_five: "bg-purple-500",
      mbti: "bg-green-500",
      emotional_intelligence: "bg-orange-500",
      leadership_styles: "bg-red-500",
      vark: "bg-yellow-500",
      career_anchors: "bg-indigo-500",
    };
    return colors[testType] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>Perfil Psicométrico</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/testes-psicometricos")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
        <CardDescription>
          Resultados dos testes psicométricos para orientar o desenvolvimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.slice(0, 3).map((result) => (
          <div
            key={result.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full mt-2 ${getTestTypeColor(result.testType)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {getTestTypeLabel(result.testType)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <p className="text-sm font-medium">{result.summary}</p>
            </div>
          </div>
        ))}
        
        {results.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate("/testes-psicometricos")}
          >
            Ver todos os {results.length} testes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
