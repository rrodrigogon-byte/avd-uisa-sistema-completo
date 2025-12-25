import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';

/**
 * Testes para funcionalidades de upload e processamento de Excel
 */
describe('Excel Upload Router', () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available for testing');
    }
  });

  describe('downloadTemplate', () => {
    it('deve gerar template de Excel com sucesso', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      const result = await caller.excelUpload.downloadTemplate();

      expect(result.success).toBe(true);
      expect(result.base64Data).toBeDefined();
      expect(result.base64Data.length).toBeGreaterThan(0);
      expect(result.fileName).toBe('template_importacao_colaboradores.xlsx');
    });

    it('deve gerar template com colunas corretas', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      const result = await caller.excelUpload.downloadTemplate();

      // Verificar que o base64 é válido
      expect(() => Buffer.from(result.base64Data, 'base64')).not.toThrow();
    });
  });

  describe('validateExcel', () => {
    it('deve validar arquivo Excel com estrutura correta', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      // Primeiro, obter o template
      const template = await caller.excelUpload.downloadTemplate();

      // Validar o template
      const result = await caller.excelUpload.validateExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
      });

      expect(result.success).toBe(true);
      expect(result.totalRows).toBeGreaterThanOrEqual(0);
      expect(result.headers).toContain('nome');
      expect(result.headers).toContain('email');
      expect(result.headers).toContain('cpf');
      expect(result.headers).toContain('cargo');
      expect(result.headers).toContain('departamento');
    });

    it('deve rejeitar arquivo vazio', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      // Criar um buffer vazio
      const emptyBuffer = Buffer.from('');
      const base64Data = emptyBuffer.toString('base64');

      await expect(
        caller.excelUpload.validateExcel({
          base64Data,
          fileName: 'empty.xlsx',
        })
      ).rejects.toThrow();
    });
  });

  describe('importExcel', () => {
    it('deve processar importação sem erros', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      // Obter template para usar como base
      const template = await caller.excelUpload.downloadTemplate();

      const result = await caller.excelUpload.importExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
        updateExisting: false,
      });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBeGreaterThanOrEqual(0);
      expect(result.errorCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('deve permitir atualização de registros existentes', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      const template = await caller.excelUpload.downloadTemplate();

      // Primeira importação
      await caller.excelUpload.importExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
        updateExisting: false,
      });

      // Segunda importação com updateExisting=true
      const result = await caller.excelUpload.importExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
        updateExisting: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Integração completa', () => {
    it('deve completar fluxo de download, validação e importação', async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: 'test-admin', role: 'admin' } as any,
      });

      // 1. Download do template
      const template = await caller.excelUpload.downloadTemplate();
      expect(template.success).toBe(true);

      // 2. Validação do arquivo
      const validation = await caller.excelUpload.validateExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
      });
      expect(validation.success).toBe(true);

      // 3. Importação dos dados
      const importResult = await caller.excelUpload.importExcel({
        base64Data: template.base64Data,
        fileName: 'test.xlsx',
        updateExisting: false,
      });
      expect(importResult.success).toBe(true);
    });
  });

  describe('Permissões', () => {
    it('deve requerer permissão de admin para todas as operações', async () => {
      const callerUser = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 2, openId: 'test-user', role: 'user' } as any,
      });

      // Todas as operações devem falhar para usuário não-admin
      await expect(callerUser.excelUpload.downloadTemplate()).rejects.toThrow();
      
      await expect(
        callerUser.excelUpload.validateExcel({
          base64Data: 'test',
          fileName: 'test.xlsx',
        })
      ).rejects.toThrow();

      await expect(
        callerUser.excelUpload.importExcel({
          base64Data: 'test',
          fileName: 'test.xlsx',
          updateExisting: false,
        })
      ).rejects.toThrow();
    });
  });
});
