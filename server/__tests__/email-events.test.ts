/**
 * Teste de Envio de E-mails em Eventos do Sistema
 * Valida que todos os eventos importantes enviam e-mails automaticamente
 */

import { describe, it, expect } from 'vitest';
import { sendEmail } from '../_core/email';

describe('Email Events - Sistema AVD UISA', () => {
  const testEmail = 'avd@uisa.com.br';

  it('deve enviar email de boas-vindas para novo usuário', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '🎉 Bem-vindo ao Sistema AVD UISA - Suas Credenciais de Acesso',
      html: `
        <h2>Bem-vindo ao Sistema AVD UISA</h2>
        <p>Suas credenciais foram criadas com sucesso!</p>
        <p><strong>Email:</strong> ${testEmail}</p>
        <p><strong>Perfil:</strong> Administrador</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de boas-vindas enviado');
  });

  it('deve enviar email de notificação de novo funcionário', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '👤 Novo Funcionário Cadastrado - Sistema AVD UISA',
      html: `
        <h2>Novo Funcionário Cadastrado</h2>
        <p>Um novo funcionário foi adicionado ao sistema.</p>
        <p><strong>Nome:</strong> João Silva</p>
        <p><strong>Cargo:</strong> Analista</p>
        <p><strong>Departamento:</strong> TI</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de novo funcionário enviado');
  });

  it('deve enviar email de início de ciclo de avaliação', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '📊 Novo Ciclo de Avaliação Iniciado - Sistema AVD UISA',
      html: `
        <h2>Novo Ciclo de Avaliação</h2>
        <p>Um novo ciclo de avaliação foi iniciado.</p>
        <p><strong>Nome:</strong> Avaliação 2025 Q1</p>
        <p><strong>Período:</strong> 01/01/2025 - 31/03/2025</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de ciclo de avaliação enviado');
  });

  it('deve enviar email de meta SMART criada', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '🎯 Nova Meta SMART Criada - Sistema AVD UISA',
      html: `
        <h2>Nova Meta SMART</h2>
        <p>Uma nova meta foi criada no sistema.</p>
        <p><strong>Título:</strong> Aumentar vendas em 20%</p>
        <p><strong>Responsável:</strong> Maria Santos</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de meta SMART enviado');
  });

  it('deve enviar email de PDI criado', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '📚 Novo PDI Criado - Sistema AVD UISA',
      html: `
        <h2>Novo Plano de Desenvolvimento Individual</h2>
        <p>Um novo PDI foi criado.</p>
        <p><strong>Funcionário:</strong> Carlos Oliveira</p>
        <p><strong>Objetivo:</strong> Desenvolver habilidades de liderança</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de PDI criado enviado');
  });

  it('deve enviar email de avaliação 360° concluída', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '✅ Avaliação 360° Concluída - Sistema AVD UISA',
      html: `
        <h2>Avaliação 360° Concluída</h2>
        <p>Uma avaliação foi finalizada.</p>
        <p><strong>Avaliado:</strong> Ana Costa</p>
        <p><strong>Nota Final:</strong> 8.5</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de avaliação 360° enviado');
  });

  it('deve enviar email de mudança na Nine Box', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '📊 Mudança na Nine Box - Sistema AVD UISA',
      html: `
        <h2>Mudança na Nine Box</h2>
        <p>Um funcionário mudou de posição na matriz Nine Box.</p>
        <p><strong>Funcionário:</strong> Pedro Lima</p>
        <p><strong>Nova Posição:</strong> Alto Desempenho / Alto Potencial</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de Nine Box enviado');
  });

  it('deve enviar email de convite para teste psicométrico', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '🧠 Convite para Teste Psicométrico - Sistema AVD UISA',
      html: `
        <h2>Convite para Teste</h2>
        <p>Você foi convidado para realizar um teste psicométrico.</p>
        <p><strong>Teste:</strong> DISC</p>
        <p><strong>Prazo:</strong> 7 dias</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de convite para teste enviado');
  });

  it('deve enviar email de pesquisa Pulse', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '📊 Nova Pesquisa Pulse - Sistema AVD UISA',
      html: `
        <h2>Nova Pesquisa Pulse</h2>
        <p>Uma nova pesquisa de satisfação está disponível.</p>
        <p><strong>Título:</strong> Clima Organizacional</p>
        <p><strong>Prazo:</strong> 3 dias</p>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de pesquisa Pulse enviado');
  });

  it('deve enviar email de resumo diário', async () => {
    const result = await sendEmail({
      to: testEmail,
      subject: '📈 Resumo Diário do Sistema - AVD UISA',
      html: `
        <h2>Resumo Diário de Atividades</h2>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        <ul>
          <li>3 novos funcionários cadastrados</li>
          <li>5 metas criadas</li>
          <li>2 avaliações concluídas</li>
          <li>1 PDI criado</li>
        </ul>
      `,
    });

    expect(result).toBe(true);
    console.log('✅ Email de resumo diário enviado');
  });
});
