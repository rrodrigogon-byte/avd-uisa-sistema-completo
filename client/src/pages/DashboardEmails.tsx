import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Mail, Search, RefreshCw, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardEmails() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Queries
  const { data: emailMetrics, isLoading, refetch } = trpc.emails.getMetrics.useQuery({});
  const { data: emailHistory } = trpc.emails.getHistory.useQuery({});

  // Mutations
  const resendEmailMutation = trpc.emails.resend.useMutation({
    onSuccess: () => {
      toast.success("Email reenviado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
    },
  });

  const resendAllFailedMutation = trpc.emails.resendAllFailed.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.successCount} email(s) reenviado(s) com sucesso!`);
      if (data.failedCount > 0) {
        toast.warning(`${data.failedCount} email(s) falharam novamente.`);
      }
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao reenviar emails: ${error.message}`);
    },
  });

  const handleResend = (emailId: number) => {
    if (confirm("Deseja realmente reenviar este email?")) {
      resendEmailMutation.mutate({ emailId });
    }
  };

  const handleResendAllFailed = () => {
    const failedCount = emailMetrics?.failed || 0;
    if (failedCount === 0) {
      toast.info("Não há emails falhados para reenviar.");
      return;
    }
    if (confirm(`Deseja realmente reenviar todos os ${failedCount} emails falhados?`)) {
      resendAllFailedMutation.mutate();
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "admin" && user.role !== "rh") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="mt-2 text-gray-600">Apenas administradores e RH podem acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredHistory = emailHistory?.filter((email: any) => {
    const matchesSearch = email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || email.status === statusFilter;
    const matchesType = typeFilter === "all" || email.emailType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const totalEmails = emailMetrics?.total || 0;
  const successRate = totalEmails > 0 ? ((emailMetrics?.sent || 0) / totalEmails * 100).toFixed(1) : "0.0";
  const failureRate = totalEmails > 0 ? ((emailMetrics?.failed || 0) / totalEmails * 100).toFixed(1) : "0.0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Emails</h1>
            <p className="mt-2 text-gray-600">
              Monitore e gerencie todos os emails enviados pelo sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleResendAllFailed} 
              variant="destructive" 
              size="sm"
              disabled={resendAllFailedMutation.isPending || (emailMetrics?.failed || 0) === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resendAllFailedMutation.isPending ? 'animate-spin' : ''}`} />
              Reenviar Falhados ({emailMetrics?.failed || 0})
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Emails</CardTitle>
              <Mail className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmails}</div>
              <p className="text-xs text-gray-600 mt-1">Enviados pelo sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{emailMetrics?.sent || 0}</div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span>{successRate}% de sucesso</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Falhados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{emailMetrics?.failed || 0}</div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span>{failureRate}% de falha</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{emailMetrics?.pending || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Aguardando envio</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine a visualização do histórico de emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por destinatário ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falhados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="goal_notification">Notificação de Meta</SelectItem>
                  <SelectItem value="evaluation_notification">Notificação de Avaliação</SelectItem>
                  <SelectItem value="test_invite">Convite para Teste</SelectItem>
                  <SelectItem value="pdi_notification">Notificação de PDI</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Emails */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Emails</CardTitle>
            <CardDescription>
              {filteredHistory.length} email(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando histórico...</p>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((email: any) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(email.sentAt || email.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{email.recipient}</TableCell>
                        <TableCell className="max-w-xs truncate">{email.subject || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {email.emailType === "goal_notification" && "Meta"}
                            {email.emailType === "evaluation_notification" && "Avaliação"}
                            {email.emailType === "test_invite" && "Teste"}
                            {email.emailType === "pdi_notification" && "PDI"}
                            {email.emailType === "system" && "Sistema"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {email.status === "sent" && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enviado
                            </Badge>
                          )}
                          {email.status === "failed" && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              <XCircle className="h-3 w-3 mr-1" />
                              Falhou
                            </Badge>
                          )}
                          {email.status === "pending" && (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {email.status === "failed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResend(email.id)}
                              disabled={resendEmailMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum email encontrado com os filtros aplicados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
