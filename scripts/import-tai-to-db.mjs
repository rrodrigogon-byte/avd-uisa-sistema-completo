#!/usr/bin/env node
/**
 * Script de Importação de Dados da Diretoria TAI para o Banco de Dados
 * Usa o arquivo JSON gerado pelo script Python
 */

import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { employees } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

// Ler dados do JSON
const data = JSON.parse(readFileSync('./scripts/diretoria-tai-data.json', 'utf-8'));

console.log(`📊 Total de registros a importar: ${data.length}`);

// Conectar ao banco
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

let imported = 0;
let updated = 0;
let errors = 0;

console.log('\n🚀 Iniciando importação...\n');

for (const emp of data) {
  try {
    // Mapear dados para o schema
    const employeeData = {
      employeeCode: emp.employeeId,
      chapa: emp.employeeId,
      name: emp.name,
      email: emp.email,
      corporateEmail: emp.email?.includes('@uisa.com.br') ? emp.email : null,
      personalEmail: emp.email?.includes('@uisa.com.br') ? null : emp.email,
      telefone: emp.phone,
      funcao: emp.position,
      gerencia: emp.department,
      diretoria: emp.directorate,
      cargo: emp.jobTitle,
      situacao: emp.status === 'active' ? 'Ativo' : 'Ferias',
      secao: emp.section,
      codSecao: emp.sectionCode,
      codFuncao: emp.functionCode,
      active: emp.status === 'active',
      // Determinar nível hierárquico
      hierarchyLevel: 
        emp.role === 'admin' ? 'diretoria' :
        emp.role === 'rh' ? 'gerencia' :
        emp.role === 'lider' ? 'supervisao' :
        'operacional',
    };

    // Verificar se já existe
    const existing = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeCode, employeeData.employeeCode))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar
      await db
        .update(employees)
        .set(employeeData)
        .where(eq(employees.employeeCode, employeeData.employeeCode));
      updated++;
      console.log(`✏️  Atualizado: ${emp.name} (${emp.employeeId})`);
    } else {
      // Inserir
      await db.insert(employees).values(employeeData);
      imported++;
      console.log(`✅ Importado: ${emp.name} (${emp.employeeId})`);
    }
  } catch (error) {
    errors++;
    console.error(`❌ Erro ao importar ${emp.name} (${emp.employeeId}):`, error.message);
  }
}

await connection.end();

console.log('\n📈 RESUMO DA IMPORTAÇÃO');
console.log('========================');
console.log(`✅ Novos registros: ${imported}`);
console.log(`✏️  Registros atualizados: ${updated}`);
console.log(`❌ Erros: ${errors}`);
console.log(`📊 Total processado: ${imported + updated + errors}/${data.length}`);
console.log('\n✨ Importação concluída!');
