import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";

/**
 * Script de importação de hierarquia organizacional
 * Importa dados do arquivo JSON gerado a partir do Excel
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

async function importHierarchy() {
  console.log("📊 Iniciando importação de hierarquia organizacional...\n");

  // Conectar ao banco de dados
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // Ler dados do JSON
  const jsonPath = "/home/ubuntu/employees_hierarchy.json";
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo não encontrado: ${jsonPath}`);
    process.exit(1);
  }

  const employeesData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📁 ${employeesData.length} funcionários encontrados no arquivo\n`);

  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const empData of employeesData) {
    try {
      // Verificar se funcionário já existe pela chapa
      const [existing] = await connection.execute(
        "SELECT id FROM employees WHERE chapa = ?",
        [empData.chapa]
      );

      if (existing.length > 0) {
        // Atualizar funcionário existente
        await connection.execute(
          `UPDATE employees SET
            name = ?,
            email = ?,
            empresa = ?,
            codSecao = ?,
            secao = ?,
            codFuncao = ?,
            funcao = ?,
            chapaPresidente = ?,
            presidente = ?,
            funcaoPresidente = ?,
            emailPresidente = ?,
            chapaDiretor = ?,
            diretor = ?,
            funcaoDiretor = ?,
            emailDiretor = ?,
            chapaGestor = ?,
            gestor = ?,
            funcaoGestor = ?,
            emailGestor = ?,
            chapaCoordenador = ?,
            coordenador = ?,
            funcaoCoordenador = ?,
            emailCoordenador = ?,
            active = 1,
            status = 'ativo',
            updatedAt = NOW()
          WHERE id = ?`,
          [
            empData.nome,
            empData.email || null,
            empData.empresa,
            empData.codigoSecao,
            empData.secao,
            empData.codigoFuncao,
            empData.funcao,
            empData.chapaPresidente,
            empData.presidente,
            empData.funcaoPresidente,
            empData.emailPresidente,
            empData.chapaDiretor,
            empData.diretor,
            empData.funcaoDiretor,
            empData.emailDiretor,
            empData.chapaGestor,
            empData.gestor,
            empData.funcaoGestor,
            empData.emailGestor,
            empData.chapaCoordenador,
            empData.coordenador,
            empData.funcaoCoordenador,
            empData.emailCoordenador,
            existing[0].id,
          ]
        );
        updated++;
      } else {
        // Criar novo funcionário
        await connection.execute(
          `INSERT INTO employees (
            employeeCode, chapa, name, email, empresa,
            codSecao, secao, codFuncao, funcao,
            chapaPresidente, presidente, funcaoPresidente, emailPresidente,
            chapaDiretor, diretor, funcaoDiretor, emailDiretor,
            chapaGestor, gestor, funcaoGestor, emailGestor,
            chapaCoordenador, coordenador, funcaoCoordenador, emailCoordenador,
            active, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ativo', NOW(), NOW())`,
          [
            empData.chapa,
            empData.chapa,
            empData.nome,
            empData.email || null,
            empData.empresa,
            empData.codigoSecao,
            empData.secao,
            empData.codigoFuncao,
            empData.funcao,
            empData.chapaPresidente,
            empData.presidente,
            empData.funcaoPresidente,
            empData.emailPresidente,
            empData.chapaDiretor,
            empData.diretor,
            empData.funcaoDiretor,
            empData.emailDiretor,
            empData.chapaGestor,
            empData.gestor,
            empData.funcaoGestor,
            empData.emailGestor,
            empData.chapaCoordenador,
            empData.coordenador,
            empData.funcaoCoordenador,
            empData.emailCoordenador,
          ]
        );
        created++;
      }

      if ((updated + created) % 100 === 0) {
        console.log(`⏳ Processados: ${updated + created} funcionários...`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Erro ao processar ${empData.chapa}: ${error.message}`);
    }
  }

  await connection.end();

  console.log("\n✅ Importação concluída!");
  console.log(`📊 Estatísticas:`);
  console.log(`   - Criados: ${created}`);
  console.log(`   - Atualizados: ${updated}`);
  console.log(`   - Erros: ${errors}`);
  console.log(`   - Total processado: ${updated + created}`);
}

importHierarchy()
  .then(() => {
    console.log("\n✨ Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
