import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { pirPrograms, pirParticipants, employees } from '../../drizzle/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Router para gestão de Programas de Integridade Respiratória (PIR)
 * Gerencia programas, participantes e configurações
 */
export const pirProgramsRouter = router({
  /**
   * Listar todos os programas PIR
   */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = [];
      
      if (input?.search) {
        conditions.push(like(pirPrograms.name, `%${input.search}%`));
      }
      
      if (input?.active !== undefined) {
        conditions.push(eq(pirPrograms.active, input.active));
      }

      const programs = await db
        .select({
          id: pirPrograms.id,
          name: pirPrograms.name,
          description: pirPrograms.description,
          startDate: pirPrograms.startDate,
          endDate: pirPrograms.endDate,
          coordinatorId: pirPrograms.coordinatorId,
          testFrequencyMonths: pirPrograms.testFrequencyMonths,
          active: pirPrograms.active,
          createdAt: pirPrograms.createdAt,
          participantCount: sql<number>`(SELECT COUNT(*) FROM ${pirParticipants} WHERE ${pirParticipants.programId} = ${pirPrograms.id})`
        })
        .from(pirPrograms)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pirPrograms.createdAt));

      return programs;
    }),

  /**
   * Buscar programa por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const program = await db
        .select()
        .from(pirPrograms)
        .where(eq(pirPrograms.id, input.id))
        .limit(1);

      if (program.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programa não encontrado' });
      }

      // Buscar participantes do programa
      const participants = await db
        .select({
          id: pirParticipants.id,
          employeeId: pirParticipants.employeeId,
          employeeName: employees.name,
          enrollmentDate: pirParticipants.enrollmentDate,
          status: pirParticipants.status,
          medicalExamStatus: pirParticipants.medicalExamStatus,
          trainingStatus: pirParticipants.trainingStatus,
        })
        .from(pirParticipants)
        .leftJoin(employees, eq(pirParticipants.employeeId, employees.id))
        .where(eq(pirParticipants.programId, input.id));

      return {
        ...program[0],
        participants
      };
    }),

  /**
   * Criar novo programa PIR
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        coordinatorId: z.number().optional(),
        testFrequencyMonths: z.number().min(1).default(12),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Validar datas
      if (input.endDate && input.endDate < input.startDate) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Data de término deve ser posterior à data de início' });
      }

      const result = await db.insert(pirPrograms).values({
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        coordinatorId: input.coordinatorId,
        testFrequencyMonths: input.testFrequencyMonths,
        active: true,
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Programa criado com sucesso'
      };
    }),

  /**
   * Atualizar programa PIR
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        coordinatorId: z.number().optional(),
        testFrequencyMonths: z.number().min(1).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const { id, ...updateData } = input;

      // Validar se programa existe
      const existing = await db.select().from(pirPrograms).where(eq(pirPrograms.id, id)).limit(1);
      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programa não encontrado' });
      }

      await db.update(pirPrograms).set(updateData).where(eq(pirPrograms.id, id));

      return {
        success: true,
        message: 'Programa atualizado com sucesso'
      };
    }),

  /**
   * Adicionar participante ao programa
   */
  addParticipant: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        employeeId: z.number(),
        enrollmentDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verificar se já está cadastrado
      const existing = await db
        .select()
        .from(pirParticipants)
        .where(
          and(
            eq(pirParticipants.programId, input.programId),
            eq(pirParticipants.employeeId, input.employeeId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Funcionário já está cadastrado neste programa' });
      }

      const result = await db.insert(pirParticipants).values({
        programId: input.programId,
        employeeId: input.employeeId,
        enrollmentDate: input.enrollmentDate || new Date(),
        status: 'active',
        medicalExamStatus: 'pending',
        trainingStatus: 'pending',
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Participante adicionado com sucesso'
      };
    }),

  /**
   * Remover participante do programa
   */
  removeParticipant: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db.update(pirParticipants).set({ status: 'inactive' }).where(eq(pirParticipants.id, input.participantId));

      return {
        success: true,
        message: 'Participante removido do programa'
      };
    }),

  /**
   * Atualizar status de exame médico do participante
   */
  updateMedicalExamStatus: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        status: z.enum(['pending', 'approved', 'rejected', 'expired']),
        expiryDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db
        .update(pirParticipants)
        .set({
          medicalExamStatus: input.status,
          medicalExamExpiry: input.expiryDate,
        })
        .where(eq(pirParticipants.id, input.participantId));

      return {
        success: true,
        message: 'Status de exame médico atualizado'
      };
    }),

  /**
   * Atualizar status de treinamento do participante
   */
  updateTrainingStatus: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        status: z.enum(['pending', 'completed', 'expired']),
        trainingDate: z.date().optional(),
        expiryDate: z.date().optional(),
        certificateUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db
        .update(pirParticipants)
        .set({
          trainingStatus: input.status,
          trainingDate: input.trainingDate,
          trainingExpiry: input.expiryDate,
          trainingCertificate: input.certificateUrl,
        })
        .where(eq(pirParticipants.id, input.participantId));

      return {
        success: true,
        message: 'Status de treinamento atualizado'
      };
    }),
});
