#!/usr/bin/env node
/**
 * Script de Importação de Funcionários do Excel
 * Importa dados do arquivo Funcionariosdiferentededemitido(D)(1).xlsx
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, or } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  employees,
  departments,
  positions,
} from "../drizzle/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco de dados
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Mapeamento de situações para status
const situacaoToStatus = {
  "Ativo": "ativo",
  "Ferias": "ativo",
  "Licenca Mater.": "afastado",
  "Af.Previdencia": "afastado",
  "Af.Ac.Trabalho": "afastado",
  "Apos. por Incapacidade Permanente": "desligado",
  "Admissao prox.mes": "ativo",
  "Aviso Previo": "desligado",
  "Prisão / Cárcere": "afastado",
  "Contrato de Trabalho Suspenso": "afastado",
};

// Mapeamento de cargos para níveis hierárquicos
const cargoToHierarchy = {
  "Diretor": "diretoria",
  "Diretor Presidente": "diretoria",
  "Diretor Agroindustrial": "diretoria",
  "Diretor Comercial": "diretoria",
  "Presidente": "diretoria",
  "Conselheiro": "diretoria",
  "Gerente": "gerencia",
  "Gerente Exec": "gerencia",
  "Coordenador": "coordenacao",
  "Supervisor": "supervisao",
  "Lider": "supervisao",
  // Todos os outros são operacionais
};

function normalizePhone(phone) {
  if (!phone) return null;
  // Remove tudo que não é número
  const cleaned = String(phone).replace(/\D/g, "");
  // Formata para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

function normalizeEmail(email) {
  if (!email) return null;
  return String(email).toLowerCase().trim();
}

function getHierarchyLevel(cargo) {
  if (!cargo) return "operacional";
  
  for (const [key, level] of Object.entries(cargoToHierarchy)) {
    if (cargo.includes(key)) {
      return level;
    }
  }
  return "operacional";
}

async function getOrCreateDepartment(name, diretoria) {
  if (!name) {
    name = "Sem Departamento";
  }
  
  // Buscar departamento existente
  const existing = await db
    .select()
    .from(departments)
    .where(eq(departments.name, name))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Criar novo departamento
  const result = await db.insert(departments).values({
    name: name,
    code: name.substring(0, 20).toUpperCase().replace(/\s/g, "_"),
    description: diretoria || null,
    active: true,
  });
  
  return result[0].insertId;
}

async function getOrCreatePosition(cargo, funcao) {
  if (!cargo) {
    cargo = "Sem Cargo";
  }
  
  // Buscar cargo existente
  const existing = await db
    .select()
    .from(positions)
    .where(eq(positions.name, cargo))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Criar novo cargo
  const result = await db.insert(positions).values({
    name: cargo,
    code: cargo.substring(0, 20).toUpperCase().replace(/\s/g, "_"),
    description: funcao || null,
    active: true,
  });
  
  return result[0].insertId;
}

async function importEmployees(filePath) {
  console.log("📂 Lendo arquivo Excel...");
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`📊 Total de registros: ${data.length}`);
  
  const stats = {
    total: data.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    byStatus: {},
    byDepartment: {},
    byCargo: {},
  };
  
  // Cache de departamentos e cargos
  const departmentCache = new Map();
  const positionCache = new Map();
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Validar dados obrigatórios
      if (!row.NOME || !row.Matricula) {
        console.log(`⚠️  Linha ${i + 2}: Nome ou matrícula ausente, pulando...`);
        stats.skipped++;
        continue;
      }
      
      // Obter ou criar departamento
      const deptKey = row.SEÇÃO || "Sem Departamento";
      let departmentId;
      if (departmentCache.has(deptKey)) {
        departmentId = departmentCache.get(deptKey);
      } else {
        departmentId = await getOrCreateDepartment(row.SEÇÃO, row.DIRETORIA);
        departmentCache.set(deptKey, departmentId);
      }
      
      // Obter ou criar cargo
      const posKey = row.CARGO || "Sem Cargo";
      let positionId;
      if (positionCache.has(posKey)) {
        positionId = positionCache.get(posKey);
      } else {
        positionId = await getOrCreatePosition(row.CARGO, row.FUNÇÃO);
        positionCache.set(posKey, positionId);
      }
      
      // Determinar status
      const situacao = row.SITUAÇÃO || "Ativo";
      const status = situacaoToStatus[situacao] || "ativo";
      
      // Determinar hierarquia
      const hierarchyLevel = getHierarchyLevel(row.CARGO);
      
      // Normalizar dados
      const employeeCode = String(row.Matricula).padStart(7, "0");
      const email = normalizeEmail(row.EMAILCORPORATIVO || row.EMAILPESSOAL || `${employeeCode}@uisa.com.br`);
      const phone = normalizePhone(row.TELEFONE);
      
      // Preparar dados do funcionário
      const employeeData = {
        employeeCode: employeeCode,
        name: row.NOME,
        email: email,
        phone: phone,
        departmentId: departmentId,
        positionId: positionId,
        status: status,
        hierarchyLevel: hierarchyLevel,
        hireDate: new Date(), // Não temos data de admissão no Excel
        active: status === "ativo",
        costCenter: row.GERENCIA || null,
      };
      
      // Verificar se funcionário já existe
      const existing = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeCode, employeeCode))
        .limit(1);
      
      if (existing.length > 0) {
        // Atualizar funcionário existente
        await db
          .update(employees)
          .set({
            ...employeeData,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, existing[0].id));
        
        stats.updated++;
        console.log(`✅ Atualizado: ${row.NOME} (${employeeCode})`);
      } else {
        // Inserir novo funcionário
        await db.insert(employees).values(employeeData);
        stats.imported++;
        console.log(`➕ Importado: ${row.NOME} (${employeeCode})`);
      }
      
      // Estatísticas
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      stats.byDepartment[deptKey] = (stats.byDepartment[deptKey] || 0) + 1;
      stats.byCargo[posKey] = (stats.byCargo[posKey] || 0) + 1;
      
    } catch (error) {
      console.error(`❌ Erro na linha ${i + 2}:`, error.message);
      stats.errors++;
    }
    
    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`📈 Progresso: ${i + 1}/${data.length} (${((i + 1) / data.length * 100).toFixed(1)}%)`);
    }
  }
  
  // Relatório final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RELATÓRIO DE IMPORTAÇÃO");
  console.log("=".repeat(60));
  console.log(`Total de registros: ${stats.total}`);
  console.log(`✅ Importados: ${stats.imported}`);
  console.log(`🔄 Atualizados: ${stats.updated}`);
  console.log(`⚠️  Pulados: ${stats.skipped}`);
  console.log(`❌ Erros: ${stats.errors}`);
  console.log("\n📊 Por Status:");
  for (const [status, count] of Object.entries(stats.byStatus)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log("\n📊 Top 10 Departamentos:");
  const topDepts = Object.entries(stats.byDepartment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [dept, count] of topDepts) {
    console.log(`  ${dept}: ${count}`);
  }
  console.log("\n📊 Top 10 Cargos:");
  const topCargos = Object.entries(stats.byCargo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [cargo, count] of topCargos) {
    console.log(`  ${cargo}: ${count}`);
  }
  console.log("=".repeat(60));
  
  return stats;
}

// Executar importação
const excelPath = join(__dirname, "../../upload/Funcionariosdiferentededemitido(D)(1).xlsx");

try {
  const stats = await importEmployees(excelPath);
  console.log("\n✅ Importação concluída com sucesso!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Erro durante importação:", error);
  process.exit(1);
} finally {
  await connection.end();
}
