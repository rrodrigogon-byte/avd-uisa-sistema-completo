import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Benchmarking UISA vs Mercado
 * 
 * Compara perfis DISC e Big Five da UISA com 21 perfis de referência do mercado
 * segmentados por setor e cargo.
 */

// Perfis de referência do mercado (dados simulados - substituir por dados reais)
const MARKET_PROFILES = {
  disc: {
    "Tecnologia - Desenvolvedor": { D: 35, I: 45, S: 55, C: 65 },
    "Tecnologia - Gerente de TI": { D: 70, I: 60, S: 40, C: 50 },
    "Financeiro - Analista": { D: 30, I: 35, S: 50, C: 85 },
    "Financeiro - CFO": { D: 75, I: 55, S: 35, C: 70 },
    "Vendas - Executivo de Contas": { D: 65, I: 85, S: 45, C: 30 },
    "Vendas - Gerente Comercial": { D: 80, I: 75, S: 40, C: 45 },
    "RH - Analista": { D: 25, I: 70, S: 80, C: 45 },
    "RH - Diretor": { D: 60, I: 75, S: 60, C: 55 },
    "Operações - Supervisor": { D: 70, I: 45, S: 55, C: 60 },
    "Operações - Diretor": { D: 85, I: 50, S: 40, C: 65 },
    "Marketing - Analista": { D: 40, I: 75, S: 50, C: 55 },
    "Marketing - CMO": { D: 70, I: 80, S: 45, C: 60 },
    "Engenharia - Engenheiro": { D: 45, I: 40, S: 50, C: 80 },
    "Engenharia - Gerente": { D: 75, I: 55, S: 45, C: 70 },
    "Jurídico - Advogado": { D: 50, I: 45, S: 40, C: 90 },
    "Jurídico - Diretor Jurídico": { D: 70, I: 60, S: 35, C: 85 },
    "Atendimento - Atendente": { D: 20, I: 75, S: 85, C: 40 },
    "Atendimento - Gerente": { D: 55, I: 70, S: 65, C: 50 },
    "Logística - Coordenador": { D: 65, I: 40, S: 60, C: 70 },
    "Logística - Diretor": { D: 80, I: 50, S: 45, C: 75 },
    "Administrativo - Assistente": { D: 30, I: 50, S: 70, C: 75 },
  },
  bigFive: {
    "Tecnologia - Desenvolvedor": { O: 75, C: 70, E: 40, A: 55, N: 45 },
    "Tecnologia - Gerente de TI": { O: 70, C: 75, E: 65, A: 60, N: 40 },
    "Financeiro - Analista": { O: 50, C: 90, E: 45, A: 55, N: 50 },
    "Financeiro - CFO": { O: 65, C: 85, E: 70, A: 60, N: 35 },
    "Vendas - Executivo de Contas": { O: 60, C: 55, E: 90, A: 70, N: 40 },
    "Vendas - Gerente Comercial": { O: 65, C: 65, E: 85, A: 65, N: 35 },
    "RH - Analista": { O: 70, C: 65, E: 75, A: 85, N: 45 },
    "RH - Diretor": { O: 75, C: 70, E: 80, A: 80, N: 35 },
    "Operações - Supervisor": { O: 55, C: 80, E: 60, A: 60, N: 40 },
    "Operações - Diretor": { O: 65, C: 85, E: 75, A: 65, N: 30 },
    "Marketing - Analista": { O: 85, C: 60, E: 70, A: 65, N: 45 },
    "Marketing - CMO": { O: 90, C: 70, E: 80, A: 70, N: 35 },
    "Engenharia - Engenheiro": { O: 80, C: 85, E: 45, A: 55, N: 40 },
    "Engenharia - Gerente": { O: 75, C: 80, E: 65, A: 60, N: 35 },
    "Jurídico - Advogado": { O: 60, C: 90, E: 50, A: 55, N: 45 },
    "Jurídico - Diretor Jurídico": { O: 70, C: 90, E: 65, A: 60, N: 35 },
    "Atendimento - Atendente": { O: 55, C: 60, E: 80, A: 90, N: 50 },
    "Atendimento - Gerente": { O: 65, C: 70, E: 75, A: 85, N: 40 },
    "Logística - Coordenador": { O: 50, C: 85, E: 55, A: 60, N: 40 },
    "Logística - Diretor": { O: 60, C: 90, E: 70, A: 65, N: 30 },
    "Administrativo - Assistente": { O: 55, C: 80, E: 60, A: 75, N: 50 },
  },
};

export default function BenchmarkingMercado() {
  const [, navigate] = useLocation();
  const [selectedProfile, setSelectedProfile] = useState<string>("Tecnologia - Desenvolvedor");
  const [testType, setTestType] = useState<"disc" | "bigFive">("disc");

  // Query para buscar médias da UISA (comentado - implementar endpoint depois)
  // const { data: uisaAverages, isLoading } = trpc.psychometric.getAverages.useQuery();
  const isLoading = false;

  // Dados do perfil selecionado
  const marketProfile = testType === "disc" 
    ? MARKET_PROFILES.disc[selectedProfile as keyof typeof MARKET_PROFILES.disc]
    : MARKET_PROFILES.bigFive[selectedProfile as keyof typeof MARKET_PROFILES.bigFive];

  // Dados da UISA (simulados - substituir por dados reais)
  const uisaProfile = testType === "disc"
    ? { D: 55, I: 60, S: 50, C: 65 }
    : { O: 70, C: 75, E: 65, A: 70, N: 40 };

  // Configuração do gráfico radar
  const radarData = {
    labels: testType === "disc" 
      ? ["Dominância", "Influência", "Estabilidade", "Conformidade"]
      : ["Abertura", "Conscienciosidade", "Extroversão", "Amabilidade", "Neuroticismo"],
    datasets: [
      {
        label: "UISA",
        data: Object.values(uisaProfile),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(59, 130, 246)",
      },
      {
        label: `Mercado: ${selectedProfile}`,
        data: Object.values(marketProfile),
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(16, 185, 129)",
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  // Calcular diferenças
  const differences = Object.keys(uisaProfile).map((key: any) => {
    const uisaValue = uisaProfile[key as keyof typeof uisaProfile] || 0;
    const marketValue = marketProfile[key as keyof typeof marketProfile] || 0;
    const diff = uisaValue - marketValue;
    return {
      dimension: key,
      uisa: uisaValue,
      market: marketValue,
      diff,
      percentage: ((diff / marketValue) * 100).toFixed(1),
    };
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Benchmarking UISA vs Mercado</h1>
            <p className="text-sm text-muted-foreground">
              Compare perfis psicométricos da UISA com referências do mercado por setor e cargo
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Comparação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Teste</label>
                <Select value={testType} onValueChange={(value) => setTestType(value as "disc" | "bigFive")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disc">DISC</SelectItem>
                    <SelectItem value="bigFive">Big Five</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Perfil de Referência do Mercado</label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(testType === "disc" ? MARKET_PROFILES.disc : MARKET_PROFILES.bigFive).map((profile: any) => (
                      <SelectItem key={profile} value={profile}>
                        {profile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação Visual - Gráfico Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] flex items-center justify-center">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Diferenças */}
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada de Diferenças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Dimensão</th>
                    <th className="text-center py-3 px-4">UISA</th>
                    <th className="text-center py-3 px-4">Mercado</th>
                    <th className="text-center py-3 px-4">Diferença</th>
                    <th className="text-center py-3 px-4">%</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.map((item: any) => {
                    const isHigher = item.diff > 0;
                    const isSignificant = Math.abs(item.diff) >= 10;

                    return (
                      <tr key={item.dimension} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {testType === "disc" 
                            ? { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" }[item.dimension]
                            : { O: "Abertura", C: "Conscienciosidade", E: "Extroversão", A: "Amabilidade", N: "Neuroticismo" }[item.dimension]
                          }
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="secondary">{item.uisa}</Badge>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="outline">{item.market}</Badge>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={isHigher ? "text-green-600 font-semibold" : item.diff < 0 ? "text-red-600 font-semibold" : ""}>
                            {item.diff > 0 ? "+" : ""}{item.diff}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={isHigher ? "text-green-600" : item.diff < 0 ? "text-red-600" : ""}>
                            {item.percentage}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {isHigher ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-xs">{isSignificant ? "Muito acima" : "Acima"}</span>
                            </div>
                          ) : item.diff < 0 ? (
                            <div className="flex items-center justify-center gap-1 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                              <span className="text-xs">{isSignificant ? "Muito abaixo" : "Abaixo"}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <Minus className="h-4 w-4" />
                              <span className="text-xs">Igual</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Insights e Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Diferenças significativas</strong> (≥10 pontos) indicam áreas de desenvolvimento prioritárias</li>
              <li>• <strong>Valores acima do mercado</strong> podem representar vantagens competitivas</li>
              <li>• <strong>Valores abaixo do mercado</strong> sugerem oportunidades de treinamento e desenvolvimento</li>
              <li>• Use esses dados para direcionar programas de T&D e recrutamento estratégico</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
