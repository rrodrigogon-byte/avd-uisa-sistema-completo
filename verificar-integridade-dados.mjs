#!/usr/bin/env node

/**
 * Script de Verificação de Integridade de Dados - AVD UISA
 * 
 * Este script verifica se todos os dados essenciais estão presentes no sistema:
 * - Funcionários
 * - Usuários
 * - PDIs
 * - Avaliações (AVD)
 * - Pesquisas
 * - Ciclos
 * - Departamentos
 * - Cargos
 * - Metas
 * - Competências
 */

import { drizzle } from "drizzle-orm/mysql2";
import { count, sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log("⚠️  DATABASE_URL não configurada");
  console.log("📝 Este script precisa de uma conexão com banco de dados.");
  console.log("\n🔍 Verificando arquivos de dados locais...\n");
  verificarArquivosLocais();
  process.exit(0);
}

console.log("🔍 AUDITORIA DE INTEGRIDADE DE DADOS - AVD UISA\n");
console.log("=" .repeat(70));

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

// Objeto para armazenar resultados
const results = {
  timestamp: new Date().toISOString(),
  database: "conectado",
  tables: {},
  warnings: [],
  errors: [],
  recommendations: []
};

// Função para contar registros de uma tabela
async function contarRegistros(tabela, nomeTabela) {
  try {
    const [result] = await db.select({ count: count() }).from(tabela);
    const total = result?.count || 0;
    results.tables[nomeTabela] = total;
    
    if (total === 0) {
      results.warnings.push(`⚠️  Tabela ${nomeTabela} está vazia`);
    }
    
    return total;
  } catch (error) {
    results.errors.push(`❌ Erro ao contar ${nomeTabela}: ${error.message}`);
    return 0;
  }
}

try {
  console.log("\n📊 VERIFICANDO TABELAS PRINCIPAIS...\n");

  // 1. FUNCIONÁRIOS (Employees)
  console.log("👥 Funcionários:");
  const totalEmployees = await contarRegistros(schema.employees, "employees");
  console.log(`   Total: ${totalEmployees}`);
  
  if (totalEmployees > 0) {
    // Funcionários ativos
    const [ativos] = await db.select({ count: count() })
      .from(schema.employees)
      .where(sql`${schema.employees.active} = true`);
    console.log(`   Ativos: ${ativos.count}`);
    console.log(`   Inativos: ${totalEmployees - ativos.count}`);
    results.tables.employees_ativos = ativos.count;
    results.tables.employees_inativos = totalEmployees - ativos.count;
  }

  // 2. USUÁRIOS (Users)
  console.log("\n🔐 Usuários:");
  const totalUsers = await contarRegistros(schema.users, "users");
  console.log(`   Total: ${totalUsers}`);
  
  if (totalUsers > 0) {
    // Por papel/role
    const roles = await db.select({
      role: schema.users.role,
      count: count()
    })
    .from(schema.users)
    .groupBy(schema.users.role);
    
    roles.forEach(r => {
      console.log(`   ${r.role}: ${r.count}`);
      results.tables[`users_${r.role}`] = r.count;
    });
  }

  // 3. DEPARTAMENTOS
  console.log("\n🏢 Departamentos:");
  const totalDepts = await contarRegistros(schema.departments, "departments");
  console.log(`   Total: ${totalDepts}`);

  // 4. CARGOS (Positions)
  console.log("\n💼 Cargos:");
  const totalPositions = await contarRegistros(schema.positions, "positions");
  console.log(`   Total: ${totalPositions}`);

  // 5. CICLOS DE AVALIAÇÃO
  console.log("\n📅 Ciclos de Avaliação:");
  const totalCycles = await contarRegistros(schema.evaluationCycles, "evaluation_cycles");
  console.log(`   Total: ${totalCycles}`);
  
  if (totalCycles > 0) {
    // Ciclos por status
    const cyclesStatus = await db.select({
      status: schema.evaluationCycles.status,
      count: count()
    })
    .from(schema.evaluationCycles)
    .groupBy(schema.evaluationCycles.status);
    
    cyclesStatus.forEach(c => {
      console.log(`   ${c.status}: ${c.count}`);
      results.tables[`cycles_${c.status}`] = c.count;
    });
  }

  // 6. PDIs (Planos de Desenvolvimento Individual)
  console.log("\n📋 PDIs:");
  const totalPDIs = await contarRegistros(schema.pdis, "pdis");
  console.log(`   Total: ${totalPDIs}`);
  
  if (totalPDIs > 0) {
    // PDIs por status
    const pdisStatus = await db.select({
      status: schema.pdis.status,
      count: count()
    })
    .from(schema.pdis)
    .groupBy(schema.pdis.status);
    
    pdisStatus.forEach(p => {
      console.log(`   ${p.status}: ${p.count}`);
      results.tables[`pdis_${p.status}`] = p.count;
    });
    
    // Ações de PDI
    const totalActions = await contarRegistros(schema.pdiActions, "pdi_actions");
    console.log(`   Ações de desenvolvimento: ${totalActions}`);
  }

  // 7. AVALIAÇÕES 360°
  console.log("\n🎯 Avaliações 360°:");
  const totalEvaluations = await contarRegistros(schema.evaluations, "evaluations");
  console.log(`   Total: ${totalEvaluations}`);
  
  if (totalEvaluations > 0) {
    // Avaliações por status
    const evalsStatus = await db.select({
      status: schema.evaluations.status,
      count: count()
    })
    .from(schema.evaluations)
    .groupBy(schema.evaluations.status);
    
    evalsStatus.forEach(e => {
      console.log(`   ${e.status}: ${e.count}`);
      results.tables[`evaluations_${e.status}`] = e.count;
    });
  }

  // 8. METAS
  console.log("\n🎯 Metas:");
  const totalGoals = await contarRegistros(schema.goals, "goals");
  console.log(`   Total: ${totalGoals}`);
  
  if (totalGoals > 0) {
    // Metas por status
    const goalsStatus = await db.select({
      status: schema.goals.status,
      count: count()
    })
    .from(schema.goals)
    .groupBy(schema.goals.status);
    
    goalsStatus.forEach(g => {
      console.log(`   ${g.status}: ${g.count}`);
      results.tables[`goals_${g.status}`] = g.count;
    });
  }

  // 9. COMPETÊNCIAS
  console.log("\n🎓 Competências:");
  const totalCompetencies = await contarRegistros(schema.competencies, "competencies");
  console.log(`   Total: ${totalCompetencies}`);

  // 10. PESQUISAS PULSE
  console.log("\n📊 Pesquisas Pulse:");
  const totalSurveys = await contarRegistros(schema.pulseSurveys, "pulse_surveys");
  console.log(`   Total: ${totalSurveys}`);
  
  if (totalSurveys > 0) {
    // Respostas
    const totalResponses = await contarRegistros(schema.pulseSurveyResponses, "pulse_survey_responses");
    console.log(`   Respostas: ${totalResponses}`);
  }

  // 11. TESTES PSICOMÉTRICOS
  console.log("\n🧠 Testes Psicométricos:");
  const totalTests = await contarRegistros(schema.psychometricTests, "psychometric_tests");
  console.log(`   Total de testes: ${totalTests}`);
  
  if (totalTests > 0) {
    // Resultados
    const totalResults = await contarRegistros(schema.psychometricTestResults, "psychometric_test_results");
    console.log(`   Resultados: ${totalResults}`);
  }

  // 12. FEEDBACKS
  console.log("\n💬 Feedbacks:");
  const totalFeedbacks = await contarRegistros(schema.feedbacks, "feedbacks");
  console.log(`   Total: ${totalFeedbacks}`);

  // 13. CALIBRAÇÃO
  console.log("\n⚖️  Calibração:");
  const totalCalibrations = await contarRegistros(schema.calibrationMeetings, "calibration_meetings");
  console.log(`   Reuniões: ${totalCalibrations}`);

  // 14. NINE BOX
  console.log("\n📦 Nine Box:");
  const totalNineBox = await contarRegistros(schema.nineBoxPlacements, "nine_box_placements");
  console.log(`   Posicionamentos: ${totalNineBox}`);

  // 15. SUCESSÃO
  console.log("\n👔 Planos de Sucessão:");
  const totalSuccession = await contarRegistros(schema.successionPlans, "succession_plans");
  console.log(`   Total: ${totalSuccession}`);

  // 16. DESCRIÇÕES DE CARGO
  console.log("\n📄 Descrições de Cargo:");
  const totalJobDescs = await contarRegistros(schema.jobDescriptions, "job_descriptions");
  console.log(`   Total: ${totalJobDescs}`);

  // 17. NOTIFICAÇÕES
  console.log("\n🔔 Notificações:");
  const totalNotifications = await contarRegistros(schema.notifications, "notifications");
  console.log(`   Total: ${totalNotifications}`);

  // ANÁLISE E RECOMENDAÇÕES
  console.log("\n" + "=".repeat(70));
  console.log("\n📊 ANÁLISE DE INTEGRIDADE\n");

  // Verificar dados críticos
  if (totalEmployees === 0) {
    results.errors.push("❌ CRÍTICO: Nenhum funcionário cadastrado!");
    results.recommendations.push("Execute: node seed.mjs ou node import-employees.mjs");
  }

  if (totalUsers === 0) {
    results.errors.push("❌ CRÍTICO: Nenhum usuário cadastrado!");
    results.recommendations.push("Execute: node create-remaining-users.mjs");
  }

  if (totalDepts === 0) {
    results.warnings.push("⚠️  Nenhum departamento cadastrado");
    results.recommendations.push("Execute: node seed.mjs para criar departamentos");
  }

  if (totalCycles === 0) {
    results.warnings.push("⚠️  Nenhum ciclo de avaliação cadastrado");
    results.recommendations.push("Crie um ciclo em: /ciclos-avaliacao/criar");
  }

  if (totalCompetencies === 0) {
    results.warnings.push("⚠️  Nenhuma competência cadastrada");
    results.recommendations.push("Execute: node seed-competencias.mjs");
  }

  // Verificar proporções
  if (totalUsers > 0 && totalEmployees > 0) {
    const proporcao = (totalUsers / totalEmployees * 100).toFixed(2);
    console.log(`✓ Proporção Usuários/Funcionários: ${proporcao}%`);
    
    if (proporcao < 50) {
      results.warnings.push(`⚠️  Apenas ${proporcao}% dos funcionários têm usuários criados`);
      results.recommendations.push("Execute: node create-remaining-users.mjs");
    }
  }

  if (totalPDIs > 0 && totalEmployees > 0) {
    const proporcaoPDI = (totalPDIs / totalEmployees * 100).toFixed(2);
    console.log(`✓ Proporção PDIs/Funcionários: ${proporcaoPDI}%`);
    
    if (proporcaoPDI < 30) {
      results.warnings.push(`⚠️  Apenas ${proporcaoPDI}% dos funcionários têm PDI`);
    }
  }

  // Exibir warnings e errors
  if (results.errors.length > 0) {
    console.log("\n❌ ERROS CRÍTICOS:");
    results.errors.forEach(err => console.log(`   ${err}`));
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  AVISOS:");
    results.warnings.forEach(warn => console.log(`   ${warn}`));
  }

  if (results.recommendations.length > 0) {
    console.log("\n💡 RECOMENDAÇÕES:");
    results.recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  // Status geral
  console.log("\n" + "=".repeat(70));
  const statusGeral = results.errors.length === 0 ? "✅ APROVADO" : "❌ NECESSITA ATENÇÃO";
  console.log(`\n📋 STATUS GERAL: ${statusGeral}\n`);

  // Salvar relatório
  const reportPath = "./relatorio-integridade-dados.json";
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`💾 Relatório salvo em: ${reportPath}\n`);

} catch (error) {
  console.error("\n❌ ERRO DURANTE VERIFICAÇÃO:", error);
  results.errors.push(`Erro geral: ${error.message}`);
} finally {
  await connection.end();
}

// Função para verificar arquivos locais quando não há DB
function verificarArquivosLocais() {
  console.log("📁 VERIFICANDO ARQUIVOS DE DADOS LOCAIS\n");
  
  const arquivos = [
    { path: "import-data.json", desc: "Dados de funcionários UISA" },
    { path: "users-credentials.json", desc: "Credenciais de usuários" },
    { path: "pdi_data.json", desc: "Dados de PDIs" },
    { path: "succession-data-uisa.json", desc: "Dados de sucessão" },
    { path: "job_descriptions.json", desc: "Descrições de cargos" },
    { path: "funcionarios-hierarquia.xlsx", desc: "Hierarquia de funcionários" },
    { path: "data/uisa-job-descriptions.json", desc: "Descrições de cargos UISA" },
  ];

  let totalEncontrados = 0;
  let totalFuncionarios = 0;

  arquivos.forEach(arquivo => {
    if (fs.existsSync(arquivo.path)) {
      const stats = fs.statSync(arquivo.path);
      const tamanhoMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✓ ${arquivo.path}`);
      console.log(`  ${arquivo.desc}`);
      console.log(`  Tamanho: ${tamanhoMB} MB`);
      
      // Tentar contar registros em JSONs
      if (arquivo.path.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(arquivo.path, 'utf-8'));
          if (Array.isArray(content)) {
            console.log(`  Registros: ${content.length}`);
            if (arquivo.path === 'import-data.json') {
              totalFuncionarios = content.employees?.length || 0;
              console.log(`  Funcionários: ${totalFuncionarios}`);
            }
          } else if (content.employees) {
            totalFuncionarios = content.employees.length;
            console.log(`  Funcionários: ${totalFuncionarios}`);
          }
        } catch (e) {
          console.log(`  ⚠️  Não foi possível ler o conteúdo`);
        }
      }
      console.log("");
      totalEncontrados++;
    } else {
      console.log(`✗ ${arquivo.path} (não encontrado)`);
      console.log(`  ${arquivo.desc}\n`);
    }
  });

  console.log("=".repeat(70));
  console.log(`\n📊 RESUMO:`);
  console.log(`   Arquivos encontrados: ${totalEncontrados}/${arquivos.length}`);
  if (totalFuncionarios > 0) {
    console.log(`   Funcionários no arquivo: ${totalFuncionarios}`);
  }
  console.log("");

  if (totalFuncionarios > 0) {
    console.log("💡 PRÓXIMOS PASSOS:");
    console.log("   1. Configure DATABASE_URL no .env");
    console.log("   2. Execute: pnpm db:push (para criar tabelas)");
    console.log("   3. Execute: node execute-import.mjs (para importar funcionários)");
    console.log("   4. Execute: node create-remaining-users.mjs (para criar usuários)");
    console.log("   5. Execute: node seed.mjs (para dados adicionais)");
    console.log("");
  }
}
