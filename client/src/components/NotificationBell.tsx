import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import io, { Socket } from "socket.io-client";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export default function NotificationBell() {
  const [, setLocation] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  const { data: notifications, refetch } = trpc.notifications.getMyNotifications.useQuery({
    limit: 10,
  });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Solicitar permissão para notificações do navegador
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setBrowserNotificationsEnabled(permission === "granted");
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      setBrowserNotificationsEnabled(true);
    }
  }, []);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi77eeeTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3nnk0QDFC");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Silenciar erro se o navegador bloquear o som
    }
  };

  // Função para mostrar notificação do navegador
  const showBrowserNotification = (title: string, message: string) => {
    if (browserNotificationsEnabled && "Notification" in window) {
      try {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      } catch (error) {
        console.error("Erro ao mostrar notificação:", error);
      }
    }
  };

  // WebSocket para notificações em tempo real
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Conectado ao sistema de notificações");
    });

    newSocket.on("new-notification", (data: { title: string; message: string }) => {
      // Tocar som
      playNotificationSound();
      
      // Mostrar notificação do navegador
      if (data.title && data.message) {
        showBrowserNotification(data.title, data.message);
      }
      
      // Atualizar lista de notificações
      refetch();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [refetch, browserNotificationsEnabled]);

  // Atualizar contador de não lidas
  useEffect(() => {
    if (notifications) {
      const count = notifications.filter((n) => !n.read).length;
      setUnreadCount(count);
    }
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate({ id: notification.id });
    }

    if (notification.link) {
      setLocation(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meta_aprovada":
      case "meta_rejeitada":
        return "🎯";
      case "avaliacao_pendente":
      case "avaliacao_recebida":
        return "📊";
      case "consenso_pendente":
        return "🤝";
      case "pdi_vencendo":
        return "📚";
      case "meta_atrasada":
        return "⏰";
      case "badge_conquistado":
        return "🏆";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications && (notifications as Notification[]).length > 0 ? (
            (notifications as Notification[]).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? "bg-accent" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs shrink-0">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center cursor-pointer"
          onClick={() => setLocation("/notificacoes")}
        >
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
