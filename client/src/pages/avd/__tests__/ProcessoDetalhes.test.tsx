/**
 * Testes para ProcessoDetalhes
 * Valida proteção contra dados undefined/null
 */

import { describe, it, expect } from "vitest";
import { safeMap, safeFilter } from "@/lib/arrayHelpers";

describe("ProcessoDetalhes - Proteção de Dados", () => {
  it("deve filtrar steps completados sem erro com dados válidos", () => {
    const steps = [
      { id: 1, title: "Dados Pessoais", completed: true },
      { id: 2, title: "PIR", completed: false },
      { id: 3, title: "Competências", completed: true },
      { id: 4, title: "Desempenho", completed: false },
      { id: 5, title: "PDI", completed: false },
    ];
    
    const completedSteps = safeFilter(steps, (s) => s.completed).length;
    
    expect(completedSteps).toBe(2);
  });

  it("deve lidar com steps undefined sem erro", () => {
    const steps = undefined;
    
    const completedSteps = safeFilter(steps, (s: any) => s.completed).length;
    
    expect(completedSteps).toBe(0);
  });

  it("deve lidar com steps null sem erro", () => {
    const steps = null;
    
    const completedSteps = safeFilter(steps, (s: any) => s.completed).length;
    
    expect(completedSteps).toBe(0);
  });

  it("deve mapear steps para renderização sem erro", () => {
    const steps = [
      { id: 1, title: "Dados Pessoais", completed: true, icon: "User" },
      { id: 2, title: "PIR", completed: false, icon: "Brain" },
    ];
    
    const mappedSteps = safeMap(steps, (step) => ({
      id: step.id,
      title: step.title,
      completed: step.completed,
    }));
    
    expect(mappedSteps).toHaveLength(2);
    expect(mappedSteps[0].completed).toBe(true);
    expect(mappedSteps[1].completed).toBe(false);
  });

  it("deve mapear steps undefined sem erro", () => {
    const steps = undefined;
    
    const mappedSteps = safeMap(steps, (step: any) => ({
      id: step.id,
      title: step.title,
    }));
    
    expect(mappedSteps).toEqual([]);
  });

  it("deve calcular progresso corretamente", () => {
    const steps = [
      { id: 1, completed: true },
      { id: 2, completed: true },
      { id: 3, completed: true },
      { id: 4, completed: false },
      { id: 5, completed: false },
    ];
    
    const completedSteps = safeFilter(steps, (s) => s.completed).length;
    const progressPercentage = (completedSteps / 5) * 100;
    
    expect(progressPercentage).toBe(60);
  });

  it("deve lidar com array vazio de steps", () => {
    const steps: any[] = [];
    
    const completedSteps = safeFilter(steps, (s) => s.completed).length;
    const progressPercentage = (completedSteps / 5) * 100;
    
    expect(progressPercentage).toBe(0);
  });

  it("deve filtrar apenas steps não completados", () => {
    const steps = [
      { id: 1, completed: true },
      { id: 2, completed: false },
      { id: 3, completed: true },
      { id: 4, completed: false },
      { id: 5, completed: false },
    ];
    
    const pendingSteps = safeFilter(steps, (s) => !s.completed);
    
    expect(pendingSteps).toHaveLength(3);
    expect(pendingSteps.every((s) => !s.completed)).toBe(true);
  });
});
