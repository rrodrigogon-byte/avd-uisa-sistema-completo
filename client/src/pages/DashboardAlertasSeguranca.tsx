import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AlertStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export default function DashboardAlertasSeguranca() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const utils = trpc.useUtils();
  const { data: alertsData, isLoading } = trpc.pirSuspiciousAccess.listAlerts.useQuery({
    status: statusFilter === "all" ? "all" : statusFilter as any,
    severity: severityFilter === "all" ? "all" : severityFilter as any,
    page: 1,
    limit: 100,
  });

  const alerts = safeMap(alertsData?.alerts, a => ({
    id: a.alert.id,
    userId: a.alert.employeeId,
    ipAddress: a.alert.ipAddress || "N/A",
    severity: a.alert.severity.toUpperCase(),
    status: a.alert.status.toUpperCase(),
    reason: a.alert.description,
    accessTime: a.alert.detectedAt,
    details: a.alert.reviewNotes || "",
  }));

  const resolveAlertsMutation = trpc.pirSuspiciousAccess.reviewAlert.useMutation({
    onSuccess: () => {
      toast.success("Alertas marcados como resolvidos!");
      utils.pirSuspiciousAccess.listAlerts.invalidate();
      setSelectedAlerts([]);
    },
    onError: (error) => {
      toast.error(`Erro ao resolver alertas: ${error.message}`);
    },
  });

  const deleteAlertsMutation = trpc.pirSuspiciousAccess.reviewAlert.useMutation({
    onSuccess: () => {
      toast.success("Alertas excluídos com sucesso!");
      utils.pirSuspiciousAccess.listAlerts.invalidate();
      setSelectedAlerts([]);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir alertas: ${error.message}`);
    },
  });

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesSearch =
        searchTerm === "" ||
        alert.userId.toString().includes(searchTerm) ||
        alert.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.reason.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const alertDate = new Date(alert.accessTime);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDateRange = alertDate >= startDate && alertDate <= endDate;
      }

      return matchesStatus && matchesSeverity && matchesSearch && matchesDateRange;
    });
  }, [alerts, statusFilter, severityFilter, searchTerm, dateRange]);

  const statistics = useMemo(() => {
    if (!alerts) return { total: 0, pending: 0, resolved: 0, critical: 0, high: 0 };

    return {
      total: alerts.length,
      pending: alerts.filter((a) => a.status === "PENDING").length,
      resolved: alerts.filter((a) => a.status === "RESOLVED").length,
      critical: alerts.filter((a) => a.severity === "CRITICAL").length,
      high: alerts.filter((a) => a.severity === "HIGH").length,
    };
  }, [alerts]);

  const severityDistribution = useMemo(() => {
    if (!alerts) return { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    return alerts.reduce(
      (acc, alert) => {
        acc[alert.severity as SeverityLevel] = (acc[alert.severity as SeverityLevel] || 0) + 1;
        return acc;
      },
      { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<SeverityLevel, number>
    );
  }, [alerts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(filteredAlerts.map((a) => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedAlerts([...selectedAlerts, id]);
    } else {
      setSelectedAlerts(selectedAlerts.filter((alertId) => alertId !== id));
    }
  };

  const handleBulkResolve = () => {
    if (selectedAlerts.length === 0) {
      toast.error("Selecione pelo menos um alerta");
      return;
    }
    if (confirm(`Deseja marcar ${selectedAlerts.length} alerta(s) como resolvido(s)?`)) {
      selectedAlerts.forEach((id) => {
        resolveAlertsMutation.mutate({ alertId: id, status: "reviewed" });
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedAlerts.length === 0) {
      toast.error("Selecione pelo menos um alerta");
      return;
    }
    if (confirm(`Deseja descartar ${selectedAlerts.length} alerta(s)?`)) {
      selectedAlerts.forEach((id) => {
        deleteAlertsMutation.mutate({ alertId: id, status: "dismissed" });
      });
    }
  };

  const handleViewDetails = (alert: any) => {
    setSelectedAlert(alert);
    setIsDetailDialogOpen(true);
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      LOW: { variant: "secondary", label: "Baixa" },
      MEDIUM: { variant: "outline", label: "Média" },
      HIGH: { variant: "default", label: "Alta" },
      CRITICAL: { variant: "destructive", label: "Crítica" },
    };
    const config = variants[severity] || variants.LOW;
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDING: { variant: "default", label: "Pendente" },
      RESOLVED: { variant: "secondary", label: "Resolvido" },
      DISMISSED: { variant: "outline", label: "Descartado" },
    };
    const config = variants[status] || variants.PENDING;
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!filteredAlerts || filteredAlerts.length === 0) {
      toast.error("Nenhum alerta para exportar");
      return;
    }

    const headers = ["ID", "Usuário", "IP", "Severidade", "Status", "Razão", "Data"];
    const rows = filteredAlerts.map((alert) => [
      alert.id,
      alert.userId,
      alert.ipAddress,
      alert.severity,
      alert.status,
      alert.reason,
      format(new Date(alert.accessTime), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `alertas-seguranca-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar autenticado para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Dashboard de Alertas de Segurança
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitore e gerencie alertas de segurança e acessos suspeitos
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics.high}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Severidade */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Distribuição por Severidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(severityDistribution).map(([severity, count]) => {
              const total = statistics.total || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              const colors: Record<SeverityLevel, string> = {
                LOW: "bg-blue-500",
                MEDIUM: "bg-yellow-500",
                HIGH: "bg-orange-500",
                CRITICAL: "bg-red-500",
              };
              return (
                <div key={severity} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{severity}</span>
                    <span className="text-muted-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[severity as SeverityLevel]} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="RESOLVED">Resolvido</SelectItem>
                  <SelectItem value="DISMISSED">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severidade</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="ID, IP, Razão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedAlerts.length > 0 && (
        <Card className="mb-4 bg-muted">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedAlerts.length} alerta(s) selecionado(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkResolve}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marcar como Resolvido
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Selecionados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Alertas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Alertas de Segurança ({filteredAlerts.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAlerts.length === filteredAlerts.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Razão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAlerts.includes(alert.id)}
                        onCheckedChange={(checked) => handleSelectAlert(alert.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.userId}</TableCell>
                    <TableCell className="font-mono text-sm">{alert.ipAddress}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.reason}</TableCell>
                    <TableCell>{format(new Date(alert.accessTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(alert)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum alerta encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Alerta</label>
                  <p className="font-medium">{selectedAlert.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Usuário</label>
                  <p className="font-medium">{selectedAlert.userId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço IP</label>
                  <p className="font-mono text-sm">{selectedAlert.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data e Hora</label>
                  <p className="font-medium">
                    {format(new Date(selectedAlert.accessTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severidade</label>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Razão</label>
                <p className="mt-1 text-sm">{selectedAlert.reason}</p>
              </div>
              {selectedAlert.details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detalhes Adicionais</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedAlert.details}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
