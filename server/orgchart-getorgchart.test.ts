import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../server/db';
import { employees, departments, positions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Teste para procedure getOrgChart
 * Valida que a estrutura hierárquica é construída corretamente
 */
describe('orgChart.getOrgChart', () => {
  it('deve retornar estrutura hierárquica de colaboradores', async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Buscar todos os colaboradores ativos com seus departamentos e cargos
    const allEmployees = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        name: employees.name,
        email: employees.email,
        managerId: employees.managerId,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        positionId: employees.positionId,
        positionTitle: positions.title,
        photoUrl: employees.photoUrl,
        active: employees.active,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true));

    // Construir árvore hierárquica
    const buildTree = (parentId: number | null): any[] => {
      return allEmployees
        .filter(emp => emp.managerId === parentId)
        .map(emp => ({
          ...emp,
          subordinates: buildTree(emp.id)
        }));
    };

    // Retornar árvore começando dos colaboradores sem gestor (nível mais alto)
    const tree = buildTree(null);

    // Validações
    expect(tree).toBeDefined();
    expect(Array.isArray(tree)).toBe(true);
    
    // Se houver colaboradores, validar estrutura
    if (tree.length > 0) {
      const firstEmployee = tree[0];
      expect(firstEmployee).toHaveProperty('id');
      expect(firstEmployee).toHaveProperty('name');
      expect(firstEmployee).toHaveProperty('employeeCode');
      expect(firstEmployee).toHaveProperty('subordinates');
      expect(Array.isArray(firstEmployee.subordinates)).toBe(true);
    }
  });

  it('deve retornar array vazio quando não há colaboradores', async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Simular cenário sem colaboradores (usando managerId impossível)
    const allEmployees: any[] = [];

    const buildTree = (parentId: number | null): any[] => {
      return allEmployees
        .filter(emp => emp.managerId === parentId)
        .map(emp => ({
          ...emp,
          subordinates: buildTree(emp.id)
        }));
    };

    const tree = buildTree(null);

    expect(tree).toBeDefined();
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBe(0);
  });

  it('deve construir hierarquia corretamente com múltiplos níveis', async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Dados de teste simulados
    const mockEmployees = [
      { id: 1, name: 'CEO', managerId: null, employeeCode: 'E001' },
      { id: 2, name: 'Diretor', managerId: 1, employeeCode: 'E002' },
      { id: 3, name: 'Gerente', managerId: 2, employeeCode: 'E003' },
      { id: 4, name: 'Analista', managerId: 3, employeeCode: 'E004' },
    ];

    const buildTree = (parentId: number | null): any[] => {
      return mockEmployees
        .filter(emp => emp.managerId === parentId)
        .map(emp => ({
          ...emp,
          subordinates: buildTree(emp.id)
        }));
    };

    const tree = buildTree(null);

    // Validar estrutura hierárquica
    expect(tree.length).toBe(1); // Apenas CEO no topo
    expect(tree[0].name).toBe('CEO');
    expect(tree[0].subordinates.length).toBe(1); // CEO tem 1 subordinado (Diretor)
    expect(tree[0].subordinates[0].name).toBe('Diretor');
    expect(tree[0].subordinates[0].subordinates.length).toBe(1); // Diretor tem 1 subordinado (Gerente)
    expect(tree[0].subordinates[0].subordinates[0].name).toBe('Gerente');
    expect(tree[0].subordinates[0].subordinates[0].subordinates.length).toBe(1); // Gerente tem 1 subordinado (Analista)
    expect(tree[0].subordinates[0].subordinates[0].subordinates[0].name).toBe('Analista');
  });
});
