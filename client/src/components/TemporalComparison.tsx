import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
}

interface TemporalComparisonProps {
  title: string;
  description?: string;
  currentPeriodLabel?: string;
  comparisonPeriodLabel?: string;
  metrics: MetricData[];
  chartData?: Array<{ name: string; current: number; previous: number }>;
  chartType?: "line" | "bar";
}

/**
 * Componente de Comparação Temporal
 * Exibe métricas lado a lado entre dois períodos com indicadores de tendência
 */
export function TemporalComparison({
  title,
  description,
  currentPeriodLabel = "Período Atual",
  comparisonPeriodLabel = "Período Anterior",
  metrics,
  chartData,
  chartType = "line",
}: TemporalComparisonProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");

  // Calcular variação percentual
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Renderizar indicador de tendência
  const renderTrendIndicator = (current: number, previous?: number) => {
    if (!previous && previous !== 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Minus className="h-3 w-3 mr-1" />
          Sem dados anteriores
        </Badge>
      );
    }

    const change = calculateChange(current, previous);

    if (Math.abs(change) < 1) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Minus className="h-3 w-3 mr-1" />
          Estável
        </Badge>
      );
    }

    if (change > 0) {
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{change.toFixed(1)}%
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="text-xs">
        <TrendingDown className="h-3 w-3 mr-1" />
        {change.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias vs 7 anteriores</SelectItem>
              <SelectItem value="30">Últimos 30 dias vs 30 anteriores</SelectItem>
              <SelectItem value="90">Últimos 90 dias vs 90 anteriores</SelectItem>
              <SelectItem value="365">Último ano vs ano anterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Comparativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                      {metric.previousValue !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Anterior: {metric.previousValue.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {renderTrendIndicator(metric.value, metric.previousValue)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico Comparativo */}
        {chartData && chartData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Tendência Temporal</h3>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="#3b82f6"
                    name={currentPeriodLabel}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="#94a3b8"
                    name={comparisonPeriodLabel}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name={currentPeriodLabel} />
                  <Bar dataKey="previous" fill="#94a3b8" name={comparisonPeriodLabel} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Insights Automáticos */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Insights</h3>
          <div className="space-y-2">
            {metrics.map((metric, index) => {
              if (!metric.previousValue && metric.previousValue !== 0) return null;
              
              const change = calculateChange(metric.value, metric.previousValue);
              
              if (Math.abs(change) < 1) return null;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    change > 0
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                  }`}
                >
                  <p className="text-sm">
                    <strong>{metric.label}</strong> {change > 0 ? "aumentou" : "diminuiu"} em{" "}
                    <strong>{Math.abs(change).toFixed(1)}%</strong> em relação ao período anterior
                    {change > 20 && " (variação significativa)"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
