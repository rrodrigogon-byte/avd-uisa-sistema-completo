import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Users, 
  RefreshCw,
  Bell,
  TrendingUp,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  Shield
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

export default function MonitoramentoAprovadores() {
  const [checking, setChecking] = useState(false);

  // Buscar dashboard
  const dashboardQuery = trpc.approverMonitoring.getDashboard.useQuery(undefined, {
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  // Mutation para verificar e enviar alertas
  const checkMutation = trpc.approverMonitoring.checkAndAlert.useMutation({
    onSuccess: (data) => {
      setChecking(false);
      
      if (data.alertsSent > 0) {
        toast.success(`${data.alertsSent} alerta(s) enviado(s) com sucesso!`);
      } else {
        toast.info("Nenhum problema detectado. Sistema funcionando normalmente.");
      }
      
      // Refetch dashboard
      dashboardQuery.refetch();
    },
    onError: (error) => {
      setChecking(false);
      toast.error(`Erro ao verificar aprovadores: ${error.message}`);
    },
  });

  const handleCheck = () => {
    setChecking(true);
    checkMutation.mutate();
  };

  const dashboard = dashboardQuery.data;

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Monitoramento de Aprovadores</h1>
          <p className="text-muted-foreground">
            Acompanhe o status dos aprovadores e receba alertas sobre problemas
          </p>
        </div>

        <Button onClick={handleCheck} disabled={checking || dashboardQuery.isLoading}>
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Verificar e Alertar
            </>
          )}
        </Button>
      </div>

      {/* Alertas Críticos */}
      {dashboard?.alerts.criticalIssues && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Problemas Detectados!</AlertTitle>
          <AlertDescription>
            {dashboard.summary.employeeInactive > 0 && (
              <div>
                • {dashboard.summary.employeeInactive} aprovador(es) com funcionários inativos
              </div>
            )}
            {dashboard.alerts.rolesWithoutApprovers.length > 0 && (
              <div>
                • {dashboard.alerts.rolesWithoutApprovers.length} papel(éis) sem aprovadores ativos
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Aprovadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold">
                {dashboardQuery.isLoading ? "..." : dashboard?.summary.total || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-green-600">
                {dashboardQuery.isLoading ? "..." : dashboard?.summary.active || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadores Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-red-600">
                {dashboardQuery.isLoading ? "..." : dashboard?.summary.employeeInactive || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Papéis Sem Aprovadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="text-3xl font-bold text-orange-600">
                {dashboardQuery.isLoading
                  ? "..."
                  : dashboard?.summary.rolesWithoutApprovers || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status por Papel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status por Papel de Aprovação
          </CardTitle>
          <CardDescription>
            Visualização detalhada do status de aprovadores por papel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboard?.byRole && dashboard.byRole.length > 0 ? (
            <div className="space-y-4">
              {dashboard.byRole.map((role: any) => (
                <Card key={role.roleCode}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{role.roleName}</CardTitle>
                        <CardDescription className="text-xs">
                          {role.roleCode}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={role.active > 0 ? "default" : "destructive"}>
                          {role.active} Ativo{role.active !== 1 ? "s" : ""}
                        </Badge>
                        {role.employeeInactive > 0 && (
                          <Badge variant="destructive">
                            {role.employeeInactive} Inativo{role.employeeInactive !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aprovador</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {role.approvers.map((approver: any) => (
                          <TableRow key={approver.id}>
                            <TableCell className="font-medium">
                              {approver.employeeName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {approver.employeeEmail || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {approver.isPrimary ? "Principal" : "Secundário"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {approver.status === "active" ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Ativo
                                </Badge>
                              ) : approver.status === "employee_inactive" ? (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Funcionário Inativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Atribuição Inativa
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aprovador cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Papéis Sem Aprovadores */}
      {dashboard?.alerts.rolesWithoutApprovers &&
        dashboard.alerts.rolesWithoutApprovers.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Papéis Sem Aprovadores Ativos</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {dashboard.alerts.rolesWithoutApprovers.map((roleName: string, idx: number) => (
                  <div key={idx}>• {roleName}</div>
                ))}
              </div>
              <div className="mt-3">
                <Button size="sm" variant="outline" asChild>
                  <a href="/admin/gestao-aprovadores">
                    Atribuir Aprovadores
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
