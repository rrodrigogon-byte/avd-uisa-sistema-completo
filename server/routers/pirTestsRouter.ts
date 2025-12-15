import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { pirFitTests, pirEquipment, employees, pirVideoRecordings } from '../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { storagePut } from '../storage';

/**
 * Router para gestão de Testes PIR com Gravação de Vídeo
 * Gerencia testes qualitativos/quantitativos e gravações
 */
export const pirTestsRouter = router({
  /**
   * Listar testes de um participante
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

      const conditions = [eq(pirFitTests.employeeId, input.employeeId)];
      
      if (input.programId) {
        conditions.push(eq(pirFitTests.programId, input.programId));
      }

      const tests = await db
        .select({
          id: pirFitTests.id,
          testDate: pirFitTests.testDate,
          testType: pirFitTests.testType,
          result: pirFitTests.result,
          fitFactor: pirFitTests.fitFactor,
          passed: pirFitTests.passed,
          equipmentId: pirFitTests.equipmentId,
          videoUrl: pirFitTests.videoUrl,
          certificateUrl: pirFitTests.certificateUrl,
          certificateExpiry: pirFitTests.certificateExpiry,
          testerName: pirFitTests.testerName,
        })
        .from(pirFitTests)
        .where(and(...conditions))
        .orderBy(desc(pirFitTests.testDate));

      return tests;
    }),

  /**
   * Buscar teste por ID com detalhes
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const test = await db
        .select({
          test: pirFitTests,
          employee: employees,
          equipment: pirEquipment,
        })
        .from(pirFitTests)
        .leftJoin(employees, eq(pirFitTests.employeeId, employees.id))
        .leftJoin(pirEquipment, eq(pirFitTests.equipmentId, pirEquipment.id))
        .where(eq(pirFitTests.id, input.id))
        .limit(1);

      if (test.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Teste não encontrado' });
      }

      return test[0];
    }),

  /**
   * Criar novo teste
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        programId: z.number(),
        testDate: z.date(),
        testType: z.enum(['qualitative', 'quantitative']),
        equipmentId: z.number(),
        result: z.enum(['pass', 'fail']),
        fitFactor: z.number().optional(),
        passed: z.boolean(),
        exercisesData: z.string().optional(), // JSON string
        testNotes: z.string().optional(),
        testerName: z.string(),
        testerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db.insert(pirFitTests).values({
        employeeId: input.employeeId,
        programId: input.programId,
        testDate: input.testDate,
        testType: input.testType,
        equipmentId: input.equipmentId,
        result: input.result,
        fitFactor: input.fitFactor,
        passed: input.passed,
        exercisesData: input.exercisesData,
        testNotes: input.testNotes,
        testerName: input.testerName,
        testerId: input.testerId,
      });

      return {
        id: Number(result.insertId),
        success: true,
        message: 'Teste criado com sucesso'
      };
    }),

  /**
   * Upload de vídeo do teste
   */
  uploadVideo: protectedProcedure
    .input(
      z.object({
        testId: z.number(),
        videoData: z.string(), // Base64 ou URL temporária
        fileName: z.string(),
        duration: z.number(), // em segundos
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verificar se teste existe
      const test = await db.select().from(pirFitTests).where(eq(pirFitTests.id, input.testId)).limit(1);
      if (test.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Teste não encontrado' });
      }

      // Gerar chave única para o vídeo no S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const videoKey = `pir-tests/${input.testId}/${timestamp}-${randomSuffix}-${input.fileName}`;

      // Upload para S3
      const videoBuffer = Buffer.from(input.videoData, 'base64');
      const { url: videoUrl } = await storagePut(videoKey, videoBuffer, 'video/webm');

      // Atualizar teste com URL do vídeo
      await db
        .update(pirFitTests)
        .set({
          videoUrl,
          videoS3Key: videoKey,
          videoDuration: input.duration,
        })
        .where(eq(pirFitTests.id, input.testId));

      return {
        success: true,
        videoUrl,
        message: 'Vídeo enviado com sucesso'
      };
    }),

  /**
   * Atualizar resultado do teste
   */
  updateResult: protectedProcedure
    .input(
      z.object({
        testId: z.number(),
        result: z.enum(['pass', 'fail']),
        fitFactor: z.number().optional(),
        passed: z.boolean(),
        testNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const { testId, ...updateData } = input;

      await db.update(pirFitTests).set(updateData).where(eq(pirFitTests.id, testId));

      return {
        success: true,
        message: 'Resultado atualizado com sucesso'
      };
    }),

  /**
   * Gerar certificado de teste
   */
  generateCertificate: protectedProcedure
    .input(
      z.object({
        testId: z.number(),
        validityMonths: z.number().default(12),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Buscar dados do teste
      const test = await db
        .select({
          test: pirFitTests,
          employee: employees,
          equipment: pirEquipment,
        })
        .from(pirFitTests)
        .leftJoin(employees, eq(pirFitTests.employeeId, employees.id))
        .leftJoin(pirEquipment, eq(pirFitTests.equipmentId, pirEquipment.id))
        .where(eq(pirFitTests.id, input.testId))
        .limit(1);

      if (test.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Teste não encontrado' });
      }

      if (!test[0].test.passed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Certificado só pode ser gerado para testes aprovados' });
      }

      // Calcular data de expiração
      const expiryDate = new Date(test[0].test.testDate);
      expiryDate.setMonth(expiryDate.getMonth() + input.validityMonths);

      // Gerar URL do certificado (implementar geração real depois)
      const certificateUrl = `/certificates/pir-fit-test-${input.testId}.pdf`;

      // Atualizar teste com certificado
      await db
        .update(pirFitTests)
        .set({
          certificateUrl,
          certificateExpiry: expiryDate,
        })
        .where(eq(pirFitTests.id, input.testId));

      return {
        success: true,
        certificateUrl,
        expiryDate,
        message: 'Certificado gerado com sucesso'
      };
    }),

  /**
   * Listar testes que estão próximos do vencimento
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

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysBeforeExpiry);

      const conditions = [
        eq(pirFitTests.passed, true),
      ];

      if (input.programId) {
        conditions.push(eq(pirFitTests.programId, input.programId));
      }

      const expiringTests = await db
        .select({
          id: pirFitTests.id,
          employeeId: pirFitTests.employeeId,
          employeeName: employees.name,
          testDate: pirFitTests.testDate,
          certificateExpiry: pirFitTests.certificateExpiry,
          equipmentId: pirFitTests.equipmentId,
        })
        .from(pirFitTests)
        .leftJoin(employees, eq(pirFitTests.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(pirFitTests.certificateExpiry);

      // Filtrar por data de expiração
      const filtered = expiringTests.filter(test => {
        if (!test.certificateExpiry) return false;
        const expiry = new Date(test.certificateExpiry);
        return expiry <= futureDate && expiry >= new Date();
      });

      return filtered;
    }),
});
