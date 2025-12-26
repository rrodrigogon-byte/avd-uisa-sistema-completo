import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { BarChart3, TrendingUp, Users, Star, Loader2, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Dashboard de Analytics de Templates 360°
 * Métricas de uso, templates mais populares e recomendações
 */

export default function TemplatesAnalytics() {
  const { data: templates, isLoading } = trpc.cycles360Templates.list.useQuery({});
  const { data: analytics } = trpc.cycles360Templates.getAnalytics.useQuery({});

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Dados para gráfico de uso por template
  const usageChartData = {
    labels: templates?.slice(0, 10).map(t => t.name) || [],
    datasets: [
      {
        label: 'Vezes Usado',
        data: templates?.slice(0, 10).map(t => t.usageCount || 0) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  };

  // Dados para gráfico de templates públicos vs privados
  const visibilityChartData = {
    labels: ['Públicos', 'Privados'],
    datasets: [
      {
        data: [
          templates?.filter(t => t.isPublic).length || 0,
          templates?.filter(t => !t.isPublic).length || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(234, 179, 8, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // Calcular estatísticas
  const totalTemplates = templates?.length || 0;
  const totalUsage = templates?.reduce((sum, t) => sum + (t.usageCount || 0), 0) || 0;
  const avgUsage = totalTemplates > 0 ? (totalUsage / totalTemplates).toFixed(1) : 0;
  const mostUsedTemplate = templates?.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics de Templates 360°
          </h1>
          <p className="text-muted-foreground mt-2">
            Métricas de uso, popularidade e recomendações de templates
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTemplates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{avgUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mais Popular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {mostUsedTemplate?.name || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {mostUsedTemplate?.usageCount || 0} usos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Templates Mais Usados</CardTitle>
              <CardDescription>
                Templates ordenados por número de vezes utilizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={usageChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Visibilidade</CardTitle>
              <CardDescription>
                Proporção entre templates públicos e privados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut data={visibilityChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Templates</CardTitle>
            <CardDescription>
              Lista completa com estatísticas de uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Criador</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead className="text-right">Usos</TableHead>
                  <TableHead className="text-right">Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates && templates.length > 0 ? (
                  templates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.creatorName || "Desconhecido"}</TableCell>
                      <TableCell>
                        <Badge variant={template.isPublic ? "default" : "secondary"}>
                          {template.isPublic ? "Público" : "Privado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {template.usageCount || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum template encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recomendações */}
        {analytics && analytics.recommendations && analytics.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Recomendações
              </CardTitle>
              <CardDescription>
                Sugestões baseadas em padrões de sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analytics.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
