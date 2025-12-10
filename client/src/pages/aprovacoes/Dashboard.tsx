import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Home,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/**
 * Dashboard de Aprovações
 * 
 * Features:
 * - KPIs: Pendentes, Aprovadas, Rejeitadas, Tempo Médio
 * - Gráfico: Solicitações por Tipo
 * - Gráfico: Status de Aprovações (Pizza)
 * - Lista: Solicitações Pendentes (ação rápida)
 * - Filtro por período
 */

export default function Dashboard() {
  const [period, setPeriod] = useState("30");
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      type: "Bônus",
      employee: "Maria Silva",
      date: "2025-01-15",
      amount: "R$ 5.000",
      priority: "alta",
    },
    {
      id: 2,
      type: "Promoção",
      employee: "João Santos",
      date: "2025-01-14",
      position: "Gerente",
      priority: "media",
    },
    {
      id: 3,
      type: "Férias",
      employee: "Ana Costa",
      date: "2025-01-13",
      days: "15 dias",
      priority: "baixa",
    },
  ]);

  // Mock data - TODO: integrar com backend
  const kpis = {
    pendentes: pendingRequests.length,
    aprovadas: 45,
    rejeitadas: 3,
    tempoMedio: 2.5, // dias
  };

  // Handlers para aprovar/rejeitar
  const handleApprove = (requestId: number) => {
    // TODO: Integrar com backend
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success("Solicitação aprovada com sucesso!");
  };

  const handleReject = (requestId: number) => {
    // TODO: Integrar com backend
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    toast.error("Solicitação rejeitada");
  };

  // Dados para gráfico de barras
  const requestsByType = [
    { type: "Férias", count: 15 },
    { type: "Bônus", count: 12 },
    { type: "Promoção", count: 8 },
    { type: "Treinamento", count: 10 },
    { type: "Outros", count: 15 },
  ];

  // Dados para gráfico de pizza
  const statusData = [
    { name: "Aprovadas", value: 45, color: "#10b981" },
    { name: "Pendentes", value: 12, color: "#f59e0b" },
    { name: "Rejeitadas", value: 3, color: "#ef4444" },
  ];



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Aprovações</h1>
            <p className="text-muted-foreground">Visão consolidada de solicitações e aprovações</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
            <Select value={period} onValueChange={setPeriod}>
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
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.pendentes}</div>
              <p className="text-xs text-orange-600 mt-1">Requer atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aprovadas
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.aprovadas}</div>
              <p className="text-xs text-green-600 mt-1">+12% vs. mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rejeitadas
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.rejeitadas}</div>
              <p className="text-xs text-muted-foreground mt-1">5% do total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.tempoMedio}d</div>
              <p className="text-xs text-muted-foreground mt-1">Para aprovação</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Barras */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Aprovações</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Solicitações Pendentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solicitações Pendentes</CardTitle>
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{request.type}</Badge>
                      <Badge
                        variant={
                          request.priority === "alta"
                            ? "destructive"
                            : request.priority === "media"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {request.priority === "alta"
                          ? "Alta"
                          : request.priority === "media"
                          ? "Média"
                          : "Baixa"}
                      </Badge>
                    </div>
                    <p className="font-semibold">{request.employee}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.amount || request.position || request.days} •{" "}
                      {new Date(request.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
