import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Award,
  AlertTriangle,
  Calculator,
  Loader2,
  Trophy,
  Medal,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

const positionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  top_10: { label: "Top 10%", color: "bg-yellow-100 text-yellow-800", icon: <Trophy className="h-4 w-4" /> },
  top_25: { label: "Top 25%", color: "bg-green-100 text-green-800", icon: <Medal className="h-4 w-4" /> },
  acima_media: { label: "Acima da Média", color: "bg-blue-100 text-blue-800", icon: <ArrowUp className="h-4 w-4" /> },
  abaixo_media: { label: "Abaixo da Média", color: "bg-orange-100 text-orange-800", icon: <ArrowDown className="h-4 w-4" /> },
  bottom_25: { label: "Bottom 25%", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> },
};

export default function BenchmarkDesempenho() {
  const [activeTab, setActiveTab] = useState("benchmarks");
  const [scope, setScope] = useState<string>("organizacao");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Queries
  const { data: departments } = trpc.departments.list.useQuery({});
  const { data: positions } = trpc.positions.list.useQuery({ activeOnly: true });
  const { data: employees } = trpc.employees.list.useQuery({ activeOnly: true, limit: 500 });
  
  const { data: benchmarks, isLoading: loadingBenchmarks, refetch: refetchBenchmarks } = 
    trpc.performanceBenchmark.list.useQuery({
      scope: scope as any,
      departmentId: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
      positionId: selectedPositionId ? parseInt(selectedPositionId) : undefined,
    });

  const { data: latestBenchmark } = trpc.performanceBenchmark.getLatest.useQuery({
    scope: scope as any,
    departmentId: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
    positionId: selectedPositionId ? parseInt(selectedPositionId) : undefined,
  });

  const { data: ranking, isLoading: loadingRanking } = trpc.performanceBenchmark.getRanking.useQuery({
    scope: scope as any,
    departmentId: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
    positionId: selectedPositionId ? parseInt(selectedPositionId) : undefined,
    limit: 20,
  });

  const { data: employeeComparison, isLoading: loadingComparison } = 
    trpc.performanceBenchmark.compareEmployee.useQuery(
      { employeeId: parseInt(selectedEmployeeId) },
      { enabled: !!selectedEmployeeId }
    );

  const { data: alerts, isLoading: loadingAlerts } = trpc.performanceBenchmark.getAlerts.useQuery({
    status: "aberto",
    limit: 20,
  });

  // Mutations
  const calculateMutation = trpc.performanceBenchmark.calculate.useMutation({
    onSuccess: () => {
      toast.success("Benchmark calculado com sucesso!");
      refetchBenchmarks();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const handleCalculate = () => {
    calculateMutation.mutate({
      scope: scope as any,
      departmentId: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
      positionId: selectedPositionId ? parseInt(selectedPositionId) : undefined,
      periodStart,
      periodEnd,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Benchmark de Desempenho</h1>
            <p className="text-muted-foreground">
              Compare o desempenho de colaboradores com benchmarks organizacionais
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="comparacao">Comparação Individual</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
          </TabsList>

          {/* Tab: Benchmarks */}
          <TabsContent value="benchmarks" className="space-y-6">
            {/* Filtros e Cálculo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calcular Benchmark
                </CardTitle>
                <CardDescription>
                  Selecione o escopo e período para calcular o benchmark
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Escopo</Label>
                    <Select value={scope} onValueChange={setScope}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organizacao">Organização</SelectItem>
                        <SelectItem value="departamento">Departamento</SelectItem>
                        <SelectItem value="cargo">Cargo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {scope === "departamento" && (
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {scope === "cargo" && (
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {positions?.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id.toString()}>
                              {pos.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Período Início</Label>
                    <Input 
                      type="date" 
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Período Fim</Label>
                    <Input 
                      type="date" 
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleCalculate} disabled={calculateMutation.isPending}>
                      {calculateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Calcular
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Atual */}
            {latestBenchmark && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-blue-100 p-3">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Score Médio</p>
                        <p className="text-2xl font-bold">{latestBenchmark.avgOverallScore || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-green-100 p-3">
                        <Target className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conclusão Metas</p>
                        <p className="text-2xl font-bold">{latestBenchmark.avgGoalCompletion || "-"}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-purple-100 p-3">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avaliados</p>
                        <p className="text-2xl font-bold">
                          {latestBenchmark.evaluatedEmployees}/{latestBenchmark.totalEmployees}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-yellow-100 p-3">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Excepcionais</p>
                        <p className="text-2xl font-bold">{latestBenchmark.excepcional || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Percentis */}
            {latestBenchmark && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Percentis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">P25</p>
                        <p className="text-2xl font-bold">{latestBenchmark.p25Score || "-"}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">P50 (Mediana)</p>
                        <p className="text-2xl font-bold">{latestBenchmark.p50Score || "-"}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">P75</p>
                        <p className="text-2xl font-bold">{latestBenchmark.p75Score || "-"}</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">P90</p>
                        <p className="text-2xl font-bold">{latestBenchmark.p90Score || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Abaixo Expectativas</p>
                        <p className="text-xl font-bold text-red-600">{latestBenchmark.abaixoExpectativas || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Atende Expectativas</p>
                        <p className="text-xl font-bold text-blue-600">{latestBenchmark.atendeExpectativas || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Supera Expectativas</p>
                        <p className="text-xl font-bold text-green-600">{latestBenchmark.superaExpectativas || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Excepcional</p>
                        <p className="text-xl font-bold text-yellow-600">{latestBenchmark.excepcional || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Ranking */}
          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking de Desempenho
                </CardTitle>
                <CardDescription>
                  Top colaboradores por score de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRanking ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : ranking?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado de ranking disponível
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ranking?.map((item) => (
                      <div 
                        key={item.employeeId}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          item.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          item.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          item.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {item.rank}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium">{item.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            Competências: {item.competencyScore}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold">{item.finalScore}</p>
                          {item.classification && (
                            <Badge variant="secondary" className="text-xs">
                              {item.classification.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Comparação Individual */}
          <TabsContent value="comparacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparar Colaborador</CardTitle>
                <CardDescription>
                  Compare o desempenho de um colaborador com os benchmarks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-md">
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {loadingComparison && selectedEmployeeId && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {employeeComparison && (
                  <div className="space-y-6 pt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">{employeeComparison.employee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {employeeComparison.employee.positionTitle} - {employeeComparison.employee.departmentName}
                      </p>
                    </div>
                    
                    {employeeComparison.evaluation && (
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground">Score Final</p>
                            <p className="text-3xl font-bold">{employeeComparison.evaluation.finalScore}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground">Competências</p>
                            <p className="text-3xl font-bold">{employeeComparison.evaluation.competencyScore}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground">Classificação</p>
                            <Badge className="text-lg">
                              {employeeComparison.evaluation.classification?.replace(/_/g, ' ')}
                            </Badge>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.entries(employeeComparison.comparison).map(([key, value]) => {
                        const label = key === "vsOrganizacao" ? "vs Organização" :
                                     key === "vsDepartamento" ? "vs Departamento" : "vs Cargo";
                        const position = value ? positionLabels[value] : null;
                        
                        return (
                          <Card key={key}>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-2">{label}</p>
                              {position ? (
                                <Badge className={position.color}>
                                  {position.icon}
                                  <span className="ml-1">{position.label}</span>
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">Sem dados</span>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Alertas */}
          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Desempenho
                </CardTitle>
                <CardDescription>
                  Colaboradores que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : alerts?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum alerta em aberto
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts?.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                          alert.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                          'border-l-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.employeeName}</p>
                            {alert.description && (
                              <p className="text-sm mt-1">{alert.description}</p>
                            )}
                          </div>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'warning' ? 'default' : 'secondary'
                          }>
                            {alert.severity}
                          </Badge>
                        </div>
                        {(alert.expectedValue || alert.actualValue) && (
                          <div className="mt-2 text-sm">
                            Esperado: {alert.expectedValue} | Atual: {alert.actualValue}
                            {alert.gapValue && ` | Gap: ${alert.gapValue}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
