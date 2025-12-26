import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, Bell, Smartphone, Monitor, Tablet, TrendingUp, Clock, Users, Filter, X } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard de Analytics de Notificações Push
 * Exibe métricas de engajamento, taxa de abertura, horários de pico e histórico
 */
export default function NotificacoesAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate: new Date(),
  });

  // Filtros avançados
  const [filters, setFilters] = useState({
    type: "",
    status: "" as "" | "enviada" | "aberta" | "erro",
    searchTerm: "",
    customStartDate: "",
    customEndDate: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: metrics, isLoading: loadingMetrics } = trpc.pushNotifications.getNotificationMetrics.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: hourlyEngagement, isLoading: loadingHourly } =
    trpc.pushNotifications.getEngagementByHour.useQuery({});

  // Usar endpoint real de logs
  const { data: realLogs, isLoading: loadingHistory } = trpc.pushNotifications.getRealLogs.useQuery({
    limit: 50,
    offset: 0,
    type: filters.type || undefined,
    status: filters.status || undefined,
    startDate: filters.customStartDate ? new Date(filters.customStartDate) : undefined,
    endDate: filters.customEndDate ? new Date(filters.customEndDate) : undefined,
  });

  // Filtrar por termo de busca no frontend
  const filteredLogs = useMemo(() => {
    if (!realLogs) return [];
    if (!filters.searchTerm) return realLogs;

    const term = filters.searchTerm.toLowerCase();
    return realLogs.filter(
      (log: any) =>
        log.userName?.toLowerCase().includes(term) ||
        log.userEmail?.toLowerCase().includes(term) ||
        log.title?.toLowerCase().includes(term) ||
        log.message?.toLowerCase().includes(term)
    );
  }, [realLogs, filters.searchTerm]);

  const handleClearFilters = () => {
    setFilters({
      type: "",
      status: "",
      searchTerm: "",
      customStartDate: "",
      customEndDate: "",
    });
  };

  if (loadingMetrics || loadingHourly || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Notificações Push</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe métricas de engajamento e efetividade das notificações
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalActive || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.summary.totalCreated || 0} novas nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção (7 dias)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.retentionRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assinaturas ainda ativas após 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notificações Enviadas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimas 50 notificações</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Dispositivo</CardTitle>
          <CardDescription>Assinaturas ativas por plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics?.deviceDistribution.map((device: any) => {
              const Icon = deviceIcons[device.deviceType as keyof typeof deviceIcons] || Monitor;
              return (
                <div key={device.deviceType} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Icon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium capitalize">{device.deviceType}</p>
                    <p className="text-2xl font-bold">{device.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Horários de Maior Engajamento */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Maior Engajamento</CardTitle>
          <CardDescription>Atividade por hora do dia (últimas interações)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hourlyEngagement?.slice().sort((a: any, b: any) => b.count - a.count).slice(0, 10).map((hour: any) => (
              <div key={hour.hour} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium">
                  {hour.hour.toString().padStart(2, "0")}:00
                </div>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-primary h-full flex items-center justify-end pr-2 text-xs text-primary-foreground font-medium"
                    style={{
                      width: `${(hour.count / Math.max(...(hourlyEngagement?.map((h: any) => h.count) || [1]))) * 100}%`,
                    }}
                  >
                    {hour.count > 0 && hour.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros Avançados</CardTitle>
              <CardDescription>Refine sua busca de notificações</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Notificação</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="meta_atrasada">Meta Atrasada</SelectItem>
                    <SelectItem value="avaliacao_pendente">Avaliação Pendente</SelectItem>
                    <SelectItem value="consenso_pendente">Consenso Pendente</SelectItem>
                    <SelectItem value="pdi_prazo">PDI Próximo do Prazo</SelectItem>
                    <SelectItem value="meta_aprovada">Meta Aprovada</SelectItem>
                    <SelectItem value="meta_rejeitada">Meta Rejeitada</SelectItem>
                    <SelectItem value="feedback_recebido">Feedback Recebido</SelectItem>
                    <SelectItem value="badge_conquistado">Badge Conquistado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value: any) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Buscar Colaborador</Label>
                <Input
                  placeholder="Nome ou email..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.customStartDate}
                  onChange={(e) => setFilters({ ...filters, customStartDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.customEndDate}
                  onChange={(e) => setFilters({ ...filters, customEndDate: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Histórico de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Notificações Enviadas</CardTitle>
          <CardDescription>
            {filteredLogs.length} notificações encontradas
            {filters.searchTerm && ` (filtrado por "${filters.searchTerm}")`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Aberto em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma notificação encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{log.userName || "Desconhecido"}</div>
                        <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.deviceType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "aberta"
                            ? "default"
                            : log.status === "enviada"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {log.status === "aberta" ? "✓ Aberta" : log.status === "enviada" ? "Enviada" : "✗ Erro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.sentAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.openedAt ? new Date(log.openedAt).toLocaleString("pt-BR") : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assinaturas Mais Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Mais Ativas</CardTitle>
          <CardDescription>Top 10 usuários com interações recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.mostActive.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.userName || "Desconhecido"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {sub.deviceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(sub.lastUsedAt).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
