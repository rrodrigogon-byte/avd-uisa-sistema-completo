import { describe, it, expect, beforeAll } from "vitest";
import { listEmployees } from "../db";

/**
 * Testes de Performance - Busca de Funcionários
 * 
 * Valida que a otimização de busca está funcionando corretamente:
 * - Busca deve usar SQL LIKE no banco de dados
 * - Resultados limitados a 100 registros
 * - Tempo de resposta < 1 segundo
 */
describe("Busca de Funcionários - Performance", () => {
  it("deve retornar resultados limitados a 100 registros", async () => {
    const results = await listEmployees({ search: "a" });
    expect(results.length).toBeLessThanOrEqual(100);
  });

  it("deve buscar por nome parcial", async () => {
    const results = await listEmployees({ search: "rod" });
    
    // Deve retornar resultados
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Todos os resultados devem conter "rod" no nome ou email
    results.forEach((item: any) => {
      const nameMatch = item.employee.name.toLowerCase().includes("rod");
      const emailMatch = item.employee.email.toLowerCase().includes("rod");
      expect(nameMatch || emailMatch).toBe(true);
    });
  });

  it("deve buscar por email parcial", async () => {
    const results = await listEmployees({ search: "@" });
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Todos os resultados devem ter email
    results.forEach((item: any) => {
      expect(item.employee.email).toContain("@");
    });
  });

  it("deve retornar vazio para busca sem resultados", async () => {
    const results = await listEmployees({ search: "xyzabc123notfound" });
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("deve filtrar apenas funcionários ativos por padrão", async () => {
    const results = await listEmployees({ search: "a" });
    
    results.forEach((item: any) => {
      expect(item.employee.status).toBe("ativo");
    });
  });

  it("deve retornar dados completos (employee, department, position)", async () => {
    const results = await listEmployees({ search: "a" });
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult).toHaveProperty("employee");
      expect(firstResult).toHaveProperty("department");
      expect(firstResult).toHaveProperty("position");
      
      // Employee deve ter campos básicos
      expect(firstResult.employee).toHaveProperty("id");
      expect(firstResult.employee).toHaveProperty("name");
      expect(firstResult.employee).toHaveProperty("email");
    }
  });

  it("deve responder em menos de 1 segundo", async () => {
    const startTime = Date.now();
    await listEmployees({ search: "silva" });
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000); // < 1 segundo
  });

  it("deve combinar filtros de busca com filtros de departamento", async () => {
    const results = await listEmployees({ 
      search: "a",
      departmentId: 1 
    });
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Todos devem ser do departamento especificado
    results.forEach((item: any) => {
      expect(item.employee.departmentId).toBe(1);
    });
  });

  it("deve funcionar com busca vazia (retornar primeiros 100 ativos)", async () => {
    const results = await listEmployees({ search: "" });
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(100);
  });

  it("deve funcionar sem filtros (retornar primeiros 100 ativos)", async () => {
    const results = await listEmployees();
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(100);
  });
});
