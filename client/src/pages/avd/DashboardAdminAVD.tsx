import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/**
 * Dashboard Administrativo AVD
 * Visão consolidada de todos os processos de avaliação
 */
export default function DashboardAdminAVD() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Verificar permissão
  if (user?.role !== "admin" && user?.role !== "rh") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Acesso restrito a administradores e RH
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = trpc.avd.getAdminStats.useQuery();

  // Buscar processos
  const { data: processes, isLoading: loadingProcesses } = trpc.avd.listAllProcesses.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 50,
    offset: 0,
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      em_andamento: { variant: "default" as const, label: "Em Andamento" },
      concluido: { variant: "secondary" as const, label: "Concluído" },
      cancelado: { variant: "destructive" as const, label: "Cancelado" },
    };
    const config = variants[status as keyof typeof variants] || variants.em_andamento;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStepLabel = (step: number) => {
    const labels = {
      1: "Dados Pessoais",
      2: "PIR",
      3: "Competências",
      4: "Desempenho",
      5: "PDI",
    };
    return labels[step as keyof typeof labels] || `Passo ${step}`;
  };

  const handleViewProcess = (processId: number) => {
    setLocation(`/avd/processo/detalhes/${processId}`);
  };

  const handleExportData = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard AVD</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhamento de todos os processos de avaliação
          </p>
        </div>
        <Button onClick={handleExportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "..." : stats?.totalInProgress || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Processos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "..." : stats?.totalCompleted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Processos finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats
                ? "..."
                : `${Math.round(
                    ((stats?.totalCompleted || 0) /
                      ((stats?.totalInProgress || 0) + (stats?.totalCompleted || 0) || 1)) *
                      100
                  )}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Processos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats
                ? "..."
                : (stats?.totalInProgress || 0) + (stats?.totalCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos os processos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Passo */}
      {stats?.byStep && stats.byStep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Passo</CardTitle>
            <CardDescription>
              Processos em andamento por etapa do processo AVD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byStep.map((item) => (
                <div key={item.step} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 font-medium">{getStepLabel(item.step)}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.count / (stats.totalInProgress || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Processos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processos AVD</CardTitle>
              <CardDescription>
                Lista de todos os processos de avaliação
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProcesses ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando processos...
            </div>
          ) : !processes || processes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum processo encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Chapa</TableHead>
                  <TableHead>Passo Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((item) => (
                  <TableRow key={item.process.id}>
                    <TableCell className="font-medium">
                      {item.employee?.nome || "N/A"}
                    </TableCell>
                    <TableCell>{item.employee?.chapa || "N/A"}</TableCell>
                    <TableCell>{getStepLabel(item.process.currentStep)}</TableCell>
                    <TableCell>{getStatusBadge(item.process.status)}</TableCell>
                    <TableCell>
                      {new Date(item.process.updatedAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProcess(item.process.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
