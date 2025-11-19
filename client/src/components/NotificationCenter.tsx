import { useState } from "react";
import { Bell, Check, X, AlertCircle, CheckCircle, Info, TrendingUp, Brain, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

/**
 * NotificationCenter - Centro de Notificações em Tempo Real
 * 
 * Features:
 * - Badge de contagem de notificações não lidas
 * - Dropdown com lista de notificações
 * - Integração com backend real via tRPC
 * - Tipos de notificações:
 *   - Testes psicométricos concluídos
 *   - Marcos de PDI atingidos
 *   - Insights críticos identificados
 *   - Avaliações 360° concluídas
 *   - Metas atingidas
 * - Marcação de lida/não lida
 * - Navegação para links relacionados
 */

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Buscar notificações do backend
  const { data: notifications, refetch } = trpc.notifications.list.useQuery({
    limit: 20,
  });

  // Contar não lidas
  const { data: unreadCount } = trpc.notifications.countUnread.useQuery();

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
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    if (((unreadCount?.count ?? 0)) > 0) {
      markAllAsReadMutation.mutate();
    }
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
      case "approval":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "pdi":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "succession":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
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
    return `${diffDays}d atrás`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {((unreadCount?.count ?? 0)) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {((unreadCount?.count ?? 0)) > 9 ? "9+" : (unreadCount?.count ?? 0)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {(unreadCount?.count ?? 0)} não {((unreadCount?.count ?? 0)) === 1 ? "lida" : "lidas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {((unreadCount?.count ?? 0)) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
                disabled={markAllAsReadMutation.isPending}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-accent transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setLocation("/notificacoes");
                setOpen(false);
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
