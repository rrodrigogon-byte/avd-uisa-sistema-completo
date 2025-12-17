/**
 * Dashboard Administrativo Avançado
 * Sistema AVD UISA - Avaliação de Desempenho
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Briefcase,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = trpc.adminAdvanced.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_: any, i: number) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar estatísticas: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      description: "Usuários cadastrados no sistema",
      color: "text-blue-600",
    },
    {
      title: "Funcionários",
      value: stats.totalEmployees,
      icon: UserCheck,
      description: "Funcionários ativos",
      color: "text-green-600",
    },
    {
      title: "Ciclos Ativos",
      value: stats.activeCycles,
      icon: ClipboardList,
      description: "Períodos avaliativos em andamento",
      color: "text-purple-600",
    },
    {
      title: "Avaliações Pendentes",
      value: stats.pendingEvaluations,
      icon: Clock,
      description: "Aguardando autoavaliação",
      color: "text-orange-600",
    },
    {
      title: "Em Andamento",
      value: stats.inProgressEvaluations,
      icon: Activity,
      description: "Aguardando avaliação do supervisor",
      color: "text-yellow-600",
    },
    {
      title: "Concluídas",
      value: stats.completedEvaluations,
      icon: CheckCircle2,
      description: "Avaliações finalizadas",
      color: "text-green-600",
    },
    {
      title: "Departamentos",
      value: stats.totalDepartments,
      icon: Building2,
      description: "Departamentos cadastrados",
      color: "text-indigo-600",
    },
    {
      title: "Cargos",
      value: stats.totalPositions,
      icon: Briefcase,
      description: "Posições definidas",
      color: "text-pink-600",
    },
  ];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema e estatísticas em tempo real
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat: any) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade recente
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {activity.entityType}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-muted-foreground">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(activity.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Links Rápidos */}
      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Usuários
            </CardTitle>
            <CardDescription>
              Criar, editar e gerenciar usuários do sistema
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Avaliações
            </CardTitle>
            <CardDescription>
              Visualizar e gerenciar todas as avaliações
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Auditoria
            </CardTitle>
            <CardDescription>
              Histórico completo de ações no sistema
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
