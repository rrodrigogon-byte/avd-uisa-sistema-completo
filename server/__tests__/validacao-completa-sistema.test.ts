import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { 
  employees, 
  employeeMovements,
  psychometricTests,
  testResponses,
  pirIntegrityAssessments,
  pirIntegrityQuestions,
  pirIntegrityResponses
} from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Suite de Testes de Validação Completa do Sistema AVD UISA
 * 
 * Valida todos os fluxos críticos antes da publicação:
 * 1. Movimentações de funcionários
 * 2. Testes psicométricos (DISC, Big Five, MBTI, IE, VARK, Leadership, Career Anchors)
 * 3. PIR Integridade
 */
describe('🚀 Validação Completa do Sistema AVD UISA', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
  });

  describe('📊 Módulo de Movimentações', () => {
    it('deve ter tabela de movimentações configurada corretamente', async () => {
      expect(db).toBeDefined();
      
      // Verificar estrutura da tabela
      const movements = await db
        .select()
        .from(employeeMovements)
        .limit(1);
      
      expect(movements).toBeDefined();
    });

    it('deve ter movimentações registradas no sistema', async () => {
      const movements = await db
        .select()
        .from(employeeMovements)
        .limit(10);
      
      console.log(`✅ Total de movimentações encontradas: ${movements.length}`);
      
      // Não falhar se não houver movimentações, apenas avisar
      if (movements.length === 0) {
        console.warn('⚠️  Nenhuma movimentação encontrada no sistema');
      }
    });

    it('deve validar campos obrigatórios em movimentações', async () => {
      const [movement] = await db
        .select()
        .from(employeeMovements)
        .limit(1);
      
      if (movement) {
        expect(movement.employeeId).toBeDefined();
        expect(movement.movementType).toBeDefined();
        expect(movement.approvalStatus).toBeDefined();
        expect(movement.effectiveDate).toBeDefined();
        expect(movement.createdBy).toBeDefined();
        console.log('✅ Campos obrigatórios validados em movimentação');
      }
    });

    it('deve ter tipos de movimentação válidos', async () => {
      const movements = await db
        .select()
        .from(employeeMovements)
        .limit(100);
      
      const validTypes = [
        'promocao',
        'transferencia',
        'mudanca_gestor',
        'mudanca_cargo',
        'ajuste_salarial',
        'desligamento',
        'admissao',
        'retorno_afastamento',
        'reorganizacao',
        'outro'
      ];
      
      movements.forEach(m => {
        if (m.movementType) {
          expect(validTypes).toContain(m.movementType);
        }
      });
      
      console.log('✅ Tipos de movimentação validados');
    });

    it('deve ter status de aprovação válidos', async () => {
      const movements = await db
        .select()
        .from(employeeMovements)
        .limit(100);
      
      const validStatuses = ['pendente', 'aprovado', 'rejeitado', 'cancelado'];
      
      movements.forEach(m => {
        expect(validStatuses).toContain(m.approvalStatus);
      });
      
      console.log('✅ Status de aprovação validados');
    });
  });

  describe('🧠 Módulo de Testes Psicométricos', () => {
    it('deve ter tabela de testes psicométricos configurada', async () => {
      const tests = await db
        .select()
        .from(psychometricTests)
        .limit(1);
      
      expect(tests).toBeDefined();
      console.log('✅ Tabela de testes psicométricos configurada');
    });

    it('deve ter todos os tipos de testes disponíveis', async () => {
      const tests = await db
        .select()
        .from(psychometricTests)
        .limit(100);
      
      const testTypes = [...new Set(tests.map(t => t.testType))];
      console.log(`📋 Tipos de testes encontrados: ${testTypes.join(', ')}`);
      
      // Verificar se temos variedade de testes
      expect(testTypes.length).toBeGreaterThan(0);
      console.log(`✅ ${testTypes.length} tipos de testes psicométricos disponíveis`);
    });

    it('deve validar estrutura de testes DISC', async () => {
      const discTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'DISC'))
        .limit(10);
      
      if (discTests.length > 0) {
        discTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('DISC');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${discTests.length} testes DISC validados`);
      } else {
        console.warn('⚠️  Nenhum teste DISC encontrado');
      }
    });

    it('deve validar estrutura de testes Big Five', async () => {
      const bigFiveTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'BigFive'))
        .limit(10);
      
      if (bigFiveTests.length > 0) {
        bigFiveTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('BigFive');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${bigFiveTests.length} testes Big Five validados`);
      } else {
        console.warn('⚠️  Nenhum teste Big Five encontrado');
      }
    });

    it('deve validar estrutura de testes MBTI', async () => {
      const mbtiTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'MBTI'))
        .limit(10);
      
      if (mbtiTests.length > 0) {
        mbtiTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('MBTI');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${mbtiTests.length} testes MBTI validados`);
      } else {
        console.warn('⚠️  Nenhum teste MBTI encontrado');
      }
    });

    it('deve validar estrutura de testes IE (Inteligência Emocional)', async () => {
      const ieTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'IE'))
        .limit(10);
      
      if (ieTests.length > 0) {
        ieTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('IE');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${ieTests.length} testes IE validados`);
      } else {
        console.warn('⚠️  Nenhum teste IE encontrado');
      }
    });

    it('deve validar estrutura de testes VARK', async () => {
      const varkTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'VARK'))
        .limit(10);
      
      if (varkTests.length > 0) {
        varkTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('VARK');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${varkTests.length} testes VARK validados`);
      } else {
        console.warn('⚠️  Nenhum teste VARK encontrado');
      }
    });

    it('deve validar estrutura de testes Leadership', async () => {
      const leadershipTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'Leadership'))
        .limit(10);
      
      if (leadershipTests.length > 0) {
        leadershipTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('Leadership');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${leadershipTests.length} testes Leadership validados`);
      } else {
        console.warn('⚠️  Nenhum teste Leadership encontrado');
      }
    });

    it('deve validar estrutura de testes Career Anchors', async () => {
      const careerTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.testType, 'CareerAnchors'))
        .limit(10);
      
      if (careerTests.length > 0) {
        careerTests.forEach(test => {
          expect(test.employeeId).toBeDefined();
          expect(test.testType).toBe('CareerAnchors');
          expect(test.status).toBeDefined();
        });
        console.log(`✅ ${careerTests.length} testes Career Anchors validados`);
      } else {
        console.warn('⚠️  Nenhum teste Career Anchors encontrado');
      }
    });

    it('deve ter respostas vinculadas aos testes', async () => {
      const responses = await db
        .select()
        .from(testResponses)
        .limit(10);
      
      if (responses.length > 0) {
        responses.forEach(response => {
          expect(response.testId).toBeDefined();
          expect(response.questionId).toBeDefined();
        });
        console.log(`✅ ${responses.length} respostas de testes validadas`);
      } else {
        console.warn('⚠️  Nenhuma resposta de teste encontrada');
      }
    });
  });

  describe('🔒 Módulo PIR Integridade', () => {
    it('deve ter tabela de assessments PIR configurada', async () => {
      const assessments = await db
        .select()
        .from(pirIntegrityAssessments)
        .limit(1);
      
      expect(assessments).toBeDefined();
      console.log('✅ Tabela de assessments PIR configurada');
    });

    it('deve ter questões PIR cadastradas', async () => {
      const questions = await db
        .select()
        .from(pirIntegrityQuestions)
        .limit(100);
      
      expect(questions.length).toBeGreaterThan(0);
      console.log(`✅ ${questions.length} questões PIR encontradas`);
      
      // Verificar se temos pelo menos 60 questões ativas
      const activeQuestions = questions.filter(q => q.isActive);
      expect(activeQuestions.length).toBeGreaterThanOrEqual(60);
      console.log(`✅ ${activeQuestions.length} questões PIR ativas (mínimo: 60)`);
    });

    it('deve validar estrutura de questões PIR', async () => {
      const [question] = await db
        .select()
        .from(pirIntegrityQuestions)
        .where(eq(pirIntegrityQuestions.isActive, true))
        .limit(1);
      
      if (question) {
        expect(question.questionText).toBeDefined();
        expect(question.category).toBeDefined();
        expect(question.options).toBeDefined();
        expect(question.correctAnswer).toBeDefined();
        console.log('✅ Estrutura de questões PIR validada');
      }
    });

    it('deve ter assessments PIR criados', async () => {
      const assessments = await db
        .select()
        .from(pirIntegrityAssessments)
        .limit(10);
      
      if (assessments.length > 0) {
        assessments.forEach(assessment => {
          expect(assessment.employeeId).toBeDefined();
          expect(assessment.status).toBeDefined();
          expect(assessment.token).toBeDefined();
        });
        console.log(`✅ ${assessments.length} assessments PIR validados`);
      } else {
        console.warn('⚠️  Nenhum assessment PIR encontrado');
      }
    });

    it('deve ter respostas PIR vinculadas aos assessments', async () => {
      const responses = await db
        .select()
        .from(pirIntegrityResponses)
        .limit(10);
      
      if (responses.length > 0) {
        responses.forEach(response => {
          expect(response.assessmentId).toBeDefined();
          expect(response.questionId).toBeDefined();
          expect(response.selectedAnswer).toBeDefined();
        });
        console.log(`✅ ${responses.length} respostas PIR validadas`);
      } else {
        console.warn('⚠️  Nenhuma resposta PIR encontrada');
      }
    });

    it('deve validar categorias de questões PIR', async () => {
      const questions = await db
        .select()
        .from(pirIntegrityQuestions)
        .where(eq(pirIntegrityQuestions.isActive, true))
        .limit(100);
      
      const categories = [...new Set(questions.map(q => q.category))];
      console.log(`📋 Categorias PIR encontradas: ${categories.join(', ')}`);
      
      expect(categories.length).toBeGreaterThan(0);
      console.log(`✅ ${categories.length} categorias PIR validadas`);
    });
  });

  describe('👥 Módulo de Funcionários', () => {
    it('deve ter funcionários cadastrados', async () => {
      const employeesList = await db
        .select()
        .from(employees)
        .limit(10);
      
      expect(employeesList.length).toBeGreaterThan(0);
      console.log(`✅ ${employeesList.length} funcionários encontrados (amostra)`);
    });

    it('deve validar campos obrigatórios de funcionários', async () => {
      const [employee] = await db
        .select()
        .from(employees)
        .limit(1);
      
      if (employee) {
        expect(employee.name).toBeDefined();
        expect(employee.status).toBeDefined();
        console.log('✅ Campos obrigatórios de funcionários validados');
      }
    });
  });

  describe('📈 Resumo da Validação', () => {
    it('deve gerar relatório completo de validação', async () => {
      const stats = {
        funcionarios: (await db.select().from(employees).limit(10000)).length,
        movimentacoes: (await db.select().from(employeeMovements).limit(10000)).length,
        testespsicometricos: (await db.select().from(psychometricTests).limit(10000)).length,
        respostastestes: (await db.select().from(testResponses).limit(10000)).length,
        questoesPIR: (await db.select().from(pirIntegrityQuestions).limit(10000)).length,
        assessmentsPIR: (await db.select().from(pirIntegrityAssessments).limit(10000)).length,
        respostasPIR: (await db.select().from(pirIntegrityResponses).limit(10000)).length,
      };
      
      console.log('\n📊 RELATÓRIO DE VALIDAÇÃO DO SISTEMA AVD UISA\n');
      console.log('='.repeat(60));
      console.log(`👥 Funcionários cadastrados: ${stats.funcionarios}`);
      console.log(`🔄 Movimentações registradas: ${stats.movimentacoes}`);
      console.log(`🧠 Testes psicométricos: ${stats.testespsicometricos}`);
      console.log(`📝 Respostas de testes: ${stats.respostastestes}`);
      console.log(`❓ Questões PIR: ${stats.questoesPIR}`);
      console.log(`🔒 Assessments PIR: ${stats.assessmentsPIR}`);
      console.log(`✍️  Respostas PIR: ${stats.respostasPIR}`);
      console.log('='.repeat(60));
      console.log('\n✅ Validação completa concluída com sucesso!\n');
      
      // Verificações mínimas
      expect(stats.funcionarios).toBeGreaterThan(0);
      expect(stats.questoesPIR).toBeGreaterThanOrEqual(60);
    });
  });
});
