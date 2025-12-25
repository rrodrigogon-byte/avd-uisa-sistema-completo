import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, BookOpen, Target, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecommendationsSectionProps {
  employeeId: number;
}

export default function RecommendationsSection({ employeeId }: RecommendationsSectionProps) {
  const { data: recommendations, isLoading } = trpc.psychometric.getPDIRecommendations.useQuery({
    employeeId,
  });

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Lightbulb className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Este colaborador ainda não realizou testes psicométricos. Envie convites de testes para gerar recomendações inteligentes de desenvolvimento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Recomendações Inteligentes de Desenvolvimento
        </CardTitle>
        <CardDescription>
          Baseadas nos testes psicométricos realizados pelo colaborador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.slice(0, 3).map((rec: any, index: number) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-blue-100 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{rec.competency}</h4>
                  <Badge 
                    variant={rec.priority === "high" ? "default" : "secondary"}
                    className={rec.priority === "high" ? "bg-orange-500" : ""}
                  >
                    {rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Média" : "Baixa"} Prioridade
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-500 italic">{rec.reasoning}</p>
              </div>
            </div>

            {/* Ações Sugeridas */}
            {rec.actions && rec.actions.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Target className="h-4 w-4" />
                  Ações Sugeridas:
                </div>
                <ul className="space-y-1">
                  {rec.actions.slice(0, 2).map((action: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cursos Recomendados */}
            {rec.courses && rec.courses.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="h-4 w-4" />
                  Cursos Recomendados:
                </div>
                <div className="flex flex-wrap gap-2">
                  {rec.courses.slice(0, 3).map((course: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {recommendations.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              + {recommendations.length - 3} recomendações adicionais disponíveis após criação do PDI
            </p>
          </div>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Dica:</strong> Estas recomendações foram geradas automaticamente com base nos perfis psicométricos. 
            Use-as como ponto de partida para criar um PDI personalizado e eficaz.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
