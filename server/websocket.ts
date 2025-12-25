import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

    // Autenticação do usuário
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[WebSocket] Usuário ${userId} entrou na sala`);
    }

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

// Tipos de notificação
export interface NotificationPayload {
  type: "meta" | "avaliacao" | "pdi" | "feedback" | "prazo";
  title: string;
  message: string;
  link?: string;
}

// Funções helper para enviar notificações
export function sendNotificationToUser(
  io: SocketIOServer,
  userId: number,
  notification: NotificationPayload
) {
  io.to(`user:${userId}`).emit("notification", notification);
  console.log(`[WebSocket] Notificação enviada para usuário ${userId}:`, notification.title);
}

export function sendNotificationToAll(
  io: SocketIOServer,
  notification: NotificationPayload
) {
  io.emit("notification", notification);
  console.log(`[WebSocket] Notificação broadcast:`, notification.title);
}
