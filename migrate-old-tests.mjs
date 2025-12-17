/**
 * Script para migrar testes antigos de psychometricTests para testResults
 * Corrige testes concluídos antes da correção que não aparecem na interface
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

async function main() {
  console.log("🔄 Iniciando migração de testes antigos...\n");

  // Conectar ao banco
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // 1. Buscar testes em psychometricTests que não estão em testResults
    const query = `
      SELECT 
        pt.id,
        pt.employeeId,
        pt.testType,
        pt.completedAt,
        pt.responses,
        pt.discDominance,
        pt.discInfluence,
        pt.discSteadiness,
        pt.discCompliance,
        pt.discProfile,
        pt.bigFiveOpenness,
        pt.bigFiveConscientiousness,
        pt.bigFiveExtraversion,
        pt.bigFiveAgreeableness,
        pt.bigFiveNeuroticism,
        e.name as employeeName
      FROM psychometricTests pt
      LEFT JOIN employees e ON pt.employeeId = e.id
      LEFT JOIN testResults tr ON tr.employeeId = pt.employeeId AND tr.testType = pt.testType
      WHERE pt.completedAt IS NOT NULL
        AND tr.id IS NULL
      ORDER BY pt.completedAt ASC
    `;

    const [oldTests] = await connection.query(query);

    if (!oldTests || oldTests.length === 0) {
      console.log("✅ Nenhum teste antigo encontrado para migrar!");
      return;
    }

    console.log(`📋 Encontrados ${oldTests.length} testes antigos para migrar:\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const test of oldTests) {
      try {
        console.log(`   Migrando: ${test.testType} - ${test.employeeName} (ID: ${test.employeeId})`);

        // 2. Buscar ou criar convite (testInvitation)
        let invitation;
        const [existingInvitations] = await connection.query(
          `SELECT * FROM testInvitations 
           WHERE employeeId = ? AND testType = ? 
           ORDER BY createdAt DESC LIMIT 1`,
          [test.employeeId, test.testType]
        );

        if (existingInvitations && existingInvitations.length > 0) {
          invitation = existingInvitations[0];
          console.log(`      ✓ Convite existente encontrado (ID: ${invitation.id})`);
        } else {
          // Criar convite retroativo
          const [invitationResult] = await connection.query(
            `INSERT INTO testInvitations 
             (employeeId, testType, sentAt, expiresAt, status, createdAt, updatedAt)
             VALUES (?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), 'completed', NOW(), NOW())`,
            [test.employeeId, test.testType, test.completedAt, test.completedAt]
          );
          invitation = { id: invitationResult.insertId };
          console.log(`      ✓ Convite retroativo criado (ID: ${invitation.id})`);
        }

        // 3. Preparar dados para testResults
        const scores = {};
        let profileType = null;
        let profileDescription = null;

        if (test.testType === 'disc') {
          scores.dominance = test.discDominance || 0;
          scores.influence = test.discInfluence || 0;
          scores.steadiness = test.discSteadiness || 0;
          scores.compliance = test.discCompliance || 0;
          profileType = test.discProfile || 'N/A';
          profileDescription = `Perfil DISC: ${profileType}`;
        } else if (test.testType === 'bigfive') {
          scores.openness = test.bigFiveOpenness || 0;
          scores.conscientiousness = test.bigFiveConscientiousness || 0;
          scores.extraversion = test.bigFiveExtraversion || 0;
          scores.agreeableness = test.bigFiveAgreeableness || 0;
          scores.neuroticism = test.bigFiveNeuroticism || 0;
          profileType = 'Big Five';
          profileDescription = 'Perfil de personalidade Big Five';
        } else {
          // Para outros tipos de teste (careeranchors, etc)
          profileType = test.testType.toUpperCase();
          profileDescription = `Teste ${test.testType} concluído`;
        }

        // 4. Inserir em testResults
        await connection.query(
          `INSERT INTO testResults 
           (invitationId, employeeId, testType, scores, profileType, profileDescription, 
            rawData, completedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            invitation.id,
            test.employeeId,
            test.testType,
            JSON.stringify(scores),
            profileType,
            profileDescription,
            test.responses || '{}',
            test.completedAt
          ]
        );

        console.log(`      ✅ Migrado com sucesso!\n`);
        migratedCount++;

      } catch (error) {
        console.error(`      ❌ Erro ao migrar teste ID ${test.id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Migração concluída!`);
    console.log(`   Total de testes: ${oldTests.length}`);
    console.log(`   Migrados com sucesso: ${migratedCount}`);
    console.log(`   Erros: ${errorCount}`);
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("❌ Erro fatal durante migração:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

main()
  .then(() => {
    console.log("✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script finalizado com erro:", error);
    process.exit(1);
  });
