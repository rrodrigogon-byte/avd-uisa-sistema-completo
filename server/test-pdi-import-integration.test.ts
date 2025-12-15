import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { PDIImportParser } from './services/pdiImportService';
import * as XLSX from 'xlsx';
import { employees, evaluationCycles, competencies } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('PDI Import Integration', () => {
  let testEmployeeId: number;
  let testCycleId: number;
  let testCompetencyId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verificar se já existe o colaborador de teste
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, 'rrodrigogoni@gmail.com'))
      .limit(1);

    if (existingEmployee.length > 0) {
      testEmployeeId = existingEmployee[0].id;
    } else {
      // Criar colaborador de teste se não existir
      const [result] = await db.insert(employees).values({
        name: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        department: 'DHO',
        position: 'Diretor DHO',
        hireDate: new Date('2020-01-01'),
        status: 'ativo',
      });
      testEmployeeId = result.insertId;
    }

    // Verificar se já existe o ciclo de teste
    const existingCycle = await db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.name, '2025'))
      .limit(1);

    if (existingCycle.length > 0) {
      testCycleId = existingCycle[0].id;
    } else {
      // Criar ciclo de teste se não existir
      const [cycleResult] = await db.insert(evaluationCycles).values({
        name: '2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'ativo',
      });
      testCycleId = cycleResult.insertId;
    }

    // Verificar se já existe a competência de teste
    const existingCompetency = await db
      .select()
      .from(competencies)
      .where(eq(competencies.name, 'Liderança'))
      .limit(1);

    if (existingCompetency.length > 0) {
      testCompetencyId = existingCompetency[0].id;
    } else {
      // Criar competência de teste se não existir
      const [compResult] = await db.insert(competencies).values({
        name: 'Liderança',
        description: 'Capacidade de liderar equipes',
        category: 'comportamental',
      });
      testCompetencyId = compResult.insertId;
    }
  });

  it('should process import without freezing', async () => {
    // Criar um arquivo Excel de teste
    const testData = [
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Participar de workshop de liderança',
        categoria: '10_curso',
        data_inicio_acao: '01/02/2025',
        data_fim_acao: '28/02/2025',
        status: 'pendente'
      }
    ];

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDI');

    // Converter para buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Processar importação
    const startTime = Date.now();
    const result = await PDIImportParser.processImport(
      buffer,
      'test-pdi.xlsx',
      buffer.length,
      'xlsx',
      testEmployeeId
    );
    const endTime = Date.now();

    // Verificar que não travou (processou em menos de 10 segundos)
    expect(endTime - startTime).toBeLessThan(10000);

    // Verificar resultado
    expect(result).toBeDefined();
    expect(result.totalRecords).toBe(1);
    expect(result.importHistoryId).toBeDefined();

    // Verificar que o resultado foi processado (sucesso ou erro, mas não travou)
    expect(result.successCount + result.errorCount).toBeGreaterThan(0);
  }, 15000); // Timeout de 15 segundos

  it('should handle multiple PDI items for same employee', async () => {
    // Criar arquivo com múltiplas ações para o mesmo PDI
    const testData = [
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Liderar projeto estratégico',
        categoria: '70_pratica',
        data_inicio_acao: '01/02/2025',
        data_fim_acao: '30/06/2025',
        status: 'pendente'
      },
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Mentoria com CEO',
        categoria: '20_mentoria',
        data_inicio_acao: '01/03/2025',
        data_fim_acao: '31/05/2025',
        status: 'pendente'
      },
      {
        nome_colaborador: 'Rodrigo Ribeiro goncalves',
        email: 'rrodrigogoni@gmail.com',
        ciclo: '2025',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Curso de gestão avançada',
        categoria: '10_curso',
        data_inicio_acao: '01/04/2025',
        data_fim_acao: '30/04/2025',
        status: 'pendente'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDI');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await PDIImportParser.processImport(
      buffer,
      'test-pdi-multiple.xlsx',
      buffer.length,
      'xlsx',
      testEmployeeId
    );

    expect(result).toBeDefined();
    expect(result.totalRecords).toBe(3);
    // Deve criar 1 PDI com 3 itens
    expect(result.successCount).toBeGreaterThan(0);
  }, 15000);
});
