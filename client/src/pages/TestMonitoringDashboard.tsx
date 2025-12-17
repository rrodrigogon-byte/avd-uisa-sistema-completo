import { useState, useEffect } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  PlayCircle
} from "lucide-react";
import { toast } from "sonner";
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
  Filler
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

interface TestResult {
  id: string;
  name: string;
  module: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  timestamp: Date;
}

interface TestSuite {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

/**
 * Dashboard de Monitoramento de Testes
 * 
 * Acompanha a saúde do sistema em tempo real através dos testes automatizados:
 * - Status dos últimos testes executados
 * - Taxa de sucesso dos testes (%)
 * - Lista de testes falhando com detalhes
 * - Gráfico de evolução de testes
 * - Filtros por módulo/categoria
 * - Alertas para testes críticos falhando
 * - Botão para executar testes manualmente
 */
export default function TestMonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Simular dados de teste (substituir por dados reais do backend)
  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = () => {
    // Dados simulados - substituir por chamada real ao backend
    const mockResults: TestResult[] = [
      {
        id: "1",
        name: "Deve enviar email com whitelist",
        module: "Email",
        status: "passed",
        duration: 125,
        timestamp: new Date(),
      },
      {
        id: "2",
        name: "Deve bloquear emails fora da whitelist",
        module: "Email",
        status: "passed",
        duration: 98,
        timestamp: new Date(),
      },
      {
        id: "3",
        name: "Deve validar regra 5% corretamente",
        module: "Avaliações",
        status: "passed",
        duration: 156,
        timestamp: new Date(),
      },
      {
        id: "4",
        name: "Deve calcular mínimo de avaliações",
        module: "Avaliações",
        status: "passed",
        duration: 87,
        timestamp: new Date(),
      },
      {
        id: "5",
        name: "Deve criar usuário com sucesso",
        module: "Usuários",
        status: "passed",
        duration: 234,
        timestamp: new Date(),
      },
      {
        id: "6",
        name: "Deve autenticar usuário",
        module: "Autenticação",
        status: "passed",
        duration: 178,
        timestamp: new Date(),
      },
    ];

    const mockSuites: TestSuite[] = [
      {
        name: "Email",
        total: 7,
        passed: 7,
        failed: 0,
        skipped: 0,
        duration: 850,
      },
      {
        name: "Avaliações",
        total: 12,
        passed: 12,
        failed: 0,
        skipped: 0,
        duration: 1420,
      },
      {
        name: "Usuários",
        total: 8,
        passed: 8,
        failed: 0,
        skipped: 0,
        duration: 980,
      },
      {
        name: "Autenticação",
        total: 6,
        passed: 6,
        failed: 0,
        skipped: 0,
        duration: 720,
      },
      {
        name: "Metas",
        total: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        duration: 1150,
      },
    ];

    const mockHistorical = [
      { date: "01/12", passed: 38, failed: 5, total: 43 },
      { date: "02/12", passed: 40, failed: 3, total: 43 },
      { date: "03/12", passed: 41, failed: 2, total: 43 },
      { date: "04/12", passed: 42, failed: 1, total: 43 },
      { date: "05/12", passed: 43, failed: 0, total: 43 },
      { date: "06/12", passed: 43, failed: 0, total: 43 },
      { date: "07/12", passed: 43, failed: 0, total: 43 },
    ];

    setTestResults(mockResults);
    setTestSuites(mockSuites);
    setHistoricalData(mockHistorical);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Atualizando dados de testes...");
    
    // Simular delay de atualização
    setTimeout(() => {
      loadTestData();
      setIsRefreshing(false);
      toast.success("Dados atualizados com sucesso!");
    }, 1500);
  };

  const handleRunTests = () => {
    toast.info("Executando testes... (funcionalidade em desenvolvimento)");
  };

  // Calcular estatísticas gerais
  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const totalSkipped = testSuites.reduce((sum, suite) => sum + suite.skipped, 0);
  const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  // Filtrar resultados por módulo
  const filteredResults = selectedModule === "all" 
    ? testResults 
    : testResults.filter(r => r.module === selectedModule);

  // Dados para gráfico de evolução
  const evolutionChartData = {
    labels: historicalData.map(d => d.date),
    datasets: [
      {
        label: "Testes Passando",
        data: historicalData.map(d => d.passed),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Testes Falhando",
        data: historicalData.map(d => d.failed),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitoramento de Testes</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe a saúde do sistema em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={handleRunTests}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Executar Testes
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-xs text-muted-foreground">
                Suítes de teste ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successRate.toFixed(1)}%
              </div>
              <Progress value={successRate} className="mt-2" indicatorClassName="bg-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testes Passando</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
              <p className="text-xs text-muted-foreground">
                {totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(0) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testes Falhando</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
              <p className="text-xs text-muted-foreground">
                {totalSkipped > 0 && `${totalSkipped} ignorados`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Saúde do Sistema */}
        {totalFailed === 0 ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Sistema Saudável
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Todos os testes estão passando. O sistema está funcionando corretamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Atenção: {totalFailed} teste(s) falhando
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Verifique os testes falhando abaixo e corrija os problemas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos Testes (Últimos 7 dias)</CardTitle>
            <CardDescription>
              Acompanhe a tendência de testes passando e falhando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={evolutionChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Suítes de Teste */}
        <Card>
          <CardHeader>
            <CardTitle>Suítes de Teste por Módulo</CardTitle>
            <CardDescription>
              Status detalhado de cada módulo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testSuites.map((suite) => {
                const suiteSuccessRate = suite.total > 0 
                  ? (suite.passed / suite.total) * 100 
                  : 0;

                return (
                  <div key={suite.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{suite.name}</h3>
                        <Badge variant={suite.failed === 0 ? "default" : "destructive"}>
                          {suite.passed}/{suite.total}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {suite.duration}ms
                        </span>
                        <span className="font-semibold text-foreground">
                          {suiteSuccessRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={suiteSuccessRate} 
                      indicatorClassName={suite.failed === 0 ? "bg-green-600" : "bg-red-600"}
                    />
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="text-green-600">✓ {suite.passed} passando</span>
                      {suite.failed > 0 && (
                        <span className="text-red-600">✗ {suite.failed} falhando</span>
                      )}
                      {suite.skipped > 0 && (
                        <span>○ {suite.skipped} ignorados</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Testes Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Testes Recentes</CardTitle>
            <CardDescription>
              Últimos testes executados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum teste encontrado
                </p>
              ) : (
                filteredResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {result.status === "passed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : result.status === "failed" ? (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{result.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs">
                            {result.module}
                          </Badge>
                          <span>{result.duration}ms</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        result.status === "passed"
                          ? "default"
                          : result.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {result.status === "passed"
                        ? "Passou"
                        : result.status === "failed"
                        ? "Falhou"
                        : "Ignorado"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
