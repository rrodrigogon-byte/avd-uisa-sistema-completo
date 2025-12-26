import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Activity, Award, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

const DISC_COLORS = {
  'D - Dominante': '#ef4444',
  'I - Influente': '#eab308',
  'S - Estável': '#22c55e',
  'C - Conforme': '#3b82f6',
};

export function PsychometricDashboard() {
  const { data: stats, isLoading } = trpc.psychometric.getDashboardStats.useQuery({});
  const { data: commonProfiles } = trpc.psychometric.getMostCommonProfiles.useQuery({ limit: 4 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Preparar dados para gráficos
  const discData = safeFilter([
    { name: 'D - Dominante', value: stats.discProfiles.dominant, color: DISC_COLORS['D - Dominante'] },
    { name: 'I - Influente', value: stats.discProfiles.influential, color: DISC_COLORS['I - Influente'] },
    { name: 'S - Estável', value: stats.discProfiles.steady, color: DISC_COLORS['S - Estável'] },
    { name: 'C - Conforme', value: stats.discProfiles.conscientious, color: DISC_COLORS['C - Conforme'] },
  ], item => item.value > 0);

  const departmentData = safeMap(
    ensureArray(stats.byDepartment).slice(0, 5),
    dept => ({
      name: dept.departmentName.length > 20 ? dept.departmentName.substring(0, 20) + '...' : dept.departmentName,
      taxa: Math.round(dept.completionRate),
    })
  );

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Enviados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestsSent}</div>
            <p className="text-xs text-muted-foreground">
              Total de convites enviados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTestsCompleted} de {stats.totalTestsSent} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTests}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionTime}</div>
            <p className="text-xs text-muted-foreground">
              Dias para conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribuição de Perfis DISC */}
        <Card>
          <CardHeader>
            <CardTitle>Perfis DISC Mais Comuns</CardTitle>
            <CardDescription>
              Distribuição dos perfis comportamentais identificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {discData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={discData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.charAt(0)}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safeMap(discData, (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {safeMap(ensureArray(commonProfiles), (profile) => (
                    <div key={profile.profile} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: DISC_COLORS[profile.profile as keyof typeof DISC_COLORS] }}
                        />
                        <span className="text-sm font-medium">{profile.profile}</span>
                      </div>
                      <Badge variant="secondary">{profile.count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Nenhum teste DISC completado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Taxa de Conclusão por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conclusão por Departamento</CardTitle>
            <CardDescription>
              Top 5 departamentos com maior engajamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="taxa" fill="hsl(var(--primary))" name="Taxa (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Testes Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Testes Completados Recentemente
          </CardTitle>
          <CardDescription>
            Últimos 10 testes psicométricos finalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEmpty(stats.recentTests) ? (
            <div className="space-y-2">
              {safeMap(ensureArray(stats.recentTests), (test, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{test.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.testType.toUpperCase()} - {new Date(test.completedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{test.profile}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum teste completado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
