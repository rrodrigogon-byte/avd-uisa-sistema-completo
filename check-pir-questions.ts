import { getDb } from './server/db';
import { testQuestions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkPIRQuestions() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    process.exit(1);
  }

  const pirQuestions = await db.select().from(testQuestions).where(eq(testQuestions.testType, 'pir'));
  console.log('Total de questões PIR cadastradas:', pirQuestions.length);

  if (pirQuestions.length > 0) {
    console.log('\nPrimeira questão:', pirQuestions[0]);
    console.log('\nDimensões encontradas:', [...new Set(pirQuestions.map(q => q.dimension))]);
    console.log('\nDistribuição por dimensão:');
    const dimensionCounts: Record<string, number> = {};
    pirQuestions.forEach(q => {
      dimensionCounts[q.dimension || 'null'] = (dimensionCounts[q.dimension || 'null'] || 0) + 1;
    });
    console.log(dimensionCounts);
  } else {
    console.log('❌ Nenhuma questão PIR encontrada no banco de dados!');
    console.log('Isso explica por que o teste não está funcionando.');
  }
}

checkPIRQuestions();
