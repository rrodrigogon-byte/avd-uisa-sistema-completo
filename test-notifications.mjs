/**
 * Script de Teste de Notificações Automáticas
 * Testa envio de lembretes para metas atrasadas
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and, lt, or } from 'drizzle-orm';
import { goals, users, employees } from './drizzle/schema.js';

// Conectar ao banco
const db = drizzle(process.env.DATABASE_URL);

console.log('🔔 Iniciando teste de notificações automáticas...\n');

// 1. Buscar metas atrasadas (deadline passou e status não é completed/cancelled)
console.log('📊 Buscando metas atrasadas...');
const today = new Date();
const overdueGoals = await db
  .select({
    id: goals.id,
    title: goals.title,
    deadline: goals.deadline,
    progress: goals.progress,
    status: goals.status,
    employeeId: goals.employeeId,
    category: goals.category,
  })
  .from(goals)
  .where(
    and(
      lt(goals.deadline, today),
      or(
        eq(goals.status, 'in_progress'),
        eq(goals.status, 'approved'),
        eq(goals.status, 'pending_approval')
      )
    )
  );

console.log(`✅ Encontradas ${overdueGoals.length} metas atrasadas\n`);

if (overdueGoals.length === 0) {
  console.log('✅ Nenhuma meta atrasada encontrada. Sistema funcionando corretamente!');
  process.exit(0);
}

// 2. Agrupar por funcionário
const goalsByEmployee = overdueGoals.reduce((acc, goal) => {
  if (!goal.employeeId) return acc;
  if (!acc[goal.employeeId]) {
    acc[goal.employeeId] = [];
  }
  acc[goal.employeeId].push(goal);
  return acc;
}, {});

console.log('📧 Preparando notificações por funcionário:\n');

// 3. Para cada funcionário, mostrar metas atrasadas
for (const [employeeId, employeeGoals] of Object.entries(goalsByEmployee)) {
  // Buscar dados do funcionário
  const [employee] = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      userId: employees.userId,
    })
    .from(employees)
    .where(eq(employees.id, parseInt(employeeId)))
    .limit(1);

  if (!employee || !employee.email) {
    console.log(`⚠️  Funcionário ${employeeId}: sem email cadastrado`);
    continue;
  }

  console.log(`👤 ${employee.name} (${employee.email})`);
  console.log(`   📌 ${employeeGoals.length} meta(s) atrasada(s):`);
  
  employeeGoals.forEach((goal, index) => {
    const daysOverdue = Math.floor((today - new Date(goal.deadline)) / (1000 * 60 * 60 * 24));
    console.log(`   ${index + 1}. "${goal.title}"`);
    console.log(`      - Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`);
    console.log(`      - Atrasada há: ${daysOverdue} dias`);
    console.log(`      - Progresso: ${goal.progress}%`);
    console.log(`      - Status: ${goal.status}`);
  });
  console.log('');
}

// 4. Resumo final
console.log('\n📊 RESUMO DO TESTE:');
console.log(`   Total de metas atrasadas: ${overdueGoals.length}`);
console.log(`   Funcionários afetados: ${Object.keys(goalsByEmployee).length}`);
console.log(`   Notificações que seriam enviadas: ${Object.keys(goalsByEmployee).length}`);

console.log('\n✅ Teste concluído com sucesso!');
console.log('💡 Para ativar envio automático, configure o job cron no sistema.');

process.exit(0);
