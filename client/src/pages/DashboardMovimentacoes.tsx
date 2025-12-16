import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, Calendar, Filter } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  promocao: "Promoção",
  transferencia: "Transferência",
  mudanca_gestor: "Mudança de Gestor",
  mudanca_cargo: "Mudança de Cargo",
  ajuste_salarial: "Ajuste Salarial",
  desligamento: "Desligamento",
  admissao: "Admissão",
  retorno_afastamento: "Retorno de Afastamento",
  reorganizacao: "Reorganização",
  outro: "Outro",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado",
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function DashboardMovimentacoes() {
  // Período padrão: últimos 6 meses
  const [startDate, setStartDate] = useState(() => format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Queries
  const statsQuery = trpc.movements.getStats.useQuery({ startDate, endDate });
  const trendsQuery = trpc.movements.getTrends.useQuery({ startDate, endDate, groupBy: "month" });
  const byDepartmentQuery = trpc.movements.getByDepartment.useQuery({ startDate, endDate });
  const movementsQuery = trpc.movements.list.useQuery({
    startDate,
    endDate,
    departmentId: selectedDepartment !== "all" ? parseInt(selectedDepartment) : undefined,
    movementType: selectedType !== "all" ? (selectedType as any) : undefined,
    limit: 20,
  });

  // Processar dados para gráficos
  const movementsByTypeData = useMemo(() => {
    if (!statsQuery.data) return [];
    return statsQuery.data.byType.map((item) => ({
      name: MOVEMENT_TYPE_LABELS[item.type] || item.type,
      value: item.count,
    }));
  }, [statsQuery.data]);

  const movementsByStatusData = useMemo(() => {
    if (!statsQuery.data) return [];
    return statsQuery.data.byStatus.map((item) => ({
      name: APPROVAL_STATUS_LABELS[item.status] || item.status,
      value: item.count,
    }));
  }, [statsQuery.data]);

  const trendsData = useMemo(() => {
    if (!trendsQuery.data) return [];
    return trendsQuery.data.map((item) => ({
      period: item.period,
      movimentações: item.count,
    }));
  }, [trendsQuery.data]);

  const departmentData = useMemo(() => {
    if (!byDepartmentQuery.data) return [];
    
    // Combinar entradas e saídas por departamento
    const departmentMap = new Map<string, { incoming: number; outgoing: number }>();

    byDepartmentQuery.data.incoming.forEach((item) => {
      const name = item.departmentName || "Não especificado";
      const existing = departmentMap.get(name) || { incoming: 0, outgoing: 0 };
      departmentMap.set(name, { ...existing, incoming: item.count });
    });

    byDepartmentQuery.data.outgoing.forEach((item) => {
      const name = item.departmentName || "Não especificado";
      const existing = departmentMap.get(name) || { incoming: 0, outgoing: 0 };
      departmentMap.set(name, { ...existing, outgoing: item.count });
    });

    return Array.from(departmentMap.entries()).map(([name, data]) => ({
      name,
      entradas: data.incoming,
      saídas: data.outgoing,
    }));
  }, [byDepartmentQuery.data]);

  const isLoading = statsQuery.isLoading || trendsQuery.isLoading || byDepartmentQuery.isLoading;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Movimentações</h1>
        <p className="text-muted-foreground">
          Análise de tendências e estatísticas de movimentações organizacionais
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Movimentação</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"));
                  setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
                  setSelectedDepartment("all");
                  setSelectedType("all");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{statsQuery.data?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {statsQuery.data?.byStatus.find((s) => s.status === "aprovado")?.count || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {statsQuery.data?.byStatus.find((s) => s.status === "pendente")?.count || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {statsQuery.data?.byStatus.find((s) => s.status === "rejeitado")?.count || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Tendências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Movimentações
            </CardTitle>
            <CardDescription>Movimentações ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="movimentações" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>Tipos de movimentações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={movementsByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {movementsByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico por Departamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimentações por Departamento</CardTitle>
            <CardDescription>Entradas e saídas de colaboradores por departamento</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entradas" fill="#10b981" />
                  <Bar dataKey="saídas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
          <CardDescription>Últimas 20 movimentações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {movementsQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movementsQuery.data && movementsQuery.data.movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsQuery.data.movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {movement.effectiveDate
                        ? format(new Date(movement.effectiveDate), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">ID: {movement.employeeId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MOVEMENT_TYPE_LABELS[movement.movementType] || movement.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.approvalStatus === "aprovado"
                            ? "default"
                            : movement.approvalStatus === "pendente"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {APPROVAL_STATUS_LABELS[movement.approvalStatus] || movement.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{movement.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
