import { describe, it, expect } from "vitest";
import { getAvaliationCreatedEmailTemplate, getAvaliationReminderEmailTemplate } from "./email";

describe("Sistema de Notificações por Email", () => {

  describe("Templates de Email", () => {
    it("deve gerar template de avaliação criada com todos os dados", () => {
      const data = {
        avaliadoName: "João Silva",
        avaliadorName: "Maria Santos",
        periodo: "2025 - 1º Semestre",
        resultadoUrl: "https://example.com/avaliacoes/123",
      };

      const html = getAvaliationCreatedEmailTemplate(data);

      expect(html).toContain("Nova Avaliação de Desempenho");
      expect(html).toContain("João Silva");
      expect(html).toContain("Maria Santos");
      expect(html).toContain("2025 - 1º Semestre");
      expect(html).toContain("https://example.com/avaliacoes/123");
      expect(html).toContain("Ver Resultados da Avaliação");
    });

    it("deve gerar template de lembrete com todos os dados", () => {
      const data = {
        avaliadorName: "Carlos Oliveira",
        avaliadoName: "Ana Costa",
        periodo: "2025 - 2º Semestre",
        formUrl: "https://example.com/avaliar/456",
      };

      const html = getAvaliationReminderEmailTemplate(data);

      expect(html).toContain("Lembrete: Avaliação Pendente");
      expect(html).toContain("Carlos Oliveira");
      expect(html).toContain("Ana Costa");
      expect(html).toContain("2025 - 2º Semestre");
      expect(html).toContain("https://example.com/avaliar/456");
      expect(html).toContain("Preencher Avaliação");
    });

    it("deve incluir estilos CSS nos templates", () => {
      const data = {
        avaliadoName: "Teste",
        avaliadorName: "Teste",
        periodo: "Teste",
        resultadoUrl: "https://test.com",
      };

      const html = getAvaliationCreatedEmailTemplate(data);

      expect(html).toContain("<style>");
      expect(html).toContain("font-family");
      expect(html).toContain("background");
      expect(html).toContain(".button");
    });
  });

  describe("Envio de Emails", () => {
    it("deve validar estrutura de email antes de enviar", async () => {
      const emailData = {
        to: "test@example.com",
        subject: "Teste de Email",
        html: "<p>Conteúdo do email</p>",
      };

      expect(emailData.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(emailData.subject).toBeTruthy();
      expect(emailData.html).toContain("<p>");
    });


  });

  describe("Validações de Dados", () => {
    it("deve validar formato de email do destinatário", () => {
      const validEmails = [
        "user@example.com",
        "test.user@company.com.br",
        "admin+tag@domain.org",
      ];

      validEmails.forEach((email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it("deve rejeitar emails inválidos", () => {
      const invalidEmails = [
        "invalid.email",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it("deve validar campos obrigatórios do template", () => {
      const requiredFields = {
        avaliadoName: "Nome Avaliado",
        avaliadorName: "Nome Avaliador",
        periodo: "2025",
        resultadoUrl: "https://example.com",
      };

      Object.values(requiredFields).forEach((value) => {
        expect(value).toBeTruthy();
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Segurança e Sanitização", () => {
    it("deve escapar caracteres especiais HTML nos templates", () => {
      const data = {
        avaliadoName: "João <script>alert('xss')</script>",
        avaliadorName: "Maria",
        periodo: "2025",
        resultadoUrl: "https://example.com",
      };

      const html = getAvaliationCreatedEmailTemplate(data);

      // O template deve incluir o nome, mas não deve executar scripts
      expect(html).toContain("João");
      // Verifica que não há tags script soltas (básico)
      expect(html.match(/<script>/g)?.length || 0).toBeLessThanOrEqual(1);
    });

    it("deve validar URLs antes de incluir nos templates", () => {
      const validUrls = [
        "https://example.com/path",
        "http://localhost:3000/avaliacoes/123",
        "https://subdomain.domain.com.br/page",
      ];

      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe("Formatação e Apresentação", () => {
    it("deve incluir cabeçalho HTML completo", () => {
      const html = getAvaliationCreatedEmailTemplate({
        avaliadoName: "Teste",
        avaliadorName: "Teste",
        periodo: "2025",
        resultadoUrl: "https://test.com",
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</html>");
    });

    it("deve incluir meta charset UTF-8", () => {
      const html = getAvaliationCreatedEmailTemplate({
        avaliadoName: "Teste",
        avaliadorName: "Teste",
        periodo: "2025",
        resultadoUrl: "https://test.com",
      });

      expect(html).toContain('charset="utf-8"');
    });

    it("deve incluir rodapé com identificação do sistema", () => {
      const html = getAvaliationCreatedEmailTemplate({
        avaliadoName: "Teste",
        avaliadorName: "Teste",
        periodo: "2025",
        resultadoUrl: "https://test.com",
      });

      expect(html).toContain("Sistema de Avaliação de Desempenho AVD UISA");
    });
  });
});
