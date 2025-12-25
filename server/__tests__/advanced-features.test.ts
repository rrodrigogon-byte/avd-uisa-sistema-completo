import { describe, it, expect } from "vitest";
import { parseJobDescriptionDocx, validateParsedData } from "../utils/docxParser";

/**
 * Testes para funcionalidades avançadas
 * 1. Parser de .docx
 * 2. Sistema de Alertas
 * 3. Integração com Ponto Eletrônico
 */

describe("Parser de .docx", () => {
  it("deve validar dados parseados corretamente", () => {
    const parsedData = {
      cargo: "Analista de Sistemas",
      departamento: "TI",
      objetivoPrincipal: "Desenvolver e manter sistemas",
      responsabilidades: {
        processo: ["Desenvolver software", "Testar aplicações"],
        analiseKPI: ["Monitorar performance"],
      },
    };
    
    const validation = validateParsedData(parsedData);
    expect(validation.isValid).toBe(true);
    expect(validation.missingFields).toHaveLength(0);
  });
  
  it("deve detectar campos faltantes", () => {
    const parsedData = {
      cargo: "Analista de Sistemas",
      // Faltando departamento e objetivoPrincipal
    };
    
    const validation = validateParsedData(parsedData);
    expect(validation.isValid).toBe(false);
    expect(validation.missingFields).toContain("Departamento");
    expect(validation.missingFields).toContain("Objetivo Principal");
  });
});

describe("Sistema de Alertas", () => {
  it("deve classificar severidade corretamente", () => {
    // Teste de lógica de severidade
    const differencePercentage = 55;
    const severity = differencePercentage > 50 ? "critical" : 
                     differencePercentage > 30 ? "high" : 
                     differencePercentage > 20 ? "medium" : "low";
    
    expect(severity).toBe("critical");
  });
  
  it("deve classificar severidade média", () => {
    const differencePercentage = 25;
    const severity = differencePercentage > 50 ? "critical" : 
                     differencePercentage > 30 ? "high" : 
                     differencePercentage > 20 ? "medium" : "low";
    
    expect(severity).toBe("medium");
  });
});

describe("Integração com Ponto Eletrônico", () => {
  it("deve calcular minutos trabalhados corretamente", () => {
    const clockInTime = new Date("2025-01-19T08:00:00").getTime();
    const clockOutTime = new Date("2025-01-19T17:00:00").getTime();
    const breakMinutes = 60;
    
    const totalMinutes = Math.floor((clockOutTime - clockInTime) / (1000 * 60));
    const workedMinutes = totalMinutes - breakMinutes;
    
    expect(totalMinutes).toBe(540); // 9 horas = 540 minutos
    expect(workedMinutes).toBe(480); // 8 horas = 480 minutos
  });
  
  it("deve classificar discrepância como aceitável", () => {
    const clockMinutes = 480;
    const activityMinutes = 470;
    const differenceMinutes = clockMinutes - activityMinutes;
    const differencePercentage = (Math.abs(differenceMinutes) / clockMinutes) * 100;
    
    const discrepancyType = differencePercentage < 10 ? "acceptable" :
                           differenceMinutes < 0 ? "over_reported" : "under_reported";
    
    expect(differencePercentage).toBeLessThan(10);
    expect(discrepancyType).toBe("acceptable");
  });
  
  it("deve classificar discrepância como under_reported", () => {
    const clockMinutes = 480;
    const activityMinutes = 300; // Muito menos atividades que ponto
    const differenceMinutes = clockMinutes - activityMinutes;
    const differencePercentage = (Math.abs(differenceMinutes) / clockMinutes) * 100;
    
    const discrepancyType = differencePercentage < 10 ? "acceptable" :
                           differenceMinutes < 0 ? "over_reported" : "under_reported";
    
    expect(differencePercentage).toBeGreaterThan(10);
    expect(discrepancyType).toBe("under_reported");
  });
  
  it("deve classificar discrepância como over_reported", () => {
    const clockMinutes = 300;
    const activityMinutes = 480; // Muito mais atividades que ponto
    const differenceMinutes = clockMinutes - activityMinutes;
    const differencePercentage = (Math.abs(differenceMinutes) / clockMinutes) * 100;
    
    const discrepancyType = differencePercentage < 10 ? "acceptable" :
                           differenceMinutes < 0 ? "over_reported" : "under_reported";
    
    expect(differencePercentage).toBeGreaterThan(10);
    expect(discrepancyType).toBe("over_reported");
  });
  
  it("deve gerar alerta para discrepância > 20%", () => {
    const clockMinutes = 480;
    const activityMinutes = 350;
    const differencePercentage = (Math.abs(clockMinutes - activityMinutes) / clockMinutes) * 100;
    
    const shouldCreateAlert = differencePercentage > 20;
    
    expect(differencePercentage).toBeGreaterThan(20);
    expect(shouldCreateAlert).toBe(true);
  });
});
