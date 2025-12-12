import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, employees, departments, positions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para Cadastro de Funcionários
 * Valida que datas são enviadas como strings ISO e positionId é capturado corretamente
 */

describe("Employees Create - Correção Definitiva", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let testDepartmentId: number;
  let testPositionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar usuário admin
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (!adminUser) throw new Error("Admin user not found");

    // Criar caller com contexto de admin
    adminCaller = appRouter.createCaller({
      user: adminUser,
      req: {} as any,
      res: {} as any,
    });

    // Buscar ou criar departamento de teste
    const [dept] = await db
      .select()
      .from(departments)
      .limit(1);

    if (dept) {
      testDepartmentId = dept.id;
    } else {
      const [newDept] = await db
        .insert(departments)
        .values({
          name: "Departamento Teste",
          description: "Departamento para testes",
        })
        .$returningId();
      testDepartmentId = newDept.id;
    }

    // Buscar ou criar cargo de teste
    const [pos] = await db
      .select()
      .from(positions)
      .limit(1);

    if (pos) {
      testPositionId = pos.id;
    } else {
      const [newPos] = await db
        .insert(positions)
        .values({
          title: "Cargo Teste",
          description: "Cargo para testes",
          departmentId: testDepartmentId,
        })
        .$returningId();
      testPositionId = newPos.id;
    }
  });

  it("deve criar funcionário com datas como strings ISO (YYYY-MM-DD)", async () => {
    const employeeData = {
      employeeCode: `TEST-${Date.now()}`,
      name: "João Silva Teste",
      email: `joao.teste.${Date.now()}@example.com`,
      cpf: `${Date.now()}`.slice(0, 11),
      birthDate: "1990-05-15", // String ISO
      hireDate: "2024-01-10", // String ISO
      departmentId: testDepartmentId,
      positionId: testPositionId,
      phone: "(11) 98765-4321",
      address: "Rua Teste, 123",
    };

    const result = await adminCaller.employees.create(employeeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");

    // Verificar que foi salvo corretamente no banco
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [savedEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, result.id))
      .limit(1);

    expect(savedEmployee).toBeDefined();
    expect(savedEmployee.name).toBe(employeeData.name);
    expect(savedEmployee.email).toBe(employeeData.email);
    expect(savedEmployee.positionId).toBe(testPositionId);
    expect(savedEmployee.departmentId).toBe(testDepartmentId);
  }, 15000);

  it("deve criar funcionário com birthDate opcional (undefined)", async () => {
    const employeeData = {
      employeeCode: `TEST-${Date.now()}`,
      name: "Maria Santos Teste",
      email: `maria.teste.${Date.now()}@example.com`,
      hireDate: "2024-02-20", // String ISO obrigatória
      departmentId: testDepartmentId,
      positionId: testPositionId,
      // birthDate: undefined (não enviado)
    };

    const result = await adminCaller.employees.create(employeeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");

    // Verificar que foi salvo corretamente no banco
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [savedEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, result.id))
      .limit(1);

    expect(savedEmployee).toBeDefined();
    expect(savedEmployee.name).toBe(employeeData.name);
    expect(savedEmployee.birthDate).toBeNull();
  }, 15000);

  it("deve validar que positionId é obrigatório e numérico", async () => {
    const employeeData = {
      employeeCode: `TEST-${Date.now()}`,
      name: "Pedro Costa Teste",
      email: `pedro.teste.${Date.now()}@example.com`,
      hireDate: "2024-03-15",
      departmentId: testDepartmentId,
      // positionId: undefined (não enviado - deve falhar)
    };

    await expect(
      adminCaller.employees.create(employeeData as any)
    ).rejects.toThrow();
  });

  it("deve validar formato de data ISO (YYYY-MM-DD)", async () => {
    const employeeData = {
      employeeCode: `TEST-${Date.now()}`,
      name: "Ana Lima Teste",
      email: `ana.teste.${Date.now()}@example.com`,
      cpf: `${Date.now()}`.slice(0, 11),
      hireDate: "2024-04-25",
      birthDate: "1995-08-30", // Formato correto
      departmentId: testDepartmentId,
      positionId: testPositionId,
    };

    const result = await adminCaller.employees.create(employeeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verificar que as datas foram salvas corretamente
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [savedEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, result.id))
      .limit(1);

    expect(savedEmployee).toBeDefined();
    expect(savedEmployee.birthDate).toBeDefined();
    expect(savedEmployee.hireDate).toBeDefined();
  }, 15000);
});
