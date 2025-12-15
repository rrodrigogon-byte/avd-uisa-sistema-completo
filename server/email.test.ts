/**
 * Testes para Sistema de Emails
 * Valida configuração SMTP e envio de emails
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../server/db';
import { systemSettings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Sistema de Emails', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve ter banco de dados disponível', () => {
    expect(db).toBeTruthy();
  });

  it('deve ter configuração SMTP no banco', async () => {
    if (!db) {
      throw new Error('Database not available');
    }

    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, 'smtp_config'))
      .limit(1);

    expect(settings.length).toBeGreaterThan(0);
    
    if (settings.length > 0) {
      const smtpConfig = JSON.parse(settings[0].settingValue || '{}');
      
      // Validar campos obrigatórios
      expect(smtpConfig).toHaveProperty('host');
      expect(smtpConfig).toHaveProperty('port');
      expect(smtpConfig).toHaveProperty('user');
      expect(smtpConfig).toHaveProperty('password');
      
      console.log('Configuração SMTP encontrada:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.user,
        secure: smtpConfig.secure,
      });
    }
  });

  it('deve ter configuração SMTP válida', async () => {
    if (!db) {
      throw new Error('Database not available');
    }

    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, 'smtp_config'))
      .limit(1);

    expect(settings.length).toBeGreaterThan(0);
    
    const smtpConfig = JSON.parse(settings[0].settingValue || '{}');
    
    // Validar que os campos não estão vazios
    expect(smtpConfig.host).toBeTruthy();
    expect(smtpConfig.port).toBeTruthy();
    expect(smtpConfig.user).toBeTruthy();
    expect(smtpConfig.password).toBeTruthy();
    
    // Validar tipos
    expect(typeof smtpConfig.host).toBe('string');
    expect(typeof smtpConfig.user).toBe('string');
    expect(typeof smtpConfig.password).toBe('string');
  });
});
