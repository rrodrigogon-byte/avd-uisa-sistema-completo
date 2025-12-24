/**
 * Testes para o serviço de notificações por email para Admin e RH
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as emailService from '../emailService';
import * as db from '../db';

// Mock dos módulos
vi.mock('../emailService');
vi.mock('../db');

describe('Admin RH Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyNewEmployee', () => {
    it('deve enviar email ao criar novo funcionário', async () => {
      // Mock do getDb para retornar admin e RH
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
              { email: 'rh@empresa.com' },
            ]),
          }),
        }),
      } as any);

      // Mock do sendEmail
      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyNewEmployee } = await import('../adminRhEmailService');
      
      const result = await notifyNewEmployee(
        'João Silva',
        'EMP001',
        'Tecnologia'
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('deve retornar false se não houver emails de admin/rh', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const { notifyNewEmployee } = await import('../adminRhEmailService');
      
      const result = await notifyNewEmployee(
        'João Silva',
        'EMP001',
        'Tecnologia'
      );

      expect(result).toBe(false);
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('notifyNewUser', () => {
    it('deve enviar email ao criar novo usuário', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyNewUser } = await import('../adminRhEmailService');
      
      const result = await notifyNewUser(
        'Maria Santos',
        'maria.santos@empresa.com',
        'gestor'
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifyNewEvaluationCycle', () => {
    it('deve enviar email ao criar novo ciclo de avaliação', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
              { email: 'rh@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyNewEvaluationCycle } = await import('../adminRhEmailService');
      
      const result = await notifyNewEvaluationCycle(
        'Ciclo 2025 - Semestre 1',
        new Date('2025-01-01'),
        new Date('2025-06-30'),
        50
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyEvaluation360Completed', () => {
    it('deve enviar email ao concluir avaliação 360°', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyEvaluation360Completed } = await import('../adminRhEmailService');
      
      const result = await notifyEvaluation360Completed(
        'Carlos Oliveira',
        'Autoavaliação',
        8.5
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifySmartGoalActivity', () => {
    it('deve enviar email ao criar meta SMART', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'rh@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifySmartGoalActivity } = await import('../adminRhEmailService');
      
      const result = await notifySmartGoalActivity(
        'criada',
        'Aumentar vendas em 20%',
        'Ana Costa',
        'Em Progresso'
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifyPdiActivity', () => {
    it('deve enviar email ao criar PDI', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyPdiActivity } = await import('../adminRhEmailService');
      
      const result = await notifyPdiActivity(
        'criado',
        'Pedro Alves',
        'Desenvolvimento em Liderança',
        0
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('deve enviar email com prioridade alta ao concluir PDI', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyPdiActivity } = await import('../adminRhEmailService');
      
      const result = await notifyPdiActivity(
        'concluído',
        'Pedro Alves',
        'Desenvolvimento em Liderança',
        100
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifyNineBoxChange', () => {
    it('deve enviar email ao mudar posição na Nine Box', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
              { email: 'rh@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyNineBoxChange } = await import('../adminRhEmailService');
      
      const result = await notifyNineBoxChange(
        'Fernanda Lima',
        'Médio Desempenho / Médio Potencial',
        'Alto Desempenho / Alto Potencial'
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifySecurityAlert', () => {
    it('deve enviar email de alerta de segurança', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifySecurityAlert } = await import('../adminRhEmailService');
      
      const result = await notifySecurityAlert(
        'Tentativa de acesso não autorizado',
        'Múltiplas tentativas de login falhadas detectadas',
        'high'
      );

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifyDailySummary', () => {
    it('deve enviar resumo diário de atividades', async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { email: 'admin@empresa.com' },
              { email: 'rh@empresa.com' },
            ]),
          }),
        }),
      } as any);

      vi.mocked(emailService.sendEmail).mockResolvedValue(true);

      const { notifyDailySummary } = await import('../adminRhEmailService');
      
      const result = await notifyDailySummary({
        newUsers: 2,
        newEmployees: 5,
        completedEvaluations: 12,
        newGoals: 8,
        completedPdis: 3,
      });

      expect(result).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });
  });
});
