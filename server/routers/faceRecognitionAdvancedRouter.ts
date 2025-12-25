/**
 * Face Recognition Advanced Router
 * Procedures tRPC para reconhecimento facial com GCP Vision API
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import * as gcpVision from "../gcpVision";
import { storagePut } from "../storage";

export const faceRecognitionAdvancedRouter = router({
  /**
   * Registrar embedding facial de funcionário
   */
  registerFace: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        photoUrl: z.string().url(),
        secondaryPhotoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar foto principal
      const validation = await gcpVision.validatePhotoForRegistration(input.photoUrl);
      
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Foto inválida para cadastro",
        });
      }
      
      // Detectar face e extrair descritor
      const detection = await gcpVision.detectFaces(input.photoUrl);
      if (!detection.success || detection.facesDetected === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível detectar face na foto",
        });
      }
      
      const faceDescriptor = gcpVision.extractFaceDescriptor(detection.faces[0]);
      const qualityAssessment = gcpVision.assessPhotoQuality(detection.faces[0]);
      
      // Salvar embedding no banco
      const embeddingId = await db.upsertFaceEmbedding({
        employeeId: input.employeeId,
        gcpFaceDescriptor: JSON.stringify(faceDescriptor),
        gcpFaceId: `gcp_${input.employeeId}_${Date.now()}`,
        primaryPhotoUrl: input.photoUrl,
        secondaryPhotoUrl: input.secondaryPhotoUrl,
        faceQualityScore: qualityAssessment.score,
        lightingQuality: qualityAssessment.quality,
        faceAngle: "frontal",
        registeredBy: ctx.user.id,
        active: true,
      });
      
      // Registrar no histórico
      await db.createFaceValidation({
        employeeId: input.employeeId,
        validationPhotoUrl: input.photoUrl,
        matchScore: 100,
        matchResult: "sucesso",
        gcpResponseData: JSON.stringify(detection.faces[0]),
        facesDetected: 1,
        primaryFaceConfidence: Math.round(detection.faces[0].detectionConfidence * 100),
        validationType: "cadastro_inicial",
        approved: true,
      });
      
      return {
        success: true,
        embeddingId,
        quality: qualityAssessment,
      };
    }),

  /**
   * Validar identidade facial durante avaliação PIR
   */
  validateFaceForPIR: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        pirAssessmentId: z.number(),
        validationPhotoUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar embedding cadastrado
      const embedding = await db.getFaceEmbedding(input.employeeId);
      
      if (!embedding) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não possui cadastro facial",
        });
      }
      
      if (!embedding.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cadastro facial desativado",
        });
      }
      
      // Parsear descritor cadastrado
      const registeredDescriptor = JSON.parse(embedding.gcpFaceDescriptor);
      
      // Validar match
      const matchResult = await gcpVision.validateFaceMatch(
        input.validationPhotoUrl,
        registeredDescriptor,
        75 // threshold de 75%
      );
      
      if (matchResult.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: matchResult.error,
        });
      }
      
      // Registrar validação no histórico
      await db.createFaceValidation({
        employeeId: input.employeeId,
        pirAssessmentId: input.pirAssessmentId,
        validationPhotoUrl: input.validationPhotoUrl,
        matchScore: matchResult.matchScore,
        matchResult: matchResult.match ? "sucesso" : "falha",
        gcpResponseData: JSON.stringify(matchResult.details),
        facesDetected: 1,
        primaryFaceConfidence: matchResult.confidence,
        validationType: "avaliacao_pir",
        approved: matchResult.match,
        rejectionReason: matchResult.match ? undefined : "Score de similaridade abaixo do threshold",
      });
      
      return {
        match: matchResult.match,
        matchScore: matchResult.matchScore,
        confidence: matchResult.confidence,
        message: matchResult.match 
          ? "Identidade validada com sucesso" 
          : "Identidade não correspondente",
      };
    }),

  /**
   * Buscar histórico de validações de um funcionário
   */
  getValidationHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const history = await db.getFaceValidationHistory(input.employeeId, input.limit);
      
      return history.map(h => ({
        id: h.id,
        validatedAt: h.validatedAt,
        matchScore: h.matchScore,
        matchResult: h.matchResult,
        validationType: h.validationType,
        approved: h.approved,
        confidence: h.primaryFaceConfidence,
        pirAssessmentId: h.pirAssessmentId,
      }));
    }),

  /**
   * Buscar embedding facial de funcionário
   */
  getFaceEmbedding: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const embedding = await db.getFaceEmbedding(input.employeeId);
      
      if (!embedding) {
        return null;
      }
      
      return {
        id: embedding.id,
        employeeId: embedding.employeeId,
        primaryPhotoUrl: embedding.primaryPhotoUrl,
        secondaryPhotoUrl: embedding.secondaryPhotoUrl,
        qualityScore: embedding.faceQualityScore,
        lightingQuality: embedding.lightingQuality,
        registeredAt: embedding.registeredAt,
        lastValidatedAt: embedding.lastValidatedAt,
        validationCount: embedding.validationCount,
        active: embedding.active,
      };
    }),

  /**
   * Atualizar foto facial de funcionário
   */
  updateFacePhoto: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        photoUrl: z.string().url(),
        photoType: z.enum(["primary", "secondary"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar nova foto
      const validation = await gcpVision.validatePhotoForRegistration(input.photoUrl);
      
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Foto inválida",
        });
      }
      
      // Detectar face e extrair descritor
      const detection = await gcpVision.detectFaces(input.photoUrl);
      if (!detection.success || detection.facesDetected === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível detectar face na foto",
        });
      }
      
      const faceDescriptor = gcpVision.extractFaceDescriptor(detection.faces[0]);
      const qualityAssessment = gcpVision.assessPhotoQuality(detection.faces[0]);
      
      // Atualizar embedding
      const updateData: any = {
        faceQualityScore: qualityAssessment.score,
        lightingQuality: qualityAssessment.quality,
      };
      
      if (input.photoType === "primary") {
        updateData.primaryPhotoUrl = input.photoUrl;
        updateData.gcpFaceDescriptor = JSON.stringify(faceDescriptor);
      } else {
        updateData.secondaryPhotoUrl = input.photoUrl;
      }
      
      await db.upsertFaceEmbedding({
        employeeId: input.employeeId,
        ...updateData,
        registeredBy: ctx.user.id,
      });
      
      // Registrar no histórico
      await db.createFaceValidation({
        employeeId: input.employeeId,
        validationPhotoUrl: input.photoUrl,
        matchScore: 100,
        matchResult: "sucesso",
        gcpResponseData: JSON.stringify(detection.faces[0]),
        facesDetected: 1,
        primaryFaceConfidence: Math.round(detection.faces[0].detectionConfidence * 100),
        validationType: "atualizacao_perfil",
        approved: true,
      });
      
      return {
        success: true,
        quality: qualityAssessment,
      };
    }),

  /**
   * Desativar cadastro facial
   */
  deactivateFaceEmbedding: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .mutation(async ({ input }) => {
      const embedding = await db.getFaceEmbedding(input.employeeId);
      
      if (!embedding) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cadastro facial não encontrado",
        });
      }
      
      await db.upsertFaceEmbedding({
        employeeId: input.employeeId,
        active: false,
      } as any);
      
      return { success: true };
    }),

  /**
   * Reativar cadastro facial
   */
  reactivateFaceEmbedding: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .mutation(async ({ input }) => {
      const embedding = await db.getFaceEmbedding(input.employeeId);
      
      if (!embedding) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cadastro facial não encontrado",
        });
      }
      
      await db.upsertFaceEmbedding({
        employeeId: input.employeeId,
        active: true,
      } as any);
      
      return { success: true };
    }),

  /**
   * Validar qualidade de foto antes de upload
   */
  validatePhotoQuality: protectedProcedure
    .input(z.object({ photoUrl: z.string().url() }))
    .query(async ({ input }) => {
      const validation = await gcpVision.validatePhotoForRegistration(input.photoUrl);
      
      return {
        valid: validation.valid,
        faceDetected: validation.faceDetected,
        multipleFaces: validation.multipleFaces,
        quality: validation.qualityAssessment,
        error: validation.error,
      };
    }),

  /**
   * Estatísticas de reconhecimento facial
   */
  getFaceRecognitionStats: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    // Total de funcionários com cadastro facial
    const totalWithFace = await database
      .select()
      .from(db.faceEmbeddings)
      .where(db.eq(db.faceEmbeddings.active, true));
    
    // Total de validações realizadas
    const totalValidations = await database
      .select()
      .from(db.faceValidationHistory);
    
    // Validações bem-sucedidas
    const successfulValidations = totalValidations.filter(v => v.approved);
    
    // Validações falhadas
    const failedValidations = totalValidations.filter(v => !v.approved);
    
    return {
      totalEmployeesWithFace: totalWithFace.length,
      totalValidations: totalValidations.length,
      successfulValidations: successfulValidations.length,
      failedValidations: failedValidations.length,
      successRate: totalValidations.length > 0 
        ? Math.round((successfulValidations.length / totalValidations.length) * 100) 
        : 0,
    };
  }),
});
