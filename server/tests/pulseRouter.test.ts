import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/trpc';

/**
 * Testes para pulseRouter
 * Valida criação, envio e resposta de pesquisas Pulse
 */

describe('pulseRouter', () => {
  const mockContext: TrpcContext = {
    user: {
      id: 1,
      openId: 'test-openid',
      name: 'Test User',
      email: 'test@uisa.com.br',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: 'oauth',
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  describe('getPublicSurvey', () => {
    it('deve retornar null para pesquisa inexistente', async () => {
      const result = await caller.pulse.getPublicSurvey({ surveyId: 99999 });
      expect(result).toBeNull();
    });

    it('deve retornar pesquisa ativa quando existir', async () => {
      // Primeiro criar uma pesquisa
      const survey = await caller.pulse.create({
        title: 'Teste de Pesquisa Pública',
        question: 'Como você avalia o ambiente de trabalho?',
        description: 'Pesquisa de teste',
        targetGroups: ['all'],
      });

      // Ativar a pesquisa
      await caller.pulse.sendInvitations({ surveyId: survey.id });

      // Buscar como público
      const publicSurvey = await caller.pulse.getPublicSurvey({ surveyId: survey.id });
      
      expect(publicSurvey).toBeDefined();
      expect(publicSurvey?.title).toBe('Teste de Pesquisa Pública');
      expect(publicSurvey?.status).toBe('active');
    });
  });

  describe('create', () => {
    it('deve criar pesquisa com dados válidos', async () => {
      const result = await caller.pulse.create({
        title: 'Pesquisa de Clima Organizacional',
        question: 'Você recomendaria a UISA como um bom lugar para trabalhar?',
        description: 'Pesquisa anual de clima',
        targetGroups: ['all'],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.title).toBe('Pesquisa de Clima Organizacional');
    });

    it('deve rejeitar título muito curto', async () => {
      await expect(
        caller.pulse.create({
          title: 'ABC',
          question: 'Pergunta válida com mais de 10 caracteres',
          targetGroups: ['all'],
        })
      ).rejects.toThrow();
    });

    it('deve rejeitar pergunta muito curta', async () => {
      await expect(
        caller.pulse.create({
          title: 'Título válido',
          question: 'ABC',
          targetGroups: ['all'],
        })
      ).rejects.toThrow();
    });
  });

  describe('submitResponse', () => {
    it('deve aceitar resposta válida', async () => {
      // Criar e ativar pesquisa
      const survey = await caller.pulse.create({
        title: 'Teste de Resposta',
        question: 'Como você avalia nosso sistema?',
        targetGroups: ['all'],
      });

      await caller.pulse.sendInvitations({ surveyId: survey.id });

      // Submeter resposta
      const result = await caller.pulse.submitResponse({
        surveyId: survey.id,
        rating: 8,
        comment: 'Sistema muito bom!',
      });

      expect(result.success).toBe(true);
    });

    it('deve rejeitar nota fora do intervalo 0-10', async () => {
      const survey = await caller.pulse.create({
        title: 'Teste Validação',
        question: 'Pergunta de teste',
        targetGroups: ['all'],
      });

      await expect(
        caller.pulse.submitResponse({
          surveyId: survey.id,
          rating: 15, // Inválido
        })
      ).rejects.toThrow();
    });
  });

  describe('getResults', () => {
    it('deve retornar estatísticas corretas', async () => {
      // Criar pesquisa
      const survey = await caller.pulse.create({
        title: 'Teste de Resultados',
        question: 'Avalie de 0 a 10',
        targetGroups: ['all'],
      });

      await caller.pulse.sendInvitations({ surveyId: survey.id });

      // Submeter várias respostas
      await caller.pulse.submitResponse({ surveyId: survey.id, rating: 8 });
      await caller.pulse.submitResponse({ surveyId: survey.id, rating: 9 });
      await caller.pulse.submitResponse({ surveyId: survey.id, rating: 7 });

      // Buscar resultados
      const results = await caller.pulse.getResults({ surveyId: survey.id });

      expect(results.totalResponses).toBe(3);
      expect(results.avgScore).toBeCloseTo(8.0, 1);
      expect(results.distribution).toBeDefined();
    });
  });

  describe('sendInvitations', () => {
    it('deve ativar pesquisa após envio', async () => {
      const survey = await caller.pulse.create({
        title: 'Teste de Envio',
        question: 'Pergunta de teste',
        targetGroups: ['all'],
      });

      const result = await caller.pulse.sendInvitations({ surveyId: survey.id });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBeGreaterThan(0);

      // Verificar se foi ativada
      const surveys = await caller.pulse.list();
      const activeSurvey = surveys.find(s => s.id === survey.id);
      expect(activeSurvey?.status).toBe('active');
    });

    it('deve rejeitar envio por usuário não autorizado', async () => {
      const userContext: TrpcContext = {
        ...mockContext,
        user: { ...mockContext.user!, role: 'user' },
      };
      const userCaller = appRouter.createCaller(userContext);

      const survey = await caller.pulse.create({
        title: 'Teste Permissão',
        question: 'Pergunta de teste',
        targetGroups: ['all'],
      });

      await expect(
        userCaller.pulse.sendInvitations({ surveyId: survey.id })
      ).rejects.toThrow('Apenas RH e Administradores');
    });
  });
});
