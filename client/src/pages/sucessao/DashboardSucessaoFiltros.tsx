import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Dashboard de Sucessão com Filtros Avançados
 * Permite filtrar por departamento, prontidão, risco de perda e buscar por nome
 */
export default function DashboardSucessaoFiltros() {
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
  const [readinessFilter, setReadinessFilter] = useState<string | undefined>(undefined);
  const [riskFilter, setRiskFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar departamentos
  const { data: departments = [] } = trpc.departments.list.useQuery({});

  // Buscar planos de sucessão com filtros
  const { data: successionPlans = [], isLoading } = trpc.succession.listWithFilters.useQuery({
    departmentId: departmentFilter,
    readinessLevel: readinessFilter,
    riskLevel: riskFilter,
    searchQuery: searchQuery.trim() || undefined,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.succession.getStats.useQuery({
    departmentId: departmentFilter,
  });

  // Exportar relatório
  const exportMutation = trpc.succession.exportReport.useMutation({
    onSuccess: (data) => {
      toast.success("Relatório exportado com sucesso!");
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.click();
    },
    onError: (error: any) => {
      toast.error("Erro ao exportar relatório", {
        description: error.message,
      });
    },
  });

  const handleExport = async () => {
    await exportMutation.mutateAsync({
      departmentId: departmentFilter,
      readinessLevel: readinessFilter,
      riskLevel: riskFilter,
    });
  };

  const getReadinessLabel = (level: string) => {
    const labels: Record<string, string> = {
      imediato: "Imediato",
      "1_ano": "1 Ano",
      "2_3_anos": "2-3 Anos",
      "mais_3_anos": "+3 Anos",
    };
    return labels[level] || level;
  };

  const getReadinessColor = (level: string) => {
    const colors: Record<string, string> = {
      imediato: "bg-green-500",
      "1_ano": "bg-blue-500",
      "2_3_anos": "bg-yellow-500",
      "mais_3_anos": "bg-orange-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const getRiskLabel = (risk: string) => {
    const labels: Record<string, string> = {
      baixo: "Baixo",
      medio: "Médio",
      alto: "Alto",
      critico: "Crítico",
    };
    return labels[risk] || risk;
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      baixo: "text-green-600",
      medio: "text-yellow-600",
      alto: "text-orange-600",
      critico: "text-red-600",
    };
    return colors[risk] || "text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i: any) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Sucessão</h1>
          <p className="text-gray-600 mt-1">
            Visualize e gerencie o pipeline de talentos com filtros avançados
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sucessores</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuccessors}</div>
              <p className="text-xs text-gray-500 mt-1">Candidatos mapeados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prontos Imediatamente</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readyNow}</div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.readyNow / stats.totalSuccessors) * 100)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risco Alto/Crítico</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highRisk}</div>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção urgente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cobertura</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coverageRate}%</div>
              <p className="text-xs text-gray-500 mt-1">Posições críticas cobertas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca por nome */}
            <div className="space-y-2">
              <Label>Buscar por Nome</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por departamento */}
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={departmentFilter?.toString() || "all"}
                onValueChange={(v) => setDepartmentFilter(v === "all" ? undefined : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por prontidão */}
            <div className="space-y-2">
              <Label>Nível de Prontidão</Label>
              <Select
                value={readinessFilter || "all"}
                onValueChange={(v) => setReadinessFilter(v === "all" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="imediato">Imediato</SelectItem>
                  <SelectItem value="1_ano">1 Ano</SelectItem>
                  <SelectItem value="2_3_anos">2-3 Anos</SelectItem>
                  <SelectItem value="mais_3_anos">+3 Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por risco */}
            <div className="space-y-2">
              <Label>Risco de Perda</Label>
              <Select
                value={riskFilter || "all"}
                onValueChange={(v) => setRiskFilter(v === "all" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os riscos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os riscos</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão de limpar filtros */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDepartmentFilter(undefined);
                setReadinessFilter(undefined);
                setRiskFilter(undefined);
                setSearchQuery("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Sucessores */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Talentos ({successionPlans.length})</CardTitle>
          <CardDescription>
            Candidatos filtrados por critérios selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successionPlans.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum sucessor encontrado
              </h3>
              <p className="text-gray-600">
                Ajuste os filtros ou cadastre novos planos de sucessão
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo Atual</TableHead>
                  <TableHead>Posição Alvo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Prontidão</TableHead>
                  <TableHead>Risco de Perda</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {successionPlans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.successorName}</TableCell>
                    <TableCell>{plan.currentPosition}</TableCell>
                    <TableCell>{plan.targetPosition}</TableCell>
                    <TableCell>{plan.department}</TableCell>
                    <TableCell>
                      <Badge className={getReadinessColor(plan.readinessLevel)}>
                        {getReadinessLabel(plan.readinessLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getRiskColor(plan.riskLevel)}`}>
                        {getRiskLabel(plan.riskLevel)}
                      </span>
                    </TableCell>
                  <TableCell>
                    <Badge variant="outline">{plan.performanceRating || "N/A"}</Badge>
                  </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
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

      {/* Pipeline Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Visualização de Pipeline por Prontidão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["imediato", "1_ano", "2_3_anos", "mais_3_anos"].map((level: any) => {
              const count = successionPlans.filter(
                (p: any) => p.readinessLevel === level
              ).length;
              return (
                <Card key={level} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {getReadinessLabel(level)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{count}</div>
                    <div className="text-xs text-gray-500">
                      {Math.round((count / successionPlans.length) * 100)}% do pipeline
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
