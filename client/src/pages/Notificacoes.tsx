import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Brain,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Página de Histórico de Notificações
 * Lista completa com filtros avançados
 */

export default function Notificacoes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Buscar todas as notificações
  const { data: notifications, refetch } = trpc.notifications.list.useQuery({
    limit: 100,
    unreadOnly: statusFilter === "unread",
  });

  // Mutation para marcar como lida
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Todas as notificações marcadas como lidas");
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Marcar como lida
    if (!notification.read) {
      markAsReadMutation.mutate({ id: notification.id });
    }

    // Navegar para o link se existir
    if (notification.link) {
      setLocation(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "test_completed":
        return <Brain className="h-5 w-5 text-blue-500" />;
      case "pdi_milestone":
        return <Target className="h-5 w-5 text-green-500" />;
      case "insight_critical":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "evaluation_completed":
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case "goal_achieved":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return notifDate.toLocaleDateString("pt-BR");
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      test_completed: "Teste Concluído",
      pdi_milestone: "Marco de PDI",
      goal_achieved: "Meta Atingida",
      evaluation_completed: "Avaliação Concluída",
      insight_critical: "Insight Crítico",
    };
    return labels[type] || type;
  };

  // Filtrar notificações
  const filteredNotifications = notifications?.filter((notif) => {
    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !notif.title.toLowerCase().includes(query) &&
        !notif.message?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Filtro de tipo
    if (typeFilter !== "all" && notif.type !== typeFilter) {
      return false;
    }

    // Filtro de período
    if (periodFilter !== "all") {
      const notifDate = new Date(notif.createdAt);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - notifDate.getTime()) / 86400000
      );

      if (periodFilter === "today" && diffDays > 0) return false;
      if (periodFilter === "week" && diffDays > 7) return false;
      if (periodFilter === "month" && diffDays > 30) return false;
      if (periodFilter === "year" && diffDays > 365) return false;
    }

    return true;
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notificações
            </h1>
            <p className="text-muted-foreground mt-2">
              Histórico completo de notificações do sistema
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas ({unreadCount})
            </Button>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filtro de Tipo */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="test_completed">Testes Concluídos</SelectItem>
                  <SelectItem value="pdi_milestone">Marcos de PDI</SelectItem>
                  <SelectItem value="goal_achieved">Metas Atingidas</SelectItem>
                  <SelectItem value="evaluation_completed">Avaliações</SelectItem>
                  <SelectItem value="insight_critical">Insights Críticos</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Não lidas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Período */}
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredNotifications?.length || 0} notificações
            </CardTitle>
            <CardDescription>
              {unreadCount > 0
                ? `${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
                : "Todas as notificações estão lidas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!filteredNotifications || filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente ajustar os filtros ou aguarde novas notificações
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer",
                      !notification.read && "bg-blue-50/50 border-blue-200"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <Badge variant="secondary" className="mt-1">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground flex-shrink-0">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
