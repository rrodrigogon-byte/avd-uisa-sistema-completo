import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { 
  avdAssessmentProcesses,
  pirAssessments, 
  pirAnswers,
  pirQuestions,
  users,
  employees
} from '../drizzle/schema';

/**
 * Script de seed para popular dados de teste de avaliações PIR
 * Gera dados realistas com diferentes perfis e cenários
 */

// Perfis de teste com diferentes características PIR
const testProfiles = [
  {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    department: 'Tecnologia',
    position: 'Desenvolvedor Senior',
    profile: {
      IP: 85, // Alta Influência Pessoal
      ID: 70, // Boa Influência Diretiva
      IC: 60, // Influência Cooperativa moderada
      ES: 75, // Boa Estabilidade
      FL: 80, // Alta Flexibilidade
      AU: 65  // Autonomia moderada
    }
  },
  {
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    department: 'Recursos Humanos',
    position: 'Gerente de RH',
    profile: {
      IP: 90, // Altíssima Influência Pessoal
      ID: 85, // Alta Influência Diretiva
      IC: 95, // Altíssima Influência Cooperativa
      ES: 80, // Alta Estabilidade
      FL: 70, // Boa Flexibilidade
      AU: 75  // Boa Autonomia
    }
  },
  {
    name: 'Pedro Costa',
    email: 'pedro.costa@example.com',
    department: 'Financeiro',
    position: 'Analista Financeiro',
    profile: {
      IP: 50, // Influência Pessoal moderada
      ID: 60, // Influência Diretiva moderada
      IC: 55, // Influência Cooperativa moderada
      ES: 90, // Altíssima Estabilidade
      FL: 45, // Flexibilidade baixa
      AU: 70  // Boa Autonomia
    }
  },
  {
    name: 'Ana Oliveira',
    email: 'ana.oliveira@example.com',
    department: 'Marketing',
    position: 'Coordenadora de Marketing',
    profile: {
      IP: 95, // Altíssima Influência Pessoal
      ID: 75, // Boa Influência Diretiva
      IC: 85, // Alta Influência Cooperativa
      ES: 65, // Estabilidade moderada
      FL: 90, // Altíssima Flexibilidade
      AU: 80  // Alta Autonomia
    }
  },
  {
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@example.com',
    department: 'Operações',
    position: 'Supervisor de Operações',
    profile: {
      IP: 60, // Influência Pessoal moderada
      ID: 85, // Alta Influência Diretiva
      IC: 70, // Boa Influência Cooperativa
      ES: 85, // Alta Estabilidade
      FL: 55, // Flexibilidade moderada
      AU: 75  // Boa Autonomia
    }
  },
  {
    name: 'Juliana Alves',
    email: 'juliana.alves@example.com',
    department: 'Vendas',
    position: 'Executiva de Vendas',
    profile: {
      IP: 92, // Altíssima Influência Pessoal
      ID: 80, // Alta Influência Diretiva
      IC: 88, // Alta Influência Cooperativa
      ES: 70, // Boa Estabilidade
      FL: 85, // Alta Flexibilidade
      AU: 78  // Boa Autonomia
    }
  }
];

// Calcular score geral baseado nas dimensões
function calculateOverallScore(profile: Record<string, number>): number {
  const scores = Object.values(profile);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Função principal de seed
async function seedPirData() {
  console.log('🌱 Iniciando seed de dados PIR...\n');

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    for (const testProfile of testProfiles) {
      console.log(`📝 Criando dados para: ${testProfile.name}`);
      
      // 1. Criar ou buscar usuário
      let user = await db.select()
        .from(users)
        .where(eq(users.email, testProfile.email))
        .limit(1);
      
      if (user.length === 0) {
        // Criar novo usuário
        const [newUser] = await db.insert(users).values({
          openId: `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: testProfile.name,
          email: testProfile.email,
          role: 'colaborador',
          loginMethod: 'seed'
        });
        
        user = await db.select()
          .from(users)
          .where(eq(users.id, newUser.insertId))
          .limit(1);
      }
      
      const userId = user[0].id;
      
      // 2. Criar ou buscar funcionário
      let employee = await db.select()
        .from(employees)
        .where(eq(employees.userId, userId))
        .limit(1);
      
      if (employee.length === 0) {
        const [newEmployee] = await db.insert(employees).values({
          userId,
          employeeCode: `EMP${String(userId).padStart(4, '0')}`,
          name: testProfile.name,
          email: testProfile.email,
          status: 'ativo'
        });
        
        employee = await db.select()
          .from(employees)
          .where(eq(employees.id, newEmployee.insertId))
          .limit(1);
      }
      
      const employeeId = employee[0].id;
      
      // 3. Criar processo de avaliação AVD
      const [process] = await db.insert(avdAssessmentProcesses).values({
        employeeId,
        status: 'em_andamento',
        currentStep: 2,
        step2CompletedAt: new Date(),
        createdBy: userId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
      });
      
      const processId = process.insertId;
      
      // 4. Criar avaliação PIR
      const overallScore = calculateOverallScore(testProfile.profile);
      const assessmentDate = new Date();
      
      const [pirAssessment] = await db.insert(pirAssessments).values({
        employeeId,
        cycleId: null,
        assessmentDate,
        status: 'concluida',
        overallScore,
        createdBy: userId,
        completedAt: assessmentDate
      });
      
      const pirAssessmentId = pirAssessment.insertId;
      
      // 5. Atualizar processo com ID do PIR
      await db.update(avdAssessmentProcesses)
        .set({ step2Id: pirAssessmentId })
        .where(eq(avdAssessmentProcesses.id, processId));
      
      // 6. Buscar questões PIR existentes (assumindo que já existem 60 questões)
      const questions = await db.select()
        .from(pirQuestions)
        .limit(60);
      
      if (questions.length === 0) {
        console.log('   ⚠️  Nenhuma questão PIR encontrada. Pulando respostas.');
        continue;
      }
      
      // 7. Gerar respostas baseadas no perfil
      const dimensionMap: Record<string, number> = testProfile.profile;
      
      for (const question of questions) {
        // Determinar resposta baseada na dimensão e score alvo
        const dimension = question.dimension || 'IP';
        const targetScore = dimensionMap[dimension] || 50;
        
        let answerScale: number;
        const variation = Math.random() * 20 - 10; // Variação de -10 a +10
        const adjustedScore = targetScore + variation;
        
        if (adjustedScore >= 80) {
          answerScale = Math.random() < 0.7 ? 5 : 4;
        } else if (adjustedScore >= 60) {
          answerScale = Math.random() < 0.5 ? 4 : (Math.random() < 0.7 ? 3 : 5);
        } else if (adjustedScore >= 40) {
          answerScale = Math.random() < 0.6 ? 3 : (Math.random() < 0.5 ? 2 : 4);
        } else {
          answerScale = Math.random() < 0.7 ? 2 : 1;
        }
        
        await db.insert(pirAnswers).values({
          pirAssessmentId,
          questionId: question.id,
          answerScale,
          answeredAt: assessmentDate
        });
      }
      
      console.log(`   ✅ Processo AVD criado (ID: ${processId})`);
      console.log(`   ✅ Avaliação PIR criada (ID: ${pirAssessmentId})`);
      console.log(`   ✅ ${questions.length} respostas inseridas`);
      console.log(`   📊 Score Geral: ${overallScore}`);
      console.log(`   📊 Perfil: IP=${testProfile.profile.IP}, ID=${testProfile.profile.ID}, IC=${testProfile.profile.IC}, ES=${testProfile.profile.ES}, FL=${testProfile.profile.FL}, AU=${testProfile.profile.AU}\n`);
    }
    
    console.log('✨ Seed concluído com sucesso!');
    console.log(`📈 Total de perfis criados: ${testProfiles.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar seed
seedPirData().catch(console.error);
