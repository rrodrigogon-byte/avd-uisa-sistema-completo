/**
 * Script de Importação de Funcionários do Excel
 * Importa 3.116 funcionários do arquivo Funcionarios.xlsx
 */

import mysql from "mysql2/promise";
import XLSX from "xlsx";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

// Conectar ao banco
const connection = await mysql.createConnection(DATABASE_URL);

// Ler arquivo Excel
console.log("📂 Lendo arquivo Excel...");
const workbook = XLSX.readFile("/home/ubuntu/upload/Funcionarios.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Encontrados ${data.length} funcionários no arquivo`);

// Mapear departamentos e cargos únicos
const uniqueDepartments = new Map();
const uniquePositions = new Map();

for (const row of data) {
  if (row.SEÇÃO) {
    uniqueDepartments.set(row.SEÇÃO, {
      name: row.SEÇÃO,
      code: row.CODSEÇÃO || null,
      gerencia: row.GERENCIA || null,
      diretoria: row.DIRETORIA || null,
    });
  }
  
  if (row.CARGO) {
    uniquePositions.set(row.CARGO, {
      title: row.CARGO,
      funcao: row.FUNÇÃO || null,
      codfuncao: row.CODFUNÇÃO || null,
    });
  }
}

console.log(`📊 Departamentos únicos: ${uniqueDepartments.size}`);
console.log(`📊 Cargos únicos: ${uniquePositions.size}`);

// Criar/buscar departamentos
console.log("\n🏢 Processando departamentos...");
const departmentMap = new Map();

for (const [name, data] of uniqueDepartments.entries()) {
  try {
    // Verificar se departamento já existe
    const [existing] = await connection.execute(
      "SELECT id FROM departments WHERE name = ? LIMIT 1",
      [name]
    );
    
    if (existing.length > 0) {
      departmentMap.set(name, existing[0].id);
    } else {
      // Criar novo departamento
      const description = `${data.gerencia || ""} - ${data.diretoria || ""}`.trim();
      const [result] = await connection.execute(
        "INSERT INTO departments (name, description, active, createdAt, updatedAt) VALUES (?, ?, 1, NOW(), NOW())",
        [data.name, description]
      );
      
      departmentMap.set(name, result.insertId);
      console.log(`  ✅ Criado: ${name}`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar departamento ${name}:`, error.message);
  }
}

// Criar/buscar cargos
console.log("\n💼 Processando cargos...");
const positionMap = new Map();

for (const [title, data] of uniquePositions.entries()) {
  try {
    // Verificar se cargo já existe
    const [existing] = await connection.execute(
      "SELECT id FROM positions WHERE title = ? LIMIT 1",
      [title]
    );
    
    if (existing.length > 0) {
      positionMap.set(title, existing[0].id);
    } else {
      // Criar novo cargo
      const [result] = await connection.execute(
        "INSERT INTO positions (title, description, level, active, createdAt, updatedAt) VALUES (?, ?, 'operacional', 1, NOW(), NOW())",
        [data.title, data.funcao]
      );
      
      positionMap.set(title, result.insertId);
      console.log(`  ✅ Criado: ${title}`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar cargo ${title}:`, error.message);
  }
}

// Importar funcionários
console.log("\n👥 Importando funcionários...");
let imported = 0;
let updated = 0;
let errors = 0;

for (const row of data) {
  try {
    const chapa = String(row.CHAPA || "").trim();
    
    if (!chapa) {
      console.log(`  ⚠️  Pulando registro sem CHAPA`);
      continue;
    }
    
    // Buscar IDs de departamento e cargo
    const departmentId = row.SEÇÃO ? departmentMap.get(row.SEÇÃO) : null;
    const positionId = row.CARGO ? positionMap.get(row.CARGO) : null;
    
    // Determinar status (usar campo active ao invés de status)
    const active = row.SITUAÇÃO === "Ativo" ? 1 : 0;
    
    // Preparar dados do funcionário
    const employeeCode = chapa; // Usar CHAPA como employeeCode
    const name = row.NOME || "Sem Nome";
    const email = row.EMAILCORPORATIVO || row.EMAILPESSOAL || null;
    const corporateEmail = row.EMAILCORPORATIVO || null;
    const personalEmail = row.EMAILPESSOAL || null;
    const phone = row.TELEFONE ? String(row.TELEFONE) : null;
    const codSecao = row.CODSEÇÃO || null;
    const secao = row.SEÇÃO || null;
    const codFuncao = row.CODFUNÇÃO ? String(row.CODFUNÇÃO) : null;
    const funcao = row.FUNÇÃO || null;
    const situacao = row.SITUAÇÃO || null;
    const gerencia = row.GERENCIA || null;
    const diretoria = row.DIRETORIA || null;
    const cargo = row.CARGO || null;
    
    // Verificar se funcionário já existe
    const [existing] = await connection.execute(
      "SELECT id FROM employees WHERE chapa = ? LIMIT 1",
      [chapa]
    );
    
    if (existing.length > 0) {
      // Atualizar funcionário existente
      await connection.execute(
        `UPDATE employees 
         SET name = ?, email = ?, corporateEmail = ?, personalEmail = ?, phone = ?, 
             departmentId = ?, positionId = ?, active = ?, 
             codSecao = ?, secao = ?, codFuncao = ?, funcao = ?, situacao = ?, 
             gerencia = ?, diretoria = ?, cargo = ?, 
             updatedAt = NOW()
         WHERE chapa = ?`,
        [name, email, corporateEmail, personalEmail, phone, departmentId, positionId, active,
         codSecao, secao, codFuncao, funcao, situacao, gerencia, diretoria, cargo, chapa]
      );
      
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`  📝 Atualizados: ${updated}`);
      }
    } else {
      // Criar novo funcionário
      await connection.execute(
        `INSERT INTO employees 
         (employeeCode, chapa, name, email, corporateEmail, personalEmail, phone, 
          departmentId, positionId, active, 
          codSecao, secao, codFuncao, funcao, situacao, gerencia, diretoria, cargo, 
          createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [employeeCode, chapa, name, email, corporateEmail, personalEmail, phone, 
         departmentId, positionId, active, 
         codSecao, secao, codFuncao, funcao, situacao, gerencia, diretoria, cargo]
      );
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`  ✅ Importados: ${imported}`);
      }
    }
  } catch (error) {
    errors++;
    console.error(`  ❌ Erro ao processar ${row.NOME}:`, error.message);
  }
}

await connection.end();

console.log("\n" + "=".repeat(60));
console.log("📊 RESUMO DA IMPORTAÇÃO");
console.log("=".repeat(60));
console.log(`✅ Funcionários importados: ${imported}`);
console.log(`📝 Funcionários atualizados: ${updated}`);
console.log(`❌ Erros: ${errors}`);
console.log(`📊 Total processado: ${imported + updated}`);
console.log(`🏢 Departamentos criados: ${departmentMap.size}`);
console.log(`💼 Cargos criados: ${positionMap.size}`);
console.log("=".repeat(60));

process.exit(0);
