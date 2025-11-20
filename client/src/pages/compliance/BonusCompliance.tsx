import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, CheckCircle2, TrendingUp, TrendingDown, Download, Filter } from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { format, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function BonusCompliance() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  const { data: calculations } = trpc.bonus.listCalculations.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: approvalMetrics } = trpc.bonus.getApprovalMetrics.useQuery();
  const { data: slaMetrics, isLoading: slaLoading } = trpc.bonus.getSLAMetrics.useQuery({
    departmentId: selectedDepartment === "all" ? undefined : parseInt(selectedDepartment),
    days: selectedPeriod,
  });

  // Filtrar dados por departamento e período
  const filteredData = useMemo(() => {
    if (!calculations) return [];
    
    const cutoffDate = subDays(new Date(), selectedPeriod);
    
    return calculations.filter((calc: any) => {
      const matchesDept = selectedDepartment === "all" || calc.departmentId?.toString() === selectedDepartment;
      const matchesPeriod = new Date(calc.calculatedAt) >= cutoffDate;
      return matchesDept && matchesPeriod;
    });
  }, [calculations, selectedDepartment, selectedPeriod]);

  // Calcular métricas de compliance
  const complianceMetrics = useMemo(() => {
    if (!filteredData.length) return null;

    const total = filteredData.length;
    const approved = filteredData.filter((c: any) => c.status === "aprovado").length;
    const rejected = filteredData.filter((c: any) => c.status === "rejeitado").length;
    const pending = filteredData.filter((c: any) => c.status === "calculado").length;

    // Calcular tempo médio de aprovação (em dias)
    const approvedWithDates = filteredData.filter((c: any) => c.status === "aprovado" && c.approvedAt && c.calculatedAt);
    const avgApprovalTime = approvedWithDates.length > 0
      ? approvedWithDates.reduce((sum: number, c: any) => {
          return sum + differenceInDays(new Date(c.approvedAt), new Date(c.calculatedAt));
        }, 0) / approvedWithDates.length
      : 0;

    // Identificar bônus pendentes há mais de X dias
    const criticalPending = filteredData.filter((c: any) => {
      if (c.status !== "calculado") return false;
      const daysPending = differenceInDays(new Date(), new Date(c.calculatedAt));
      return daysPending > 7; // SLA de 7 dias
    });

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: (approved / total) * 100,
      rejectionRate: (rejected / total) * 100,
      avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
      criticalPending: criticalPending.length,
      slaCompliance: ((total - criticalPending.length) / total) * 100,
    };
  }, [filteredData]);

  // Dados para gráfico de tempo médio por departamento
  const avgTimeByDept = useMemo(() => {
    if (!calculations || !departments) return null;

    const deptData = departments.map((dept: any) => {
      const deptCalcs = calculations.filter((c: any) => 
        c.departmentId === dept.id && 
        c.status === "aprovado" && 
        c.approvedAt && 
        c.calculatedAt
      );

      const avgTime = deptCalcs.length > 0
        ? deptCalcs.reduce((sum: number, c: any) => {
            return sum + differenceInDays(new Date(c.approvedAt), new Date(c.calculatedAt));
          }, 0) / deptCalcs.length
        : 0;

      return {
        name: dept.name,
        avgTime: Math.round(avgTime * 10) / 10,
      };
    });

    return {
      labels: deptData.map(d => d.name.substring(0, 20)),
      datasets: [
        {
          label: "Tempo Médio (dias)",
          data: deptData.map(d => d.avgTime),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [calculations, departments]);

  // Dados para gráfico de distribuição de status
  const statusDistribution = useMemo(() => {
    if (!complianceMetrics) return null;

    return {
      labels: ["Aprovados", "Rejeitados", "Pendentes"],
      datasets: [
        {
          data: [complianceMetrics.approved, complianceMetrics.rejected, complianceMetrics.pending],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(251, 191, 36, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(239, 68, 68)",
            "rgb(251, 191, 36)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [complianceMetrics]);

  // Dados para gráfico de evolução temporal
  const timelineData = useMemo(() => {
    if (!filteredData.length) return null;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, "dd/MM");
    });

    const approvedByDay = last7Days.map((day) => {
      return filteredData.filter((c: any) => {
        if (c.status !== "aprovado" || !c.approvedAt) return false;
        return format(new Date(c.approvedAt), "dd/MM") === day;
      }).length;
    });

    const rejectedByDay = last7Days.map((day) => {
      return filteredData.filter((c: any) => {
        if (c.status !== "rejeitado" || !c.approvedAt) return false;
        return format(new Date(c.approvedAt), "dd/MM") === day;
      }).length;
    });

    return {
      labels: last7Days,
      datasets: [
        {
          label: "Aprovados",
          data: approvedByDay,
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
        },
        {
          label: "Rejeitados",
          data: rejectedByDay,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
        },
      ],
    };
  }, [filteredData]);

  if (!complianceMetrics) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dados de compliance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Compliance e SLA</h1>
        <p className="text-muted-foreground">
          Monitore o cumprimento de prazos e conformidade nas aprovações de bônus
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments?.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(Number(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs de Compliance */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {complianceMetrics.approved} de {complianceMetrics.total} aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.avgApprovalTime} dias</div>
            <p className="text-xs text-muted-foreground">
              Para aprovação de bônus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceMetrics.criticalPending}</div>
            <p className="text-xs text-muted-foreground">
              Pendentes há mais de 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance SLA</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.slaCompliance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Dentro do prazo de 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Não Conformidade */}
      {complianceMetrics.criticalPending > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Alertas de Não Conformidade</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              Existem {complianceMetrics.criticalPending} bônus pendentes há mais de 7 dias que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">
              Ver Bônus Pendentes Críticos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Aprovações (7 dias)</CardTitle>
            <CardDescription>Aprovações e rejeições por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineData && <Line data={timelineData} options={{ responsive: true, maintainAspectRatio: true }} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Status atual dos bônus</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statusDistribution && <Doughnut data={statusDistribution} options={{ responsive: true, maintainAspectRatio: true }} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio de Aprovação por Departamento</CardTitle>
          <CardDescription>Comparação de performance entre departamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {avgTimeByDept && <Bar data={avgTimeByDept} options={{ responsive: true, maintainAspectRatio: true, indexAxis: "y" }} />}
        </CardContent>
      </Card>
    </div>
  );
}
