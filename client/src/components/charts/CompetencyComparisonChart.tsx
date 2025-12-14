import { useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CompetencyData {
  name: string;
  currentLevel: number;
  requiredLevel: number;
}

interface CompetencyComparisonChartProps {
  data: CompetencyData[];
  title?: string;
  description?: string;
  maxLevel?: number;
}

export function CompetencyComparisonChart({
  data,
  title = 'Comparação de Competências',
  description = 'Nível atual vs. nível requerido',
  maxLevel = 5,
}: CompetencyComparisonChartProps) {
  const chartRef = useRef<ChartJS<'radar'>>(null);

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Nível Atual',
        data: data.map(d => d.currentLevel),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(34, 197, 94)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Nível Requerido',
        data: data.map(d => d.requiredLevel),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 15,
          usePointStyle: true,
        },
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.r;
            return `${label}: Nível ${value}`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: maxLevel,
        min: 0,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#374151',
        },
      },
    },
  };

  // Calcular estatísticas
  const gaps = data.map(d => d.requiredLevel - d.currentLevel);
  const averageGap = gaps.reduce((acc, gap) => acc + gap, 0) / gaps.length;
  const competenciesAboveRequired = data.filter(d => d.currentLevel >= d.requiredLevel).length;
  const competenciesBelowRequired = data.filter(d => d.currentLevel < d.requiredLevel).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[450px] w-full">
          <Radar ref={chartRef} data={chartData} options={options} />
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Acima do Esperado</p>
            <p className="text-2xl font-bold text-green-600">
              {competenciesAboveRequired}
            </p>
            <p className="text-xs text-muted-foreground">
              {((competenciesAboveRequired / data.length) * 100).toFixed(0)}% do total
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Abaixo do Esperado</p>
            <p className="text-2xl font-bold text-red-600">
              {competenciesBelowRequired}
            </p>
            <p className="text-xs text-muted-foreground">
              {((competenciesBelowRequired / data.length) * 100).toFixed(0)}% do total
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Gap Médio</p>
            <p className={`text-2xl font-bold ${averageGap > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
              {averageGap > 0 ? '+' : ''}{averageGap.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">
              níveis de diferença
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
