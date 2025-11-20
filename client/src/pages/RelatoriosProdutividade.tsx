import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, TrendingUp, Users, Clock, Download, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RelatoriosProdutividade() {
  const [period, setPeriod] = useState("30");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const { data: productivityData } = trpc.productivity.getReport.useQuery({
    days: parseInt(period),
    departmentId: departmentFilter === "all" ? undefined : parseInt(departmentFilter),
  });

  const { data: departments } = trpc.departments.list.useQuery();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      reuniao: "bg-blue-500",
      analise: "bg-purple-500",
      planejamento: "bg-green-500",
      execucao: "bg-orange-500",
      suporte: "bg-yellow-500",
      outros: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const exportToExcel = () => {
    // TODO: Implementar exportação Excel
    console.log("Exportar para Excel");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios de Produtividade</h1>
            <p className="text-muted-foreground">Análise comparativa de atividades e responsabilidades</p>
          </div>
          <Button onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Departamento</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Total de Horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{productivityData?.totalHours || 0}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos {period} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Funcionários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{productivityData?.activeEmployees || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Com atividades registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Taxa de Aderência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {productivityData?.adherenceRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atividades vs Responsabilidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Média por Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{productivityData?.avgHoursPerEmployee || 0}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Horas/funcionário
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Distribuição por Categoria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribuição de Tempo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productivityData?.categoryDistribution?.map((item: any) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getCategoryColor(item.category)}`} />
                      <span className="font-medium capitalize">{item.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColor(item.category)}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Funcionários Mais Produtivos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 10 Funcionários Mais Produtivos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Horas Registradas</TableHead>
                  <TableHead>Atividades</TableHead>
                  <TableHead>Taxa de Aderência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productivityData?.topEmployees?.map((emp: any, index: number) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <span className="text-2xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        )}
                        {index >= 3 && <span className="font-bold">#{index + 1}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.totalHours}h</TableCell>
                    <TableCell>{emp.activityCount}</TableCell>
                    <TableCell>
                      <Badge variant={emp.adherenceRate >= 80 ? "default" : "secondary"}>
                        {emp.adherenceRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!productivityData?.topEmployees || productivityData.topEmployees.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Comparação: Atividades Manuais vs Automáticas */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Manuais vs Automáticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Atividades Manuais</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {productivityData?.manualActivities || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Registradas pelos funcionários
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Atividades Automáticas</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {productivityData?.automaticActivities || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Monitoradas pelo sistema
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Taxa de Cruzamento:</strong> {productivityData?.crossMatchRate || 0}% das
                atividades manuais foram confirmadas por ações automáticas no sistema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
