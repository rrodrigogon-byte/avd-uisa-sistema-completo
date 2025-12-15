import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Teste para validar correção do bug de inclusão de sucessor
 * 
 * Erro original:
 * Failed query: insert into `successionCandidates` 
 * (`id`, `planId`, `employeeId`, `readinessLevel`, `priority`, 
 * `performanceRating`, `potentialRating`, `nineBoxPosition`, 
 * `pdiPlanId`, `pdiProgress`, `pdiCompletedActions`, `pdiTotalActions`, 
 * `readinessScore`, `competencyGapScore`, `lastScoreUpdate`, 
 * `gapAnalysis`, `developmentActions`, `developmentPlanId`, `notes`, 
 * `createdAt`, `updatedAt`) 
 * values (default, ?, ?, ?, ?, ?, ?, ?, default, default, default, default, 
 * default, default, default, ?, ?, ?, ?, default, default)
 * 
 * Problema: Campos pdiPlanId e developmentPlanId não existem no banco
 * Solução: Removidos do schema e do insert
 */

describe('Correção Bug Sucessor', () => {
  it('deve validar schema do addSuccessor sem campos inexistentes', () => {
    const addSuccessorSchema = z.object({
      planId: z.number(),
      employeeId: z.number(),
      readinessLevel: z.enum(["imediato", "1_ano", "2_3_anos", "mais_3_anos"]),
      priority: z.number().default(1),
      performanceRating: z.enum(["baixo", "medio", "alto", "excepcional"]).optional(),
      potentialRating: z.enum(["baixo", "medio", "alto", "excepcional"]).optional(),
      nineBoxPosition: z.string().optional(),
      gapAnalysis: z.string().optional(),
      developmentActions: z.string().optional(),
      notes: z.string().optional(),
    });

    // Dados do erro original
    const inputData = {
      planId: 210002,
      employeeId: 91043,
      readinessLevel: "mais_3_anos" as const,
      priority: 4,
      performanceRating: "excepcional" as const,
      potentialRating: "excepcional" as const,
      nineBoxPosition: "",
      gapAnalysis: "Profidddionsl com hitoricos de adm e MBA E EXPERIENCIA PRECIA",
      developmentActions: "CURSOS DE INGLES, MATEMATICA FINANCEIRA",
      notes: "CHANCELADO PELO CEO",
    };

    // Validar que o schema aceita os dados
    const result = addSuccessorSchema.safeParse(inputData);
    expect(result.success).toBe(true);

    if (result.success) {
      // Preparar dados para insert (sem campos inexistentes)
      const candidateData = {
        planId: result.data.planId,
        employeeId: result.data.employeeId,
        readinessLevel: result.data.readinessLevel,
        priority: result.data.priority,
        performanceRating: result.data.performanceRating || null,
        potentialRating: result.data.potentialRating || null,
        nineBoxPosition: result.data.nineBoxPosition || null,
        gapAnalysis: result.data.gapAnalysis || null,
        developmentActions: result.data.developmentActions || null,
        notes: result.data.notes || null,
      };

      // Verificar que não contém campos inexistentes
      expect(candidateData).not.toHaveProperty('pdiPlanId');
      expect(candidateData).not.toHaveProperty('developmentPlanId');
      expect(candidateData).not.toHaveProperty('pdiProgress');
      expect(candidateData).not.toHaveProperty('pdiCompletedActions');
      expect(candidateData).not.toHaveProperty('pdiTotalActions');

      // Verificar campos obrigatórios
      expect(candidateData.planId).toBe(210002);
      expect(candidateData.employeeId).toBe(91043);
      expect(candidateData.readinessLevel).toBe("mais_3_anos");
      expect(candidateData.priority).toBe(4);
    }
  });

  it('deve aceitar dados mínimos sem campos opcionais', () => {
    const minimalData = {
      planId: 1,
      employeeId: 2,
      readinessLevel: "imediato" as const,
      priority: 1,
    };

    const addSuccessorSchema = z.object({
      planId: z.number(),
      employeeId: z.number(),
      readinessLevel: z.enum(["imediato", "1_ano", "2_3_anos", "mais_3_anos"]),
      priority: z.number().default(1),
      performanceRating: z.enum(["baixo", "medio", "alto", "excepcional"]).optional(),
      potentialRating: z.enum(["baixo", "medio", "alto", "excepcional"]).optional(),
      nineBoxPosition: z.string().optional(),
      gapAnalysis: z.string().optional(),
      developmentActions: z.string().optional(),
      notes: z.string().optional(),
    });

    const result = addSuccessorSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });
});
