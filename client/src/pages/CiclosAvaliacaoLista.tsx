import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Calendar, Users, Target, TrendingUp, Plus, Eye, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CiclosAvaliacaoLista() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: cycles, isLoading } = trpc.performanceEvaluationCycle.listCycles.useQuery(undefined);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      planejado: { label: "Planejado", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "default" },
      concluido: { label: "Concluído", variant: "secondary" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCycles = cycles?.filter((cycle) => 
    selectedStatus === "all" || cycle.status === selectedStatus
  );

  const activeCycles = cycles?.filter((c) => c.status === "em_andamento").length || 0;
  const plannedCycles = cycles?.filter((c) => c.status === "planejado").length || 0;
  const completedCycles = cycles?.filter((c) => c.status === "concluido").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ciclos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ciclos de Avaliação de Desempenho</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie ciclos de avaliação com metas corporativas e individuais
          </p>
        </div>
        {(user?.role === "admin" || user?.email?.includes("rh")) && (
          <Link href="/ciclos-avaliacao/criar">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Ciclo
            </Button>
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ciclos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os ciclos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCycles}</div>
            <p className="text-xs text-muted-foreground">Ciclos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejados</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{plannedCycles}</div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{completedCycles}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Ciclos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
            >
              Todos
            </Button>
            <Button
              variant={selectedStatus === "planejado" ? "default" : "outline"}
              onClick={() => setSelectedStatus("planejado")}
            >
              Planejados
            </Button>
            <Button
              variant={selectedStatus === "em_andamento" ? "default" : "outline"}
              onClick={() => setSelectedStatus("em_andamento")}
            >
              Em Andamento
            </Button>
            <Button
              variant={selectedStatus === "concluido" ? "default" : "outline"}
              onClick={() => setSelectedStatus("concluido")}
            >
              Concluídos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ciclos */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCycles && filteredCycles.length > 0 ? (
          filteredCycles.map((cycle: any) => (
            <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{cycle.name}</CardTitle>
                      {getStatusBadge(cycle.status)}
                    </div>
                    <CardDescription>{cycle.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ciclos-avaliacao/${cycle.id}/detalhes`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                    {cycle.status === "em_andamento" && (
                      <Link href={`/ciclos-avaliacao/${cycle.id}/aderir`}>
                        <Button size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Aderir ao Ciclo
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Início</p>
                      <p className="text-muted-foreground">
                        {new Date(cycle.startDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Fim</p>
                      <p className="text-muted-foreground">
                        {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Metas Corporativas</p>
                      <p className="text-muted-foreground">
                        {cycle.corporateGoals ? JSON.parse(cycle.corporateGoals).length : 0} metas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Participantes</p>
                      <p className="text-muted-foreground">Ver detalhes</p>
                    </div>
                  </div>
                </div>

                {/* Metas Corporativas Preview */}
                {cycle.corporateGoals && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Metas Corporativas:</p>
                    <ul className="text-sm space-y-1">
                      {JSON.parse(cycle.corporateGoals).slice(0, 3).map((goal: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{goal.title}</span>
                        </li>
                      ))}
                      {JSON.parse(cycle.corporateGoals).length > 3 && (
                        <li className="text-muted-foreground">
                          +{JSON.parse(cycle.corporateGoals).length - 3} metas...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum ciclo encontrado</p>
              <p className="text-muted-foreground text-center mb-4">
                {selectedStatus === "all"
                  ? "Ainda não há ciclos de avaliação cadastrados."
                  : `Não há ciclos com status "${selectedStatus}".`}
              </p>
              {(user?.role === "admin" || user?.email?.includes("rh")) && (
                <Link href="/ciclos-avaliacao/criar">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Ciclo
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
