import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, Building2, Briefcase } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";

/**
 * Dashboard Comparativo de Testes Psicométricos
 * Visualiza resultados agregados por departamento, cargo ou equipe
 */

const TEST_OPTIONS = [
  { value: "disc", label: "DISC - Comportamental" },
  { value: "bigfive", label: "Big Five - Personalidade" },
  { value: "mbti", label: "MBTI - Tipo de Personalidade" },
  { value: "ie", label: "Inteligência Emocional" },
  { value: "vark", label: "Estilos de Aprendizagem" },
  { value: "leadership", label: "Estilos de Liderança" },
  { value: "careeranchors", label: "Âncoras de Carreira" },
];

const GROUP_OPTIONS = [
  { value: "department", label: "Departamento", icon: Building2 },
  { value: "position", label: "Cargo", icon: Briefcase },
  { value: "team", label: "Equipe (Gestor)", icon: Users },
];

export default function DashboardComparativoTestes() {
  const { user } = useAuth();
  const [groupBy, setGroupBy] = useState<"department" | "position" | "team">("department");
  const [testType, setTestType] = useState<string>("disc");

  // Buscar resultados agregados
  const { data: aggregatedData, isLoading } = trpc.psychometric.getAggregatedResults.useQuery({
    groupBy,
    testType: testType as any,
  });

  // Preparar dados para gráfico radar DISC
  const prepareDiscRadarData = (group: any) => {
    if (!group.averages?.disc) return [];
    return [
      { dimension: "Dominância", value: group.averages.disc.D },
      { dimension: "Influência", value: group.averages.disc.I },
      { dimension: "Estabilidade", value: group.averages.disc.S },
      { dimension: "Conformidade", value: group.averages.disc.C },
    ];
  };

  // Preparar dados para gráfico radar Big Five
  const prepareBigFiveRadarData = (group: any) => {
    if (!group.averages?.bigfive) return [];
    return [
      { dimension: "Abertura", value: group.averages.bigfive.O * 100 },
      { dimension: "Conscienciosidade", value: group.averages.bigfive.C * 100 },
      { dimension: "Extroversão", value: group.averages.bigfive.E * 100 },
      { dimension: "Amabilidade", value: group.averages.bigfive.A * 100 },
      { dimension: "Neuroticismo", value: group.averages.bigfive.N * 100 },
    ];
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar este dashboard</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Dashboard Comparativo de Testes
          </h1>
          <p className="text-muted-foreground mt-2">
            Análise comparativa de perfis psicométricos por grupo
          </p>
        </div>

        {/* Filtros */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle>Filtros de Análise</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agrupar Por</label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map(option => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Teste</label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !aggregatedData || aggregatedData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para os filtros selecionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {aggregatedData.map((group: any) => {
              const radarData = testType === "disc" 
                ? prepareDiscRadarData(group)
                : testType === "bigfive"
                ? prepareBigFiveRadarData(group)
                : [];

              return (
                <Card key={group.groupKey} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{group.groupName}</CardTitle>
                      <Badge variant="secondary">
                        {group.count} teste{group.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <CardDescription>
                      Perfil médio do grupo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {radarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis 
                            dataKey="dimension" 
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                          />
                          <Radar
                            name={group.groupName}
                            dataKey="value"
                            stroke="#F39200"
                            fill="#F39200"
                            fillOpacity={0.6}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any) => [value.toFixed(1), 'Pontuação']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        Gráfico não disponível para este tipo de teste
                      </div>
                    )}

                    {/* Detalhes numéricos */}
                    {testType === "disc" && group.averages?.disc && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <div className="text-xs text-red-600 font-medium">Dominância</div>
                          <div className="text-2xl font-bold text-red-700">
                            {group.averages.disc.D.toFixed(1)}
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="text-xs text-yellow-600 font-medium">Influência</div>
                          <div className="text-2xl font-bold text-yellow-700">
                            {group.averages.disc.I.toFixed(1)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-green-600 font-medium">Estabilidade</div>
                          <div className="text-2xl font-bold text-green-700">
                            {group.averages.disc.S.toFixed(1)}
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-medium">Conformidade</div>
                          <div className="text-2xl font-bold text-blue-700">
                            {group.averages.disc.C.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    )}

                    {testType === "bigfive" && group.averages?.bigfive && (
                      <div className="mt-4 space-y-2">
                        {[
                          { key: 'O', label: 'Abertura', color: 'purple' },
                          { key: 'C', label: 'Conscienciosidade', color: 'blue' },
                          { key: 'E', label: 'Extroversão', color: 'orange' },
                          { key: 'A', label: 'Amabilidade', color: 'green' },
                          { key: 'N', label: 'Neuroticismo', color: 'red' },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{label}</span>
                            <span className={`text-${color}-600 font-bold`}>
                              {(group.averages.bigfive[key] * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Insights */}
        {aggregatedData && aggregatedData.length > 0 && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 Insights Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <strong>Total de grupos analisados:</strong> {aggregatedData.length}
              </p>
              <p className="text-sm">
                <strong>Total de testes:</strong>{' '}
                {aggregatedData.reduce((sum: number, g: any) => sum + g.count, 0)}
              </p>
              {testType === "disc" && aggregatedData.some((g: any) => g.averages?.disc) && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Perfil DISC predominante por grupo:</p>
                  <div className="space-y-1">
                    {aggregatedData.map((group: any) => {
                      if (!group.averages?.disc) return null;
                      const disc = group.averages.disc;
                      const max = Math.max(disc.D, disc.I, disc.S, disc.C);
                      const dominant = 
                        max === disc.D ? "Dominância" :
                        max === disc.I ? "Influência" :
                        max === disc.S ? "Estabilidade" : "Conformidade";
                      return (
                        <p key={group.groupKey} className="text-sm">
                          • <strong>{group.groupName}:</strong> {dominant}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
