import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { 
  avdAssessmentProcesses, 
  avdPirAssessments, 
  avdPirAnswers,
  users 
} from '../drizzle/schema.js';

/**
 * Script de seed para popular dados de teste de avaliações PIR
 * Gera dados realistas com diferentes perfis e cenários
 */

// Configuração de conexão
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

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

// Mapeamento de respostas baseado no perfil desejado
function generateAnswersForProfile(profile) {
  const answers = [];
  
  // 60 questões PIR distribuídas nas 6 dimensões (10 questões por dimensão)
  const dimensionQuestions = {
    IP: [1, 7, 13, 19, 25, 31, 37, 43, 49, 55],
    ID: [2, 8, 14, 20, 26, 32, 38, 44, 50, 56],
    IC: [3, 9, 15, 21, 27, 33, 39, 45, 51, 57],
    ES: [4, 10, 16, 22, 28, 34, 40, 46, 52, 58],
    FL: [5, 11, 17, 23, 29, 35, 41, 47, 53, 59],
    AU: [6, 12, 18, 24, 30, 36, 42, 48, 54, 60]
  };

  for (const [dimension, questions] of Object.entries(dimensionQuestions)) {
    const targetScore = profile[dimension];
    
    questions.forEach((questionNumber, index) => {
      // Gerar resposta baseada no score alvo (com alguma variação)
      let response;
      const variation = Math.random() * 20 - 10; // Variação de -10 a +10
      const adjustedScore = targetScore + variation;
      
      if (adjustedScore >= 80) {
        response = Math.random() < 0.7 ? 5 : 4; // Maioria 5, alguns 4
      } else if (adjustedScore >= 60) {
        response = Math.random() < 0.5 ? 4 : (Math.random() < 0.7 ? 3 : 5);
      } else if (adjustedScore >= 40) {
        response = Math.random() < 0.6 ? 3 : (Math.random() < 0.5 ? 2 : 4);
      } else {
        response = Math.random() < 0.7 ? 2 : 1;
      }
      
      answers.push({
        questionNumber,
        dimension,
        response
      });
    });
  }
  
  return answers;
}

// Função principal de seed
async function seedPirData() {
  console.log('🌱 Iniciando seed de dados PIR...\n');

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
          role: 'user',
          loginMethod: 'seed'
        });
        
        user = await db.select()
          .from(users)
          .where(eq(users.id, newUser.insertId))
          .limit(1);
      }
      
      const userId = user[0].id;
      
      // 2. Criar processo de avaliação
      const [process] = await db.insert(avdAssessmentProcesses).values({
        userId,
        employeeName: testProfile.name,
        employeeCode: `EMP${String(userId).padStart(4, '0')}`,
        department: testProfile.department,
        position: testProfile.position,
        currentStep: 2, // PIR completado
        step1Completed: true,
        step2Completed: true,
        step3Completed: false,
        step4Completed: false,
        step5Completed: false,
        startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
      });
      
      const processId = process.insertId;
      
      // 3. Criar avaliação PIR
      const [pirAssessment] = await db.insert(avdPirAssessments).values({
        processId,
        userId,
        ipScore: testProfile.profile.IP,
        idScore: testProfile.profile.ID,
        icScore: testProfile.profile.IC,
        esScore: testProfile.profile.ES,
        flScore: testProfile.profile.FL,
        auScore: testProfile.profile.AU,
        completedAt: new Date()
      });
      
      const assessmentId = pirAssessment.insertId;
      
      // 4. Gerar e inserir respostas
      const answers = generateAnswersForProfile(testProfile.profile);
      
      for (const answer of answers) {
        await db.insert(avdPirAnswers).values({
          assessmentId,
          questionNumber: answer.questionNumber,
          dimension: answer.dimension,
          response: answer.response
        });
      }
      
      console.log(`   ✅ Processo criado (ID: ${processId})`);
      console.log(`   ✅ Avaliação PIR criada (ID: ${assessmentId})`);
      console.log(`   ✅ ${answers.length} respostas inseridas`);
      console.log(`   📊 Scores: IP=${testProfile.profile.IP}, ID=${testProfile.profile.ID}, IC=${testProfile.profile.IC}, ES=${testProfile.profile.ES}, FL=${testProfile.profile.FL}, AU=${testProfile.profile.AU}\n`);
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
