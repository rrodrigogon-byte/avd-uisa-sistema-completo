import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { pirQuestions } from '../drizzle/schema';

/**
 * Script para popular questões PIR no banco de dados
 * 60 questões distribuídas em 6 dimensões (10 por dimensão)
 */

const questions = [
  // Influência Pessoal (IP) - 10 questões
  { dimension: 'IP', questionText: 'Você se sente confortável ao liderar uma equipe?', questionType: 'escala', orderIndex: 1 },
  { dimension: 'IP', questionText: 'Você consegue influenciar facilmente as decisões dos outros?', questionType: 'escala', orderIndex: 7 },
  { dimension: 'IP', questionText: 'As pessoas costumam seguir suas sugestões?', questionType: 'escala', orderIndex: 13 },
  { dimension: 'IP', questionText: 'Você se destaca naturalmente em grupos?', questionType: 'escala', orderIndex: 19 },
  { dimension: 'IP', questionText: 'Você gosta de ser o centro das atenções?', questionType: 'escala', orderIndex: 25 },
  { dimension: 'IP', questionText: 'Você se sente confiante ao apresentar ideias em público?', questionType: 'escala', orderIndex: 31 },
  { dimension: 'IP', questionText: 'Você consegue motivar outras pessoas facilmente?', questionType: 'escala', orderIndex: 37 },
  { dimension: 'IP', questionText: 'Você se considera carismático(a)?', questionType: 'escala', orderIndex: 43 },
  { dimension: 'IP', questionText: 'Você gosta de assumir responsabilidades de liderança?', questionType: 'escala', orderIndex: 49 },
  { dimension: 'IP', questionText: 'Você se sente à vontade ao tomar decisões importantes?', questionType: 'escala', orderIndex: 55 },

  // Influência Diretiva (ID) - 10 questões
  { dimension: 'ID', questionText: 'Você prefere dar instruções claras e diretas?', questionType: 'escala', orderIndex: 2 },
  { dimension: 'ID', questionText: 'Você gosta de estabelecer regras e procedimentos?', questionType: 'escala', orderIndex: 8 },
  { dimension: 'ID', questionText: 'Você se sente confortável ao delegar tarefas?', questionType: 'escala', orderIndex: 14 },
  { dimension: 'ID', questionText: 'Você prefere ter controle sobre os processos?', questionType: 'escala', orderIndex: 20 },
  { dimension: 'ID', questionText: 'Você gosta de organizar e planejar atividades?', questionType: 'escala', orderIndex: 26 },
  { dimension: 'ID', questionText: 'Você se sente bem ao supervisionar o trabalho de outros?', questionType: 'escala', orderIndex: 32 },
  { dimension: 'ID', questionText: 'Você prefere estruturas hierárquicas bem definidas?', questionType: 'escala', orderIndex: 38 },
  { dimension: 'ID', questionText: 'Você gosta de definir metas e cobrar resultados?', questionType: 'escala', orderIndex: 44 },
  { dimension: 'ID', questionText: 'Você se considera uma pessoa assertiva?', questionType: 'escala', orderIndex: 50 },
  { dimension: 'ID', questionText: 'Você prefere tomar decisões de forma rápida e firme?', questionType: 'escala', orderIndex: 56 },

  // Influência Cooperativa (IC) - 10 questões
  { dimension: 'IC', questionText: 'Você gosta de trabalhar em equipe?', questionType: 'escala', orderIndex: 3 },
  { dimension: 'IC', questionText: 'Você valoriza a opinião dos colegas?', questionType: 'escala', orderIndex: 9 },
  { dimension: 'IC', questionText: 'Você prefere tomar decisões em conjunto?', questionType: 'escala', orderIndex: 15 },
  { dimension: 'IC', questionText: 'Você se sente bem ao colaborar com outros?', questionType: 'escala', orderIndex: 21 },
  { dimension: 'IC', questionText: 'Você gosta de compartilhar conhecimento?', questionType: 'escala', orderIndex: 27 },
  { dimension: 'IC', questionText: 'Você se considera uma pessoa empática?', questionType: 'escala', orderIndex: 33 },
  { dimension: 'IC', questionText: 'Você prefere ambientes de trabalho harmoniosos?', questionType: 'escala', orderIndex: 39 },
  { dimension: 'IC', questionText: 'Você gosta de ajudar os colegas?', questionType: 'escala', orderIndex: 45 },
  { dimension: 'IC', questionText: 'Você valoriza o consenso nas decisões?', questionType: 'escala', orderIndex: 51 },
  { dimension: 'IC', questionText: 'Você se sente bem ao mediar conflitos?', questionType: 'escala', orderIndex: 57 },

  // Estabilidade (ES) - 10 questões
  { dimension: 'ES', questionText: 'Você se mantém calmo(a) em situações de pressão?', questionType: 'escala', orderIndex: 4 },
  { dimension: 'ES', questionText: 'Você lida bem com mudanças inesperadas?', questionType: 'escala', orderIndex: 10 },
  { dimension: 'ES', questionText: 'Você consegue controlar suas emoções no trabalho?', questionType: 'escala', orderIndex: 16 },
  { dimension: 'ES', questionText: 'Você se considera uma pessoa equilibrada?', questionType: 'escala', orderIndex: 22 },
  { dimension: 'ES', questionText: 'Você mantém a compostura em situações difíceis?', questionType: 'escala', orderIndex: 28 },
  { dimension: 'ES', questionText: 'Você se sente confortável com rotinas estáveis?', questionType: 'escala', orderIndex: 34 },
  { dimension: 'ES', questionText: 'Você prefere ambientes previsíveis?', questionType: 'escala', orderIndex: 40 },
  { dimension: 'ES', questionText: 'Você se recupera rapidamente de situações estressantes?', questionType: 'escala', orderIndex: 46 },
  { dimension: 'ES', questionText: 'Você se considera uma pessoa paciente?', questionType: 'escala', orderIndex: 52 },
  { dimension: 'ES', questionText: 'Você lida bem com críticas construtivas?', questionType: 'escala', orderIndex: 58 },

  // Flexibilidade (FL) - 10 questões
  { dimension: 'FL', questionText: 'Você se adapta facilmente a novas situações?', questionType: 'escala', orderIndex: 5 },
  { dimension: 'FL', questionText: 'Você gosta de experimentar coisas novas?', questionType: 'escala', orderIndex: 11 },
  { dimension: 'FL', questionText: 'Você se sente confortável com mudanças?', questionType: 'escala', orderIndex: 17 },
  { dimension: 'FL', questionText: 'Você é receptivo(a) a novas ideias?', questionType: 'escala', orderIndex: 23 },
  { dimension: 'FL', questionText: 'Você gosta de desafios e novidades?', questionType: 'escala', orderIndex: 29 },
  { dimension: 'FL', questionText: 'Você se considera uma pessoa criativa?', questionType: 'escala', orderIndex: 35 },
  { dimension: 'FL', questionText: 'Você prefere ambientes dinâmicos?', questionType: 'escala', orderIndex: 41 },
  { dimension: 'FL', questionText: 'Você se adapta bem a diferentes estilos de trabalho?', questionType: 'escala', orderIndex: 47 },
  { dimension: 'FL', questionText: 'Você gosta de inovar e propor mudanças?', questionType: 'escala', orderIndex: 53 },
  { dimension: 'FL', questionText: 'Você se sente bem em ambientes de incerteza?', questionType: 'escala', orderIndex: 59 },

  // Autonomia (AU) - 10 questões
  { dimension: 'AU', questionText: 'Você prefere trabalhar de forma independente?', questionType: 'escala', orderIndex: 6 },
  { dimension: 'AU', questionText: 'Você gosta de tomar suas próprias decisões?', questionType: 'escala', orderIndex: 12 },
  { dimension: 'AU', questionText: 'Você se sente confortável trabalhando sozinho(a)?', questionType: 'escala', orderIndex: 18 },
  { dimension: 'AU', questionText: 'Você prefere ter liberdade para escolher como fazer as tarefas?', questionType: 'escala', orderIndex: 24 },
  { dimension: 'AU', questionText: 'Você se considera autodidata?', questionType: 'escala', orderIndex: 30 },
  { dimension: 'AU', questionText: 'Você gosta de definir suas próprias metas?', questionType: 'escala', orderIndex: 36 },
  { dimension: 'AU', questionText: 'Você prefere ter controle sobre seu tempo?', questionType: 'escala', orderIndex: 42 },
  { dimension: 'AU', questionText: 'Você se sente bem sem supervisão constante?', questionType: 'escala', orderIndex: 48 },
  { dimension: 'AU', questionText: 'Você gosta de assumir responsabilidade pelos seus resultados?', questionType: 'escala', orderIndex: 54 },
  { dimension: 'AU', questionText: 'Você prefere ambientes com pouca hierarquia?', questionType: 'escala', orderIndex: 60 },
];

async function seedPirQuestions() {
  console.log('🌱 Iniciando seed de questões PIR...\n');

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    console.log(`📝 Inserindo ${questions.length} questões PIR...`);
    
    for (const question of questions) {
      await db.insert(pirQuestions).values({
        cycleId: null, // Questões padrão (não vinculadas a ciclo específico)
        questionText: question.questionText,
        questionType: question.questionType,
        order: question.orderIndex,
        active: true,
        createdBy: 1 // Sistema
      });
    }
    
    console.log('✨ Seed de questões concluído com sucesso!');
    console.log(`📊 Total de questões inseridas: ${questions.length}`);
    console.log('📊 Distribuição por dimensão:');
    console.log('   - IP (Influência Pessoal): 10 questões');
    console.log('   - ID (Influência Diretiva): 10 questões');
    console.log('   - IC (Influência Cooperativa): 10 questões');
    console.log('   - ES (Estabilidade): 10 questões');
    console.log('   - FL (Flexibilidade): 10 questões');
    console.log('   - AU (Autonomia): 10 questões');
    
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar seed
seedPirQuestions().catch(console.error);
