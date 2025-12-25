import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Página Principal de OKRs
 * Lista todos os objetivos com filtros e visualização de progresso
 */
export default function ListaOKRs() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const { data: objectives, isLoading } = trpc.okr.listObjectives.useQuery({
    level: levelFilter === "all" ? undefined : (levelFilter as any),
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const { data: progressData } = trpc.okr.getProgress.useQuery({
    level: levelFilter === "all" ? undefined : (levelFilter as any),
  });

  const getLevelBadge = (level: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      company: { variant: "default", label: "Empresa" },
      department: { variant: "secondary", label: "Departamento" },
      team: { variant: "outline", label: "Time" },
      individual: { variant: "destructive", label: "Individual" },
    };
    const config = variants[level] || variants.individual;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (progress >= 70) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    if (progress >= 40) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "bg-green-600";
    if (progress >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isAdmin = user?.role === "admin" || user?.role === "rh";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OKRs</h1>
          <p className="text-muted-foreground mt-1">
            Objetivos e Resultados-Chave
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation("/okrs/criar")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Objetivo
          </Button>
        )}
      </div>

      {/* Cards de Resumo */}
      {progressData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Objetivos
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressData.totalObjectives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {progressData.activeObjectives}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {progressData.completedObjectives}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progresso Médio
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressData.averageProgress}%</div>
              <Progress
                value={progressData.averageProgress}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="department">Departamento</SelectItem>
                <SelectItem value="team">Time</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Objetivos */}
      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : objectives && objectives.length > 0 ? (
          objectives.map((objective) => (
            <Card
              key={objective.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/okrs/${objective.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(objective.progress || 0)}
                      <CardTitle className="text-xl">{objective.title}</CardTitle>
                    </div>
                    {objective.description && (
                      <CardDescription className="line-clamp-2">
                        {objective.description}
                      </CardDescription>
                    )}
                  </div>
                  {getLevelBadge(objective.level)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {formatDate(objective.startDate)} - {formatDate(objective.endDate)}
                    </span>
                    <span>
                      Q{objective.quarter || "?"}/{objective.year}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso</span>
                      <span className="font-bold">{objective.progress || 0}%</span>
                    </div>
                    <Progress
                      value={objective.progress || 0}
                      className={`h-2 ${getProgressColor(objective.progress || 0)}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhum objetivo encontrado
                </h3>
                <p className="text-muted-foreground mt-2">
                  {isAdmin
                    ? "Crie seu primeiro objetivo OKR"
                    : "Aguarde a criação de objetivos"}
                </p>
                {isAdmin && (
                  <Button
                    className="mt-4"
                    onClick={() => setLocation("/okrs/criar")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Objetivo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
