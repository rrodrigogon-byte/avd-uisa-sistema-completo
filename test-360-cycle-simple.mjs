#!/usr/bin/env node
/**
 * Script simplificado para testar criação de ciclo 360°
 * Adaptado à estrutura real do banco de dados
 * Uso: node test-360-cycle-simple.mjs
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function testCycle360Simple() {
  console.log('🧪 Iniciando teste simplificado de ciclo 360°...\n');

  try {
    // 1. Buscar colaboradores existentes
    const [employees] = await connection.execute(
      'SELECT id, name, email FROM employees WHERE status = "ativo" LIMIT 5'
    );

    console.log(`📋 Colaboradores disponíveis: ${employees.length}\n`);

    if (employees.length < 3) {
      console.log('⚠️  Poucos colaboradores. Mínimo de 3 necessários para teste.');
      await connection.end();
      process.exit(1);
    }

    // 2. Buscar competências existentes
    const [competencies] = await connection.execute(
      'SELECT id, name FROM competencies LIMIT 5'
    );

    console.log(`💡 Competências disponíveis: ${competencies.length}\n`);

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

    // 3. Criar ciclo de avaliação
    console.log('📝 Criando ciclo de avaliação...\n');

    const cycleName = `Ciclo 360° Teste - ${new Date().toLocaleDateString('pt-BR')}`;
    const currentYear = new Date().getFullYear();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const [cycleResult] = await connection.execute(
      `INSERT INTO evaluationCycles 
       (name, year, type, description, startDate, endDate, status, createdAt, updatedAt)
       VALUES (?, ?, 'anual', ?, ?, ?, 'ativo', NOW(), NOW())`,
      [
        cycleName,
        currentYear,
        'Ciclo de teste para validar estrutura e fluxo de avaliação 360°',
        startDate,
        endDate
      ]
    );

    const cycleId = cycleResult.insertId;
    console.log(`✅ Ciclo criado: ${cycleName}`);
    console.log(`✅ ID do ciclo: ${cycleId}\n`);

    // 4. Configurar pesos do ciclo
    console.log('⚖️  Configurando pesos do ciclo...\n');

    await connection.execute(
      `INSERT INTO evaluation360CycleWeights 
       (cycleId, selfWeight, managerWeight, peersWeight, subordinatesWeight, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [cycleId, 20, 40, 25, 15]
    );

    console.log('✅ Pesos configurados:');
    console.log('   - Autoavaliação: 20%');
    console.log('   - Gestor: 40%');
    console.log('   - Pares: 25%');
    console.log('   - Subordinados: 15%\n');

    // 5. Adicionar competências ao ciclo
    console.log('💡 Adicionando competências ao ciclo...\n');

    for (const comp of competencies) {
      await connection.execute(
        `INSERT INTO evaluation360CycleCompetencies (cycleId, competencyId, weight, createdAt)
         VALUES (?, ?, 1, NOW())`,
        [cycleId, comp.id]
      );
    }

    console.log(`✅ ${competencies.length} competências adicionadas\n`);

    // 6. Adicionar participantes ao ciclo
    console.log('👥 Adicionando participantes ao ciclo...\n');

    const participantsToAdd = employees.slice(0, 3);

    for (const emp of participantsToAdd) {
      // Adicionar como participante avaliado
      await connection.execute(
        `INSERT INTO evaluation360CycleParticipants 
         (cycleId, employeeId, participationType, status, createdAt, updatedAt)
         VALUES (?, ?, 'evaluated', 'pending', NOW(), NOW())`,
        [cycleId, emp.id]
      );

      console.log(`   ✓ ${emp.name} (${emp.email})`);
    }

    console.log();

    // 7. Verificar estrutura criada
    console.log('🔍 Verificando estrutura criada...\n');

    const [weights] = await connection.execute(
      'SELECT * FROM evaluation360CycleWeights WHERE cycleId = ?',
      [cycleId]
    );

    const [cycleCompetencies] = await connection.execute(
      'SELECT * FROM evaluation360CycleCompetencies WHERE cycleId = ?',
      [cycleId]
    );

    const [participants] = await connection.execute(
      'SELECT * FROM evaluation360CycleParticipants WHERE cycleId = ?',
      [cycleId]
    );

    console.log(`✅ Pesos configurados: ${weights.length}`);
    console.log(`✅ Competências vinculadas: ${cycleCompetencies.length}`);
    console.log(`✅ Participantes adicionados: ${participants.length}\n`);

    // 8. Nota sobre notificações
    console.log('📧 Sistema de notificações:\n');
    console.log('ℹ️  Os emails de convite serão enviados automaticamente quando:');
    console.log('   1. O SMTP estiver configurado em /admin/smtp');
    console.log('   2. O ciclo for ativado/iniciado');
    console.log('   3. Os participantes forem confirmados\n');

    // 9. Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DO TESTE');
    console.log('='.repeat(70));
    console.log(`✅ Ciclo: ${cycleName}`);
    console.log(`✅ ID: ${cycleId}`);
    console.log(`✅ Status: ativo`);
    console.log(`✅ Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);
    console.log(`✅ Participantes: ${participants.length}`);
    console.log(`✅ Competências: ${cycleCompetencies.length}`);
    console.log(`✅ Pesos configurados: Sim`);
    console.log('='.repeat(70));

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse o sistema web');
    console.log('   2. Navegue até "Avaliações 360°"');
    console.log('   3. Localize o ciclo criado');
    console.log('   4. Configure SMTP para envio de emails automáticos');
    console.log('   5. Teste o preenchimento de avaliações\n');

  } catch (error) {
    console.error('\n❌ Erro ao executar teste:', error);
    await connection.end();
    process.exit(1);
  }

  await connection.end();
  process.exit(0);
}

// Executar teste
testCycle360Simple();
