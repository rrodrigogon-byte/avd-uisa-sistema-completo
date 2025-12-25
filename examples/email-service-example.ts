/**
 * Exemplos de Uso do EmailService V2
 * Sistema AVD UISA
 * 
 * Este arquivo demonstra como usar o EmailService para enviar
 * diferentes tipos de e-mails no sistema.
 */

import {
  EmailService,
  getEmailService,
  sendPDIActionOverdueEmail,
  getPDIActionOverdueTemplate,
  getWelcomeTemplate
} from '../src/utils/email-service-v2';

// ============================================
// EXEMPLO 1: Envio Simples de E-mail
// ============================================

async function exemploEnvioSimples() {
  console.log('📧 Exemplo 1: Envio Simples de E-mail\n');

  const emailService = getEmailService();

  // Verificar se o serviço está funcionando
  const isWorking = await emailService.verify();
  console.log(`Serviço de e-mail: ${isWorking ? '✅ OK' : '❌ Falhou'}\n`);

  // Enviar e-mail simples
  const result = await emailService.sendEmail(
    {
      to: 'colaborador@uisa.com.br',
      subject: 'Teste de E-mail',
      html: '<h1>Olá!</h1><p>Este é um e-mail de teste.</p>'
    },
    'test'
  );

  console.log('Resultado:', result);
  console.log('---\n');
}

// ============================================
// EXEMPLO 2: E-mail de Ação de PDI Vencida
// ============================================

async function exemploAcaoPDIVencida() {
  console.log('📧 Exemplo 2: E-mail de Ação de PDI Vencida\n');

  const result = await sendPDIActionOverdueEmail({
    employeeEmail: 'joao.silva@uisa.com.br',
    employeeName: 'João Silva',
    actionTitle: 'Curso de Liderança Estratégica',
    actionDescription: 'Completar o curso online de Liderança Estratégica na plataforma Coursera',
    dueDate: '15/11/2025',
    daysOverdue: 2,
    managerName: 'Maria Santos',
    managerEmail: 'maria.santos@uisa.com.br',
    pdiUrl: 'https://avd.uisa.com.br/pdi/12345'
  });

  console.log('✅ E-mail enviado com sucesso!');
  console.log(`   Message ID: ${result.messageId}`);
  console.log(`   Tentativas: ${result.attempts}`);
  console.log(`   Tempo de entrega: ${result.deliveryTime}ms`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 3: E-mail de Boas-Vindas
// ============================================

async function exemploBemVindo() {
  console.log('📧 Exemplo 3: E-mail de Boas-Vindas\n');

  const emailService = getEmailService();

  const html = getWelcomeTemplate({
    userName: 'Pedro Oliveira',
    email: 'pedro.oliveira@uisa.com.br',
    temporaryPassword: 'Temp@2025!abc',
    loginUrl: 'https://avd.uisa.com.br/login'
  });

  const result = await emailService.sendEmail(
    {
      to: 'pedro.oliveira@uisa.com.br',
      subject: '🎉 Bem-vindo ao Sistema AVD UISA!',
      html
    },
    'welcome'
  );

  console.log('✅ E-mail de boas-vindas enviado!');
  console.log(`   Message ID: ${result.messageId}`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 4: Envio em Lote
// ============================================

async function exemploEnvioLote() {
  console.log('📧 Exemplo 4: Envio em Lote\n');

  const emailService = getEmailService();

  const emails = [
    {
      options: {
        to: 'usuario1@uisa.com.br',
        subject: 'Lembrete de Meta',
        html: '<p>Sua meta vence em 7 dias!</p>'
      },
      type: 'goal_reminder'
    },
    {
      options: {
        to: 'usuario2@uisa.com.br',
        subject: 'Lembrete de Meta',
        html: '<p>Sua meta vence em 7 dias!</p>'
      },
      type: 'goal_reminder'
    },
    {
      options: {
        to: 'usuario3@uisa.com.br',
        subject: 'Lembrete de Meta',
        html: '<p>Sua meta vence em 7 dias!</p>'
      },
      type: 'goal_reminder'
    }
  ];

  const results = await emailService.sendBatch(emails);

  console.log(`✅ ${results.filter(r => r.success).length}/${results.length} e-mails enviados com sucesso!`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 5: Estatísticas de Envio
// ============================================

async function exemploEstatisticas() {
  console.log('📧 Exemplo 5: Estatísticas de Envio\n');

  const emailService = getEmailService();

  // Enviar alguns e-mails primeiro
  await emailService.sendEmail(
    {
      to: 'teste1@uisa.com.br',
      subject: 'Teste 1',
      html: '<p>Teste</p>'
    },
    'test'
  );

  await emailService.sendEmail(
    {
      to: 'teste2@uisa.com.br',
      subject: 'Teste 2',
      html: '<p>Teste</p>'
    },
    'test'
  );

  // Obter estatísticas
  const stats = emailService.getStats();

  console.log('📊 Estatísticas de Envio:');
  console.log(`   Total de e-mails: ${stats.total}`);
  console.log(`   Bem-sucedidos: ${stats.successful}`);
  console.log(`   Falhados: ${stats.failed}`);
  console.log(`   Taxa de sucesso: ${stats.successRate.toFixed(2)}%`);
  console.log(`   Tempo médio de entrega: ${stats.avgDeliveryTime}ms`);
  console.log(`   Fila de falhas: ${stats.failedQueueSize}`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 6: Retry de E-mails Falhados
// ============================================

async function exemploRetryFalhados() {
  console.log('📧 Exemplo 6: Retry de E-mails Falhados\n');

  const emailService = getEmailService();

  // Simular envio que pode falhar
  await emailService.sendEmail(
    {
      to: 'email-invalido@dominio-inexistente.com',
      subject: 'Teste de Falha',
      html: '<p>Este e-mail pode falhar</p>'
    },
    'test'
  );

  // Tentar reenviar e-mails falhados
  console.log('🔄 Tentando reenviar e-mails falhados...');
  const results = await emailService.retryFailed();

  console.log(`   ${results.filter(r => r.success).length}/${results.length} e-mails reenviados com sucesso`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 7: E-mail com Anexo
// ============================================

async function exemploComAnexo() {
  console.log('📧 Exemplo 7: E-mail com Anexo\n');

  const emailService = getEmailService();

  const result = await emailService.sendEmail(
    {
      to: 'colaborador@uisa.com.br',
      subject: 'Relatório de Desempenho',
      html: '<h2>Relatório de Desempenho</h2><p>Segue em anexo seu relatório de desempenho do último trimestre.</p>',
      attachments: [
        {
          filename: 'relatorio-q4-2025.pdf',
          path: '/path/to/relatorio.pdf' // ou use 'content' com Buffer
        }
      ]
    },
    'performance_report'
  );

  console.log('✅ E-mail com anexo enviado!');
  console.log(`   Message ID: ${result.messageId}`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 8: E-mail com Cópia (CC e BCC)
// ============================================

async function exemploComCopia() {
  console.log('📧 Exemplo 8: E-mail com Cópia (CC e BCC)\n');

  const emailService = getEmailService();

  const result = await emailService.sendEmail(
    {
      to: 'colaborador@uisa.com.br',
      cc: 'gestor@uisa.com.br', // Cópia visível
      bcc: 'rh@uisa.com.br', // Cópia oculta
      subject: 'Feedback de Desempenho',
      html: '<h2>Feedback de Desempenho</h2><p>Parabéns pelo excelente trabalho!</p>'
    },
    'feedback'
  );

  console.log('✅ E-mail com cópias enviado!');
  console.log(`   Para: colaborador@uisa.com.br`);
  console.log(`   CC: gestor@uisa.com.br`);
  console.log(`   BCC: rh@uisa.com.br`);
  console.log('---\n');
}

// ============================================
// EXEMPLO 9: Job Agendado (Cron)
// ============================================

/**
 * Este exemplo mostra como criar um job agendado para enviar
 * lembretes de PDI diariamente às 9h da manhã.
 * 
 * Para usar em produção, configure no wrangler.toml:
 * 
 * [[triggers.crons]]
 * cron = "0 9 * * *"  # Todo dia às 9h
 */
async function jobLembretesPDI() {
  console.log('📧 Exemplo 9: Job Agendado - Lembretes de PDI\n');

  // Buscar ações de PDI vencidas (exemplo)
  const acoesVencidas = [
    {
      employeeEmail: 'joao.silva@uisa.com.br',
      employeeName: 'João Silva',
      actionTitle: 'Curso de Excel Avançado',
      actionDescription: 'Completar curso de Excel Avançado',
      dueDate: '10/11/2025',
      daysOverdue: 7,
      managerName: 'Maria Santos',
      managerEmail: 'maria.santos@uisa.com.br',
      pdiUrl: 'https://avd.uisa.com.br/pdi/12345'
    },
    {
      employeeEmail: 'ana.costa@uisa.com.br',
      employeeName: 'Ana Costa',
      actionTitle: 'Workshop de Comunicação',
      actionDescription: 'Participar do workshop de comunicação assertiva',
      dueDate: '12/11/2025',
      daysOverdue: 5,
      managerName: 'Carlos Pereira',
      managerEmail: 'carlos.pereira@uisa.com.br',
      pdiUrl: 'https://avd.uisa.com.br/pdi/67890'
    }
  ];

  console.log(`📋 Encontradas ${acoesVencidas.length} ações vencidas`);
  console.log('📤 Enviando lembretes...\n');

  for (const acao of acoesVencidas) {
    const result = await sendPDIActionOverdueEmail(acao);
    
    if (result.success) {
      console.log(`   ✅ ${acao.employeeName} - ${acao.actionTitle}`);
    } else {
      console.log(`   ❌ ${acao.employeeName} - Falhou: ${result.error}`);
    }
  }

  console.log('\n✅ Job de lembretes concluído!');
  console.log('---\n');
}

// ============================================
// EXEMPLO 10: Métricas Detalhadas
// ============================================

async function exemploMetricasDetalhadas() {
  console.log('📧 Exemplo 10: Métricas Detalhadas\n');

  const emailService = getEmailService();

  // Enviar alguns e-mails
  await emailService.sendEmail(
    { to: 'teste1@uisa.com.br', subject: 'Teste 1', html: '<p>Teste 1</p>' },
    'test'
  );

  await emailService.sendEmail(
    { to: 'teste2@uisa.com.br', subject: 'Teste 2', html: '<p>Teste 2</p>' },
    'welcome'
  );

  await emailService.sendEmail(
    { to: 'teste3@uisa.com.br', subject: 'Teste 3', html: '<p>Teste 3</p>' },
    'pdi_action_overdue'
  );

  // Obter métricas detalhadas
  const metrics = emailService.getMetrics();

  console.log('📊 Métricas Detalhadas:\n');
  
  metrics.forEach((metric, index) => {
    console.log(`${index + 1}. ${metric.type}`);
    console.log(`   Para: ${metric.to}`);
    console.log(`   Status: ${metric.success ? '✅ Sucesso' : '❌ Falhou'}`);
    console.log(`   Tempo: ${metric.deliveryTime}ms`);
    console.log(`   Enviado em: ${metric.sentAt.toLocaleString('pt-BR')}`);
    if (metric.messageId) {
      console.log(`   Message ID: ${metric.messageId}`);
    }
    if (metric.error) {
      console.log(`   Erro: ${metric.error}`);
    }
    console.log();
  });

  console.log('---\n');
}

// ============================================
// EXECUTAR TODOS OS EXEMPLOS
// ============================================

async function executarTodosExemplos() {
  console.log('='.repeat(60));
  console.log('EXEMPLOS DE USO DO EMAIL SERVICE V2');
  console.log('Sistema AVD UISA');
  console.log('='.repeat(60));
  console.log();

  try {
    await exemploEnvioSimples();
    await exemploAcaoPDIVencida();
    await exemploBemVindo();
    await exemploEnvioLote();
    await exemploEstatisticas();
    await exemploRetryFalhados();
    await exemploComAnexo();
    await exemploComCopia();
    await jobLembretesPDI();
    await exemploMetricasDetalhadas();

    console.log('='.repeat(60));
    console.log('✅ TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  executarTodosExemplos();
}

// Exportar funções para uso em outros arquivos
export {
  exemploEnvioSimples,
  exemploAcaoPDIVencida,
  exemploBemVindo,
  exemploEnvioLote,
  exemploEstatisticas,
  exemploRetryFalhados,
  exemploComAnexo,
  exemploComCopia,
  jobLembretesPDI,
  exemploMetricasDetalhadas,
  executarTodosExemplos
};
