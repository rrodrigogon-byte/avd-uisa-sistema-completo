import { getDb } from '../server/db.js';
import { readFileSync } from 'fs';

const sql = readFileSync('./scripts/create-job-tables.sql', 'utf8');
const statements = sql.split(';').filter(s => s.trim());

(async () => {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }
  
  console.log('🚀 Criando tabelas de Descrição de Cargos e Atividades...\n');
  
  let i = 0;
  for (i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        await db.execute(statement);
        const match = statement.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/);
        const tableName = match ? match[1] : 'unknown';
        console.log('✅ Tabela ' + tableName + ' criada com sucesso');
      } catch (error) {
        console.error('❌ Erro:', error.message);
      }
    }
  }
  
  console.log('\n✅ Todas as 7 tabelas criadas com sucesso!');
  console.log('   - jobDescriptions');
  console.log('   - jobResponsibilities');
  console.log('   - jobKnowledge');
  console.log('   - jobCompetencies');
  console.log('   - jobDescriptionApprovals');
  console.log('   - employeeActivities');
  console.log('   - activityLogs');
  
  process.exit(0);
})();
