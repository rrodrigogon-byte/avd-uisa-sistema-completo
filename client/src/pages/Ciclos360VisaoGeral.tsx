import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  BarChart3,
  Eye,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Página de Visão Geral de Ciclos 360°
 * Exibe todos os ciclos com filtros e estatísticas
 */

export default function Ciclos360VisaoGeral() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    status: undefined as "planejado" | "ativo" | "concluido" | "cancelado" | undefined,
    year: undefined as number | undefined,
    type: undefined as "anual" | "semestral" | "trimestral" | undefined,
  });

  // Buscar estatísticas gerais
  const { data: stats, isLoading: statsLoading } = trpc.cycles360Overview.getOverallStats.useQuery();

  // Buscar ciclos com filtros
  const { data: cycles, isLoading: cyclesLoading } = trpc.cycles360Overview.listCycles.useQuery(filters);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      planejado: { variant: "secondary", icon: Clock, label: "Planejado" },
      ativo: { variant: "default", icon: TrendingUp, label: "Ativo" },
      concluido: { variant: "success", icon: CheckCircle2, label: "Concluído" },
      cancelado: { variant: "destructive", icon: XCircle, label: "Cancelado" },
    };

    const config = variants[status] || variants.planejado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      anual: "Anual",
      semestral: "Semestral",
      trimestral: "Trimestral",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleViewDetails = (cycleId: number) => {
    setLocation(`/ciclos-360/detalhes/${cycleId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visão Geral de Ciclos 360°</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todos os ciclos de avaliação 360° e suas estatísticas
          </p>
        </div>

        {/* Estatísticas Gerais */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Ciclos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.totalCycles}</div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{stats.activeCycles} ativos</span>
                  <span>•</span>
                  <span>{stats.completedCycles} concluídos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ciclos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.activeCycles}</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Em andamento</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.totalParticipants}</div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{stats.completedEvaluations} concluídas</span>
                  <span>•</span>
                  <span>{stats.pendingEvaluations} pendentes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.overallCompletionRate}%</div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.overallCompletionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Filtre os ciclos por status, ano e tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "todos"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      status: value === "todos" ? undefined : (value as any),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="planejado">Planejado</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano</Label>
                <Select
                  value={filters.year?.toString() || "todos"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      year: value === "todos" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.type || "todos"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      type: value === "todos" ? undefined : (value as any),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filters.status || filters.year || filters.type) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setFilters({ status: undefined, year: undefined, type: undefined })}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lista de Ciclos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ciclos de Avaliação 360°
            </CardTitle>
            <CardDescription>
              {cycles?.length || 0} ciclo(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cyclesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : cycles && cycles.length > 0 ? (
              <div className="space-y-4">
                {cycles.map((cycle: any) => (
                  <Card key={cycle.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {cycle.name}
                            </h3>
                            {getStatusBadge(cycle.status)}
                            {getTypeBadge(cycle.type)}
                          </div>

                          {cycle.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {cycle.description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Período:</span>
                              <div className="font-medium text-foreground">
                                {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Participantes:</span>
                              <div className="font-medium text-foreground flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cycle.stats.totalParticipants}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Concluídas:</span>
                              <div className="font-medium text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                {cycle.stats.completedParticipants}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Taxa de Conclusão:</span>
                              <div className="font-medium text-foreground">
                                {cycle.stats.completionRate}%
                              </div>
                            </div>
                          </div>

                          {/* Barra de Progresso */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso</span>
                              <span>{cycle.stats.completionRate}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${cycle.stats.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                          onClick={() => handleViewDetails(cycle.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum ciclo encontrado
                </h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou crie um novo ciclo de avaliação 360°
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
