import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TestType = "katz" | "lawton" | "minimental" | "gds" | "clock";

export default function TestesGeriatricosAnalises() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const pacienteId = searchParams.get("pacienteId") ? parseInt(searchParams.get("pacienteId")!) : null;
  
  const [selectedTest, setSelectedTest] = useState<TestType>("katz");
  
  const { data: patient } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId! },
    { enabled: !!pacienteId }
  );
  
  const { data: evolutionData } = trpc.geriatric.reports.getEvolutionData.useQuery(
    { pacienteId: pacienteId!, testType: selectedTest },
    { enabled: !!pacienteId }
  );
  
  const { data: comparisonData } = trpc.geriatric.reports.getComparisonData.useQuery(
    { pacienteId: pacienteId! },
    { enabled: !!pacienteId }
  );

  if (!pacienteId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Nenhum paciente selecionado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getTestLabel = (type: TestType) => {
    const labels = {
      katz: "Katz (AVD Básicas)",
      lawton: "Lawton (AVD Instrumentais)",
      minimental: "Mini-Mental",
      gds: "Escala de Depressão (GDS-15)",
      clock: "Teste do Relógio",
    };
    return labels[type];
  };

  const getTrend = (data: any[]) => {
    if (!data || data.length < 2) return "stable";
    
    const first = data[data.length - 1].score;
    const last = data[0].score;
    
    // Para GDS, menor é melhor
    if (selectedTest === "gds") {
      if (last < first) return "up";
      if (last > first) return "down";
    } else {
      if (last > first) return "up";
      if (last < first) return "down";
    }
    
    return "stable";
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Preparar dados para o gráfico de radar (comparação)
  const radarData = comparisonData ? [
    {
      test: "Katz",
      percentage: comparisonData.katz?.percentage || 0,
    },
    {
      test: "Lawton",
      percentage: comparisonData.lawton?.percentage || 0,
    },
    {
      test: "Mini-Mental",
      percentage: comparisonData.minimental?.percentage || 0,
    },
    {
      test: "GDS",
      percentage: comparisonData.gds?.percentage || 0,
    },
    {
      test: "Relógio",
      percentage: comparisonData.clock?.percentage || 0,
    },
  ] : [];

  // Preparar dados para o gráfico de evolução
  const evolutionChartData = evolutionData?.map(item => ({
    date: formatDate(item.date),
    score: item.score,
    classification: item.classification,
  })) || [];

  const trend = getTrend(evolutionData || []);

  const handleExportPDF = () => {
    toast.info("Funcionalidade de exportação PDF em desenvolvimento");
    // TODO: Implementar exportação PDF
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análises e Gráficos</h1>
          {patient && (
            <p className="text-muted-foreground mt-2">
              Paciente: <strong>{patient.nome}</strong>
            </p>
          )}
        </div>
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Comparação entre Testes */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação entre Testes</CardTitle>
          <CardDescription>
            Visualização normalizada dos resultados mais recentes de cada teste (0-100%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Radar */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="test" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Desempenho (%)"
                    dataKey="percentage"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentage" fill="#8884d8" name="Desempenho (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detalhes dos Testes */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {comparisonData?.katz && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Katz</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisonData.katz.score}/6</div>
                  <Badge className="mt-2">{comparisonData.katz.classification}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(comparisonData.katz.date)}
                  </p>
                </CardContent>
              </Card>
            )}

            {comparisonData?.lawton && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Lawton</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisonData.lawton.score}/8</div>
                  <Badge className="mt-2">{comparisonData.lawton.classification}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(comparisonData.lawton.date)}
                  </p>
                </CardContent>
              </Card>
            )}

            {comparisonData?.minimental && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Mini-Mental</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisonData.minimental.score}/30</div>
                  <Badge className="mt-2">{comparisonData.minimental.classification}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(comparisonData.minimental.date)}
                  </p>
                </CardContent>
              </Card>
            )}

            {comparisonData?.gds && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">GDS-15</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisonData.gds.score}/15</div>
                  <Badge className="mt-2">{comparisonData.gds.classification}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(comparisonData.gds.date)}
                  </p>
                </CardContent>
              </Card>
            )}

            {comparisonData?.clock && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Relógio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisonData.clock.score}/10</div>
                  <Badge className="mt-2">{comparisonData.clock.classification}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(comparisonData.clock.date)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evolução Temporal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evolução Temporal</CardTitle>
              <CardDescription>
                Acompanhe a evolução do paciente ao longo do tempo
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {trend === "up" && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Melhora
                </Badge>
              )}
              {trend === "down" && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Piora
                </Badge>
              )}
              {trend === "stable" && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Minus className="h-4 w-4 mr-1" />
                  Estável
                </Badge>
              )}
              <Select value={selectedTest} onValueChange={(value) => setSelectedTest(value as TestType)}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="katz">Katz (AVD Básicas)</SelectItem>
                  <SelectItem value="lawton">Lawton (AVD Instrumentais)</SelectItem>
                  <SelectItem value="minimental">Mini-Mental</SelectItem>
                  <SelectItem value="gds">Escala de Depressão (GDS-15)</SelectItem>
                  <SelectItem value="clock">Teste do Relógio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {evolutionChartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Pontuação"
                    dot={{ r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível para o teste selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
