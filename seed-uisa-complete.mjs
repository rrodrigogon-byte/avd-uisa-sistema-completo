import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🌱 SEED COMPLETO - Importação de Dados UISA\n');

const connection = await mysql.createConnection(DATABASE_URL);
const funcData = JSON.parse(fs.readFileSync('/tmp/uisa-funcionarios.json', 'utf-8'));

console.log(`📊 Total: ${funcData.length} funcionários\n`);

// ==================== PASSO 1: DEPARTAMENTOS ====================
console.log('1️⃣ Criando departamentos...');
const departamentosUnicos = [...new Set(funcData.map(f => f['SEÇÃO']).filter(Boolean))];
const departmentMap = new Map();

for (const nome of departamentosUnicos) {
  const code = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO departments (code, name, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`,
      [code, nome]
    );
    departmentMap.set(nome, result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [rows] = await connection.execute('SELECT id FROM departments WHERE name = ?', [nome]);
      if (rows.length > 0) departmentMap.set(nome, rows[0].id);
    }
  }
}

// Recarregar todos do banco
const [allDepts] = await connection.execute('SELECT id, name FROM departments');
for (const dept of allDepts) {
  departmentMap.set(dept.name, dept.id);
}

console.log(`✅ ${departmentMap.size} departamentos mapeados\n`);

// ==================== PASSO 2: POSIÇÕES (CARGOS) ====================
console.log('2️⃣ Criando posições (cargos)...');
const cargosUnicos = [...new Set(funcData.map(f => f['CARGO']).filter(Boolean))];
const positionMap = new Map();

// Mapear cargo → departamento (primeiro departamento onde aparece)
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
  const deptId = departmentMap.get(secao) || 1;
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO positions (title, departmentId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`,
      [cargo, deptId]
    );
    positionMap.set(cargo, result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [rows] = await connection.execute('SELECT id FROM positions WHERE title = ?', [cargo]);
      if (rows.length > 0) positionMap.set(cargo, rows[0].id);
    }
  }
}

// Recarregar todas do banco
const [allPos] = await connection.execute('SELECT id, title FROM positions');
for (const pos of allPos) {
  positionMap.set(pos.title, pos.id);
}

console.log(`✅ ${positionMap.size} posições mapeadas\n`);

// ==================== PASSO 3: FUNCIONÁRIOS ====================
console.log('3️⃣ Importando funcionários...');
let empCount = 0;
let skipped = 0;

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
    continue;
  }
  
  try {
    await connection.execute(
      `INSERT INTO employees (employeeCode, name, email, departmentId, positionId, hireDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [chapa, nome, email, departmentId, positionId]
    );
    empCount++;
    
    if (empCount % 100 === 0) {
      process.stdout.write(`\r   Importados: ${empCount}/${funcData.length}`);
    }
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      if (empCount < 5) console.log(`\n   ERRO: ${err.message}`);
    }
    skipped++;
  }
}

console.log(`\n✅ ${empCount} funcionários importados`);
console.log(`⚠️  ${skipped} registros ignorados\n`);

// ==================== ESTATÍSTICAS ====================
console.log('📊 ESTATÍSTICAS FINAIS:');
console.log('═'.repeat(60));

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

await connection.end();
console.log('\n✅ IMPORTAÇÃO COMPLETA!\n');
