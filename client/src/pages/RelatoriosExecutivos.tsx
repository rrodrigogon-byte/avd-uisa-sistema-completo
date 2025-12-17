import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Download,
  BarChart3,
  PieChart,
  Target,
  Lightbulb
} from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { exportRelatorioExecutivoPDF } from "@/utils/pdfExport";
import { toast } from "sonner";

/**
 * Página de Relatórios Executivos de RH
 * Dashboard estratégico com insights organizacionais sobre perfis psicométricos
 */

const COLORS = {
  disc: {
    D: "#ef4444", // red
    I: "#eab308", // yellow
    S: "#22c55e", // green
    C: "#3b82f6", // blue
  },
  priority: {
    high: "#f97316", // orange
    medium: "#eab308", // yellow
    low: "#22c55e", // green
  }
};

export default function RelatoriosExecutivos() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

  // Buscar dados agregados
  const { data: discByDept } = trpc.psychometric.getAggregatedResults.useQuery({
    groupBy: "department",
    testType: "disc",
  });

  const { data: bigFiveByDept } = trpc.psychometric.getAggregatedResults.useQuery({
    groupBy: "department",
    testType: "bigfive",
  });

  const { data: discByPosition } = trpc.psychometric.getAggregatedResults.useQuery({
    groupBy: "position",
    testType: "disc",
  });

  // Preparar dados para gráfico de pizza - Distribuição DISC
  const prepareDISCDistribution = () => {
    if (!discByDept) return [];
    
    const totals = { D: 0, I: 0, S: 0, C: 0 };
    let count = 0;

    for (const dept of discByDept) {
      if (dept.averages?.disc) {
        totals.D += dept.averages.disc.D;
        totals.I += dept.averages.disc.I;
        totals.S += dept.averages.disc.S;
        totals.C += dept.averages.disc.C;
        count++;
      }
    }

    if (count === 0) return [];

    return [
      { name: "Dominância", value: totals.D / count, color: COLORS.disc.D },
      { name: "Influência", value: totals.I / count, color: COLORS.disc.I },
      { name: "Estabilidade", value: totals.S / count, color: COLORS.disc.S },
      { name: "Conformidade", value: totals.C / count, color: COLORS.disc.C },
    ];
  };

  // Preparar dados para gráfico de barras - Perfis por Departamento
  const prepareProfilesByDepartment = () => {
    if (!discByDept) return [];

    return discByDept.map(dept => {
      const disc = dept.averages?.disc;
      if (!disc) return null;

      const dominant = Math.max(disc.D, disc.I, disc.S, disc.C);
      const profile = 
        dominant === disc.D ? "D" :
        dominant === disc.I ? "I" :
        dominant === disc.S ? "S" : "C";

      return {
        name: dept.groupName.length > 15 ? dept.groupName.substring(0, 15) + "..." : dept.groupName,
        fullName: dept.groupName,
        profile,
        D: disc.D,
        I: disc.I,
        S: disc.S,
        C: disc.C,
        count: dept.count,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // Gerar insights automáticos
  const generateInsights = () => {
    const insights = [];

    // Insight 1: Perfil DISC predominante
    const discDist = prepareDISCDistribution();
    if (discDist.length > 0) {
      const dominant = discDist.reduce((max, item) => item.value > max.value ? item : max);
      insights.push({
        type: "profile",
        title: "Perfil Organizacional Predominante",
        description: `A organização possui perfil predominante de ${dominant.name} (${dominant.value.toFixed(1)} pontos em média)`,
        recommendation: dominant.name === "Dominância" 
          ? "Organização orientada a resultados. Recomenda-se desenvolver empatia e colaboração."
          : dominant.name === "Influência"
          ? "Organização comunicativa e engajada. Recomenda-se estruturar processos e foco."
          : dominant.name === "Estabilidade"
          ? "Organização colaborativa e estável. Recomenda-se desenvolver adaptabilidade e inovação."
          : "Organização analítica e detalhista. Recomenda-se desenvolver agilidade e comunicação.",
        priority: "high" as const,
      });
    }

    // Insight 2: Departamentos com perfis extremos
    const deptProfiles = prepareProfilesByDepartment();
    if (deptProfiles.length > 0) {
      const highD = deptProfiles.filter(d => d.profile === "D");
      const highS = deptProfiles.filter(d => d.profile === "S");

      if (highD.length > 0 && highS.length > 0) {
        insights.push({
          type: "diversity",
          title: "Diversidade de Perfis por Departamento",
          description: `${highD.length} departamento(s) com perfil D (orientado a resultados) e ${highS.length} com perfil S (orientado a pessoas)`,
          recommendation: "Considere criar equipes multidisciplinares combinando perfis D e S para equilibrar foco em resultados e colaboração.",
          priority: "medium" as const,
        });
      }
    }

    // Insight 3: Cobertura de testes
    const totalDepts = discByDept?.length || 0;
    const deptsWithTests = discByDept?.filter(d => d.count > 0).length || 0;
    const coverage = totalDepts > 0 ? (deptsWithTests / totalDepts) * 100 : 0;

    if (coverage < 50) {
      insights.push({
        type: "coverage",
        title: "Baixa Cobertura de Testes Psicométricos",
        description: `Apenas ${coverage.toFixed(0)}% dos departamentos possuem colaboradores com testes realizados`,
        recommendation: "Recomenda-se expandir a aplicação de testes psicométricos para obter insights mais abrangentes.",
        priority: "high" as const,
      });
    } else if (coverage < 80) {
      insights.push({
        type: "coverage",
        title: "Cobertura Moderada de Testes",
        description: `${coverage.toFixed(0)}% dos departamentos possuem colaboradores com testes realizados`,
        recommendation: "Continue expandindo a aplicação de testes para alcançar cobertura completa.",
        priority: "medium" as const,
      });
    } else {
      insights.push({
        type: "coverage",
        title: "Excelente Cobertura de Testes",
        description: `${coverage.toFixed(0)}% dos departamentos possuem colaboradores com testes realizados`,
        recommendation: "Mantenha a cultura de avaliação contínua e utilize os dados para decisões estratégicas.",
        priority: "low" as const,
      });
    }

    // Insight 4: Sugestões de formação de equipes
    if (deptProfiles.length >= 2) {
      const complementary = [];
      for (let i = 0; i < deptProfiles.length; i++) {
        for (let j = i + 1; j < deptProfiles.length; j++) {
          const dept1 = deptProfiles[i];
          const dept2 = deptProfiles[j];
          
          // Perfis complementares: D+S, I+C
          if ((dept1.profile === "D" && dept2.profile === "S") ||
              (dept1.profile === "S" && dept2.profile === "D") ||
              (dept1.profile === "I" && dept2.profile === "C") ||
              (dept1.profile === "C" && dept2.profile === "I")) {
            complementary.push({ dept1: dept1.fullName, dept2: dept2.fullName });
          }
        }
      }

      if (complementary.length > 0) {
        const example = complementary[0];
        insights.push({
          type: "teams",
          title: "Oportunidades de Equipes Complementares",
          description: `Identificadas ${complementary.length} combinação(ões) de departamentos com perfis complementares`,
          recommendation: `Exemplo: Criar projetos colaborativos entre ${example.dept1} e ${example.dept2} para equilibrar competências.`,
          priority: "medium" as const,
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();
  const discDistribution = prepareDISCDistribution();
  const profilesByDept = prepareProfilesByDepartment();

  // Handler para exportar PDF
  const handleExportPDF = () => {
    try {
      exportRelatorioExecutivoPDF({
        discDistribution,
        profilesByDept,
        totalDepartments: discByDept?.length || 0,
        totalTests: discByDept?.reduce((sum, d) => sum + d.count, 0) || 0,
        totalPositions: discByPosition?.length || 0,
        coverage: discByDept && discByDept.length > 0
          ? (discByDept.filter(d => d.count > 0).length / discByDept.length) * 100
          : 0,
        insights,
      });
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório. Tente novamente.");
    }
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar relatórios executivos</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Relatórios Executivos de RH
            </h1>
            <p className="text-muted-foreground mt-2">
              Insights estratégicos sobre perfis psicométricos organizacionais
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="insights">Insights Estratégicos</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Distribuição DISC Organizacional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição DISC Organizacional
                  </CardTitle>
                  <CardDescription>Perfil médio de todos os departamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  {discDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={discDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {discDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => value.toFixed(1)} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      Dados insuficientes
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Perfis por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Perfis Predominantes por Departamento
                  </CardTitle>
                  <CardDescription>Perfil DISC dominante em cada área</CardDescription>
                </CardHeader>
                <CardContent>
                  {profilesByDept.length > 0 ? (
                    <div className="space-y-3">
                      {profilesByDept.slice(0, 5).map((dept: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{dept.name}</div>
                            <div className="text-xs text-muted-foreground">{dept.count} teste(s)</div>
                          </div>
                          <Badge
                            style={{
                              backgroundColor: COLORS.disc[dept.profile as keyof typeof COLORS.disc],
                              color: "white"
                            }}
                          >
                            Perfil {dept.profile}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      Dados insuficientes
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{discByDept?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Departamentos Analisados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {discByDept?.reduce((sum, d) => sum + d.count, 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Testes Realizados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{discByPosition?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Cargos Mapeados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {discByDept && discByDept.length > 0
                      ? ((discByDept.filter(d => d.count > 0).length / discByDept.length) * 100).toFixed(0)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Cobertura de Testes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Estratégicos */}
          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight: any, index: number) => (
              <Card key={index} className={
                insight.priority === "high" ? "border-orange-200 bg-orange-50" :
                insight.priority === "medium" ? "border-yellow-200 bg-yellow-50" :
                "border-green-200 bg-green-50"
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {insight.type === "profile" && <Users className="h-5 w-5" />}
                        {insight.type === "diversity" && <TrendingUp className="h-5 w-5" />}
                        {insight.type === "coverage" && <Target className="h-5 w-5" />}
                        {insight.type === "teams" && <Lightbulb className="h-5 w-5" />}
                        {insight.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{insight.description}</CardDescription>
                    </div>
                    <Badge
                      variant={insight.priority === "high" ? "default" : "secondary"}
                      className={insight.priority === "high" ? "bg-orange-500" : ""}
                    >
                      {insight.priority === "high" ? "Alta" : insight.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recomendação:</p>
                      <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Recomendações */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardHeader>
                <CardTitle>Ações Estratégicas Recomendadas</CardTitle>
                <CardDescription>Próximos passos para otimização organizacional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">1. Expandir Cobertura de Testes</h4>
                    <p className="text-sm text-gray-600">
                      Priorizar departamentos sem dados psicométricos para obter visão completa da organização.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">2. Criar Equipes Multidisciplinares</h4>
                    <p className="text-sm text-gray-600">
                      Formar projetos com perfis complementares (D+S, I+C) para maximizar sinergia.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">3. Programas de Desenvolvimento Direcionados</h4>
                    <p className="text-sm text-gray-600">
                      Criar trilhas de capacitação baseadas nos gaps identificados por departamento.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">4. Monitoramento Contínuo</h4>
                    <p className="text-sm text-gray-600">
                      Reaplicar testes anualmente para acompanhar evolução dos perfis e eficácia das ações.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">5. Integração com Sucessão e Recrutamento</h4>
                    <p className="text-sm text-gray-600">
                      Utilizar perfis psicométricos para identificar sucessores e definir perfis ideais para vagas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
