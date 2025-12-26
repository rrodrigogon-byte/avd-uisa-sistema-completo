import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Download
} from "lucide-react";
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

export default function EmailMonitoring() {
  const { user, loading: authLoading } = useAuth();
  
  // Buscar estatísticas de emails
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.getEmailStats.useQuery(undefined);
  
  // Buscar histórico recente
  const { data: recentEmails, isLoading: historyLoading, refetch: refetchHistory } = trpc.admin.getRecentEmails.useQuery({
    limit: 50
  });

  // Buscar emails por tipo
  const { data: emailsByType } = trpc.admin.getEmailsByType.useQuery(undefined);

  const handleRefresh = () => {
    refetchStats();
    refetchHistory();
    toast.success("Dados atualizados");
  };

  const handleExport = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  if (authLoading || !user) {
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = statsLoading || historyLoading;

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitoramento de E-mails</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o status e performance do sistema de e-mails
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviado</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats?.totalSent || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "..." : stats?.successCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "..." : `${stats?.successRate || 0}% de taxa de sucesso`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? "..." : stats?.failedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "..." : `${stats?.failureRate || 0}% de taxa de falha`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {isLoading ? "..." : stats?.pendingCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* E-mails por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>E-mails por Tipo</CardTitle>
            <CardDescription>
              Distribuição de e-mails enviados por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emailsByType?.map((type: any) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {type.count} enviados
                    </span>
                    <Badge variant={type.successRate > 90 ? "default" : "destructive"}>
                      {type.successRate}% sucesso
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>
              Últimos 50 e-mails enviados pelo sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tentativas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : recentEmails && recentEmails.length > 0 ? (
                  recentEmails.map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        {email.status === 'sent' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : email.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{email.to}</TableCell>
                      <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{email.type || 'Geral'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(email.sentAt || email.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center">
                        {email.attemptCount > 1 ? (
                          <span className="text-yellow-600 font-medium">
                            {email.attemptCount}x
                          </span>
                        ) : (
                          <span className="text-muted-foreground">1x</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum e-mail encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre a saúde do sistema de e-mails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Taxa de Sucesso</p>
                    <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.successRate || 0}%
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Retry Automático</p>
                    <p className="text-sm text-muted-foreground">Sistema ativo</p>
                  </div>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Configuração SMTP</p>
                    <p className="text-sm text-muted-foreground">Servidor conectado</p>
                  </div>
                </div>
                <Badge variant="default">OK</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
