import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, performanceEvaluations, goals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router para importação de dados via HTML
 * Suporta importação de funcionários, avaliações e metas
 */

// Schema de validação para dados de funcionário
const employeeImportSchema = z.object({
  chapa: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  positionId: z.number().optional(),
  departmentId: z.number().optional(),
  admissionDate: z.string().optional(),
  salary: z.number().optional(),
  status: z.enum(["ativo", "inativo", "ferias", "afastado"]).optional(),
});

// Schema de validação para dados de avaliação
const evaluationImportSchema = z.object({
  employeeChapa: z.string().min(1),
  cycleId: z.number(),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  evaluatorChapa: z.string().optional(),
});

// Schema de validação para dados de meta
const goalImportSchema = z.object({
  employeeChapa: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  deadline: z.string().optional(),
  status: z.enum(["nao_iniciada", "em_andamento", "concluida", "cancelada"]).optional(),
});

/**
 * Parser HTML para extrair dados de tabelas
 */
function parseHTMLTable(html: string): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  
  // Remove tags HTML desnecessárias e extrai conteúdo
  const cleanHTML = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                       .replace(/<style[^>]*>.*?<\/style>/gi, '');
  
  // Regex para extrair linhas de tabela
  const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
  const tableMatch = tableRegex.exec(cleanHTML);
  
  if (!tableMatch) {
    throw new Error("Nenhuma tabela encontrada no HTML");
  }
  
  const tableContent = tableMatch[1];
  
  // Extrair cabeçalhos
  const headerRegex = /<th[^>]*>(.*?)<\/th>/gi;
  const headers: string[] = [];
  let headerMatch;
  
  while ((headerMatch = headerRegex.exec(tableContent)) !== null) {
    const headerText = headerMatch[1].replace(/<[^>]*>/g, '').trim();
    headers.push(headerText);
  }
  
  if (headers.length === 0) {
    throw new Error("Nenhum cabeçalho encontrado na tabela");
  }
  
  // Extrair linhas de dados
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
    const rowContent = rowMatch[1];
    
    // Pular linhas de cabeçalho
    if (rowContent.includes('<th')) continue;
    
    // Extrair células
    const cellRegex = /<td[^>]*>(.*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
      cells.push(cellText);
    }
    
    if (cells.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cells[index];
      });
      rows.push(row);
    }
  }
  
  return rows;
}

/**
 * Mapear dados extraídos para schema de funcionário
 */
function mapToEmployeeData(data: Record<string, string>): z.infer<typeof employeeImportSchema> {
  return {
    chapa: data['Chapa'] || data['chapa'] || data['ID'] || data['id'] || '',
    name: data['Nome'] || data['name'] || data['Name'] || '',
    email: data['Email'] || data['email'] || data['E-mail'] || undefined,
    positionId: data['Cargo ID'] || data['positionId'] ? parseInt(data['Cargo ID'] || data['positionId']) : undefined,
    departmentId: data['Departamento ID'] || data['departmentId'] ? parseInt(data['Departamento ID'] || data['departmentId']) : undefined,
    admissionDate: data['Data Admissão'] || data['admissionDate'] || data['Admission Date'] || undefined,
    salary: data['Salário'] || data['salary'] ? parseFloat((data['Salário'] || data['salary']).replace(/[^\d.,]/g, '').replace(',', '.')) : undefined,
    status: (data['Status'] || data['status'] || 'ativo') as any,
  };
}

/**
 * Mapear dados extraídos para schema de avaliação
 */
function mapToEvaluationData(data: Record<string, string>): z.infer<typeof evaluationImportSchema> {
  return {
    employeeChapa: data['Chapa'] || data['chapa'] || data['Employee ID'] || '',
    cycleId: parseInt(data['Ciclo ID'] || data['cycleId'] || '1'),
    rating: parseFloat(data['Nota'] || data['rating'] || data['Rating'] || '0'),
    comments: data['Comentários'] || data['comments'] || data['Comments'] || undefined,
    evaluatorChapa: data['Avaliador'] || data['evaluatorChapa'] || data['Evaluator'] || undefined,
  };
}

/**
 * Mapear dados extraídos para schema de meta
 */
function mapToGoalData(data: Record<string, string>): z.infer<typeof goalImportSchema> {
  return {
    employeeChapa: data['Chapa'] || data['chapa'] || data['Employee ID'] || '',
    title: data['Título'] || data['title'] || data['Title'] || '',
    description: data['Descrição'] || data['description'] || data['Description'] || undefined,
    targetValue: data['Meta'] || data['targetValue'] ? parseFloat(data['Meta'] || data['targetValue']) : undefined,
    currentValue: data['Valor Atual'] || data['currentValue'] ? parseFloat(data['Valor Atual'] || data['currentValue']) : undefined,
    deadline: data['Prazo'] || data['deadline'] || data['Deadline'] || undefined,
    status: (data['Status'] || data['status'] || 'nao_iniciada') as any,
  };
}

export const htmlImportRouter = router({
  /**
   * Preview de dados extraídos do HTML
   */
  previewHTML: protectedProcedure
    .input(z.object({
      html: z.string(),
      type: z.enum(['employees', 'evaluations', 'goals']),
    }))
    .mutation(async ({ input }) => {
      try {
        const rawData = parseHTMLTable(input.html);
        
        let mappedData: any[] = [];
        let validData: any[] = [];
        let errors: Array<{ row: number; error: string }> = [];
        
        rawData.forEach((row, index) => {
          try {
            let mapped: any;
            
            if (input.type === 'employees') {
              mapped = mapToEmployeeData(row);
              const validated = employeeImportSchema.parse(mapped);
              validData.push(validated);
            } else if (input.type === 'evaluations') {
              mapped = mapToEvaluationData(row);
              const validated = evaluationImportSchema.parse(mapped);
              validData.push(validated);
            } else if (input.type === 'goals') {
              mapped = mapToGoalData(row);
              const validated = goalImportSchema.parse(mapped);
              validData.push(validated);
            }
            
            mappedData.push(mapped);
          } catch (error: any) {
            errors.push({
              row: index + 1,
              error: error.message || 'Erro ao validar dados',
            });
          }
        });
        
        return {
          success: true,
          totalRows: rawData.length,
          validRows: validData.length,
          invalidRows: errors.length,
          data: mappedData,
          validData,
          errors,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Erro ao processar HTML',
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          data: [],
          validData: [],
          errors: [],
        };
      }
    }),

  /**
   * Importar funcionários do HTML
   */
  importEmployees: protectedProcedure
    .input(z.object({
      data: z.array(employeeImportSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ chapa: string; error: string }>,
      };
      
      for (const employee of input.data) {
        try {
          // Verificar se funcionário já existe
          const existing = await db
            .select()
            .from(employees)
            .where(eq(employees.chapa, employee.chapa))
            .limit(1);
          
          if (existing.length > 0) {
            // Atualizar funcionário existente
            await db
              .update(employees)
              .set({
                name: employee.name,
                email: employee.email || null,
                positionId: employee.positionId || null,
                departmentId: employee.departmentId || null,
                admissionDate: employee.admissionDate ? new Date(employee.admissionDate) : null,
                salary: employee.salary || null,
                status: employee.status || 'ativo',
                updatedAt: new Date(),
              })
              .where(eq(employees.chapa, employee.chapa));
          } else {
            // Criar novo funcionário
            await db.insert(employees).values({
              chapa: employee.chapa,
              name: employee.name,
              email: employee.email || null,
              positionId: employee.positionId || null,
              departmentId: employee.departmentId || null,
              admissionDate: employee.admissionDate ? new Date(employee.admissionDate) : null,
              salary: employee.salary || null,
              status: employee.status || 'ativo',
            });
          }
          
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            chapa: employee.chapa,
            error: error.message || 'Erro desconhecido',
          });
        }
      }
      
      return results;
    }),

  /**
   * Importar avaliações do HTML
   */
  importEvaluations: protectedProcedure
    .input(z.object({
      data: z.array(evaluationImportSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ employeeChapa: string; error: string }>,
      };
      
      for (const evaluation of input.data) {
        try {
          // Buscar ID do funcionário pela chapa
          const employee = await db
            .select()
            .from(employees)
            .where(eq(employees.chapa, evaluation.employeeChapa))
            .limit(1);
          
          if (employee.length === 0) {
            throw new Error(`Funcionário com chapa ${evaluation.employeeChapa} não encontrado`);
          }
          
          // Buscar ID do avaliador se fornecido
          let evaluatorId = null;
          if (evaluation.evaluatorChapa) {
            const evaluator = await db
              .select()
              .from(employees)
              .where(eq(employees.chapa, evaluation.evaluatorChapa))
              .limit(1);
            
            if (evaluator.length > 0) {
              evaluatorId = evaluator[0].id;
            }
          }
          
          // Criar avaliação
          await db.insert(performanceEvaluations).values({
            employeeId: employee[0].id,
            cycleId: evaluation.cycleId,
            evaluatorId: evaluatorId,
            overallRating: evaluation.rating,
            comments: evaluation.comments || null,
            status: 'concluida',
            createdBy: ctx.user.id,
          });
          
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            employeeChapa: evaluation.employeeChapa,
            error: error.message || 'Erro desconhecido',
          });
        }
      }
      
      return results;
    }),

  /**
   * Importar metas do HTML
   */
  importGoals: protectedProcedure
    .input(z.object({
      data: z.array(goalImportSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ employeeChapa: string; error: string }>,
      };
      
      for (const goal of input.data) {
        try {
          // Buscar ID do funcionário pela chapa
          const employee = await db
            .select()
            .from(employees)
            .where(eq(employees.chapa, goal.employeeChapa))
            .limit(1);
          
          if (employee.length === 0) {
            throw new Error(`Funcionário com chapa ${goal.employeeChapa} não encontrado`);
          }
          
          // Criar meta
          await db.insert(goals).values({
            employeeId: employee[0].id,
            title: goal.title,
            description: goal.description || null,
            targetValue: goal.targetValue || null,
            currentValue: goal.currentValue || 0,
            deadline: goal.deadline ? new Date(goal.deadline) : null,
            status: goal.status || 'nao_iniciada',
            createdBy: ctx.user.id,
          });
          
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            employeeChapa: goal.employeeChapa,
            error: error.message || 'Erro desconhecido',
          });
        }
      }
      
      return results;
    }),
});
