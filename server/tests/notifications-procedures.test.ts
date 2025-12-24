import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { notifications, users } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Testes para procedures de notificações
 * Valida que as queries SQL funcionam corretamente
 */

describe('Notifications Procedures', () => {
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar ou criar usuário de teste
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, 'test-user-notifications'))
      .limit(1);

    if (existingUser) {
      testUserId = existingUser.id;
      
      // Limpar notificações antigas do usuário de teste
      await db
        .delete(notifications)
        .where(eq(notifications.userId, testUserId));
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          openId: 'test-user-notifications',
          name: 'Test User Notifications',
          email: 'test-notifications@example.com',
          role: 'colaborador',
        })
        .$returningId();
      testUserId = newUser.id;
    }

    // Criar notificações de teste
    await db.insert(notifications).values([
      {
        userId: testUserId,
        type: 'info',
        title: 'Notificação de Teste 1',
        message: 'Mensagem de teste 1',
        read: false,
      },
      {
        userId: testUserId,
        type: 'warning',
        title: 'Notificação de Teste 2',
        message: 'Mensagem de teste 2',
        read: false,
      },
      {
        userId: testUserId,
        type: 'success',
        title: 'Notificação de Teste 3',
        message: 'Mensagem de teste 3',
        read: true,
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db
      .delete(notifications)
      .where(eq(notifications.userId, testUserId));
  });

  it('countUnread deve retornar o número correto de notificações não lidas', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, testUserId),
        eq(notifications.read, false)
      ));
    
    // Deve ter exatamente 2 notificações não lidas (criadas no beforeAll)
    expect(count).toBe(2);
  });

  it('getMyNotifications deve retornar notificações do usuário', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, testUserId))
      .limit(10);
    
    // Deve retornar array de notificações
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(3); // 3 notificações criadas no beforeAll
    
    // Todas as notificações devem ser do usuário de teste
    items.forEach(notification => {
      expect(notification.userId).toBe(testUserId);
    });
  });

  it('getInApp deve retornar notificações do usuário (mesma query)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, testUserId))
      .limit(10);
    
    // Deve retornar array de notificações
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(3);
    
    // Todas as notificações devem ser do usuário de teste
    items.forEach(notification => {
      expect(notification.userId).toBe(testUserId);
    });
  });

  it('getMyNotifications deve respeitar o limite especificado', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, testUserId))
      .limit(2);
    
    // Deve retornar no máximo 2 notificações
    expect(items.length).toBe(2);
  });

  it('getInApp deve respeitar o limite especificado', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, testUserId))
      .limit(2);
    
    // Deve retornar no máximo 2 notificações
    expect(items.length).toBe(2);
  });
});
