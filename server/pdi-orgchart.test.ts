import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../server/db';
import { employees, departments, positions, pdiPlans, employeeMovements, orgChartStructure } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('PDI e Organograma - Funcionalidades Integradas', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testEmployeeId: number;
  let testDepartmentId: number;
  let testPositionId: number;
  const timestamp = Date.now();

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Criar departamento de teste
    const [dept] = await db.insert(departments).values({
      name: `Departamento Teste PDI ${timestamp}`,
      code: `TEST-PDI-${timestamp}`,
      active: true,
    });
    testDepartmentId = dept.insertId;

    // Criar cargo de teste
    const [pos] = await db.insert(positions).values({
      code: `TEST-PDI-POS-${timestamp}`,
      title: `Cargo Teste PDI ${timestamp}`,
      level: 'Pleno',
      active: true,
    });
    testPositionId = pos.insertId;

    // Criar colaborador de teste
    const [emp] = await db.insert(employees).values({
      name: `Colaborador Teste PDI ${timestamp}`,
      employeeCode: `TEST-PDI-${timestamp}`,
      email: `teste.pdi.${timestamp}@example.com`,
      departmentId: testDepartmentId,
      positionId: testPositionId,
      active: true,
    });
    testEmployeeId = emp.insertId;
  });

  describe('PDI - Planos de Desenvolvimento', () => {
    it('deve criar um PDI para o colaborador', async () => {
      const [pdi] = await db!.insert(pdiPlans).values({
        employeeId: testEmployeeId,
        status: 'em_andamento',
        startDate: new Date(),
        endDate: null,
        overallProgress: 0,
      });

      expect(pdi.insertId).toBeGreaterThan(0);

      // Verificar se foi criado
      const [created] = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.id, pdi.insertId))
        .limit(1);

      expect(created).toBeDefined();
      expect(created.employeeId).toBe(testEmployeeId);
      expect(created.status).toBe('em_andamento');
    });

    it('deve listar PDIs por colaborador', async () => {
      const pdis = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.employeeId, testEmployeeId));

      expect(pdis.length).toBeGreaterThan(0);
      expect(pdis[0].employeeId).toBe(testEmployeeId);
    });

    it('deve atualizar progresso do PDI', async () => {
      const [pdi] = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.employeeId, testEmployeeId))
        .limit(1);

      await db!.update(pdiPlans)
        .set({ overallProgress: 50 })
        .where(eq(pdiPlans.id, pdi.id));

      const [updated] = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.id, pdi.id))
        .limit(1);

      expect(updated.overallProgress).toBe(50);
    });
  });

  describe('Organograma - Estrutura Hierárquica', () => {
    it('deve criar nó de departamento no organograma', async () => {
      const [node] = await db!.insert(orgChartStructure).values({
        nodeType: 'department',
        departmentId: testDepartmentId,
        positionId: null,
        parentId: null,
        level: 0,
        orderIndex: 0,
        displayName: 'Departamento Teste PDI',
        active: true,
      });

      expect(node.insertId).toBeGreaterThan(0);

      // Verificar se foi criado
      const [created] = await db!.select()
        .from(orgChartStructure)
        .where(eq(orgChartStructure.id, node.insertId))
        .limit(1);

      expect(created).toBeDefined();
      expect(created.nodeType).toBe('department');
      expect(created.departmentId).toBe(testDepartmentId);
    });

    it('deve listar estrutura do organograma', async () => {
      const nodes = await db!.select()
        .from(orgChartStructure)
        .where(eq(orgChartStructure.active, true));

      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Movimentações - Histórico e Impacto', () => {
    it('deve registrar movimentação de colaborador', async () => {
      // Criar novo departamento para movimentação
      const [newDept] = await db!.insert(departments).values({
        name: `Novo Departamento Teste ${timestamp}`,
        code: `TEST-NEW-${timestamp}`,
        active: true,
      });

      // Buscar dados atuais do colaborador
      const [employee] = await db!.select()
        .from(employees)
        .where(eq(employees.id, testEmployeeId))
        .limit(1);

      // Registrar movimentação
      const [movement] = await db!.insert(employeeMovements).values({
        employeeId: testEmployeeId,
        previousDepartmentId: employee.departmentId,
        previousPositionId: employee.positionId,
        previousManagerId: employee.managerId,
        newDepartmentId: newDept.insertId,
        newPositionId: employee.positionId,
        newManagerId: employee.managerId,
        movementType: 'transferencia',
        reason: 'Teste de movimentação',
        notes: 'Movimentação para teste automatizado',
        effectiveDate: new Date(),
        createdBy: 1, // ID do usuário de teste
      });

      expect(movement.insertId).toBeGreaterThan(0);

      // Atualizar colaborador
      await db!.update(employees)
        .set({ departmentId: newDept.insertId })
        .where(eq(employees.id, testEmployeeId));

      // Verificar se foi atualizado
      const [updated] = await db!.select()
        .from(employees)
        .where(eq(employees.id, testEmployeeId))
        .limit(1);

      expect(updated.departmentId).toBe(newDept.insertId);

      // Verificar histórico
      const [registered] = await db!.select()
        .from(employeeMovements)
        .where(eq(employeeMovements.id, movement.insertId))
        .limit(1);

      expect(registered).toBeDefined();
      expect(registered.movementType).toBe('transferencia');
      expect(registered.newDepartmentId).toBe(newDept.insertId);
    });

    it('deve listar histórico de movimentações do colaborador', async () => {
      const movements = await db!.select()
        .from(employeeMovements)
        .where(eq(employeeMovements.employeeId, testEmployeeId));

      expect(movements.length).toBeGreaterThan(0);
      expect(movements[0].employeeId).toBe(testEmployeeId);
    });

    it('deve refletir movimentação em todo o sistema', async () => {
      // Verificar se o colaborador está no novo departamento
      const [employee] = await db!.select()
        .from(employees)
        .where(eq(employees.id, testEmployeeId))
        .limit(1);

      // Verificar se existe histórico
      const movements = await db!.select()
        .from(employeeMovements)
        .where(eq(employeeMovements.employeeId, testEmployeeId));

      expect(employee).toBeDefined();
      expect(movements.length).toBeGreaterThan(0);

      // Verificar consistência entre dados atuais e histórico
      const lastMovement = movements[movements.length - 1];
      expect(employee.departmentId).toBe(lastMovement.newDepartmentId);
    });
  });

  describe('Integração PDI + Organograma + Movimentações', () => {
    it('deve manter PDI vinculado ao colaborador após movimentação', async () => {
      // Buscar PDI do colaborador
      const pdis = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.employeeId, testEmployeeId));

      expect(pdis.length).toBeGreaterThan(0);

      // Verificar que o PDI ainda está vinculado ao colaborador
      // mesmo após movimentação
      const [employee] = await db!.select()
        .from(employees)
        .where(eq(employees.id, testEmployeeId))
        .limit(1);

      expect(employee).toBeDefined();
      expect(pdis[0].employeeId).toBe(employee.id);
    });

    it('deve permitir consultar PDIs e movimentações juntos', async () => {
      // Buscar PDIs
      const pdis = await db!.select()
        .from(pdiPlans)
        .where(eq(pdiPlans.employeeId, testEmployeeId));

      // Buscar movimentações
      const movements = await db!.select()
        .from(employeeMovements)
        .where(eq(employeeMovements.employeeId, testEmployeeId));

      // Verificar que ambos existem para o mesmo colaborador
      expect(pdis.length).toBeGreaterThan(0);
      expect(movements.length).toBeGreaterThan(0);
      expect(pdis[0].employeeId).toBe(movements[0].employeeId);
    });
  });
});
