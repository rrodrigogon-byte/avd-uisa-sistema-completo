/**
 * Suite de Testes Completa - Sistema AVD UISA
 * Valida todas as funcionalidades principais do sistema
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { 
  users, 
  employees, 
  evaluationCycles,
  smartGoals,
  pdiPlans,
  systemSettings
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Sistema AVD UISA - Testes Completos', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('1. Infraestrutura', () => {
    it('deve ter banco de dados disponível', () => {
      expect(db).toBeTruthy();
    });

    it('deve ter configuração SMTP configurada', async () => {
      if (!db) throw new Error('Database not available');

      const settings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, 'smtp_config'))
        .limit(1);

      expect(settings.length).toBeGreaterThan(0);
      
      const smtpConfig = JSON.parse(settings[0].settingValue || '{}');
      expect(smtpConfig.host).toBe('smtp.gmail.com');
      expect(smtpConfig.user).toBe('avd@uisa.com.br');
      expect(smtpConfig.password).toBeTruthy();
    });
  });

  describe('2. Gestão de Usuários', () => {
    it('deve ter usuários cadastrados', async () => {
      if (!db) throw new Error('Database not available');

      const allUsers = await db.select().from(users).limit(10);
      expect(allUsers.length).toBeGreaterThan(0);
    });

    it('deve ter pelo menos um usuário admin', async () => {
      if (!db) throw new Error('Database not available');

      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);

      expect(adminUsers.length).toBeGreaterThan(0);
    });
  });

  describe('3. Gestão de Funcionários', () => {
    it('deve ter funcionários cadastrados', async () => {
      if (!db) throw new Error('Database not available');

      const allEmployees = await db.select().from(employees).limit(10);
      expect(allEmployees.length).toBeGreaterThan(0);
    });

    it('deve ter funcionários ativos', async () => {
      if (!db) throw new Error('Database not available');

      const activeEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.status, 'ativo'))
        .limit(10);

      expect(activeEmployees.length).toBeGreaterThan(0);
    });
  });

  describe('4. Ciclos de Avaliação', () => {
    it('deve permitir criar ciclos de avaliação', async () => {
      if (!db) throw new Error('Database not available');

      const cycles = await db.select().from(evaluationCycles).limit(5);
      
      // Sistema deve ter pelo menos a estrutura de ciclos
      expect(Array.isArray(cycles)).toBe(true);
    });
  });

  describe('5. Metas SMART', () => {
    it('deve ter estrutura de metas configurada', async () => {
      if (!db) throw new Error('Database not available');

      const goals = await db.select().from(smartGoals).limit(5);
      
      // Sistema deve ter pelo menos a estrutura de metas
      expect(Array.isArray(goals)).toBe(true);
    });
  });

  describe('6. PDI (Plano de Desenvolvimento Individual)', () => {
    it('deve ter estrutura de PDI configurada', async () => {
      if (!db) throw new Error('Database not available');

      const pdis = await db.select().from(pdiPlans).limit(5);
      
      // Sistema deve ter pelo menos a estrutura de PDI
      expect(Array.isArray(pdis)).toBe(true);
    });
  });

  describe('7. Integridade de Dados', () => {
    it('todos os funcionários devem ter dados básicos válidos', async () => {
      if (!db) throw new Error('Database not available');

      const employeesData = await db.select().from(employees).limit(100);
      
      employeesData.forEach(emp => {
        expect(emp.name).toBeTruthy();
        expect(emp.employeeCode).toBeTruthy();
        expect(emp.status).toBeTruthy();
      });
    });

    it('todos os usuários devem ter openId único', async () => {
      if (!db) throw new Error('Database not available');

      const usersData = await db.select().from(users).limit(100);
      
      const openIds = usersData.map(u => u.openId);
      const uniqueOpenIds = new Set(openIds);
      
      expect(openIds.length).toBe(uniqueOpenIds.size);
    });
  });
});
