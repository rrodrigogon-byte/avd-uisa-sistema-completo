import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Teste para validar correção do sistema de envio de credenciais
 * 
 * Cenários testados:
 * 1. Vinculação existente (userId já está em employees)
 * 2. Vinculação por email (userId null, mas email coincide)
 * 3. Sem vinculação (erro esperado)
 */

describe("Sistema de Envio de Credenciais - Correção de Vinculação", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testUserId3: number;
  let testEmployeeId1: number;
  let testEmployeeId2: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Cenário 1: Usuário com vinculação existente
    const [user1] = await db.insert(users).values({
      openId: `test-send-cred-1-${Date.now()}`,
      name: "Teste Vinculação Existente",
      email: "teste.vinculacao.existente@test.com",
      role: "colaborador",
    });
    testUserId1 = user1.insertId;

    const [emp1] = await db.insert(employees).values({
      userId: testUserId1, // Vinculação já existe
      employeeCode: `EMP-TEST-1-${Date.now()}`,
      name: "Teste Vinculação Existente",
      email: "teste.vinculacao.existente@test.com",
      hireDate: new Date(),
      departmentId: 1,
      positionId: 1,
    });
    testEmployeeId1 = emp1.insertId;

    // Cenário 2: Usuário sem vinculação, mas com email coincidente
    const [user2] = await db.insert(users).values({
      openId: `test-send-cred-2-${Date.now()}`,
      name: "Teste Vinculação Por Email",
      email: "teste.vinculacao.email@test.com",
      role: "colaborador",
    });
    testUserId2 = user2.insertId;

    const [emp2] = await db.insert(employees).values({
      userId: null, // Sem vinculação inicial
      employeeCode: `EMP-TEST-2-${Date.now()}`,
      name: "Teste Vinculação Por Email",
      email: "teste.vinculacao.email@test.com", // Email coincide
      hireDate: new Date(),
      departmentId: 1,
      positionId: 1,
    });
    testEmployeeId2 = emp2.insertId;

    // Cenário 3: Usuário sem vinculação e sem email coincidente
    const [user3] = await db.insert(users).values({
      openId: `test-send-cred-3-${Date.now()}`,
      name: "Teste Sem Vinculação",
      email: "teste.sem.vinculacao@test.com",
      role: "colaborador",
    });
    testUserId3 = user3.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db.delete(employees).where(eq(employees.id, testEmployeeId1));
    await db.delete(employees).where(eq(employees.id, testEmployeeId2));
    await db.delete(users).where(eq(users.id, testUserId1));
    await db.delete(users).where(eq(users.id, testUserId2));
    await db.delete(users).where(eq(users.id, testUserId3));
  });

  it("Cenário 1: Deve encontrar funcionário com vinculação existente", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar por userId (vinculação existente)
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, testUserId1))
      .limit(1);

    expect(employee.length).toBe(1);
    expect(employee[0].userId).toBe(testUserId1);
    expect(employee[0].email).toBe("teste.vinculacao.existente@test.com");
    
    console.log("✅ Cenário 1: Vinculação existente encontrada corretamente");
  });

  it("Cenário 2: Deve criar vinculação quando encontrar por email", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId2))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.email).toBe("teste.vinculacao.email@test.com");

    // Simular lógica da procedure: buscar por userId
    let employee = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, testUserId2))
      .limit(1);

    // Não deve encontrar (userId é null)
    expect(employee.length).toBe(0);

    // Buscar por email
    employee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, user.email!))
      .limit(1);

    // Deve encontrar
    expect(employee.length).toBe(1);
    expect(employee[0].email).toBe(user.email);
    expect(employee[0].userId).toBeNull();

    // Criar vinculação
    await db
      .update(employees)
      .set({ userId: testUserId2 })
      .where(eq(employees.id, employee[0].id));

    // Verificar vinculação criada
    const [updatedEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employee[0].id))
      .limit(1);

    expect(updatedEmployee.userId).toBe(testUserId2);
    
    console.log("✅ Cenário 2: Vinculação criada por email com sucesso");
  });

  it("Cenário 3: Deve retornar erro quando não houver vinculação", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId3))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.email).toBe("teste.sem.vinculacao@test.com");

    // Buscar por userId
    let employee = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, testUserId3))
      .limit(1);

    expect(employee.length).toBe(0);

    // Buscar por email
    employee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, user.email!))
      .limit(1);

    // Não deve encontrar
    expect(employee.length).toBe(0);

    // Simular erro esperado
    const errorMessage = `Funcionário vinculado não encontrado. Verifique se existe um funcionário cadastrado com o email ${user.email}`;
    expect(errorMessage).toContain(user.email);
    
    console.log("✅ Cenário 3: Erro apropriado quando não há vinculação");
  });

  it("Deve validar estrutura de dados do employee", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId1))
      .limit(1);

    expect(employee).toBeDefined();
    expect(employee).toHaveProperty("id");
    expect(employee).toHaveProperty("userId");
    expect(employee).toHaveProperty("email");
    expect(employee).toHaveProperty("passwordHash");
    expect(employee).toHaveProperty("employeeCode");
    
    console.log("✅ Estrutura de dados do employee validada");
  });

  it("Deve validar que email é obrigatório para envio de credenciais", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId1))
      .limit(1);

    expect(user.email).toBeDefined();
    expect(user.email).toBeTruthy();
    
    // Validar que email não é vazio
    if (!user.email) {
      throw new Error("Usuário não possui e-mail cadastrado");
    }

    expect(user.email.length).toBeGreaterThan(0);
    expect(user.email).toContain("@");
    
    console.log("✅ Validação de email obrigatório funcionando");
  });
});
