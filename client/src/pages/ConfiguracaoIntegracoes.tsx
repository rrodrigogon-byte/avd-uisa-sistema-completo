import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageSquare, Send, Video, CheckCircle } from "lucide-react";

/**
 * Página de Configuração de Integrações Externas
 * Microsoft Teams, Slack e Google Meet
 */
export default function ConfiguracaoIntegracoes() {
  const [teamsWebhook, setTeamsWebhook] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackChannel, setSlackChannel] = useState("#geral");
  const [googleMeetEnabled, setGoogleMeetEnabled] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: config, isLoading } = trpc.integrations.getConfig.useQuery(undefined);

  // Mutations
  const saveConfigMutation = trpc.integrations.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      utils.integrations.getConfig.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const testTeamsMutation = trpc.integrations.testTeams.useMutation({
    onSuccess: ({ success }) => {
      if (success) {
        toast.success("Teste enviado com sucesso! Verifique o canal do Teams.");
      } else {
        toast.error("Falha ao enviar teste. Verifique o webhook.");
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const testSlackMutation = trpc.integrations.testSlack.useMutation({
    onSuccess: ({ success }) => {
      if (success) {
        toast.success("Teste enviado com sucesso! Verifique o canal do Slack.");
      } else {
        toast.error("Falha ao enviar teste. Verifique o webhook.");
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Carregar configurações
  useEffect(() => {
    if (config) {
      setTeamsWebhook(config.teamsWebhookUrl);
      setSlackWebhook(config.slackWebhookUrl);
      setSlackChannel(config.slackChannel || "#geral");
      setGoogleMeetEnabled(config.googleMeetEnabled);
    }
  }, [config]);

  const handleSave = () => {
    saveConfigMutation.mutate({
      teamsWebhookUrl: teamsWebhook || undefined,
      slackWebhookUrl: slackWebhook || undefined,
      slackChannel: slackChannel || undefined,
      googleMeetEnabled,
    });
  };

  const handleTestTeams = () => {
    if (!teamsWebhook) {
      toast.error("Configure o webhook do Teams primeiro");
      return;
    }
    testTeamsMutation.mutate({ webhookUrl: teamsWebhook });
  };

  const handleTestSlack = () => {
    if (!slackWebhook) {
      toast.error("Configure o webhook do Slack primeiro");
      return;
    }
    testSlackMutation.mutate({
      webhookUrl: slackWebhook,
      channel: slackChannel,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Send className="w-8 h-8 text-[#F39200]" />
          Configuração de Integrações
        </h1>
        <p className="text-gray-600 mt-2">
          Configure integrações com Microsoft Teams, Slack e Google Meet
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : (
        <div className="space-y-6">
          {/* Microsoft Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Microsoft Teams
              </CardTitle>
              <CardDescription>
                Configure o webhook do Teams para receber notificações automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teams-webhook">Webhook URL</Label>
                <Input
                  id="teams-webhook"
                  type="url"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={teamsWebhook}
                  onChange={(e) => setTeamsWebhook(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Crie um webhook no Teams: Configurações do Canal → Conectores → Incoming Webhook
                </p>
              </div>

              <Button
                onClick={handleTestTeams}
                disabled={!teamsWebhook || testTeamsMutation.isPending}
                variant="outline"
              >
                {testTeamsMutation.isPending ? "Enviando..." : "Enviar Teste"}
              </Button>
            </CardContent>
          </Card>

          {/* Slack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Slack
              </CardTitle>
              <CardDescription>
                Configure o webhook do Slack para receber notificações automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Crie um webhook no Slack: Configurações → Incoming Webhooks
                </p>
              </div>

              <div>
                <Label htmlFor="slack-channel">Canal Padrão</Label>
                <Input
                  id="slack-channel"
                  type="text"
                  placeholder="#geral"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleTestSlack}
                disabled={!slackWebhook || testSlackMutation.isPending}
                variant="outline"
              >
                {testSlackMutation.isPending ? "Enviando..." : "Enviar Teste"}
              </Button>
            </CardContent>
          </Card>

          {/* Google Meet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-green-600" />
                Google Meet
              </CardTitle>
              <CardDescription>
                Habilite a criação automática de reuniões no Google Meet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="google-meet-enabled">Habilitar Google Meet</Label>
                  <p className="text-sm text-gray-500">
                    Permite criar reuniões automaticamente para feedbacks e calibrações
                  </p>
                </div>
                <Switch
                  id="google-meet-enabled"
                  checked={googleMeetEnabled}
                  onCheckedChange={setGoogleMeetEnabled}
                />
              </div>

              {googleMeetEnabled && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Google Meet habilitado. Os usuários precisarão autorizar o acesso ao Google Calendar
                    na primeira vez que criarem uma reunião.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="bg-[#F39200] hover:bg-[#D17E00]"
            >
              {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
