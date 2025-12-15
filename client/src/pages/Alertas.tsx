import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, XCircle, Mail, Calendar, FileWarning, Clock, TrendingDown, Activity } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "resolved" | "dismissed";

const severityConfig = {
  critical: { label: "Crítico", color: "bg-red-500", icon: AlertTriangle },
  high: { label: "Alto", color: "bg-orange-500", icon: FileWarning },
  medium: { label: "Médio", color: "bg-yellow-500", icon: Clock },
  low: { label: "Baixo", color: "bg-blue-500", icon: Activity },
};

export default function Alertas() {
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>("active");
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | "all">("all");
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionTaken, setActionTaken] = useState<"email_sent" | "meeting_scheduled" | "warning_issued" | "training_assigned" | "none">("none");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: stats } = trpc.alerts.getStats.useQuery();
  const { data: alerts = [], isLoading } = trpc.alerts.list.useQuery({
    status: selectedStatus,
    severity: selectedSeverity === "all" ? undefined : selectedSeverity,
  });

  // Mutations
  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alerta resolvido com sucesso!");
      utils.alerts.list.invalidate();
      utils.alerts.getStats.invalidate();
      setResolveDialogOpen(false);
      setResolutionNotes("");
      setActionTaken("none");
    },
    onError: (error) => {
      toast.error(`Erro ao resolver alerta: ${error.message}`);
    },
  });

  const dismissMutation = trpc.alerts.dismiss.useMutation({
    onSuccess: () => {
      toast.success("Alerta dispensado com sucesso!");
      utils.alerts.list.invalidate();
      utils.alerts.getStats.invalidate();
      setDismissDialogOpen(false);
      setResolutionNotes("");
    },
    onError: (error) => {
      toast.error(`Erro ao dispensar alerta: ${error.message}`);
    },
  });

  const sendEmailMutation = trpc.alerts.sendAlertEmail.useMutation({
    onSuccess: () => {
      toast.success("E-mail enviado com sucesso!");
      utils.alerts.list.invalidate();
      setEmailDialogOpen(false);
      setEmailRecipient("");
      setEmailMessage("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar e-mail: ${error.message}`);
    },
  });

  const bulkActionMutation = trpc.alerts.bulkAction.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.processed} de ${data.total} alertas processados com sucesso!`);
      utils.alerts.list.invalidate();
      utils.alerts.getStats.invalidate();
      setSelectedAlerts([]);
    },
    onError: (error) => {
      toast.error(`Erro ao processar alertas: ${error.message}`);
    },
  });

  const handleResolve = (alertId: number) => {
    setCurrentAlertId(alertId);
    setResolveDialogOpen(true);
  };

  const handleDismiss = (alertId: number) => {
    setCurrentAlertId(alertId);
    setDismissDialogOpen(true);
  };

  const handleSendEmail = (alertId: number) => {
    setCurrentAlertId(alertId);
    setEmailDialogOpen(true);
  };

  const confirmResolve = () => {
    if (!currentAlertId) return;
    resolveMutation.mutate({
      alertId: currentAlertId,
      resolutionNotes,
      actionTaken,
    });
  };

  const confirmDismiss = () => {
    if (!currentAlertId) return;
    dismissMutation.mutate({
      alertId: currentAlertId,
      reason: resolutionNotes,
    });
  };

  const confirmSendEmail = () => {
    if (!currentAlertId) return;
    sendEmailMutation.mutate({
      alertId: currentAlertId,
      recipientEmail: emailRecipient,
      message: emailMessage,
    });
  };

  const handleBulkResolve = () => {
    if (selectedAlerts.length === 0) {
      toast.error("Selecione pelo menos um alerta");
      return;
    }
    bulkActionMutation.mutate({
      alertIds: selectedAlerts,
      action: "resolve",
      notes: "Resolvido em lote",
    });
  };

  const handleBulkDismiss = () => {
    if (selectedAlerts.length === 0) {
      toast.error("Selecione pelo menos um alerta");
      return;
    }
    bulkActionMutation.mutate({
      alertIds: selectedAlerts,
      action: "dismiss",
      notes: "Dispensado em lote",
    });
  };

  const toggleAlertSelection = (alertId: number) => {
    setSelectedAlerts(prev =>
      prev.includes(alertId)
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.id));
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Alertas</h1>
        <p className="text-muted-foreground">
          Central de gestão de alertas de produtividade e desempenho
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.critical || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AlertStatus)}>
                <TabsList>
                  <TabsTrigger value="active">Ativos</TabsTrigger>
                  <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
                  <TabsTrigger value="dismissed">Dispensados</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Severidade</label>
              <Select value={selectedSeverity} onValueChange={(v) => setSelectedSeverity(v as AlertSeverity | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedAlerts.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedAlerts.length} alerta(s) selecionado(s)</span>
              <div className="flex gap-2">
                <Button onClick={handleBulkResolve} size="sm" variant="default">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Resolver Selecionados
                </Button>
                <Button onClick={handleBulkDismiss} size="sm" variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Dispensar Selecionados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alertas</CardTitle>
            <Checkbox
              checked={selectedAlerts.length === alerts.length && alerts.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum alerta encontrado</div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: any) => {
                const SeverityIcon = severityConfig[alert.severity as AlertSeverity].icon;
                return (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedAlerts.includes(alert.id)}
                        onCheckedChange={() => toggleAlertSelection(alert.id)}
                      />
                      <div className={`p-2 rounded-full ${severityConfig[alert.severity as AlertSeverity].color} text-white`}>
                        <SeverityIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge variant="outline">{severityConfig[alert.severity as AlertSeverity].label}</Badge>
                          {alert.actionTaken && alert.actionTaken !== "none" && (
                            <Badge variant="secondary">{alert.actionTaken.replace("_", " ")}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <strong>Colaborador:</strong> {alert.employeeName} ({alert.employeeCode})
                          </span>
                          <span>
                            <strong>Data:</strong> {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedStatus === "active" && (
                          <>
                            <Button onClick={() => handleSendEmail(alert.id)} size="sm" variant="outline">
                              <Mail className="mr-2 h-4 w-4" />
                              E-mail
                            </Button>
                            <Button onClick={() => handleResolve(alert.id)} size="sm" variant="default">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Resolver
                            </Button>
                            <Button onClick={() => handleDismiss(alert.id)} size="sm" variant="ghost">
                              <XCircle className="mr-2 h-4 w-4" />
                              Dispensar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Resolver */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Registre as ações tomadas para resolver este alerta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ação Tomada</label>
              <Select value={actionTaken} onValueChange={(v: any) => setActionTaken(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="email_sent">E-mail Enviado</SelectItem>
                  <SelectItem value="meeting_scheduled">Reunião Agendada</SelectItem>
                  <SelectItem value="warning_issued">Advertência Emitida</SelectItem>
                  <SelectItem value="training_assigned">Treinamento Atribuído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notas de Resolução</label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Descreva as ações tomadas..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmResolve} disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? "Resolvendo..." : "Resolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Dispensar */}
      <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispensar Alerta</DialogTitle>
            <DialogDescription>
              Informe o motivo para dispensar este alerta
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Motivo da dispensa..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmDismiss} disabled={dismissMutation.isPending}>
              {dismissMutation.isPending ? "Dispensando..." : "Dispensar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Enviar E-mail */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar E-mail sobre Alerta</DialogTitle>
            <DialogDescription>
              Envie um e-mail para o gestor ou RH sobre este alerta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">E-mail do Destinatário</label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="exemplo@empresa.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Mensagem adicional..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSendEmail} disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? "Enviando..." : "Enviar E-mail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
