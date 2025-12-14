import { useEffect, useRef } from 'react';
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
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface PerformanceDataPoint {
  period: string;
  score: number;
  date: Date;
}

interface PerformanceEvolutionChartProps {
  data: PerformanceDataPoint[];
  title?: string;
  description?: string;
  userName?: string;
}

export function PerformanceEvolutionChart({
  data,
  title = 'Evolução de Desempenho',
  description = 'Acompanhamento das pontuações ao longo do tempo',
  userName,
}: PerformanceEvolutionChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Ordenar dados por data
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

  const chartData = {
    labels: sortedData.map(d => d.period),
    datasets: [
      {
        label: userName ? `Desempenho de ${userName}` : 'Desempenho',
        data: sortedData.map(d => d.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: '#fff',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
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
        mode: 'index' as const,
        intersect: false,
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
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)} pontos`;
          },
          afterLabel: function(context) {
            const index = context.dataIndex;
            const dataPoint = sortedData[index];
            if (dataPoint) {
              return `Data: ${dataPoint.date.toLocaleDateString('pt-BR')}`;
            }
            return '';
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
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        
        {sortedData.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Média Geral</p>
              <p className="text-2xl font-bold text-blue-600">
                {(sortedData.reduce((acc, d) => acc + d.score, 0) / sortedData.length).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Melhor Resultado</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...sortedData.map(d => d.score)).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Última Avaliação</p>
              <p className="text-2xl font-bold text-purple-600">
                {sortedData[sortedData.length - 1]?.score.toFixed(1) || 'N/A'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
