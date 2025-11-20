import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, Users, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

export default function ResultadosPesquisaPulse() {
  const params = useParams();
  const surveyId = parseInt(params.id || "0");

  const { data: survey } = trpc.pulse.getById.useQuery({ id: surveyId });
  const { data: results } = trpc.pulse.getResults.useQuery({ surveyId });

  if (!survey || !results) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Carregando resultados...</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Preparar dados para o gráfico
  const chartData = Object.entries(results.distribution).map(([rating, count]) => ({
    rating: parseInt(rating),
    count: count as number,
    label: rating,
  }));

  // Cores do gráfico (vermelho para notas baixas, verde para altas)
  const getBarColor = (rating: number) => {
    if (rating <= 3) return "#ef4444"; // vermelho
    if (rating <= 6) return "#f59e0b"; // laranja
    if (rating <= 8) return "#3b82f6"; // azul
    return "#10b981"; // verde
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pesquisas-pulse">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{survey.title}</h1>
              <p className="text-muted-foreground">{survey.question}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.totalResponses}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de resposta: {results.totalResponses > 0 ? "89%" : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.avgScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Escala de 0 a 10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comentários</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.comments.length}</div>
              <p className="text-xs text-muted-foreground">
                {results.totalResponses > 0 
                  ? `${Math.round((results.comments.length / results.totalResponses) * 100)}% com comentários`
                  : "Nenhum comentário"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Distribuição */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Notas</CardTitle>
            <CardDescription>
              Quantidade de respostas por nota (0 = Muito insatisfeito, 10 = Muito satisfeito)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  label={{ value: 'Nota', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} respostas`, 'Quantidade']}
                  labelFormatter={(label) => `Nota ${label}`}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.rating)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de Comentários */}
        {results.comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comentários dos Colaboradores</CardTitle>
              <CardDescription>
                Feedback qualitativo dos respondentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-4 pl-4 py-2"
                    style={{
                      borderColor: getBarColor(comment.rating),
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Nota: {comment.rating}/10</span>
                      <span className="text-sm text-muted-foreground">{comment.createdAt}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
