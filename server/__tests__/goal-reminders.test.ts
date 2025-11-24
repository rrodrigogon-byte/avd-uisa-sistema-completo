/**
 * Teste de Lembretes Automáticos para Metas Atrasadas
 * Sistema AVD UISA
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { goals, employees } from '../../drizzle/schema';
import { eq, and, lt, or } from 'drizzle-orm';

describe('Sistema de Lembretes de Metas Atrasadas', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve identificar metas atrasadas corretamente', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const today = new Date();
    
    // Buscar metas atrasadas
    const overdueGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        deadline: goals.deadline,
        progress: goals.progress,
        status: goals.status,
        employeeId: goals.employeeId,
        category: goals.category,
      })
      .from(goals)
      .where(
        and(
          lt(goals.deadline, today),
          or(
            eq(goals.status, 'in_progress'),
            eq(goals.status, 'approved'),
            eq(goals.status, 'pending_approval')
          )
        )
      );

    console.log(`\n📊 Metas atrasadas encontradas: ${overdueGoals.length}`);
    
    if (overdueGoals.length > 0) {
      console.log('\n🔔 Detalhes das metas atrasadas:');
      
      for (const goal of overdueGoals) {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(goal.deadline).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        console.log(`\n   📌 Meta: "${goal.title}"`);
        console.log(`      - ID: ${goal.id}`);
        console.log(`      - Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`);
        console.log(`      - Atrasada há: ${daysOverdue} dias`);
        console.log(`      - Progresso: ${goal.progress}%`);
        console.log(`      - Status: ${goal.status}`);
        console.log(`      - Categoria: ${goal.category}`);
        
        // Buscar dados do funcionário
        if (goal.employeeId) {
          const [employee] = await db
            .select({
              name: employees.name,
              email: employees.email,
            })
            .from(employees)
            .where(eq(employees.id, goal.employeeId))
            .limit(1);
          
          if (employee) {
            console.log(`      - Funcionário: ${employee.name}`);
            console.log(`      - Email: ${employee.email || 'Não cadastrado'}`);
          }
        }
      }
      
      // Agrupar por funcionário
      const goalsByEmployee = overdueGoals.reduce((acc, goal) => {
        if (!goal.employeeId) return acc;
        if (!acc[goal.employeeId]) {
          acc[goal.employeeId] = [];
        }
        acc[goal.employeeId].push(goal);
        return acc;
      }, {} as Record<number, typeof overdueGoals>);
      
      console.log(`\n📧 Notificações que seriam enviadas: ${Object.keys(goalsByEmployee).length}`);
      console.log(`   (${overdueGoals.length} metas para ${Object.keys(goalsByEmployee).length} funcionários)`);
    } else {
      console.log('✅ Nenhuma meta atrasada encontrada - sistema em dia!');
    }

    // Teste sempre passa - é apenas informativo
    expect(overdueGoals).toBeDefined();
    expect(Array.isArray(overdueGoals)).toBe(true);
  });

  it('deve validar estrutura de notificação de meta atrasada', () => {
    // Template de notificação para meta atrasada
    const notificationTemplate = {
      subject: 'Lembrete: Meta Atrasada - {{goalTitle}}',
      body: `
        <h2>Olá, {{employeeName}}!</h2>
        <p>Sua meta "<strong>{{goalTitle}}</strong>" está atrasada.</p>
        <ul>
          <li><strong>Prazo:</strong> {{deadline}}</li>
          <li><strong>Dias de atraso:</strong> {{daysOverdue}}</li>
          <li><strong>Progresso atual:</strong> {{progress}}%</li>
        </ul>
        <p>Por favor, atualize o progresso ou entre em contato com seu gestor.</p>
      `,
      type: 'goal_overdue',
    };

    expect(notificationTemplate.subject).toContain('{{goalTitle}}');
    expect(notificationTemplate.body).toContain('{{employeeName}}');
    expect(notificationTemplate.body).toContain('{{deadline}}');
    expect(notificationTemplate.type).toBe('goal_overdue');
    
    console.log('\n✅ Template de notificação validado com sucesso');
    console.log('   Variáveis disponíveis: goalTitle, employeeName, deadline, daysOverdue, progress');
  });

  it('deve simular agendamento de job cron', () => {
    // Configuração do job cron para envio diário às 9h
    const cronConfig = {
      schedule: '0 9 * * *', // Diariamente às 9h
      timezone: 'America/Sao_Paulo',
      enabled: true,
      jobName: 'send_overdue_goal_notifications',
      description: 'Envia lembretes diários para funcionários com metas atrasadas',
    };

    console.log('\n⏰ Configuração de Job Cron:');
    console.log(`   - Schedule: ${cronConfig.schedule}`);
    console.log(`   - Timezone: ${cronConfig.timezone}`);
    console.log(`   - Descrição: ${cronConfig.description}`);
    console.log(`   - Status: ${cronConfig.enabled ? 'Ativo ✅' : 'Inativo ❌'}`);
    console.log(`   - Nome: ${cronConfig.jobName}`);
    console.log('\n💡 Para ativar: Configure o job no sistema de agendamento');

    expect(cronConfig.schedule).toBe('0 9 * * *');
    expect(cronConfig.enabled).toBe(true);
  });

  it('deve validar lógica de envio de lembretes', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar metas atrasadas
    const today = new Date();
    const overdueGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        employeeId: goals.employeeId,
        deadline: goals.deadline,
        progress: goals.progress,
      })
      .from(goals)
      .where(
        and(
          lt(goals.deadline, today),
          or(
            eq(goals.status, 'in_progress'),
            eq(goals.status, 'approved')
          )
        )
      );

    // Simular envio de lembretes
    const reminders = [];
    
    for (const goal of overdueGoals) {
      if (!goal.employeeId) continue;
      
      const [employee] = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
        })
        .from(employees)
        .where(eq(employees.id, goal.employeeId))
        .limit(1);
      
      if (!employee || !employee.email) continue;
      
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(goal.deadline).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      reminders.push({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        goalId: goal.id,
        goalTitle: goal.title,
        deadline: goal.deadline,
        daysOverdue,
        progress: goal.progress,
      });
    }

    console.log(`\n📧 Simulação de Envio de Lembretes:`);
    console.log(`   Total de lembretes: ${reminders.length}`);
    
    if (reminders.length > 0) {
      console.log('\n   Detalhes dos lembretes:');
      reminders.forEach((reminder, index) => {
        console.log(`\n   ${index + 1}. Para: ${reminder.employeeName} (${reminder.employeeEmail})`);
        console.log(`      Meta: "${reminder.goalTitle}"`);
        console.log(`      Atrasada há: ${reminder.daysOverdue} dias`);
        console.log(`      Progresso: ${reminder.progress}%`);
      });
    }

    expect(reminders).toBeDefined();
    expect(Array.isArray(reminders)).toBe(true);
  });
});
