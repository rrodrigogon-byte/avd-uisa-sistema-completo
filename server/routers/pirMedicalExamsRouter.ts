import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { pirMedicalExams, employees } from '../../drizzle/schema';
import { eq, desc, and, lte, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Router para gestão de Exames Médicos Ocupacionais PIR
 * Gerencia exames, resultados e validades
 */
export const pirMedicalExamsRouter = router({
  /**
   * Listar exames de um funcionário
   */
  listByEmployee: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        programId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = [eq(pirMedicalExams.employeeId, input.employeeId)];
      
      if (input.programId) {
        conditions.push(eq(pirMedicalExams.programId, input.programId));
      }

      const exams = await db
        .select()
        .from(pirMedicalExams)
        .where(and(...conditions))
        .orderBy(desc(pirMedicalExams.examDate));

      return exams;
    }),

  /**
   * Buscar exame por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const exam = await db
        .select({
          exam: pirMedicalExams,
          employee: employees,
        })
        .from(pirMedicalExams)
        .leftJoin(employees, eq(pirMedicalExams.employeeId, employees.id))
        .where(eq(pirMedicalExams.id, input.id))
        .limit(1);

      if (exam.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Exame não encontrado' });
      }

      return exam[0];
    }),

  /**
   * Criar novo exame médico
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        programId: z.number().optional(),
        examDate: z.date(),
        examType: z.enum(['admissional', 'periodico', 'retorno_trabalho', 'mudanca_funcao', 'demissional']),
        doctorName: z.string().optional(),
        doctorCRM: z.string().optional(),
        clinicName: z.string().optional(),
        result: z.enum(['apto', 'inapto', 'apto_com_restricoes']),
        restrictions: z.string().optional(),
        spirometry: z.string().optional(), // JSON string
        chestXray: z.string().optional(), // JSON string
        otherExams: z.string().optional(), // JSON string
        expiryDate: z.date().optional(),
        reportUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db.insert(pirMedicalExams).values({
        employeeId: input.employeeId,
        programId: input.programId,
        examDate: input.examDate,
        examType: input.examType,
        doctorName: input.doctorName,
        doctorCRM: input.doctorCRM,
        clinicName: input.clinicName,
        result: input.result,
        restrictions: input.restrictions,
        spirometry: input.spirometry,
        chestXray: input.chestXray,
        otherExams: input.otherExams,
        expiryDate: input.expiryDate,
        reportUrl: input.reportUrl,
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Exame médico criado com sucesso'
      };
    }),

  /**
   * Atualizar exame médico
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        examDate: z.date().optional(),
        examType: z.enum(['admissional', 'periodico', 'retorno_trabalho', 'mudanca_funcao', 'demissional']).optional(),
        doctorName: z.string().optional(),
        doctorCRM: z.string().optional(),
        clinicName: z.string().optional(),
        result: z.enum(['apto', 'inapto', 'apto_com_restricoes']).optional(),
        restrictions: z.string().optional(),
        spirometry: z.string().optional(),
        chestXray: z.string().optional(),
        otherExams: z.string().optional(),
        expiryDate: z.date().optional(),
        reportUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const { id, ...updateData } = input;

      // Verificar se exame existe
      const existing = await db.select().from(pirMedicalExams).where(eq(pirMedicalExams.id, id)).limit(1);
      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Exame não encontrado' });
      }

      await db.update(pirMedicalExams).set(updateData).where(eq(pirMedicalExams.id, id));

      return {
        success: true,
        message: 'Exame atualizado com sucesso'
      };
    }),

  /**
   * Listar exames que estão próximos do vencimento
   */
  listExpiringSoon: protectedProcedure
    .input(
      z.object({
        daysBeforeExpiry: z.number().default(30),
        programId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysBeforeExpiry);

      const conditions = [
        gte(pirMedicalExams.expiryDate, today),
        lte(pirMedicalExams.expiryDate, futureDate),
      ];

      if (input.programId) {
        conditions.push(eq(pirMedicalExams.programId, input.programId));
      }

      const expiringExams = await db
        .select({
          id: pirMedicalExams.id,
          employeeId: pirMedicalExams.employeeId,
          employeeName: employees.name,
          examDate: pirMedicalExams.examDate,
          examType: pirMedicalExams.examType,
          result: pirMedicalExams.result,
          expiryDate: pirMedicalExams.expiryDate,
        })
        .from(pirMedicalExams)
        .leftJoin(employees, eq(pirMedicalExams.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(pirMedicalExams.expiryDate);

      return expiringExams;
    }),

  /**
   * Listar exames vencidos
   */
  listExpired: protectedProcedure
    .input(
      z.object({
        programId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const today = new Date();

      const conditions = [
        lte(pirMedicalExams.expiryDate, today),
      ];

      if (input?.programId) {
        conditions.push(eq(pirMedicalExams.programId, input.programId));
      }

      const expiredExams = await db
        .select({
          id: pirMedicalExams.id,
          employeeId: pirMedicalExams.employeeId,
          employeeName: employees.name,
          examDate: pirMedicalExams.examDate,
          examType: pirMedicalExams.examType,
          result: pirMedicalExams.result,
          expiryDate: pirMedicalExams.expiryDate,
        })
        .from(pirMedicalExams)
        .leftJoin(employees, eq(pirMedicalExams.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(pirMedicalExams.expiryDate);

      return expiredExams;
    }),

  /**
   * Buscar último exame válido de um funcionário
   */
  getLatestValid: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const today = new Date();

      const exam = await db
        .select()
        .from(pirMedicalExams)
        .where(
          and(
            eq(pirMedicalExams.employeeId, input.employeeId),
            gte(pirMedicalExams.expiryDate, today)
          )
        )
        .orderBy(desc(pirMedicalExams.examDate))
        .limit(1);

      return exam.length > 0 ? exam[0] : null;
    }),

  /**
   * Estatísticas de exames
   */
  getStats: protectedProcedure
    .input(
      z.object({
        programId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = input?.programId ? [eq(pirMedicalExams.programId, input.programId)] : [];

      const allExams = await db
        .select()
        .from(pirMedicalExams)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const stats = {
        total: allExams.length,
        apto: allExams.filter(e => e.result === 'apto').length,
        inapto: allExams.filter(e => e.result === 'inapto').length,
        aptoComRestricoes: allExams.filter(e => e.result === 'apto_com_restricoes').length,
        expiringIn30Days: allExams.filter(e => {
          if (!e.expiryDate) return false;
          const expiry = new Date(e.expiryDate);
          return expiry >= today && expiry <= futureDate;
        }).length,
        expired: allExams.filter(e => {
          if (!e.expiryDate) return false;
          return new Date(e.expiryDate) < today;
        }).length,
      };

      return stats;
    }),
});
