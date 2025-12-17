#!/usr/bin/env node
/**
 * Script de Importação de Funcionários via Drizzle ORM
 * Sistema AVD UISA
 * 
 * Este script lê o arquivo JSON gerado pelo Python e importa os dados
 * diretamente no banco de dados usando Drizzle ORM.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler o arquivo SQL e executar em lotes
async function main() {
  console.log('=== Iniciando Importação via SQL ===');
  
  // Conectar ao banco de dados
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Conectado ao banco de dados');
  
  // Ler arquivo SQL
  const sqlFile = path.join(__dirname, 'import_data.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
  
  // Separar statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Total de statements: ${statements.length}`);
  
  // Executar em lotes
  const batchSize = 100;
  let executed = 0;
  let errors = 0;
  
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, i + batchSize);
    
    for (const stmt of batch) {
      try {
        await connection.execute(stmt);
        executed++;
      } catch (err) {
        // Ignorar erros de duplicata
        if (!err.message.includes('Duplicate entry')) {
          console.error(`Erro: ${err.message.substring(0, 100)}`);
          errors++;
        }
      }
    }
    
    console.log(`Progresso: ${Math.min(i + batchSize, statements.length)}/${statements.length} (${errors} erros)`);
  }
  
  console.log(`\n=== Importação Concluída ===`);
  console.log(`Statements executados: ${executed}`);
  console.log(`Erros: ${errors}`);
  
  // Verificar contagens
  const [depts] = await connection.execute('SELECT COUNT(*) as count FROM departments');
  const [positions] = await connection.execute('SELECT COUNT(*) as count FROM positions');
  const [employees] = await connection.execute('SELECT COUNT(*) as count FROM employees');
  
  console.log(`\n=== Contagens Finais ===`);
  console.log(`Departamentos: ${depts[0].count}`);
  console.log(`Cargos: ${positions[0].count}`);
  console.log(`Funcionários: ${employees[0].count}`);
  
  await connection.end();
}

main().catch(console.error);
