import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { avdVideoRecordings } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq, and, desc } from "drizzle-orm";

export const videoUploadRouter = router({
  /**
   * Upload de vídeo para S3
   */
  upload: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      stepNumber: z.number().min(1).max(5),
      videoData: z.string(), // Base64 encoded video
      mimeType: z.string().default("video/webm"),
      durationSeconds: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validar tamanho do vídeo (máximo 100MB)
      const base64Data = input.videoData.replace(/^data:video\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileSizeBytes = buffer.length;
      const maxSize = 100 * 1024 * 1024; // 100MB

      if (fileSizeBytes > maxSize) {
        throw new Error("Vídeo excede o tamanho máximo de 100MB");
      }

      // Gerar chave única para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = input.mimeType === "video/mp4" ? "mp4" : "webm";
      const fileKey = `avd-videos/${input.employeeId}/avd-video-${input.processId}-step${input.stepNumber}-${timestamp}-${randomSuffix}.${extension}`;

      // Criar registro inicial
      const result = await db.insert(avdVideoRecordings).values({
        processId: input.processId,
        employeeId: input.employeeId,
        stepNumber: input.stepNumber,
        fileKey,
        fileUrl: "",
        mimeType: input.mimeType,
        fileSizeBytes,
        durationSeconds: input.durationSeconds,
        status: "uploading",
      });
      const recordingId = Number(result[0].insertId);

      try {
        // Upload para S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Atualizar registro com URL
        await db.update(avdVideoRecordings)
          .set({
            fileUrl: url,
            status: "completed",
          })
          .where(eq(avdVideoRecordings.id, recordingId));

        return {
          success: true,
          recordingId,
          fileUrl: url,
          fileKey,
          fileSizeBytes,
        };
      } catch (error) {
        // Marcar como falha
        await db.update(avdVideoRecordings)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          })
          .where(eq(avdVideoRecordings.id, recordingId));

        throw new Error("Falha ao fazer upload do vídeo: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      }
    }),

  /**
   * Listar vídeos de um processo
   */
  listByProcess: protectedProcedure
    .input(z.object({
      processId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const recordings = await db.select()
        .from(avdVideoRecordings)
        .where(and(
          eq(avdVideoRecordings.processId, input.processId),
          eq(avdVideoRecordings.status, "completed")
        ))
        .orderBy(desc(avdVideoRecordings.createdAt));

      return recordings;
    }),

  /**
   * Listar vídeos de um funcionário
   */
  listByEmployee: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const recordings = await db.select()
        .from(avdVideoRecordings)
        .where(and(
          eq(avdVideoRecordings.employeeId, input.employeeId),
          eq(avdVideoRecordings.status, "completed")
        ))
        .orderBy(desc(avdVideoRecordings.createdAt));

      return recordings;
    }),

  /**
   * Obter detalhes de um vídeo
   */
  getById: protectedProcedure
    .input(z.object({
      recordingId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [recording] = await db.select()
        .from(avdVideoRecordings)
        .where(eq(avdVideoRecordings.id, input.recordingId))
        .limit(1);

      return recording || null;
    }),

  /**
   * Deletar um vídeo
   */
  delete: protectedProcedure
    .input(z.object({
      recordingId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Marcar como arquivado (soft delete)
      await db.update(avdVideoRecordings)
        .set({ status: "failed", errorMessage: "Deletado pelo usuário" })
        .where(eq(avdVideoRecordings.id, input.recordingId));

      return { success: true };
    }),
});
