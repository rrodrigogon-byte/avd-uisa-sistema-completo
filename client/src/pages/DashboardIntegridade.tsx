import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  BarChart3,
  UserCheck,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    variant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    variant: "default" as const,
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    variant: "secondary" as const,
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
    variant: "outline" as const,
  },
};

export default function DashboardIntegridade() {
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);

  const { data: metricsData, isLoading } = trpc.orgChart.getIntegrityMetrics.useQuery({
    departmentId: selectedDepartment,
  });

  const { data: departments } = trpc.departments.list.useQuery();

  const getSpanOfControlStatus = (count: number) => {
    if (count <= 5) return { label: "Ideal", variant: "outline" as const, color: "text-green-600" };
    if (count <= 8) return { label: "Adequado", variant: "secondary" as const, color: "text-blue-600" };
    if (count <= 10) return { label: "Alto", variant: "default" as const, color: "text-yellow-600" };
    return { label: "Crítico", variant: "destructive" as const, color: "text-destructive" };
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Integridade Organizacional</h1>
            <p className="text-muted-foreground mt-2">
              Análise de métricas e alertas sobre a saúde da estrutura hierárquica
            </p>
          </div>
          <div className="w-64">
            <Select
              value={selectedDepartment?.toString() || "all"}
              onValueChange={(value) =>
                setSelectedDepartment(value === "all" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments?.departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricsData?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Funcionários ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sem Gestor</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsData?.employeesWithoutManager || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CEOs/Diretores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profundidade Máxima</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsData?.maxHierarchyDepth || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Níveis hierárquicos
                  </p>
                  {metricsData && metricsData.maxHierarchyDepth > 6 && (
                    <Badge variant="destructive" className="mt-2">
                      Acima do recomendado
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Span of Control Médio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsData?.averageSpanOfControl?.toFixed(1) || "0.0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subordinados por gestor
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas */}
            {metricsData?.alerts && metricsData.alerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Alertas de Integridade</h2>
                <div className="grid gap-4">
                  {metricsData.alerts.map((alert, index) => {
                    const config = severityConfig[alert.severity as keyof typeof severityConfig];
                    const Icon = config.icon;

                    return (
                      <Alert key={index} className={config.bgColor}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <AlertTitle className={config.color}>{alert.message}</AlertTitle>
                        <AlertDescription>
                          {alert.type === "span_of_control_high" && alert.data && (
                            <div className="mt-2">
                              <p className="text-sm mb-2">Gestores afetados:</p>
                              <ul className="text-sm space-y-1">
                                {(alert.data as any[]).slice(0, 5).map((manager: any) => (
                                  <li key={manager.managerId}>
                                    <strong>{manager.managerName}</strong>:{" "}
                                    {manager.subordinateCount} subordinados
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribuição de Span of Control */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Span of Control</CardTitle>
                <CardDescription>
                  Número de subordinados diretos por gestor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!metricsData?.spanOfControlDistribution ||
                metricsData.spanOfControlDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum dado disponível</p>
                    <p className="text-sm mt-2">
                      Configure a hierarquia para visualizar as métricas
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gestor</TableHead>
                          <TableHead className="text-right">Subordinados Diretos</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metricsData.spanOfControlDistribution
                          .sort((a, b) => b.subordinateCount - a.subordinateCount)
                          .map((item) => {
                            const status = getSpanOfControlStatus(item.subordinateCount);
                            return (
                              <TableRow key={item.managerId}>
                                <TableCell className="font-medium">
                                  {item.managerName || `Gestor #${item.managerId}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-semibold ${status.color}`}>
                                    {item.subordinateCount}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recomendações */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
                <CardDescription>
                  Sugestões para melhorar a integridade organizacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Span of Control Ideal
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Mantenha entre 5-8 subordinados diretos por gestor para garantir supervisão
                    adequada e comunicação eficaz.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Profundidade Hierárquica
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Limite a hierarquia a no máximo 6 níveis para evitar burocracia excessiva e
                    melhorar a agilidade organizacional.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Balanceamento de Carga
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Redistribua subordinados de gestores sobrecarregados (mais de 10 subordinados) para
                    melhorar a eficiência e qualidade da gestão.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
