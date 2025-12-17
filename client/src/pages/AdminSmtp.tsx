import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Mail, Send, Settings, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Página de Administração SMTP
 * Permite configurar servidor SMTP para envio de e-mails automáticos
 */

export default function AdminSmtp() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Buscar configurações SMTP
  const { data: smtpConfig, isLoading, refetch } = trpc.admin.getSmtpConfig.useQuery();

  // Mutation para salvar configurações
  const saveMutation = trpc.admin.saveSmtpConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações SMTP salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Mutation para testar envio de email
  const testMutation = trpc.admin.sendTestEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "E-mail de teste enviado com sucesso!");
      } else {
        toast.error("Falha ao enviar e-mail de teste");
      }
      setIsTesting(false);
    },
    onError: (error) => {
      toast.error(`Erro ao testar: ${error.message}`);
      setIsTesting(false);
    },
  });

  // Estado do formulário
  const [formData, setFormData] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "Sistema AVD UISA",
    fromEmail: "",
  });

  // Carregar configurações existentes
  useEffect(() => {
    if (smtpConfig) {
      setFormData(smtpConfig);
    }
  }, [smtpConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleTest = () => {
    if (!testEmail) {
      toast.error("Digite um e-mail para teste");
      return;
    }

    setIsTesting(true);
    testMutation.mutate({ to: testEmail });
  };

  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Acesso negado: apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações SMTP
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure o servidor de e-mail para envio de notificações automáticas
          </p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            As configurações SMTP são necessárias para o envio automático de e-mails de lembretes de metas, avaliações pendentes e ações de PDI vencidas.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Servidor SMTP</CardTitle>
              <CardDescription>
                Informações do servidor de e-mail (ex: Gmail, Outlook, servidor próprio)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Host */}
              <div className="space-y-2">
                <Label htmlFor="host">Host do Servidor</Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ex: smtp.gmail.com, smtp.office365.com, smtp.seu-dominio.com
                </p>
              </div>

              {/* Port e Secure */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="587"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Comum: 587 (TLS) ou 465 (SSL)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secure">Conexão Segura (SSL/TLS)</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="secure"
                      checked={formData.secure}
                      onCheckedChange={(checked) => setFormData({ ...formData, secure: checked })}
                    />
                    <Label htmlFor="secure" className="cursor-pointer">
                      {formData.secure ? "Ativado (porta 465)" : "Desativado (porta 587)"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Usuário e Senha */}
              <div className="space-y-2">
                <Label htmlFor="user">Usuário (E-mail)</Label>
                <Input
                  id="user"
                  type="email"
                  placeholder="seu-email@gmail.com"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass">Senha</Label>
                <Input
                  id="pass"
                  type="password"
                  placeholder="••••••••"
                  value={formData.pass}
                  onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Para Gmail, use uma <strong>Senha de App</strong> (não a senha normal). Acesse: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
                </p>
              </div>

              {/* Remetente */}
              <div className="space-y-2">
                <Label htmlFor="fromName">Nome do Remetente</Label>
                <Input
                  id="fromName"
                  type="text"
                  placeholder="Sistema AVD UISA"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">E-mail do Remetente</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@empresa.com"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  required
                />
              </div>

              {/* Botão Salvar */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Teste de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle>Testar Configurações</CardTitle>
            <CardDescription>
              Envie um e-mail de teste para verificar se as configurações estão corretas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">E-mail de Teste</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleTest}
              variant="outline"
              className="w-full"
              disabled={isTesting || !testEmail}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar E-mail de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
