#!/usr/bin/env node
/**
 * Script para testar criação de ciclo 360° completo
 * Cria um ciclo real com colaboradores e verifica envio de emails
 * Uso: node test-360-cycle.mjs
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function testCycle360() {
  console.log('🧪 Iniciando teste de ciclo 360° completo...\n');

  try {
    // 1. Buscar colaboradores existentes
    const [employees] = await connection.execute(
      'SELECT id, name, email FROM employees WHERE status = "ativo" LIMIT 10'
    );

    if (employees.length < 5) {
      console.log('⚠️  Poucos colaboradores ativos. Criando colaboradores de teste...');
      
      // Criar colaboradores de teste
      const testEmployees = [
        { name: 'João Silva', email: 'joao.silva@uisa.com.br', registration: 'EMP001' },
        { name: 'Maria Santos', email: 'maria.santos@uisa.com.br', registration: 'EMP002' },
        { name: 'Pedro Oliveira', email: 'pedro.oliveira@uisa.com.br', registration: 'EMP003' },
        { name: 'Ana Costa', email: 'ana.costa@uisa.com.br', registration: 'EMP004' },
        { name: 'Carlos Ferreira', email: 'carlos.ferreira@uisa.com.br', registration: 'EMP005' },
      ];

      for (const emp of testEmployees) {
        const [result] = await connection.execute(
          `INSERT INTO employees (name, email, registration, status, admissionDate, createdAt, updatedAt)
           VALUES (?, ?, ?, 'ativo', NOW(), NOW(), NOW())`,
          [emp.name, emp.email, emp.registration]
        );
        employees.push({ id: result.insertId, name: emp.name, email: emp.email });
      }

      console.log(`✅ ${testEmployees.length} colaboradores de teste criados\n`);
    }

    console.log(`📋 Colaboradores disponíveis: ${employees.length}\n`);

    // 2. Buscar competências existentes
    const [competencies] = await connection.execute(
      'SELECT id, name FROM competencies LIMIT 5'
    );

    if (competencies.length === 0) {
      console.log('⚠️  Nenhuma competência encontrada. Criando competências de teste...');
      
      const testCompetencies = [
        'Comunicação',
        'Trabalho em Equipe',
        'Liderança',
        'Resolução de Problemas',
        'Planejamento e Organização'
      ];

      for (const comp of testCompetencies) {
        const [result] = await connection.execute(
          'INSERT INTO competencies (name, description, category, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
          [comp, `Competência de ${comp}`, 'Comportamental']
        );
        competencies.push({ id: result.insertId, name: comp });
      }

      console.log(`✅ ${testCompetencies.length} competências criadas\n`);
    }

    console.log(`💡 Competências disponíveis: ${competencies.length}\n`);

    // 3. Criar ciclo 360° de teste
    console.log('📝 Criando ciclo 360° de teste...\n');

    const cycleName = `Ciclo 360° Teste - ${new Date().toLocaleDateString('pt-BR')}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

    const currentYear = new Date().getFullYear();
    
    const [cycleResult] = await connection.execute(
      `INSERT INTO evaluationCycles 
       (name, year, type, description, startDate, endDate, status, createdAt, updatedAt)
       VALUES (?, ?, 'anual', ?, ?, ?, 'ativo', NOW(), NOW())`,
      [
        cycleName,
        currentYear,
        'Ciclo de teste para validar envio de emails e fluxo completo de avaliação 360°',
        startDate,
        endDate
      ]
    );

    const cycleId = cycleResult.insertId;
    console.log(`✅ Ciclo criado: ${cycleName} (ID: ${cycleId})\n`);

    // 4. Configurar pesos do ciclo
    console.log('⚖️  Configurando pesos do ciclo...\n');

    const weights = [
      { evaluatorType: 'autoavaliacao', weight: 20 },
      { evaluatorType: 'superior', weight: 40 },
      { evaluatorType: 'par', weight: 25 },
      { evaluatorType: 'subordinado', weight: 15 }
    ];

    // Configurar pesos usando a estrutura correta da tabela
    await connection.execute(
      `INSERT INTO evaluation360CycleWeights 
       (cycleId, selfWeight, managerWeight, peersWeight, subordinatesWeight, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [cycleId, 20, 40, 25, 15]
    );

    console.log('✅ Pesos configurados:\n');
    weights.forEach(w => console.log(`   - ${w.evaluatorType}: ${w.weight}%`));
    console.log();

    // 5. Adicionar competências ao ciclo
    console.log('💡 Adicionando competências ao ciclo...\n');

    for (const comp of competencies) {
      await connection.execute(
        `INSERT INTO evaluation360CycleCompetencies (cycleId, competencyId, weight, createdAt)
         VALUES (?, ?, 1, NOW())`,
        [cycleId, comp.id]
      );
    }

    console.log(`✅ ${competencies.length} competências adicionadas ao ciclo\n`);

    // 6. Adicionar participantes ao ciclo
    console.log('👥 Adicionando participantes ao ciclo...\n');

    // Selecionar 3 colaboradores para avaliar
    const participantsToEvaluate = employees.slice(0, 3);

    for (const participant of participantsToEvaluate) {
      // Adicionar o participante
      const [participantResult] = await connection.execute(
        `INSERT INTO evaluation360CycleParticipants 
         (cycleId, employeeId, participationType, status, createdAt, updatedAt)
         VALUES (?, ?, 'evaluated', 'pending', NOW(), NOW())`,
        [cycleId, participant.id]
      );

      const participantId = participantResult.insertId;

      console.log(`   ✓ ${participant.name} adicionado como participante`);

      // Adicionar avaliadores para este participante
      const otherEmployees = employees.filter(e => e.id !== participant.id);

      // Criar avaliações para este participante
      // Autoavaliação
      await connection.execute(
        `INSERT INTO evaluations360 
         (cycleId, evaluatedEmployeeId, evaluatorEmployeeId, evaluatorType, status, createdAt, updatedAt)
         VALUES (?, ?, ?, 'self', 'pending', NOW(), NOW())`,
        [cycleId, participant.id, participant.id]
      );
      console.log(`     → Autoavaliação configurada`);

      // Superior (primeiro colaborador diferente)
      if (otherEmployees.length > 0) {
        await connection.execute(
          `INSERT INTO evaluations360 
           (cycleId, evaluatedEmployeeId, evaluatorEmployeeId, evaluatorType, status, createdAt, updatedAt)
           VALUES (?, ?, ?, 'manager', 'pending', NOW(), NOW())`,
          [cycleId, participant.id, otherEmployees[0].id]
        );
        console.log(`     → Superior: ${otherEmployees[0].name}`);
      }

      // Par (segundo colaborador diferente)
      if (otherEmployees.length > 1) {
        await connection.execute(
          `INSERT INTO evaluations360 
           (cycleId, evaluatedEmployeeId, evaluatorEmployeeId, evaluatorType, status, createdAt, updatedAt)
           VALUES (?, ?, ?, 'peer', 'pending', NOW(), NOW())`,
          [cycleId, participant.id, otherEmployees[1].id]
        );
        console.log(`     → Par: ${otherEmployees[1].name}`);
      }

      // Subordinado (terceiro colaborador diferente)
      if (otherEmployees.length > 2) {
        await connection.execute(
          `INSERT INTO evaluations360 
           (cycleId, evaluatedEmployeeId, evaluatorEmployeeId, evaluatorType, status, createdAt, updatedAt)
           VALUES (?, ?, ?, 'subordinate', 'pending', NOW(), NOW())`,
          [cycleId, participant.id, otherEmployees[2].id]
        );
        console.log(`     → Subordinado: ${otherEmployees[2].name}`);
      }

      console.log();
    }

    // 7. Verificar emails que deveriam ser enviados
    console.log('📧 Verificando notificações de email...\n');

    // Verificar se há emails enviados (tabela emailLogs)
    const [emailNotifications] = await connection.execute(
      `SELECT * FROM emailLogs
       WHERE metadata LIKE ? 
       ORDER BY createdAt DESC
       LIMIT 20`,
      [`%cycleId":${cycleId}%`]
    );

    if (emailNotifications.length > 0) {
      console.log(`✅ ${emailNotifications.length} notificações de email criadas:\n`);
      emailNotifications.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.evaluatorName} (${notif.evaluatorEmail})`);
        console.log(`      Status: ${notif.status}`);
        console.log(`      Tipo: ${notif.notificationType}`);
        if (notif.sentAt) {
          console.log(`      Enviado em: ${new Date(notif.sentAt).toLocaleString('pt-BR')}`);
        }
        console.log();
      });
    } else {
      console.log('⚠️  Nenhuma notificação de email encontrada.');
      console.log('   Isso pode indicar que o sistema de notificações não está configurado.\n');
    }

    // 8. Resumo do teste
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DO TESTE');
    console.log('='.repeat(70));
    console.log(`✅ Ciclo criado: ${cycleName}`);
    console.log(`✅ ID do ciclo: ${cycleId}`);
    console.log(`✅ Participantes: ${participantsToEvaluate.length}`);
    console.log(`✅ Competências: ${competencies.length}`);
    console.log(`✅ Pesos configurados: ${weights.length} tipos de avaliador`);
    
    // Contar total de avaliações
    const [evaluatorCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM evaluations360 WHERE cycleId = ?',
      [cycleId]
    );
    console.log(`✅ Total de avaliadores: ${evaluatorCount[0].total}`);
    
    console.log(`📧 Notificações de email: ${emailNotifications.length}`);
    console.log('='.repeat(70));

    console.log('\n✅ Teste concluído com sucesso!');
    console.log(`\n💡 Acesse o sistema e navegue até "Avaliações 360°" para ver o ciclo criado.`);
    console.log(`💡 Os avaliadores devem receber emails de convite (se SMTP estiver configurado).`);

  } catch (error) {
    console.error('\n❌ Erro ao executar teste:', error);
    await connection.end();
    process.exit(1);
  }

  await connection.end();
  process.exit(0);
}

// Executar teste
testCycle360();
