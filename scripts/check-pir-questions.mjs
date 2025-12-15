import mysql from 'mysql2/promise';

async function checkQuestions() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Verificar dimensões e contagem de questões
    const [dimensions] = await connection.execute(`
      SELECT d.id, d.code, d.name, COUNT(q.id) as question_count 
      FROM pirIntegrityDimensions d 
      LEFT JOIN pirIntegrityQuestions q ON d.id = q.dimensionId AND q.active = 1
      GROUP BY d.id, d.code, d.name 
      ORDER BY d.displayOrder
    `);
    
    console.log('\n=== Dimensões PIR Integridade ===\n');
    console.log('ID\tCódigo\tNome\t\t\t\tQuestões');
    console.log('-'.repeat(60));
    
    let totalQuestions = 0;
    for (const dim of dimensions) {
      totalQuestions += Number(dim.question_count);
      const name = dim.name.padEnd(30);
      console.log(`${dim.id}\t${dim.code}\t${name}\t${dim.question_count}`);
    }
    
    console.log('-'.repeat(60));
    console.log(`Total de questões: ${totalQuestions}`);
    console.log(`Meta: 60 questões (10 por dimensão)`);
    console.log(`Faltam: ${Math.max(0, 60 - totalQuestions)} questões\n`);
    
    // Verificar questões existentes por dimensão
    const [questions] = await connection.execute(`
      SELECT q.id, q.dimensionId, d.code as dimensionCode, q.title, q.questionType
      FROM pirIntegrityQuestions q
      JOIN pirIntegrityDimensions d ON q.dimensionId = d.id
      WHERE q.active = 1
      ORDER BY q.dimensionId, q.displayOrder
    `);
    
    console.log('\n=== Questões Existentes ===\n');
    let currentDim = null;
    for (const q of questions) {
      if (currentDim !== q.dimensionCode) {
        currentDim = q.dimensionCode;
        console.log(`\n--- ${q.dimensionCode} ---`);
      }
      console.log(`  [${q.id}] ${q.title.substring(0, 60)}...`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkQuestions();
