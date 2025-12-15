import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

console.log('🌱 Iniciando seed dos dados UISA (v2 - criação dinâmica)...\n');

// Conectar ao banco
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Ler dados processados
const funcData = JSON.parse(fs.readFileSync('/tmp/uisa-funcionarios.json', 'utf-8'));

console.log(`📊 Dados carregados: ${funcData.length} funcionários\n`);

// 1. Extrair departamentos únicos dos funcionários
console.log('1️⃣ Extraindo departamentos únicos...');
const departamentosUnicos = [...new Set(funcData.map(f => f['SEÇÃO']).filter(Boolean))];
console.log(`✅ ${departamentosUnicos.length} departamentos únicos encontrados\n`);

// 2. Criar departamentos
console.log('2️⃣ Criando departamentos...');
const departmentMap = new Map();
let deptCount = 0;

for (const nome of departamentosUnicos) {
  try {
    await connection.execute(
      `INSERT INTO departments (name, createdAt, updatedAt) VALUES (?, NOW(), NOW()) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      [nome]
    );
    
    // Buscar ID do departamento
    const [rows] = await connection.execute(
      `SELECT id FROM departments WHERE name = ? LIMIT 1`,
      [nome]
    );
    
    if (rows.length > 0) {
      departmentMap.set(nome, rows[0].id);
      deptCount++;
    }
  } catch (err) {
    console.error(`Erro ao inserir departamento "${nome}":`, err.message);
  }
}

console.log(`✅ ${deptCount} departamentos criados/atualizados\n`);

// 3. Importar funcionários (primeiros 500 para teste)
console.log('3️⃣ Importando funcionários (primeiros 500)...');
let empCount = 0;
let skipped = 0;

for (const func of funcData.slice(0, 500)) {
  const nome = func['NOME'];
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  const chapa = func['CHAPA'];
  const email = func['EMAIL CORPORATIVO'] || func['EMAILPESSOAL'] || `${chapa}@uisa.com.br`;
  
  if (!nome || !secao) {
    skipped++;
    continue;
  }
  
  const departmentId = departmentMap.get(secao);
  
  if (!departmentId) {
    console.log(`⚠️  Departamento "${secao}" não encontrado para ${nome}`);
    skipped++;
    continue;
  }
  
  try {
    await connection.execute(
      `INSERT INTO employees (name, email, departmentId, hireDate, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [nome, email, departmentId]
    );
    empCount++;
    
    if (empCount % 50 === 0) {
      process.stdout.write(`\r   Importados: ${empCount}/500`);
    }
  } catch (err) {
    if (!err.message.includes('Duplicate entry')) {
      console.error(`\nErro ao inserir funcionário "${nome}":`, err.message);
    }
    skipped++;
  }
}

console.log(`\n✅ ${empCount} funcionários importados`);
console.log(`⚠️  ${skipped} registros ignorados\n`);

// 4. Criar posições (cargos únicos) - primeiros 100
console.log('4️⃣ Criando posições (cargos únicos)...');
const cargosUnicos = [...new Set(funcData.map(f => f['CARGO']).filter(Boolean))];
let posCount = 0;

// Agrupar funcionários por cargo para pegar departamento correto
const cargoToDept = new Map();
for (const func of funcData) {
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  if (cargo && secao && !cargoToDept.has(cargo)) {
    cargoToDept.set(cargo, secao);
  }
}

for (const cargo of cargosUnicos.slice(0, 100)) {
  const secao = cargoToDept.get(cargo);
  const deptId = departmentMap.get(secao) || 1;
  
  try {
    await connection.execute(
      `INSERT INTO positions (title, departmentId, createdAt, updatedAt)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE title=VALUES(title)`,
      [cargo, deptId]
    );
    posCount++;
  } catch (err) {
    // Ignorar duplicados
  }
}

console.log(`✅ ${posCount} posições criadas\n`);

// 5. Estatísticas finais
console.log('📊 Estatísticas Finais:');
const [deptStats] = await connection.execute('SELECT COUNT(*) as total FROM departments');
const [empStats] = await connection.execute('SELECT COUNT(*) as total FROM employees');
const [posStats] = await connection.execute('SELECT COUNT(*) as total FROM positions');

console.log(`- Departamentos no banco: ${deptStats[0].total}`);
console.log(`- Funcionários no banco: ${empStats[0].total}`);
console.log(`- Posições no banco: ${posStats[0].total}`);

// Top 10 departamentos com mais funcionários
console.log('\n📈 Top 10 Departamentos:');
const [topDepts] = await connection.execute(`
  SELECT d.name, COUNT(e.id) as total
  FROM departments d
  LEFT JOIN employees e ON e.departmentId = d.id
  GROUP BY d.id
  ORDER BY total DESC
  LIMIT 10
`);

topDepts.forEach((dept, i) => {
  console.log(`${i+1}. ${dept.name}: ${dept.total} funcionários`);
});

await connection.end();
console.log('\n✅ Seed concluído com sucesso!');
