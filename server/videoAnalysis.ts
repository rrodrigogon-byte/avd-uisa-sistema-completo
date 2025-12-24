/**
 * Sistema de Análise de Vídeo com IA para PIR
 * Detecta padrões, movimentos e comportamentos em vídeos de avaliação
 */

import { invokeLLM } from "./_core/llm";

export interface VideoAnalysisResult {
  // Análise geral
  overallScore: number; // 0-100
  summary: string;
  
  // Padrões detectados
  patterns: {
    movementQuality: {
      score: number; // 0-100
      description: string;
      observations: string[];
    };
    facialExpressions: {
      score: number; // 0-100
      description: string;
      observations: string[];
    };
    bodyLanguage: {
      score: number; // 0-100
      description: string;
      observations: string[];
    };
    verbalCommunication: {
      score: number; // 0-100
      description: string;
      observations: string[];
    };
  };
  
  // Capacidades funcionais detectadas
  functionalCapabilities: {
    mobility: {
      level: "independente" | "assistencia_minima" | "assistencia_moderada" | "dependente";
      score: number;
      details: string;
    };
    coordination: {
      level: "excelente" | "boa" | "regular" | "ruim";
      score: number;
      details: string;
    };
    cognition: {
      level: "preservada" | "leve_comprometimento" | "moderado_comprometimento" | "grave_comprometimento";
      score: number;
      details: string;
    };
    communication: {
      level: "clara" | "compreensivel" | "dificuldade" | "muito_prejudicada";
      score: number;
      details: string;
    };
  };
  
  // Dificuldades identificadas
  difficulties: {
    activity: string;
    severity: "leve" | "moderada" | "grave";
    description: string;
    timestamp?: number; // segundos no vídeo
  }[];
  
  // Pontos fortes
  strengths: string[];
  
  // Recomendações
  recommendations: {
    category: string;
    priority: "alta" | "media" | "baixa";
    description: string;
  }[];
  
  // Insights automáticos
  insights: string[];
  
  // Alertas (se houver)
  alerts: {
    type: "validacao" | "qualidade" | "comportamento";
    severity: "info" | "warning" | "error";
    message: string;
  }[];
}

/**
 * Analisa um vídeo do PIR usando IA para detectar padrões e gerar insights
 */
export async function analyzeVideo(
  videoUrl: string,
  videoDuration: number,
  context?: {
    employeeName?: string;
    assessmentType?: string;
    previousScores?: any;
  }
): Promise<VideoAnalysisResult> {
  try {
    // Preparar prompt para análise com IA
    const systemPrompt = `Você é um especialista em análise de vídeos de avaliação funcional e comportamental.
Sua tarefa é analisar vídeos de avaliações PIR (Plano Individual de Reabilitação) e fornecer insights detalhados sobre:

1. Qualidade dos movimentos e coordenação motora
2. Expressões faciais e linguagem corporal
3. Comunicação verbal e não-verbal
4. Capacidades funcionais (mobilidade, coordenação, cognição, comunicação)
5. Dificuldades específicas em atividades
6. Pontos fortes do avaliado
7. Recomendações para reabilitação e desenvolvimento

Baseie sua análise em padrões observáveis no vídeo e forneça uma avaliação objetiva e profissional.
Seja específico, detalhado e construtivo nas observações.`;

    const userPrompt = `Analise o seguinte vídeo de avaliação PIR:

URL do vídeo: ${videoUrl}
Duração: ${videoDuration} segundos
${context?.employeeName ? `Avaliado: ${context.employeeName}` : ''}
${context?.assessmentType ? `Tipo de avaliação: ${context.assessmentType}` : ''}

Por favor, forneça uma análise completa seguindo a estrutura JSON especificada.
Inclua:
- Pontuação geral (0-100)
- Análise de padrões de movimento, expressões faciais, linguagem corporal e comunicação verbal
- Avaliação de capacidades funcionais (mobilidade, coordenação, cognição, comunicação)
- Identificação de dificuldades específicas com timestamps aproximados
- Pontos fortes observados
- Recomendações priorizadas para reabilitação
- Insights automáticos relevantes
- Alertas sobre qualidade do vídeo ou comportamentos atípicos`;

    // Schema JSON para resposta estruturada
    const responseSchema = {
      type: "object",
      properties: {
        overallScore: { type: "integer", description: "Pontuação geral de 0 a 100" },
        summary: { type: "string", description: "Resumo executivo da análise" },
        patterns: {
          type: "object",
          properties: {
            movementQuality: {
              type: "object",
              properties: {
                score: { type: "integer" },
                description: { type: "string" },
                observations: { type: "array", items: { type: "string" } }
              },
              required: ["score", "description", "observations"]
            },
            facialExpressions: {
              type: "object",
              properties: {
                score: { type: "integer" },
                description: { type: "string" },
                observations: { type: "array", items: { type: "string" } }
              },
              required: ["score", "description", "observations"]
            },
            bodyLanguage: {
              type: "object",
              properties: {
                score: { type: "integer" },
                description: { type: "string" },
                observations: { type: "array", items: { type: "string" } }
              },
              required: ["score", "description", "observations"]
            },
            verbalCommunication: {
              type: "object",
              properties: {
                score: { type: "integer" },
                description: { type: "string" },
                observations: { type: "array", items: { type: "string" } }
              },
              required: ["score", "description", "observations"]
            }
          },
          required: ["movementQuality", "facialExpressions", "bodyLanguage", "verbalCommunication"]
        },
        functionalCapabilities: {
          type: "object",
          properties: {
            mobility: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["independente", "assistencia_minima", "assistencia_moderada", "dependente"] },
                score: { type: "integer" },
                details: { type: "string" }
              },
              required: ["level", "score", "details"]
            },
            coordination: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["excelente", "boa", "regular", "ruim"] },
                score: { type: "integer" },
                details: { type: "string" }
              },
              required: ["level", "score", "details"]
            },
            cognition: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["preservada", "leve_comprometimento", "moderado_comprometimento", "grave_comprometimento"] },
                score: { type: "integer" },
                details: { type: "string" }
              },
              required: ["level", "score", "details"]
            },
            communication: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["clara", "compreensivel", "dificuldade", "muito_prejudicada"] },
                score: { type: "integer" },
                details: { type: "string" }
              },
              required: ["level", "score", "details"]
            }
          },
          required: ["mobility", "coordination", "cognition", "communication"]
        },
        difficulties: {
          type: "array",
          items: {
            type: "object",
            properties: {
              activity: { type: "string" },
              severity: { type: "string", enum: ["leve", "moderada", "grave"] },
              description: { type: "string" },
              timestamp: { type: "number" }
            },
            required: ["activity", "severity", "description"]
          }
        },
        strengths: {
          type: "array",
          items: { type: "string" }
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              priority: { type: "string", enum: ["alta", "media", "baixa"] },
              description: { type: "string" }
            },
            required: ["category", "priority", "description"]
          }
        },
        insights: {
          type: "array",
          items: { type: "string" }
        },
        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["validacao", "qualidade", "comportamento"] },
              severity: { type: "string", enum: ["info", "warning", "error"] },
              message: { type: "string" }
            },
            required: ["type", "severity", "message"]
          }
        }
      },
      required: ["overallScore", "summary", "patterns", "functionalCapabilities", "difficulties", "strengths", "recommendations", "insights", "alerts"],
      additionalProperties: false
    };

    // Chamar LLM com análise de vídeo
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "file_url",
              file_url: {
                url: videoUrl,
                mime_type: "video/mp4"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_analysis",
          strict: true,
          schema: responseSchema
        }
      }
    });

    // Extrair e parsear resposta
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const analysis: VideoAnalysisResult = JSON.parse(contentStr);
    
    return analysis;
  } catch (error) {
    console.error("Erro ao analisar vídeo:", error);
    
    // Retornar análise padrão em caso de erro
    return {
      overallScore: 0,
      summary: "Não foi possível analisar o vídeo automaticamente. Por favor, realize uma avaliação manual.",
      patterns: {
        movementQuality: { score: 0, description: "Análise não disponível", observations: [] },
        facialExpressions: { score: 0, description: "Análise não disponível", observations: [] },
        bodyLanguage: { score: 0, description: "Análise não disponível", observations: [] },
        verbalCommunication: { score: 0, description: "Análise não disponível", observations: [] }
      },
      functionalCapabilities: {
        mobility: { level: "independente", score: 0, details: "Análise não disponível" },
        coordination: { level: "boa", score: 0, details: "Análise não disponível" },
        cognition: { level: "preservada", score: 0, details: "Análise não disponível" },
        communication: { level: "clara", score: 0, details: "Análise não disponível" }
      },
      difficulties: [],
      strengths: [],
      recommendations: [],
      insights: [],
      alerts: [{
        type: "qualidade",
        severity: "error",
        message: `Erro ao processar análise automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gera um relatório textual formatado a partir da análise
 */
export function generateAnalysisReport(analysis: VideoAnalysisResult): string {
  let report = `# RELATÓRIO DE ANÁLISE DE VÍDEO - PIR\n\n`;
  
  report += `## RESUMO EXECUTIVO\n\n`;
  report += `**Pontuação Geral:** ${analysis.overallScore}/100\n\n`;
  report += `${analysis.summary}\n\n`;
  
  report += `---\n\n`;
  
  report += `## ANÁLISE DE PADRÕES\n\n`;
  
  report += `### Qualidade de Movimento\n`;
  report += `**Pontuação:** ${analysis.patterns.movementQuality.score}/100\n\n`;
  report += `${analysis.patterns.movementQuality.description}\n\n`;
  if (analysis.patterns.movementQuality.observations.length > 0) {
    report += `**Observações:**\n`;
    analysis.patterns.movementQuality.observations.forEach(obs => {
      report += `- ${obs}\n`;
    });
    report += `\n`;
  }
  
  report += `### Expressões Faciais\n`;
  report += `**Pontuação:** ${analysis.patterns.facialExpressions.score}/100\n\n`;
  report += `${analysis.patterns.facialExpressions.description}\n\n`;
  if (analysis.patterns.facialExpressions.observations.length > 0) {
    report += `**Observações:**\n`;
    analysis.patterns.facialExpressions.observations.forEach(obs => {
      report += `- ${obs}\n`;
    });
    report += `\n`;
  }
  
  report += `### Linguagem Corporal\n`;
  report += `**Pontuação:** ${analysis.patterns.bodyLanguage.score}/100\n\n`;
  report += `${analysis.patterns.bodyLanguage.description}\n\n`;
  if (analysis.patterns.bodyLanguage.observations.length > 0) {
    report += `**Observações:**\n`;
    analysis.patterns.bodyLanguage.observations.forEach(obs => {
      report += `- ${obs}\n`;
    });
    report += `\n`;
  }
  
  report += `### Comunicação Verbal\n`;
  report += `**Pontuação:** ${analysis.patterns.verbalCommunication.score}/100\n\n`;
  report += `${analysis.patterns.verbalCommunication.description}\n\n`;
  if (analysis.patterns.verbalCommunication.observations.length > 0) {
    report += `**Observações:**\n`;
    analysis.patterns.verbalCommunication.observations.forEach(obs => {
      report += `- ${obs}\n`;
    });
    report += `\n`;
  }
  
  report += `---\n\n`;
  
  report += `## CAPACIDADES FUNCIONAIS\n\n`;
  
  report += `### Mobilidade\n`;
  report += `**Nível:** ${analysis.functionalCapabilities.mobility.level.replace(/_/g, ' ').toUpperCase()}\n`;
  report += `**Pontuação:** ${analysis.functionalCapabilities.mobility.score}/100\n\n`;
  report += `${analysis.functionalCapabilities.mobility.details}\n\n`;
  
  report += `### Coordenação\n`;
  report += `**Nível:** ${analysis.functionalCapabilities.coordination.level.toUpperCase()}\n`;
  report += `**Pontuação:** ${analysis.functionalCapabilities.coordination.score}/100\n\n`;
  report += `${analysis.functionalCapabilities.coordination.details}\n\n`;
  
  report += `### Cognição\n`;
  report += `**Nível:** ${analysis.functionalCapabilities.cognition.level.replace(/_/g, ' ').toUpperCase()}\n`;
  report += `**Pontuação:** ${analysis.functionalCapabilities.cognition.score}/100\n\n`;
  report += `${analysis.functionalCapabilities.cognition.details}\n\n`;
  
  report += `### Comunicação\n`;
  report += `**Nível:** ${analysis.functionalCapabilities.communication.level.replace(/_/g, ' ').toUpperCase()}\n`;
  report += `**Pontuação:** ${analysis.functionalCapabilities.communication.score}/100\n\n`;
  report += `${analysis.functionalCapabilities.communication.details}\n\n`;
  
  report += `---\n\n`;
  
  if (analysis.difficulties.length > 0) {
    report += `## DIFICULDADES IDENTIFICADAS\n\n`;
    analysis.difficulties.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.activity}\n`;
      report += `**Severidade:** ${diff.severity.toUpperCase()}\n`;
      if (diff.timestamp) {
        const minutes = Math.floor(diff.timestamp / 60);
        const seconds = Math.floor(diff.timestamp % 60);
        report += `**Timestamp:** ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
      }
      report += `\n${diff.description}\n\n`;
    });
    report += `---\n\n`;
  }
  
  if (analysis.strengths.length > 0) {
    report += `## PONTOS FORTES\n\n`;
    analysis.strengths.forEach(strength => {
      report += `- ${strength}\n`;
    });
    report += `\n---\n\n`;
  }
  
  if (analysis.recommendations.length > 0) {
    report += `## RECOMENDAÇÕES\n\n`;
    
    const highPriority = analysis.recommendations.filter(r => r.priority === 'alta');
    const mediumPriority = analysis.recommendations.filter(r => r.priority === 'media');
    const lowPriority = analysis.recommendations.filter(r => r.priority === 'baixa');
    
    if (highPriority.length > 0) {
      report += `### Prioridade Alta\n\n`;
      highPriority.forEach((rec, index) => {
        report += `${index + 1}. **${rec.category}:** ${rec.description}\n\n`;
      });
    }
    
    if (mediumPriority.length > 0) {
      report += `### Prioridade Média\n\n`;
      mediumPriority.forEach((rec, index) => {
        report += `${index + 1}. **${rec.category}:** ${rec.description}\n\n`;
      });
    }
    
    if (lowPriority.length > 0) {
      report += `### Prioridade Baixa\n\n`;
      lowPriority.forEach((rec, index) => {
        report += `${index + 1}. **${rec.category}:** ${rec.description}\n\n`;
      });
    }
    
    report += `---\n\n`;
  }
  
  if (analysis.insights.length > 0) {
    report += `## INSIGHTS AUTOMÁTICOS\n\n`;
    analysis.insights.forEach(insight => {
      report += `- ${insight}\n`;
    });
    report += `\n---\n\n`;
  }
  
  if (analysis.alerts.length > 0) {
    report += `## ALERTAS\n\n`;
    analysis.alerts.forEach(alert => {
      const icon = alert.severity === 'error' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
      report += `${icon} **[${alert.type.toUpperCase()}]** ${alert.message}\n\n`;
    });
  }
  
  return report;
}
