import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, FileText, Mail, Play, Trash2, Plus, Download, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Relatórios Agendados
 * Permite configurar envio automático de relatórios por e-mail
 */
export default function ScheduledReports() {
  const { user, loading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Verificar se usuário é admin
  if (!loading && (!user || user.role !== "admin")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Apenas administradores podem gerenciar relatórios agendados.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Queries
  const { data: reports, isLoading, refetch } = trpc.scheduledReports.list.useQuery();

  // Mutations
  const createMutation = trpc.scheduledReports.create.useMutation({
    onSuccess: () => {
      toast.success("Relatório agendado criado com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar relatório: ${error.message}`);
    },
  });

  const deleteMutation = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Relatório agendado excluído!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const executeNowMutation = trpc.scheduledReports.executeNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao executar: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    reportType: "nine_box",
    reportName: "",
    frequency: "monthly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 9,
    recipients: "",
    format: "pdf",
    includeCharts: true,
    active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar recipients
    const recipientsArray = formData.recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipientsArray.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    createMutation.mutate({
      reportType: formData.reportType as any,
      reportName: formData.reportName,
      frequency: formData.frequency as any,
      dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.frequency === "monthly" || formData.frequency === "quarterly" ? formData.dayOfMonth : undefined,
      hour: formData.hour,
      recipients: recipientsArray,
      format: formData.format as any,
      includeCharts: formData.includeCharts,
      active: formData.active,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este relatório agendado?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExecuteNow = (id: number) => {
    if (confirm("Deseja executar este relatório agora?")) {
      executeNowMutation.mutate({ id });
    }
  };

  const reportTypeLabels: Record<string, string> = {
    nine_box: "Matriz 9-Box",
    performance: "Performance Geral",
    pdi: "PDI (Planos de Desenvolvimento)",
    evaluations: "Avaliações 360°",
    goals: "Metas",
    competencies: "Competências",
    succession: "Planos de Sucessão",
    turnover: "Turnover",
    headcount: "Headcount",
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
  };

  const formatLabels: Record<string, string> = {
    pdf: "PDF",
    excel: "Excel",
    csv: "CSV",
  };

  const dayOfWeekLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Agendados</h1>
          <p className="text-muted-foreground">Configure envio automático de relatórios por e-mail</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Relatório Agendado</DialogTitle>
              <DialogDescription>
                Configure um relatório para ser enviado automaticamente por e-mail
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Tipo de Relatório</Label>
                  <Select
                    value={formData.reportType}
                    onValueChange={(value) => setFormData({ ...formData, reportType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reportTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportName">Nome do Relatório</Label>
                  <Input
                    id="reportName"
                    value={formData.reportName}
                    onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                    placeholder="Ex: Relatório Mensal de Performance"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hour">Horário de Envio</Label>
                  <Select
                    value={formData.hour.toString()}
                    onValueChange={(value) => setFormData({ ...formData, hour: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.frequency === "weekly" && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                  <Select
                    value={formData.dayOfWeek.toString()}
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOfWeekLabels.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.frequency === "monthly" || formData.frequency === "quarterly") && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                  <Select
                    value={formData.dayOfMonth.toString()}
                    onValueChange={(value) => setFormData({ ...formData, dayOfMonth: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Dia {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
                <Input
                  id="recipients"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Adicione múltiplos e-mails separados por vírgula
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Formato do Arquivo</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(formatLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="includeCharts">Incluir Gráficos</Label>
                  <Switch
                    id="includeCharts"
                    checked={formData.includeCharts}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Relatório"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando relatórios...</div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => {
            const recipients = JSON.parse(report.recipients);
            
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {report.reportName}
                        {report.active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {reportTypeLabels[report.reportType]} • {formatLabels[report.format]}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecuteNow(report.id)}
                        disabled={executeNowMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar Agora
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(report.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Frequência</p>
                        <p className="text-muted-foreground">{frequencyLabels[report.frequency]}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Horário</p>
                        <p className="text-muted-foreground">
                          {report.hour.toString().padStart(2, "0")}:00
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Destinatários</p>
                        <p className="text-muted-foreground">{recipients.length} e-mail(s)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Última Execução</p>
                        <p className="text-muted-foreground">
                          {report.lastExecutedAt
                            ? format(new Date(report.lastExecutedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "Nunca"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {report.nextExecutionAt && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Próxima execução:</strong>{" "}
                        {format(new Date(report.nextExecutionAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum relatório agendado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro relatório automático para receber atualizações por e-mail
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
