/**
 * Script para popular as questões do teste PIR (Perfil de Identidade de Relacionamento)
 * O PIR é baseado em 6 dimensões: Dominância, Influência, Estabilidade, Conformidade, Assertividade e Empatia
 */

import mysql from 'mysql2/promise';

const PIR_QUESTIONS = [
  // Dimensão: Dominância (D) - Questões 1-10
  { questionNumber: 1, questionText: "Eu gosto de assumir o controle das situações.", dimension: "D", reverse: false },
  { questionNumber: 2, questionText: "Prefiro tomar decisões rapidamente.", dimension: "D", reverse: false },
  { questionNumber: 3, questionText: "Sinto-me confortável em posições de liderança.", dimension: "D", reverse: false },
  { questionNumber: 4, questionText: "Gosto de desafios competitivos.", dimension: "D", reverse: false },
  { questionNumber: 5, questionText: "Prefiro dar instruções a recebê-las.", dimension: "D", reverse: false },
  { questionNumber: 6, questionText: "Sou direto ao expressar minhas opiniões.", dimension: "D", reverse: false },
  { questionNumber: 7, questionText: "Busco resultados rápidos e tangíveis.", dimension: "D", reverse: false },
  { questionNumber: 8, questionText: "Não tenho medo de confrontos quando necessário.", dimension: "D", reverse: false },
  { questionNumber: 9, questionText: "Gosto de estar no comando de projetos.", dimension: "D", reverse: false },
  { questionNumber: 10, questionText: "Prefiro agir do que esperar.", dimension: "D", reverse: false },
  
  // Dimensão: Influência (I) - Questões 11-20
  { questionNumber: 11, questionText: "Gosto de conhecer novas pessoas.", dimension: "I", reverse: false },
  { questionNumber: 12, questionText: "Sou entusiasmado ao apresentar ideias.", dimension: "I", reverse: false },
  { questionNumber: 13, questionText: "Prefiro trabalhar em equipe.", dimension: "I", reverse: false },
  { questionNumber: 14, questionText: "Sou otimista sobre o futuro.", dimension: "I", reverse: false },
  { questionNumber: 15, questionText: "Gosto de motivar outras pessoas.", dimension: "I", reverse: false },
  { questionNumber: 16, questionText: "Sou expressivo com minhas emoções.", dimension: "I", reverse: false },
  { questionNumber: 17, questionText: "Prefiro ambientes de trabalho dinâmicos.", dimension: "I", reverse: false },
  { questionNumber: 18, questionText: "Gosto de ser reconhecido pelo meu trabalho.", dimension: "I", reverse: false },
  { questionNumber: 19, questionText: "Sou persuasivo em minhas comunicações.", dimension: "I", reverse: false },
  { questionNumber: 20, questionText: "Prefiro variedade nas minhas atividades.", dimension: "I", reverse: false },
  
  // Dimensão: Estabilidade (S) - Questões 21-30
  { questionNumber: 21, questionText: "Valorizo a estabilidade no trabalho.", dimension: "S", reverse: false },
  { questionNumber: 22, questionText: "Sou paciente com os outros.", dimension: "S", reverse: false },
  { questionNumber: 23, questionText: "Prefiro rotinas estabelecidas.", dimension: "S", reverse: false },
  { questionNumber: 24, questionText: "Sou leal às pessoas e organizações.", dimension: "S", reverse: false },
  { questionNumber: 25, questionText: "Gosto de ajudar os outros.", dimension: "S", reverse: false },
  { questionNumber: 26, questionText: "Prefiro mudanças graduais.", dimension: "S", reverse: false },
  { questionNumber: 27, questionText: "Sou bom ouvinte.", dimension: "S", reverse: false },
  { questionNumber: 28, questionText: "Valorizo relacionamentos de longo prazo.", dimension: "S", reverse: false },
  { questionNumber: 29, questionText: "Prefiro ambientes de trabalho calmos.", dimension: "S", reverse: false },
  { questionNumber: 30, questionText: "Sou confiável e consistente.", dimension: "S", reverse: false },
  
  // Dimensão: Conformidade (C) - Questões 31-40
  { questionNumber: 31, questionText: "Valorizo precisão e qualidade.", dimension: "C", reverse: false },
  { questionNumber: 32, questionText: "Gosto de analisar dados antes de decidir.", dimension: "C", reverse: false },
  { questionNumber: 33, questionText: "Prefiro seguir procedimentos estabelecidos.", dimension: "C", reverse: false },
  { questionNumber: 34, questionText: "Sou detalhista no meu trabalho.", dimension: "C", reverse: false },
  { questionNumber: 35, questionText: "Valorizo a lógica e a razão.", dimension: "C", reverse: false },
  { questionNumber: 36, questionText: "Prefiro trabalhar com fatos concretos.", dimension: "C", reverse: false },
  { questionNumber: 37, questionText: "Sou organizado e metódico.", dimension: "C", reverse: false },
  { questionNumber: 38, questionText: "Gosto de planejar antes de agir.", dimension: "C", reverse: false },
  { questionNumber: 39, questionText: "Valorizo a expertise técnica.", dimension: "C", reverse: false },
  { questionNumber: 40, questionText: "Prefiro evitar erros a correr riscos.", dimension: "C", reverse: false },
  
  // Dimensão: Assertividade (A) - Questões 41-50
  { questionNumber: 41, questionText: "Expresso minhas necessidades claramente.", dimension: "A", reverse: false },
  { questionNumber: 42, questionText: "Defendo meus direitos quando necessário.", dimension: "A", reverse: false },
  { questionNumber: 43, questionText: "Sei dizer não quando preciso.", dimension: "A", reverse: false },
  { questionNumber: 44, questionText: "Comunico minhas expectativas aos outros.", dimension: "A", reverse: false },
  { questionNumber: 45, questionText: "Peço ajuda quando necessário.", dimension: "A", reverse: false },
  { questionNumber: 46, questionText: "Dou feedback honesto aos outros.", dimension: "A", reverse: false },
  { questionNumber: 47, questionText: "Negocio para alcançar meus objetivos.", dimension: "A", reverse: false },
  { questionNumber: 48, questionText: "Estabeleço limites claros com os outros.", dimension: "A", reverse: false },
  { questionNumber: 49, questionText: "Falo sobre problemas antes que piorem.", dimension: "A", reverse: false },
  { questionNumber: 50, questionText: "Aceito críticas construtivas.", dimension: "A", reverse: false },
  
  // Dimensão: Empatia (E) - Questões 51-60
  { questionNumber: 51, questionText: "Percebo facilmente como os outros se sentem.", dimension: "E", reverse: false },
  { questionNumber: 52, questionText: "Me preocupo com o bem-estar dos outros.", dimension: "E", reverse: false },
  { questionNumber: 53, questionText: "Sou sensível às necessidades alheias.", dimension: "E", reverse: false },
  { questionNumber: 54, questionText: "Consigo me colocar no lugar do outro.", dimension: "E", reverse: false },
  { questionNumber: 55, questionText: "Ofereço apoio emocional aos colegas.", dimension: "E", reverse: false },
  { questionNumber: 56, questionText: "Percebo quando alguém está desconfortável.", dimension: "E", reverse: false },
  { questionNumber: 57, questionText: "Adapto minha comunicação ao interlocutor.", dimension: "E", reverse: false },
  { questionNumber: 58, questionText: "Valorizo a harmonia nas relações.", dimension: "E", reverse: false },
  { questionNumber: 59, questionText: "Sou compreensivo com os erros dos outros.", dimension: "E", reverse: false },
  { questionNumber: 60, questionText: "Busco entender diferentes perspectivas.", dimension: "E", reverse: false },
];

async function seedPIRQuestions() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Iniciando inserção das questões PIR...');
    
    // Verificar se já existem questões PIR
    const [existing] = await connection.execute(
      "SELECT COUNT(*) as count FROM testQuestions WHERE testType = 'pir'"
    );
    
    if (existing[0].count > 0) {
      console.log(`Já existem ${existing[0].count} questões PIR. Pulando inserção.`);
      return;
    }
    
    // Inserir questões
    for (const question of PIR_QUESTIONS) {
      await connection.execute(
        `INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) 
         VALUES (?, ?, ?, ?, ?)`,
        ['pir', question.questionNumber, question.questionText, question.dimension, question.reverse]
      );
    }
    
    console.log(`${PIR_QUESTIONS.length} questões PIR inseridas com sucesso!`);
    
  } catch (error) {
    console.error('Erro ao inserir questões:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedPIRQuestions();
