import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Send, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminBroadcastEmail() {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [actionText, setActionText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Query para listar admins
  const { data: adminList, isLoading: loadingAdmins } = trpc.admin.getAdminList.useQuery();

  // Mutation para enviar emails
  const sendBroadcast = trpc.admin.sendBroadcastToAdmins.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Email enviado com sucesso para ${data.sentCount} de ${data.totalAdmins} administradores!`,
        {
          description: data.failedCount > 0 
            ? `${data.failedCount} falhas detectadas. Verifique os logs.`
            : "Todos os emails foram enviados com sucesso.",
        }
      );
      
      // Limpar formulário
      setSubject("");
      setTitle("");
      setMessage("");
      setActionUrl("");
      setActionText("");
      setShowPreview(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar emails", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !title.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    sendBroadcast.mutate({
      subject,
      title,
      message,
      actionUrl: actionUrl.trim() || undefined,
      actionText: actionText.trim() || undefined,
    });
  };

  const previewHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .greeting {
      font-size: 16px;
      color: #555;
      margin-bottom: 20px;
    }
    .message {
      font-size: 15px;
      color: #666;
      line-height: 1.8;
      margin-bottom: 30px;
      white-space: pre-wrap;
    }
    .action-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #999;
      border-top: 1px solid #e9ecef;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 ${title}</h1>
    </div>
    <div class="content">
      <div class="badge">ADMINISTRADOR</div>
      <div class="greeting">Olá, [Nome do Admin]!</div>
      <div class="message">${message}</div>
      ${actionUrl && actionText ? `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${actionUrl}" class="action-button">${actionText}</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA.</p>
      <p>© ${new Date().getFullYear()} AVD UISA - Sistema de Avaliação de Desempenho</p>
    </div>
  </div>
</body>
</html>
  `;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="h-8 w-8 text-purple-600" />
          Enviar Email para Administradores
        </h1>
        <p className="text-gray-600 mt-2">
          Envie comunicados importantes para todos os administradores do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compor Email</CardTitle>
              <CardDescription>
                Preencha os campos abaixo para criar seu email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assunto */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Assunto do Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Atualização Importante do Sistema"
                    required
                  />
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Título do Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Nova Funcionalidade Disponível"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Este título aparecerá em destaque no cabeçalho do email
                  </p>
                </div>

                {/* Mensagem */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Mensagem <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Escreva uma mensagem clara e objetiva
                  </p>
                </div>

                {/* Botão de Ação (Opcional) */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">
                    Botão de Ação (Opcional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actionText">Texto do Botão</Label>
                      <Input
                        id="actionText"
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        placeholder="Ex: Acessar Sistema"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actionUrl">URL do Botão</Label>
                      <Input
                        id="actionUrl"
                        type="url"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={sendBroadcast.isPending}
                    className="flex-1"
                  >
                    {sendBroadcast.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para Todos os Admins
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Ocultar" : "Visualizar"} Preview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Preview do Email</CardTitle>
                <CardDescription>
                  Visualize como o email aparecerá para os destinatários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[600px]"
                    title="Preview do Email"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Lista de Admins */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Destinatários
              </CardTitle>
              <CardDescription>
                Administradores que receberão o email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : adminList && adminList.length > 0 ? (
                <>
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{adminList.length}</strong> administrador(es) receberão este email
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {adminList.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {admin.name?.charAt(0).toUpperCase() || "A"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {admin.name || "Sem nome"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {admin.email || "Sem email"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum administrador com email válido encontrado
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <p>• O email será enviado para todos os administradores com email cadastrado</p>
              <p>• O nome de cada admin será personalizado automaticamente</p>
              <p>• Você receberá uma confirmação após o envio</p>
              <p>• Verifique o preview antes de enviar</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
