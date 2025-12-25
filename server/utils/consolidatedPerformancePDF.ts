import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { invokeLLM } from "../_core/llm";

/**
 * Relatório Consolidado de Performance com Insights de IA
 * Combina dados de Metas SMART, Avaliação 360°, PDI e Nine Box
 */

interface ConsolidatedPerformanceData {
  employee: {
    name: string;
    position: string;
    department: string;
    email: string;
  };
  goals: {
    total: number;
    completed: number;
    completionRate: number;
    avgScore: number;
  };
  evaluation360: {
    overallScore: number;
    competencies: Array<{
      name: string;
      score: number;
    }>;
  };
  pdi: {
    totalActions: number;
    completedActions: number;
    completionRate: number;
    keyCompetencies: string[];
  };
  nineBox: {
    performance: string;
    potential: string;
    quadrant: string;
  };
  period: string;
}

/**
 * Gerar insights de IA baseados nos dados consolidados
 */
async function generateAIInsights(data: ConsolidatedPerformanceData): Promise<{
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}> {
  const prompt = `
Analise os seguintes dados de performance do colaborador e forneça insights estruturados:

**Colaborador:** ${data.employee.name}
**Cargo:** ${data.employee.position}
**Departamento:** ${data.employee.department}
**Período:** ${data.period}

**Metas SMART:**
- Total: ${data.goals.total}
- Concluídas: ${data.goals.completed}
- Taxa de Conclusão: ${data.goals.completionRate.toFixed(1)}%
- Pontuação Média: ${data.goals.avgScore.toFixed(1)}

**Avaliação 360°:**
- Pontuação Geral: ${data.evaluation360.overallScore.toFixed(1)}
- Competências: ${data.evaluation360.competencies.map(c => `${c.name} (${c.score.toFixed(1)})`).join(", ")}

**PDI:**
- Total de Ações: ${data.pdi.totalActions}
- Ações Concluídas: ${data.pdi.completedActions}
- Taxa de Conclusão: ${data.pdi.completionRate.toFixed(1)}%
- Competências-Chave: ${data.pdi.keyCompetencies.join(", ")}

**Nine Box:**
- Performance: ${data.nineBox.performance}
- Potencial: ${data.nineBox.potential}
- Quadrante: ${data.nineBox.quadrant}

Forneça uma análise em formato JSON com a seguinte estrutura:
{
  "summary": "Resumo executivo da performance (2-3 frases)",
  "strengths": ["Força 1", "Força 2", "Força 3"],
  "improvementAreas": ["Área 1", "Área 2", "Área 3"],
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em análise de performance de RH. Forneça insights profissionais e acionáveis em português do Brasil.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "performance_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              improvementAreas: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "strengths", "improvementAreas", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const insights = JSON.parse(typeof content === "string" ? content : "{}");
    return insights;
  } catch (error) {
    console.error("[ConsolidatedPDF] Erro ao gerar insights de IA:", error);
    return {
      summary: "Análise automática não disponível no momento.",
      strengths: ["Dados insuficientes"],
      improvementAreas: ["Dados insuficientes"],
      recommendations: ["Consulte o RH para análise detalhada"],
    };
  }
}

/**
 * Gerar PDF consolidado de performance
 */
export async function generateConsolidatedPerformancePDF(
  data: ConsolidatedPerformanceData
): Promise<Buffer> {
  const doc = new jsPDF() as any;

  // Gerar insights de IA
  const insights = await generateAIInsights(data);

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(243, 146, 0);
  doc.text("Relatório Consolidado de Performance", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 27);

  // Informações do Colaborador
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Informações do Colaborador", 14, 40);

  doc.setFontSize(10);
  doc.text(`Nome: ${data.employee.name}`, 14, 48);
  doc.text(`Cargo: ${data.employee.position}`, 14, 54);
  doc.text(`Departamento: ${data.employee.department}`, 14, 60);
  doc.text(`Período: ${data.period}`, 14, 66);

  // Resumo Executivo com IA
  doc.setFontSize(14);
  doc.setTextColor(243, 146, 0);
  doc.text("Resumo Executivo (IA)", 14, 80);

  doc.setFontSize(10);
  doc.setTextColor(0);
  const summaryLines = doc.splitTextToSize(insights.summary, 180);
  doc.text(summaryLines, 14, 88);

  let yPosition = 88 + summaryLines.length * 5 + 10;

  // Metas SMART
  doc.setFontSize(14);
  doc.setTextColor(243, 146, 0);
  doc.text("Metas SMART", 14, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Metas", data.goals.total.toString()],
      ["Metas Concluídas", data.goals.completed.toString()],
      ["Taxa de Conclusão", `${data.goals.completionRate.toFixed(1)}%`],
      ["Pontuação Média", data.goals.avgScore.toFixed(1)],
    ],
    theme: "grid",
    headStyles: { fillColor: [243, 146, 0] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Avaliação 360°
  doc.setFontSize(14);
  doc.setTextColor(243, 146, 0);
  doc.text("Avaliação 360°", 14, yPosition);
  yPosition += 8;

  const competenciesData = data.evaluation360.competencies.map((c) => [
    c.name,
    c.score.toFixed(1),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Competência", "Pontuação"]],
    body: [
      ["Pontuação Geral", data.evaluation360.overallScore.toFixed(1)],
      ...competenciesData,
    ],
    theme: "grid",
    headStyles: { fillColor: [243, 146, 0] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Nova página se necessário
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // PDI
  doc.setFontSize(14);
  doc.setTextColor(243, 146, 0);
  doc.text("Plano de Desenvolvimento Individual (PDI)", 14, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Ações", data.pdi.totalActions.toString()],
      ["Ações Concluídas", data.pdi.completedActions.toString()],
      ["Taxa de Conclusão", `${data.pdi.completionRate.toFixed(1)}%`],
      ["Competências-Chave", data.pdi.keyCompetencies.join(", ")],
    ],
    theme: "grid",
    headStyles: { fillColor: [243, 146, 0] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Nine Box
  doc.setFontSize(14);
  doc.setTextColor(243, 146, 0);
  doc.text("Matriz Nine Box", 14, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [["Dimensão", "Classificação"]],
    body: [
      ["Performance", data.nineBox.performance],
      ["Potencial", data.nineBox.potential],
      ["Quadrante", data.nineBox.quadrant],
    ],
    theme: "grid",
    headStyles: { fillColor: [243, 146, 0] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Nova página para insights
  doc.addPage();
  yPosition = 20;

  // Pontos Fortes (IA)
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text("✓ Pontos Fortes", 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(0);
  insights.strengths.forEach((strength, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${strength}`, 180);
    doc.text(lines, 14, yPosition);
    yPosition += lines.length * 5 + 3;
  });

  yPosition += 5;

  // Áreas de Melhoria (IA)
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68);
  doc.text("⚠ Áreas de Melhoria", 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(0);
  insights.improvementAreas.forEach((area, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${area}`, 180);
    doc.text(lines, 14, yPosition);
    yPosition += lines.length * 5 + 3;
  });

  yPosition += 5;

  // Recomendações (IA)
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text("💡 Recomendações", 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(0);
  insights.recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 180);
    doc.text(lines, 14, yPosition);
    yPosition += lines.length * 5 + 3;
  });

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Sistema AVD UISA - Relatório Consolidado de Performance - Página ${i} de ${pageCount}`,
      14,
      285
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
