import { useState, useEffect } from "react";
import { Bell, Check, X, AlertCircle, CheckCircle, Info, TrendingUp } from "lucide-react";
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

/**
 * NotificationCenter - Centro de Notificações em Tempo Real
 * 
 * Features:
 * - Badge de contagem de notificações não lidas
 * - Dropdown com lista de notificações
 * - Integração WebSocket para atualizações em tempo real
 * - Tipos de notificações:
 *   - Aprovações pendentes
 *   - Atualizações de PDI
 *   - Mudanças no Mapa de Sucessão
 *   - Conclusão de avaliações
 * - Marcação de lida/não lida
 * - Limpeza de todas as notificações
 */

export interface Notification {
  id: number;
  type: "approval" | "pdi" | "succession" | "evaluation" | "info";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "approval",
      title: "Nova Solicitação de Aprovação",
      message: "João Silva solicitou aprovação de bônus de R$ 5.000",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min atrás
      link: "/aprovacoes/dashboard",
    },
    {
      id: 2,
      type: "pdi",
      title: "PDI Atualizado",
      message: "Maria Santos atualizou o progresso do PDI Inteligente",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h atrás
      link: "/pdi-inteligente/1",
    },
    {
      id: 3,
      type: "succession",
      title: "Mapa de Sucessão Modificado",
      message: "Nova posição crítica adicionada: Diretor de TI",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      link: "/mapa-sucessao",
    },
    {
      id: 4,
      type: "evaluation",
      title: "Avaliação 360° Concluída",
      message: "Pedro Costa completou a avaliação 360° do ciclo 2025",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
      link: "/avaliacao-360",
    },
  ]);

  // Queries (simulado - pode ser conectado ao backend)
  // const { data: notifications, refetch } = trpc.notifications.list.useQuery();

  // WebSocket integration (simulado)
  useEffect(() => {
    // TODO: Conectar ao WebSocket real
    // const ws = new WebSocket('ws://localhost:3000');
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   setNotifications(prev => [notification, ...prev]);
    //   toast.info(notification.title);
    // };
    // return () => ws.close();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Todas as notificações marcadas como lidas");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Todas as notificações removidas");
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "pdi":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "succession":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "evaluation":
        return <Check className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
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
                    !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                    setOpen(false);
                  }}
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
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
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

        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                window.location.href = "/notificacoes";
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
