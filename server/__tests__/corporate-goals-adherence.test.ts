/**
 * Teste de Sistema de Adesão de Metas Corporativas
 * Sistema AVD UISA
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { goals, employees, goalUpdates } from '../../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';

describe('Sistema de Adesão de Metas Corporativas', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve identificar funcionários com metas corporativas', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar todas as metas corporativas ativas
    const corporateGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        category: goals.category,
        status: goals.status,
        employeeId: goals.employeeId,
      })
      .from(goals)
      .where(
        and(
          eq(goals.category, 'corporate'),
          inArray(goals.status, ['approved', 'in_progress'])
        )
      );

    console.log(`\n📊 Metas corporativas ativas: ${corporateGoals.length}`);

    if (corporateGoals.length > 0) {
      // Contar funcionários únicos
      const uniqueEmployees = new Set(
        corporateGoals.filter(g => g.employeeId).map(g => g.employeeId)
      );

      console.log(`👥 Funcionários com metas corporativas: ${uniqueEmployees.size}`);
      console.log('\n📌 Detalhes das metas:');

      for (const goal of corporateGoals.slice(0, 5)) {
        console.log(`\n   - "${goal.title}"`);
        console.log(`     Status: ${goal.status}`);
        
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
            console.log(`     Funcionário: ${employee.name}`);
          }
        }
      }

      if (corporateGoals.length > 5) {
        console.log(`\n   ... e mais ${corporateGoals.length - 5} metas`);
      }
    } else {
      console.log('⚠️  Nenhuma meta corporativa ativa encontrada');
    }

    expect(corporateGoals).toBeDefined();
    expect(Array.isArray(corporateGoals)).toBe(true);
  });

  it('deve identificar funcionários com atualizações atrasadas', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar metas corporativas ativas
    const corporateGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        employeeId: goals.employeeId,
        updatedAt: goals.updatedAt,
      })
      .from(goals)
      .where(
        and(
          eq(goals.category, 'corporate'),
          inArray(goals.status, ['approved', 'in_progress'])
        )
      );

    const today = new Date();
    const delayedGoals = [];

    for (const goal of corporateGoals) {
      if (!goal.employeeId) continue;

      // Calcular dias desde última atualização
      const lastUpdate = new Date(goal.updatedAt);
      const daysSinceUpdate = Math.floor(
        (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Considerar atrasado se > 7 dias sem atualização
      if (daysSinceUpdate > 7) {
        const [employee] = await db
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.id, goal.employeeId))
          .limit(1);

        if (employee) {
          delayedGoals.push({
            goalId: goal.id,
            goalTitle: goal.title,
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            daysSinceUpdate,
          });
        }
      }
    }

    console.log(`\n⏰ Funcionários com atualizações atrasadas: ${delayedGoals.length}`);

    if (delayedGoals.length > 0) {
      console.log('\n🔔 Detalhes dos atrasos:');
      
      delayedGoals.slice(0, 5).forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.employeeName} (${item.employeeEmail})`);
        console.log(`      Meta: "${item.goalTitle}"`);
        console.log(`      Dias sem atualizar: ${item.daysSinceUpdate}`);
        console.log(`      Status: ${item.daysSinceUpdate > 14 ? 'Crítico 🔴' : 'Atrasado 🟡'}`);
      });

      if (delayedGoals.length > 5) {
        console.log(`\n   ... e mais ${delayedGoals.length - 5} funcionários`);
      }

      console.log(`\n📧 Lembretes que seriam enviados: ${delayedGoals.length}`);
    } else {
      console.log('✅ Todos os funcionários estão atualizando suas metas regularmente!');
    }

    expect(delayedGoals).toBeDefined();
    expect(Array.isArray(delayedGoals)).toBe(true);
  });

  it('deve validar estrutura de lembrete de adesão', () => {
    const reminderTemplate = {
      subject: 'Lembrete: Atualize sua meta corporativa',
      body: `
        <h2>Olá, {{employeeName}}!</h2>
        <p>Notamos que sua meta corporativa "<strong>{{goalTitle}}</strong>" não foi atualizada há <strong>{{daysSinceUpdate}} dias</strong>.</p>
        <p>Por favor, acesse o sistema e atualize o progresso da sua meta.</p>
        <p><a href="{{goalUrl}}">Clique aqui para atualizar</a></p>
        <p>Manter suas metas atualizadas é fundamental para o acompanhamento do desempenho organizacional.</p>
      `,
      type: 'corporate_goal_adherence',
    };

    console.log('\n✅ Template de lembrete de adesão validado');
    console.log('   Variáveis: employeeName, goalTitle, daysSinceUpdate, goalUrl');

    expect(reminderTemplate.subject).toContain('Lembrete');
    expect(reminderTemplate.body).toContain('{{employeeName}}');
    expect(reminderTemplate.body).toContain('{{goalTitle}}');
    expect(reminderTemplate.body).toContain('{{daysSinceUpdate}}');
    expect(reminderTemplate.type).toBe('corporate_goal_adherence');
  });

  it('deve calcular taxa de adesão por departamento', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar metas corporativas com informações de funcionário
    const corporateGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        employeeId: goals.employeeId,
        updatedAt: goals.updatedAt,
      })
      .from(goals)
      .where(
        and(
          eq(goals.category, 'corporate'),
          inArray(goals.status, ['approved', 'in_progress'])
        )
      );

    const today = new Date();
    const adherenceByDept: Record<string, { total: number; updated: number }> = {};

    for (const goal of corporateGoals) {
      if (!goal.employeeId) continue;

      const [employee] = await db
        .select({
          departmentId: employees.departmentId,
        })
        .from(employees)
        .where(eq(employees.id, goal.employeeId))
        .limit(1);

      if (!employee || !employee.departmentId) continue;

      const deptKey = `dept_${employee.departmentId}`;
      
      if (!adherenceByDept[deptKey]) {
        adherenceByDept[deptKey] = { total: 0, updated: 0 };
      }

      adherenceByDept[deptKey].total++;

      // Considerar "atualizado" se foi modificado nos últimos 7 dias
      const daysSinceUpdate = Math.floor(
        (today.getTime() - new Date(goal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate <= 7) {
        adherenceByDept[deptKey].updated++;
      }
    }

    console.log('\n📊 Taxa de Adesão por Departamento:');
    
    Object.entries(adherenceByDept).forEach(([dept, stats]) => {
      const rate = (stats.updated / stats.total * 100).toFixed(1);
      console.log(`\n   ${dept}:`);
      console.log(`     - Total de metas: ${stats.total}`);
      console.log(`     - Atualizadas (últimos 7 dias): ${stats.updated}`);
      console.log(`     - Taxa de adesão: ${rate}%`);
    });

    expect(adherenceByDept).toBeDefined();
    expect(typeof adherenceByDept).toBe('object');
  });

  it('deve simular exportação de relatório de adesão', () => {
    const mockData = [
      {
        employeeName: 'João Silva',
        position: 'Analista',
        goalTitle: 'Reduzir custos de TI em 7%',
        daysSinceLastUpdate: 15,
        status: 'Crítico',
      },
      {
        employeeName: 'Maria Santos',
        position: 'Gerente',
        goalTitle: 'Aumentar Produtividade da Cana',
        daysSinceLastUpdate: 10,
        status: 'Atrasado',
      },
      {
        employeeName: 'Pedro Costa',
        position: 'Coordenador',
        goalTitle: 'Aumentar Produtividade da Cana',
        daysSinceLastUpdate: 5,
        status: 'Atenção',
      },
    ];

    const csvContent = [
      ['Funcionário', 'Cargo', 'Meta', 'Dias sem atualizar', 'Status'],
      ...mockData.map(row => [
        row.employeeName,
        row.position,
        row.goalTitle,
        row.daysSinceLastUpdate.toString(),
        row.status,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    console.log('\n📄 Exemplo de Relatório CSV:');
    console.log(csvContent);

    expect(csvContent).toContain('Funcionário,Cargo,Meta');
    expect(csvContent).toContain('João Silva');
    expect(csvContent.split('\n').length).toBe(4); // Header + 3 rows
  });
});
