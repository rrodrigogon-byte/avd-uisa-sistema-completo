#!/usr/bin/env node
/**
 * Script para executar importação de funcionários
 * Usa os dados processados do import-data.json
 */

import fs from 'fs';
import { getDb } from './server/db.js';
import { employees, users } from './drizzle/schema.js';
import { eq, and, ne } from 'drizzle-orm';
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
  
  // Diretores e Presidente são admin
  if (cargoLower.includes("diretor") || cargoLower.includes("presidente") || cargoLower.includes("ceo")) {
    return "admin";
  }
  
  // Gerentes e Coordenadores são gestores
  if (cargoLower.includes("gerente") || cargoLower.includes("coordenador")) {
    return "gestor";
  }
  
  // Supervisores e Líderes são gestores
  if (cargoLower.includes("supervisor") || cargoLower.includes("lider")) {
    return "gestor";
  }
  
  // Especialistas são colaboradores com privilégios
  if (cargoLower.includes("especialista")) {
    return "colaborador";
  }
  
  return "colaborador";
}

async function main() {
  console.log("=== Importação de Funcionários ===\n");
  
  // Ler dados processados
  const data = JSON.parse(fs.readFileSync('./import-data.json', 'utf-8'));
  
  console.log(`Total de funcionários a importar: ${data.employees.length}`);
  console.log(`Total de usuários de liderança a criar: ${data.users.length}\n`);
  
  const database = await getDb();
  if (!database) {
    console.error("Erro: Banco de dados não disponível");
    process.exit(1);
  }
  
  // Passo 1: Limpar usuários não-admin
  console.log("Passo 1: Limpando usuários não-admin...");
  try {
    await database.delete(users).where(ne(users.role, "admin"));
    console.log("✓ Usuários não-admin removidos\n");
  } catch (error) {
    console.error("Erro ao limpar usuários:", error);
  }
  
  // Passo 2: Importar funcionários
  console.log("Passo 2: Importando funcionários...");
  let imported = 0;
  let updated = 0;
  let errors = 0;
  
  for (const emp of data.employees) {
    try {
      // Verificar se funcionário já existe
      const existing = await database
        .select()
        .from(employees)
        .where(eq(employees.employeeCode, emp.employeeCode))
        .limit(1);
      
      if (existing.length > 0) {
        // Atualizar funcionário existente
        await database
          .update(employees)
          .set({
            name: emp.name,
            email: emp.email,
            personalEmail: emp.personalEmail,
            corporateEmail: emp.corporateEmail,
            chapa: emp.chapa,
            codSecao: emp.codSecao,
            secao: emp.secao,
            codFuncao: emp.codFuncao,
            funcao: emp.funcao,
            situacao: emp.situacao,
            gerencia: emp.gerencia,
            diretoria: emp.diretoria,
            cargo: emp.cargo,
            telefone: emp.telefone,
            active: emp.active,
            status: emp.status,
            updatedAt: new Date(),
          })
          .where(eq(employees.employeeCode, emp.employeeCode));
        
        updated++;
      } else {
        // Inserir novo funcionário
        await database.insert(employees).values({
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          personalEmail: emp.personalEmail,
          corporateEmail: emp.corporateEmail,
          chapa: emp.chapa,
          codSecao: emp.codSecao,
          secao: emp.secao,
          codFuncao: emp.codFuncao,
          funcao: emp.funcao,
          situacao: emp.situacao,
          gerencia: emp.gerencia,
          diretoria: emp.diretoria,
          cargo: emp.cargo,
          telefone: emp.telefone,
          active: emp.active,
          status: emp.status,
        });
        
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
  const leadershipEmployees = await database
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.active, true),
        eq(employees.status, "ativo")
      )
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
      const [newUser] = await database.insert(users).values({
        openId,
        name: emp.name,
        email: emp.email,
        role,
        loginMethod: "password",
      });
      
      // Atualizar funcionário com userId
      await database
        .update(employees)
        .set({
          userId: newUser.insertId,
          passwordHash,
        })
        .where(eq(employees.id, emp.id));
      
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
  
  process.exit(0);
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
