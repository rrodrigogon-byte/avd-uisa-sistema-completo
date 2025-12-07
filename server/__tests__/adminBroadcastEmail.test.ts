import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmailToAllAdmins, createAdminBroadcastTemplate, createAdminBroadcastTextTemplate } from "../adminBroadcastEmailService";

// Mock do módulo de database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock do serviço de email
vi.mock("../emailService", () => ({
  sendEmail: vi.fn(),
}));

describe("Admin Broadcast Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAdminBroadcastTemplate", () => {
    it("deve criar template HTML com título e mensagem", () => {
      const template = createAdminBroadcastTemplate({
        title: "Teste de Email",
        message: "Esta é uma mensagem de teste",
      });

      expect(template).toContain("Teste de Email");
      expect(template).toContain("Esta é uma mensagem de teste");
      expect(template).toContain("ADMINISTRADOR");
      expect(template).toContain("{name}"); // Placeholder para nome
    });

    it("deve incluir botão de ação quando fornecido", () => {
      const template = createAdminBroadcastTemplate({
        title: "Teste",
        message: "Mensagem",
        actionUrl: "https://example.com",
        actionText: "Clique Aqui",
      });

      expect(template).toContain("https://example.com");
      expect(template).toContain("Clique Aqui");
      expect(template).toContain("action-button");
    });

    it("não deve incluir botão quando URL ou texto não fornecidos", () => {
      const template = createAdminBroadcastTemplate({
        title: "Teste",
        message: "Mensagem",
      });

      // Verificar que não há elemento <a> com a classe action-button
      expect(template).not.toContain('<a href=');
      expect(template).not.toContain('Clique');
    });

    it("deve incluir ano atual no footer", () => {
      const template = createAdminBroadcastTemplate({
        title: "Teste",
        message: "Mensagem",
      });

      const currentYear = new Date().getFullYear();
      expect(template).toContain(currentYear.toString());
    });
  });

  describe("createAdminBroadcastTextTemplate", () => {
    it("deve criar template de texto com título e mensagem", () => {
      const template = createAdminBroadcastTextTemplate({
        title: "Teste de Email",
        message: "Esta é uma mensagem de teste",
      });

      expect(template).toContain("Teste de Email");
      expect(template).toContain("Esta é uma mensagem de teste");
      expect(template).toContain("{name}"); // Placeholder para nome
    });

    it("deve incluir URL quando fornecida", () => {
      const template = createAdminBroadcastTextTemplate({
        title: "Teste",
        message: "Mensagem",
        actionUrl: "https://example.com",
      });

      expect(template).toContain("https://example.com");
      expect(template).toContain("Acesse:");
    });

    it("não deve incluir seção de URL quando não fornecida", () => {
      const template = createAdminBroadcastTextTemplate({
        title: "Teste",
        message: "Mensagem",
      });

      expect(template).not.toContain("Acesse:");
    });
  });

  describe("sendEmailToAllAdmins", () => {
    it("deve retornar erro quando database não disponível", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockResolvedValue(null);

      await expect(
        sendEmailToAllAdmins({
          subject: "Teste",
          htmlContent: "<p>Teste</p>",
        })
      ).rejects.toThrow("Database not available");
    });

    it("deve retornar erro quando não há admins com email", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Teste</p>",
      });

      expect(result.success).toBe(false);
      expect(result.totalAdmins).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error).toContain("Nenhum administrador");
    });

    it("deve enviar emails para todos os admins com sucesso", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: "Admin 1", email: "admin1@test.com" },
        { id: 2, name: "Admin 2", email: "admin2@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue(undefined);

      const result = await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Olá, {name}!</p>",
        textContent: "Olá, {name}!",
      });

      expect(result.success).toBe(true);
      expect(result.totalAdmins).toBe(2);
      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it("deve personalizar nome do admin no conteúdo", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: "João Silva", email: "joao@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue(undefined);

      await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Olá, {name}!</p>",
        textContent: "Olá, {name}!",
      });

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "joao@test.com",
          html: "<p>Olá, João Silva!</p>",
          text: "Olá, João Silva!",
        })
      );
    });

    it("deve usar 'Administrador' quando nome não disponível", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: null, email: "admin@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue(undefined);

      await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Olá, {name}!</p>",
      });

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: "<p>Olá, Administrador!</p>",
        })
      );
    });

    it("deve registrar falhas e continuar enviando para outros admins", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: "Admin 1", email: "admin1@test.com" },
        { id: 2, name: "Admin 2", email: "admin2@test.com" },
        { id: 3, name: "Admin 3", email: "admin3@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      
      // Simular falha no segundo email
      vi.mocked(sendEmail)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("SMTP error"))
        .mockResolvedValueOnce(undefined);

      const result = await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Teste</p>",
      });

      expect(result.success).toBe(true); // Ainda é sucesso se pelo menos um foi enviado
      expect(result.totalAdmins).toBe(3);
      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].email).toBe("admin2@test.com");
      expect(result.errors[0].error).toContain("SMTP error");
    });

    it("deve retornar success=false quando todos os envios falharem", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: "Admin 1", email: "admin1@test.com" },
        { id: 2, name: "Admin 2", email: "admin2@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockRejectedValue(new Error("SMTP error"));

      const result = await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Teste</p>",
      });

      expect(result.success).toBe(false);
      expect(result.sentCount).toBe(0);
      expect(result.failedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it("deve filtrar admins sem email", async () => {
      const { getDb } = await import("../db");
      const { sendEmail } = await import("../emailService");
      
      const mockAdmins = [
        { id: 1, name: "Admin 1", email: "admin1@test.com" },
        { id: 2, name: "Admin 2", email: null },
        { id: 3, name: "Admin 3", email: "" },
        { id: 4, name: "Admin 4", email: "admin4@test.com" },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue(undefined);

      const result = await sendEmailToAllAdmins({
        subject: "Teste",
        htmlContent: "<p>Teste</p>",
      });

      expect(result.totalAdmins).toBe(2); // Apenas 2 com email válido
      expect(result.sentCount).toBe(2);
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });
  });
});
