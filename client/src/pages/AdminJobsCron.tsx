import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, CheckCircle2, Clock, Mail, Play, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Página de administração de jobs cron
 * Permite visualizar status, executar manualmente e gerenciar agendamentos
 */
export default function AdminJobsCron() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);

  const runJobMutation = trpc.pirIntegrity.runNotificationJobManually.useMutation({
    onSuccess: (data) => {
      toast.success("Job executado com sucesso!", {
        description: `${data.reminders.sent} lembretes enviados`,
      });
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error("Erro ao executar job", {
        description: error.message,
      });
      setIsRunning(false);
    },
  });

  const statusQuery = trpc.pirIntegrity.getJobStatus.useQuery(undefined, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const handleRunJob = () => {
    setIsRunning(true);
    runJobMutation.mutate();
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administração de Jobs Cron</h1>
        <p className="text-muted-foreground">
          Gerencie agendamentos automáticos e execute jobs manualmente para testes e manutenção
        </p>
      </div>

      <div className="grid gap-6">
        {/* Card de Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status dos Jobs Agendados
            </CardTitle>
            <CardDescription>Visualize o status e próximas execuções dos jobs automáticos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job de Notificações Diárias */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Notificações PIR Integridade</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envia lembretes automáticos para testes próximos de expirar
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Ativo</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Frequência</p>
                  <p className="font-medium">Diário às 9h (horário de Brasília)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Próxima Execução</p>
                  <p className="font-medium">{getNextExecutionTime()}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">Critérios de Envio</p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Testes com status pendente ou em andamento</li>
                      <li>Que expiram nos próximos 3 dias</li>
                      <li>Criados há mais de 1 dia</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Estatísticas */}
        {statusQuery.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estatísticas Atuais
              </CardTitle>
              <CardDescription>Dados em tempo real dos testes PIR Integridade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Total de Testes" value={statusQuery.data.total} color="blue" />
                <StatCard label="Pendentes" value={statusQuery.data.pending} color="yellow" />
                <StatCard label="Em Andamento" value={statusQuery.data.inProgress} color="blue" />
                <StatCard label="Concluídos" value={statusQuery.data.completed} color="green" />
                <StatCard label="Expirados" value={statusQuery.data.expired} color="red" />
                <StatCard
                  label="Expirando em 3 dias"
                  value={statusQuery.data.expiringIn3Days}
                  color="orange"
                  highlight
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Execução Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execução Manual
            </CardTitle>
            <CardDescription>Execute o job de notificações imediatamente para testes ou manutenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">Atenção</p>
                  <p className="text-sm text-amber-700">
                    A execução manual enviará lembretes reais para todos os candidatos que atendem aos critérios.
                    Use apenas para testes ou quando necessário.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleRunJob} disabled={isRunning} className="gap-2">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Executar Job Agora
                </>
              )}
            </Button>

            {runJobMutation.data && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Resultado da Execução</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <p>
                    <strong>Lembretes enviados:</strong> {runJobMutation.data.reminders.sent}
                  </p>
                  <p>
                    <strong>Falhas:</strong> {runJobMutation.data.reminders.failed}
                  </p>
                  <Separator className="my-2" />
                  <p>
                    <strong>Status dos testes:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Total: {runJobMutation.data.report.total}</li>
                    <li>Pendentes: {runJobMutation.data.report.pending}</li>
                    <li>Em andamento: {runJobMutation.data.report.inProgress}</li>
                    <li>Concluídos: {runJobMutation.data.report.completed}</li>
                    <li>Expirados: {runJobMutation.data.report.expired}</li>
                    <li>Expirando em 3 dias: {runJobMutation.data.report.expiringIn3Days}</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "red" | "orange";
  highlight?: boolean;
}

function StatCard({ label, value, color, highlight }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} ${
        highlight ? "ring-2 ring-offset-2 ring-orange-400" : ""
      }`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function getNextExecutionTime(): string {
  const now = new Date();
  const next = new Date();
  next.setHours(9, 0, 0, 0);

  // Se já passou das 9h hoje, agendar para amanhã
  if (now.getHours() >= 9) {
    next.setDate(next.getDate() + 1);
  }

  return next.toLocaleString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
