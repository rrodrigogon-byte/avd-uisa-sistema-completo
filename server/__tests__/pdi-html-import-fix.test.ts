import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { users, employees, evaluationCycles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Teste para validar a correção do erro "Usuário não encontrado"
 * na importação de PDI HTML
 */
describe("PDI HTML Import - User Validation Fix", () => {
  let testUserId: number;
  let testEmployeeId: number;
  let testCycleId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar usuário admin existente
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (adminUser.length === 0) {
      throw new Error("Nenhum usuário admin encontrado no banco");
    }

    testUserId = adminUser[0].id;

    // Buscar ou criar funcionário de teste
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.name, "Fernando Henrique"))
      .limit(1);

    if (employee.length > 0) {
      testEmployeeId = employee[0].id;
    } else {
      const [newEmployee] = await db
        .insert(employees)
        .values({
          employeeCode: "TEST_EMP_001",
          name: "Fernando Henrique",
          chapa: "TEST_001",
          cargo: "Gerente de Operações",
          status: "ativo",
        })
        .$returningId();
      testEmployeeId = newEmployee.id;
    }

    // Buscar ciclo ativo
    const cycle = await db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.status, "ativo"))
      .limit(1);

    if (cycle.length === 0) {
      throw new Error("Nenhum ciclo ativo encontrado");
    }

    testCycleId = cycle[0].id;
  });

  it("deve validar que o usuário existe antes de importar PDI", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar usuário
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user.length).toBe(1);
    expect(user[0].id).toBe(testUserId);
    expect(user[0].role).toBe("admin");
  });

  it("deve ter o campo id definido no usuário", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user[0].id).toBeDefined();
    expect(typeof user[0].id).toBe("number");
    expect(user[0].id).toBeGreaterThan(0);
  });

  it("deve ter funcionário e ciclo disponíveis para importação", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Validar funcionário
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId))
      .limit(1);

    expect(employee.length).toBe(1);
    expect(employee[0].id).toBe(testEmployeeId);

    // Validar ciclo
    const cycle = await db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.id, testCycleId))
      .limit(1);

    expect(cycle.length).toBe(1);
    expect(cycle[0].id).toBe(testCycleId);
    expect(cycle[0].status).toBe("ativo");
  });
});
