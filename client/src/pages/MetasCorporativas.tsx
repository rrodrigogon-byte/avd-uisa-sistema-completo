import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Target, Users, TrendingUp, Building2, Filter, Plus, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MetasCorporativas() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar metas corporativas
  const { data: corporateGoals, isLoading, refetch } = trpc.goals.listCorporateGoals.useQuery();

  // Buscar departamentos
  const { data: departments } = trpc.employees.getDepartments.useQuery();

  // Calcular KPIs
  const totalCorporateGoals = corporateGoals?.length || 0;
  const activeGoals = corporateGoals?.filter(g => g.status === "em_andamento").length || 0;
  const completedGoals = corporateGoals?.filter(g => g.status === "concluida").length || 0;
  
  // Calcular funcionários impactados (todas as metas corporativas aplicam a todos)
  const { data: allEmployees } = trpc.employees.list.useQuery();
  const totalEmployees = allEmployees?.length || 0;

  // Taxa de adesão (progresso médio das metas ativas)
  const avgProgress = corporateGoals && corporateGoals.length > 0
    ? corporateGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / corporateGoals.length
    : 0;

  // Filtrar metas
  const filteredGoals = corporateGoals?.filter(goal => {
    const matchesCategory = selectedCategory === "all" || goal.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || goal.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  }) || [];

  // Dados para gráfico de adesão por categoria
  const categories = ["financial", "behavioral", "corporate", "development"];
  const categoryStats = categories.map(cat => {
    const catGoals = corporateGoals?.filter(g => g.category === cat) || [];
    const avgCatProgress = catGoals.length > 0
      ? catGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / catGoals.length
      : 0;
    return {
      category: cat,
      progress: avgCatProgress,
      goalsCount: catGoals.length,
    };
  }) || [];

  const categoryLabels: Record<string, string> = {
    financial: "Financeira",
    behavioral: "Comportamental",
    corporate: "Corporativa",
    development: "Desenvolvimento",
  };

  const barChartData = {
    labels: categoryStats.map(d => categoryLabels[d.category] || d.category),
    datasets: [
      {
        label: "Progresso Médio (%)",
        data: categoryStats.map(d => d.progress),
        backgroundColor: "rgba(243, 146, 0, 0.6)",
        borderColor: "rgba(243, 146, 0, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Progresso Médio por Categoria",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // Dados para gráfico de pizza (status)
  const statusCounts = {
    em_andamento: corporateGoals?.filter(g => g.status === "em_andamento").length || 0,
    concluida: corporateGoals?.filter(g => g.status === "concluida").length || 0,
    cancelada: corporateGoals?.filter(g => g.status === "cancelada").length || 0,
    pendente: corporateGoals?.filter(g => g.status === "pendente").length || 0,
  };

  const pieChartData = {
    labels: ["Em Andamento", "Concluída", "Cancelada", "Pendente"],
    datasets: [
      {
        data: [statusCounts.em_andamento, statusCounts.concluida, statusCounts.cancelada, statusCounts.pendente],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(34, 197, 94, 0.6)",
          "rgba(239, 68, 68, 0.6)",
          "rgba(251, 191, 36, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "Distribuição por Status",
      },
    },
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "default" },
      concluida: { label: "Concluída", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando metas corporativas...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Dashboard de Metas Corporativas
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho das metas organizacionais
          </p>
        </div>
        <Button onClick={() => navigate("/metas-smart/criar?tipo=corporativa")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta Corporativa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Metas Corporativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{totalCorporateGoals}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funcionários Impactados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{totalEmployees}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Adesão Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{avgProgress.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{activeGoals}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="financial">Financeira</SelectItem>
                  <SelectItem value="behavioral">Comportamental</SelectItem>
                  <SelectItem value="corporate">Corporativa</SelectItem>
                  <SelectItem value="development">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Corporativas ({filteredGoals.length})</CardTitle>
          <CardDescription>
            Metas organizacionais que se aplicam a todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/metas-smart/${goal.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{goal.title}</h3>
                      {getStatusBadge(goal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {categoryLabels[goal.category] || goal.category}
                      </span>
                      <span>
                        Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {goal.progress}%
                    </div>
                    <div className="text-xs text-muted-foreground">Progresso</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                    ? "Nenhuma meta encontrada com os filtros aplicados"
                    : "Nenhuma meta corporativa cadastrada"}
                </p>
                {!searchTerm && selectedCategory === "all" && selectedStatus === "all" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/metas-smart/criar?tipo=corporativa")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Meta Corporativa
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
