import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Calculator, Target, DollarSign, Users, AlertCircle } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PrevisaoBonus() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [performanceProjection, setPerformanceProjection] = useState<number>(85);
  const [goalCompletionRate, setGoalCompletionRate] = useState<number>(75);

  // Buscar dados
  const { employees } = useEmployeeSearch();
  const { data: policies } = trpc.bonus.list.useQuery({ active: true });
  const { data: monthlyTrends } = trpc.bonus.getMonthlyTrends.useQuery({ months: 6 });

  // Buscar dados do funcionário selecionado
  const { data: employeeData } = trpc.employees.getById.useQuery(
    { id: selectedEmployee! },
    { enabled: !!selectedEmployee }
  );

  // Calcular previsão de bônus
  const calculateProjection = () => {
    if (!employeeData || !policies || policies.length === 0) return null;

    // Encontrar política aplicável ao cargo do funcionário
    const applicablePolicy = policies.find(
      (p: any) => p.positionId === employeeData.employee.positionId
    );

    if (!applicablePolicy) return null;

    const baseSalary = Number(employeeData.employee.salary || 0);
    
    // Calcular multiplicador baseado em performance e metas
    const performanceFactor = performanceProjection / 100;
    const goalFactor = goalCompletionRate / 100;
    const combinedFactor = (performanceFactor * 0.6 + goalFactor * 0.4);
    
    // Aplicar multiplicadores da política
    const baseMultiplier = Number(applicablePolicy.salaryMultiplier || 0);
    const minMult = Number(applicablePolicy.minMultiplier || 0);
    const maxMult = Number(applicablePolicy.maxMultiplier || 0);
    
    // Ajustar multiplicador baseado em performance
    let multiplier = baseMultiplier * combinedFactor;
    
    // Limitar entre min e max
    multiplier = Math.max(minMult, Math.min(maxMult, multiplier));

    const projectedBonus = baseSalary * multiplier;

    return {
      baseSalary,
      multiplier,
      projectedBonus,
      performanceFactor,
      goalFactor,
      combinedFactor,
      policyName: applicablePolicy.name,
    };
  };

  const projection = calculateProjection();

  // Gerar dados de projeção futura (próximos 6 meses)
  const generateFutureProjection = () => {
    if (!projection || !monthlyTrends) return null;

    const lastMonths = monthlyTrends.slice(-3);
    const avgGrowth = lastMonths.length > 1
      ? (Number(lastMonths[lastMonths.length - 1].totalAmount) - Number(lastMonths[0].totalAmount)) / lastMonths.length
      : 0;

    const futureMonths = [];
    const currentMonth = new Date();
    
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(currentMonth);
      futureDate.setMonth(currentMonth.getMonth() + i);
      const monthLabel = futureDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      
      // Projeção conservadora, moderada e otimista
      const baseProjection = projection.projectedBonus;
      const conservative = baseProjection * 0.85;
      const moderate = baseProjection;
      const optimistic = baseProjection * 1.15;

      futureMonths.push({
        month: monthLabel,
        conservative,
        moderate,
        optimistic,
      });
    }

    return futureMonths;
  };

  const futureProjection = generateFutureProjection();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          Previsão de Bônus
        </h1>
        <p className="text-gray-500 mt-1">
          Simule cenários futuros baseados em metas e performance
        </p>
      </div>

      {/* Simulador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Simulador Interativo
          </CardTitle>
          <CardDescription>
            Ajuste os parâmetros para calcular a previsão de bônus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Seleção de Funcionário */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colaborador</label>
              <Select
                value={selectedEmployee?.toString() || ""}
                onValueChange={(v) => setSelectedEmployee(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projeção de Performance */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Projeção de Performance: {performanceProjection}%
              </label>
              <Slider
                value={[performanceProjection]}
                onValueChange={(v) => setPerformanceProjection(v[0])}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500">
                Performance esperada no período
              </p>
            </div>

            {/* Taxa de Conclusão de Metas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Conclusão de Metas: {goalCompletionRate}%
              </label>
              <Slider
                value={[goalCompletionRate]}
                onValueChange={(v) => setGoalCompletionRate(v[0])}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500">
                Percentual de metas atingidas
              </p>
            </div>
          </div>

          {/* Resultado da Simulação */}
          {projection && employeeData ? (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resultado da Simulação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Salário Base</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {(projection.baseSalary / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Multiplicador</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {projection.multiplier.toFixed(2)}x
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bônus Projetado</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(projection.projectedBonus / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fator Combinado</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(projection.combinedFactor * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Política aplicada: {projection.policyName}</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Selecione um colaborador para visualizar a previsão
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Projeção Futura */}
      {futureProjection && projection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Projeção para os Próximos 6 Meses
            </CardTitle>
            <CardDescription>
              Cenários: Conservador, Moderado e Otimista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: futureProjection.map((f) => f.month),
                datasets: [
                  {
                    label: "Cenário Conservador",
                    data: futureProjection.map((f) => f.conservative / 100),
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false,
                  },
                  {
                    label: "Cenário Moderado",
                    data: futureProjection.map((f) => f.moderate / 100),
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    tension: 0.4,
                    fill: true,
                  },
                  {
                    label: "Cenário Otimista",
                    data: futureProjection.map((f) => f.optimistic / 100),
                    borderColor: "rgb(34, 197, 94)",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) {
                          label += ": ";
                        }
                        if (context.parsed.y !== null) {
                          label += new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(context.parsed.y);
                        }
                        return label;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        return new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          notation: "compact",
                        }).format(value as number);
                      },
                    },
                  },
                },
              }}
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Comparação com Histórico */}
      {monthlyTrends && projection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Comparação com Histórico
            </CardTitle>
            <CardDescription>
              Bônus projetado vs. média histórica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-600 mb-1">Média Histórica (6 meses)</p>
                  <p className="text-2xl font-bold text-blue-700">
                    R${" "}
                    {(
                      monthlyTrends.reduce((sum, t) => sum + Number(t.averageBonus), 0) /
                      monthlyTrends.length /
                      100
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-green-600 mb-1">Bônus Projetado</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {(projection.projectedBonus / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-purple-600 mb-1">Variação</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(
                      ((projection.projectedBonus -
                        (monthlyTrends.reduce((sum, t) => sum + Number(t.averageBonus), 0) /
                          monthlyTrends.length)) /
                        (monthlyTrends.reduce((sum, t) => sum + Number(t.averageBonus), 0) /
                          monthlyTrends.length)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
