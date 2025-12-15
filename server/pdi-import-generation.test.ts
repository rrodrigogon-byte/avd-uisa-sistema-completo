import { describe, it, expect, beforeAll } from "vitest";
import { parsePDIHtml } from "./pdiHtmlParser";
import { generatePDIHtml, type PDIData } from "./pdiHtmlGenerator";

describe("PDI Import and Generation", () => {
  const samplePDIHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Plano de Performance e Desenvolvimento - Wilson Silva | UISA</title>
</head>
<body>
    <h1>Plano de Performance e Desenvolvimento</h1>
    <h2>Wilson Silva</h2>
    <p>Analista de TI</p>
    <p><strong>Foco do Desenvolvimento:</strong> Liderança Técnica</p>
    <p><strong>Diretor Sponsor:</strong> João Santos</p>
    
    <div class="kpi-card">
        <p>Posição Atual</p>
        <p>Analista Pleno</p>
    </div>
    <div class="kpi-card">
        <p>Reenquadramento</p>
        <p>6 meses</p>
    </div>
    <div class="kpi-card">
        <p>Nova Posição</p>
        <p>Analista Sênior</p>
    </div>
    <div class="kpi-card">
        <p>Plano de Performance</p>
        <p>12 meses</p>
    </div>
    
    <h3>Análise de Gaps de Competências</h3>
    <ul>
        <li><strong>Liderança:</strong> Desenvolver habilidades de gestão de equipe</li>
        <li><strong>Comunicação:</strong> Melhorar apresentações técnicas</li>
    </ul>
    
    <h3>Plano de Ação Detalhado (70-20-10)</h3>
    <p><strong>70% - Aprendizado na Prática (On-the-Job)</strong></p>
    <ul>
        <li>Liderar projeto de migração de sistema</li>
        <li>Mentorar desenvolvedores juniores</li>
    </ul>
    <p><strong>20% - Aprendizado com Outros (Social)</strong></p>
    <ul>
        <li>Participar de grupos de estudo sobre arquitetura</li>
    </ul>
    <p><strong>10% - Aprendizado Formal</strong></p>
    <ul>
        <li>Curso de liderança técnica</li>
    </ul>
    
    <h3>Pacto de Performance e Responsabilidades</h3>
    <p><strong>Responsabilidades do Colaborador (O Protagonista)</strong></p>
    <ul>
        <li>Comprometer-se com o plano de desenvolvimento</li>
        <li>Buscar feedback contínuo</li>
    </ul>
    <p><strong>Responsabilidades da Liderança (Sponsor e Mentor)</strong></p>
    <ul>
        <li>Fornecer oportunidades de crescimento</li>
        <li>Dar feedback regular</li>
    </ul>
    <p><strong>Responsabilidades do DHO</strong></p>
    <ul>
        <li>Acompanhar progresso do PDI</li>
        <li>Facilitar treinamentos</li>
    </ul>
</body>
</html>`;

  it("deve fazer parse de HTML de PDI corretamente", () => {
    const parsed = parsePDIHtml(samplePDIHtml);
    
    expect(parsed.employeeName).toBe("Wilson Silva");
    expect(parsed.position).toBe("Analista de TI");
    expect(parsed.developmentFocus).toBe("Liderança Técnica");
    expect(parsed.sponsorName).toBe("João Santos");
    
    expect(parsed.kpis.currentPosition).toBe("Analista Pleno");
    expect(parsed.kpis.reframing).toBe("6 meses");
    expect(parsed.kpis.newPosition).toBe("Analista Sênior");
    expect(parsed.kpis.planDuration).toBe("12 meses");
    
    expect(parsed.competencyGaps.length).toBeGreaterThan(0);
    expect(parsed.actionPlan.onTheJob.length).toBeGreaterThan(0);
    expect(parsed.actionPlan.social.length).toBeGreaterThan(0);
    expect(parsed.actionPlan.formal.length).toBeGreaterThan(0);
    
    expect(parsed.responsibilityPact.employee.length).toBeGreaterThan(0);
    expect(parsed.responsibilityPact.leadership.length).toBeGreaterThan(0);
    expect(parsed.responsibilityPact.dho.length).toBeGreaterThan(0);
  });

  it("deve gerar HTML de PDI a partir de dados estruturados", () => {
    const pdiData: PDIData = {
      employeeName: "Fernando Costa",
      position: "Gerente de Projetos",
      developmentFocus: "Gestão Estratégica",
      sponsorName: "Maria Oliveira",
      kpis: {
        currentPosition: "Gerente Jr",
        reframing: "8 meses",
        newPosition: "Gerente Sr",
        planDuration: "18 meses",
      },
      competencyGaps: [
        {
          title: "Planejamento Estratégico",
          description: "Nível atual: 3, Nível alvo: 5, Gap: 2",
        },
        {
          title: "Gestão de Stakeholders",
          description: "Nível atual: 2, Nível alvo: 4, Gap: 2",
        },
      ],
      competencyChart: {
        labels: ["Planejamento Estratégico", "Gestão de Stakeholders"],
        currentProfile: [3, 2],
        targetProfile: [5, 4],
      },
      compensationTrack: [
        {
          level: "Nível 1",
          timeline: "6 meses",
          trigger: "Concluir certificação PMP",
          projectedSalary: "R$ 12.000",
          positionInRange: "Médio",
        },
      ],
      actionPlan: {
        onTheJob: [
          "Liderar projeto estratégico de transformação digital",
          "Gerenciar portfólio de projetos críticos",
        ],
        social: [
          "Participar de comunidade de gerentes de projeto",
        ],
        formal: [
          "Certificação PMP",
          "MBA em Gestão Estratégica",
        ],
      },
      responsibilityPact: {
        employee: [
          "Dedicar 10h semanais ao desenvolvimento",
          "Buscar feedback trimestral",
        ],
        leadership: [
          "Alocar em projetos desafiadores",
          "Realizar reuniões mensais de acompanhamento",
        ],
        dho: [
          "Facilitar acesso a treinamentos",
          "Monitorar progresso do PDI",
        ],
      },
    };

    const html = generatePDIHtml(pdiData);
    
    expect(html).toContain("Fernando Costa");
    expect(html).toContain("Gerente de Projetos");
    expect(html).toContain("Gestão Estratégica");
    expect(html).toContain("Maria Oliveira");
    expect(html).toContain("Planejamento Estratégico");
    expect(html).toContain("Gestão de Stakeholders");
    expect(html).toContain("Certificação PMP");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("deve fazer round-trip: parse -> generate -> parse novamente", () => {
    const originalParsed = parsePDIHtml(samplePDIHtml);
    const generated = generatePDIHtml(originalParsed);
    const reparsed = parsePDIHtml(generated);
    
    expect(reparsed.employeeName).toBe(originalParsed.employeeName);
    expect(reparsed.position).toBe(originalParsed.position);
    expect(reparsed.developmentFocus).toBe(originalParsed.developmentFocus);
    expect(reparsed.sponsorName).toBe(originalParsed.sponsorName);
  });

  it("deve lidar com dados parciais sem erros", () => {
    const minimalData: PDIData = {
      employeeName: "João Teste",
      position: "Analista",
      developmentFocus: "Desenvolvimento técnico",
      sponsorName: "Gestor Teste",
      kpis: {
        currentPosition: "Junior",
        reframing: "N/A",
        newPosition: "Pleno",
        planDuration: "12 meses",
      },
      competencyGaps: [],
      competencyChart: {
        labels: [],
        currentProfile: [],
        targetProfile: [],
      },
      compensationTrack: [],
      actionPlan: {
        onTheJob: [],
        social: [],
        formal: [],
      },
      responsibilityPact: {
        employee: [],
        leadership: [],
        dho: [],
      },
    };

    const html = generatePDIHtml(minimalData);
    
    expect(html).toContain("João Teste");
    expect(html).toContain("Analista");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});
