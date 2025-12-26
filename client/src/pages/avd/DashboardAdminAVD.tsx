import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Building2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";
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
import { Progress } from "@/components/ui/progress";

/**
 * Dashboard Administrativo AVD
 * Visão consolidada de todos os processos de avaliação
 * Com filtros avançados e exportação de dados
 */
export default function DashboardAdminAVD() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Verificar permissão
  if (user?.role !== "admin" && user?.role !== "rh") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-center text-muted-foreground">
                Acesso restrito a administradores e RH
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.avd.getAdminStats.useQuery(undefined);

  // Buscar processos
  const { data: processes, isLoading: loadingProcesses, refetch: refetchProcesses } = trpc.avd.listAllProcesses.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 100,
    offset: 0,
  });

  // Buscar dados para exportação
  const { data: exportData } = trpc.avd.getExportData.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery(undefined);

  // Filtrar processos localmente
  const filteredProcesses = useMemo(() => {
    if (isEmpty(processes)) return [];
    
    return safeFilter(processes, (item) => {
      // Filtro de busca por nome ou chapa
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = item.employee?.nome?.toLowerCase().includes(search);
        const matchesChapa = item.employee?.chapa?.toLowerCase().includes(search);
        if (!matchesName && !matchesChapa) return false;
      }
      
      // Filtro por departamento
      if (departmentFilter !== "all") {
        if (item.employee?.departamento !== departmentFilter) return false;
      }
      
      return true;
    });
  }, [processes, searchTerm, departmentFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      em_andamento: { variant: "default" as const, label: "Em Andamento", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      concluido: { variant: "secondary" as const, label: "Concluído", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      cancelado: { variant: "destructive" as const, label: "Cancelado", className: "bg-red-100 text-red-800 hover:bg-red-100" },
    };
    const config = variants[status as keyof typeof variants] || variants.em_andamento;
    return <Badge className={config.className}>{config.label}</Badge>;
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

  const getStepProgress = (step: number) => {
    return ((step - 1) / 4) * 100;
  };

  const handleViewProcess = (processId: number) => {
    setLocation(`/avd/processo/detalhes/${processId}`);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchProcesses();
    toast.success("Dados atualizados!");
  };

  const handleExportCSV = () => {
    if (!exportData || exportData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    setIsExporting(true);

    try {
      // Criar cabeçalhos
      const headers = [
        "ID Processo",
        "Nome Funcionário",
        "Chapa",
        "Cargo",
        "Departamento",
        "Status",
        "Passo Atual",
        "Data Criação",
        "Última Atualização",
        "Data Conclusão",
      ];

      // Criar linhas de dados
      const rows = safeMap(exportData, (item) => [
        item.processId,
        item.employeeName || "N/A",
        item.employeeChapa || "N/A",
        item.employeeCargo || "N/A",
        item.employeeDepartamento || "N/A",
        item.status === "em_andamento" ? "Em Andamento" : item.status === "concluido" ? "Concluído" : "Cancelado",
        getStepLabel(item.currentStep),
        item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "N/A",
        item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("pt-BR") : "N/A",
        item.completedAt ? new Date(item.completedAt).toLocaleDateString("pt-BR") : "N/A",
      ]);

      // Criar conteúdo CSV
      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
      ].join("\n");

      // Criar blob e download
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-avd-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calcular estatísticas adicionais
  const totalProcesses = (stats?.totalInProgress || 0) + (stats?.totalCompleted || 0);
  const completionRate = totalProcesses > 0 
    ? Math.round((stats?.totalCompleted || 0) / totalProcesses * 100) 
    : 0;

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard AVD</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhamento de todos os processos de avaliação
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalInProgress || 0}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
              Processos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalCompleted || 0}
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
              Processos finalizados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : `${completionRate}%`}
            </div>
            <Progress value={completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Total de Processos</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : totalProcesses}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Todos os processos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Passo */}
      {stats?.byStep && stats.byStep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Passo
            </CardTitle>
            <CardDescription>
              Processos em andamento por etapa do processo AVD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((step) => {
                const stepData = stats.byStep.find((s) => s.step === step);
                const count = stepData?.count || 0;
                const percentage = stats.totalInProgress > 0 
                  ? Math.round((count / stats.totalInProgress) * 100) 
                  : 0;
                
                return (
                  <div key={step} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {step}
                        </span>
                        <span className="font-medium">{getStepLabel(step)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e Lista de Processos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Processos AVD</CardTitle>
              <CardDescription>
                {filteredProcesses.length} processo(s) encontrado(s)
              </CardDescription>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou chapa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Departamentos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProcesses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum processo encontrado com os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Chapa</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((item) => (
                    <TableRow key={item.process.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {item.employee?.nome || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.employee?.chapa || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.employee?.departamento || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={getStepProgress(item.process.currentStep)} 
                            className="h-2 w-20" 
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {getStepLabel(item.process.currentStep)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.process.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.process.updatedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProcess(item.process.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
