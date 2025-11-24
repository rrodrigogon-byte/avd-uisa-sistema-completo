import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ReportsManagement() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    reportType: "goals" as const,
    format: "pdf" as const,
    frequency: "weekly" as const,
    recipients: "",
  });

  // Buscar relatórios
  const { data: reports = [], isLoading, refetch } = trpc.reports.list.useQuery();

  // Mutations
  const createMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Relatório agendado criado");
      setFormData({ name: "", reportType: "goals", format: "pdf", frequency: "weekly", recipients: "" });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar relatório");
    },
  });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      toast.success("Relatório removido");
      refetch();
    },
  });

  const updateMutation = trpc.reports.update.useMutation({
    onSuccess: () => {
      toast.success("Relatório atualizado");
      refetch();
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Nome do relatório é obrigatório");
      return;
    }

    createMutation.mutate(formData);
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      goals: "Metas SMART",
      alerts: "Alertas Críticos",
      performance: "Desempenho",
      summary: "Resumo Executivo",
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
    };
    return labels[freq] || freq;
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      pdf: "PDF",
      excel: "Excel",
      csv: "CSV",
    };
    return labels[format] || format;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Relatórios</h1>
            <p className="text-gray-600">Crie e gerencie relatórios agendados para stakeholders</p>
          </div>

          {/* Botão Novo Relatório */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Novo Relatório</DialogTitle>
                <DialogDescription>
                  Configure um relatório para ser gerado e enviado automaticamente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Relatório</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Relatório Mensal de Metas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportType">Tipo</Label>
                    <Select value={formData.reportType} onValueChange={(value: any) => setFormData({ ...formData, reportType: value })}>
                      <SelectTrigger id="reportType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goals">Metas SMART</SelectItem>
                        <SelectItem value="alerts">Alertas Críticos</SelectItem>
                        <SelectItem value="performance">Desempenho</SelectItem>
                        <SelectItem value="summary">Resumo Executivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format">Formato</Label>
                    <Select value={formData.format} onValueChange={(value: any) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recipients">Destinatários (emails separados por vírgula)</Label>
                  <Input
                    id="recipients"
                    placeholder="user@example.com, admin@example.com"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Relatório"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Relatórios */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Carregando relatórios...
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhum relatório agendado. Crie um novo para começar!
              </CardContent>
            </Card>
          ) : (
            reports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{report.name}</h3>
                          <Badge variant="outline">
                            {getReportTypeLabel(report.reportType)}
                          </Badge>
                          <Badge variant="secondary">
                            {getFormatLabel(report.format)}
                          </Badge>
                          {report.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Frequência:</span> {getFrequencyLabel(report.frequency)}
                          </div>
                          <div>
                            <span className="font-medium">Próxima execução:</span>{" "}
                            {report.nextExecution
                              ? new Date(report.nextExecution).toLocaleDateString("pt-BR")
                              : "Não agendada"}
                          </div>
                          <div>
                            <span className="font-medium">Última execução:</span>{" "}
                            {report.lastExecuted
                              ? new Date(report.lastExecuted).toLocaleDateString("pt-BR")
                              : "Nunca"}
                          </div>
                        </div>

                        {report.recipients && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Destinatários:</span> {report.recipients}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newActive = report.isActive ? 0 : 1;
                          updateMutation.mutate({
                            reportId: report.id,
                            isActive: newActive,
                          });
                        }}
                      >
                        {report.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate({ reportId: report.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
