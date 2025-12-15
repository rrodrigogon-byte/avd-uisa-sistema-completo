/**
 * Script de Migração de Dados Históricos
 * 
 * Migra testes psicométricos da tabela legada `psychometricTests` 
 * para a nova tabela `testResults` com estrutura completa.
 * 
 * Execução: node scripts/migrate-psychometric-tests.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, isNull } from "drizzle-orm";

// Importar schemas
import { 
  psychometricTests, 
  testResults, 
  testInvitations,
  employees 
} from "../drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

async function main() {
  console.log("🚀 Iniciando migração de dados históricos...\n");

  // Conectar ao banco
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Buscar todos os testes da tabela legada
    console.log("📊 Buscando testes na tabela psychometricTests...");
    const oldTests = await db.select().from(psychometricTests);
    console.log(`   Encontrados ${oldTests.length} testes\n`);

    if (oldTests.length === 0) {
      console.log("✅ Nenhum teste para migrar");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Processar cada teste
    for (const test of oldTests) {
      try {
        // Verificar se já existe na nova tabela
        const existing = await db
          .select()
          .from(testResults)
          .where(
            and(
              eq(testResults.employeeId, test.employeeId),
              eq(testResults.testType, test.testType),
              eq(testResults.completedAt, test.completedAt)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️  Teste já migrado: ${test.testType} - Employee ${test.employeeId}`);
          skippedCount++;
          continue;
        }

        // Buscar ou criar convite retroativo
        let invitation = await db
          .select()
          .from(testInvitations)
          .where(
            and(
              eq(testInvitations.employeeId, test.employeeId),
              eq(testInvitations.testType, test.testType),
              eq(testInvitations.status, "completed")
            )
          )
          .limit(1);

        let invitationId = invitation[0]?.id;

        // Se não existe convite, criar um retroativo
        if (!invitationId) {
          console.log(`   📝 Criando convite retroativo para Employee ${test.employeeId}`);
          
          const [newInvitation] = await db.insert(testInvitations).values({
            employeeId: test.employeeId,
            testType: test.testType,
            sentBy: test.sentBy || null,
            sentAt: test.sentAt || test.completedAt,
            expiresAt: null,
            status: "completed",
            completedAt: test.completedAt,
            emailSent: false,
            createdAt: test.completedAt,
            updatedAt: test.completedAt,
          });

          invitationId = newInvitation.insertId;
        }

        // Migrar para nova tabela
        await db.insert(testResults).values({
          invitationId: invitationId,
          employeeId: test.employeeId,
          testType: test.testType,
          results: test.results,
          scores: test.scores || null,
          interpretation: test.interpretation || null,
          completedAt: test.completedAt,
          createdAt: test.completedAt,
          updatedAt: test.completedAt,
        });

        console.log(`✅ Migrado: ${test.testType} - Employee ${test.employeeId} (ID: ${test.id})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Erro ao migrar teste ID ${test.id}:`, error.message);
        errorCount++;
      }
    }

    // 3. Relatório final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RELATÓRIO DE MIGRAÇÃO");
    console.log("=".repeat(60));
    console.log(`Total de testes encontrados: ${oldTests.length}`);
    console.log(`✅ Migrados com sucesso:     ${migratedCount}`);
    console.log(`⏭️  Já existiam (pulados):   ${skippedCount}`);
    console.log(`❌ Erros:                    ${errorCount}`);
    console.log("=".repeat(60) + "\n");

    // 4. Validação
    console.log("🔍 Validando migração...");
    const totalInNewTable = await db.select().from(testResults);
    console.log(`   Total de registros em testResults: ${totalInNewTable.length}`);

    if (migratedCount > 0) {
      console.log("\n✅ Migração concluída com sucesso!");
      console.log("💡 Dica: Você pode verificar os dados migrando acessando a aba 'Testes' nos perfis dos funcionários");
    } else if (skippedCount > 0) {
      console.log("\n✅ Todos os testes já estavam migrados!");
    }

  } catch (error) {
    console.error("\n❌ Erro fatal durante migração:", error);
    throw error;
  } finally {
    await connection.end();
    console.log("\n🔌 Conexão com banco de dados fechada");
  }
}

// Executar
main()
  .then(() => {
    console.log("\n✨ Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script falhou:", error);
    process.exit(1);
  });
