import { drizzle } from 'drizzle-orm/mysql2';
import { employees } from './drizzle/schema.ts';
import fs from 'fs';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function importEmployees() {
  console.log('🚀 Iniciando importação de funcionários...\n');
  
  // Ler dados do JSON
  const data = JSON.parse(fs.readFileSync('/home/ubuntu/employees_seed_data.json', 'utf-8'));
  console.log(`📊 Total de funcionários a importar: ${data.length}\n`);
  
  // Limpar tabela de funcionários (remover fictícios)
  console.log('🗑️  Limpando funcionários fictícios...');
  await db.delete(employees);
  console.log('✅ Funcionários fictícios removidos\n');
  
  // Importar em lotes de 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      await db.insert(employees).values(batch);
      imported += batch.length;
      console.log(`✅ Importados ${imported}/${data.length} funcionários...`);
    } catch (error) {
      console.error(`❌ Erro ao importar lote ${i}-${i + batchSize}:`, error.message);
      errors += batch.length;
    }
  }
  
  console.log('\n📈 Resumo da importação:');
  console.log(`  ✅ Importados com sucesso: ${imported}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📊 Total: ${data.length}`);
  
  // Verificar importação
  const count = await db.select({ count: sql`count(*)` }).from(employees);
  console.log(`\n✅ Total de funcionários no banco: ${count[0].count}`);
  
  console.log('\n🎉 Importação concluída!');
}

importEmployees().catch(console.error);
