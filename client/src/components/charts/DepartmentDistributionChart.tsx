import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DepartmentScore {
  department: string;
  averageScore: number;
  evaluationCount: number;
  minScore: number;
  maxScore: number;
}

interface DepartmentDistributionChartProps {
  data: DepartmentScore[];
  title?: string;
  description?: string;
}

export function DepartmentDistributionChart({
  data,
  title = 'Distribuição de Desempenho por Departamento',
  description = 'Comparação de médias entre departamentos',
}: DepartmentDistributionChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Ordenar por média decrescente
  const sortedData = [...data].sort((a, b) => b.averageScore - a.averageScore);

  // Gerar cores dinâmicas baseadas na pontuação
  const backgroundColors = sortedData.map(d => {
    if (d.averageScore >= 80) return 'rgba(34, 197, 94, 0.8)'; // Verde
    if (d.averageScore >= 60) return 'rgba(59, 130, 246, 0.8)'; // Azul
    if (d.averageScore >= 40) return 'rgba(251, 146, 60, 0.8)'; // Laranja
    return 'rgba(239, 68, 68, 0.8)'; // Vermelho
  });

  const borderColors = sortedData.map(d => {
    if (d.averageScore >= 80) return 'rgb(34, 197, 94)';
    if (d.averageScore >= 60) return 'rgb(59, 130, 246)';
    if (d.averageScore >= 40) return 'rgb(251, 146, 60)';
    return 'rgb(239, 68, 68)';
  });

  const chartData = {
    labels: sortedData.map(d => d.department),
    datasets: [
      {
        label: 'Média de Desempenho',
        data: sortedData.map(d => d.averageScore),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 50,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            return sortedData[index].department;
          },
          label: function(context) {
            const index = context.dataIndex;
            const dept = sortedData[index];
            return [
              `Média: ${dept.averageScore.toFixed(1)} pontos`,
              `Avaliações: ${dept.evaluationCount}`,
              `Mínimo: ${dept.minScore.toFixed(1)}`,
              `Máximo: ${dept.maxScore.toFixed(1)}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + ' pts';
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Calcular estatísticas gerais
  const overallAverage = sortedData.reduce((acc, d) => acc + d.averageScore, 0) / sortedData.length;
  const totalEvaluations = sortedData.reduce((acc, d) => acc + d.evaluationCount, 0);
  const bestDepartment = sortedData[0];
  const worstDepartment = sortedData[sortedData.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <Bar ref={chartRef} data={chartData} options={options} />
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Média Geral</p>
            <p className="text-2xl font-bold text-blue-600">
              {overallAverage.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalEvaluations} avaliações
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Melhor Departamento</p>
            <p className="text-lg font-bold text-green-600">
              {bestDepartment?.department || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              {bestDepartment?.averageScore.toFixed(1)} pts
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Menor Desempenho</p>
            <p className="text-lg font-bold text-red-600">
              {worstDepartment?.department || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              {worstDepartment?.averageScore.toFixed(1)} pts
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Variação</p>
            <p className="text-2xl font-bold text-purple-600">
              {bestDepartment && worstDepartment
                ? (bestDepartment.averageScore - worstDepartment.averageScore).toFixed(1)
                : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              pontos de diferença
            </p>
          </div>
        </div>

        {/* Legenda de cores */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-muted-foreground">Excelente (80-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-muted-foreground">Bom (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400"></div>
            <span className="text-muted-foreground">Regular (40-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-muted-foreground">Abaixo (0-39)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
