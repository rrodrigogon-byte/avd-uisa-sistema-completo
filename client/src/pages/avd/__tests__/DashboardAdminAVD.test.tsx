/**
 * Testes para DashboardAdminAVD
 * Valida proteção contra dados undefined/null
 */

import { describe, it, expect, vi } from "vitest";
import { safeMap, safeFilter, isEmpty } from "@/lib/arrayHelpers";

describe("DashboardAdminAVD - Proteção de Dados", () => {
  it("deve lidar com processos undefined sem erro", () => {
    const processes = undefined;
    
    // Simular filtro de processos
    const filteredProcesses = isEmpty(processes) ? [] : safeFilter(processes, () => true);
    
    expect(filteredProcesses).toEqual([]);
  });

  it("deve lidar com processos null sem erro", () => {
    const processes = null;
    
    const filteredProcesses = isEmpty(processes) ? [] : safeFilter(processes, () => true);
    
    expect(filteredProcesses).toEqual([]);
  });

  it("deve filtrar processos válidos corretamente", () => {
    const processes = [
      { id: 1, employee: { nome: "João", chapa: "001" }, status: "em_andamento" },
      { id: 2, employee: { nome: "Maria", chapa: "002" }, status: "concluido" },
    ];
    
    const filteredProcesses = safeFilter(processes, (item) => item.status === "em_andamento");
    
    expect(filteredProcesses).toHaveLength(1);
    expect(filteredProcesses[0].id).toBe(1);
  });

  it("deve mapear dados de exportação sem erro com dados undefined", () => {
    const exportData = undefined;
    
    const rows = safeMap(exportData, (item) => [
      item.processId,
      item.employeeName || "N/A",
    ]);
    
    expect(rows).toEqual([]);
  });

  it("deve mapear dados de exportação corretamente com dados válidos", () => {
    const exportData = [
      { processId: 1, employeeName: "João" },
      { processId: 2, employeeName: "Maria" },
    ];
    
    const rows = safeMap(exportData, (item) => [
      item.processId,
      item.employeeName || "N/A",
    ]);
    
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([1, "João"]);
    expect(rows[1]).toEqual([2, "Maria"]);
  });

  it("deve lidar com array vazio sem erro", () => {
    const processes: any[] = [];
    
    const filteredProcesses = isEmpty(processes) ? [] : safeFilter(processes, () => true);
    
    expect(filteredProcesses).toEqual([]);
  });

  it("deve aplicar múltiplos filtros sem erro", () => {
    const processes = [
      { id: 1, employee: { nome: "João", chapa: "001", departamento: "TI" }, status: "em_andamento" },
      { id: 2, employee: { nome: "Maria", chapa: "002", departamento: "RH" }, status: "concluido" },
      { id: 3, employee: { nome: "Pedro", chapa: "003", departamento: "TI" }, status: "em_andamento" },
    ];
    
    // Filtrar por departamento e status
    const filteredProcesses = safeFilter(processes, (item) => {
      return item.employee?.departamento === "TI" && item.status === "em_andamento";
    });
    
    expect(filteredProcesses).toHaveLength(2);
    expect(filteredProcesses.every((p) => p.employee.departamento === "TI")).toBe(true);
  });
});
