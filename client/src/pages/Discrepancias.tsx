import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Discrepancias() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "reviewed" | "justified" | "flagged" | "all">("all");
  const [minPercentage, setMinPercentage] = useState<number>(0);
  const [justifyDialogOpen, setJustifyDialogOpen] = useState(false);
  const [currentDiscrepancyId, setCurrentDiscrepancyId] = useState<number | null>(null);
  const [justification, setJustification] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: stats } = trpc.timeClock.getStats.useQuery({
    startDate,
    endDate,
  });

  const { data: discrepancies = [], isLoading } = trpc.timeClock.listDiscrepancies.useQuery({
    status: selectedStatus === "all" ? undefined : selectedStatus,
    minPercentage: minPercentage > 0 ? minPercentage : undefined,
    limit: 100,
  });

  // Mutation
  const justifyMutation = trpc.timeClock.justifyDiscrepancy.useMutation({
    onSuccess: () => {
      toast.success("Discrepância justificada com sucesso!");
      utils.timeClock.listDiscrepancies.invalidate();
      setJustifyDialogOpen(false);
      setJustification("");
    },
    onError: (error) => {
      toast.error(`Erro ao justificar: ${error.message}`);
    },
  });

  // Processar dados para gráficos
  const trendData = discrepancies
    .reduce((acc, d) => {
      const dateKey = format(new Date(d.date), "dd/MM");
      const existing = acc.find(item => item.date === dateKey);
      if (existing) {
        existing.count += 1;
        existing.avgPercentage = (existing.avgPercentage + parseFloat(d.differencePercentage || "0")) / 2;
      } else {
        acc.push({
          date: dateKey,
          count: 1,
          avgPercentage: parseFloat(d.differencePercentage || "0"),
        });
      }
      return acc;
    }, [] as Array<{ date: string; count: number; avgPercentage: number }>)
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map(Number);
      const [dayB, monthB] = b.date.split("/").map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

  // Ranking de colaboradores
  const employeeRanking = discrepancies
    .reduce((acc, d) => {
      const key = `${d.employeeId}-${d.employeeName}`;
      const existing = acc.find(item => item.key === key);
      if (existing) {
        existing.count += 1;
        existing.totalPercentage += parseFloat(d.differencePercentage || "0");
        existing.avgPercentage = existing.totalPercentage / existing.count;
      } else {
        acc.push({
          key,
          employeeId: d.employeeId,
          employeeName: d.employeeName || "Desconhecido",
          employeeCode: d.employeeCode || "",
          count: 1,
          totalPercentage: parseFloat(d.differencePercentage || "0"),
          avgPercentage: parseFloat(d.differencePercentage || "0"),
        });
      }
      return acc;
    }, [] as Array<{ key: string; employeeId: number; employeeName: string; employeeCode: string; count: number; totalPercentage: number; avgPercentage: number }>)
    .sort((a, b) => b.avgPercentage - a.avgPercentage)
    .slice(0, 10);

  const handleJustify = (discrepancyId: number) => {
    setCurrentDiscrepancyId(discrepancyId);
    setJustifyDialogOpen(true);
  };

  const confirmJustify = () => {
    if (!currentDiscrepancyId) return;
    justifyMutation.mutate({
      discrepancyId: currentDiscrepancyId,
      justification,
    });
  };

  const getDiscrepancyColor = (percentage: string) => {
    const pct = parseFloat(percentage);
    if (pct > 50) return "text-red-600";
    if (pct > 30) return "text-orange-600";
    if (pct > 20) return "text-yellow-600";
    return "text-green-600";
  };

  const getDiscrepancyBadge = (type: string) => {
    switch (type) {
      case "over_reported":
        return <Badge variant="destructive">Excesso de Atividades</Badge>;
      case "under_reported":
        return <Badge variant="secondary">Falta de Atividades</Badge>;
      case "acceptable":
        return <Badge variant="outline">Aceitável</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discrepâncias de Ponto vs Atividades</h1>
        <p className="text-muted-foreground">
          Análise de inconsistências entre horas registradas no ponto eletrônico e atividades manuais
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total de Registros de Ponto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total de Discrepâncias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.totalDiscrepancies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalRecords ? ((stats.totalDiscrepancies / stats.totalRecords) * 100).toFixed(1) : 0}% dos registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Discrepâncias Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.criticalDiscrepancies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">&gt; 50% de diferença</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="justified">Justificado</SelectItem>
                  <SelectItem value="flagged">Sinalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Diferença Mínima (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={minPercentage}
                onChange={(e) => setMinPercentage(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Tendências */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tendência de Discrepâncias</CardTitle>
          <CardDescription>Evolução temporal das inconsistências</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                name="Quantidade"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgPercentage"
                stroke="#82ca9d"
                name="% Média"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking de Colaboradores */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top 10 Colaboradores com Maiores Inconsistências</CardTitle>
          <CardDescription>Ranking por média de discrepância</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={employeeRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="employeeName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgPercentage" fill="#f59e0b" name="% Média de Discrepância" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Discrepâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Discrepâncias Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : discrepancies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma discrepância encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Colaborador</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-right py-3 px-4">Ponto (min)</th>
                    <th className="text-right py-3 px-4">Atividades (min)</th>
                    <th className="text-right py-3 px-4">Diferença</th>
                    <th className="text-center py-3 px-4">Tipo</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((disc: any) => (
                    <tr key={disc.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{disc.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{disc.employeeCode}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {format(new Date(disc.date), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="text-right py-3 px-4">{disc.clockMinutes}</td>
                      <td className="text-right py-3 px-4">{disc.activityMinutes}</td>
                      <td className={`text-right py-3 px-4 font-bold ${getDiscrepancyColor(disc.differencePercentage || "0")}`}>
                        {disc.differenceMinutes > 0 ? "+" : ""}{disc.differenceMinutes} min
                        <div className="text-xs">({parseFloat(disc.differencePercentage || "0").toFixed(1)}%)</div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {getDiscrepancyBadge(disc.discrepancyType)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={disc.status === "justified" ? "default" : "secondary"}>
                          {disc.status === "pending" ? "Pendente" :
                           disc.status === "reviewed" ? "Revisado" :
                           disc.status === "justified" ? "Justificado" : "Sinalizado"}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        {disc.status === "pending" && (
                          <Button
                            onClick={() => handleJustify(disc.id)}
                            size="sm"
                            variant="outline"
                          >
                            Justificar
                          </Button>
                        )}
                        {disc.status === "justified" && disc.justification && (
                          <Button
                            onClick={() => {
                              toast.info(disc.justification || "Sem justificativa");
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            Ver Justificativa
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Justificativa */}
      <Dialog open={justifyDialogOpen} onOpenChange={setJustifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificar Discrepância</DialogTitle>
            <DialogDescription>
              Forneça uma justificativa para esta inconsistência entre ponto e atividades
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Colaborador estava em reunião externa sem acesso ao sistema..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustifyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmJustify} disabled={justifyMutation.isPending || !justification}>
              {justifyMutation.isPending ? "Justificando..." : "Justificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
