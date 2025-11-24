import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, Download, Filter, Users, BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

/**
 * Página de Visualização de Resultados de Testes Psicométricos (RH)
 * Permite visualizar, comparar e exportar resultados de todos os colaboradores
 */

const DISC_COLORS = {
  D: "#ef4444", // red
  I: "#eab308", // yellow
  S: "#22c55e", // green
  C: "#3b82f6", // blue
};

const BIG_FIVE_LABELS: Record<string, string> = {
  O: "Abertura",
  C: "Conscienciosidade",
  E: "Extroversão",
  A: "Amabilidade",
  N: "Neuroticismo",
};

export default function TestesResultadosRH() {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar todos os testes (apenas RH/Admin)
  const { data: allTests, isLoading } = trpc.psychometric.getAllTests.useQuery();
  const { data: departments } = trpc.employees.getDepartments.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filtrar testes
  const filteredTests = allTests?.filter(test => {
    const matchesTest = selectedTest === "all" || test.testType === selectedTest;
    const matchesDepartment = selectedDepartment === "all" || 
      (test.employeeDepartmentId != null && test.employeeDepartmentId.toString() === selectedDepartment);
    const matchesSearch = searchQuery === "" || 
      test.employeeName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTest && matchesDepartment && matchesSearch;
  }) || [];

  // Estatísticas gerais
  const totalTests = filteredTests.length;
  const uniqueEmployees = new Set(filteredTests.map(t => t.employeeId)).size;
  const testsByType = filteredTests.reduce((acc, test) => {
    const type = test.testType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Dados para gráfico de distribuição
  const distributionData = Object.entries(testsByType).map(([type, count]) => ({
    name: type.toUpperCase(),
    value: count,
  }));

  // Exportar relatório
  const handleExport = () => {
    const csv = [
      ["Colaborador", "Departamento", "Tipo de Teste", "Data", "Perfil DISC"].join(","),
      ...filteredTests.map(test => [
        test.employeeName || "",
        test.employeeDepartmentName || "",
        test.testType.toUpperCase(),
        new Date(test.completedAt || "").toLocaleDateString("pt-BR"),
        test.discProfile || "",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resultados-testes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-8 w-8" />
              Resultados de Testes Psicométricos
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize e compare os resultados de todos os colaboradores
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-xs text-muted-foreground">
                Testes realizados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores Avaliados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Colaboradores únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Teste</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(testsByType).length}</div>
              <p className="text-xs text-muted-foreground">
                Diferentes avaliações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Colaborador</label>
                <Input
                  placeholder="Nome do colaborador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Teste</label>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Testes</SelectItem>
                    <SelectItem value="disc">DISC</SelectItem>
                    <SelectItem value="bigfive">Big Five</SelectItem>
                    <SelectItem value="mbti">MBTI</SelectItem>
                    <SelectItem value="ie">Inteligência Emocional</SelectItem>
                    <SelectItem value="vark">VARK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Departamentos</SelectItem>
                    {departments && Array.isArray(departments) && departments
                      .filter((dept: any) => dept?.id != null)
                      .map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name || 'Sem nome'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição - Desabilitado temporariamente */}

        {/* Lista de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados Individuais</CardTitle>
            <CardDescription>
              {filteredTests.length} {filteredTests.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum resultado encontrado com os filtros selecionados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTests.map(test => (
                  <Card key={test.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{test.employeeName}</h3>
                            <Badge variant="secondary">{test.testType.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {test.employeeDepartmentName || "Sem departamento"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Realizado em {test.completedAt ? new Date(test.completedAt).toLocaleDateString("pt-BR") : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          {test.discProfile && (
                            <Badge className="mb-2">
                              Perfil DISC: {test.discProfile}
                            </Badge>
                          )}
                          {test.testType === 'disc' && test.discDominance && (
                            <p className="text-sm font-medium">
                              D:{test.discDominance} I:{test.discInfluence} S:{test.discSteadiness} C:{test.discCompliance}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Visualização do perfil Big Five */}
                      {test.testType === 'bigfive' && test.bigFiveOpenness && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Abertura</p>
                              <p className="text-lg font-bold">{test.bigFiveOpenness}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Conscienciosidade</p>
                              <p className="text-lg font-bold">{test.bigFiveConscientiousness}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Extroversão</p>
                              <p className="text-lg font-bold">{test.bigFiveExtraversion}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Amabilidade</p>
                              <p className="text-lg font-bold">{test.bigFiveAgreeableness}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Neuroticismo</p>
                              <p className="text-lg font-bold">{test.bigFiveNeuroticism}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
