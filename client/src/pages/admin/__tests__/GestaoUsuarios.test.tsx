/**
 * Testes para GestaoUsuarios
 * Valida proteção contra dados undefined/null
 */

import { describe, it, expect } from "vitest";
import { safeMap, safeFilter, safeLength } from "@/lib/arrayHelpers";

describe("GestaoUsuarios - Proteção de Dados", () => {
  it("deve contar usuários admin sem erro com dados válidos", () => {
    const users = [
      { id: 1, name: "Admin 1", role: "admin" },
      { id: 2, name: "Gestor 1", role: "gestor" },
      { id: 3, name: "Admin 2", role: "admin" },
    ];
    
    const adminCount = safeLength(safeFilter(users, (u) => u.role === "admin"));
    
    expect(adminCount).toBe(2);
  });

  it("deve lidar com users undefined sem erro", () => {
    const users = undefined;
    
    const adminCount = safeLength(safeFilter(users, (u: any) => u.role === "admin"));
    
    expect(adminCount).toBe(0);
  });

  it("deve lidar com users null sem erro", () => {
    const users = null;
    
    const adminCount = safeLength(safeFilter(users, (u: any) => u.role === "admin"));
    
    expect(adminCount).toBe(0);
  });

  it("deve contar usuários por role corretamente", () => {
    const users = [
      { id: 1, role: "admin" },
      { id: 2, role: "gestor" },
      { id: 3, role: "rh" },
      { id: 4, role: "admin" },
      { id: 5, role: "gestor" },
    ];
    
    const adminCount = safeLength(safeFilter(users, (u) => u.role === "admin"));
    const gestorCount = safeLength(safeFilter(users, (u) => u.role === "gestor"));
    const rhCount = safeLength(safeFilter(users, (u) => u.role === "rh"));
    
    expect(adminCount).toBe(2);
    expect(gestorCount).toBe(2);
    expect(rhCount).toBe(1);
  });

  it("deve mapear usuários para tabela sem erro", () => {
    const users = [
      { id: 1, name: "João", email: "joao@test.com", role: "admin" },
      { id: 2, name: "Maria", email: "maria@test.com", role: "gestor" },
    ];
    
    const mappedUsers = safeMap(users, (u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
    }));
    
    expect(mappedUsers).toHaveLength(2);
    expect(mappedUsers[0].name).toBe("João");
    expect(mappedUsers[1].name).toBe("Maria");
  });

  it("deve mapear users undefined sem erro", () => {
    const users = undefined;
    
    const mappedUsers = safeMap(users, (u: any) => ({
      id: u.id,
      name: u.name,
    }));
    
    expect(mappedUsers).toEqual([]);
  });

  it("deve lidar com array vazio de users", () => {
    const users: any[] = [];
    
    const adminCount = safeLength(safeFilter(users, (u) => u.role === "admin"));
    
    expect(adminCount).toBe(0);
  });

  it("deve filtrar usuários por múltiplos critérios", () => {
    const users = [
      { id: 1, name: "João", role: "admin", active: true },
      { id: 2, name: "Maria", role: "gestor", active: false },
      { id: 3, name: "Pedro", role: "admin", active: true },
      { id: 4, name: "Ana", role: "rh", active: true },
    ];
    
    const activeAdmins = safeFilter(users, (u) => u.role === "admin" && u.active);
    
    expect(activeAdmins).toHaveLength(2);
    expect(activeAdmins.every((u) => u.role === "admin" && u.active)).toBe(true);
  });

  it("deve calcular total de usuários corretamente", () => {
    const users = [
      { id: 1, role: "admin" },
      { id: 2, role: "gestor" },
      { id: 3, role: "rh" },
    ];
    
    const totalUsers = safeLength(users);
    
    expect(totalUsers).toBe(3);
  });
});
