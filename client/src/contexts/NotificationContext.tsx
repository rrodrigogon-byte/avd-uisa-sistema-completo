import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface Notification {
  id: string;
  type: "meta" | "avaliacao" | "pdi" | "feedback" | "prazo";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Conectar ao WebSocket
    const newSocket = io(window.location.origin, {
      auth: {
        userId: user.id,
      },
    });

    newSocket.on("connect", () => {
      console.log("WebSocket conectado");
    });

    newSocket.on("notification", (data: Omit<Notification, "id" | "read" | "timestamp">) => {
      const notification: Notification = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);

      // Mostrar toast
      toast(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: "Ver",
          onClick: () => window.location.href = notification.link!,
        } : undefined,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket desconectado");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
