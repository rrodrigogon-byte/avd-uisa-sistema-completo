import { createTestInviteEmail, testInfo } from "../server/utils/testInviteTemplate";
import { emailService } from "../server/utils/emailService";
import { getDb } from "../server/db";
import { employees } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Lista de emails dos colaboradores
const recipients = [
  "rodrigo.dias@uisa.com.br",
  "caroline.silva@uisa.com.br",
  "rodrigo.goncalves@uisa.com.br",
  "andre.sbardellini@uisa.com.br",
];

// Lista de testes a enviar
const tests: Array<"disc" | "bigfive" | "mbti" | "ie" | "vark"> = [
  "disc",
  "bigfive",
  "mbti",
  "ie",
  "vark",
];

async function sendTestInvites() {
  console.log("🚀 Iniciando envio de convites para testes psicométricos...\n");

  const database = await getDb();
  if (!database) {
    console.error("❌ Erro: Banco de dados não disponível");
    process.exit(1);
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const testType of tests) {
    console.log(`\n📧 Enviando convites para teste: ${testInfo[testType].name}`);
    console.log(`   Tipo: ${testInfo[testType].type}`);
    console.log(`   Tempo estimado: ${testInfo[testType].estimatedTime}`);
    console.log(`   Perguntas: ${testInfo[testType].questionCount}\n`);

    for (const email of recipients) {
      try {
        // Buscar colaborador pelo email
        const employee = await database.select()
          .from(employees)
          .where(eq(employees.email, email))
          .limit(1);

        if (employee.length === 0) {
          console.log(`   ⚠️  ${email} - Colaborador não encontrado no banco`);
          totalFailed++;
          continue;
        }

        const testUrl = `https://3000-ipmp0a4ptf6awjhw09efq-4f54ef5c.manusvm.computer/teste-${testType}`;
        
        const emailTemplate = createTestInviteEmail({
          employeeName: employee[0].name,
          testType: testInfo[testType].type,
          testName: testInfo[testType].name,
          testDescription: testInfo[testType].description,
          estimatedTime: testInfo[testType].estimatedTime,
          testUrl,
        });

        // Enviar email
        const sent = await emailService.sendCustomEmail(
          email,
          emailTemplate.subject,
          emailTemplate.html
        );

        if (sent) {
          console.log(`   ✅ ${email} - Convite enviado com sucesso`);
          totalSent++;
        } else {
          console.log(`   ❌ ${email} - Erro ao enviar email`);
          totalFailed++;
        }

        // Aguardar 1 segundo entre envios para não sobrecarregar o SMTP
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ ${email} - Erro: ${error}`);
        totalFailed++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DO ENVIO");
  console.log("=".repeat(60));
  console.log(`✅ Emails enviados com sucesso: ${totalSent}`);
  console.log(`❌ Emails com falha: ${totalFailed}`);
  console.log(`📧 Total de emails processados: ${totalSent + totalFailed}`);
  console.log(`🎯 Total esperado: ${tests.length * recipients.length} (${tests.length} testes × ${recipients.length} colaboradores)`);
  console.log("=".repeat(60) + "\n");

  process.exit(0);
}

// Executar script
sendTestInvites().catch((error) => {
  console.error("❌ Erro fatal ao enviar convites:", error);
  process.exit(1);
});
