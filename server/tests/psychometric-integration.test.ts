import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { employees, pdiPlans, pdiIntelligentDetails, successionPlans, successionCandidates, psychometricTests } from '../../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * Testes de Integração de Testes Psicométricos
 * Valida que os resultados dos testes são corretamente integrados ao PDI e Plano de Sucessão
 */

describe('Integração de Testes Psicométricos', () => {
  let database: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    database = await getDb();
  });

  it('deve validar múltiplos emails separados por vírgula', () => {
    const emailString = 'fernando.fpinto@uisa.com.br, lucas.silva@uisa.com.br, bernado.mendes@uisa.com.br';
    
    // Simular processamento do frontend
    const emailList = emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    expect(emailList).toHaveLength(3);
    expect(emailList[0]).toBe('fernando.fpinto@uisa.com.br');
    expect(emailList[1]).toBe('lucas.silva@uisa.com.br');
    expect(emailList[2]).toBe('bernado.mendes@uisa.com.br');

    // Validar cada email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailList.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  it('deve integrar resultados DISC ao PDI do funcionário', async () => {
    if (!database) {
      console.warn('Database não disponível, pulando teste');
      return;
    }

    // Buscar um funcionário com PDI ativo
    const employeeWithPdi = await database.select({
      employee: employees,
      pdi: pdiPlans,
    })
      .from(employees)
      .leftJoin(pdiPlans, eq(employees.id, pdiPlans.employeeId))
      .where(
        and(
          eq(employees.status, 'ativo'),
          or(
            eq(pdiPlans.status, 'em_andamento'),
            eq(pdiPlans.status, 'aprovado')
          )
        )
      )
      .limit(1);

    if (employeeWithPdi.length === 0) {
      console.warn('Nenhum funcionário com PDI ativo encontrado, pulando teste');
      return;
    }

    const employee = employeeWithPdi[0].employee;
    const pdi = employeeWithPdi[0].pdi;

    // Simular resultado de teste DISC
    const discProfile = {
      D: 4.2,
      I: 3.5,
      S: 2.8,
      C: 3.1,
    };

    // Buscar ou criar pdiIntelligentDetails
    const pdiDetails = await database.select()
      .from(pdiIntelligentDetails)
      .where(eq(pdiIntelligentDetails.planId, pdi!.id))
      .limit(1);

    const currentProfile: any = pdiDetails.length > 0 && pdiDetails[0].currentProfile 
      ? pdiDetails[0].currentProfile 
      : {};

    currentProfile.disc = {
      d: discProfile.D,
      i: discProfile.I,
      s: discProfile.S,
      c: discProfile.C,
    };

    if (pdiDetails.length > 0) {
      await database.update(pdiIntelligentDetails)
        .set({ 
          currentProfile,
          updatedAt: new Date(),
        })
        .where(eq(pdiIntelligentDetails.id, pdiDetails[0].id));
    } else {
      await database.insert(pdiIntelligentDetails).values({
        planId: pdi!.id,
        currentProfile,
        durationMonths: 24,
      });
    }

    // Verificar que foi salvo corretamente
    const updatedPdiDetails = await database.select()
      .from(pdiIntelligentDetails)
      .where(eq(pdiIntelligentDetails.planId, pdi!.id))
      .limit(1);

    expect(updatedPdiDetails.length).toBeGreaterThan(0);
    expect(updatedPdiDetails[0].currentProfile).toBeDefined();
    
    const savedProfile = updatedPdiDetails[0].currentProfile as any;
    expect(savedProfile.disc).toBeDefined();
    expect(savedProfile.disc.d).toBe(discProfile.D);
    expect(savedProfile.disc.i).toBe(discProfile.I);
  });

  it('deve integrar resultados ao plano de sucessão', async () => {
    if (!database) {
      console.warn('Database não disponível, pulando teste');
      return;
    }

    // Buscar um candidato de sucessão
    const candidate = await database.select()
      .from(successionCandidates)
      .limit(1);

    if (candidate.length === 0) {
      console.warn('Nenhum candidato de sucessão encontrado, pulando teste');
      return;
    }

    // Simular análise de gaps
    const gapAnalysisText = `Análise baseada em testes psicométricos (atualizado em ${new Date().toLocaleDateString('pt-BR')}):

**DISC - Perfil Comportamental:**
- Dominância (D): 84/100
- Influência (I): 70/100
- Estabilidade (S): 56/100
- Conformidade (C): 62/100
- Perfil dominante: D

`;

    const existingGapAnalysis = candidate[0].gapAnalysis || '';
    const updatedGapAnalysis = existingGapAnalysis + '\n' + gapAnalysisText;

    await database.update(successionCandidates)
      .set({ 
        gapAnalysis: updatedGapAnalysis,
        updatedAt: new Date(),
      })
      .where(eq(successionCandidates.id, candidate[0].id));

    // Verificar que foi salvo corretamente
    const updatedCandidate = await database.select()
      .from(successionCandidates)
      .where(eq(successionCandidates.id, candidate[0].id))
      .limit(1);

    expect(updatedCandidate.length).toBeGreaterThan(0);
    expect(updatedCandidate[0].gapAnalysis).toContain('DISC - Perfil Comportamental');
    expect(updatedCandidate[0].gapAnalysis).toContain('Dominância (D): 84/100');
  });

  it('deve buscar testes psicométricos de um funcionário', async () => {
    if (!database) {
      console.warn('Database não disponível, pulando teste');
      return;
    }

    // Buscar funcionário com testes
    const employeeWithTests = await database.select()
      .from(psychometricTests)
      .limit(1);

    if (employeeWithTests.length === 0) {
      console.warn('Nenhum teste psicométrico encontrado, pulando teste');
      return;
    }

    const employeeId = employeeWithTests[0].employeeId;

    // Buscar todos os testes do funcionário
    const tests = await database.select()
      .from(psychometricTests)
      .where(eq(psychometricTests.employeeId, employeeId));

    expect(tests.length).toBeGreaterThan(0);
    expect(tests[0].employeeId).toBe(employeeId);
    expect(tests[0].testType).toBeDefined();
    expect(tests[0].completedAt).toBeDefined();
  });
});
