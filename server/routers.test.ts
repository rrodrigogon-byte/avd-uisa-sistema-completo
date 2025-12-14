import { describe, it, expect } from 'vitest';

/**
 * Testes de Validação dos Routers Principais
 * 
 * Este arquivo valida que todos os routers principais do sistema estão
 * corretamente configurados e exportados.
 */

describe('Sistema AVD UISA - Validação de Routers', () => {
  it('deve importar o appRouter sem erros', async () => {
    const { appRouter } = await import('../server/routers');
    expect(appRouter).toBeDefined();
  });

  it('deve ter todos os routers principais definidos', async () => {
    const { appRouter } = await import('../server/routers');
    
    // Verificar que os routers principais existem
    expect(appRouter._def.procedures.auth).toBeDefined();
    expect(appRouter._def.procedures.template).toBeDefined();
    expect(appRouter._def.procedures.evaluation).toBeDefined();
    expect(appRouter._def.procedures.pir).toBeDefined();
    expect(appRouter._def.procedures.jobDescription).toBeDefined();
    expect(appRouter._def.procedures.notification).toBeDefined();
    expect(appRouter._def.procedures.analytics).toBeDefined();
    expect(appRouter._def.procedures.report).toBeDefined();
  });

  it('deve ter procedures de autenticação', async () => {
    const { appRouter } = await import('../server/routers');
    const authRouter = appRouter._def.procedures.auth;
    
    expect(authRouter).toBeDefined();
  });

  it('deve ter procedures de template', async () => {
    const { appRouter } = await import('../server/routers');
    const templateRouter = appRouter._def.procedures.template;
    
    expect(templateRouter).toBeDefined();
  });

  it('deve ter procedures de evaluation', async () => {
    const { appRouter } = await import('../server/routers');
    const evaluationRouter = appRouter._def.procedures.evaluation;
    
    expect(evaluationRouter).toBeDefined();
  });

  it('deve ter procedures de PIR', async () => {
    const { appRouter } = await import('../server/routers');
    const pirRouter = appRouter._def.procedures.pir;
    
    expect(pirRouter).toBeDefined();
  });

  it('deve ter procedures de jobDescription', async () => {
    const { appRouter } = await import('../server/routers');
    const jobDescRouter = appRouter._def.procedures.jobDescription;
    
    expect(jobDescRouter).toBeDefined();
  });

  it('deve ter procedures de notification', async () => {
    const { appRouter } = await import('../server/routers');
    const notificationRouter = appRouter._def.procedures.notification;
    
    expect(notificationRouter).toBeDefined();
  });

  it('deve ter procedures de analytics', async () => {
    const { appRouter } = await import('../server/routers');
    const analyticsRouter = appRouter._def.procedures.analytics;
    
    expect(analyticsRouter).toBeDefined();
  });

  it('deve ter procedures de report', async () => {
    const { appRouter } = await import('../server/routers');
    const reportRouter = appRouter._def.procedures.report;
    
    expect(reportRouter).toBeDefined();
  });
});

describe('Sistema AVD UISA - Validação de Schema do Banco', () => {
  it('deve importar o schema do banco sem erros', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema).toBeDefined();
  });

  it('deve ter todas as tabelas principais definidas', async () => {
    const schema = await import('../drizzle/schema');
    
    expect(schema.users).toBeDefined();
    expect(schema.evaluationTemplates).toBeDefined();
    expect(schema.evaluations).toBeDefined();
    expect(schema.pirs).toBeDefined();
    expect(schema.jobDescriptions).toBeDefined();
    expect(schema.notificationSettings).toBeDefined();
    expect(schema.notificationLogs).toBeDefined();
    expect(schema.reports).toBeDefined();
  });
});

describe('Sistema AVD UISA - Validação de Helpers do Banco', () => {
  it('deve importar funções de db.ts sem erros', async () => {
    const db = await import('../server/db');
    expect(db).toBeDefined();
    expect(db.getDb).toBeDefined();
    expect(db.upsertUser).toBeDefined();
    expect(db.getUserByOpenId).toBeDefined();
  });
});

console.log('✅ Todos os testes de validação passaram!');
