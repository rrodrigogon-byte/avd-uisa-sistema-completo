import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { departments, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router para upload e processamento de arquivos Excel
 * Permite importar dados de colaboradores, departamentos e hierarquia
 */
export const excelUploadRouter = router({
  /**
   * Valida estrutura do arquivo Excel antes de importar
   * Verifica se as colunas obrigatórias estão presentes
   */
  validateExcel: adminProcedure
    .input(
      z.object({
        base64Data: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decodificar base64 para buffer
        const buffer = Buffer.from(input.base64Data, "base64");
        
        // Ler arquivo Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });
        
        // Verificar se tem pelo menos uma planilha
        if (workbook.SheetNames.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Arquivo Excel não contém planilhas",
          });
        }

        // Ler primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (data.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Planilha está vazia",
          });
        }

        // Verificar colunas obrigatórias
        const headers = data[0].map((h) => String(h).toLowerCase().trim());
        const requiredColumns = [
          "nome",
          "email",
          "cpf",
          "cargo",
          "departamento",
        ];

        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Colunas obrigatórias ausentes: ${missingColumns.join(", ")}`,
          });
        }

        // Extrair dados para preview
        const previewData = data.slice(1, 11).map((row) => {
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = String(row[index] || "");
          });
          return rowData;
        });

        return {
          success: true,
          totalRows: data.length - 1, // Excluir header
          headers,
          preview: previewData,
          message: "Arquivo validado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Importa dados do Excel para o banco de dados
   * Processa colaboradores, departamentos e hierarquia
   */
  importExcel: adminProcedure
    .input(
      z.object({
        base64Data: z.string(),
        fileName: z.string(),
        updateExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        // Decodificar base64 para buffer
        const buffer = Buffer.from(input.base64Data, "base64");
        
        // Ler arquivo Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        let processedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Primeiro, criar/atualizar departamentos únicos
        const departmentNames = new Set<string>();
        data.forEach((row) => {
          const deptName = String(row.departamento || row.Departamento || "").trim();
          if (deptName) {
            departmentNames.add(deptName);
          }
        });

        const departmentMap = new Map<string, number>();
        
        for (const deptName of departmentNames) {
          try {
            // Verificar se departamento já existe
            const existing = await db
              .select()
              .from(departments)
              .where(eq(departments.name, deptName))
              .limit(1);

            if (existing.length > 0) {
              departmentMap.set(deptName, existing[0].id);
            } else {
              // Criar novo departamento
              const [newDept] = await db
                .insert(departments)
                .values({
                  name: deptName,
                  description: `Departamento ${deptName}`,
                })
                .$returningId();
              
              departmentMap.set(deptName, newDept.id);
            }
          } catch (error) {
            console.error(`Erro ao processar departamento ${deptName}:`, error);
          }
        }

        // Processar colaboradores
        for (const row of data) {
          try {
            const nome = String(row.nome || row.Nome || "").trim();
            const email = String(row.email || row.Email || "").trim();
            const cpf = String(row.cpf || row.CPF || "").trim();
            const cargo = String(row.cargo || row.Cargo || "").trim();
            const deptName = String(row.departamento || row.Departamento || "").trim();
            const dataNascimento = row.data_nascimento || row.Data_Nascimento || row["Data de Nascimento"];
            const telefone = String(row.telefone || row.Telefone || "").trim();
            const dataAdmissao = row.data_admissao || row.Data_Admissao || row["Data de Admissão"];

            if (!nome || !email || !cpf) {
              errors.push(`Linha ignorada: dados obrigatórios ausentes (nome, email ou CPF)`);
              errorCount++;
              continue;
            }

            const departmentId = departmentMap.get(deptName);
            if (!departmentId) {
              errors.push(`Colaborador ${nome}: departamento não encontrado`);
              errorCount++;
              continue;
            }

            // Verificar se colaborador já existe
            const existing = await db
              .select()
              .from(employees)
              .where(eq(employees.cpf, cpf))
              .limit(1);

            if (existing.length > 0) {
              if (input.updateExisting) {
                // Atualizar colaborador existente
                await db
                  .update(employees)
                  .set({
                    name: nome,
                    email,
                    position: cargo,
                    departmentId,
                    phone: telefone || null,
                    birthDate: dataNascimento ? new Date(dataNascimento) : null,
                    hireDate: dataAdmissao ? new Date(dataAdmissao) : null,
                    updatedAt: new Date(),
                  })
                  .where(eq(employees.id, existing[0].id));
                
                processedCount++;
              } else {
                errors.push(`CPF ${cpf} já existe no sistema`);
                errorCount++;
              }
            } else {
              // Criar novo colaborador
              await db.insert(employees).values({
                name: nome,
                email,
                cpf,
                position: cargo,
                departmentId,
                phone: telefone || null,
                birthDate: dataNascimento ? new Date(dataNascimento) : null,
                hireDate: dataAdmissao ? new Date(dataAdmissao) : null,
                status: "active",
              });
              
              processedCount++;
            }
          } catch (error) {
            console.error("Erro ao processar linha:", error);
            errorCount++;
            errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
          }
        }

        return {
          success: true,
          processedCount,
          errorCount,
          errors: errors.slice(0, 10), // Limitar a 10 erros para não sobrecarregar
          message: `Importação concluída: ${processedCount} registros processados, ${errorCount} erros`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao importar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Gera template de Excel para download
   * Retorna base64 do arquivo template
   */
  downloadTemplate: adminProcedure.query(() => {
    try {
      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Dados de exemplo
      const templateData = [
        [
          "nome",
          "email",
          "cpf",
          "cargo",
          "departamento",
          "telefone",
          "data_nascimento",
          "data_admissao",
        ],
        [
          "João Silva",
          "joao.silva@empresa.com",
          "123.456.789-00",
          "Analista",
          "TI",
          "(11) 98765-4321",
          "1990-01-15",
          "2020-03-01",
        ],
        [
          "Maria Santos",
          "maria.santos@empresa.com",
          "987.654.321-00",
          "Gerente",
          "RH",
          "(11) 91234-5678",
          "1985-05-20",
          "2018-06-15",
        ],
      ];

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Definir largura das colunas
      worksheet["!cols"] = [
        { wch: 20 }, // nome
        { wch: 30 }, // email
        { wch: 15 }, // cpf
        { wch: 20 }, // cargo
        { wch: 20 }, // departamento
        { wch: 18 }, // telefone
        { wch: 15 }, // data_nascimento
        { wch: 15 }, // data_admissao
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Colaboradores");

      // Gerar buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Converter para base64
      const base64 = buffer.toString("base64");

      return {
        success: true,
        base64Data: base64,
        fileName: "template_importacao_colaboradores.xlsx",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao gerar template: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
    }
  }),
});
