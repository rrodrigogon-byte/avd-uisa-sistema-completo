import { drizzle } from 'drizzle-orm/mysql2';
import { testResults } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const results = await db
  .select()
  .from(testResults)
  .where(sql`testType = 'pir' AND completedAt IS NOT NULL`)
  .limit(3);

console.log('Total PIR tests found:', results.length);
console.log('\n=== PIR Test Data ===\n');

results.forEach((result, index) => {
  console.log(`Test ${index + 1}:`);
  console.log('  ID:', result.id);
  console.log('  Employee ID:', result.employeeId);
  console.log('  Test Type:', result.testType);
  console.log('  Completed At:', result.completedAt);
  console.log('  Has Scores:', !!result.scores);
  console.log('  Scores length:', result.scores ? result.scores.length : 0);
  console.log('  Profile Type:', result.profileType);
  console.log('  Profile Description:', result.profileDescription ? result.profileDescription.substring(0, 100) : null);
  
  if (result.scores) {
    try {
      const parsed = JSON.parse(result.scores);
      console.log('  Parsed Scores:', Object.keys(parsed));
    } catch (e) {
      console.log('  Scores parse error:', e.message);
    }
  }
  console.log('');
});

process.exit(0);
