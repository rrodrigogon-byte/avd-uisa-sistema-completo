#!/usr/bin/env node
/**
 * Script para executar importação de funcionários usando SQL direto
 */

import fs from 'fs';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Cargos que devem ter usuários criados automaticamente
const LEADERSHIP_ROLES = [
  'Lider',
  'Supervisor',
  'Coordenador',
  'Gerente',
  'Gerente Exec',
  'Diretor',
  'Diretor Agroindustrial',
  'CEO',
  'Presidente',
  'Especialista'
];

/**
 * Gera uma senha aleatória segura
 */
function generatePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Gera hash de senha usando SHA-256
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Determina o role baseado no cargo
 */
function determineRole(cargo) {
  if (!cargo) return "colaborador";
  
  const cargoLower = cargo.toLowerCase();
  
  if (cargoLower.includes("diretor") || cargoLower.includes("presidente") || cargoLower.includes("ceo")) {
    return "admin";
  }
  
  if (cargoLower.includes("gerente") || cargoLower.includes("coordenador")) {
    return "gestor";
  }
  
  if (cargoLower.includes("supervisor") || cargoLower.includes("lider")) {
    return "gestor";
  }
  
  return "colaborador";
}

async function main() {
  console.log("=== Importação de Funcionários ===\n");
  
  // Ler dados processados
  const data = JSON.parse(fs.readFileSync('./import-data.json', 'utf-8'));
  
  console.log(`Total de funcionários a importar: ${data.employees.length}`);
  console.log(`Total de usuários de liderança a criar: ${data.users.length}\n`);
  
  // Conectar ao banco de dados
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Passo 1: Limpar usuários não-admin
    console.log("Passo 1: Limpando usuários não-admin...");
    const [deleteResult] = await connection.execute(
      "DELETE FROM users WHERE role != 'admin'"
    );
    console.log(`✓ ${deleteResult.affectedRows} usuários não-admin removidos\n`);
    
    // Passo 2: Importar funcionários
    console.log("Passo 2: Importando funcionários...");
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    for (const emp of data.employees) {
      try {
        // Verificar se funcionário já existe
        const [existing] = await connection.execute(
          "SELECT id FROM employees WHERE employeeCode = ?",
          [emp.employeeCode]
        );
        
        if (existing.length > 0) {
          // Atualizar funcionário existente
          await connection.execute(
            `UPDATE employees SET 
              name = ?, email = ?, personalEmail = ?, corporateEmail = ?,
              chapa = ?, codSecao = ?, secao = ?, codFuncao = ?, funcao = ?,
              situacao = ?, gerencia = ?, diretoria = ?, cargo = ?, telefone = ?,
              active = ?, status = ?, updatedAt = NOW()
            WHERE employeeCode = ?`,
            [
              emp.name, emp.email, emp.personalEmail, emp.corporateEmail,
              emp.chapa, emp.codSecao, emp.secao, emp.codFuncao, emp.funcao,
              emp.situacao, emp.gerencia, emp.diretoria, emp.cargo, emp.telefone,
              emp.active, emp.status, emp.employeeCode
            ]
          );
          updated++;
        } else {
          // Inserir novo funcionário
          await connection.execute(
            `INSERT INTO employees (
              employeeCode, name, email, personalEmail, corporateEmail,
              chapa, codSecao, secao, codFuncao, funcao,
              situacao, gerencia, diretoria, cargo, telefone,
              active, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              emp.employeeCode, emp.name, emp.email, emp.personalEmail, emp.corporateEmail,
              emp.chapa, emp.codSecao, emp.secao, emp.codFuncao, emp.funcao,
              emp.situacao, emp.gerencia, emp.diretoria, emp.cargo, emp.telefone,
              emp.active, emp.status
            ]
          );
          imported++;
        }
        
        if ((imported + updated) % 100 === 0) {
          console.log(`  Processados: ${imported + updated}/${data.employees.length}`);
        }
      } catch (error) {
        console.error(`Erro ao importar funcionário ${emp.employeeCode}:`, error.message);
        errors++;
      }
    }
    
    console.log(`✓ Funcionários importados: ${imported}`);
    console.log(`✓ Funcionários atualizados: ${updated}`);
    if (errors > 0) {
      console.log(`✗ Erros: ${errors}`);
    }
    console.log();
    
    // Passo 3: Criar usuários para cargos de liderança
    console.log("Passo 3: Criando usuários para cargos de liderança...");
    
    // Buscar funcionários com cargos de liderança
    const [leadershipEmployees] = await connection.execute(
      "SELECT * FROM employees WHERE active = 1 AND status = 'ativo'"
    );
    
    const usersCreated = [];
    let created = 0;
    let skipped = 0;
    let userErrors = 0;
    
    for (const emp of leadershipEmployees) {
      // Verificar se é cargo de liderança
      if (!emp.cargo || !LEADERSHIP_ROLES.includes(emp.cargo)) {
        continue;
      }
      
      // Verificar se já tem usuário vinculado
      if (emp.userId) {
        skipped++;
        continue;
      }
      
      // Verificar se tem email
      if (!emp.email) {
        console.warn(`  Funcionário ${emp.employeeCode} (${emp.name}) não tem email`);
        userErrors++;
        continue;
      }
      
      try {
        // Gerar username e senha
        const nameParts = emp.name.split(" ");
        const firstName = nameParts[0]?.toLowerCase() || "user";
        const lastName = nameParts[1]?.toLowerCase() || emp.employeeCode;
        const username = `${firstName}.${lastName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const password = generatePassword();
        const passwordHash = hashPassword(password);
        
        // Determinar role baseado no cargo
        const role = determineRole(emp.cargo);
        
        // Criar usuário com openId único (usando employeeCode)
        const openId = `employee_${emp.employeeCode}`;
        
        // Inserir usuário
        const [userResult] = await connection.execute(
          `INSERT INTO users (openId, name, email, role, loginMethod, lastSignedIn)
           VALUES (?, ?, ?, ?, 'password', NOW())`,
          [openId, emp.name, emp.email, role]
        );
        
        const userId = userResult.insertId;
        
        // Atualizar funcionário com userId e passwordHash
        await connection.execute(
          "UPDATE employees SET userId = ?, passwordHash = ? WHERE id = ?",
          [userId, passwordHash, emp.id]
        );
        
        usersCreated.push({
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          username,
          password,
          role,
          cargo: emp.cargo,
        });
        
        created++;
        
        if (created % 10 === 0) {
          console.log(`  Criados: ${created}`);
        }
      } catch (error) {
        console.error(`Erro ao criar usuário para ${emp.employeeCode}:`, error.message);
        userErrors++;
      }
    }
    
    console.log(`✓ Usuários criados: ${created}`);
    console.log(`✓ Usuários já existentes: ${skipped}`);
    if (userErrors > 0) {
      console.log(`✗ Erros: ${userErrors}`);
    }
    console.log();
    
    // Salvar credenciais em arquivo
    if (usersCreated.length > 0) {
      const credentialsFile = './users-credentials.json';
      fs.writeFileSync(credentialsFile, JSON.stringify(usersCreated, null, 2));
      console.log(`✓ Credenciais salvas em: ${credentialsFile}`);
      console.log();
    }
    
    // Resumo final
    console.log("=== Resumo da Importação ===");
    console.log(`Funcionários importados: ${imported}`);
    console.log(`Funcionários atualizados: ${updated}`);
    console.log(`Usuários criados: ${created}`);
    console.log(`Total de erros: ${errors + userErrors}`);
    console.log();
    
    console.log("✓ Importação concluída!");
    
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
