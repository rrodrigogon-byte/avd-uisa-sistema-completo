/**
 * Script para executar ciclo completo de avaliação simulado
 * 
 * Este script:
 * 1. Cria um ciclo de avaliação
 * 2. Cadastra 3 funcionários (se não existirem)
 * 3. Cria avaliações para os funcionários
 * 4. Envia emails de notificação
 * 5. Preenche autoavaliações automaticamente
 * 6. Preenche avaliações do gestor automaticamente
 * 7. Finaliza avaliações com consenso
 * 8. Gera PDIs automáticos
 * 9. Calcula quartis e estatísticas
 */

import { getDb } from "../db";
import * as db from "../db";
import { sendEmail } from "../emailService";
import { employees, evaluationCycles, performanceEvaluations, departments, positions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const EMPLOYEES_DATA = [
  {
    name: "Rodrigo Gonçalves",
    email: "rodrigo.goncalves@uisa.com.br",
    employeeCode: "EMP001",
  },
  {
    name: "Bernardo Mendes",
    email: "bernardo.mendes@uisa.com.br",
    employeeCode: "EMP002",
  },
  {
    name: "Rodrigo Dias",
    email: "rodrigo.dias@uisa.com.br",
    employeeCode: "EMP003",
  },
];

async function runCompleteCycle() {
  console.log("🚀 Iniciando ciclo completo de avaliação...\n");

  const database = await getDb();
  if (!database) {
    console.error("❌ Banco de dados não disponível");
    return;
  }

  try {
    // 1. Criar ou buscar ciclo de avaliação
    console.log("📅 Criando ciclo de avaliação...");
    
    const [cycle] = await database
      .insert(evaluationCycles)
      .values({
        name: "Ciclo Completo Simulado 2025",
        year: 2025,
        type: "anual",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "ativo",
        active: true,
        description: "Ciclo de teste automático para demonstração completa do sistema",
        selfEvaluationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        managerEvaluationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        consensusDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      })
      .$returningId();

    console.log(`✅ Ciclo criado: ID ${cycle.id}\n`);

    // 2. Criar ou buscar departamento padrão
    let [department] = await database
      .select()
      .from(departments)
      .where(eq(departments.name, "Tecnologia"))
      .limit(1);

    if (!department) {
      [department] = await database
        .insert(departments)
        .values({
          name: "Tecnologia",
          code: "TI",
          description: "Departamento de Tecnologia da Informação",
          active: true,
        })
        .$returningId()
        .then((ids) =>
          database.select().from(departments).where(eq(departments.id, ids[0].id))
        );
    }

    // 3. Criar ou buscar cargo padrão
    let [position] = await database
      .select()
      .from(positions)
      .where(eq(positions.title, "Analista"))
      .limit(1);

    if (!position) {
      [position] = await database
        .insert(positions)
        .values({
          title: "Analista",
          code: "AN",
          description: "Analista de Sistemas",
          departmentId: department.id,
          level: "pleno",
          active: true,
        })
        .$returningId()
        .then((ids) =>
          database.select().from(positions).where(eq(positions.id, ids[0].id))
        );
    }

    // 4. Criar ou atualizar funcionários
    console.log("👥 Criando/atualizando funcionários...");
    const employeeIds: number[] = [];

    for (const empData of EMPLOYEES_DATA) {
      let [employee] = await database
        .select()
        .from(employees)
        .where(eq(employees.email, empData.email))
        .limit(1);

      if (!employee) {
        [employee] = await database
          .insert(employees)
          .values({
            name: empData.name,
            email: empData.email,
            employeeCode: empData.employeeCode,
            departmentId: department.id,
            positionId: position.id,
            active: true,
            status: "ativo",
            hireDate: new Date(),
          })
          .$returningId()
          .then((ids) =>
            database.select().from(employees).where(eq(employees.id, ids[0].id))
          );

        console.log(`  ✅ Funcionário criado: ${empData.name} (ID: ${employee.id})`);
      } else {
        console.log(`  ℹ️  Funcionário já existe: ${empData.name} (ID: ${employee.id})`);
      }

      employeeIds.push(employee.id);
    }

    console.log();

    // 5. Criar avaliações para os funcionários
    console.log("📝 Criando avaliações...");
    const evaluationIds: number[] = [];

    for (const employeeId of employeeIds) {
      // Verificar se já existe avaliação
      const [existing] = await database
        .select()
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.cycleId, cycle.id),
            eq(performanceEvaluations.employeeId, employeeId)
          )
        )
        .limit(1);

      if (existing) {
        console.log(`  ℹ️  Avaliação já existe para funcionário ${employeeId}`);
        evaluationIds.push(existing.id);
        continue;
      }

      const [evaluation] = await database
        .insert(performanceEvaluations)
        .values({
          cycleId: cycle.id,
          employeeId,
          type: "360",
          status: "pendente",
          workflowStatus: "pending_self",
          selfEvaluationCompleted: false,
          managerEvaluationCompleted: false,
          peersEvaluationCompleted: false,
          subordinatesEvaluationCompleted: false,
        })
        .$returningId();

      evaluationIds.push(evaluation.id);
      console.log(`  ✅ Avaliação criada: ID ${evaluation.id} para funcionário ${employeeId}`);
    }

    console.log();

    // 6. Enviar emails
    console.log("📧 Enviando emails...");
    for (let i = 0; i < EMPLOYEES_DATA.length; i++) {
      const empData = EMPLOYEES_DATA[i];
      const evaluationId = evaluationIds[i];

      const emailSent = await sendEmail({
        to: empData.email,
        subject: "🎯 Avaliação de Desempenho AVD UISA - Ciclo Completo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Olá ${empData.name}! 👋</h2>
            
            <p>Está disponível sua avaliação de desempenho no sistema AVD UISA.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📋 Detalhes da Avaliação</h3>
              <ul style="list-style: none; padding: 0;">
                <li>🔢 <strong>ID da Avaliação:</strong> ${evaluationId}</li>
                <li>📅 <strong>Ciclo:</strong> Ciclo Completo Simulado 2025</li>
                <li>⏰ <strong>Prazo:</strong> 30 dias</li>
              </ul>
            </div>
            
            <p>Este é um <strong>ciclo de teste automático</strong> para demonstração do sistema completo.</p>
            
            <p style="margin-top: 30px;">
              <a href="https://avduisa-sys-vd5bj8to.manus.space/avaliacoes/${evaluationId}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                🚀 Acessar Avaliação
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              <strong>Equipe RH UISA</strong>
            </p>
          </div>
        `,
      });

      if (emailSent) {
        console.log(`  ✅ Email enviado para ${empData.email}`);
      } else {
        console.log(`  ⚠️  Falha ao enviar email para ${empData.email}`);
      }
    }

    console.log();

    // 7. Preencher autoavaliações
    console.log("✍️  Preenchendo autoavaliações...");
    for (let i = 0; i < evaluationIds.length; i++) {
      const evaluationId = evaluationIds[i];
      const employeeId = employeeIds[i];

      const result = await db.fillSelfEvaluation(evaluationId, employeeId);
      console.log(`  ✅ Autoavaliação preenchida: Avaliação ${evaluationId}, Nota: ${result.selfScore}`);
    }

    console.log();

    // 8. Preencher avaliações do gestor
    console.log("👔 Preenchendo avaliações do gestor...");
    for (let i = 0; i < evaluationIds.length; i++) {
      const evaluationId = evaluationIds[i];
      const employeeId = employeeIds[i];

      // Usar o próprio funcionário como gestor para simulação
      const result = await db.fillManagerEvaluation(evaluationId, employeeId);
      console.log(`  ✅ Avaliação do gestor preenchida: Avaliação ${evaluationId}, Nota: ${result.managerScore}`);
    }

    console.log();

    // 9. Finalizar avaliações
    console.log("🏁 Finalizando avaliações...");
    for (const evaluationId of evaluationIds) {
      const result = await db.finalizeEvaluation(evaluationId);
      console.log(`  ✅ Avaliação finalizada: ID ${evaluationId}, Nota Final: ${result.finalScore}`);
    }

    console.log();

    // 10. Gerar PDIs automáticos
    console.log("📚 Gerando PDIs automáticos...");
    for (let i = 0; i < evaluationIds.length; i++) {
      const evaluationId = evaluationIds[i];
      const empData = EMPLOYEES_DATA[i];

      const result = await db.generateAutomaticPDI(evaluationId);
      console.log(`  ✅ PDI gerado para ${empData.name}: ${result.actionsCreated} ações criadas`);
    }

    console.log();

    // 11. Calcular quartis
    console.log("📊 Calculando quartis...");
    const quartiles = await db.calculateCycleQuartiles(cycle.id);
    console.log(`  ✅ Quartis calculados:`);
    console.log(`     Q1: ${quartiles.q1}`);
    console.log(`     Q2 (Mediana): ${quartiles.q2}`);
    console.log(`     Q3: ${quartiles.q3}`);
    console.log(`     Q4 (Máximo): ${quartiles.q4}`);

    console.log();

    // 12. Resumo final
    console.log("=" .repeat(60));
    console.log("🎉 CICLO COMPLETO EXECUTADO COM SUCESSO!");
    console.log("=" .repeat(60));
    console.log(`\n📊 Resumo:`);
    console.log(`   • Ciclo ID: ${cycle.id}`);
    console.log(`   • Funcionários: ${employeeIds.length}`);
    console.log(`   • Avaliações criadas: ${evaluationIds.length}`);
    console.log(`   • Emails enviados: ${EMPLOYEES_DATA.length}`);
    console.log(`   • PDIs gerados: ${evaluationIds.length}`);
    console.log(`\n🔗 Links úteis:`);
    console.log(`   • Dashboard PIR: https://avduisa-sys-vd5bj8to.manus.space/pir/dashboard`);
    console.log(`   • Perfis dos funcionários:`);
    for (let i = 0; i < employeeIds.length; i++) {
      console.log(`     - ${EMPLOYEES_DATA[i].name}: https://avduisa-sys-vd5bj8to.manus.space/desenvolvimento/funcionarios/${employeeIds[i]}`);
    }
    console.log();

    return {
      success: true,
      cycleId: cycle.id,
      employeeIds,
      evaluationIds,
      quartiles,
    };
  } catch (error) {
    console.error("❌ Erro ao executar ciclo completo:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteCycle()
    .then(() => {
      console.log("\n✅ Script concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script falhou:", error);
      process.exit(1);
    });
}

export { runCompleteCycle };
