import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Employees List - Estrutura de Dados", () => {
  it("deve retornar funcionários com estrutura aninhada (employee, department, position)", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "email",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    } as any);

    const employees = await caller.employees.list();

    // Validar que retornou array
    expect(Array.isArray(employees)).toBe(true);

    if (employees.length > 0) {
      const firstItem = employees[0];

      // Validar estrutura aninhada - deve ter propriedade 'employee'
      expect(firstItem).toHaveProperty("employee");
      expect(typeof firstItem.employee).toBe("object");

      // Validar que 'employee' tem as propriedades esperadas
      expect(firstItem.employee).toHaveProperty("id");
      expect(typeof firstItem.employee.id).toBe("number");
      expect(firstItem.employee.id).toBeDefined();
      expect(firstItem.employee.id).not.toBeNull();

      expect(firstItem.employee).toHaveProperty("name");
      expect(firstItem.employee).toHaveProperty("email");
      expect(firstItem.employee).toHaveProperty("employeeCode");
      expect(firstItem.employee).toHaveProperty("status");

      // Validar que department e position estão no nível raiz (não dentro de employee)
      expect(firstItem).toHaveProperty("department");
      expect(firstItem).toHaveProperty("position");

      // Validar que NÃO tem propriedades diretas do employee no nível raiz (estrutura flat incorreta)
      expect(firstItem).not.toHaveProperty("name");
      expect(firstItem).not.toHaveProperty("email");
      expect(firstItem).not.toHaveProperty("employeeCode");

      console.log("✅ Estrutura aninhada validada:", {
        employeeId: firstItem.employee.id,
        employeeName: firstItem.employee.name,
        hasDepartment: !!firstItem.department,
        hasPosition: !!firstItem.position,
      });
    }
  });

  it("deve garantir que TODOS os funcionários têm ID definido dentro de employee", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "email",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    } as any);

    const employees = await caller.employees.list();

    // Validar que NENHUM funcionário tem ID undefined
    const employeesWithUndefinedId = employees.filter(
      (item: any) => !item.employee || item.employee.id === undefined || item.employee.id === null
    );

    expect(employeesWithUndefinedId.length).toBe(0);

    // Validar que todos os IDs são números válidos
    employees.forEach((item: any) => {
      expect(item.employee).toBeDefined();
      expect(typeof item.employee.id).toBe("number");
      expect(item.employee.id).toBeGreaterThan(0);
    });

    console.log(`✅ Validados ${employees.length} funcionários - todos com ID válido`);
  });

  it("deve retornar estrutura compatível com o componente React (EnviarTestes.tsx)", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "email",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    } as any);

    const employees = await caller.employees.list();

    if (employees.length > 0) {
      const firstItem = employees[0];

      // Simular o que o componente React faz (linha 310-326 de EnviarTestes.tsx)
      // key={item.employee.id}
      const reactKey = `employee-${firstItem.employee.id}`;
      expect(reactKey).not.toContain("undefined");
      expect(reactKey).toMatch(/^employee-\d+$/);

      // item.employee.status
      expect(firstItem.employee).toHaveProperty("status");
      expect(typeof firstItem.employee.status).toBe("string");

      // item.employee.email
      expect(firstItem.employee).toHaveProperty("email");

      // item.employee.name
      expect(firstItem.employee).toHaveProperty("name");
      expect(typeof firstItem.employee.name).toBe("string");

      // item.position?.title
      const positionTitle = firstItem.position?.title || "N/A";
      expect(typeof positionTitle).toBe("string");

      console.log("✅ Estrutura compatível com React (EnviarTestes.tsx):", {
        key: reactKey,
        status: firstItem.employee.status,
        name: firstItem.employee.name,
        email: firstItem.employee.email,
        positionTitle,
      });
    }
  });

  it("deve filtrar funcionários ativos corretamente", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "email",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    } as any);

    const employees = await caller.employees.list();

    // Por padrão, deve retornar apenas funcionários ativos
    employees.forEach((item: any) => {
      expect(item.employee.status).toBe("ativo");
    });
  });
});
