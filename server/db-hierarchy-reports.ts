import { eq, sql, and } from "drizzle-orm";
import { getDb } from "./db";
import { employees, employeeHierarchy } from "../drizzle/schema";

/**
 * Helpers para relatórios hierárquicos
 */

export interface SpanOfControlReport {
  managerId: number;
  managerName: string;
  managerEmail: string | null;
  managerChapa: string | null;
  directSubordinates: number;
  indirectSubordinates: number;
  totalSubordinates: number;
  levels: number;
  subordinatesList: Array<{
    id: number;
    name: string;
    email: string | null;
    chapa: string | null;
    level: number; // Nível de distância do gestor (1 = direto, 2 = indireto, etc.)
  }>;
}

export interface HierarchyDepthReport {
  totalLevels: number;
  employeesByLevel: Array<{
    level: number;
    levelName: string;
    count: number;
    employees: Array<{
      id: number;
      name: string;
      email: string | null;
      chapa: string | null;
    }>;
  }>;
  averageSpan: number;
  maxSpan: number;
  minSpan: number;
}

/**
 * Gerar relatório de span of control (amplitude de controle)
 */
export async function generateSpanOfControlReport(
  managerId?: number
): Promise<SpanOfControlReport[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar todos os gestores (funcionários que têm subordinados)
    const managers = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
      })
      .from(employees)
      .where(
        and(
          eq(employees.active, true),
          managerId ? eq(employees.id, managerId) : sql`1=1`
        )
      );

    const reports: SpanOfControlReport[] = [];

    for (const manager of managers) {
      // Buscar subordinados diretos
      const directSubs = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          chapa: employees.chapa,
        })
        .from(employees)
        .where(
          and(
            eq(employees.managerId, manager.id),
            eq(employees.active, true)
          )
        );

      if (directSubs.length === 0) continue; // Pular se não tem subordinados

      // Buscar subordinados indiretos recursivamente
      const allSubordinates: Array<{
        id: number;
        name: string;
        email: string | null;
        chapa: string | null;
        level: number;
      }> = [];

      const visited = new Set<number>();
      const queue: Array<{ id: number; level: number }> = directSubs.map((s) => ({
        id: s.id,
        level: 1,
      }));

      // Adicionar subordinados diretos
      directSubs.forEach((s) => {
        allSubordinates.push({ ...s, level: 1 });
        visited.add(s.id);
      });

      // BFS para encontrar subordinados indiretos
      while (queue.length > 0) {
        const current = queue.shift()!;

        const indirectSubs = await db
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
            chapa: employees.chapa,
          })
          .from(employees)
          .where(
            and(
              eq(employees.managerId, current.id),
              eq(employees.active, true)
            )
          );

        for (const sub of indirectSubs) {
          if (!visited.has(sub.id)) {
            visited.add(sub.id);
            allSubordinates.push({ ...sub, level: current.level + 1 });
            queue.push({ id: sub.id, level: current.level + 1 });
          }
        }
      }

      const indirectCount = allSubordinates.filter((s) => s.level > 1).length;
      const maxLevel = allSubordinates.reduce(
        (max, s) => Math.max(max, s.level),
        0
      );

      reports.push({
        managerId: manager.id,
        managerName: manager.name,
        managerEmail: manager.email,
        managerChapa: manager.chapa,
        directSubordinates: directSubs.length,
        indirectSubordinates: indirectCount,
        totalSubordinates: allSubordinates.length,
        levels: maxLevel,
        subordinatesList: allSubordinates,
      });
    }

    // Ordenar por total de subordinados (decrescente)
    return reports.sort((a, b) => b.totalSubordinates - a.totalSubordinates);
  } catch (error) {
    console.error("[Database] Failed to generate span of control report:", error);
    return [];
  }
}

/**
 * Gerar relatório de profundidade hierárquica
 */
export async function generateHierarchyDepthReport(): Promise<HierarchyDepthReport | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Buscar todos os funcionários ativos
    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
        managerId: employees.managerId,
      })
      .from(employees)
      .where(eq(employees.active, true));

    // Calcular nível de cada funcionário (distância da raiz)
    const employeeLevels = new Map<number, number>();
    const employeeData = new Map<number, typeof allEmployees[0]>();

    allEmployees.forEach((emp) => {
      employeeData.set(emp.id, emp);
    });

    // Função para calcular nível recursivamente
    const calculateLevel = (empId: number, visited = new Set<number>()): number => {
      if (visited.has(empId)) return 0; // Evitar loops infinitos
      visited.add(empId);

      const emp = employeeData.get(empId);
      if (!emp || !emp.managerId) return 0; // Raiz da hierarquia

      return 1 + calculateLevel(emp.managerId, visited);
    };

    // Calcular níveis
    allEmployees.forEach((emp) => {
      const level = calculateLevel(emp.id);
      employeeLevels.set(emp.id, level);
    });

    // Agrupar por nível
    const levelGroups = new Map<number, typeof allEmployees>();
    employeeLevels.forEach((level, empId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      const emp = employeeData.get(empId)!;
      levelGroups.get(level)!.push(emp);
    });

    // Calcular estatísticas de span of control
    const spans: number[] = [];
    allEmployees.forEach((emp) => {
      const subordinates = allEmployees.filter((e) => e.managerId === emp.id);
      if (subordinates.length > 0) {
        spans.push(subordinates.length);
      }
    });

    const averageSpan = spans.length > 0
      ? spans.reduce((sum, s) => sum + s, 0) / spans.length
      : 0;
    const maxSpan = spans.length > 0 ? Math.max(...spans) : 0;
    const minSpan = spans.length > 0 ? Math.min(...spans) : 0;

    // Montar relatório
    const employeesByLevel = Array.from(levelGroups.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, emps]) => ({
        level,
        levelName: getLevelName(level),
        count: emps.length,
        employees: emps.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          chapa: e.chapa,
        })),
      }));

    return {
      totalLevels: levelGroups.size,
      employeesByLevel,
      averageSpan: Math.round(averageSpan * 10) / 10,
      maxSpan,
      minSpan,
    };
  } catch (error) {
    console.error("[Database] Failed to generate hierarchy depth report:", error);
    return null;
  }
}

/**
 * Obter nome do nível hierárquico
 */
function getLevelName(level: number): string {
  const names = [
    "Presidência",
    "Diretoria",
    "Gerência",
    "Coordenação",
    "Supervisão",
    "Operacional",
  ];
  return names[level] || `Nível ${level}`;
}

/**
 * Gerar relatório de distribuição de subordinados
 */
export async function generateSubordinateDistributionReport() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar todos os gestores e contar subordinados diretos
    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
        managerId: employees.managerId,
      })
      .from(employees)
      .where(eq(employees.active, true));

    const distribution = allEmployees
      .map((manager) => {
        const subordinates = allEmployees.filter(
          (e) => e.managerId === manager.id
        );
        return {
          managerId: manager.id,
          managerName: manager.name,
          managerEmail: manager.email,
          managerChapa: manager.chapa,
          subordinateCount: subordinates.length,
        };
      })
      .filter((m) => m.subordinateCount > 0)
      .sort((a, b) => b.subordinateCount - a.subordinateCount);

    return distribution;
  } catch (error) {
    console.error(
      "[Database] Failed to generate subordinate distribution report:",
      error
    );
    return [];
  }
}
