import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

console.log('🌱 Iniciando seed dos dados UISA...\n');

// Conectar ao banco
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Ler dados processados
const secoesData = JSON.parse(fs.readFileSync('/tmp/uisa-secoes.json', 'utf-8'));
const funcData = JSON.parse(fs.readFileSync('/tmp/uisa-funcionarios.json', 'utf-8'));

console.log(`📊 Dados carregados:`);
console.log(`- Seções: ${secoesData.length}`);
console.log(`- Funcionários: ${funcData.length}\n`);

// 1. Importar departamentos
console.log('1️⃣ Importando departamentos...');
const departmentMap = new Map();
let deptCount = 0;

for (const secao of secoesData) {
  const nome = secao['Descrição'] || secao['DESCRIÇÃO'] || secao['descricao'];
  if (!nome) continue;
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO departments (name, createdAt, updatedAt) VALUES (?, NOW(), NOW()) 
       ON DUPLICATE KEY UPDATE name=name`,
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

console.log(`✅ ${deptCount} departamentos processados\n`);

// 2. Importar funcionários
console.log('2️⃣ Importando funcionários...');
let empCount = 0;
let skipped = 0;

for (const func of funcData.slice(0, 100)) { // Importar primeiros 100 para teste
  const nome = func['NOME'];
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  const chapa = func['CHAPA'];
  const email = func['EMAIL CORPORATIVO'] || func['EMAILPESSOAL'] || `${chapa}@uisa.com.br`;
  
  if (!nome || !cargo) {
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
       ON DUPLICATE KEY UPDATE name=name`,
      [nome, email, departmentId]
    );
    empCount++;
    
    if (empCount % 10 === 0) {
      process.stdout.write(`\r   Importados: ${empCount}/${funcData.length}`);
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

// 3. Criar cargos/posições
console.log('3️⃣ Criando posições (cargos únicos)...');
const cargosUnicos = [...new Set(funcData.map(f => f['CARGO']).filter(Boolean))];
let posCount = 0;

for (const cargo of cargosUnicos.slice(0, 50)) { // Primeiros 50 cargos
  try {
    await connection.execute(
      `INSERT INTO positions (title, departmentId, createdAt, updatedAt)
       VALUES (?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE title=title`,
      [cargo]
    );
    posCount++;
  } catch (err) {
    // Ignorar duplicados
  }
}

console.log(`✅ ${posCount} posições criadas\n`);

// 4. Estatísticas finais
console.log('📊 Estatísticas Finais:');
const [deptStats] = await connection.execute('SELECT COUNT(*) as total FROM departments');
const [empStats] = await connection.execute('SELECT COUNT(*) as total FROM employees');
const [posStats] = await connection.execute('SELECT COUNT(*) as total FROM positions');

console.log(`- Departamentos no banco: ${deptStats[0].total}`);
console.log(`- Funcionários no banco: ${empStats[0].total}`);
console.log(`- Posições no banco: ${posStats[0].total}`);

await connection.end();
console.log('\n✅ Seed concluído com sucesso!');
