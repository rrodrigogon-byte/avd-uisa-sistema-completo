#!/usr/bin/env tsx
/**
 * Script de Importação de Funcionários do Excel (SQL Direto)
 * Importa dados do arquivo Funcionariosdiferentededemitido(D)(1).xlsx
 * 
 * Uso: pnpm tsx scripts/import_employees_sql.ts
 */

import mysql from "mysql2/promise";
import XLSX from "xlsx";
import { join } from "path";

// Configuração do banco de dados
const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Mapeamento de situações para status
const situacaoToStatus: Record<string, "ativo" | "afastado" | "desligado"> = {
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
const cargoToHierarchy: Record<string, "diretoria" | "gerencia" | "coordenacao" | "supervisao" | "operacional"> = {
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
};

function normalizePhone(phone: any): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

function normalizeEmail(email: any): string | null {
  if (!email) return null;
  return String(email).toLowerCase().trim();
}

function getHierarchyLevel(cargo: string): "diretoria" | "gerencia" | "coordenacao" | "supervisao" | "operacional" {
  if (!cargo) return "operacional";
  
  for (const [key, level] of Object.entries(cargoToHierarchy)) {
    if (cargo.includes(key)) {
      return level;
    }
  }
  return "operacional";
}

async function getOrCreateDepartment(name: string, diretoria?: string): Promise<number> {
  if (!name) {
    name = "Sem Departamento";
  }
  
  const [rows]: any = await connection.execute(
    "SELECT id FROM departments WHERE name = ? LIMIT 1",
    [name]
  );
  
  if (rows.length > 0) {
    return rows[0].id;
  }
  
  const code = name.substring(0, 20).toUpperCase().replace(/\s/g, "_");
  const [result]: any = await connection.execute(
    "INSERT INTO departments (code, name, description, active, createdAt, updatedAt) VALUES (?, ?, ?, 1, NOW(), NOW())",
    [code, name, diretoria || null]
  );
  
  return result.insertId;
}

async function getOrCreatePosition(cargo: string, funcao?: string): Promise<number> {
  if (!cargo) {
    cargo = "Sem Cargo";
  }
  
  const [rows]: any = await connection.execute(
    "SELECT id FROM positions WHERE title = ? LIMIT 1",
    [cargo]
  );
  
  if (rows.length > 0) {
    return rows[0].id;
  }
  
  const code = cargo.substring(0, 20).toUpperCase().replace(/\s/g, "_");
  const [result]: any = await connection.execute(
    "INSERT INTO positions (code, title, description, active, createdAt, updatedAt) VALUES (?, ?, ?, 1, NOW(), NOW())",
    [code, cargo, funcao || null]
  );
  
  return result.insertId;
}

interface ExcelRow {
  Matricula?: any;
  NOME?: string;
  CODSEÇÃO?: string;
  SEÇÃO?: string;
  CODFUNÇÃO?: any;
  FUNÇÃO?: string;
  SITUAÇÃO?: string;
  GERENCIA?: string;
  DIRETORIA?: string;
  CARGO?: string;
  TELEFONE?: any;
  EMAILPESSOAL?: string;
  EMAILCORPORATIVO?: string;
}

async function importEmployees(filePath: string) {
  console.log("📂 Lendo arquivo Excel...");
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`📊 Total de registros: ${data.length}`);
  
  const stats = {
    total: data.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    byStatus: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>,
    byCargo: {} as Record<string, number>,
  };
  
  const departmentCache = new Map<string, number>();
  const positionCache = new Map<string, number>();
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      if (!row.NOME || !row.Matricula) {
        console.log(`⚠️  Linha ${i + 2}: Nome ou matrícula ausente, pulando...`);
        stats.skipped++;
        continue;
      }
      
      const deptKey = row.SEÇÃO || "Sem Departamento";
      let departmentId: number;
      if (departmentCache.has(deptKey)) {
        departmentId = departmentCache.get(deptKey)!;
      } else {
        departmentId = await getOrCreateDepartment(row.SEÇÃO || "", row.DIRETORIA);
        departmentCache.set(deptKey, departmentId);
      }
      
      const posKey = row.CARGO || "Sem Cargo";
      let positionId: number;
      if (positionCache.has(posKey)) {
        positionId = positionCache.get(posKey)!;
      } else {
        positionId = await getOrCreatePosition(row.CARGO || "", row.FUNÇÃO);
        positionCache.set(posKey, positionId);
      }
      
      const situacao = row.SITUAÇÃO || "Ativo";
      const status = situacaoToStatus[situacao] || "ativo";
      const hierarchyLevel = getHierarchyLevel(row.CARGO || "");
      
      const employeeCode = String(row.Matricula).padStart(7, "0");
      const email = normalizeEmail(row.EMAILCORPORATIVO || row.EMAILPESSOAL || `${employeeCode}@uisa.com.br`)!;
      const phone = normalizePhone(row.TELEFONE);
      
      // Verificar se funcionário já existe
      const [existing]: any = await connection.execute(
        "SELECT id FROM employees WHERE employeeCode = ? LIMIT 1",
        [employeeCode]
      );
      
      if (existing.length > 0) {
        // Atualizar funcionário existente
        await connection.execute(
          `UPDATE employees SET 
            name = ?, 
            email = ?, 
            phone = ?, 
            departmentId = ?, 
            positionId = ?, 
            status = ?, 
            hierarchyLevel = ?, 
            active = ?, 
            costCenter = ?, 
            updatedAt = NOW()
          WHERE id = ?`,
          [
            row.NOME,
            email,
            phone,
            departmentId,
            positionId,
            status,
            hierarchyLevel,
            status === "ativo" ? 1 : 0,
            row.GERENCIA || null,
            existing[0].id
          ]
        );
        
        stats.updated++;
        if ((stats.updated + stats.imported) % 50 === 0) {
          console.log(`✅ Atualizado: ${row.NOME} (${employeeCode})`);
        }
      } else {
        // Inserir novo funcionário
        await connection.execute(
          `INSERT INTO employees (
            employeeCode, name, email, phone, departmentId, positionId, 
            status, hierarchyLevel, hireDate, active, costCenter, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())`,
          [
            employeeCode,
            row.NOME,
            email,
            phone,
            departmentId,
            positionId,
            status,
            hierarchyLevel,
            status === "ativo" ? 1 : 0,
            row.GERENCIA || null
          ]
        );
        
        stats.imported++;
        if ((stats.updated + stats.imported) % 50 === 0) {
          console.log(`➕ Importado: ${row.NOME} (${employeeCode})`);
        }
      }
      
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      stats.byDepartment[deptKey] = (stats.byDepartment[deptKey] || 0) + 1;
      stats.byCargo[posKey] = (stats.byCargo[posKey] || 0) + 1;
      
    } catch (error: any) {
      console.error(`❌ Erro na linha ${i + 2}:`, error.message);
      stats.errors++;
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`📈 Progresso: ${i + 1}/${data.length} (${((i + 1) / data.length * 100).toFixed(1)}%)`);
    }
  }
  
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

const excelPath = join(process.cwd(), "../upload/Funcionariosdiferentededemitido(D)(1).xlsx");

try {
  const stats = await importEmployees(excelPath);
  console.log("\n✅ Importação concluída com sucesso!");
  process.exit(0);
} catch (error: any) {
  console.error("\n❌ Erro durante importação:", error);
  console.error(error.stack);
  process.exit(1);
} finally {
  await connection.end();
}
