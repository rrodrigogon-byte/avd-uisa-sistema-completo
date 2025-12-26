import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Mail, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Configurações SMTP
 * 
 * Página para configurar servidor SMTP para envio de e-mails
 */

export default function ConfiguracoesSMTP() {
  const [config, setConfig] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "Sistema AVD UISA",
  });

  const [testEmail, setTestEmail] = useState("rodrigo.goncalves@uisa.com.br");

  // Buscar configuração existente
  const { data: existingConfig, isLoading } = trpc.smtpConfig.get.useQuery(undefined);

  // Mutation para salvar configuração
  const saveConfigMutation = trpc.smtpConfig.save.useMutation({
    onSuccess: () => {
      toast.success("Configuração SMTP salva com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    },
  });

  // Mutation para testar e-mail
  const sendTestMutation = trpc.email.sendTest.useMutation({
    onSuccess: () => {
      toast.success(`E-mail de teste enviado para ${testEmail}!`);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar e-mail: ${error.message}`);
    },
  });

  // Carregar configuração existente quando disponível
  useState(() => {
    if (existingConfig) {
      setConfig({
        host: existingConfig.host,
        port: existingConfig.port,
        secure: existingConfig.secure ?? false,
        user: existingConfig.user,
        password: "", // Não mostrar senha por segurança
        fromEmail: existingConfig.fromEmail,
        fromName: existingConfig.fromName,
      });
    }
  });

  const handleSave = () => {
    if (!config.host || !config.user || !config.fromEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    saveConfigMutation.mutate({
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      password: config.password || undefined, // Só atualizar se fornecida
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    });
  };

  const handleTest = () => {
    if (!testEmail) {
      toast.error("Digite um e-mail para teste");
      return;
    }

    sendTestMutation.mutate({ recipientEmail: testEmail });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações SMTP</h1>
          <p className="text-muted-foreground">
            Configure o servidor de e-mail para envio de notificações
          </p>
        </div>

        {/* Configuração SMTP */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Servidor SMTP</CardTitle>
            </div>
            <CardDescription>
              Informações do servidor de e-mail para envio de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Host */}
            <div className="grid gap-2">
              <Label htmlFor="host">Host do Servidor *</Label>
              <Input
                id="host"
                placeholder="smtp.gmail.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Endereço do servidor SMTP (ex: smtp.gmail.com, smtp.office365.com)
              </p>
            </div>

            {/* Porta e Segurança */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="port">Porta *</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Porta padrão: 587 (TLS) ou 465 (SSL)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="secure">Usar SSL/TLS</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="secure"
                    checked={config.secure}
                    onCheckedChange={(checked) => setConfig({ ...config, secure: checked })}
                  />
                  <Label htmlFor="secure" className="cursor-pointer">
                    {config.secure ? "SSL (porta 465)" : "TLS (porta 587)"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Usuário e Senha */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user">Usuário *</Label>
                <Input
                  id="user"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Senha {existingConfig ? "(deixe vazio para manter)" : "*"}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </div>

            {/* Remetente */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fromEmail">E-mail do Remetente *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@uisa.com.br"
                  value={config.fromEmail}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fromName">Nome do Remetente</Label>
                <Input
                  id="fromName"
                  placeholder="Sistema AVD UISA"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                />
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teste de E-mail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <CardTitle>Testar Envio de E-mail</CardTitle>
            </div>
            <CardDescription>
              Envie um e-mail de teste para verificar se a configuração está correta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="testEmail">E-mail de Teste</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="rodrigo.goncalves@uisa.com.br"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleTest}
              disabled={sendTestMutation.isPending || !testEmail}
              variant="outline"
            >
              {sendTestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar E-mail de Teste
                </>
              )}
            </Button>

            {existingConfig && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Última configuração salva:</strong> {new Date(existingConfig.updatedAt).toLocaleString("pt-BR")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
