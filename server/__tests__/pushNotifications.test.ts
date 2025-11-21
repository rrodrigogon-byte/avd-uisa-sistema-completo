import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { pushNotificationLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para os novos endpoints de Push Notifications Logs
 */
describe("Push Notifications Logs", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testLogId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  it("deve registrar uma notificação com logNotification", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.pushNotifications.logNotification({
      type: "meta_atrasada",
      title: "Meta Atrasada",
      message: "Sua meta está atrasada há 7 dias",
      actionUrl: "/metas/1",
      deviceType: "desktop",
      status: "enviada",
    });

    expect(result).toHaveProperty("logId");
    expect(result.logId).toBeGreaterThan(0);
    testLogId = result.logId;

    // Verificar se foi inserido no banco
    if (!db) throw new Error("Database not available");
    const [log] = await db
      .select()
      .from(pushNotificationLogs)
      .where(eq(pushNotificationLogs.id, testLogId))
      .limit(1);

    expect(log).toBeDefined();
    expect(log.type).toBe("meta_atrasada");
    expect(log.title).toBe("Meta Atrasada");
    expect(log.status).toBe("enviada");
  });

  it("deve marcar notificação como aberta com markAsOpened", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.pushNotifications.markAsOpened({
      logId: testLogId,
    });

    expect(result.success).toBe(true);

    // Verificar se foi atualizado no banco
    if (!db) throw new Error("Database not available");
    const [log] = await db
      .select()
      .from(pushNotificationLogs)
      .where(eq(pushNotificationLogs.id, testLogId))
      .limit(1);

    expect(log.status).toBe("aberta");
    expect(log.openedAt).toBeDefined();
  });

  it("deve buscar logs reais com getRealLogs", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const logs = await caller.pushNotifications.getRealLogs({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    const testLog = logs.find((log: any) => log.id === testLogId);
    expect(testLog).toBeDefined();
    expect(testLog?.type).toBe("meta_atrasada");
    expect(testLog?.status).toBe("aberta");
  });

  it("deve filtrar logs por tipo", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const logs = await caller.pushNotifications.getRealLogs({
      type: "meta_atrasada",
      limit: 10,
    });

    expect(Array.isArray(logs)).toBe(true);
    logs.forEach((log: any) => {
      expect(log.type).toBe("meta_atrasada");
    });
  });

  it("deve filtrar logs por status", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const logs = await caller.pushNotifications.getRealLogs({
      status: "aberta",
      limit: 10,
    });

    expect(Array.isArray(logs)).toBe(true);
    logs.forEach((log: any) => {
      expect(log.status).toBe("aberta");
    });
  });

  it("deve filtrar logs por período", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    const endDate = new Date();

    const logs = await caller.pushNotifications.getRealLogs({
      startDate,
      endDate,
      limit: 50,
    });

    expect(Array.isArray(logs)).toBe(true);
    logs.forEach((log: any) => {
      const sentAt = new Date(log.sentAt);
      expect(sentAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(sentAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });
});
