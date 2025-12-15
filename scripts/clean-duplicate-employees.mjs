/**
 * Script para analisar e limpar funcionários duplicados
 * Mantém apenas registros com padrão completo: chapa | nome | email | cargo | departamento
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function cleanDuplicateEmployees() {
  console.log("🔍 Analisando funcionários duplicados...\n");

  try {
    // 1. Buscar duplicados por chapa (ignorando null)
    console.log("1. Buscando duplicados por chapa...");
    const duplicates = await db.execute(sql`
      SELECT chapa, COUNT(*) as count
      FROM employees
      WHERE chapa IS NOT NULL AND chapa != ''
      GROUP BY chapa
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    // 2. Buscar duplicados por nome + email
    console.log("2. Buscando duplicados por nome + email...");
    const nameDuplicates = await db.execute(sql`
      SELECT name, email, COUNT(*) as count
      FROM employees
      WHERE name IS NOT NULL AND name != ''
      GROUP BY name, email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    const dupRows = duplicates[0] || [];
    const nameDupRows = nameDuplicates[0] || [];
    
    console.log(`✅ Encontrados ${dupRows.length} chapas duplicadas`);
    console.log(`✅ Encontrados ${nameDupRows.length} duplicados por nome/email\n`);

    if (dupRows.length === 0 && nameDupRows.length === 0) {
      console.log("✨ Nenhum duplicado encontrado!");
      return;
    }

    // 3. Para cada chapa duplicada, manter apenas o registro mais completo
    let totalDeleted = 0;

    for (const dup of dupRows) {
      const chapa = dup.chapa;
      console.log(`\n📋 Processando chapa: ${chapa} (${dup.count} registros)`);

      // Buscar todos os registros desta chapa
      const records = await db.execute(sql`
        SELECT * FROM employees WHERE chapa = ${chapa}
        ORDER BY 
          CASE WHEN positionId IS NOT NULL THEN 1 ELSE 0 END DESC,
          CASE WHEN departmentId IS NOT NULL THEN 1 ELSE 0 END DESC,
          CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END DESC,
          CASE WHEN name IS NOT NULL AND name != '' THEN 1 ELSE 0 END DESC,
          id ASC
      `);

      const recordRows = records[0] || [];
      if (recordRows.length <= 1) {
        continue;
      }

      // Manter o primeiro (mais completo)
      const keep = recordRows[0];
      const toDelete = recordRows.slice(1);

      console.log(`   ✅ Mantendo: ID ${keep.id} - ${keep.name || '(sem nome)'} - ${keep.email || '(sem email)'}`);
      console.log(`   ❌ Deletando ${toDelete.length} registros duplicados:`);

      for (const record of toDelete) {
        console.log(`      - ID ${record.id} - ${record.name || '(sem nome)'} - ${record.email || '(sem email)'}`);
        await db.execute(sql`DELETE FROM employees WHERE id = ${record.id}`);
        totalDeleted++;
      }
    }

    // 4. Processar duplicados por nome/email
    console.log(`\n\n📝 Processando duplicados por nome/email...\n`);
    
    for (const dup of nameDupRows) {
      const name = dup.name;
      const email = dup.email;
      console.log(`\n📝 Processando: ${name} - ${email || '(sem email)'} (${dup.count} registros)`);

      // Buscar todos os registros com este nome/email
      const records = await db.execute(sql`
        SELECT * FROM employees 
        WHERE name = ${name} AND (email = ${email} OR (email IS NULL AND ${email} IS NULL))
        ORDER BY 
          CASE WHEN chapa IS NOT NULL AND chapa != '' THEN 1 ELSE 0 END DESC,
          CASE WHEN positionId IS NOT NULL THEN 1 ELSE 0 END DESC,
          CASE WHEN departmentId IS NOT NULL THEN 1 ELSE 0 END DESC,
          id ASC
      `);

      const recordRows = records[0] || [];
      if (recordRows.length <= 1) {
        continue;
      }

      // Manter o primeiro (mais completo)
      const keep = recordRows[0];
      const toDelete = recordRows.slice(1);

      console.log(`   ✅ Mantendo: ID ${keep.id} - Chapa: ${keep.chapa || '(sem chapa)'} - ${keep.name}`);
      console.log(`   ❌ Deletando ${toDelete.length} registros duplicados:`);

      for (const record of toDelete) {
        console.log(`      - ID ${record.id} - Chapa: ${record.chapa || '(sem chapa)'} - ${record.name}`);
        await db.execute(sql`DELETE FROM employees WHERE id = ${record.id}`);
        totalDeleted++;
      }
    }

    console.log(`\n✨ Limpeza concluída!`);
    console.log(`   Total de registros deletados: ${totalDeleted}`);
    console.log(`   Chapas duplicadas processadas: ${dupRows.length}`);
    console.log(`   Nomes duplicados processados: ${nameDupRows.length}`);

  } catch (error) {
    console.error("❌ Erro ao limpar duplicados:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

cleanDuplicateEmployees();
