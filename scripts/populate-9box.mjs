import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Iniciando cálculo de Performance e Potencial para Matriz 9-Box...\n');

const [activeCycle] = await connection.execute(
  'SELECT id FROM evaluationCycles WHERE status = "em_andamento" LIMIT 1'
);

if (!activeCycle || activeCycle.length === 0) {
  console.log('❌ Nenhum ciclo de avaliação ativo encontrado!');
  await connection.end();
  process.exit(1);
}

const cycleId = activeCycle[0].id;
console.log(`✅ Ciclo de avaliação ativo: ${cycleId}\n`);

const [employees] = await connection.execute('SELECT id, name FROM employees');
console.log(`📊 Total de colaboradores: ${employees.length}\n`);

let processedCount = 0;
let insertedCount = 0;

for (const employee of employees) {
  try {
    // Cálculo simplificado: performance e potencial baseados em competências
    const [competencies] = await connection.execute(
      `SELECT AVG(currentLevel) as avgLevel, COUNT(*) as total 
       FROM employeeCompetencies 
       WHERE employeeId = ?`,
      [employee.id]
    );
    
    const avgLevel = competencies[0]?.avgLevel || 0;
    const compCount = competencies[0]?.total || 0;
    
    // Performance: 1-3 baseado no nível médio de competências
    let performance = 2; // Médio por padrão
    if (avgLevel >= 4) performance = 3; // Alto
    else if (avgLevel <= 2) performance = 1; // Baixo
    
    // Potencial: 1-3 baseado na quantidade de competências avaliadas
    let potential = 2; // Médio por padrão
    if (compCount >= 6) potential = 3; // Alto
    else if (compCount <= 2) potential = 1; // Baixo
    
    // Determinar box
    const boxMap = {
      '1-1': 'baixo_desempenho_baixo_potencial',
      '2-1': 'medio_desempenho_baixo_potencial',
      '3-1': 'alto_desempenho_baixo_potencial',
      '1-2': 'baixo_desempenho_medio_potencial',
      '2-2': 'medio_desempenho_medio_potencial',
      '3-2': 'alto_desempenho_medio_potencial',
      '1-3': 'baixo_desempenho_alto_potencial',
      '2-3': 'medio_desempenho_alto_potencial',
      '3-3': 'alto_desempenho_alto_potencial',
    };
    
    const box = boxMap[`${performance}-${potential}`];
    
    // Verificar se já existe
    const [existing] = await connection.execute(
      'SELECT id FROM nineBoxPositions WHERE employeeId = ? AND cycleId = ?',
      [employee.id, cycleId]
    );
    
    if (existing && existing.length > 0) {
      await connection.execute(
        `UPDATE nineBoxPositions 
         SET performance = ?, potential = ?, box = ?, calibrated = false
         WHERE employeeId = ? AND cycleId = ?`,
        [performance, potential, box, employee.id, cycleId]
      );
    } else {
      await connection.execute(
        `INSERT INTO nineBoxPositions 
         (employeeId, cycleId, performance, potential, box, calibrated) 
         VALUES (?, ?, ?, ?, ?, false)`,
        [employee.id, cycleId, performance, potential, box]
      );
      insertedCount++;
    }
    
    processedCount++;
    
    if (processedCount % 500 === 0) {
      console.log(`⏳ Processados: ${processedCount}/${employees.length} colaboradores...`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${employee.name}: ${error.message}`);
  }
}

console.log(`\n✅ Processamento concluído!`);
console.log(`📊 Total processado: ${processedCount} colaboradores`);
console.log(`➕ Novos registros: ${insertedCount}`);

// Estatísticas
const [stats] = await connection.execute(
  `SELECT 
    box,
    COUNT(*) as total
   FROM nineBoxPositions 
   WHERE cycleId = ?
   GROUP BY box
   ORDER BY performance DESC, potential DESC`,
  [cycleId]
);

console.log(`\n📈 Distribuição na Matriz 9-Box:\n`);
stats.forEach(stat => {
  console.log(`  ${stat.box.padEnd(45)} ${String(stat.total).padStart(5)} colaboradores`);
});

await connection.end();
console.log(`\n🎉 Matriz 9-Box populada com sucesso!`);
