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
  static async parseFile(buffer: Buffer, fileType: 'xlsx' | 'xls' | 'csv' | 'txt' | 'html'): Promise<PDIImportRow[]> {
    try {
      // Se for .txt ou .html, usar parser inteligente
      if (fileType === 'txt' || fileType === 'html') {
        return await this.parseTextOrHtml(buffer, fileType);
      }
      
      // Para Excel/CSV, usar XLSX
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
   * Parser inteligente para arquivos .txt e .html
   * Extrai: nome, cargo, competências e plano de ação 70-20-10
   */
  static async parseTextOrHtml(buffer: Buffer, fileType: 'txt' | 'html'): Promise<PDIImportRow[]> {
    const content = buffer.toString('utf-8');
    
    // Remover tags HTML se necessário
    let text = content;
    if (fileType === 'html') {
      text = content
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    
    // Normalizar espaços
    text = text.replace(/\s+/g, ' ').trim();
    
    // Extrair dados
    const data: PDIImportRow = {
      nome_colaborador: this.extractField(text, ['nome', 'colaborador', 'funcionário', 'nome completo']) || 'Não identificado',
      ciclo: this.extractField(text, ['ciclo', 'período', 'ano']) || new Date().getFullYear().toString(),
      cargo_alvo: this.extractField(text, ['cargo', 'posição', 'função', 'cargo alvo']),
      data_inicio: this.extractDate(text, ['data de início', 'início', 'data inicial']) || this.formatDate(new Date()),
      data_fim: this.extractDate(text, ['data de término', 'término', 'data final', 'fim']) || this.formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      email: this.extractEmail(text),
      competencia: '',
      acao_desenvolvimento: '',
      categoria: '70_pratica',
      data_inicio_acao: this.formatDate(new Date()),
      data_fim_acao: this.formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    };
    
    // Extrair competências e ações
    const items = this.extractPDIItems(text);
    
    if (items.length === 0) {
      // Se não encontrou itens estruturados, criar um item genérico
      return [{
        ...data,
        competencia: 'Desenvolvimento Geral',
        acao_desenvolvimento: 'Ações de desenvolvimento conforme documento',
        categoria: '70_pratica',
      }];
    }
    
    // Retornar um registro para cada item
    return items.map(item => ({
      ...data,
      ...item,
    }));
  }
  
  /**
   * Extrair campo por palavras-chave
   */
  static extractField(text: string, keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}\\s*:?\\s*([^\\n\\r.;]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }
  
  /**
   * Extrair data por palavras-chave
   */
  static extractDate(text: string, keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}\\s*:?\\s*(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }
  
  /**
   * Extrair email
   */
  static extractEmail(text: string): string | undefined {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(regex);
    return match ? match[0] : undefined;
  }
  
  /**
   * Formatar data para DD/MM/AAAA
   */
  static formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Extrair itens do PDI (competências e ações)
   */
  static extractPDIItems(text: string): Array<Pick<PDIImportRow, 'competencia' | 'acao_desenvolvimento' | 'categoria'>> {
    const items: Array<Pick<PDIImportRow, 'competencia' | 'acao_desenvolvimento' | 'categoria'>> = [];
    
    // Padrões para identificar competências
    const competencyPatterns = [
      /competência\s*:?\s*([^\n\r]+)/gi,
      /habilidade\s*:?\s*([^\n\r]+)/gi,
      /área de desenvolvimento\s*:?\s*([^\n\r]+)/gi,
    ];
    
    // Padrões para identificar ações
    const actionPatterns = [
      /ação\s*:?\s*([^\n\r]+)/gi,
      /atividade\s*:?\s*([^\n\r]+)/gi,
      /desenvolvimento\s*:?\s*([^\n\r]+)/gi,
    ];
    
    // Extrair competências
    const competencies: string[] = [];
    for (const pattern of competencyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        competencies.push(match[1].trim());
      }
    }
    
    // Extrair ações
    const actions: string[] = [];
    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        actions.push(match[1].trim());
      }
    }
    
    // Identificar categorias 70-20-10
    const text70 = /70[%\s]*[-:]?\s*([^\n\r.;]+)/gi;
    const text20 = /20[%\s]*[-:]?\s*([^\n\r.;]+)/gi;
    const text10 = /10[%\s]*[-:]?\s*([^\n\r.;]+)/gi;
    
    let match70, match20, match10;
    while ((match70 = text70.exec(text)) !== null) {
      items.push({
        competencia: competencies[0] || 'Prática no trabalho',
        acao_desenvolvimento: match70[1].trim(),
        categoria: '70_pratica',
      });
    }
    
    while ((match20 = text20.exec(text)) !== null) {
      items.push({
        competencia: competencies[0] || 'Mentoria e feedback',
        acao_desenvolvimento: match20[1].trim(),
        categoria: '20_mentoria',
      });
    }
    
    while ((match10 = text10.exec(text)) !== null) {
      items.push({
        competencia: competencies[0] || 'Cursos e treinamentos',
        acao_desenvolvimento: match10[1].trim(),
        categoria: '10_curso',
      });
    }
    
    // Se encontrou competências e ações mas não categorizou, criar itens genéricos
    if (items.length === 0 && (competencies.length > 0 || actions.length > 0)) {
      const maxLength = Math.max(competencies.length, actions.length);
      for (let i = 0; i < maxLength; i++) {
        items.push({
          competencia: competencies[i] || 'Desenvolvimento Geral',
          acao_desenvolvimento: actions[i] || 'Ação de desenvolvimento',
          categoria: '70_pratica',
        });
      }
    }
    
    return items;
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
    fileType: 'xlsx' | 'xls' | 'csv' | 'txt' | 'html',
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
  static generateTemplate(level?: string): Buffer {
    // Templates personalizados por nível hierárquico
    const templates: Record<string, PDIImportRow[]> = {
      'analista': [
        {
          matricula: '12345',
          cpf: '123.456.789-00',
          email: 'analista@empresa.com',
          nome_colaborador: 'Maria Analista',
          ciclo: '2025',
          cargo_alvo: 'Analista Sênior',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Análise de Dados',
          acao_desenvolvimento: 'Curso de Excel Avançado e Power BI',
          categoria: '10_curso',
          tipo_acao: 'curso_online',
          descricao_acao: 'Curso de Excel Avançado e Power BI - 60h',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '28/02/2025',
          responsavel: 'RH',
          status: 'pendente',
        },
        {
          matricula: '12345',
          cpf: '123.456.789-00',
          email: 'analista@empresa.com',
          nome_colaborador: 'Maria Analista',
          ciclo: '2025',
          cargo_alvo: 'Analista Sênior',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Comunicação',
          acao_desenvolvimento: 'Apresentar relatórios mensais para a equipe',
          categoria: '70_pratica',
          tipo_acao: 'projeto',
          descricao_acao: 'Desenvolver habilidades de apresentação através da prática',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'Gestor Direto',
          status: 'pendente',
        },
      ],
      'especialista': [
        {
          matricula: '23456',
          cpf: '234.567.890-11',
          email: 'especialista@empresa.com',
          nome_colaborador: 'João Especialista',
          ciclo: '2025',
          cargo_alvo: 'Especialista Sênior',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Expertise Técnica',
          acao_desenvolvimento: 'Certificação profissional na área de atuação',
          categoria: '10_curso',
          tipo_acao: 'certificacao',
          descricao_acao: 'Obter certificação reconhecida no mercado',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '30/06/2025',
          responsavel: 'RH',
          status: 'pendente',
        },
        {
          matricula: '23456',
          cpf: '234.567.890-11',
          email: 'especialista@empresa.com',
          nome_colaborador: 'João Especialista',
          ciclo: '2025',
          cargo_alvo: 'Especialista Sênior',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Mentoria',
          acao_desenvolvimento: 'Mentorar analistas juniores',
          categoria: '20_mentoria',
          tipo_acao: 'mentoria',
          descricao_acao: 'Desenvolver habilidades de mentoria orientando 2-3 analistas',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'Gestor Direto',
          status: 'pendente',
        },
      ],
      'supervisor': [
        {
          matricula: '34567',
          cpf: '345.678.901-22',
          email: 'supervisor@empresa.com',
          nome_colaborador: 'Carlos Supervisor',
          ciclo: '2025',
          cargo_alvo: 'Coordenador',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Liderança de Equipes',
          acao_desenvolvimento: 'Curso de Liderança e Gestão de Pessoas',
          categoria: '10_curso',
          tipo_acao: 'curso_presencial',
          descricao_acao: 'Programa de Desenvolvimento de Liderança - 80h',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '31/03/2025',
          responsavel: 'RH',
          status: 'pendente',
        },
        {
          matricula: '34567',
          cpf: '345.678.901-22',
          email: 'supervisor@empresa.com',
          nome_colaborador: 'Carlos Supervisor',
          ciclo: '2025',
          cargo_alvo: 'Coordenador',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Gestão de Conflitos',
          acao_desenvolvimento: 'Liderar projeto de melhoria de processos',
          categoria: '70_pratica',
          tipo_acao: 'projeto',
          descricao_acao: 'Desenvolver habilidades de gestão através de projeto real',
          data_inicio_acao: '01/04/2025',
          data_fim_acao: '30/09/2025',
          responsavel: 'Coordenador',
          status: 'pendente',
        },
      ],
      'coordenador': [
        {
          matricula: '45678',
          cpf: '456.789.012-33',
          email: 'coordenador@empresa.com',
          nome_colaborador: 'Ana Coordenadora',
          ciclo: '2025',
          cargo_alvo: 'Gerente',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Gestão Estratégica',
          acao_desenvolvimento: 'MBA em Gestão Empresarial',
          categoria: '10_curso',
          tipo_acao: 'pos_graduacao',
          descricao_acao: 'MBA em Gestão Empresarial - 360h',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'RH',
          status: 'pendente',
        },
        {
          matricula: '45678',
          cpf: '456.789.012-33',
          email: 'coordenador@empresa.com',
          nome_colaborador: 'Ana Coordenadora',
          ciclo: '2025',
          cargo_alvo: 'Gerente',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Visão de Negócios',
          acao_desenvolvimento: 'Participar de reuniões estratégicas com diretoria',
          categoria: '70_pratica',
          tipo_acao: 'exposicao',
          descricao_acao: 'Desenvolver visão estratégica através de exposição a decisões de alto nível',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'Gerente',
          status: 'pendente',
        },
      ],
      'gerente': [
        {
          matricula: '56789',
          cpf: '567.890.123-44',
          email: 'gerente@empresa.com',
          nome_colaborador: 'Pedro Gerente',
          ciclo: '2025',
          cargo_alvo: 'Gerente Executivo',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Liderança Estratégica',
          acao_desenvolvimento: 'Programa de Desenvolvimento de Executivos',
          categoria: '10_curso',
          tipo_acao: 'programa_executivo',
          descricao_acao: 'Programa de Desenvolvimento de Executivos - 120h',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '30/06/2025',
          responsavel: 'RH',
          status: 'pendente',
        },
        {
          matricula: '56789',
          cpf: '567.890.123-44',
          email: 'gerente@empresa.com',
          nome_colaborador: 'Pedro Gerente',
          ciclo: '2025',
          cargo_alvo: 'Gerente Executivo',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Gestão de Mudanças',
          acao_desenvolvimento: 'Liderar projeto de transformação organizacional',
          categoria: '70_pratica',
          tipo_acao: 'projeto_estrategico',
          descricao_acao: 'Liderar iniciativa estratégica de transformação',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'Diretor',
          status: 'pendente',
        },
      ],
      'gerente_executivo': [
        {
          matricula: '67890',
          cpf: '678.901.234-55',
          email: 'gerente.executivo@empresa.com',
          nome_colaborador: 'Lucia Gerente Executiva',
          ciclo: '2025',
          cargo_alvo: 'Diretor',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Visão Estratégica de Longo Prazo',
          acao_desenvolvimento: 'Programa de Liderança Executiva',
          categoria: '10_curso',
          tipo_acao: 'programa_executivo',
          descricao_acao: 'Programa de Liderança Executiva - Harvard/Stanford',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '30/06/2025',
          responsavel: 'CEO',
          status: 'pendente',
        },
        {
          matricula: '67890',
          cpf: '678.901.234-55',
          email: 'gerente.executivo@empresa.com',
          nome_colaborador: 'Lucia Gerente Executiva',
          ciclo: '2025',
          cargo_alvo: 'Diretor',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Networking Estratégico',
          acao_desenvolvimento: 'Participar de conselhos e fóruns executivos',
          categoria: '20_mentoria',
          tipo_acao: 'networking',
          descricao_acao: 'Desenvolver rede de relacionamentos estratégicos',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'CEO',
          status: 'pendente',
        },
      ],
      'diretor': [
        {
          matricula: '78901',
          cpf: '789.012.345-66',
          email: 'diretor@empresa.com',
          nome_colaborador: 'Roberto Diretor',
          ciclo: '2025',
          cargo_alvo: 'CEO',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Governança Corporativa',
          acao_desenvolvimento: 'Programa de Governança Corporativa',
          categoria: '10_curso',
          tipo_acao: 'programa_executivo',
          descricao_acao: 'Programa de Governança Corporativa - IBGC',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '30/06/2025',
          responsavel: 'CEO',
          status: 'pendente',
        },
        {
          matricula: '78901',
          cpf: '789.012.345-66',
          email: 'diretor@empresa.com',
          nome_colaborador: 'Roberto Diretor',
          ciclo: '2025',
          cargo_alvo: 'CEO',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Visão de Mercado',
          acao_desenvolvimento: 'Participar de conselhos de administração',
          categoria: '70_pratica',
          tipo_acao: 'conselho',
          descricao_acao: 'Atuar em conselhos para desenvolver visão estratégica ampla',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'CEO',
          status: 'pendente',
        },
      ],
      'ceo': [
        {
          matricula: '89012',
          cpf: '890.123.456-77',
          email: 'ceo@empresa.com',
          nome_colaborador: 'Patricia CEO',
          ciclo: '2025',
          cargo_alvo: 'CEO com Expansão Internacional',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Liderança Global',
          acao_desenvolvimento: 'Programa de Liderança Global',
          categoria: '10_curso',
          tipo_acao: 'programa_executivo',
          descricao_acao: 'Global Executive Leadership Program - IMD/INSEAD',
          data_inicio_acao: '01/02/2025',
          data_fim_acao: '30/06/2025',
          responsavel: 'Conselho',
          status: 'pendente',
        },
        {
          matricula: '89012',
          cpf: '890.123.456-77',
          email: 'ceo@empresa.com',
          nome_colaborador: 'Patricia CEO',
          ciclo: '2025',
          cargo_alvo: 'CEO com Expansão Internacional',
          data_inicio: '01/01/2025',
          data_fim: '31/12/2025',
          competencia: 'Transformação Digital',
          acao_desenvolvimento: 'Liderar transformação digital da empresa',
          categoria: '70_pratica',
          tipo_acao: 'transformacao',
          descricao_acao: 'Liderar iniciativa de transformação digital em escala global',
          data_inicio_acao: '01/03/2025',
          data_fim_acao: '31/12/2025',
          responsavel: 'Conselho',
          status: 'pendente',
        },
      ],
    };
    
    // Se um nível específico foi solicitado, usar esse template
    let template: PDIImportRow[];
    if (level && templates[level]) {
      template = templates[level];
    } else {
      // Template genérico padrão
      template = [
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
    }
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDI');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
