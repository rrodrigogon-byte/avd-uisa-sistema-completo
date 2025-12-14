import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Bell, Settings, History, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Notifications() {
  const { data: settings, refetch: refetchSettings } = trpc.notification.getSettings.useQuery();
  const { data: logs } = trpc.notification.getLogs.useQuery({});
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();

  const [localSettings, setLocalSettings] = useState(settings);

  const updateMutation = trpc.notification.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Configurações atualizadas com sucesso');
      refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar configurações');
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Todas as notificações foram marcadas como lidas');
    },
  });

  const handleSaveSettings = () => {
    if (localSettings) {
      updateMutation.mutate({
        notifyOnNewEvaluation: localSettings.notifyOnNewEvaluation,
        notifyPendingReminders: localSettings.notifyPendingReminders,
        notifyOnStatusChange: localSettings.notifyOnStatusChange,
        reminderDaysBefore: localSettings.reminderDaysBefore,
        reminderFrequency: localSettings.reminderFrequency,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Notificações</h1>
        <p className="text-muted-foreground">
          Configure suas preferências de notificações e visualize o histórico
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Histórico ({unreadCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Escolha quais notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-eval">Novas Avaliações</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando uma nova avaliação for atribuída
                  </p>
                </div>
                <Switch
                  id="new-eval"
                  checked={localSettings?.notifyOnNewEvaluation || false}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => prev ? { ...prev, notifyOnNewEvaluation: checked } : prev)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reminders">Lembretes Pendentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre avaliações pendentes
                  </p>
                </div>
                <Switch
                  id="reminders"
                  checked={localSettings?.notifyPendingReminders || false}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => prev ? { ...prev, notifyPendingReminders: checked } : prev)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Mudanças de Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando uma avaliação for aprovada/rejeitada
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={localSettings?.notifyOnStatusChange || false}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => prev ? { ...prev, notifyOnStatusChange: checked } : prev)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Dias antes do prazo para lembrete</Label>
                <Select
                  value={localSettings?.reminderDaysBefore?.toString() || '7'}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => prev ? { ...prev, reminderDaysBefore: parseInt(value) } : prev)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequência de lembretes</Label>
                <Select
                  value={localSettings?.reminderFrequency || 'weekly'}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => prev ? { ...prev, reminderFrequency: value as 'daily' | 'weekly' } : prev)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSettings} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Notificações</CardTitle>
                  <CardDescription>
                    Visualize todas as notificações recebidas
                  </CardDescription>
                </div>
                {unreadCount && unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {logs && logs.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                  <p className="text-muted-foreground">
                    Você não possui notificações no momento
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs?.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 border rounded-lg ${
                        log.isRead ? 'bg-background' : 'bg-blue-50 dark:bg-blue-950'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{log.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{log.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(log.sentAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {!log.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
