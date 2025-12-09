import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Mail, TrendingUp, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Dashboard Administrativo Avançado
 * Visão geral de processos avaliativos, estatísticas e relatórios gerenciais
 */
export default function DashboardAdmin() {
  const [selectedProcessId, setSelectedProcessId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Queries
  const { data: processes, isLoading: loadingProcesses } = trpc.evaluationProcesses.list.useQuery({
    status: undefined,
    limit: 100,
  });

  const { data: stats, isLoading: loadingStats } = trpc.evaluationProcesses.getStatistics.useQuery(
    {
      processId: selectedProcessId,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
    },
    { enabled: true }
  );

  const { data: emailLogs, isLoading: loadingEmails } = trpc.emailNotifications.getEmailLogs.useQuery({
    processId: selectedProcessId,
    limit: 50,
  });

  // Mutations
  const sendRemindersMutation = trpc.emailNotifications.sendPendingEvaluationReminders.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.remindersSent} lembretes enviados com sucesso!`);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar lembretes: ${error.message}`);
    },
  });

  const exportReportMutation = trpc.consolidatedReports.exportConsolidatedReport.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório exportado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao exportar relatório: ${error.message}`);
    },
  });

  const handleSendReminders = () => {
    if (!selectedProcessId) {
      toast.error("Selecione um processo primeiro");
      return;
    }
    sendRemindersMutation.mutate({ processId: selectedProcessId, daysBeforeDue: 3 });
  };

  const handleExportReport = (format: "pdf" | "excel") => {
    if (!selectedProcessId) {
      toast.error("Selecione um processo primeiro");
      return;
    }
    exportReportMutation.mutate({ processId: selectedProcessId, format });
  };

  // Dados para gráficos
  const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];

  const statusData = stats
    ? [
        { name: "Concluídas", value: stats.completedEvaluations },
        { name: "Em Andamento", value: stats.inProgressEvaluations },
        { name: "Pendentes", value: stats.pendingEvaluations },
      ]
    : [];

  const progressData = stats
    ? [
        { name: "Autoavaliações", value: stats.selfEvaluationsCompleted },
        { name: "Avaliações de Gestor", value: stats.managerEvaluationsCompleted },
        { name: "Avaliações de Pares", value: stats.peerEvaluationsCompleted },
      ]
    : [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral e gestão de processos avaliativos</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione um processo e período para visualizar estatísticas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Processo Avaliativo</Label>
              <Select
                value={selectedProcessId?.toString()}
                onValueChange={(value) => setSelectedProcessId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  {processes?.items.map((process) => (
                    <SelectItem key={process.id} value={process.id.toString()}>
                      {process.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingStats ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avaliações Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedEvaluations}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalEvaluations > 0
                    ? `${((stats.completedEvaluations / stats.totalEvaluations) * 100).toFixed(1)}% do total`
                    : "0% do total"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressEvaluations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingEvaluations}</div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Gerenciar processo selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSendReminders} disabled={!selectedProcessId || sendRemindersMutation.isPending}>
                  {sendRemindersMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Enviar Lembretes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport("pdf")}
                  disabled={!selectedProcessId || exportReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport("excel")}
                  disabled={!selectedProcessId || exportReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status das Avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progresso por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Logs de Email */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Emails</CardTitle>
              <CardDescription>Últimos emails enviados pelo sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEmails ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : emailLogs && emailLogs.length > 0 ? (
                <div className="space-y-2">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{log.subject}</p>
                        <p className="text-sm text-muted-foreground">{log.to}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${log.status === "sent" ? "text-green-600" : "text-red-600"}`}>
                          {log.status === "sent" ? "Enviado" : "Falhou"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum email enviado ainda</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Selecione um processo para visualizar estatísticas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
