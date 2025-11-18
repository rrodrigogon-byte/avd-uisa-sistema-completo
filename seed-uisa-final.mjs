import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

console.log('🌱 SEED FINAL - Importação Completa de Dados UISA\n');

// Conectar ao banco
const connection = await mysql.createConnection(DATABASE_URL);

// Ler dados processados
const funcData = JSON.parse(fs.readFileSync('/tmp/uisa-funcionarios.json', 'utf-8'));

console.log(`📊 Total de funcionários a processar: ${funcData.length}\n`);

// PASSO 1: Criar TODOS os departamentos únicos
console.log('1️⃣ Criando departamentos...');
const departamentosUnicos = [...new Set(funcData.map(f => f['SEÇÃO']).filter(Boolean))];
console.log(`   ${departamentosUnicos.length} departamentos únicos encontrados`);

const departmentMap = new Map();

for (let i = 0; i < departamentosUnicos.length; i++) {
  const nome = departamentosUnicos[i];
  
  // Gerar código (slug) a partir do nome
  const code = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens do início/fim
    .substring(0, 50); // Limita a 50 caracteres
  
  try {
    // Inserir departamento
    const [insertResult] = await connection.execute(
      `INSERT INTO departments (code, name, createdAt, updatedAt) 
       VALUES (?, ?, NOW(), NOW())`,
      [code, nome]
    );
    
    const deptId = insertResult.insertId;
    departmentMap.set(nome, deptId);
    
    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\r   Criados: ${i + 1}/${departamentosUnicos.length}`);
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      // Departamento já existe, buscar ID
      const [rows] = await connection.execute(
        `SELECT id FROM departments WHERE name = ? LIMIT 1`,
        [nome]
      );
      if (rows.length > 0) {
        departmentMap.set(nome, rows[0].id);
      }
    } else {
      console.error(`\n❌ Erro ao criar departamento "${nome}":`, err.message);
    }
  }
}

console.log(`\n✅ ${departmentMap.size} departamentos criados\n`);

// PASSO 1.5: Buscar TODOS os departamentos do banco para popular o map
console.log('1️⃣.5️⃣ Carregando departamentos do banco...');
const [allDepts] = await connection.execute('SELECT id, name FROM departments');
for (const dept of allDepts) {
  departmentMap.set(dept.name, dept.id);
}
console.log(`✅ ${departmentMap.size} departamentos mapeados\n`);

// PASSO 2: Importar TODOS os funcionários
console.log('2️⃣ Importando funcionários...');
let empCount = 0;
let skipped = 0;
let errors = [];

// Debug: mostrar primeiros 5 funcionários
if (funcData.length > 0) {
  console.log('\n   DEBUG - Primeiros 3 funcionários:');
  for (let j = 0; j < Math.min(3, funcData.length); j++) {
    const f = funcData[j];
    console.log(`   ${j+1}. ${f['NOME']} | ${f['SEÇÃO']} | ${f['CHAPA']}`);
  }
  console.log('');
}

for (let i = 0; i < funcData.length; i++) {
  const func = funcData[i];
  const nome = func['NOME'];
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  const chapa = func['CHAPA'];
  const emailPessoal = func['EMAILPESSOAL'] || func['EMAIL PESSOAL'];
  const emailCorp = func['EMAIL CORPORATIVO'];
  const email = emailCorp || emailPessoal || `${chapa}@uisa.com.br`;
  
  // Debug primeiro funcionário
  if (i === 0) {
    console.log('   DEBUG - Processando primeiro funcionário:');
    console.log(`     nome: "${nome}" (${nome ? 'OK' : 'VAZIO'})`);
    console.log(`     secao: "${secao}" (${secao ? 'OK' : 'VAZIO'})`);
    console.log(`     chapa: "${chapa}"`);
    const deptId = departmentMap.get(secao);
    console.log(`     departmentId: ${deptId} (${deptId ? 'ENCONTRADO' : 'NÃO ENCONTRADO'})`);
    console.log('');
  }
  
  if (!nome || !secao) {
    if (i < 5) console.log(`   SKIP ${i}: nome ou seção vazio`);
    skipped++;
    continue;
  }
  
  const departmentId = departmentMap.get(secao);
  
  if (!departmentId) {
    if (i < 5) console.log(`   SKIP ${i}: departamento não encontrado`);
    errors.push(`Departamento "${secao}" não encontrado para ${nome}`);
    skipped++;
    continue;
  }
  
  try {
    await connection.execute(
      `INSERT INTO employees (employeeCode, name, email, departmentId, hireDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [chapa, nome, email, departmentId]
    );
    empCount++;
    
    if ((empCount) % 100 === 0) {
      process.stdout.write(`\r   Importados: ${empCount}/${funcData.length}`);
    }
  } catch (err) {
    if (i < 5) console.log(`   ERRO ${i}: ${err.code} - ${err.message}`);
    if (err.code === 'ER_DUP_ENTRY') {
      skipped++;
    } else {
      errors.push(`Erro ao inserir ${nome}: ${err.message}`);
      skipped++;
    }
  }
}

console.log(`\n✅ ${empCount} funcionários importados`);
console.log(`⚠️  ${skipped} registros ignorados`);
if (errors.length > 0 && errors.length <= 10) {
  console.log('\n⚠️  Erros:');
  errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
}
console.log();

// PASSO 3: Criar posições (cargos únicos)
console.log('3️⃣ Criando posições (cargos)...');
const cargosUnicos = [...new Set(funcData.map(f => f['CARGO']).filter(Boolean))];
console.log(`   ${cargosUnicos.length} cargos únicos encontrados`);

// Mapear cargo → departamento (primeiro departamento onde aparece)
const cargoToDept = new Map();
for (const func of funcData) {
  const cargo = func['CARGO'];
  const secao = func['SEÇÃO'];
  if (cargo && secao && !cargoToDept.has(cargo)) {
    cargoToDept.set(cargo, secao);
  }
}

let posCount = 0;

for (let i = 0; i < cargosUnicos.length; i++) {
  const cargo = cargosUnicos[i];
  const secao = cargoToDept.get(cargo);
  const deptId = departmentMap.get(secao) || 1;
  
  try {
    await connection.execute(
      `INSERT INTO positions (title, departmentId, createdAt, updatedAt)
       VALUES (?, ?, NOW(), NOW())`,
      [cargo, deptId]
    );
    posCount++;
    
    if ((posCount) % 50 === 0) {
      process.stdout.write(`\r   Criadas: ${posCount}/${cargosUnicos.length}`);
    }
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      // Ignorar duplicados silenciosamente
    }
  }
}

console.log(`\n✅ ${posCount} posições criadas\n`);

// PASSO 4: Estatísticas finais
console.log('📊 ESTATÍSTICAS FINAIS:');
console.log('═'.repeat(60));

const [deptStats] = await connection.execute('SELECT COUNT(*) as total FROM departments');
const [empStats] = await connection.execute('SELECT COUNT(*) as total FROM employees');
const [posStats] = await connection.execute('SELECT COUNT(*) as total FROM positions');

console.log(`✅ Departamentos no banco: ${deptStats[0].total}`);
console.log(`✅ Funcionários no banco: ${empStats[0].total}`);
console.log(`✅ Posições no banco: ${posStats[0].total}`);

// Top 15 departamentos
console.log('\n📈 TOP 15 DEPARTAMENTOS (por número de funcionários):');
const [topDepts] = await connection.execute(`
  SELECT d.name, COUNT(e.id) as total
  FROM departments d
  LEFT JOIN employees e ON e.departmentId = d.id
  GROUP BY d.id
  ORDER BY total DESC
  LIMIT 15
`);

topDepts.forEach((dept, i) => {
  console.log(`${String(i+1).padStart(2)}. ${dept.name.padEnd(50)} ${dept.total} funcionários`);
});

// Top 15 cargos
console.log('\n💼 TOP 15 CARGOS:');
const [topCargos] = await connection.execute(`
  SELECT title, COUNT(*) as total
  FROM positions
  GROUP BY title
  ORDER BY total DESC
  LIMIT 15
`);

topCargos.forEach((cargo, i) => {
  console.log(`${String(i+1).padStart(2)}. ${cargo.title}`);
});

await connection.end();
console.log('\n✅ SEED COMPLETO! Dados UISA importados com sucesso!\n');
