import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Monitor,
  MousePointer,
  Timer,
  Copy,
  Layers,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  Mail,
} from "lucide-react";

const anomalyTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fast_responses: { label: "Respostas Rápidas", icon: <Zap className="h-4 w-4" />, color: "text-yellow-600" },
  pattern_detected: { label: "Padrão Detectado", icon: <Layers className="h-4 w-4" />, color: "text-purple-600" },
  multiple_sessions: { label: "Múltiplas Sessões", icon: <Monitor className="h-4 w-4" />, color: "text-red-600" },
  unusual_time: { label: "Horário Incomum", icon: <Clock className="h-4 w-4" />, color: "text-orange-600" },
  browser_switch: { label: "Troca de Navegador", icon: <Monitor className="h-4 w-4" />, color: "text-blue-600" },
  copy_paste: { label: "Copiar/Colar", icon: <Copy className="h-4 w-4" />, color: "text-red-600" },
  tab_switch: { label: "Troca de Aba", icon: <MousePointer className="h-4 w-4" />, color: "text-amber-600" },
  other: { label: "Outro", icon: <AlertCircle className="h-4 w-4" />, color: "text-gray-600" },
};

const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: "Baixa", color: "text-green-700", bgColor: "bg-green-100" },
  medium: { label: "Média", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  high: { label: "Alta", color: "text-orange-700", bgColor: "bg-orange-100" },
  critical: { label: "Crítica", color: "text-red-700", bgColor: "bg-red-100" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "text-yellow-600", icon: <Clock className="h-4 w-4" /> },
  reviewed: { label: "Revisado", color: "text-blue-600", icon: <Eye className="h-4 w-4" /> },
  dismissed: { label: "Descartado", color: "text-gray-600", icon: <XCircle className="h-4 w-4" /> },
  confirmed: { label: "Confirmado", color: "text-red-600", icon: <CheckCircle className="h-4 w-4" /> },
};

export default function SuspiciousAccessDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const utils = trpc.useUtils();

  // Query para listar alertas
  const { data: alertsData, isLoading: loadingAlerts, refetch } = trpc.pirSuspiciousAccess.listAlerts.useQuery({
    status: statusFilter as any,
    severity: severityFilter as any,
    anomalyType: anomalyTypeFilter === "all" ? undefined : anomalyTypeFilter || undefined,
    page: 1,
    limit: 50,
  });

  // Query para estatísticas
  const { data: stats, isLoading: loadingStats } = trpc.pirSuspiciousAccess.getStats.useQuery(undefined);

  // Mutation para revisar alerta
  const reviewMutation = trpc.pirSuspiciousAccess.reviewAlert.useMutation({
    onSuccess: () => {
      toast.success("Alerta revisado com sucesso!");
      setIsReviewDialogOpen(false);
      setSelectedAlert(null);
      setReviewNotes("");
      utils.pirSuspiciousAccess.listAlerts.invalidate();
      utils.pirSuspiciousAccess.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao revisar alerta: ${error.message}`);
    },
  });

  // Mutation para notificar gestores por email
  const notifyManagersMutation = trpc.pirSuspiciousAccess.notifyManagersAboutAlerts.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar notificações: ${error.message}`);
    },
  });

  const handleNotifyManagers = () => {
    notifyManagersMutation.mutate({ includeAllPending: true });
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleReview = (status: "reviewed" | "dismissed" | "confirmed") => {
    if (!selectedAlert) return;
    reviewMutation.mutate({
      alertId: selectedAlert.alert.id,
      status,
      reviewNotes: reviewNotes || undefined,
    });
  };

  const openReviewDialog = (alert: any) => {
    setSelectedAlert(alert);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  // Calcular totais por severidade
  const severityCounts = useMemo(() => {
    if (!stats?.bySeverity) return { low: 0, medium: 0, high: 0, critical: 0 };
    return stats.bySeverity.reduce((acc, s) => {
      acc[s.severity] = Number(s.count);
      return acc;
    }, { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>);
  }, [stats]);

  // Calcular totais por tipo
  const typeCounts = useMemo(() => {
    if (!stats?.byType) return {};
    return stats.byType.reduce((acc, t) => {
      acc[t.anomalyType] = Number(t.count);
      return acc;
    }, {} as Record<string, number>);
  }, [stats]);

  // Calcular totais por status
  const statusCounts = useMemo(() => {
    if (!stats?.byStatus) return { pending: 0, reviewed: 0, dismissed: 0, confirmed: 0 };
    return stats.byStatus.reduce((acc, s) => {
      acc[s.status] = Number(s.count);
      return acc;
    }, { pending: 0, reviewed: 0, dismissed: 0, confirmed: 0 } as Record<string, number>);
  }, [stats]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-7 w-7 text-red-500" />
              Dashboard de Alertas de Segurança
            </h1>
            <p className="text-gray-500 mt-1">
              Monitoramento em tempo real de acessos suspeitos durante avaliações PIR
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleNotifyManagers}
              disabled={notifyManagersMutation.isPending || statusCounts.pending === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <Mail className="h-4 w-4 mr-1" />
              {notifyManagersMutation.isPending ? "Enviando..." : "Notificar Gestores"}
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Total de Alertas */}
          <Card className="col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Alertas</p>
                  <p className="text-3xl font-bold">{stats?.total || 0}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="text-yellow-600">
                  {statusCounts.pending} pendentes
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  {statusCounts.confirmed} confirmados
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Por Severidade */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-500">Críticos</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{severityCounts.critical}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-500">Altos</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{severityCounts.high}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-500">Médios</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-500">Baixos</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{severityCounts.low}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Tipos de Anomalia */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Tipo de Anomalia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(anomalyTypeLabels).map(([type, config]) => {
                  const count = typeCounts[type] || 0;
                  const maxCount = Math.max(...Object.values(typeCounts), 1);
                  const percentage = (count / maxCount) * 100;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center gap-2 ${config.color}`}>
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status dos Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className={`flex items-center gap-2 ${config.color}`}>
                      {config.icon}
                      <span>{config.label}</span>
                    </div>
                    <span className="text-xl font-bold">{statusCounts[status] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Lista de Alertas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Alertas Recentes</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="reviewed">Revisados</SelectItem>
                      <SelectItem value="dismissed">Descartados</SelectItem>
                      <SelectItem value="confirmed">Confirmados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={anomalyTypeFilter} onValueChange={setAnomalyTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(anomalyTypeLabels).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="text-center py-8 text-gray-500">Carregando alertas...</div>
            ) : alertsData?.alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum alerta encontrado</p>
                <p className="text-sm">Ajuste os filtros ou aguarde novos eventos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertsData?.alerts.map(({ alert, employee }) => {
                    const typeConfig = anomalyTypeLabels[alert.anomalyType] || anomalyTypeLabels.other;
                    const sevConfig = severityConfig[alert.severity];
                    const statConfig = statusConfig[alert.status];

                    return (
                      <TableRow key={alert.id} className={alert.status === "pending" ? "bg-yellow-50/50" : ""}>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${typeConfig.color}`}>
                            {typeConfig.icon}
                            <span className="text-sm">{typeConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee?.name || "—"}</p>
                            <p className="text-xs text-gray-500">{employee?.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs truncate" title={alert.description}>
                            {alert.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${sevConfig.color} ${sevConfig.bgColor}`}>
                            {sevConfig.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${statConfig.color}`}>
                            {statConfig.icon}
                            <span className="text-sm">{statConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(alert.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReviewDialog({ alert, employee })}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog({ alert, employee })}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Revisão */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Revisar Alerta de Segurança</DialogTitle>
              <DialogDescription>
                Analise os detalhes do alerta e tome uma ação apropriada.
              </DialogDescription>
            </DialogHeader>

            {selectedAlert && (
              <div className="space-y-4 py-4">
                {/* Detalhes do Alerta */}
                <div className="p-4 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tipo de Anomalia</span>
                    <div className={`flex items-center gap-2 ${anomalyTypeLabels[selectedAlert.alert.anomalyType]?.color}`}>
                      {anomalyTypeLabels[selectedAlert.alert.anomalyType]?.icon}
                      <span className="font-medium">
                        {anomalyTypeLabels[selectedAlert.alert.anomalyType]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Severidade</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig[selectedAlert.alert.severity]?.color} ${severityConfig[selectedAlert.alert.severity]?.bgColor}`}>
                      {severityConfig[selectedAlert.alert.severity]?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Colaborador</span>
                    <span className="font-medium">{selectedAlert.employee?.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Data/Hora</span>
                    <span>{new Date(selectedAlert.alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <Label className="text-sm text-gray-500">Descrição</Label>
                  <p className="mt-1 p-3 rounded bg-gray-50 text-sm">{selectedAlert.alert.description}</p>
                </div>

                {/* Dados Técnicos */}
                {(selectedAlert.alert.ipAddress || selectedAlert.alert.userAgent) && (
                  <div className="p-3 rounded bg-gray-50 text-xs font-mono space-y-1">
                    {selectedAlert.alert.ipAddress && (
                      <p><span className="text-gray-500">IP:</span> {selectedAlert.alert.ipAddress}</p>
                    )}
                    {selectedAlert.alert.userAgent && (
                      <p className="truncate"><span className="text-gray-500">User-Agent:</span> {selectedAlert.alert.userAgent}</p>
                    )}
                  </div>
                )}

                {/* Notas de Revisão */}
                {selectedAlert.alert.status === "pending" && (
                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes">Notas de Revisão (opcional)</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Adicione observações sobre sua análise..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Notas Existentes */}
                {selectedAlert.alert.reviewNotes && (
                  <div>
                    <Label className="text-sm text-gray-500">Notas da Revisão Anterior</Label>
                    <p className="mt-1 p-3 rounded bg-blue-50 text-sm">{selectedAlert.alert.reviewNotes}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedAlert?.alert.status === "pending" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReview("dismissed")}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Descartar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReview("reviewed")}
                    disabled={reviewMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Marcar como Revisado
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview("confirmed")}
                    disabled={reviewMutation.isPending}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Confirmar Alerta
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
