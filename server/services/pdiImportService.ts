import * as XLSX from 'xlsx';
import { getDb } from '../db';
import { 
  pdiPlans, 
  pdiItems, 
  pdiImportHistory, 
  employees, 
  evaluationCycles,
  competencies,
  developmentActions
} from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Estrutura esperada do arquivo de importação de PDI
 */
export interface PDIImportRow {
  // Identificação do colaborador
  matricula?: string;
  cpf?: string;
  email?: string;
  nome_colaborador: string;
  
  // Informações do PDI
  ciclo: string;
  cargo_alvo?: string;
  data_inicio: string;
  data_fim: string;
  
  // Itens do PDI
  competencia: string;
  acao_desenvolvimento: string;
  categoria: '70_pratica' | '20_mentoria' | '10_curso';
  tipo_acao?: string;
  descricao_acao?: string;
  data_inicio_acao: string;
  data_fim_acao: string;
  responsavel?: string;
  status?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
}

/**
 * Resultado da validação de uma linha
 */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

/**
 * Resultado da importação
 */
export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  importHistoryId?: number;
}

/**
 * Parser de arquivo Excel/CSV para PDI
 */
export class PDIImportParser {
  
  /**
   * Ler arquivo e converter para array de objetos
   */
  static async parseFile(buffer: Buffer, fileType: 'xlsx' | 'xls' | 'csv'): Promise<PDIImportRow[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const data = XLSX.utils.sheet_to_json<PDIImportRow>(worksheet, {
        raw: false, // Manter strings
        defval: '', // Valor padrão para células vazias
      });
      
      return data;
    } catch (error) {
      throw new Error(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Validar estrutura e dados do arquivo
   */
  static async validateData(data: PDIImportRow[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const db = await getDb();
    
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Campos obrigatórios
    const requiredFields: (keyof PDIImportRow)[] = [
      'nome_colaborador',
      'ciclo',
      'data_inicio',
      'data_fim',
      'competencia',
      'acao_desenvolvimento',
      'categoria',
      'data_inicio_acao',
      'data_fim_acao'
    ];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque linha 1 é cabeçalho e arrays começam em 0
      
      // Validar campos obrigatórios
      for (const field of requiredFields) {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: rowNumber,
            field,
            message: `Campo obrigatório não preenchido`,
            value: row[field]?.toString()
          });
        }
      }
      
      // Validar formato de datas
      const dateFields: (keyof PDIImportRow)[] = ['data_inicio', 'data_fim', 'data_inicio_acao', 'data_fim_acao'];
      for (const field of dateFields) {
        if (row[field]) {
          const dateValue = this.parseDate(row[field].toString());
          if (!dateValue) {
            errors.push({
              row: rowNumber,
              field,
              message: `Data inválida (use formato DD/MM/AAAA ou AAAA-MM-DD)`,
              value: row[field].toString()
            });
          }
        }
      }
      
      // Validar categoria
      if (row.categoria && !['70_pratica', '20_mentoria', '10_curso'].includes(row.categoria)) {
        errors.push({
          row: rowNumber,
          field: 'categoria',
          message: `Categoria inválida (use: 70_pratica, 20_mentoria ou 10_curso)`,
          value: row.categoria
        });
      }
      
      // Validar status
      if (row.status && !['pendente', 'em_andamento', 'concluido', 'cancelado'].includes(row.status)) {
        errors.push({
          row: rowNumber,
          field: 'status',
          message: `Status inválido (use: pendente, em_andamento, concluido ou cancelado)`,
          value: row.status
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Converter string de data para Date
   */
  static parseDate(dateStr: string): Date | null {
    // Tentar formato DD/MM/AAAA
    const brFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const brMatch = dateStr.match(brFormat);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Tentar formato AAAA-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoMatch = dateStr.match(isoFormat);
    if (isoMatch) {
      return new Date(dateStr);
    }
    
    return null;
  }
  
  /**
   * Buscar ID do colaborador por matrícula, CPF ou email
   */
  static async findEmployeeId(
    row: PDIImportRow,
    db: any
  ): Promise<number | null> {
    // Buscar por matrícula
    if (row.matricula) {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.registrationNumber, row.matricula))
        .limit(1);
      if (result.length > 0) return result[0].id;
    }
    
    // Buscar por CPF
    if (row.cpf) {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.cpf, row.cpf.replace(/\D/g, '')))
        .limit(1);
      if (result.length > 0) return result[0].id;
    }
    
    // Buscar por email
    if (row.email) {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.email, row.email.toLowerCase()))
        .limit(1);
      if (result.length > 0) return result[0].id;
    }
    
    return null;
  }
  
  /**
   * Buscar ID do ciclo por nome
   */
  static async findCycleId(cycleName: string, db: any): Promise<number | null> {
    const result = await db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.name, cycleName))
      .limit(1);
    return result.length > 0 ? result[0].id : null;
  }
  
  /**
   * Buscar ID da competência por nome
   */
  static async findCompetencyId(competencyName: string, db: any): Promise<number | null> {
    const result = await db
      .select()
      .from(competencies)
      .where(eq(competencies.name, competencyName))
      .limit(1);
    return result.length > 0 ? result[0].id : null;
  }
  
  /**
   * Processar importação completa
   */
  static async processImport(
    buffer: Buffer,
    fileName: string,
    fileSize: number,
    fileType: 'xlsx' | 'xls' | 'csv',
    userId: number
  ): Promise<ImportResult> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Criar registro de histórico
    const [historyResult] = await db.insert(pdiImportHistory).values({
      fileName,
      fileSize,
      fileType,
      status: 'processando',
      totalRecords: 0,
      successCount: 0,
      errorCount: 0,
      importedBy: userId,
      startedAt: new Date(),
    });
    
    const importHistoryId = historyResult.insertId;
    
    try {
      // Parse do arquivo
      const data = await this.parseFile(buffer, fileType);
      
      // Validar dados
      const validationErrors = await this.validateData(data);
      
      if (validationErrors.length > 0) {
        // Atualizar histórico com erros
        await db.update(pdiImportHistory)
          .set({
            status: 'erro',
            totalRecords: data.length,
            errorCount: validationErrors.length,
            errors: validationErrors,
            completedAt: new Date(),
          })
          .where(eq(pdiImportHistory.id, importHistoryId));
        
        return {
          success: false,
          totalRecords: data.length,
          successCount: 0,
          errorCount: validationErrors.length,
          errors: validationErrors,
          importHistoryId,
        };
      }
      
      // Agrupar linhas por PDI (mesmo colaborador + ciclo)
      const pdiGroups = new Map<string, PDIImportRow[]>();
      
      for (const row of data) {
        const key = `${row.email || row.cpf || row.matricula}_${row.ciclo}`;
        if (!pdiGroups.has(key)) {
          pdiGroups.set(key, []);
        }
        pdiGroups.get(key)!.push(row);
      }
      
      let successCount = 0;
      const importErrors: ValidationError[] = [];
      
      // Processar cada grupo (PDI)
      for (const [key, rows] of pdiGroups.entries()) {
        const firstRow = rows[0];
        
        try {
          // Buscar IDs necessários
          const employeeId = await this.findEmployeeId(firstRow, db);
          if (!employeeId) {
            importErrors.push({
              row: 0,
              field: 'colaborador',
              message: `Colaborador não encontrado: ${firstRow.nome_colaborador}`,
              value: firstRow.email || firstRow.cpf || firstRow.matricula
            });
            continue;
          }
          
          const cycleId = await this.findCycleId(firstRow.ciclo, db);
          if (!cycleId) {
            importErrors.push({
              row: 0,
              field: 'ciclo',
              message: `Ciclo não encontrado: ${firstRow.ciclo}`,
              value: firstRow.ciclo
            });
            continue;
          }
          
          // Criar ou atualizar PDI
          const startDate = this.parseDate(firstRow.data_inicio)!;
          const endDate = this.parseDate(firstRow.data_fim)!;
          
          // Verificar se já existe PDI para este colaborador e ciclo
          const existingPDI = await db
            .select()
            .from(pdiPlans)
            .where(
              and(
                eq(pdiPlans.employeeId, employeeId),
                eq(pdiPlans.cycleId, cycleId)
              )
            )
            .limit(1);
          
          let planId: number;
          
          if (existingPDI.length > 0) {
            // Atualizar PDI existente
            planId = existingPDI[0].id;
            await db.update(pdiPlans)
              .set({
                startDate,
                endDate,
                status: 'rascunho',
              })
              .where(eq(pdiPlans.id, planId));
            
            // Remover itens antigos
            await db.delete(pdiItems).where(eq(pdiItems.planId, planId));
          } else {
            // Criar novo PDI
            const [result] = await db.insert(pdiPlans).values({
              cycleId,
              employeeId,
              startDate,
              endDate,
              status: 'rascunho',
              overallProgress: 0,
            });
            planId = result.insertId;
          }
          
          // Inserir itens do PDI
          for (const row of rows) {
            const competencyId = await this.findCompetencyId(row.competencia, db);
            if (!competencyId) {
              importErrors.push({
                row: 0,
                field: 'competencia',
                message: `Competência não encontrada: ${row.competencia}`,
                value: row.competencia
              });
              continue;
            }
            
            await db.insert(pdiItems).values({
              planId,
              competencyId,
              title: row.acao_desenvolvimento,
              description: row.descricao_acao || row.acao_desenvolvimento,
              category: row.categoria,
              type: row.tipo_acao || null,
              startDate: this.parseDate(row.data_inicio_acao)!,
              endDate: this.parseDate(row.data_fim_acao)!,
              status: row.status || 'pendente',
              progress: 0,
            });
          }
          
          successCount++;
        } catch (error) {
          importErrors.push({
            row: 0,
            field: 'geral',
            message: `Erro ao processar PDI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            value: key
          });
        }
      }
      
      // Atualizar histórico
      const finalStatus = importErrors.length === 0 ? 'concluido' : 
                         successCount > 0 ? 'parcial' : 'erro';
      
      await db.update(pdiImportHistory)
        .set({
          status: finalStatus,
          totalRecords: data.length,
          successCount,
          errorCount: importErrors.length,
          errors: importErrors.length > 0 ? importErrors : null,
          completedAt: new Date(),
        })
        .where(eq(pdiImportHistory.id, importHistoryId));
      
      return {
        success: importErrors.length === 0,
        totalRecords: data.length,
        successCount,
        errorCount: importErrors.length,
        errors: importErrors,
        importHistoryId,
      };
      
    } catch (error) {
      // Atualizar histórico com erro fatal
      await db.update(pdiImportHistory)
        .set({
          status: 'erro',
          errorCount: 1,
          errors: [{
            row: 0,
            field: 'sistema',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          }],
          completedAt: new Date(),
        })
        .where(eq(pdiImportHistory.id, importHistoryId));
      
      throw error;
    }
  }
  
  /**
   * Gerar template de exemplo para download
   */
  static generateTemplate(): Buffer {
    const template: PDIImportRow[] = [
      {
        matricula: '12345',
        cpf: '123.456.789-00',
        email: 'colaborador@empresa.com',
        nome_colaborador: 'João da Silva',
        ciclo: '2025',
        cargo_alvo: 'Gerente de Projetos',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Liderança',
        acao_desenvolvimento: 'Participar de treinamento de liderança',
        categoria: '10_curso',
        tipo_acao: 'curso_online',
        descricao_acao: 'Curso de Liderança Estratégica - 40h',
        data_inicio_acao: '01/02/2025',
        data_fim_acao: '28/02/2025',
        responsavel: 'RH',
        status: 'pendente',
      },
      {
        matricula: '12345',
        cpf: '123.456.789-00',
        email: 'colaborador@empresa.com',
        nome_colaborador: 'João da Silva',
        ciclo: '2025',
        cargo_alvo: 'Gerente de Projetos',
        data_inicio: '01/01/2025',
        data_fim: '31/12/2025',
        competencia: 'Gestão de Projetos',
        acao_desenvolvimento: 'Liderar projeto estratégico',
        categoria: '70_pratica',
        tipo_acao: 'projeto',
        descricao_acao: 'Assumir liderança do projeto de transformação digital',
        data_inicio_acao: '01/03/2025',
        data_fim_acao: '30/06/2025',
        responsavel: 'Gestor Direto',
        status: 'pendente',
      },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDI');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
