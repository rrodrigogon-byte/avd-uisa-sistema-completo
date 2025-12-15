import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const testQuestions = [
  // DISC - Dominância (D)
  { testType: 'disc', questionNumber: 1, questionText: 'Eu gosto de assumir o controle em situações desafiadoras', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 2, questionText: 'Prefiro tomar decisões rápidas e assertivas', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 3, questionText: 'Sou competitivo e gosto de vencer', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 4, questionText: 'Enfrento problemas de frente sem hesitar', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 5, questionText: 'Gosto de desafios e situações de alta pressão', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 6, questionText: 'Sou direto ao expressar minhas opiniões', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 7, questionText: 'Prefiro liderar do que seguir', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 8, questionText: 'Tomo iniciativa facilmente', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 9, questionText: 'Gosto de definir metas ambiciosas', dimension: 'dominance', reverse: false },
  { testType: 'disc', questionNumber: 10, questionText: 'Sou determinado em alcançar resultados', dimension: 'dominance', reverse: false },
  
  // DISC - Influência (I)
  { testType: 'disc', questionNumber: 11, questionText: 'Gosto de conhecer pessoas novas', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 12, questionText: 'Sou entusiasta e otimista', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 13, questionText: 'Prefiro trabalhar em equipe', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 14, questionText: 'Sou bom em persuadir outras pessoas', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 15, questionText: 'Gosto de ser o centro das atenções', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 16, questionText: 'Sou comunicativo e expressivo', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 17, questionText: 'Gosto de motivar e inspirar outros', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 18, questionText: 'Prefiro ambientes sociais e dinâmicos', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 19, questionText: 'Sou criativo em resolver problemas', dimension: 'influence', reverse: false },
  { testType: 'disc', questionNumber: 20, questionText: 'Gosto de compartilhar ideias e experiências', dimension: 'influence', reverse: false },
  
  // DISC - Estabilidade (S)
  { testType: 'disc', questionNumber: 21, questionText: 'Prefiro rotinas e processos previsíveis', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 22, questionText: 'Sou paciente e calmo sob pressão', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 23, questionText: 'Valorizo harmonia e cooperação', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 24, questionText: 'Sou leal e confiável', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 25, questionText: 'Prefiro mudanças graduais a mudanças abruptas', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 26, questionText: 'Sou um bom ouvinte', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 27, questionText: 'Gosto de ajudar e apoiar outras pessoas', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 28, questionText: 'Prefiro ambientes estáveis e seguros', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 29, questionText: 'Sou consistente em meu trabalho', dimension: 'steadiness', reverse: false },
  { testType: 'disc', questionNumber: 30, questionText: 'Valorizo relacionamentos de longo prazo', dimension: 'steadiness', reverse: false },
  
  // DISC - Conformidade (C)
  { testType: 'disc', questionNumber: 31, questionText: 'Sou detalhista e preciso', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 32, questionText: 'Prefiro seguir regras e procedimentos', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 33, questionText: 'Gosto de analisar dados e informações', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 34, questionText: 'Sou organizado e metódico', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 35, questionText: 'Valorizo qualidade acima de velocidade', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 36, questionText: 'Prefiro ter todas as informações antes de decidir', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 37, questionText: 'Sou cuidadoso e evito erros', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 38, questionText: 'Gosto de trabalhar com padrões e normas', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 39, questionText: 'Sou sistemático em minha abordagem', dimension: 'compliance', reverse: false },
  { testType: 'disc', questionNumber: 40, questionText: 'Valorizo precisão e exatidão', dimension: 'compliance', reverse: false },
];

console.log('Inserindo perguntas dos testes psicométricos...');

for (const question of testQuestions) {
  await connection.execute(
    'INSERT INTO testQuestions (testType, questionNumber, questionText, dimension, reverse) VALUES (?, ?, ?, ?, ?)',
    [question.testType, question.questionNumber, question.questionText, question.dimension, question.reverse]
  );
}

console.log(`✅ ${testQuestions.length} perguntas DISC inseridas com sucesso!`);

await connection.end();
