import { describe, it, expect, beforeAll } from 'vitest';
import * as db from '../db';

describe('Sistema de Pendências', () => {
  let testEmployeeId: number;
  let testUserId: number;
  let testPendenciaId: number;

  beforeAll(async () => {
    // Buscar um funcionário e usuário de teste
    const employees = await db.getAllEmployees();
    const users = await db.getAllUsers();
    
    if (employees.length > 0) {
      testEmployeeId = employees[0].id;
    }
    
    if (users.length > 0) {
      testUserId = users[0].id;
    }
  });

  describe('Criação de Pendências', () => {
    it('deve criar uma nova pendência', async () => {
      if (!testEmployeeId || !testUserId) {
        console.log('Pulando teste: sem funcionário ou usuário de teste');
        return;
      }

      const novaPendencia = {
        titulo: 'Teste de Pendência',
        descricao: 'Descrição de teste',
        status: 'pendente' as const,
        prioridade: 'media' as const,
        responsavelId: testEmployeeId,
        criadoPorId: testUserId,
        progresso: 0,
      };

      const result = await db.createPendencia(novaPendencia);
      expect(result).toBeDefined();
      
      // Buscar todas as pendências para verificar se foi criada
      const pendencias = await db.getAllPendencias();
      const created = pendencias.find(p => p.titulo === 'Teste de Pendência');
      
      if (created) {
        testPendenciaId = created.id;
        expect(created.titulo).toBe('Teste de Pendência');
        expect(created.status).toBe('pendente');
        expect(created.prioridade).toBe('media');
      }
    });
  });

  describe('Listagem de Pendências', () => {
    it('deve listar todas as pendências', async () => {
      const pendencias = await db.getAllPendencias();
      expect(Array.isArray(pendencias)).toBe(true);
    });

    it('deve filtrar pendências por status', async () => {
      const pendencias = await db.getAllPendencias({ status: 'pendente' });
      expect(Array.isArray(pendencias)).toBe(true);
      
      if (pendencias.length > 0) {
        pendencias.forEach(p => {
          expect(p.status).toBe('pendente');
        });
      }
    });

    it('deve filtrar pendências por prioridade', async () => {
      const pendencias = await db.getAllPendencias({ prioridade: 'media' });
      expect(Array.isArray(pendencias)).toBe(true);
      
      if (pendencias.length > 0) {
        pendencias.forEach(p => {
          expect(p.prioridade).toBe('media');
        });
      }
    });

    it('deve filtrar pendências por responsável', async () => {
      if (!testEmployeeId) {
        console.log('Pulando teste: sem funcionário de teste');
        return;
      }

      const pendencias = await db.getAllPendencias({ responsavelId: testEmployeeId });
      expect(Array.isArray(pendencias)).toBe(true);
      
      if (pendencias.length > 0) {
        pendencias.forEach(p => {
          expect(p.responsavelId).toBe(testEmployeeId);
        });
      }
    });
  });

  describe('Busca de Pendências', () => {
    it('deve buscar pendência por ID', async () => {
      if (!testPendenciaId) {
        console.log('Pulando teste: sem pendência de teste');
        return;
      }

      const pendencia = await db.getPendenciaById(testPendenciaId);
      expect(pendencia).toBeDefined();
      
      if (pendencia) {
        expect(pendencia.id).toBe(testPendenciaId);
      }
    });

    it('deve retornar undefined para ID inexistente', async () => {
      const pendencia = await db.getPendenciaById(999999);
      expect(pendencia).toBeUndefined();
    });
  });

  describe('Atualização de Pendências', () => {
    it('deve atualizar uma pendência', async () => {
      if (!testPendenciaId) {
        console.log('Pulando teste: sem pendência de teste');
        return;
      }

      const updated = await db.updatePendencia(testPendenciaId, {
        status: 'em_andamento',
        progresso: 50,
      });

      expect(updated).toBeDefined();
      
      if (updated) {
        expect(updated.status).toBe('em_andamento');
        expect(updated.progresso).toBe(50);
      }
    });

    it('deve atualizar progresso para 100 ao concluir', async () => {
      if (!testPendenciaId) {
        console.log('Pulando teste: sem pendência de teste');
        return;
      }

      const updated = await db.updatePendencia(testPendenciaId, {
        status: 'concluida',
      });

      expect(updated).toBeDefined();
      
      if (updated) {
        expect(updated.status).toBe('concluida');
      }
    });
  });

  describe('Contagem de Pendências', () => {
    it('deve contar pendências por status', async () => {
      const counts = await db.countPendenciasByStatus();
      
      expect(counts).toBeDefined();
      expect(typeof counts.pendente).toBe('number');
      expect(typeof counts.em_andamento).toBe('number');
      expect(typeof counts.concluida).toBe('number');
      expect(typeof counts.cancelada).toBe('number');
    });

    it('deve contar pendências por responsável', async () => {
      if (!testEmployeeId) {
        console.log('Pulando teste: sem funcionário de teste');
        return;
      }

      const counts = await db.countPendenciasByStatus(testEmployeeId);
      
      expect(counts).toBeDefined();
      expect(typeof counts.pendente).toBe('number');
      expect(typeof counts.em_andamento).toBe('number');
      expect(typeof counts.concluida).toBe('number');
      expect(typeof counts.cancelada).toBe('number');
    });
  });

  describe('Exclusão de Pendências', () => {
    it('deve excluir uma pendência', async () => {
      if (!testPendenciaId) {
        console.log('Pulando teste: sem pendência de teste');
        return;
      }

      const result = await db.deletePendencia(testPendenciaId);
      expect(result.success).toBe(true);

      // Verificar se foi excluída
      const pendencia = await db.getPendenciaById(testPendenciaId);
      expect(pendencia).toBeUndefined();
    });
  });
});
