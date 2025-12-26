import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  ArrowRight,
  Briefcase,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dashboard de Gestão Consolidado
 * Mostra estatísticas de movimentações, aprovações pendentes e ações recentes
 */
export default function DashboardGestao() {
  const [, setLocation] = useLocation();
  
  // Buscar estatísticas consolidadas
  const { data: stats, isLoading: loadingStats } = trpc.gestao.getConsolidatedStats.useQuery(undefined);
  const { data: recentActions, isLoading: loadingActions } = trpc.gestao.getRecentActions.useQuery({ limit: 10 });

  if (loadingStats) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const movimentacoes = stats?.movimentacoes || { total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0 };
  const aprovacoes = stats?.aprovacoes || { descricoes: 0, pdis: 0, avaliacoes: 0, bonus: 0 };
  const funcionarios = stats?.funcionarios || { total: 0, ativos: 0, inativos: 0 };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Gestão</h1>
        <p className="text-muted-foreground">
          Visão consolidada de movimentações, aprovações e ações recentes do sistema
        </p>
      </div>

      {/* Cards de Estatísticas - Movimentações */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Movimentações
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movimentacoes.total}</div>
              <p className="text-xs text-muted-foreground">
                Todas as movimentações registradas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{movimentacoes.pendentes}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
              {movimentacoes.pendentes > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="px-0 h-auto text-yellow-700 hover:text-yellow-800"
                  onClick={() => setLocation("/movimentacoes?status=pendente")}
                >
                  Ver pendentes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{movimentacoes.aprovadas}</div>
              <p className="text-xs text-muted-foreground">
                Movimentações concluídas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{movimentacoes.rejeitadas}</div>
              <p className="text-xs text-muted-foreground">
                Movimentações recusadas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Estatísticas - Aprovações Pendentes */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Aprovações Pendentes
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/50"
            onClick={() => setLocation("/aprovacoes/cargos")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Descrições de Cargo</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{aprovacoes.descricoes}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
              {aprovacoes.descricoes > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-700">
                  <AlertCircle className="h-3 w-3" />
                  Clique para revisar
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 bg-purple-50/50"
            onClick={() => setLocation("/aprovacoes/pdi")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDIs</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{aprovacoes.pdis}</div>
              <p className="text-xs text-muted-foreground">
                Planos pendentes
              </p>
              {aprovacoes.pdis > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-purple-700">
                  <AlertCircle className="h-3 w-3" />
                  Clique para revisar
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 bg-orange-50/50"
            onClick={() => setLocation("/aprovacoes/avaliacoes")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
              <CheckCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{aprovacoes.avaliacoes}</div>
              <p className="text-xs text-muted-foreground">
                Avaliações pendentes
              </p>
              {aprovacoes.avaliacoes > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-700">
                  <AlertCircle className="h-3 w-3" />
                  Clique para revisar
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200 bg-emerald-50/50"
            onClick={() => setLocation("/aprovacoes/bonus")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bônus</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{aprovacoes.bonus}</div>
              <p className="text-xs text-muted-foreground">
                Bônus pendentes
              </p>
              {aprovacoes.bonus > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-700">
                  <AlertCircle className="h-3 w-3" />
                  Clique para revisar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Estatísticas - Funcionários */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Funcionários
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{funcionarios.total}</div>
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{funcionarios.ativos}</div>
              <p className="text-xs text-muted-foreground">
                Funcionários ativos
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="px-0 h-auto text-green-700 hover:text-green-800"
                onClick={() => setLocation("/funcionarios-ativos")}
              >
                Ver lista <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{funcionarios.inativos}</div>
              <p className="text-xs text-muted-foreground">
                Funcionários inativos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feed de Ações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ações Recentes
          </CardTitle>
          <CardDescription>
            Últimas 10 ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActions ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : isEmpty(recentActions) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma ação recente registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeMap(recentActions, (action: any) => (
                <div 
                  key={action.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {action.type === 'movimentacao' && <Users className="h-4 w-4 text-blue-600" />}
                    {action.type === 'aprovacao' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {action.type === 'rejeicao' && <XCircle className="h-4 w-4 text-red-600" />}
                    {action.type === 'cadastro' && <UserCheck className="h-4 w-4 text-purple-600" />}
                    {!['movimentacao', 'aprovacao', 'rejeicao', 'cadastro'].includes(action.type) && (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {action.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(action.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant={
                    action.status === 'aprovado' ? 'default' :
                    action.status === 'rejeitado' ? 'destructive' :
                    action.status === 'pendente' ? 'secondary' :
                    'outline'
                  }>
                    {action.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades de gestão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setLocation("/funcionarios/gerenciar")}
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Funcionários
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setLocation("/aprovacoes/cargos")}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Aprovar Descrições
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setLocation("/movimentacoes")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Ver Movimentações
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setLocation("/aprovacoes/dashboard")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Dashboard Aprovações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
