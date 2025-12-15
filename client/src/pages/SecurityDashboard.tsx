import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, Activity, Clock, RefreshCw, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function SecurityDashboard() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activityType, setActivityType] = useState<string>("all");

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.audit.getStats.useQuery();
  const { data: suspicious, refetch: refetchSuspicious } = trpc.audit.getSuspiciousActivities.useQuery();
  const { data: logs, refetch: refetchLogs } = trpc.audit.getLogs.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    action: activityType === "all" ? undefined : activityType,
    limit: 100,
    offset: 0,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchSuspicious();
    refetchLogs();
    toast.success("Dados atualizados");
  };

  const handleExport = () => {
    toast.info("Exportação em desenvolvimento");
  };

  // Preparar dados para gráficos
  const activityChartData = stats?.topActions.map((action: any) => ({
    name: action.action,
    total: action.count,
  })) || [];

  const userActivityData = stats?.topUsers.map((user: any) => ({
    userId: user.userId,
    atividades: user.count,
  })) || [];

  const getSeverityBadge = (type: string) => {
    if (type.includes("failed") || type.includes("error")) {
      return <Badge variant="destructive">Alta</Badge>;
    }
    if (type.includes("login") || type.includes("update")) {
      return <Badge variant="default">Média</Badge>;
    }
    return <Badge variant="secondary">Baixa</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Dashboard de Segurança
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore atividades suspeitas e logs de auditoria do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total24h || 0}</div>
              <p className="text-xs text-muted-foreground">atividades registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 7 dias</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total7d || 0}</div>
              <p className="text-xs text-muted-foreground">atividades registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 30 dias</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total30d || 0}</div>
              <p className="text-xs text-muted-foreground">atividades registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Suspeitas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {(suspicious?.failedActions.length || 0) +
                  (suspicious?.multipleIPs.length || 0) +
                  (suspicious?.highVolume.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">últimas 24 horas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Mais Comuns</CardTitle>
              <CardDescription>Top 10 atividades dos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários Mais Ativos</CardTitle>
              <CardDescription>Top 10 usuários dos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userId" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="atividades" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Suspeitas */}
        {suspicious && (suspicious.failedActions.length > 0 || suspicious.multipleIPs.length > 0 || suspicious.highVolume.length > 0) && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Atividades Suspeitas Detectadas
              </CardTitle>
              <CardDescription>
                Atividades que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suspicious.failedActions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Múltiplas Tentativas Falhadas</h4>
                  <div className="space-y-2">
                    {suspicious.failedActions.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                        <span className="text-sm">
                          Usuário ID: {item.userId} - Ação: {item.action}
                        </span>
                        <Badge variant="destructive">{item.count} tentativas</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suspicious.highVolume.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Volume Anormal de Atividades</h4>
                  <div className="space-y-2">
                    {suspicious.highVolume.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
                        <span className="text-sm">Usuário ID: {item.userId}</span>
                        <Badge variant="outline">{item.count} atividades</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityType">Tipo de Atividade</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger id="activityType">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="create">Criar</SelectItem>
                    <SelectItem value="update">Atualizar</SelectItem>
                    <SelectItem value="delete">Deletar</SelectItem>
                    <SelectItem value="failed">Falhas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Atividades</CardTitle>
            <CardDescription>
              Histórico detalhado de atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.logs.length > 0 ? (
                  logs.logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell className="font-medium">{log.activityType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.activityType)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum log encontrado para o período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
