import { useMemo } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dimensões do Perfil de Integridade baseadas no modelo Kohlberg
 * IP - Integridade Pessoal
 * ID - Integridade nas Decisões
 * IC - Integridade nos Compromissos
 * ES - Estabilidade Emocional
 * FL - Flexibilidade
 * AU - Autonomia
 */
const dimensionLabels: Record<string, { name: string; fullName: string; description: string }> = {
  IP: {
    name: "IP",
    fullName: "Integridade Pessoal",
    description: "Coerência entre valores pessoais e comportamentos",
  },
  ID: {
    name: "ID",
    fullName: "Integridade nas Decisões",
    description: "Capacidade de tomar decisões éticas sob pressão",
  },
  IC: {
    name: "IC",
    fullName: "Integridade nos Compromissos",
    description: "Cumprimento de promessas e responsabilidades",
  },
  ES: {
    name: "ES",
    fullName: "Estabilidade Emocional",
    description: "Equilíbrio emocional em situações desafiadoras",
  },
  FL: {
    name: "FL",
    fullName: "Flexibilidade",
    description: "Adaptabilidade a mudanças e novas situações",
  },
  AU: {
    name: "AU",
    fullName: "Autonomia",
    description: "Capacidade de agir de forma independente e responsável",
  },
};

// Cores para diferentes níveis de risco
const riskColors = {
  low: "#22c55e",      // Verde
  moderate: "#eab308", // Amarelo
  high: "#f97316",     // Laranja
  critical: "#ef4444", // Vermelho
};

interface IntegrityRadarChartProps {
  scores: Record<string, number>; // Scores por dimensão (0-100)
  benchmarkScores?: Record<string, number>; // Scores de benchmark para comparação
  title?: string;
  description?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  riskLevel?: "low" | "moderate" | "high" | "critical";
}

export function IntegrityRadarChart({
  scores,
  benchmarkScores,
  title = "Perfil de Integridade",
  description = "Visualização das 6 dimensões de integridade",
  showLegend = true,
  showTooltip = true,
  height = 400,
  riskLevel = "low",
}: IntegrityRadarChartProps) {
  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    const dimensions = ["IP", "ID", "IC", "ES", "FL", "AU"];
    
    return dimensions.map((dim) => ({
      dimension: dimensionLabels[dim]?.name || dim,
      fullName: dimensionLabels[dim]?.fullName || dim,
      description: dimensionLabels[dim]?.description || "",
      score: scores[dim] ?? 0,
      benchmark: benchmarkScores?.[dim] ?? null,
      fullMark: 100,
    }));
  }, [scores, benchmarkScores]);

  // Calcular score médio
  const averageScore = useMemo(() => {
    const values = Object.values(scores).filter((v) => typeof v === "number");
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [scores]);

  // Determinar cor baseada no nível de risco
  const mainColor = riskColors[riskLevel];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-500 mb-2">{data.description}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Score:</span>{" "}
              <span style={{ color: mainColor }}>{data.score}%</span>
            </p>
            {data.benchmark !== null && (
              <p className="text-sm">
                <span className="font-medium">Benchmark:</span>{" "}
                <span className="text-blue-600">{data.benchmark}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score Médio</p>
            <p className="text-2xl font-bold" style={{ color: mainColor }}>
              {averageScore}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                tickCount={5}
              />
              
              {/* Benchmark (se fornecido) */}
              {benchmarkScores && (
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
              
              {/* Score principal */}
              <Radar
                name="Score"
                dataKey="score"
                stroke={mainColor}
                fill={mainColor}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              
              {showLegend && (
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600">{value}</span>
                  )}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda das Dimensões */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {chartData.map((item) => (
            <div
              key={item.dimension}
              className="p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">{item.dimension}</span>
                <span
                  className="font-bold"
                  style={{ color: item.score >= 70 ? "#22c55e" : item.score >= 50 ? "#eab308" : "#ef4444" }}
                >
                  {item.score}%
                </span>
              </div>
              <p className="text-xs text-gray-500">{item.fullName}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente simplificado para uso inline
 */
interface IntegrityRadarMiniProps {
  scores: Record<string, number>;
  size?: number;
  riskLevel?: "low" | "moderate" | "high" | "critical";
}

export function IntegrityRadarMini({
  scores,
  size = 200,
  riskLevel = "low",
}: IntegrityRadarMiniProps) {
  const chartData = useMemo(() => {
    const dimensions = ["IP", "ID", "IC", "ES", "FL", "AU"];
    return dimensions.map((dim) => ({
      dimension: dim,
      score: scores[dim] ?? 0,
      fullMark: 100,
    }));
  }, [scores]);

  const mainColor = riskColors[riskLevel];

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#6b7280", fontSize: 10 }}
          />
          <Radar
            dataKey="score"
            stroke={mainColor}
            fill={mainColor}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default IntegrityRadarChart;
