import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { pirTrainings, pirTrainingParticipants, employees } from '../../drizzle/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Router para gestão de Treinamentos PIR
 * Gerencia treinamentos, participantes e certificados
 */
export const pirTrainingsRouter = router({
  /**
   * Listar todos os treinamentos
   */
  list: protectedProcedure
    .input(
      z.object({
        programId: z.number().optional(),
        upcoming: z.boolean().optional(), // Apenas futuros
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = [];
      
      if (input?.programId) {
        conditions.push(eq(pirTrainings.programId, input.programId));
      }

      if (input?.upcoming) {
        conditions.push(gte(pirTrainings.trainingDate, new Date()));
      }

      const trainings = await db
        .select({
          id: pirTrainings.id,
          programId: pirTrainings.programId,
          title: pirTrainings.title,
          description: pirTrainings.description,
          trainingDate: pirTrainings.trainingDate,
          duration: pirTrainings.duration,
          location: pirTrainings.location,
          instructorName: pirTrainings.instructorName,
          maxParticipants: pirTrainings.maxParticipants,
          participantCount: sql<number>`(SELECT COUNT(*) FROM ${pirTrainingParticipants} WHERE ${pirTrainingParticipants.trainingId} = ${pirTrainings.id})`,
          createdAt: pirTrainings.createdAt,
        })
        .from(pirTrainings)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pirTrainings.trainingDate));

      return trainings;
    }),

  /**
   * Buscar treinamento por ID com participantes
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const training = await db
        .select()
        .from(pirTrainings)
        .where(eq(pirTrainings.id, input.id))
        .limit(1);

      if (training.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Treinamento não encontrado' });
      }

      // Buscar participantes
      const participants = await db
        .select({
          id: pirTrainingParticipants.id,
          employeeId: pirTrainingParticipants.employeeId,
          employeeName: employees.name,
          enrollmentDate: pirTrainingParticipants.enrollmentDate,
          attended: pirTrainingParticipants.attended,
          certificateIssued: pirTrainingParticipants.certificateIssued,
          certificateUrl: pirTrainingParticipants.certificateUrl,
          notes: pirTrainingParticipants.notes,
        })
        .from(pirTrainingParticipants)
        .leftJoin(employees, eq(pirTrainingParticipants.employeeId, employees.id))
        .where(eq(pirTrainingParticipants.trainingId, input.id));

      return {
        ...training[0],
        participants
      };
    }),

  /**
   * Criar novo treinamento
   */
  create: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
        description: z.string().optional(),
        trainingDate: z.date(),
        duration: z.number().min(1, 'Duração deve ser no mínimo 1 hora'),
        location: z.string(),
        instructorName: z.string(),
        instructorId: z.number().optional(),
        maxParticipants: z.number().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db.insert(pirTrainings).values({
        programId: input.programId,
        title: input.title,
        description: input.description,
        trainingDate: input.trainingDate,
        duration: input.duration,
        location: input.location,
        instructorName: input.instructorName,
        instructorId: input.instructorId,
        maxParticipants: input.maxParticipants,
        content: input.content,
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Treinamento criado com sucesso'
      };
    }),

  /**
   * Atualizar treinamento
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).optional(),
        description: z.string().optional(),
        trainingDate: z.date().optional(),
        duration: z.number().min(1).optional(),
        location: z.string().optional(),
        instructorName: z.string().optional(),
        maxParticipants: z.number().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const { id, ...updateData } = input;

      // Verificar se treinamento existe
      const existing = await db.select().from(pirTrainings).where(eq(pirTrainings.id, id)).limit(1);
      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Treinamento não encontrado' });
      }

      await db.update(pirTrainings).set(updateData).where(eq(pirTrainings.id, id));

      return {
        success: true,
        message: 'Treinamento atualizado com sucesso'
      };
    }),

  /**
   * Inscrever participante em treinamento
   */
  enrollParticipant: protectedProcedure
    .input(
      z.object({
        trainingId: z.number(),
        employeeId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verificar se treinamento existe e tem vagas
      const training = await db.select().from(pirTrainings).where(eq(pirTrainings.id, input.trainingId)).limit(1);
      if (training.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Treinamento não encontrado' });
      }

      // Contar participantes atuais
      const currentParticipants = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pirTrainingParticipants)
        .where(eq(pirTrainingParticipants.trainingId, input.trainingId));

      if (training[0].maxParticipants && currentParticipants[0].count >= training[0].maxParticipants) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Treinamento está com vagas esgotadas' });
      }

      // Verificar se já está inscrito
      const existing = await db
        .select()
        .from(pirTrainingParticipants)
        .where(
          and(
            eq(pirTrainingParticipants.trainingId, input.trainingId),
            eq(pirTrainingParticipants.employeeId, input.employeeId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Funcionário já está inscrito neste treinamento' });
      }

      const result = await db.insert(pirTrainingParticipants).values({
        trainingId: input.trainingId,
        employeeId: input.employeeId,
        enrollmentDate: new Date(),
        attended: false,
        certificateIssued: false,
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Inscrição realizada com sucesso'
      };
    }),

  /**
   * Registrar presença de participante
   */
  markAttendance: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        attended: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db
        .update(pirTrainingParticipants)
        .set({
          attended: input.attended,
          notes: input.notes,
        })
        .where(eq(pirTrainingParticipants.id, input.participantId));

      return {
        success: true,
        message: 'Presença registrada com sucesso'
      };
    }),

  /**
   * Emitir certificado para participante
   */
  issueCertificate: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Buscar dados do participante e treinamento
      const participant = await db
        .select({
          participant: pirTrainingParticipants,
          training: pirTrainings,
          employee: employees,
        })
        .from(pirTrainingParticipants)
        .leftJoin(pirTrainings, eq(pirTrainingParticipants.trainingId, pirTrainings.id))
        .leftJoin(employees, eq(pirTrainingParticipants.employeeId, employees.id))
        .where(eq(pirTrainingParticipants.id, input.participantId))
        .limit(1);

      if (participant.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Participante não encontrado' });
      }

      if (!participant[0].participant.attended) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Certificado só pode ser emitido para participantes que compareceram' });
      }

      // Gerar URL do certificado (implementar geração real depois)
      const certificateUrl = `/certificates/pir-training-${input.participantId}.pdf`;

      // Atualizar participante com certificado
      await db
        .update(pirTrainingParticipants)
        .set({
          certificateIssued: true,
          certificateUrl,
        })
        .where(eq(pirTrainingParticipants.id, input.participantId));

      return {
        success: true,
        certificateUrl,
        message: 'Certificado emitido com sucesso'
      };
    }),

  /**
   * Listar treinamentos de um funcionário
   */
  listByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const trainings = await db
        .select({
          participantId: pirTrainingParticipants.id,
          trainingId: pirTrainings.id,
          title: pirTrainings.title,
          trainingDate: pirTrainings.trainingDate,
          duration: pirTrainings.duration,
          location: pirTrainings.location,
          instructorName: pirTrainings.instructorName,
          attended: pirTrainingParticipants.attended,
          certificateIssued: pirTrainingParticipants.certificateIssued,
          certificateUrl: pirTrainingParticipants.certificateUrl,
        })
        .from(pirTrainingParticipants)
        .leftJoin(pirTrainings, eq(pirTrainingParticipants.trainingId, pirTrainings.id))
        .where(eq(pirTrainingParticipants.employeeId, input.employeeId))
        .orderBy(desc(pirTrainings.trainingDate));

      return trainings;
    }),
});
