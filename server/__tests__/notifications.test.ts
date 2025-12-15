import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { employees, notifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Testes do Sistema de Notificações
 * Sistema AVD UISA
 */

describe("Sistema de Notificações", () => {
  let testEmployeeId: number;
  let testNotificationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar colaborador de teste
    const timestamp = Date.now();
    const [employee] = await db.insert(employees).values({
      employeeCode: `TEST-NOTIF-${timestamp}`,
      name: "Test Employee Notifications",
      email: `test-notif-${timestamp}@example.com`,
      openId: `test-openid-notif-${timestamp}`,
      hireDate: new Date(),
      departmentId: 1,
      positionId: 1,
      status: "ativo",
    });

    testEmployeeId = employee.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    if (testNotificationId) {
      await db.delete(notifications).where(eq(notifications.id, testNotificationId));
    }
    if (testEmployeeId) {
      await db.delete(notifications).where(eq(notifications.userId, testEmployeeId));
      await db.delete(employees).where(eq(employees.id, testEmployeeId));
    }
  });

  it("deve criar notificação ao conceder badge", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar notificação de badge
    const [notification] = await db.insert(notifications).values({
      userId: testEmployeeId,
      type: "badge",
      title: "Novo Badge Conquistado!",
      message: "Você conquistou o badge 'Achiever'",
      read: false,
    });

    testNotificationId = notification.insertId;

    // Verificar se notificação foi criada
    const createdNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, testNotificationId))
      .limit(1);

    expect(createdNotification.length).toBe(1);
    expect(createdNotification[0].type).toBe("badge");
    expect(createdNotification[0].read).toBe(false);
    expect(createdNotification[0].userId).toBe(testEmployeeId);
  });

  it("deve marcar notificação como lida", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Marcar como lida
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, testNotificationId));

    // Verificar se foi marcada
    const updatedNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, testNotificationId))
      .limit(1);

    expect(updatedNotification.length).toBe(1);
    expect(updatedNotification[0].read).toBe(true);
  });

  it("deve listar notificações não lidas do usuário", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar mais notificações
    await db.insert(notifications).values([
      {
        userId: testEmployeeId,
        type: "info",
        title: "Notificação 1",
        message: "Mensagem 1",
        read: false,
      },
      {
        userId: testEmployeeId,
        type: "info",
        title: "Notificação 2",
        message: "Mensagem 2",
        read: false,
      },
      {
        userId: testEmployeeId,
        type: "info",
        title: "Notificação 3",
        message: "Mensagem 3",
        read: true,
      },
    ]);

    // Buscar notificações não lidas
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, testEmployeeId), eq(notifications.read, false)));

    expect(unreadNotifications.length).toBeGreaterThanOrEqual(2);
  });

  it("deve contar notificações não lidas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const unreadCount = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, testEmployeeId), eq(notifications.read, false)));

    expect(unreadCount.length).toBeGreaterThan(0);
  });

  it("deve criar notificação de diferentes tipos", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const types = ["badge", "goal", "pdi", "evaluation", "feedback", "info"];

    for (const type of types) {
      await db.insert(notifications).values({
        userId: testEmployeeId,
        type: type as any,
        title: `Notificação ${type}`,
        message: `Mensagem de teste para ${type}`,
        read: false,
      });
    }

    // Verificar se todas foram criadas
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, testEmployeeId));

    const notificationTypes = allNotifications.map((n) => n.type);

    types.forEach((type) => {
      expect(notificationTypes).toContain(type);
    });
  });

  it("deve deletar notificações antigas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar notificação antiga (simulando data antiga)
    const [oldNotification] = await db.insert(notifications).values({
      userId: testEmployeeId,
      type: "info",
      title: "Notificação Antiga",
      message: "Esta notificação é antiga",
      read: true,
    });

    const oldNotifId = oldNotification.insertId;

    // Deletar notificação
    await db.delete(notifications).where(eq(notifications.id, oldNotifId));

    // Verificar se foi deletada
    const deletedNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, oldNotifId))
      .limit(1);

    expect(deletedNotification.length).toBe(0);
  });
});
