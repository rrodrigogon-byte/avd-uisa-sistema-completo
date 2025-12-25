/**
 * Router para Importação de Funcionários
 * Importa funcionários da planilha Excel e cria automaticamente usuários para cargos de liderança
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, users } from "../../drizzle/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "../emailService";
import { TRPCError } from "@trpc/server";

// Cargos que devem ter usuários criados automaticamente
const LEADERSHIP_ROLES = [
  'Lider',
  'Supervisor',
  'Coordenador',
  'Gerente',
  'Gerente Exec',
  'Diretor',
  'Diretor Agroindustrial',
  'CEO',
  'Presidente',
  'Especialista'
];

/**
 * Gera uma senha aleatória segura
 */
function generatePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Gera hash de senha usando SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Determina o role baseado no cargo
 */
function determineRole(cargo: string | null): "admin" | "rh" | "gestor" | "colaborador" {
  if (!cargo) return "colaborador";
  
  const cargoLower = cargo.toLowerCase();
  
  // Diretores e Presidente são admin
  if (cargoLower.includes("diretor") || cargoLower.includes("presidente") || cargoLower.includes("ceo")) {
    return "admin";
  }
  
  // Gerentes e Coordenadores são gestores
  if (cargoLower.includes("gerente") || cargoLower.includes("coordenador")) {
    return "gestor";
  }
  
  // Supervisores e Líderes são gestores
  if (cargoLower.includes("supervisor") || cargoLower.includes("lider")) {
    return "gestor";
  }
  
  // Especialistas são colaboradores com privilégios
  if (cargoLower.includes("especialista")) {
    return "colaborador";
  }
  
  return "colaborador";
}

export const employeeImportRouter = router({
  /**
   * Importar funcionários diretamente de arquivo Excel (base64)
   */
  importFromExcel: protectedProcedure
    .input(
      z.object({
        fileData: z.string(), // Base64 encoded Excel file
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Apenas admins podem executar esta operação
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem executar esta operação",
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        // Importar XLSX dinamicamente
        const XLSX = await import("xlsx");
        
        // Decodificar base64
        const fileBuffer = Buffer.from(input.fileData, "base64");
        
        // Ler Excel
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        let imported = 0;
        let updated = 0;
        let errors = 0;
        const errorDetails: Array<{ row: number; message: string }> = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

          try {
            // Mapear campos do Excel
            const employeeCode = row["Chapa"]?.toString() || "";
            const name = row["Nome"]?.toString() || "";
            
            if (!employeeCode || !name) {
              errorDetails.push({
                row: rowNumber,
                message: "Chapa ou Nome não preenchidos",
              });
              errors++;
              continue;
            }

            const employeeData = {
              employeeCode,
              name,
              email: row["Email"]?.toString() || row["EMAILCORPORATIVO"]?.toString() || null,
              personalEmail: row["EMAILPESSOAL"]?.toString() || null,
              corporateEmail: row["Email"]?.toString() || row["EMAILCORPORATIVO"]?.toString() || null,
              chapa: employeeCode,
              codSecao: row["Código Seção"]?.toString() || row["CODSEÇÃO"]?.toString() || null,
              secao: row["Seção"]?.toString() || row["SEÇÃO"]?.toString() || null,
              codFuncao: row["Código Função"]?.toString() || row["CODFUNÇÃO"]?.toString() || null,
              funcao: row["Função"]?.toString() || row["FUNÇÃO"]?.toString() || null,
              situacao: row["SITUAÇÃO"]?.toString() || "Ativo",
              gerencia: row["GERENCIA"]?.toString() || null,
              diretoria: row["DIRETORIA"]?.toString() || null,
              cargo: row["CARGO"]?.toString() || row["Função"]?.toString() || null,
              telefone: row["TELEFONE"]?.toString() || null,
              
              // Hierarquia organizacional
              empresa: row["Empresa"]?.toString() || null,
              chapaPresidente: row["Chapa Presidente"]?.toString() || null,
              presidente: row["Presidente"]?.toString() || null,
              funcaoPresidente: row["Função Presidente"]?.toString() || null,
              emailPresidente: row["Email Presidente"]?.toString() || null,
              chapaDiretor: row["Chapa Diretor"]?.toString() || null,
              diretor: row["Diretor"]?.toString() || null,
              funcaoDiretor: row["Função Diretor"]?.toString() || null,
              emailDiretor: row["Email Diretor"]?.toString() || null,
              chapaGestor: row["Chapa Gestor"]?.toString() || null,
              gestor: row["Gestor"]?.toString() || null,
              funcaoGestor: row["Função Gestor"]?.toString() || null,
              emailGestor: row["Email Gestor"]?.toString() || null,
              chapaCoordenador: row["Chapa Coordenador"]?.toString() || null,
              coordenador: row["Coordenador"]?.toString() || null,
              funcaoCoordenador: row["Função Coordenador"]?.toString() || null,
              emailCoordenador: row["Email Coordenador"]?.toString() || null,
              
              active: row["SITUAÇÃO"]?.toString().toLowerCase() === "ativo",
              status: (row["SITUAÇÃO"]?.toString().toLowerCase() === "ativo" ? "ativo" : "desligado") as "ativo" | "afastado" | "desligado",
            };

            // Verificar se funcionário já existe
            const existing = await database
              .select()
              .from(employees)
              .where(eq(employees.employeeCode, employeeCode))
              .limit(1);

            if (existing.length > 0) {
              // Atualizar funcionário existente
              await database
                .update(employees)
                .set({
                  ...employeeData,
                  updatedAt: new Date(),
                })
                .where(eq(employees.employeeCode, employeeCode));
              
              updated++;
            } else {
              // Inserir novo funcionário
              await database.insert(employees).values(employeeData);
              imported++;
            }
          } catch (error: any) {
            console.error(`Erro ao processar linha ${rowNumber}:`, error);
            errorDetails.push({
              row: rowNumber,
              message: error.message || "Erro desconhecido",
            });
            errors++;
          }
        }

        return {
          success: true,
          imported,
          updated,
          errors,
          total: data.length,
          errorDetails: errorDetails.slice(0, 20), // Limitar a 20 erros
        };
      } catch (error: any) {
        console.error("Erro ao importar do Excel:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao importar do Excel: " + error.message,
        });
      }
    }),
  /**
   * Limpar usuários não-admin
   * Remove todos os usuários exceto aqueles com role "admin"
   */
  clearNonAdminUsers: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Apenas admins podem executar esta operação
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem executar esta operação",
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        // Deletar usuários que não são admin
        const result = await database
          .delete(users)
          .where(ne(users.role, "admin"));

        return {
          success: true,
          message: "Usuários não-admin removidos com sucesso",
        };
      } catch (error) {
        console.error("Erro ao limpar usuários:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao limpar usuários",
        });
      }
    }),

  /**
   * Importar funcionários da planilha
   */
  importEmployees: protectedProcedure
    .input(
      z.object({
        employees: z.array(
          z.object({
            chapa: z.string(),
            name: z.string(),
            email: z.string().nullable(),
            personalEmail: z.string().nullable(),
            corporateEmail: z.string().nullable(),
            employeeCode: z.string(),
            codSecao: z.string().nullable(),
            secao: z.string().nullable(),
            codFuncao: z.string().nullable(),
            funcao: z.string().nullable(),
            situacao: z.string().nullable(),
            gerencia: z.string().nullable(),
            diretoria: z.string().nullable(),
            cargo: z.string().nullable(),
            telefone: z.string().nullable(),
            active: z.boolean(),
            status: z.enum(["ativo", "afastado", "desligado"]),
          })
        ),
        clearExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Apenas admins podem executar esta operação
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem executar esta operação",
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        let imported = 0;
        let updated = 0;
        let errors = 0;

        for (const emp of input.employees) {
          try {
            // Verificar se funcionário já existe
            const existing = await database
              .select()
              .from(employees)
              .where(eq(employees.employeeCode, emp.employeeCode))
              .limit(1);

            if (existing.length > 0) {
              // Atualizar funcionário existente
              await database
                .update(employees)
                .set({
                  name: emp.name,
                  email: emp.email,
                  personalEmail: emp.personalEmail,
                  corporateEmail: emp.corporateEmail,
                  chapa: emp.chapa,
                  codSecao: emp.codSecao,
                  secao: emp.secao,
                  codFuncao: emp.codFuncao,
                  funcao: emp.funcao,
                  situacao: emp.situacao,
                  gerencia: emp.gerencia,
                  diretoria: emp.diretoria,
                  cargo: emp.cargo,
                  telefone: emp.telefone,
                  active: emp.active,
                  status: emp.status,
                  updatedAt: new Date(),
                })
                .where(eq(employees.employeeCode, emp.employeeCode));
              
              updated++;
            } else {
              // Inserir novo funcionário
              await database.insert(employees).values({
                employeeCode: emp.employeeCode,
                name: emp.name,
                email: emp.email,
                personalEmail: emp.personalEmail,
                corporateEmail: emp.corporateEmail,
                chapa: emp.chapa,
                codSecao: emp.codSecao,
                secao: emp.secao,
                codFuncao: emp.codFuncao,
                funcao: emp.funcao,
                situacao: emp.situacao,
                gerencia: emp.gerencia,
                diretoria: emp.diretoria,
                cargo: emp.cargo,
                telefone: emp.telefone,
                active: emp.active,
                status: emp.status,
              });
              
              imported++;
            }
          } catch (error) {
            console.error(`Erro ao importar funcionário ${emp.employeeCode}:`, error);
            errors++;
          }
        }

        return {
          success: true,
          imported,
          updated,
          errors,
          total: input.employees.length,
        };
      } catch (error) {
        console.error("Erro ao importar funcionários:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao importar funcionários",
        });
      }
    }),

  /**
   * Criar usuários automaticamente para cargos de liderança
   */
  createLeadershipUsers: protectedProcedure
    .input(
      z.object({
        sendEmails: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Apenas admins podem executar esta operação
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem executar esta operação",
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        // Buscar funcionários com cargos de liderança que ainda não têm usuário
        const leadershipEmployees = await database
          .select()
          .from(employees)
          .where(
            and(
              eq(employees.active, true),
              eq(employees.status, "ativo")
            )
          );

        const usersCreated: Array<{
          employeeCode: string;
          name: string;
          email: string;
          username: string;
          password: string;
          role: string;
        }> = [];

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const emp of leadershipEmployees) {
          // Verificar se é cargo de liderança
          if (!emp.cargo || !LEADERSHIP_ROLES.includes(emp.cargo)) {
            continue;
          }

          // Verificar se já tem usuário vinculado
          if (emp.userId) {
            skipped++;
            continue;
          }

          // Verificar se tem email
          if (!emp.email) {
            console.warn(`Funcionário ${emp.employeeCode} (${emp.name}) não tem email`);
            errors++;
            continue;
          }

          try {
            // Gerar username e senha
            const nameParts = emp.name.split(" ");
            const firstName = nameParts[0]?.toLowerCase() || "user";
            const lastName = nameParts[1]?.toLowerCase() || emp.employeeCode;
            const username = `${firstName}.${lastName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const password = generatePassword();
            const passwordHash = hashPassword(password);

            // Determinar role baseado no cargo
            const role = determineRole(emp.cargo);

            // Criar usuário com openId único (usando employeeCode)
            const openId = `employee_${emp.employeeCode}`;

            // Inserir usuário
            const [newUser] = await database.insert(users).values({
              openId,
              name: emp.name,
              email: emp.email,
              role,
              loginMethod: "password",
            });

            // Atualizar funcionário com userId
            await database
              .update(employees)
              .set({
                userId: newUser.insertId,
                passwordHash,
              })
              .where(eq(employees.id, emp.id));

            usersCreated.push({
              employeeCode: emp.employeeCode,
              name: emp.name,
              email: emp.email,
              username,
              password,
              role,
            });

            created++;

            // Enviar email com credenciais
            if (input.sendEmails) {
              try {
                await sendEmail({
                  to: emp.email,
                  subject: "Suas credenciais de acesso - Sistema AVD UISA",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #2563eb;">Bem-vindo ao Sistema AVD UISA</h2>
                      <p>Olá <strong>${emp.name}</strong>,</p>
                      <p>Suas credenciais de acesso ao sistema foram criadas com sucesso:</p>
                      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Usuário:</strong> ${username}</p>
                        <p style="margin: 5px 0;"><strong>Senha:</strong> ${password}</p>
                      </div>
                      <p>Por favor, guarde estas informações em local seguro e altere sua senha no primeiro acesso.</p>
                      <p>Acesse o sistema em: <a href="https://avd-uisa.manus.space">https://avd-uisa.manus.space</a></p>
                      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Atenciosamente,<br/>Equipe AVD UISA</p>
                    </div>
                  `,
                });
              } catch (emailError) {
                console.error(`Erro ao enviar email para ${emp.email}:`, emailError);
              }
            }
          } catch (error) {
            console.error(`Erro ao criar usuário para ${emp.employeeCode}:`, error);
            errors++;
          }
        }

        return {
          success: true,
          created,
          skipped,
          errors,
          total: leadershipEmployees.length,
          users: usersCreated,
        };
      } catch (error) {
        console.error("Erro ao criar usuários de liderança:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar usuários de liderança",
        });
      }
    }),

  /**
   * Obter estatísticas de importação
   */
  getImportStats: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados não disponível",
      });
    }

    try {
      // Total de funcionários
      const totalEmployees = await database
        .select({ count: sql<number>`count(*)` })
        .from(employees);

      // Funcionários ativos
      const activeEmployees = await database
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(and(eq(employees.active, true), eq(employees.status, "ativo")));

      // Funcionários com usuário
      const employeesWithUser = await database
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(ne(employees.userId, null));

      // Funcionários de liderança sem usuário
      const leadershipWithoutUser = await database
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.active, true),
            eq(employees.status, "ativo"),
            eq(employees.userId, null)
          )
        );

      const leadershipCount = leadershipWithoutUser.filter(
        (emp) => emp.cargo && LEADERSHIP_ROLES.includes(emp.cargo)
      ).length;

      return {
        totalEmployees: totalEmployees[0]?.count || 0,
        activeEmployees: activeEmployees[0]?.count || 0,
        employeesWithUser: employeesWithUser[0]?.count || 0,
        leadershipWithoutUser: leadershipCount,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao obter estatísticas",
      });
    }
  }),
});
