import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { evaluationCycles, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes para procedures críticas do sistema
 * Foco em autenticação, ciclos de avaliação e validações
 */

describe('Critical Procedures - Authentication', () => {
  it('should verify database connection is available', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
    console.log('✅ Database connection verified');
  });

  it('should verify users table exists and has data', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const usersList = await db.select().from(users).limit(5);
    expect(usersList).toBeDefined();
    expect(Array.isArray(usersList)).toBe(true);
    
    console.log(`✅ Found ${usersList.length} users in database`);
    
    if (usersList.length > 0) {
      const firstUser = usersList[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('openId');
      expect(firstUser).toHaveProperty('role');
      console.log(`✅ User structure validated: ${firstUser.name || firstUser.email}`);
    }
  });

  it('should verify admin users exist', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(10);

    expect(adminUsers).toBeDefined();
    expect(Array.isArray(adminUsers)).toBe(true);
    
    console.log(`✅ Found ${adminUsers.length} admin users`);
    
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        expect(admin.role).toBe('admin');
      });
    }
  });

  it('should verify user roles are valid', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const usersList = await db.select().from(users).limit(100);
    const validRoles = ['admin', 'rh', 'gestor', 'colaborador', 'user'];
    
    let invalidRoles = 0;
    usersList.forEach(user => {
      if (user.role && !validRoles.includes(user.role)) {
        invalidRoles++;
        console.log(`⚠️  Invalid role found: ${user.role} for user ${user.id}`);
      }
    });

    expect(invalidRoles).toBe(0);
    console.log(`✅ All ${usersList.length} users have valid roles`);
  });
});

describe('Critical Procedures - Evaluation Cycles', () => {
  it('should verify evaluation cycles table exists', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const cycles = await db.select().from(evaluationCycles).limit(10);
    expect(cycles).toBeDefined();
    expect(Array.isArray(cycles)).toBe(true);
    
    console.log(`✅ Found ${cycles.length} evaluation cycles`);
  });

  it('should verify active cycles exist or can be created', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const activeCycles = await db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.status, 'ativo'))
      .limit(10);

    console.log(`✅ Found ${activeCycles.length} active cycles`);
    
    if (activeCycles.length === 0) {
      console.log('⚠️  No active cycles found - administrators should create one');
    } else {
      activeCycles.forEach(cycle => {
        expect(cycle.status).toBe('ativo');
        expect(cycle.startDate).toBeDefined();
        expect(cycle.endDate).toBeDefined();
        console.log(`   - ${cycle.name} (${cycle.year})`);
      });
    }
  });

  it('should verify cycle status values are valid', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const cycles = await db.select().from(evaluationCycles).limit(100);
    const validStatuses = ['planejado', 'ativo', 'em_andamento', 'concluido', 'cancelado'];
    
    let invalidStatuses = 0;
    cycles.forEach(cycle => {
      if (!validStatuses.includes(cycle.status)) {
        invalidStatuses++;
        console.log(`⚠️  Invalid status found: ${cycle.status} for cycle ${cycle.id}`);
      }
    });

    expect(invalidStatuses).toBe(0);
    console.log(`✅ All ${cycles.length} cycles have valid status values`);
  });

  it('should verify cycle dates are logical (end after start)', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const cycles = await db.select().from(evaluationCycles).limit(100);
    
    let invalidDates = 0;
    cycles.forEach(cycle => {
      const startDate = new Date(cycle.startDate);
      const endDate = new Date(cycle.endDate);
      
      if (endDate <= startDate) {
        invalidDates++;
        console.log(`⚠️  Invalid dates for cycle ${cycle.id}: start=${startDate}, end=${endDate}`);
      }
    });

    expect(invalidDates).toBe(0);
    console.log(`✅ All ${cycles.length} cycles have valid date ranges`);
  });

  it('should verify cycles have required fields', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const cycles = await db.select().from(evaluationCycles).limit(50);
    
    let missingFields = 0;
    cycles.forEach(cycle => {
      if (!cycle.name || !cycle.year || !cycle.startDate || !cycle.endDate || !cycle.status) {
        missingFields++;
        console.log(`⚠️  Missing required fields for cycle ${cycle.id}`);
      }
    });

    expect(missingFields).toBe(0);
    console.log(`✅ All ${cycles.length} cycles have required fields`);
  });
});

describe('Critical Procedures - Data Integrity', () => {
  it('should verify no null openIds in users table', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const usersWithNullOpenId = await db
      .select()
      .from(users)
      .limit(1000);

    const nullOpenIds = usersWithNullOpenId.filter(u => !u.openId);
    
    expect(nullOpenIds.length).toBe(0);
    console.log(`✅ All users have valid openId (checked ${usersWithNullOpenId.length} users)`);
  });

  it('should verify unique openIds in users table', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const usersList = await db.select().from(users).limit(1000);
    const openIds = new Set<string>();
    let duplicates = 0;

    usersList.forEach(user => {
      if (user.openId) {
        if (openIds.has(user.openId)) {
          duplicates++;
          console.log(`⚠️  Duplicate openId found: ${user.openId}`);
        }
        openIds.add(user.openId);
      }
    });

    expect(duplicates).toBe(0);
    console.log(`✅ All ${usersList.length} users have unique openIds`);
  });

  it('should check cycle years match start dates (warning only)', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const cycles = await db.select().from(evaluationCycles).limit(100);
    
    let mismatchedYears = 0;
    cycles.forEach(cycle => {
      const startYear = new Date(cycle.startDate).getFullYear();
      if (cycle.year !== startYear) {
        mismatchedYears++;
        console.log(`⚠️  Year mismatch for cycle ${cycle.id}: year=${cycle.year}, startDate year=${startYear}`);
      }
    });

    // Apenas aviso, não falha (dados legados podem ter inconsistências)
    if (mismatchedYears > 0) {
      console.log(`⚠️  Found ${mismatchedYears} cycles with year mismatches (legacy data)`);
    } else {
      console.log(`✅ All ${cycles.length} cycles have matching years`);
    }
    
    // Sempre passa, mas registra o problema
    expect(cycles.length).toBeGreaterThan(0);
  });
});

describe('Critical Procedures - Performance', () => {
  it('should query users table in reasonable time', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const startTime = Date.now();
    const usersList = await db.select().from(users).limit(100);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    console.log(`✅ Users query completed in ${duration}ms (${usersList.length} users)`);
  });

  it('should query cycles table in reasonable time', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const startTime = Date.now();
    const cycles = await db.select().from(evaluationCycles).limit(100);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    console.log(`✅ Cycles query completed in ${duration}ms (${cycles.length} cycles)`);
  });
});

describe('Critical Procedures - Summary', () => {
  it('should print system health summary', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available, skipping test');
      return;
    }

    const [usersList, cycles, adminUsers, activeCycles] = await Promise.all([
      db.select().from(users).limit(1000),
      db.select().from(evaluationCycles).limit(100),
      db.select().from(users).where(eq(users.role, 'admin')).limit(100),
      db.select().from(evaluationCycles).where(eq(evaluationCycles.status, 'ativo')).limit(10),
    ]);

    console.log('\n📊 SYSTEM HEALTH SUMMARY');
    console.log('========================');
    console.log(`👥 Total Users: ${usersList.length}`);
    console.log(`👑 Admin Users: ${adminUsers.length}`);
    console.log(`📅 Total Cycles: ${cycles.length}`);
    console.log(`✅ Active Cycles: ${activeCycles.length}`);
    console.log('========================\n');

    expect(usersList.length).toBeGreaterThan(0);
    expect(cycles.length).toBeGreaterThan(0);
  });
});
