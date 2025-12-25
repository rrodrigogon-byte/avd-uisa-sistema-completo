import type { Server as SocketIOServer } from "socket.io";
import type { NotificationPayload } from "../websocket";

export class NotificationService {
  constructor(private io: SocketIOServer) {}

  // Notificar usuário específico
  notifyUser(userId: number, notification: NotificationPayload) {
    this.io.to(`user:${userId}`).emit("notification", notification);
  }

  // Notificar todos os usuários
  notifyAll(notification: NotificationPayload) {
    this.io.emit("notification", notification);
  }

  // Notificações específicas do sistema

  notifyNewGoal(userId: number, goalTitle: string) {
    this.notifyUser(userId, {
      type: "meta",
      title: "Nova Meta Atribuída",
      message: `Você recebeu uma nova meta: ${goalTitle}`,
      link: "/metas",
    });
  }

  notifyGoalApproved(userId: number, goalTitle: string) {
    this.notifyUser(userId, {
      type: "meta",
      title: "Meta Aprovada",
      message: `Sua meta "${goalTitle}" foi aprovada pelo gestor`,
      link: "/metas",
    });
  }

  notifyGoalRejected(userId: number, goalTitle: string, reason?: string) {
    this.notifyUser(userId, {
      type: "meta",
      title: "Meta Rejeitada",
      message: `Sua meta "${goalTitle}" foi rejeitada${reason ? `: ${reason}` : ""}`,
      link: "/metas",
    });
  }

  notifyGoalDeadlineApproaching(userId: number, goalTitle: string, daysLeft: number) {
    this.notifyUser(userId, {
      type: "prazo",
      title: "Prazo de Meta Próximo",
      message: `A meta "${goalTitle}" vence em ${daysLeft} dia(s)`,
      link: "/metas",
    });
  }

  notifyEvaluationPending(userId: number, evaluatedName: string) {
    this.notifyUser(userId, {
      type: "avaliacao",
      title: "Avaliação Pendente",
      message: `Você tem uma avaliação pendente para ${evaluatedName}`,
      link: "/avaliacoes",
    });
  }

  notifyEvaluationCompleted(userId: number) {
    this.notifyUser(userId, {
      type: "avaliacao",
      title: "Avaliação Concluída",
      message: "Sua avaliação 360° foi concluída e está disponível para visualização",
      link: "/avaliacoes",
    });
  }

  notifyPDICreated(userId: number) {
    this.notifyUser(userId, {
      type: "pdi",
      title: "PDI Criado",
      message: "Seu Plano de Desenvolvimento Individual foi criado",
      link: "/pdi",
    });
  }

  notifyPDIApproved(userId: number) {
    this.notifyUser(userId, {
      type: "pdi",
      title: "PDI Aprovado",
      message: "Seu PDI foi aprovado pelo gestor",
      link: "/pdi",
    });
  }

  notifyPDIActionDue(userId: number, actionTitle: string, daysLeft: number) {
    this.notifyUser(userId, {
      type: "prazo",
      title: "Ação de PDI Vencendo",
      message: `A ação "${actionTitle}" vence em ${daysLeft} dia(s)`,
      link: "/pdi",
    });
  }

  notifyFeedbackReceived(userId: number, from: string) {
    this.notifyUser(userId, {
      type: "feedback",
      title: "Novo Feedback",
      message: `Você recebeu um feedback de ${from}`,
      link: "/avaliacoes",
    });
  }

  notifyCalibrationScheduled(userId: number, date: string) {
    this.notifyUser(userId, {
      type: "avaliacao",
      title: "Calibração Agendada",
      message: `Reunião de calibração agendada para ${date}`,
      link: "/calibracao",
    });
  }
}

// Helper para obter o serviço de notificações do contexto Express
export function getNotificationService(req: any): NotificationService | null {
  const io = req.app?.get('io');
  if (!io) {
    console.warn('[Notifications] Socket.IO não disponível no contexto');
    return null;
  }
  return new NotificationService(io);
}
