import { drizzle } from 'drizzle-orm/mysql2';
import { psychometricTests } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const results = await db
  .select()
  .from(psychometricTests)
  .where(sql`testType = 'pir'`)
  .limit(5);

console.log('PIR tests in psychometricTests table:', results.length);
console.log('');

results.forEach((r, index) => {
  console.log(`Test ${index + 1}:`);
  console.log('  ID:', r.id);
  console.log('  Employee ID:', r.employeeId);
  console.log('  Test Type:', r.testType);
  console.log('  Completed At:', r.completedAt);
  console.log('  Profile:', r.profile ? 'YES' : 'NO');
  console.log('');
});

process.exit(0);
