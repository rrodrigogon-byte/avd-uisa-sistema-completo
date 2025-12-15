import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🌱 IMPORTAÇÃO FINAL - Dados UISA\n');

const connection = await mysql.createConnection(DATABASE_URL);
const funcData = JSON.parse(fs.readFileSync('/tmp/uisa-funcionarios.json', 'utf-8'));

console.log(`📊 Total: ${funcData.length} funcionários\n`);

// ==================== PASSO 1: DEPARTAMENTOS ====================
console.log('1️⃣ Criando departamentos...');
const departamentosUnicos = [...new Set(funcData.map(f => f['SEÇÃO']).filter(Boolean))];
console.log(`   ${departamentosUnicos.length} departamentos únicos encontrados`);

for (const nome of departamentosUnicos) {
  const code = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  try {
    await connection.execute(
      `INSERT IGNORE INTO departments (code, name, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`,
      [code, nome]
    );
  } catch (err) {
    // Ignorar erros de duplicação
  }
}

// Buscar todos os departamentos do banco
const [allDepts] = await connection.execute('SELECT id, name FROM departments');
const departmentMap = new Map(allDepts.map(d => [d.name, d.id]));
console.log(`✅ ${departmentMap.size} departamentos no banco\n`);

// ==================== PASSO 2: POSIÇÕES (CARGOS) ====================
console.log('2️⃣ Criando posições (cargos)...');
const cargosUnicos = [...new Set(funcData.map(f => f['CARGO']).filter(Boolean))];
console.log(`   ${cargosUnicos.length} cargos únicos encontrados`);

// Mapear cargo → departamento (usar primeiro departamento onde aparece)
const cargoToDept = new Map();
for (const func of funcData) {
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  if (cargo && secao && !cargoToDept.has(cargo)) {
    cargoToDept.set(cargo, secao);
  }
}

for (const cargo of cargosUnicos) {
  const secao = cargoToDept.get(cargo);
  const deptId = departmentMap.get(secao) || allDepts[0].id; // Fallback para primeiro departamento
  
  // Gerar código único para o cargo
  const code = cargo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  try {
    await connection.execute(
      `INSERT IGNORE INTO positions (code, title, departmentId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
      [code, cargo, deptId]
    );
  } catch (err) {
    // Ignorar erros de duplicação
  }
}

// Buscar todas as posições do banco
const [allPos] = await connection.execute('SELECT id, title FROM positions');
const positionMap = new Map(allPos.map(p => [p.title, p.id]));
console.log(`✅ ${positionMap.size} posições no banco\n`);

// ==================== PASSO 3: FUNCIONÁRIOS ====================
console.log('3️⃣ Importando funcionários...');
let empCount = 0;
let skipped = 0;
let errors = [];

for (let i = 0; i < funcData.length; i++) {
  const func = funcData[i];
  const nome = func['NOME'];
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  const chapa = func['CHAPA'];
  const emailCorp = func['EMAIL CORPORATIVO'];
  const emailPessoal = func['EMAILPESSOAL'] || func['EMAIL PESSOAL'];
  const email = emailCorp || emailPessoal || `${chapa}@uisa.com.br`;
  
  if (!nome || !secao || !cargo || !chapa) {
    skipped++;
    continue;
  }
  
  const departmentId = departmentMap.get(secao);
  const positionId = positionMap.get(cargo);
  
  if (!departmentId || !positionId) {
    skipped++;
    if (errors.length < 10) {
      errors.push(`${nome}: dept=${departmentId} pos=${positionId}`);
    }
    continue;
  }
  
  try {
    await connection.execute(
      `INSERT IGNORE INTO employees (employeeCode, name, email, departmentId, positionId, hireDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [chapa, nome, email, departmentId, positionId]
    );
    empCount++;
    
    if (empCount % 100 === 0) {
      process.stdout.write(`\r   Importados: ${empCount}/${funcData.length}`);
    }
  } catch (err) {
    skipped++;
    if (errors.length < 10) {
      errors.push(`${nome}: ${err.message}`);
    }
  }
}

console.log(`\n✅ ${empCount} funcionários importados`);
console.log(`⚠️  ${skipped} registros ignorados\n`);

if (errors.length > 0) {
  console.log('❌ Primeiros erros:');
  errors.forEach(e => console.log(`   - ${e}`));
  console.log('');
}

// ==================== ESTATÍSTICAS ====================
console.log('📊 ESTATÍSTICAS FINAIS:');
console.log('═'.repeat(70));

const [deptStats] = await connection.execute('SELECT COUNT(*) as total FROM departments');
const [empStats] = await connection.execute('SELECT COUNT(*) as total FROM employees');
const [posStats] = await connection.execute('SELECT COUNT(*) as total FROM positions');

console.log(`✅ Departamentos: ${deptStats[0].total}`);
console.log(`✅ Funcionários: ${empStats[0].total}`);
console.log(`✅ Posições: ${posStats[0].total}\n`);

// Top 15 departamentos
console.log('📈 TOP 15 DEPARTAMENTOS:');
const [topDepts] = await connection.execute(`
  SELECT d.name, COUNT(e.id) as total
  FROM departments d
  LEFT JOIN employees e ON e.departmentId = d.id
  GROUP BY d.id
  ORDER BY total DESC
  LIMIT 15
`);

topDepts.forEach((dept, i) => {
  const name = dept.name.substring(0, 50).padEnd(50);
  console.log(`${String(i+1).padStart(2)}. ${name} ${dept.total} funcionários`);
});

console.log('');

// Top 15 cargos
console.log('💼 TOP 15 CARGOS:');
const [topPos] = await connection.execute(`
  SELECT p.title, COUNT(e.id) as total
  FROM positions p
  LEFT JOIN employees e ON e.positionId = p.id
  GROUP BY p.id
  ORDER BY total DESC
  LIMIT 15
`);

topPos.forEach((pos, i) => {
  const title = pos.title.substring(0, 50).padEnd(50);
  console.log(`${String(i+1).padStart(2)}. ${title} ${pos.total} funcionários`);
});

await connection.end();
console.log('\n✅ IMPORTAÇÃO COMPLETA!\n');
