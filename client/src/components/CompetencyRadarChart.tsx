import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Competency {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  category?: string;
}

interface CompetencyRadarChartProps {
  competencies?: Competency[];
  title?: string;
  description?: string;
}

export default function CompetencyRadarChart({
  competencies = [],
  title = "Mapa de Competências",
  description = "Comparação entre nível atual e nível esperado",
}: CompetencyRadarChartProps) {
  // Garantir que competencies é um array válido
  const safeCompetencies = ensureArray(competencies);

  // Early return se não houver competências
  if (isEmpty(safeCompetencies)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma competência disponível para visualização</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = safeMap(safeCompetencies, (comp) => ({
    competency: comp.name.length > 20 ? comp.name.substring(0, 20) + "..." : comp.name,
    fullName: comp.name,
    "Nível Atual": comp.currentLevel,
    "Nível Esperado": comp.requiredLevel,
    gap: comp.requiredLevel - comp.currentLevel,
  }));

  // Calcular estatísticas
  const avgCurrent = safeReduce(safeCompetencies, (sum, c) => sum + c.currentLevel, 0) / safeLength(safeCompetencies);
  const avgRequired = safeReduce(safeCompetencies, (sum, c) => sum + c.requiredLevel, 0) / safeLength(safeCompetencies);
  const totalGap = safeReduce(safeCompetencies, (sum, c) => sum + Math.max(0, c.requiredLevel - c.currentLevel), 0);
  const competenciesWithGap = safeLength(safeFilter(safeCompetencies, (c) => c.currentLevel < c.requiredLevel));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{avgCurrent.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Nível Médio Atual</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{avgRequired.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Nível Médio Esperado</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{totalGap.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Gap Total</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-red-600">{competenciesWithGap}</p>
              <p className="text-xs text-muted-foreground">Competências com Gap</p>
            </div>
          </div>

          {/* Gráfico Radar */}
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="competency"
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar
                name="Nível Atual"
                dataKey="Nível Atual"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Nível Esperado"
                dataKey="Nível Esperado"
                stroke="hsl(280, 100%, 50%)"
                fill="hsl(280, 100%, 50%)"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-2">{data.fullName}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Nível Atual:</span>
                            <span className="font-semibold text-primary">{data["Nível Atual"]}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Nível Esperado:</span>
                            <span className="font-semibold text-purple-600">{data["Nível Esperado"]}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1 border-t">
                            <span className="text-muted-foreground">Gap:</span>
                            <span className={`font-semibold ${data.gap > 0 ? "text-red-600" : "text-green-600"}`}>
                              {data.gap > 0 ? `+${data.gap}` : data.gap}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Lista de Gaps */}
          {competenciesWithGap > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Competências Prioritárias para Desenvolvimento</h4>
              <div className="space-y-1">
                {safeSlice(
                  safeSort(
                    safeFilter(safeCompetencies, (c) => c.currentLevel < c.requiredLevel),
                    (a, b) => (b.requiredLevel - b.currentLevel) - (a.requiredLevel - a.currentLevel)
                  ),
                  0,
                  5
                ).map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span className="font-medium">{comp.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {comp.currentLevel} → {comp.requiredLevel}
                        </span>
                        <span className="text-xs font-semibold text-red-600">
                          Gap: +{comp.requiredLevel - comp.currentLevel}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
