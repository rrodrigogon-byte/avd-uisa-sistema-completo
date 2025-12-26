import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react";

/**
 * Dashboard de Analytics de Metas SMART
 * Análise avançada com gráficos de tendências, taxas de aprovação e métricas
 */
export default function AnalyticsMetas() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Buscar dados de analytics
  const { data: analytics, isLoading } = trpc.goals.getAnalytics.useQuery({
    period: parseInt(selectedPeriod),
    departmentId: selectedDepartment === "all" ? undefined : parseInt(selectedDepartment),
  });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery({});

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200]"></div>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    overdueGoals: 0,
    approvalRate: 0,
    avgCompletionTime: 0,
  };

  const trends = analytics?.trends || [];
  const byDepartment = analytics?.byDepartment || [];
  const byCategory = analytics?.byCategory || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#F39200]" />
            Analytics de Metas SMART
          </h1>
          <p className="text-gray-600 mt-2">
            Análise detalhada de performance e tendências
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {departments?.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-[#F39200]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-gray-600 mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalGoals > 0
                ? ((stats.completedGoals / stats.totalGoals) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.completedGoals} de {stats.totalGoals} metas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-600 mt-1">Metas aprovadas no 1º nível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletionTime}</div>
            <p className="text-xs text-gray-600 mt-1">Dias para conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Conclusão de Metas</CardTitle>
          <CardDescription>Evolução ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map((trend: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">{trend.period}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-[#F39200] h-full flex items-center justify-end pr-2 text-white text-xs font-bold"
                          style={{
                            width: `${Math.min((trend.completed / trend.total) * 100, 100)}%`,
                          }}
                        >
                          {trend.total > 0
                            ? `${((trend.completed / trend.total) * 100).toFixed(0)}%`
                            : ""}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-24">
                        {trend.completed}/{trend.total}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Sem dados de tendências no período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Departamento</CardTitle>
          <CardDescription>Taxa de aprovação e conclusão por área</CardDescription>
        </CardHeader>
        <CardContent>
          {byDepartment.length > 0 ? (
            <div className="space-y-4">
              {byDepartment.map((dept: any) => (
                <div key={dept.departmentId} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{dept.departmentName}</h4>
                    <Badge variant="outline">{dept.totalGoals} metas</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Taxa de Aprovação</p>
                      <p className="text-lg font-bold text-green-600">
                        {dept.approvalRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Taxa de Conclusão</p>
                      <p className="text-lg font-bold text-blue-600">
                        {dept.completionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Sem dados de departamentos no período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio de Conclusão por Categoria</CardTitle>
          <CardDescription>Análise de eficiência por tipo de meta</CardDescription>
        </CardHeader>
        <CardContent>
          {byCategory.length > 0 ? (
            <div className="space-y-3">
              {byCategory.map((cat: any) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-40">
                    <Badge className="bg-[#F39200]">{cat.category}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{cat.avgDays} dias</span>
                      <span className="text-sm text-gray-600">
                        ({cat.totalGoals} metas)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Sem dados de categorias no período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metas em Risco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Metas em Risco
          </CardTitle>
          <CardDescription>Metas atrasadas ou sem progresso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold">Atrasadas</h4>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.overdueGoals}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalGoals > 0
                  ? ((stats.overdueGoals / stats.totalGoals) * 100).toFixed(1)
                  : 0}
                % do total
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold">Em Andamento</h4>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{stats.inProgressGoals}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalGoals > 0
                  ? ((stats.inProgressGoals / stats.totalGoals) * 100).toFixed(1)
                  : 0}
                % do total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
