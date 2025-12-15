/**
 * Testes de Integridade do Sistema AVD UISA
 * 
 * Testa validações, transações, auditoria e segurança
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  validateEmail,
  validateCPF,
  validatePhone,
  validatePastDate,
  validateDateRange,
  validateEmployeeData,
  validateEvaluationCycleData,
  employeeExists,
  evaluationCycleExists,
  evaluationExistsForEmployeeInCycle,
  withTransaction,
  logAudit,
  logCreate,
  logUpdate,
  logDelete,
  logError,
  assertValid,
  assertExists,
  assertNotExists,
} from "../server/integrity";
import { getDb } from "../server/db";

describe("Validações de Formato", () => {
  it("deve validar emails corretamente", () => {
    expect(validateEmail("teste@exemplo.com")).toBe(true);
    expect(validateEmail("usuario.nome@empresa.com.br")).toBe(true);
    expect(validateEmail("email_invalido")).toBe(false);
    expect(validateEmail("@exemplo.com")).toBe(false);
    expect(validateEmail("teste@")).toBe(false);
  });

  it("deve validar CPF corretamente", () => {
    expect(validateCPF("123.456.789-09")).toBe(true);
    expect(validateCPF("12345678909")).toBe(true);
    expect(validateCPF("111.111.111-11")).toBe(false); // CPF inválido (todos dígitos iguais)
    expect(validateCPF("123.456.789-00")).toBe(false); // Dígito verificador incorreto
    expect(validateCPF("123456789")).toBe(false); // Tamanho incorreto
  });

  it("deve validar telefones corretamente", () => {
    expect(validatePhone("(11) 98765-4321")).toBe(true);
    expect(validatePhone("11987654321")).toBe(true);
    expect(validatePhone("1133334444")).toBe(true);
    expect(validatePhone("123")).toBe(false); // Muito curto
    expect(validatePhone("123456789012345")).toBe(false); // Muito longo
  });

  it("deve validar datas passadas", () => {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    expect(validatePastDate(ontem)).toBe(true);
    expect(validatePastDate(hoje)).toBe(true);
    expect(validatePastDate(amanha)).toBe(false);
  });

  it("deve validar ranges de datas", () => {
    const inicio = new Date("2024-01-01");
    const fim = new Date("2024-12-31");
    const fimInvalido = new Date("2023-12-31");

    expect(validateDateRange(inicio, fim)).toBe(true);
    expect(validateDateRange(inicio, fimInvalido)).toBe(false);
  });
});

describe("Validações de Dados de Negócio", () => {
  it("deve validar dados de colaborador", () => {
    const dadosValidos = {
      name: "João Silva",
      email: "joao@empresa.com",
      cpf: "123.456.789-09",
      phone: "(11) 98765-4321",
      birthDate: new Date("1990-01-01"),
      hireDate: new Date("2020-01-01"),
    };

    const result = validateEmployeeData(dadosValidos);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("deve rejeitar dados de colaborador inválidos", () => {
    const dadosInvalidos = {
      name: "Jo", // Nome muito curto
      email: "email_invalido",
      cpf: "111.111.111-11", // CPF inválido
      phone: "123", // Telefone inválido
      birthDate: new Date("2030-01-01"), // Data futura
      hireDate: new Date("2030-01-01"), // Data futura
    };

    const result = validateEmployeeData(dadosInvalidos);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("deve validar idade mínima na contratação", () => {
    const dadosInvalidos = {
      birthDate: new Date("2015-01-01"),
      hireDate: new Date("2020-01-01"), // Colaborador teria 5 anos
    };

    const result = validateEmployeeData(dadosInvalidos);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Colaborador deve ter pelo menos 14 anos na data de contratação"
    );
  });

  it("deve validar dados de ciclo de avaliação", () => {
    const dadosValidos = {
      name: "Ciclo 2024",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    };

    const result = validateEvaluationCycleData(dadosValidos);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("deve rejeitar ciclo com duração muito curta", () => {
    const dadosInvalidos = {
      name: "Ciclo Curto",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-05"), // Apenas 4 dias
    };

    const result = validateEvaluationCycleData(dadosInvalidos);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Ciclo de avaliação deve ter pelo menos 7 dias");
  });
});

describe("Verificações de Integridade Referencial", () => {
  it("deve verificar se colaborador existe", async () => {
    // Assumindo que existe um colaborador com ID 1 no banco de teste
    const exists = await employeeExists(1);
    expect(typeof exists).toBe("boolean");
  });

  it("deve retornar false para colaborador inexistente", async () => {
    const exists = await employeeExists(999999);
    expect(exists).toBe(false);
  });

  it("deve verificar se ciclo de avaliação existe", async () => {
    const exists = await evaluationCycleExists(1);
    expect(typeof exists).toBe("boolean");
  });

  it("deve verificar duplicata de avaliação", async () => {
    const exists = await evaluationExistsForEmployeeInCycle(1, 1);
    expect(typeof exists).toBe("boolean");
  });
});

describe("Helpers de Assertion", () => {
  it("assertValid deve lançar erro para validação inválida", () => {
    const invalidResult = {
      valid: false,
      errors: ["Erro 1", "Erro 2"],
    };

    expect(() => assertValid(invalidResult)).toThrow("Validation failed: Erro 1, Erro 2");
  });

  it("assertValid não deve lançar erro para validação válida", () => {
    const validResult = {
      valid: true,
      errors: [],
    };

    expect(() => assertValid(validResult)).not.toThrow();
  });

  it("assertExists deve lançar erro se recurso não existe", async () => {
    await expect(
      assertExists("Recurso", async () => false)
    ).rejects.toThrow("Recurso not found");
  });

  it("assertExists não deve lançar erro se recurso existe", async () => {
    await expect(
      assertExists("Recurso", async () => true)
    ).resolves.not.toThrow();
  });

  it("assertNotExists deve lançar erro se recurso já existe", async () => {
    await expect(
      assertNotExists("Recurso", async () => true)
    ).rejects.toThrow("Recurso already exists");
  });

  it("assertNotExists não deve lançar erro se recurso não existe", async () => {
    await expect(
      assertNotExists("Recurso", async () => false)
    ).resolves.not.toThrow();
  });
});

describe("Sistema de Transações", () => {
  it("deve executar operação em transação com sucesso", async () => {
    const result = await withTransaction(async (db) => {
      return { success: true, value: 42 };
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ success: true, value: 42 });
  });

  it("deve fazer rollback em caso de erro", async () => {
    const result = await withTransaction(async (db) => {
      throw new Error("Erro intencional");
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Erro intencional");
  });
});

describe("Sistema de Auditoria", () => {
  const mockContext = {
    userId: 1,
    userName: "Teste User",
    userEmail: "teste@exemplo.com",
    action: "test_action",
    resource: "test_resource",
    resourceId: 1,
  };

  it("deve registrar log de criação", async () => {
    await expect(
      logCreate(mockContext, { field: "value" })
    ).resolves.not.toThrow();
  });

  it("deve registrar log de atualização", async () => {
    await expect(
      logUpdate(mockContext, { field: "old" }, { field: "new" })
    ).resolves.not.toThrow();
  });

  it("deve registrar log de exclusão", async () => {
    await expect(
      logDelete(mockContext, { field: "value" })
    ).resolves.not.toThrow();
  });

  it("deve registrar log de erro", async () => {
    await expect(
      logError(mockContext, "Erro de teste")
    ).resolves.not.toThrow();
  });

  it("deve registrar log completo com todos os campos", async () => {
    await expect(
      logAudit(mockContext, {
        oldValue: { status: "old" },
        newValue: { status: "new" },
        success: true,
      })
    ).resolves.not.toThrow();
  });
});

describe("Integridade de Dados no Banco", () => {
  it("banco de dados deve estar disponível", async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it("deve ter tabelas principais criadas", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Verificar se conseguimos fazer queries básicas
    // Isso garante que as tabelas existem
    const queries = [
      db.execute("SELECT 1 FROM users LIMIT 1"),
      db.execute("SELECT 1 FROM employees LIMIT 1"),
      db.execute("SELECT 1 FROM evaluationCycles LIMIT 1"),
      db.execute("SELECT 1 FROM performanceEvaluations LIMIT 1"),
      db.execute("SELECT 1 FROM auditLogs LIMIT 1"),
    ];

    await expect(Promise.all(queries)).resolves.toBeDefined();
  });
});
