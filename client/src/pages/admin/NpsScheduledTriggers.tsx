import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Clock, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Settings2,
  Play,
  Pause,
  RefreshCw,
  Eye,
  MessageSquare
} from "lucide-react";

export default function NpsScheduledTriggers() {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [alertNotes, setAlertNotes] = useState("");

  // Queries
  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = 
    trpc.npsScheduledTrigger.getSettings.useQuery();
  const { data: triggers, isLoading: loadingTriggers, refetch: refetchTriggers } = 
    trpc.npsScheduledTrigger.listScheduledTriggers.useQuery({ limit: 50 });
  const { data: alerts, isLoading: loadingAlerts, refetch: refetchAlerts } = 
    trpc.npsScheduledTrigger.listDetractorAlerts.useQuery({});
  const { data: stats, isLoading: loadingStats } = 
    trpc.npsScheduledTrigger.getTriggerStats.useQuery();
  const { data: pendingProcesses, isLoading: loadingPending } = 
    trpc.npsScheduledTrigger.checkPendingProcesses.useQuery();

  // Mutations
  const updateSettings = trpc.npsScheduledTrigger.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      refetchSettings();
      setShowSettingsDialog(false);
    },
    onError: () => toast.error("Erro ao atualizar configurações"),
  });

  const processPending = trpc.npsScheduledTrigger.processPending.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.sent} pesquisas enviadas de ${data.processed} processadas`);
      refetchTriggers();
    },
    onError: () => toast.error("Erro ao processar triggers pendentes"),
  });

  const cancelTrigger = trpc.npsScheduledTrigger.cancelTrigger.useMutation({
    onSuccess: () => {
      toast.success("Trigger cancelado com sucesso!");
      refetchTriggers();
    },
    onError: () => toast.error("Erro ao cancelar trigger"),
  });

  const updateAlertStatus = trpc.npsScheduledTrigger.updateAlertStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do alerta atualizado!");
      refetchAlerts();
      setShowAlertDialog(false);
      setSelectedAlert(null);
      setAlertNotes("");
    },
    onError: () => toast.error("Erro ao atualizar alerta"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Enviado</Badge>;
      case "responded":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Respondido</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Expirado</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-red-100 text-red-800">Novo</Badge>;
      case "acknowledged":
        return <Badge className="bg-yellow-100 text-yellow-800">Reconhecido</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-100 text-gray-800">Descartado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleUpdateAlert = (status: "acknowledged" | "in_progress" | "resolved" | "dismissed") => {
    if (!selectedAlert) return;
    updateAlertStatus.mutate({
      alertId: selectedAlert,
      status,
      notes: alertNotes,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Triggers Automáticos de NPS</h1>
            <p className="text-gray-500 mt-1">
              Gerencie o disparo automático de pesquisas NPS após conclusão do PDI
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => processPending.mutate()}
              disabled={processPending.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${processPending.isPending ? "animate-spin" : ""}`} />
              Processar Pendentes
            </Button>
            <Button onClick={() => setShowSettingsDialog(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : stats ? (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Triggers Pendentes</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.triggers.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Enviados</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.triggers.sent}</p>
                    </div>
                    <Send className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Resposta</p>
                      <p className="text-3xl font-bold text-green-600">{stats.triggers.responseRate}%</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Alertas Detratores</p>
                      <p className="text-3xl font-bold text-red-600">{stats.detractorAlerts.new}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Pending Processes Alert */}
        {pendingProcesses && pendingProcesses.pendingCount > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    {pendingProcesses.pendingCount} processos concluídos sem trigger de NPS
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Existem processos que foram concluídos mas não têm pesquisa NPS agendada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="triggers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="triggers">Triggers Agendados</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas de Detratores
              {stats && stats.detractorAlerts.new > 0 && (
                <Badge className="ml-2 bg-red-500">{stats.detractorAlerts.new}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Triggers Tab */}
          <TabsContent value="triggers">
            <Card>
              <CardHeader>
                <CardTitle>Triggers Agendados</CardTitle>
                <CardDescription>
                  Lista de pesquisas NPS agendadas para envio automático
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTriggers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : triggers && triggers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Funcionário</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Pesquisa</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Agendado Para</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {triggers.map((trigger) => (
                          <tr key={trigger.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{trigger.employeeName || "—"}</td>
                            <td className="py-3 px-4">{trigger.surveyName || "—"}</td>
                            <td className="py-3 px-4 text-center">
                              {trigger.scheduledFor 
                                ? new Date(trigger.scheduledFor).toLocaleString("pt-BR")
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(trigger.status)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {trigger.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelTrigger.mutate({ triggerId: trigger.id })}
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum trigger agendado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Detratores</CardTitle>
                <CardDescription>
                  Funcionários que deram notas baixas (0-6) nas pesquisas NPS
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${
                              alert.score <= 3 ? "bg-red-100" : "bg-orange-100"
                            }`}>
                              <AlertTriangle className={`h-5 w-5 ${
                                alert.score <= 3 ? "text-red-600" : "text-orange-600"
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{alert.employeeName || "Funcionário"}</span>
                                {getAlertStatusBadge(alert.status)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Score: <span className="font-bold text-red-600">{alert.score}/10</span>
                                {" • "}
                                {alert.surveyName || "Pesquisa NPS"}
                              </p>
                              {alert.comment && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  "{alert.comment}"
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {alert.createdAt 
                                  ? new Date(alert.createdAt).toLocaleString("pt-BR")
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert.id);
                              setShowAlertDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-green-600 font-medium">Nenhum alerta de detrator</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Todos os funcionários estão satisfeitos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurações de NPS Trigger</DialogTitle>
              <DialogDescription>
                Configure o comportamento do disparo automático de pesquisas
              </DialogDescription>
            </DialogHeader>
            {settings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trigger Automático</Label>
                    <p className="text-sm text-gray-500">Disparar pesquisas automaticamente</p>
                  </div>
                  <Switch 
                    checked={settings.autoTriggerEnabled}
                    onCheckedChange={(checked) => 
                      updateSettings.mutate({ autoTriggerEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delay Padrão (minutos)</Label>
                  <Input 
                    type="number" 
                    defaultValue={settings.defaultDelayMinutes}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0) {
                        updateSettings.mutate({ defaultDelayMinutes: value });
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Tempo de espera após conclusão do PDI (1440 = 24 horas)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Detratores</Label>
                    <p className="text-sm text-gray-500">Notificar admin sobre detratores</p>
                  </div>
                  <Switch 
                    checked={settings.detractorAlertEnabled}
                    onCheckedChange={(checked) => 
                      updateSettings.mutate({ detractorAlertEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Threshold de Detrator</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={10}
                    defaultValue={settings.detractorThreshold}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 0 && value <= 10) {
                        updateSettings.mutate({ detractorThreshold: value });
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Scores iguais ou abaixo deste valor geram alerta (padrão: 6)
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Management Dialog */}
        <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Alerta de Detrator</DialogTitle>
              <DialogDescription>
                Atualize o status e adicione notas sobre o acompanhamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notas de Acompanhamento</Label>
                <Textarea 
                  placeholder="Descreva as ações tomadas ou observações..."
                  value={alertNotes}
                  onChange={(e) => setAlertNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleUpdateAlert("acknowledged")}
                disabled={updateAlertStatus.isPending}
              >
                Reconhecer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleUpdateAlert("in_progress")}
                disabled={updateAlertStatus.isPending}
              >
                Em Andamento
              </Button>
              <Button 
                onClick={() => handleUpdateAlert("resolved")}
                disabled={updateAlertStatus.isPending}
              >
                Resolver
              </Button>
              <Button 
                variant="ghost"
                onClick={() => handleUpdateAlert("dismissed")}
                disabled={updateAlertStatus.isPending}
              >
                Descartar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
