import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, Activity, Users, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/LoadingSkeletons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SecurityDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.audit.stats.useQuery();
  const { data: suspicious, isLoading: suspiciousLoading } =
    trpc.audit.detectSuspiciousActivity.useQuery();

  const { data: recentLogs, isLoading: logsLoading } = trpc.audit.list.useQuery({
    limit: 10,
    offset: 0,
  });

  if (statsLoading || suspiciousLoading || logsLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          <p className="text-muted-foreground">
            Monitore atividades, detecte anomalias e mantenha o sistema seguro
          </p>
        </div>

        {/* Alertas de segurança */}
        {suspicious?.hasIssues && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Atividades Suspeitas Detectadas
                </CardTitle>
              </div>
              <CardDescription className="text-yellow-800 dark:text-yellow-200">
                Foram identificadas atividades que requerem atenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suspicious.failedActions.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Múltiplas ações falhadas</span>
                  <Badge variant="destructive">{suspicious.failedActions.length} usuários</Badge>
                </div>
              )}
              {suspicious.multipleIPs.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acessos de múltiplos IPs</span>
                  <Badge variant="destructive">{suspicious.multipleIPs.length} usuários</Badge>
                </div>
              )}
              {suspicious.abnormalVolume.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Volume anormal de ações</span>
                  <Badge variant="destructive">{suspicious.abnormalVolume.length} usuários</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total24h || 0}</div>
              <p className="text-xs text-muted-foreground">Ações registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades (7 dias)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total7d || 0}</div>
              <p className="text-xs text-muted-foreground">Última semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades (30 dias)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total30d || 0}</div>
              <p className="text-xs text-muted-foreground">Último mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suspicious?.hasIssues ? (
                  <Badge variant="destructive">Atenção</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    Seguro
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {suspicious?.hasIssues ? "Requer atenção" : "Tudo normal"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com detalhes */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Atividades Recentes</TabsTrigger>
            <TabsTrigger value="top-actions">Ações Mais Comuns</TabsTrigger>
            <TabsTrigger value="top-users">Usuários Mais Ativos</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Atividades</CardTitle>
                <CardDescription>10 ações mais recentes no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs?.logs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.entityType} {log.entityId && `#${log.entityId}`}
                        </div>
                        {log.ipAddress && (
                          <div className="text-xs text-muted-foreground">IP: {log.ipAddress}</div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações Mais Comuns</CardTitle>
                <CardDescription>Top 10 ações nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topActions.map((action: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{action.action}</span>
                      </div>
                      <Badge>{action.count} vezes</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Mais Ativos</CardTitle>
                <CardDescription>Top 10 usuários nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topUsers.map((user: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Usuário #{user.userId}</span>
                        </div>
                      </div>
                      <Badge>{user.count} ações</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
