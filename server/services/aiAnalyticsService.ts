import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { employees, evaluationInstances, pdiPlans, nineBoxPositions, goals } from "../../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

/**
 * Serviço de Análise Preditiva com IA
 * Usa LLM para gerar insights, predições e recomendações
 */

export interface TurnoverRiskPrediction {
  employeeId: number;
  employeeName: string;
  riskLevel: "baixo" | "medio" | "alto" | "critico";
  probabilityPercent: number;
  topRiskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: "baixa" | "media" | "alta";
    expectedImpact: string;
  }>;
}

export interface PerformancePrediction {
  employeeId: number;
  employeeName: string;
  predictedRating: "abaixo_expectativas" | "atende_expectativas" | "supera_expectativas" | "excepcional";
  predictedScore: number;
  trend: "declinio_forte" | "declinio" | "estavel" | "crescimento" | "crescimento_forte";
  confidenceScore: number;
  positiveFactors: Array<{ factor: string; impact: number }>;
  negativeFactors: Array<{ factor: string; impact: number }>;
}

export interface AIInsight {
  id: string;
  type: "tendencia" | "correlacao" | "anomalia" | "oportunidade" | "risco" | "recomendacao";
  category: "desempenho" | "engajamento" | "turnover" | "desenvolvimento" | "sucessao";
  title: string;
  description: string;
  impactLevel: "baixo" | "medio" | "alto" | "critico";
  affectedEmployees: number;
  recommendedActions: Array<{
    action: string;
    priority: string;
    expectedOutcome: string;
  }>;
  confidenceScore: number;
  relevanceScore: number;
}

export interface DevelopmentRecommendation {
  employeeId: number;
  employeeName: string;
  recommendations: Array<{
    type: "curso" | "mentoria" | "projeto" | "certificacao";
    title: string;
    description: string;
    priority: "baixa" | "media" | "alta";
    expectedImpact: "baixo" | "medio" | "alto";
    targetCompetencies: string[];
    estimatedDuration: number; // em horas
  }>;
}

/**
 * Analisa risco de turnover para um colaborador
 */
export async function analyzeTurnoverRisk(employeeId: number): Promise<TurnoverRiskPrediction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar dados do colaborador
  const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee.length) throw new Error("Employee not found");

  const emp = employee[0];

  // Buscar histórico de avaliações
  const evaluations = await db
    .select()
    .from(evaluationInstances)
    .where(eq(evaluationInstances.employeeId, employeeId))
    .orderBy(desc(evaluationInstances.createdAt))
    .limit(5);

  // Buscar PDIs
  const pdiList = await db
    .select()
    .from(pdiPlans)
    .where(eq(pdiPlans.employeeId, employeeId))
    .orderBy(desc(pdiPlans.createdAt))
    .limit(3);

  // Buscar posição na Nine Box
  const nineBox = await db
    .select()
    .from(nineBoxPositions)
    .where(eq(nineBoxPositions.employeeId, employeeId))
    .orderBy(desc(nineBoxPositions.updatedAt))
    .limit(1);

  // Buscar metas
  const employeeGoals2 = await db
    .select()
    .from(goals)
    .where(eq(goals.employeeId, employeeId))
    .orderBy(desc(goals.createdAt))
    .limit(5);

  // Preparar contexto para a IA
  const context = {
    employee: {
      name: emp.name,
      position: emp.positionId,
      department: emp.departmentId,
      hireDate: emp.hireDate,
      tenureMonths: emp.hireDate
        ? Math.floor((new Date().getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0,
    },
    evaluations: evaluations.map((e) => ({
      status: e.status,
      createdAt: e.createdAt,
    })),
    pdiPlans: pdiList.map((p) => ({
      status: p.status,
      progress: p.overallProgress,
      createdAt: p.createdAt,
    })),
    nineBox: nineBox.length
      ? {
          performance: nineBox[0].performance,
          potential: nineBox[0].potential,
        }
      : null,
    goals: employeeGoals2.map((g) => ({
      status: g.status,
      progress: g.progress,
      createdAt: g.createdAt,
    })),
  };

  // Usar LLM para análise
  const prompt = `Você é um especialista em análise de turnover e retenção de talentos. 

Analise os dados do colaborador abaixo e forneça uma predição de risco de turnover:

${JSON.stringify(context, null, 2)}

Forneça sua análise no seguinte formato JSON:
{
  "riskLevel": "baixo" | "medio" | "alto" | "critico",
  "probabilityPercent": número de 0 a 100,
  "topRiskFactors": [
    {
      "factor": "nome do fator de risco",
      "impact": número de 0 a 100,
      "description": "descrição detalhada"
    }
  ],
  "recommendations": [
    {
      "action": "ação recomendada",
      "priority": "baixa" | "media" | "alta",
      "expectedImpact": "impacto esperado"
    }
  ]
}

Considere fatores como:
- Tempo de casa (turnover é maior nos primeiros 6 meses e após 2 anos)
- Falta de desenvolvimento (PDIs não concluídos)
- Baixa performance ou estagnação
- Falta de reconhecimento
- Posição na Nine Box (baixo potencial = maior risco)
- Metas não atingidas`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Você é um especialista em People Analytics e predição de turnover. Responda sempre em JSON válido.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "turnover_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            riskLevel: {
              type: "string",
              enum: ["baixo", "medio", "alto", "critico"],
            },
            probabilityPercent: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            topRiskFactors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "number", minimum: 0, maximum: 100 },
                  description: { type: "string" },
                },
                required: ["factor", "impact", "description"],
                additionalProperties: false,
              },
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string", enum: ["baixa", "media", "alta"] },
                  expectedImpact: { type: "string" },
                },
                required: ["action", "priority", "expectedImpact"],
                additionalProperties: false,
              },
            },
          },
          required: ["riskLevel", "probabilityPercent", "topRiskFactors", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const analysis = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

  return {
    employeeId,
    employeeName: emp.name || "Sem nome",
    ...analysis,
  };
}

/**
 * Gera predição de desempenho futuro
 */
export async function predictPerformance(employeeId: number): Promise<PerformancePrediction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee.length) throw new Error("Employee not found");

  const emp = employee[0];

  // Buscar histórico de avaliações
  const evaluations = await db
    .select()
    .from(evaluationInstances)
    .where(eq(evaluationInstances.employeeId, employeeId))
    .orderBy(desc(evaluationInstances.createdAt))
    .limit(10);

  // Buscar metas e progresso
  const employeeGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.employeeId, employeeId))
    .orderBy(desc(goals.createdAt))
    .limit(10);

  // Buscar Nine Box
  const nineBoxHistory = await db
    .select()
    .from(nineBoxPositions)
    .where(eq(nineBoxPositions.employeeId, employeeId))
    .orderBy(desc(nineBoxPositions.updatedAt))
    .limit(5);

  const context = {
    employee: { name: emp.name },
    evaluationsHistory: evaluations.map((e) => ({
      status: e.status,
      createdAt: e.createdAt,
    })),
    goalsHistory: employeeGoals.map((g) => ({
      status: g.status,
      progress: g.progress,
      createdAt: g.createdAt,
    })),
    nineBoxHistory: nineBoxHistory.map((n) => ({
      performance: n.performance,
      potential: n.potential,
      updatedAt: n.updatedAt,
    })),
  };

  const prompt = `Você é um especialista em análise de desempenho e predição de performance.

Analise o histórico do colaborador e preveja seu desempenho futuro:

${JSON.stringify(context, null, 2)}

Forneça sua predição no formato JSON:
{
  "predictedRating": "abaixo_expectativas" | "atende_expectativas" | "supera_expectativas" | "excepcional",
  "predictedScore": número de 0 a 100,
  "trend": "declinio_forte" | "declinio" | "estavel" | "crescimento" | "crescimento_forte",
  "confidenceScore": número de 0 a 100,
  "positiveFactors": [{"factor": "string", "impact": número 0-100}],
  "negativeFactors": [{"factor": "string", "impact": número 0-100}]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em People Analytics. Responda em JSON válido." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "performance_prediction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            predictedRating: {
              type: "string",
              enum: ["abaixo_expectativas", "atende_expectativas", "supera_expectativas", "excepcional"],
            },
            predictedScore: { type: "number", minimum: 0, maximum: 100 },
            trend: {
              type: "string",
              enum: ["declinio_forte", "declinio", "estavel", "crescimento", "crescimento_forte"],
            },
            confidenceScore: { type: "number", minimum: 0, maximum: 100 },
            positiveFactors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "number", minimum: 0, maximum: 100 },
                },
                required: ["factor", "impact"],
                additionalProperties: false,
              },
            },
            negativeFactors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "number", minimum: 0, maximum: 100 },
                },
                required: ["factor", "impact"],
                additionalProperties: false,
              },
            },
          },
          required: ["predictedRating", "predictedScore", "trend", "confidenceScore", "positiveFactors", "negativeFactors"],
          additionalProperties: false,
        },
      },
    },
  });

  const content2 = response.choices[0].message.content;
  const prediction = JSON.parse(typeof content2 === 'string' ? content2 : JSON.stringify(content2));

  return {
    employeeId,
    employeeName: emp.name || "Sem nome",
    ...prediction,
  };
}

/**
 * Gera insights automáticos sobre a organização
 */
export async function generateOrganizationalInsights(): Promise<AIInsight[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar dados agregados
  const totalEmployees = await db.select({ count: sql<number>`count(*)` }).from(employees);

  const recentEvaluations = await db
    .select()
    .from(evaluationInstances)
    .where(gte(evaluationInstances.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
    .limit(100);

  const activePDIs = await db
    .select()
    .from(pdiPlans)
    .where(eq(pdiPlans.status, "em_andamento"))
    .limit(50);

  const activeGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.status, "em_andamento"))
    .limit(50);

  const context = {
    totalEmployees: totalEmployees[0]?.count || 0,
    recentEvaluationsCount: recentEvaluations.length,
    activePDIsCount: activePDIs.length,
    activeGoalsCount: activeGoals.length,
    evaluationStatuses: recentEvaluations.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    pdiProgress: activePDIs.map((p) => p.overallProgress),
    goalProgress: activeGoals.map((g) => g.progress),
  };

  const prompt = `Você é um especialista em People Analytics e Business Intelligence.

Analise os dados organizacionais e gere insights acionáveis:

${JSON.stringify(context, null, 2)}

Gere 3-5 insights importantes no formato JSON:
{
  "insights": [
    {
      "id": "string única",
      "type": "tendencia" | "correlacao" | "anomalia" | "oportunidade" | "risco" | "recomendacao",
      "category": "desempenho" | "engajamento" | "turnover" | "desenvolvimento" | "sucessao",
      "title": "título curto do insight",
      "description": "descrição detalhada",
      "impactLevel": "baixo" | "medio" | "alto" | "critico",
      "affectedEmployees": número estimado,
      "recommendedActions": [
        {
          "action": "ação específica",
          "priority": "string",
          "expectedOutcome": "resultado esperado"
        }
      ],
      "confidenceScore": número 0-100,
      "relevanceScore": número 0-100
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em People Analytics. Responda em JSON válido." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "organizational_insights",
        strict: true,
        schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["tendencia", "correlacao", "anomalia", "oportunidade", "risco", "recomendacao"],
                  },
                  category: {
                    type: "string",
                    enum: ["desempenho", "engajamento", "turnover", "desenvolvimento", "sucessao"],
                  },
                  title: { type: "string" },
                  description: { type: "string" },
                  impactLevel: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
                  affectedEmployees: { type: "number" },
                  recommendedActions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string" },
                        expectedOutcome: { type: "string" },
                      },
                      required: ["action", "priority", "expectedOutcome"],
                      additionalProperties: false,
                    },
                  },
                  confidenceScore: { type: "number", minimum: 0, maximum: 100 },
                  relevanceScore: { type: "number", minimum: 0, maximum: 100 },
                },
                required: [
                  "id",
                  "type",
                  "category",
                  "title",
                  "description",
                  "impactLevel",
                  "affectedEmployees",
                  "recommendedActions",
                  "confidenceScore",
                  "relevanceScore",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["insights"],
          additionalProperties: false,
        },
      },
    },
  });

  const content3 = response.choices[0].message.content;
  const result = JSON.parse(typeof content3 === 'string' ? content3 : JSON.stringify(content3));
  return result.insights;
}

/**
 * Gera recomendações de desenvolvimento personalizadas
 */
export async function generateDevelopmentRecommendations(employeeId: number): Promise<DevelopmentRecommendation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee.length) throw new Error("Employee not found");

  const emp = employee[0];

  // Buscar avaliações recentes
  const evaluations = await db
    .select()
    .from(evaluationInstances)
    .where(eq(evaluationInstances.employeeId, employeeId))
    .orderBy(desc(evaluationInstances.createdAt))
    .limit(3);

  // Buscar Nine Box
  const nineBox = await db
    .select()
    .from(nineBoxPositions)
    .where(eq(nineBoxPositions.employeeId, employeeId))
    .orderBy(desc(nineBoxPositions.updatedAt))
    .limit(1);

  // Buscar PDIs anteriores
  const previousPDIs = await db
    .select()
    .from(pdiPlans)
    .where(eq(pdiPlans.employeeId, employeeId))
    .orderBy(desc(pdiPlans.createdAt))
    .limit(3);

  const context = {
    employee: { name: emp.name, position: emp.positionId },
    nineBox: nineBox.length ? { performance: nineBox[0].performance, potential: nineBox[0].potential } : null,
    recentEvaluations: evaluations.length,
    completedPDIs: previousPDIs.filter((p) => p.status === "concluido").length,
  };

  const prompt = `Você é um especialista em desenvolvimento de talentos e aprendizagem organizacional.

Analise o perfil do colaborador e sugira ações de desenvolvimento personalizadas:

${JSON.stringify(context, null, 2)}

Gere 3-5 recomendações no formato JSON:
{
  "recommendations": [
    {
      "type": "curso" | "mentoria" | "projeto" | "certificacao",
      "title": "título da recomendação",
      "description": "descrição detalhada",
      "priority": "baixa" | "media" | "alta",
      "expectedImpact": "baixo" | "medio" | "alto",
      "targetCompetencies": ["competência 1", "competência 2"],
      "estimatedDuration": número em horas
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em desenvolvimento de talentos. Responda em JSON válido." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "development_recommendations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["curso", "mentoria", "projeto", "certificacao"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["baixa", "media", "alta"] },
                  expectedImpact: { type: "string", enum: ["baixo", "medio", "alto"] },
                  targetCompetencies: { type: "array", items: { type: "string" } },
                  estimatedDuration: { type: "number" },
                },
                required: [
                  "type",
                  "title",
                  "description",
                  "priority",
                  "expectedImpact",
                  "targetCompetencies",
                  "estimatedDuration",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const content3 = response.choices[0].message.content;
  const result = JSON.parse(typeof content3 === 'string' ? content3 : JSON.stringify(content3));

  return {
    employeeId,
    employeeName: emp.name || "Sem nome",
    recommendations: result.recommendations,
  };
}
