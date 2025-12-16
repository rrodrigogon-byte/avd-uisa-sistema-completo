import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { employees } from "../../drizzle/schema";
import { eq, and, or, like, sql } from "drizzle-orm";

/**
 * Router de Organograma com Hierarquia Completa
 * Baseado nos dados importados do Excel com estrutura:
 * Presidente → Diretor → Gestor → Coordenador → Funcionário
 */
export const organogramaHierarchyRouter = router({
  /**
   * Buscar estrutura hierárquica completa do organograma
   */
  getFullHierarchy: protectedProcedure
    .input(z.object({
      empresa: z.string().optional(),
      secao: z.string().optional(),
      funcao: z.string().optional(),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [eq(employees.active, true)];

      if (input.empresa) {
        conditions.push(eq(employees.empresa, input.empresa));
      }

      if (input.secao) {
        conditions.push(like(employees.secao, `%${input.secao}%`));
      }

      if (input.funcao) {
        conditions.push(like(employees.funcao, `%${input.funcao}%`));
      }

      if (input.searchTerm) {
        conditions.push(
          or(
            like(employees.name, `%${input.searchTerm}%`),
            like(employees.chapa, `%${input.searchTerm}%`),
            like(employees.email, `%${input.searchTerm}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar todos os funcionários com hierarquia
      const allEmployees = await db
        .select({
          id: employees.id,
          chapa: employees.chapa,
          name: employees.name,
          email: employees.email,
          empresa: employees.empresa,
          secao: employees.secao,
          codSecao: employees.codSecao,
          funcao: employees.funcao,
          codFuncao: employees.codFuncao,
          photoUrl: employees.photoUrl,
          
          // Hierarquia completa
          chapaPresidente: employees.chapaPresidente,
          presidente: employees.presidente,
          funcaoPresidente: employees.funcaoPresidente,
          emailPresidente: employees.emailPresidente,
          
          chapaDiretor: employees.chapaDiretor,
          diretor: employees.diretor,
          funcaoDiretor: employees.funcaoDiretor,
          emailDiretor: employees.emailDiretor,
          
          chapaGestor: employees.chapaGestor,
          gestor: employees.gestor,
          funcaoGestor: employees.funcaoGestor,
          emailGestor: employees.emailGestor,
          
          chapaCoordenador: employees.chapaCoordenador,
          coordenador: employees.coordenador,
          funcaoCoordenador: employees.funcaoCoordenador,
          emailCoordenador: employees.emailCoordenador,
        })
        .from(employees)
        .where(whereClause)
        .orderBy(employees.name);

      return {
        employees: allEmployees,
        total: allEmployees.length,
      };
    }),

  /**
   * Buscar estrutura hierárquica em árvore
   * Organiza os funcionários em uma estrutura de árvore baseada na hierarquia
   */
  getHierarchyTree: protectedProcedure
    .input(z.object({
      empresa: z.string().optional(),
      rootChapa: z.string().optional(), // Chapa do nó raiz (Presidente, Diretor, etc)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [eq(employees.active, true)];

      if (input.empresa) {
        conditions.push(eq(employees.empresa, input.empresa));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Buscar todos os funcionários
      const allEmployees = await db
        .select({
          id: employees.id,
          chapa: employees.chapa,
          name: employees.name,
          email: employees.email,
          funcao: employees.funcao,
          secao: employees.secao,
          photoUrl: employees.photoUrl,
          chapaPresidente: employees.chapaPresidente,
          chapaDiretor: employees.chapaDiretor,
          chapaGestor: employees.chapaGestor,
          chapaCoordenador: employees.chapaCoordenador,
        })
        .from(employees)
        .where(whereClause);

      // Construir árvore hierárquica
      const buildTree = (parentChapa: string | null): any[] => {
        return allEmployees
          .filter(emp => {
            if (!parentChapa) {
              // Raiz: funcionários que são presidentes (não têm superior)
              return !emp.chapaPresidente || emp.chapa === emp.chapaPresidente;
            }
            // Subordinados diretos
            return emp.chapaCoordenador === parentChapa ||
                   emp.chapaGestor === parentChapa ||
                   emp.chapaDiretor === parentChapa ||
                   emp.chapaPresidente === parentChapa;
          })
          .map(emp => ({
            ...emp,
            level: getHierarchyLevel(emp),
            children: buildTree(emp.chapa),
          }));
      };

      const getHierarchyLevel = (emp: any): string => {
        if (!emp.chapaPresidente) return "Presidente";
        if (!emp.chapaDiretor) return "Diretor";
        if (!emp.chapaGestor) return "Gestor";
        if (!emp.chapaCoordenador) return "Coordenador";
        return "Funcionário";
      };

      const tree = input.rootChapa ? buildTree(input.rootChapa) : buildTree(null);

      return {
        tree,
        totalNodes: allEmployees.length,
      };
    }),

  /**
   * Buscar detalhes de um funcionário com toda sua hierarquia
   */
  getEmployeeHierarchy: protectedProcedure
    .input(z.object({
      chapa: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.chapa, input.chapa));

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Buscar superiores na hierarquia
      const superiors: any = {};

      if (employee.chapaPresidente) {
        const [presidente] = await db
          .select()
          .from(employees)
          .where(eq(employees.chapa, employee.chapaPresidente));
        if (presidente) superiors.presidente = presidente;
      }

      if (employee.chapaDiretor) {
        const [diretor] = await db
          .select()
          .from(employees)
          .where(eq(employees.chapa, employee.chapaDiretor));
        if (diretor) superiors.diretor = diretor;
      }

      if (employee.chapaGestor) {
        const [gestor] = await db
          .select()
          .from(employees)
          .where(eq(employees.chapa, employee.chapaGestor));
        if (gestor) superiors.gestor = gestor;
      }

      if (employee.chapaCoordenador) {
        const [coordenador] = await db
          .select()
          .from(employees)
          .where(eq(employees.chapa, employee.chapaCoordenador));
        if (coordenador) superiors.coordenador = coordenador;
      }

      // Buscar subordinados diretos
      const subordinates = await db
        .select()
        .from(employees)
        .where(
          or(
            eq(employees.chapaCoordenador, input.chapa),
            eq(employees.chapaGestor, input.chapa),
            eq(employees.chapaDiretor, input.chapa),
            eq(employees.chapaPresidente, input.chapa)
          )
        );

      return {
        employee,
        superiors,
        subordinates,
        hierarchyLevel: getEmployeeLevel(employee),
      };
    }),

  /**
   * Buscar opções de filtro (empresas, seções, funções)
   */
  getFilterOptions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar empresas únicas
    const empresas = await db
      .selectDistinct({ empresa: employees.empresa })
      .from(employees)
      .where(and(eq(employees.active, true), sql`${employees.empresa} IS NOT NULL`))
      .orderBy(employees.empresa);

    // Buscar seções únicas
    const secoes = await db
      .selectDistinct({ secao: employees.secao })
      .from(employees)
      .where(and(eq(employees.active, true), sql`${employees.secao} IS NOT NULL`))
      .orderBy(employees.secao)
      .limit(100);

    // Buscar funções únicas
    const funcoes = await db
      .selectDistinct({ funcao: employees.funcao })
      .from(employees)
      .where(and(eq(employees.active, true), sql`${employees.funcao} IS NOT NULL`))
      .orderBy(employees.funcao)
      .limit(100);

    return {
      empresas: empresas.map(e => e.empresa).filter(Boolean),
      secoes: secoes.map(s => s.secao).filter(Boolean),
      funcoes: funcoes.map(f => f.funcao).filter(Boolean),
    };
  }),

  /**
   * Buscar estatísticas do organograma
   */
  getHierarchyStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        comPresidente: sql<number>`COUNT(CASE WHEN ${employees.chapaPresidente} IS NOT NULL THEN 1 END)`,
        comDiretor: sql<number>`COUNT(CASE WHEN ${employees.chapaDiretor} IS NOT NULL THEN 1 END)`,
        comGestor: sql<number>`COUNT(CASE WHEN ${employees.chapaGestor} IS NOT NULL THEN 1 END)`,
        comCoordenador: sql<number>`COUNT(CASE WHEN ${employees.chapaCoordenador} IS NOT NULL THEN 1 END)`,
      })
      .from(employees)
      .where(eq(employees.active, true));

    return stats;
  }),
});

/**
 * Função auxiliar para determinar o nível hierárquico
 */
function getEmployeeLevel(emp: any): string {
  if (!emp.chapaPresidente) return "Presidente";
  if (!emp.chapaDiretor) return "Diretor";
  if (!emp.chapaGestor) return "Gestor";
  if (!emp.chapaCoordenador) return "Coordenador";
  return "Funcionário";
}
