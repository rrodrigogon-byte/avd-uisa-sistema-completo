/**
 * Script de Migração de Dados Históricos
 * 
 * Migra testes psicométricos da tabela legada `psychometricTests` 
 * para a nova tabela `testResults` com estrutura completa.
 * 
 * Execução: pnpm tsx scripts/migrate-psychometric-tests.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and } from "drizzle-orm";
import { 
  psychometricTests, 
  testResults, 
  testInvitations
} from "../drizzle/schema";

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
        const invitation = await db
          .select()
          .from(testInvitations)
          .where(
            and(
              eq(testInvitations.employeeId, test.employeeId),
              eq(testInvitations.testType, test.testType),
              eq(testInvitations.status, "concluido")
            )
          )
          .limit(1);

        let invitationId = invitation[0]?.id;

        // Se não existe convite, criar um retroativo
        if (!invitationId) {
          console.log(`   📝 Criando convite retroativo para Employee ${test.employeeId}`);
          
          // Gerar token único
          const uniqueToken = `migrated-${test.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const result = await db.insert(testInvitations).values({
            employeeId: test.employeeId,
            testType: test.testType,
            uniqueToken: uniqueToken,
            sentAt: test.sentAt || test.completedAt,
            expiresAt: test.completedAt, // Já expirado pois foi concluído
            status: "concluido",
            startedAt: test.sentAt || test.completedAt,
            completedAt: test.completedAt,
            emailSent: false,
            emailSentAt: null,
            createdBy: test.sentBy || 1, // Admin padrão se não houver
            createdAt: test.completedAt,
            updatedAt: test.completedAt,
          });

          invitationId = Number(result[0].insertId);
        }

        // Migrar para nova tabela
        // Garantir que scores seja uma string JSON válida
        let scoresJson = '{}';
        if (test.scores) {
          scoresJson = typeof test.scores === 'string' ? test.scores : JSON.stringify(test.scores);
        } else if (test.results) {
          scoresJson = typeof test.results === 'string' ? test.results : JSON.stringify(test.results);
        }
        
        await db.insert(testResults).values({
          invitationId: invitationId,
          employeeId: test.employeeId,
          testType: test.testType,
          scores: scoresJson,
          profileType: null,
          profileDescription: test.interpretation || null,
          strengths: null,
          developmentAreas: null,
          workStyle: null,
          communicationStyle: null,
          leadershipStyle: null,
          motivators: null,
          stressors: null,
          teamContribution: null,
          careerRecommendations: null,
          rawData: typeof test.results === 'string' ? test.results : JSON.stringify(test.results),
          completedAt: test.completedAt,
          createdAt: test.completedAt,
          updatedAt: test.completedAt,
        });

        console.log(`✅ Migrado: ${test.testType} - Employee ${test.employeeId} (ID: ${test.id})`);
        migratedCount++;

      } catch (error: any) {
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
      console.log("💡 Dica: Você pode verificar os dados migrados acessando a aba 'Testes' nos perfis dos funcionários");
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
