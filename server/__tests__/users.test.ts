import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import * as db from "../db";
import { users } from "../../drizzle/schema";

describe("Gestão de Usuários", () => {
  let testUserId: number | null = null;
  const testEmail = `test-user-${Date.now()}@test.com`;

  afterAll(async () => {
    // Limpar usuário de teste
    if (testUserId) {
      const database = await db.getDb();
      if (database) {
        await database.delete(users).where(eq(users.id, testUserId));
      }
    }
  });

  it("deve criar um novo usuário", async () => {
    const database = await db.getDb();
    expect(database).toBeDefined();

    if (!database) return;

    const result = await database.insert(users).values({
      openId: `test_${Date.now()}`,
      name: "Usuário Teste",
      email: testEmail,
      role: "colaborador",
      isSalaryLead: false,
      loginMethod: "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    expect(result).toBeDefined();

    // Buscar usuário criado
    const newUser = await db.getUserByEmail(testEmail);
    expect(newUser).toBeDefined();
    expect(newUser?.email).toBe(testEmail);
    expect(newUser?.name).toBe("Usuário Teste");
    expect(newUser?.role).toBe("colaborador");

    testUserId = newUser?.id || null;
  });

  it("deve buscar usuário por ID", async () => {
    expect(testUserId).toBeDefined();
    if (!testUserId) return;

    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.id).toBe(testUserId);
    expect(user?.email).toBe(testEmail);
  });

  it("deve buscar usuário por email", async () => {
    const user = await db.getUserByEmail(testEmail);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.name).toBe("Usuário Teste");
  });

  it("deve atualizar role do usuário", async () => {
    expect(testUserId).toBeDefined();
    if (!testUserId) return;

    await db.updateUserRole(testUserId, "gestor");

    const user = await db.getUserById(testUserId);
    expect(user?.role).toBe("gestor");
  });

  it("deve atualizar status de Líder de C&S", async () => {
    expect(testUserId).toBeDefined();
    if (!testUserId) return;

    await db.updateUserSalaryLead(testUserId, true);

    const user = await db.getUserById(testUserId);
    expect(user?.isSalaryLead).toBe(true);
  });

  it("deve buscar usuários por role", async () => {
    const gestores = await db.getUsersByRole("gestor");
    expect(gestores).toBeDefined();
    expect(Array.isArray(gestores)).toBe(true);
    
    // Deve incluir nosso usuário de teste
    const testUser = gestores.find(u => u.id === testUserId);
    expect(testUser).toBeDefined();
  });

  it("deve buscar usuários com termo de busca", async () => {
    const results = await db.searchUsers("Teste");
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Deve incluir nosso usuário de teste
    const testUser = results.find(u => u.id === testUserId);
    expect(testUser).toBeDefined();
  });

  it("deve listar todos os usuários", async () => {
    const allUsers = await db.getAllUsers();
    expect(allUsers).toBeDefined();
    expect(Array.isArray(allUsers)).toBe(true);
    expect(allUsers.length).toBeGreaterThan(0);
    
    // Deve incluir nosso usuário de teste
    const testUser = allUsers.find(u => u.id === testUserId);
    expect(testUser).toBeDefined();
  });

  it("deve deletar usuário", async () => {
    expect(testUserId).toBeDefined();
    if (!testUserId) return;

    const database = await db.getDb();
    expect(database).toBeDefined();
    if (!database) return;

    await database.delete(users).where(eq(users.id, testUserId));

    const user = await db.getUserById(testUserId);
    expect(user).toBeUndefined();

    // Resetar para não tentar deletar novamente no afterAll
    testUserId = null;
  });
});
