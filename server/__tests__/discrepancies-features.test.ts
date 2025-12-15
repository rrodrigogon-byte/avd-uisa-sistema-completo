import { describe, it, expect } from "vitest";

/**
 * Testes para funcionalidades de Discrepâncias e Job Agendado
 */

describe("Página de Visualização de Discrepâncias", () => {
  it("deve processar dados para gráfico de tendências corretamente", () => {
    const discrepancies = [
      { date: new Date("2025-01-15"), differencePercentage: "25.5" },
      { date: new Date("2025-01-15"), differencePercentage: "30.0" },
      { date: new Date("2025-01-16"), differencePercentage: "15.0" },
    ];
    
    // Simular agregação por data
    const trendData = discrepancies.reduce((acc, d) => {
      const dateKey = d.date.toISOString().split("T")[0];
      const existing = acc.find(item => item.date === dateKey);
      if (existing) {
        existing.count += 1;
        existing.avgPercentage = (existing.avgPercentage + parseFloat(d.differencePercentage)) / 2;
      } else {
        acc.push({
          date: dateKey,
          count: 1,
          avgPercentage: parseFloat(d.differencePercentage),
        });
      }
      return acc;
    }, [] as Array<{ date: string; count: number; avgPercentage: number }>);
    
    expect(trendData).toHaveLength(2);
    expect(trendData[0].count).toBe(2);
    expect(trendData[0].avgPercentage).toBeGreaterThan(25);
    expect(trendData[1].count).toBe(1);
  });
  
  it("deve calcular ranking de colaboradores corretamente", () => {
    const discrepancies = [
      { employeeId: 1, employeeName: "João", differencePercentage: "40.0" },
      { employeeId: 1, employeeName: "João", differencePercentage: "30.0" },
      { employeeId: 2, employeeName: "Maria", differencePercentage: "20.0" },
    ];
    
    const ranking = discrepancies.reduce((acc, d) => {
      const key = `${d.employeeId}-${d.employeeName}`;
      const existing = acc.find(item => item.key === key);
      if (existing) {
        existing.count += 1;
        existing.totalPercentage += parseFloat(d.differencePercentage);
        existing.avgPercentage = existing.totalPercentage / existing.count;
      } else {
        acc.push({
          key,
          employeeId: d.employeeId,
          employeeName: d.employeeName,
          count: 1,
          totalPercentage: parseFloat(d.differencePercentage),
          avgPercentage: parseFloat(d.differencePercentage),
        });
      }
      return acc;
    }, [] as Array<{ key: string; employeeId: number; employeeName: string; count: number; totalPercentage: number; avgPercentage: number }>)
    .sort((a, b) => b.avgPercentage - a.avgPercentage);
    
    expect(ranking).toHaveLength(2);
    expect(ranking[0].employeeName).toBe("João");
    expect(ranking[0].avgPercentage).toBe(35); // (40 + 30) / 2
    expect(ranking[0].count).toBe(2);
    expect(ranking[1].employeeName).toBe("Maria");
  });
  
  it("deve aplicar filtros corretamente", () => {
    const allDiscrepancies = [
      { status: "pending", differencePercentage: "25.0" },
      { status: "justified", differencePercentage: "30.0" },
      { status: "pending", differencePercentage: "15.0" },
      { status: "pending", differencePercentage: "40.0" },
    ];
    
    // Filtrar por status
    const pendingOnly = allDiscrepancies.filter(d => d.status === "pending");
    expect(pendingOnly).toHaveLength(3);
    
    // Filtrar por percentual mínimo
    const highPercentage = allDiscrepancies.filter(d => parseFloat(d.differencePercentage) >= 25);
    expect(highPercentage).toHaveLength(3);
  });
});

describe("Job Agendado de Cálculo de Discrepâncias", () => {
  it("deve classificar discrepância corretamente baseado em percentual", () => {
    const testCases = [
      { clockMinutes: 480, activityMinutes: 470, expected: "acceptable" },
      { clockMinutes: 480, activityMinutes: 300, expected: "under_reported" },
      { clockMinutes: 300, activityMinutes: 480, expected: "over_reported" },
    ];
    
    testCases.forEach(({ clockMinutes, activityMinutes, expected }) => {
      const differenceMinutes = clockMinutes - activityMinutes;
      const differencePercentage = (Math.abs(differenceMinutes) / clockMinutes) * 100;
      
      let discrepancyType: "over_reported" | "under_reported" | "acceptable";
      if (differencePercentage < 10) {
        discrepancyType = "acceptable";
      } else if (differenceMinutes < 0) {
        discrepancyType = "over_reported";
      } else {
        discrepancyType = "under_reported";
      }
      
      expect(discrepancyType).toBe(expected);
    });
  });
  
  it("deve determinar severidade de alerta corretamente", () => {
    const testCases = [
      { percentage: 55, expected: "critical" },
      { percentage: 40, expected: "high" },
      { percentage: 25, expected: "medium" },
      { percentage: 15, expected: null }, // Não cria alerta
    ];
    
    testCases.forEach(({ percentage, expected }) => {
      const shouldCreateAlert = percentage > 20;
      
      if (!shouldCreateAlert) {
        expect(expected).toBeNull();
        return;
      }
      
      const severity = percentage > 50 ? "critical" : 
                      percentage > 30 ? "high" : "medium";
      
      expect(severity).toBe(expected);
    });
  });
  
  it("deve pular registros sem dados suficientes", () => {
    const clockRecords = [
      { clockMinutes: 480, activityMinutes: 300 }, // Válido
      { clockMinutes: 0, activityMinutes: 0 },     // Inválido - pular
      { clockMinutes: 420, activityMinutes: 400 }, // Válido
    ];
    
    const validRecords = clockRecords.filter(r => r.clockMinutes > 0);
    
    expect(validRecords).toHaveLength(2);
  });
  
  it("deve calcular diferença de minutos corretamente", () => {
    const clockMinutes = 480; // 8 horas
    const activityMinutes = 350; // 5h50min
    
    const differenceMinutes = clockMinutes - activityMinutes;
    const differencePercentage = (Math.abs(differenceMinutes) / clockMinutes) * 100;
    
    expect(differenceMinutes).toBe(130);
    expect(differencePercentage).toBeCloseTo(27.08, 1);
  });
});

describe("Integração entre Discrepâncias e Alertas", () => {
  it("deve criar alerta apenas para discrepâncias acima do limite", () => {
    const discrepancies = [
      { differencePercentage: 15, shouldAlert: false },
      { differencePercentage: 25, shouldAlert: true },
      { differencePercentage: 55, shouldAlert: true },
    ];
    
    discrepancies.forEach(({ differencePercentage, shouldAlert }) => {
      const createAlert = differencePercentage > 20;
      expect(createAlert).toBe(shouldAlert);
    });
  });
  
  it("deve formatar mensagem de alerta corretamente", () => {
    const employeeName = "João Silva";
    const clockMinutes = 480;
    const activityMinutes = 300;
    const differencePercentage = 37.5;
    const date = new Date("2025-01-19");
    
    const title = `Discrepância de ${differencePercentage.toFixed(0)}% entre ponto e atividades`;
    const description = `Colaborador ${employeeName} apresentou ${clockMinutes} minutos no ponto mas registrou apenas ${activityMinutes} minutos em atividades no dia ${date.toLocaleDateString()}.`;
    
    expect(title).toContain("38%");
    expect(description).toContain("João Silva");
    expect(description).toContain("480 minutos");
    expect(description).toContain("300 minutos");
  });
});
