import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Calendar, CheckCircle2, Clock, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export default function DashboardAprovacoes() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [context, setContext] = useState<string>("todos");

  // Queries
  const { data: kpis, isLoading: loadingKPIs } = trpc.approvalsStats.getKPIs.useQuery({
    startDate,
    endDate,
    context: context as any,
  });

  const { data: byApprover = [], isLoading: loadingByApprover } = trpc.approvalsStats.getByApprover.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const { data: avgResponseTime = [], isLoading: loadingAvgTime } = trpc.approvalsStats.getAvgResponseTimeByApprover.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const { data: bottlenecks = [], isLoading: loadingBottlenecks } = trpc.approvalsStats.getBottlenecks.useQuery({
    limit: 10,
  });

  // Dados para gráfico de pizza (status geral)
  const pieData = kpis
    ? [
        { name: "Aprovadas", value: kpis.approved, color: "#10b981" },
        { name: "Pendentes", value: kpis.pending, color: "#f59e0b" },
        { name: "Rejeitadas", value: kpis.rejected, color: "#ef4444" },
      ]
    : [];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      meta: "Meta",
      descricao_cargo: "Descrição de Cargo",
      bonus: "Bônus",
      calibration: "Calibração",
      performance: "Avaliação 360°",
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Aprovações</h1>
          <p className="text-muted-foreground mt-1">
            Estatísticas consolidadas e análise de desempenho de aprovadores
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Contexto</Label>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="metas">Metas</SelectItem>
                    <SelectItem value="avaliacoes">Avaliações</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                    <SelectItem value="descricao_cargo">Descrição de Cargo</SelectItem>
                    <SelectItem value="ciclo_360">Ciclo 360°</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingKPIs ? "..." : kpis?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aprovações no período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {loadingKPIs ? "..." : kpis?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loadingKPIs ? "..." : kpis?.approved || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis && kpis.total > 0
                  ? `${Math.round((kpis.approved / kpis.total) * 100)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {loadingKPIs ? "..." : kpis?.rejected || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis && kpis.total > 0
                  ? `${Math.round((kpis.rejected / kpis.total) * 100)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {loadingKPIs ? "..." : kpis?.avgResponseTimeDays || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dias para aprovar</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Aprovações por Aprovador */}
          <Card>
            <CardHeader>
              <CardTitle>Aprovações por Aprovador</CardTitle>
              <CardDescription>Top 10 aprovadores mais ativos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingByApprover ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : byApprover.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byApprover}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="approverName"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" fill="#10b981" name="Aprovadas" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pendentes" />
                    <Bar dataKey="rejected" fill="#ef4444" name="Rejeitadas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Tempo Médio de Resposta */}
          <Card>
            <CardHeader>
              <CardTitle>Tempo Médio de Resposta</CardTitle>
              <CardDescription>Dias para aprovar por aprovador</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAvgTime ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : avgResponseTime.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={avgResponseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="approverName"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis label={{ value: "Dias", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTimeDays"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Tempo Médio (dias)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Status Geral */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Visão geral das aprovações</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingKPIs || pieData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {loadingKPIs ? "Carregando..." : "Nenhum dado disponível"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Gargalos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Gargalos no Fluxo
              </CardTitle>
              <CardDescription>Aprovações pendentes há mais tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBottlenecks ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : bottlenecks.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum gargalo detectado
                </div>
              ) : (
                <div className="overflow-auto max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Aprovador</TableHead>
                        <TableHead>Aguardando</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bottlenecks.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                          </TableCell>
                          <TableCell>{item.approverName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                Number(item.daysWaiting) > 7
                                  ? "destructive"
                                  : Number(item.daysWaiting) > 3
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {item.daysWaiting} dias
                            </Badge>
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
      </div>
    </DashboardLayout>
  );
}
