import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Brain, TrendingUp, AlertCircle, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type TestType = "disc" | "bigfive" | "mbti" | "ie";

export default function TeamProfiles() {
  const { user } = useAuth();
  const { data: employee } = trpc.employees.getCurrent.useQuery();
  const [activeTab, setActiveTab] = useState<TestType>("disc");

  const { data: teamData, isLoading } = trpc.pdiIntelligent.getTeamPsychometricProfiles.useQuery(
    { 
      managerId: employee?.employee.id || 0,
      testType: activeTab
    },
    { enabled: !!employee?.employee.id }
  );

  const getTestName = (testType: TestType): string => {
    const names: Record<TestType, string> = {
      disc: "DISC",
      bigfive: "Big Five",
      mbti: "MBTI",
      ie: "Inteligência Emocional",
    };
    return names[testType];
  };

  const getProfileColor = (profileType: string, testType: TestType): string => {
    if (testType === "disc") {
      const type = profileType.toUpperCase();
      if (type.includes("D")) return "bg-red-500";
      if (type.includes("I")) return "bg-yellow-500";
      if (type.includes("S")) return "bg-green-500";
      if (type.includes("C")) return "bg-blue-500";
    } else if (testType === "mbti") {
      // Cores por temperamento MBTI
      if (profileType.startsWith("E")) return "bg-orange-500";
      if (profileType.startsWith("I")) return "bg-blue-500";
    } else if (testType === "ie") {
      // Cores por faixa de score
      if (profileType.includes("Alto")) return "bg-green-500";
      if (profileType.includes("Médio")) return "bg-yellow-500";
      return "bg-red-500";
    }
    return "bg-gray-500";
  };

  const getProfileDescription = (profileType: string, testType: TestType): string => {
    if (testType === "disc") {
      const descriptions: Record<string, string> = {
        D: "Dominância - Direto, orientado a resultados, decisivo",
        I: "Influência - Comunicativo, entusiasta, persuasivo",
        S: "Estabilidade - Paciente, confiável, colaborativo",
        C: "Conformidade - Analítico, preciso, sistemático",
      };
      const type = profileType.toUpperCase();
      for (const [key, desc] of Object.entries(descriptions)) {
        if (type.includes(key)) return desc;
      }
      return "Perfil misto";
    } else if (testType === "mbti") {
      return `Tipo de personalidade ${profileType}`;
    } else if (testType === "bigfive") {
      return `Traço dominante: ${profileType}`;
    } else if (testType === "ie") {
      return `Nível de inteligência emocional: ${profileType}`;
    }
    return profileType;
  };

  const analyzeTeamComposition = () => {
    if (!teamData) return null;

    const { profileDistribution, totalMembers, membersWithProfiles, testType } = teamData;
    const insights: string[] = [];

    const uniqueProfiles = Object.keys(profileDistribution).length;
    if (uniqueProfiles >= 3) {
      insights.push(`✅ Equipe diversificada com múltiplos perfis ${getTestName(testType)}`);
    } else if (uniqueProfiles === 2) {
      insights.push("⚠️ Equipe com diversidade moderada de perfis");
    } else {
      insights.push("⚠️ Equipe com baixa diversidade de perfis - considere ampliar");
    }

    const sortedProfiles = Object.entries(profileDistribution)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedProfiles.length > 0) {
      const [dominantProfile, count] = sortedProfiles[0];
      const percentage = ((count / membersWithProfiles) * 100).toFixed(0);
      insights.push(`📊 Perfil dominante: ${dominantProfile} (${percentage}% da equipe)`);
    }

    // Análises específicas por tipo de teste
    if (testType === "disc") {
      const hasD = Object.keys(profileDistribution).some(p => p.includes("D"));
      const hasI = Object.keys(profileDistribution).some(p => p.includes("I"));
      const hasS = Object.keys(profileDistribution).some(p => p.includes("S"));
      const hasC = Object.keys(profileDistribution).some(p => p.includes("C"));

      const gaps: string[] = [];
      if (!hasD) gaps.push("D (Dominância)");
      if (!hasI) gaps.push("I (Influência)");
      if (!hasS) gaps.push("S (Estabilidade)");
      if (!hasC) gaps.push("C (Conformidade)");

      if (gaps.length > 0) {
        insights.push(`🎯 Gaps identificados: ${gaps.join(", ")}`);
      } else {
        insights.push("✅ Equipe balanceada com todos os perfis DISC representados");
      }

      if (hasD && hasS) {
        insights.push("💡 Boa complementaridade entre perfis orientados a resultados (D) e estabilidade (S)");
      }
      if (hasI && hasC) {
        insights.push("💡 Boa complementaridade entre perfis comunicativos (I) e analíticos (C)");
      }
    } else if (testType === "mbti") {
      const hasE = Object.keys(profileDistribution).some(p => p.startsWith("E"));
      const hasI = Object.keys(profileDistribution).some(p => p.startsWith("I"));
      
      if (hasE && hasI) {
        insights.push("💡 Boa diversidade entre extrovertidos e introvertidos");
      } else if (hasE) {
        insights.push("⚠️ Equipe predominantemente extrovertida - considere balancear");
      } else if (hasI) {
        insights.push("⚠️ Equipe predominantemente introvertida - considere balancear");
      }
    } else if (testType === "ie") {
      const hasHigh = Object.keys(profileDistribution).some(p => p.includes("Alto"));
      const hasLow = Object.keys(profileDistribution).some(p => p.includes("Baixo"));
      
      if (hasHigh) {
        insights.push("✅ Equipe com membros de alta inteligência emocional");
      }
      if (hasLow) {
        insights.push("⚠️ Alguns membros podem se beneficiar de treinamento em inteligência emocional");
      }
    }

    return insights;
  };

  const handleExportPDF = () => {
    toast.info("Exportação de PDF em desenvolvimento");
  };

  const handleExportExcel = () => {
    toast.info("Exportação de Excel em desenvolvimento");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!teamData || teamData.totalMembers === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8" />
                Perfis da Equipe
              </h1>
              <p className="text-muted-foreground mt-2">
                Análise de composição e complementaridade de perfis psicométricos
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum membro de equipe encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui funcionários subordinados ou eles não completaram testes psicométricos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const insights = analyzeTeamComposition();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Perfis da Equipe
            </h1>
            <p className="text-muted-foreground mt-2">
              Análise de composição e complementaridade de perfis psicométricos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TestType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="disc">DISC</TabsTrigger>
            <TabsTrigger value="bigfive">Big Five</TabsTrigger>
            <TabsTrigger value="mbti">MBTI</TabsTrigger>
            <TabsTrigger value="ie">Inteligência Emocional</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Membros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamData.totalMembers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Com Perfil {getTestName(activeTab)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamData.membersWithProfiles}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {((teamData.membersWithProfiles / teamData.totalMembers) * 100).toFixed(0)}% da equipe
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Perfis Únicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Object.keys(teamData.profileDistribution).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Distribuição de Perfis {getTestName(activeTab)}
                </CardTitle>
                <CardDescription>
                  Visualização da composição de perfis na equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(teamData.profileDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([profile, count]) => {
                      const percentage = ((count / teamData.membersWithProfiles) * 100).toFixed(1);
                      return (
                        <div key={profile} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getProfileColor(profile, activeTab)}`} />
                              <span className="font-medium">{profile}</span>
                              <span className="text-sm text-muted-foreground">
                                {getProfileDescription(profile, activeTab)}
                              </span>
                            </div>
                            <Badge variant="secondary">
                              {count} ({percentage}%)
                            </Badge>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProfileColor(profile, activeTab)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {insights && insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análise e Recomendações
                  </CardTitle>
                  <CardDescription>
                    Insights sobre a composição da equipe e oportunidades de desenvolvimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1">
                          <p className="text-sm">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>
                  Detalhamento individual dos perfis {getTestName(activeTab)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamData.teamMembers.map((member) => {
                    const profileKey = member.profile 
                      ? (activeTab === "disc" || activeTab === "mbti" 
                          ? member.profile.type 
                          : activeTab === "ie" 
                            ? `Score: ${member.profile.totalScore}` 
                            : "Perfil completo")
                      : null;
                    
                    return (
                      <div
                        key={member.employeeId}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{member.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{member.position}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {member.profile ? (
                            <>
                              <Badge
                                variant="secondary"
                                className="gap-2"
                              >
                                <div className={`w-2 h-2 rounded-full ${getProfileColor(profileKey || "N/A", activeTab)}`} />
                                {profileKey}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(member.profile.completedAt).toLocaleDateString("pt-BR")}
                              </span>
                            </>
                          ) : (
                            <Badge variant="outline">Sem perfil {getTestName(activeTab)}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
