import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function AlertsDashboard() {
  const { user } = useAuth();
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Buscar alertas
  const { data: alerts = [], isLoading, refetch } = trpc.alerts.list.useQuery({
    limit: 100,
  });

  // Mutations
  const markAsReadMutation = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Alerta marcado como lido");
      refetch();
    },
  });

  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alerta resolvido");
      refetch();
    },
  });

  // Filtrar alertas
  const filteredAlerts = selectedSeverity
    ? alerts.filter(a => a.severity === selectedSeverity)
    : alerts;

  // Contar alertas por severidade
  const severityCounts = {
    critical: alerts.filter(a => a.severity === "critical").length,
    high: alerts.filter(a => a.severity === "high").length,
    medium: alerts.filter(a => a.severity === "medium").length,
    low: alerts.filter(a => a.severity === "low").length,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "high":
        return <Zap className="w-5 h-5 text-orange-600" />;
      case "medium":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Alertas</h1>
          <p className="text-gray-600">Monitore metas críticas e receba notificações em tempo real</p>
        </div>

        {/* Resumo de Alertas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{severityCounts.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Altos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{severityCounts.high}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Médios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{severityCounts.medium}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Baixos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{severityCounts.low}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={selectedSeverity === null ? "default" : "outline"}
            onClick={() => setSelectedSeverity(null)}
          >
            Todos ({alerts.length})
          </Button>
          <Button
            variant={selectedSeverity === "critical" ? "default" : "outline"}
            onClick={() => setSelectedSeverity("critical")}
            className="border-red-200"
          >
            Críticos ({severityCounts.critical})
          </Button>
          <Button
            variant={selectedSeverity === "high" ? "default" : "outline"}
            onClick={() => setSelectedSeverity("high")}
            className="border-orange-200"
          >
            Altos ({severityCounts.high})
          </Button>
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Carregando alertas...
              </CardContent>
            </Card>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhum alerta encontrado
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map(alert => (
              <Card key={alert.id} className={alert.isRead ? "opacity-75" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{alert.goalTitle}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.isRead === 0 && (
                            <Badge variant="secondary">Novo</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          Progresso atual: <strong>{alert.currentProgress}%</strong>
                        </p>
                        {alert.actionTaken && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ Ação tomada: {alert.actionTaken}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 ml-4">
                      {alert.isRead === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate({ alertId: alert.id })}
                          disabled={markAsReadMutation.isPending}
                        >
                          Marcar Lido
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate({
                          alertId: alert.id,
                          actionTaken: "Revisado e planejado"
                        })}
                        disabled={resolveMutation.isPending || !!alert.actionTaken}
                      >
                        Resolver
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
