import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Employees List - Estrutura de Dados", () => {
  it("deve retornar funcionários com estrutura flat (id no nível raiz)", async () => {
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
      const firstEmployee = employees[0];

      // Validar estrutura flat - id deve estar no nível raiz
      expect(firstEmployee).toHaveProperty("id");
      expect(typeof firstEmployee.id).toBe("number");
      expect(firstEmployee.id).toBeDefined();
      expect(firstEmployee.id).not.toBeNull();

      // Validar outros campos essenciais no nível raiz
      expect(firstEmployee).toHaveProperty("name");
      expect(firstEmployee).toHaveProperty("email");
      expect(firstEmployee).toHaveProperty("employeeCode");
      expect(firstEmployee).toHaveProperty("active");

      // Validar que NÃO tem estrutura aninhada employee.employee
      expect(firstEmployee).not.toHaveProperty("employee");

      // Validar que department e position são objetos separados (se existirem)
      if (firstEmployee.department) {
        expect(typeof firstEmployee.department).toBe("object");
        expect(firstEmployee.department).toHaveProperty("name");
      }

      if (firstEmployee.position) {
        expect(typeof firstEmployee.position).toBe("object");
        expect(firstEmployee.position).toHaveProperty("title");
      }

      console.log("✅ Estrutura validada:", {
        id: firstEmployee.id,
        name: firstEmployee.name,
        hasDepartment: !!firstEmployee.department,
        hasPosition: !!firstEmployee.position,
      });
    }
  });

  it("deve garantir que TODOS os funcionários têm ID definido", async () => {
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
      (emp: any) => emp.id === undefined || emp.id === null
    );

    expect(employeesWithUndefinedId.length).toBe(0);

    // Validar que todos os IDs são números válidos
    employees.forEach((emp: any) => {
      expect(typeof emp.id).toBe("number");
      expect(emp.id).toBeGreaterThan(0);
    });

    console.log(`✅ Validados ${employees.length} funcionários - todos com ID válido`);
  });

  it("deve retornar estrutura compatível com o componente React", async () => {
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
      const firstEmployee = employees[0];

      // Simular o que o componente React faz
      const reactKey = `employee-${firstEmployee.id}`;
      expect(reactKey).not.toContain("undefined");
      expect(reactKey).toMatch(/^employee-\d+$/);

      // Validar acesso a campos aninhados como no componente
      const departmentName = firstEmployee.department?.name || "N/A";
      const positionTitle = firstEmployee.position?.title || "N/A";

      expect(typeof departmentName).toBe("string");
      expect(typeof positionTitle).toBe("string");

      console.log("✅ Estrutura compatível com React:", {
        key: reactKey,
        departmentName,
        positionTitle,
      });
    }
  });
});
